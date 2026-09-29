/*
 * EPUB 3: container → OPF → spine. The structural checks catch what past bugs
 * broke (hundreds of empty chapters, undeclared or missing resources, local
 * file paths baked into the book); `deep` adds epubcheck for everything else.
 */
import * as path from 'node:path'
import { LOCAL_FIXTURE, Method } from '../fixtures/course'
import { checkRenderedMarkers, checkSectionTitles, findMarkers } from './markers'
import { firstZipEntry, openPackage, resolveRef } from './package'
import { epubcheck, epubcheckJar } from './tools'
import { CheckOptions, CheckResult, Problems } from './types'
import { attr, byName, parseHtml, parseXml, textOf, visibleText } from './xml'

const MIMETYPE = 'application/epub+zip'

export function checkEpub(source: string, options: CheckOptions = {}): CheckResult {
  const method: Method = options.method ?? 'cli'
  const fixture = options.fixture ?? LOCAL_FIXTURE
  const { course } = fixture
  const problems = new Problems()
  const summary: Record<string, unknown> = {}
  const result = (markers: string[] = []): CheckResult => ({
    format: 'epub',
    problems: problems.list,
    markers,
    summary,
  })

  const first = firstZipEntry(source)
  if (!first || first.name !== 'mimetype' || first.compression !== 0) {
    problems.add(
      'mimetype',
      'must be the first zip entry, stored uncompressed',
    )
  }

  const pkg = openPackage(source)

  if (!pkg.has('mimetype') || pkg.text('mimetype') !== MIMETYPE) {
    problems.add('mimetype', `content must be exactly "${MIMETYPE}"`)
  }

  // container.xml → the OPF
  if (!pkg.has('META-INF/container.xml')) {
    problems.add('container missing', 'META-INF/container.xml')
    return result()
  }

  const container = parseXml(pkg.text('META-INF/container.xml')).doc
  const rootfile = container && byName(container, 'rootfile')[0]
  const opfPath = rootfile ? attr(rootfile, 'full-path') : null

  if (!opfPath || !pkg.has(opfPath)) {
    problems.add('OPF missing', String(opfPath))
    return result()
  }

  const opfParsed = parseXml(pkg.text(opfPath))
  problems.many(`${opfPath} is not well-formed`, opfParsed.errors, 3)
  const opf = opfParsed.doc
  if (!opf) return result()

  // metadata
  const title = textOf(byName(opf, 'title')[0])
  const language = textOf(byName(opf, 'language')[0])
  const creator = textOf(byName(opf, 'creator')[0])
  if (title !== course.title) problems.add('wrong dc:title', `"${title}"`)
  if (language !== course.language) problems.add('wrong dc:language', `"${language}"`)
  if (creator !== course.author) problems.add('wrong dc:creator', `"${creator}"`)
  Object.assign(summary, { title, language, creator })

  // manifest: unique ids, every href exists, every file declared
  const manifest = byName(opf, 'manifest')[0]
  const items = manifest ? byName(manifest, 'item') : []
  const byId = new Map<string, string>()
  const duplicates: string[] = []

  for (const item of items) {
    const id = attr(item, 'id') ?? ''
    const href = resolveRef(opfPath, attr(item, 'href') ?? '') ?? ''
    if (byId.has(id)) duplicates.push(id)
    byId.set(id, href)
  }

  problems.many('duplicate manifest ids', [...new Set(duplicates)])
  problems.many(
    'manifest items missing from the book',
    [...new Set(byId.values())].filter((href) => !pkg.has(href)),
  )

  const declared = new Set(byId.values())
  problems.many(
    'files not declared in the manifest',
    pkg.files.filter(
      (file) =>
        file !== 'mimetype' &&
        !file.startsWith('META-INF/') &&
        file !== opfPath &&
        !declared.has(file),
    ),
  )

  // spine: every itemref resolves, one chapter per course section, none empty
  const spine = byName(opf, 'itemref').map((ref) => attr(ref, 'idref') ?? '')
  problems.many(
    'spine idrefs without a manifest item',
    spine.filter((id) => !byId.has(id)),
  )

  const navIds = new Set(
    items
      .filter((item) => /\bnav\b/.test(attr(item, 'properties') ?? ''))
      .map((item) => attr(item, 'id')),
  )

  const chapters = spine
    .filter((id) => byId.has(id) && id !== 'cover' && !navIds.has(id))
    .map((id) => byId.get(id)!)
    .filter((href) => pkg.has(href))

  summary.chapters = chapters.length
  if (chapters.length !== course.sections.length) {
    problems.add(
      'chapter count',
      `${chapters.length} chapters for ${course.sections.length} sections`,
    )
  }

  // chapter content
  const texts: string[] = []
  const raws: string[] = []
  const empty: string[] = []
  const brokenRefs = new Set<string>()
  const fileUrls = new Set<string>()
  const localPaths = new Set<string>()
  const dataText = new Set<string>()

  for (const chapter of chapters) {
    const raw = pkg.text(chapter)
    raws.push(raw)

    const parsed = parseXml(raw, 'application/xhtml+xml')
    problems.many(`${chapter} is not well-formed`, parsed.errors, 2)

    // markers are read even from a broken chapter, to report both problems
    const doc = parsed.errors.length ? parseHtml(raw) : parsed.doc!
    const body = byName(doc, 'body')[0] ?? doc
    const text = visibleText(body)
    texts.push(text)

    const heading = textOf(byName(body, 'h1')[0] ?? byName(body, 'h2')[0])
    if (text.replace(/\s+/g, ' ').trim().length <= heading.length + 5) {
      empty.push(chapter)
    }

    for (const match of raw.matchAll(/\s(?:src|href|poster|xlink:href)\s*=\s*["']([^"']+)["']/gi)) {
      const ref = match[1]
      // file: from the CLI, blob: from the web app; both dead outside
      if (/^(file|blob):/i.test(ref)) fileUrls.add(ref)

      const target = resolveRef(chapter, ref)
      if (target && !pkg.has(target)) brokenRefs.add(`${path.posix.basename(chapter)} → ${ref}`)
    }

    // an image link shown in a code block, inlined as base64 and printed
    if (/data:[a-z]+\/[a-z0-9.+-]+;base64,/i.test(text)) dataText.add(chapter)

    if (raw.includes(fixture.dir)) localPaths.add(chapter)
  }

  problems.many('empty chapters', empty)
  problems.many('file:/blob: URLs in the book', [...fileUrls])
  problems.many('local machine paths in the book', [...localPaths])
  problems.many('data: URI printed in chapters', [...dataText])
  problems.many('references to missing files', [...brokenRefs])

  if (options.deep) {
    const jar = epubcheckJar()

    if (!jar) {
      problems.add('deep check unavailable', 'epubcheck (run npm run test:setup) or java is missing')
    } else {
      const report = epubcheck(jar, source)
      summary.epubcheck = report.codes

      problems.many('epubcheck fatal', report.fatals, 5)
      if (report.errors.length) {
        const codes = Object.entries(report.codes)
          .sort((a, b) => b[1] - a[1])
          .map(([code, n]) => `${code}×${n}`)
        problems.add('epubcheck errors', `${report.errors.length} (${codes.join(', ')})`)
      }
    }
  }

  checkSectionTitles(problems, texts.join('\n'), fixture)

  const markers = findMarkers(texts.join('\n'))
  checkRenderedMarkers(problems, 'epub', method, markers, raws.join('\n'), texts.join('\n'), fixture)

  return result(markers)
}
