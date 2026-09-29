/*
 * Word (OOXML). The checks follow the relationship graph: document.xml points
 * at relationships, relationships point at parts. Past bugs left media nobody
 * referenced and leaked `blob:` URLs and base64 into the document.
 */
import { COURSE, COURSE_DIR, Method } from '../fixtures/course'
import { checkRenderedMarkers, checkSectionTitles, findMarkers } from './markers'
import { openPackage, resolveRef } from './package'
import { CheckOptions, CheckResult, Problems } from './types'
import { attr, byName, parseXml, textOf } from './xml'

const DOCUMENT = 'word/document.xml'
const RELS = 'word/_rels/document.xml.rels'

export function checkDocx(source: string, options: CheckOptions = {}): CheckResult {
  const method: Method = options.method ?? 'cli'
  const pkg = openPackage(source)
  const problems = new Problems()
  const summary: Record<string, unknown> = {}
  const result = (markers: string[] = []): CheckResult => ({
    format: 'docx',
    problems: problems.list,
    markers,
    summary,
  })

  for (const part of ['[Content_Types].xml', '_rels/.rels', DOCUMENT, RELS]) {
    if (!pkg.has(part)) problems.add('part missing', part)
  }
  if (!pkg.has(DOCUMENT) || !pkg.has(RELS)) return result()

  const parse = (part: string) => {
    const parsed = parseXml(pkg.text(part))
    problems.many(`${part} is not well-formed`, parsed.errors, 3)
    return parsed.errors.length ? null : parsed.doc
  }

  const rawDocument = pkg.text(DOCUMENT)
  const document = parse(DOCUMENT)
  const rels = parse(RELS)
  const types = pkg.has('[Content_Types].xml') ? parse('[Content_Types].xml') : null
  if (!document || !rels) return result()

  // relationships → parts
  const relTargets = new Map<string, string>()
  const missingTargets: string[] = []

  for (const rel of byName(rels, 'Relationship')) {
    const id = attr(rel, 'Id') ?? ''
    const target = attr(rel, 'Target') ?? ''
    if (attr(rel, 'TargetMode') === 'External') continue

    const part = resolveRef('word/document.xml', target) ?? target
    relTargets.set(id, part)
    if (!pkg.has(part)) missingTargets.push(`${id} → ${target}`)
  }

  problems.many('relationships to missing parts', missingTargets)

  // document → relationships
  const allRels = new Set(byName(rels, 'Relationship').map((r) => attr(r, 'Id')))
  const used = new Set<string>()

  for (const el of Array.from(document.getElementsByTagName('*'))) {
    for (const name of ['embed', 'link', 'id']) {
      const value = el.getAttribute(`r:${name}`)
      if (value) used.add(value)
    }
  }

  problems.many(
    'document references unknown relationships',
    [...used].filter((id) => !allRels.has(id)),
  )

  // media nobody points at
  const referenced = new Set(
    [...relTargets.entries()].filter(([id]) => used.has(id)).map(([, part]) => part),
  )
  const media = pkg.files.filter((file) => file.startsWith('word/media/'))
  problems.many(
    'orphaned media',
    media.filter((file) => !referenced.has(file)),
  )

  // every media type is declared
  if (types) {
    const defaults = new Set(
      byName(types, 'Default').map((d) => (attr(d, 'Extension') ?? '').toLowerCase()),
    )
    const overrides = new Set(
      byName(types, 'Override').map((o) => (attr(o, 'PartName') ?? '').replace(/^\//, '')),
    )
    problems.many(
      'media without a content type',
      media.filter(
        (file) =>
          !overrides.has(file) &&
          !defaults.has(file.split('.').pop()!.toLowerCase()),
      ),
    )
  }

  // leaks from the HTML the document was converted from
  const leaks = [
    ['blob: URL', /blob:/],
    ['data: URI', /data:[a-z]+\/[a-z0-9.+-]+;base64,/i],
    ['file: URL', /file:\/\//],
    ['local machine path', new RegExp(escapeRegExp(COURSE_DIR))],
  ] as const

  for (const part of [DOCUMENT, RELS]) {
    const text = pkg.text(part)
    for (const [label, pattern] of leaks) {
      if (pattern.test(text)) problems.add(`${label} in ${part}`, 'found')
    }
  }

  // text: runs joined within a paragraph (they carry their own spaces),
  // paragraphs and cells separated; alt text from the drawing properties
  const paragraphs = byName(document, 'p').map((p) =>
    byName(p, 't').map((t) => t.textContent ?? '').join(''),
  )
  // alt text sits on the drawing (docPr) and/or on the picture itself (cNvPr)
  const altTexts = [...byName(document, 'docPr'), ...byName(document, 'cNvPr')].flatMap((pr) =>
    [attr(pr, 'descr'), attr(pr, 'title')].filter((v): v is string => !!v),
  )

  const title = pkg.has('docProps/core.xml')
    ? textOf(byName(parseXml(pkg.text('docProps/core.xml')).doc!, 'title')[0])
    : null
  if (title !== COURSE.title) problems.add('wrong dc:title', `"${title}"`)

  Object.assign(summary, {
    paragraphs: paragraphs.length,
    tables: byName(document, 'tbl').length,
    images: byName(document, 'docPr').length,
    media: media.length,
    title,
  })

  checkSectionTitles(problems, paragraphs.join('\n'))

  const markers = findMarkers([...paragraphs, ...altTexts].join('\n'))
  checkRenderedMarkers(problems, 'docx', method, markers, rawDocument)

  return result(markers)
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
