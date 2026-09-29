/*
 * Packaged players: scorm1.2, scorm2004, ims, web and xapi. Each ships the
 * LiaScript player plus the course, so the checks are that the course and all
 * of its files made it in unchanged, that nothing hidden did, and that every
 * reference (manifest, entry page) points at a file of the package.
 *
 * Whether the player then renders the course needs a browser: see render.ts.
 */
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import {
  COURSE,
  COURSE_DIR,
  COURSE_README,
  courseAssets,
} from '../fixtures/course'
import { hiddenFiles, openPackage, Package, resolveRef } from './package'
import { hasXmllint, xmllint } from './tools'
import { CheckOptions, CheckResult, Problems } from './types'
import { attr, byName, parseXml, textOf, XmlDocument } from './xml'

export type LmsFormat = 'scorm1.2' | 'scorm2004' | 'ims' | 'web' | 'xapi'

export function checkLms(
  format: LmsFormat,
  source: string,
  options: CheckOptions = {},
): CheckResult {
  const pkg = openPackage(source)
  const problems = new Problems()
  const summary: Record<string, unknown> = { files: pkg.files.length }

  checkCourseFiles(pkg, problems)
  checkEntryPage(pkg, 'index.html', problems)

  problems.many('hidden files shipped', hiddenFiles(pkg))

  switch (format) {
    case 'scorm1.2':
    case 'scorm2004':
      Object.assign(summary, checkScorm(format, pkg, problems, options))
      break
    case 'ims':
      Object.assign(summary, checkIms(pkg, problems))
      break
    case 'xapi':
      Object.assign(summary, checkTincan(pkg, problems))
      break
  }

  return { format, problems: problems.list, markers: [], summary }
}

/** The README and every course file must be in the package, byte for byte. */
function checkCourseFiles(pkg: Package, problems: Problems): void {
  if (!pkg.has('README.md')) {
    problems.add('course missing', 'README.md is not in the package')
  } else if (!pkg.read('README.md').equals(fs.readFileSync(COURSE_README))) {
    problems.add('course changed', 'README.md differs from the fixture')
  }

  const missing: string[] = []
  const changed: string[] = []

  for (const asset of courseAssets()) {
    if (!pkg.has(asset)) missing.push(asset)
    else if (!pkg.read(asset).equals(fs.readFileSync(path.join(COURSE_DIR, asset))))
      changed.push(asset)
  }

  problems.many('course files missing', missing)
  problems.many('course files changed', changed)
}

/** Every local `src`/`href` of an HTML page must resolve to a file. */
function checkEntryPage(pkg: Package, page: string, problems: Problems): void {
  if (!pkg.has(page)) {
    problems.add('entry page missing', page)
    return
  }

  const html = pkg.text(page)
  const refs = [...html.matchAll(/\s(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
    .map((match) => resolveRef(page, match[1]))
    .filter((ref): ref is string => ref !== null)

  problems.many(
    `${page} references missing files`,
    [...new Set(refs)].filter((ref) => !pkg.has(ref)),
  )
}

function readXml(
  pkg: Package,
  file: string,
  problems: Problems,
): XmlDocument | null {
  if (!pkg.has(file)) {
    problems.add('manifest missing', file)
    return null
  }

  const { doc, errors } = parseXml(pkg.text(file))
  problems.many(`${file} is not well-formed`, errors, 3)
  return errors.length ? null : doc
}

const SCHEMA_VERSION = {
  'scorm1.2': '1.2',
  scorm2004: '2004 4th Edition',
}

/** Namespaces the manifest uses → the schema file the package ships for each. */
const SCHEMAS = {
  'scorm1.2': {
    'http://www.imsproject.org/xsd/imscp_rootv1p1p2': 'imscp_rootv1p1p2.xsd',
    'http://www.adlnet.org/xsd/adlcp_rootv1p2': 'adlcp_rootv1p2.xsd',
    'http://www.imsglobal.org/xsd/imsmd_rootv1p2p1': 'imsmd_rootv1p2p1.xsd',
  },
  scorm2004: {
    'http://www.imsglobal.org/xsd/imscp_v1p1': 'imscp_v1p1.xsd',
    'http://www.adlnet.org/xsd/adlcp_v1p3': 'adlcp_v1p3.xsd',
    'http://www.adlnet.org/xsd/adlseq_v1p3': 'adlseq_v1p3.xsd',
    'http://www.adlnet.org/xsd/adlnav_v1p3': 'adlnav_v1p3.xsd',
    'http://www.imsglobal.org/xsd/imsss': 'imsss_v1p0.xsd',
  },
}

function checkScorm(
  format: 'scorm1.2' | 'scorm2004',
  pkg: Package,
  problems: Problems,
  options: CheckOptions,
): Record<string, unknown> {
  const doc = readXml(pkg, 'imsmanifest.xml', problems)
  if (!doc) return {}

  const version = textOf(byName(doc, 'schemaversion')[0])
  if (version !== SCHEMA_VERSION[format]) {
    problems.add('wrong schemaversion', `"${version}", expected "${SCHEMA_VERSION[format]}"`)
  }

  const organization = byName(doc, 'organization')[0]
  const title = textOf(organization && byName(organization, 'title')[0])
  if (title !== COURSE.title) {
    problems.add('wrong organization title', `"${title}"`)
  }

  // The launched SCO and the course it opens: a package that launches the
  // player without the course is the "SCORM shipped without the course" bug.
  const resources = byName(doc, 'resource')
  const sco = resources.find((r) => /sco/i.test(attr(r, 'scormtype') ?? attr(r, 'scormType') ?? ''))
  const launch = sco && attr(sco, 'href')

  if (!launch) problems.add('no SCO', 'no resource with scormtype="sco" and an href')
  else if (!pkg.has(launch)) problems.add('SCO launch file missing', launch)

  const item = byName(doc, 'item').find((i) => attr(i, 'identifierref'))
  const course =
    (item && attr(item, 'parameters')?.replace(/^[?#]/, '')) ||
    (launch && pkg.has(launch) ? unparameterizedCourse(pkg, launch, problems) : null)

  if (course === undefined) problems.add('no course parameter', 'the item names no course file')
  else if (course && !pkg.has(course)) problems.add('course parameter missing', course)

  const listed = byName(doc, 'file').map((f) => attr(f, 'href') ?? '')
  problems.many(
    'manifest lists missing files',
    listed.filter((href) => !pkg.has(href)),
  )

  for (const location of byName(doc, 'location')) {
    if (!pkg.has(textOf(location))) problems.add('metadata file missing', textOf(location))
  }

  if (options.deep) validateSchema(format, pkg, problems)

  return {
    title,
    course,
    launch,
    listedFiles: listed.length,
  }
}

/**
 * Where the course comes from when the manifest passes no parameter:
 *   --scorm-iframe  start.html opens index.html?<path to README> in an iframe
 *   --scorm-embed   index.html loads course.js, which holds the markdown itself
 * Returns the course file to look for, null when the course is embedded (and
 * checked here), or undefined when the launch file delivers no course at all.
 */
function unparameterizedCourse(
  pkg: Package,
  launch: string,
  problems: Problems,
): string | null | undefined {
  const html = pkg.text(launch)

  const framed = html.match(/\+\s*path\s*\+\s*"([^"]+)"/)
  if (framed) return resolveRef(launch, framed[1]) ?? undefined

  if (!/<script[^>]+src="course\.js"/.test(html)) return undefined

  const script = resolveRef(launch, 'course.js')!
  if (!pkg.has(script)) {
    problems.add('embedded course missing', script)
  } else if (!pkg.text(script).includes(COURSE.title)) {
    problems.add('embedded course is not the course', `${script} lacks "${COURSE.title}"`)
  }
  return null
}

/**
 * Validates the manifest against the schemas shipped in the package. xmllint
 * takes one schema, so a wrapper imports one per namespace.
 */
function validateSchema(
  format: 'scorm1.2' | 'scorm2004',
  pkg: Package,
  problems: Problems,
): void {
  if (!hasXmllint()) {
    problems.add('deep check unavailable', 'xmllint is not installed')
    return
  }

  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lia-xsd-'))

  try {
    for (const file of pkg.files) {
      if (/\.(xsd|dtd|xml)$/.test(file) && !file.includes('/')) {
        fs.writeFileSync(path.join(dir, file), pkg.read(file))
      }
    }

    const imports = Object.entries(SCHEMAS[format])
      .map(([ns, file]) => `  <xs:import namespace="${ns}" schemaLocation="${file}"/>`)
      .join('\n')

    fs.writeFileSync(
      path.join(dir, '_wrapper.xsd'),
      `<?xml version="1.0"?>\n<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema" targetNamespace="urn:liascript:test">\n${imports}\n</xs:schema>\n`,
    )

    problems.many(
      'imsmanifest.xml fails its XSD',
      xmllint(path.join(dir, '_wrapper.xsd'), path.join(dir, 'imsmanifest.xml')),
      5,
    )
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
}

function checkIms(pkg: Package, problems: Problems): Record<string, unknown> {
  const doc = readXml(pkg, 'imsmanifest.xml', problems)
  if (!doc) return {}

  const title = textOf(byName(byName(doc, 'title')[0] ?? doc, 'langstring')[0])
  if (title !== COURSE.title) problems.add('wrong manifest title', `"${title}"`)

  const launch = attr(byName(doc, 'resource')[0] ?? doc.createElement('x'), 'href')

  if (!launch) {
    problems.add('no launch resource', 'no <resource href>')
  } else if (!pkg.has(launch)) {
    problems.add('launch file missing', launch)
  } else {
    checkEntryPage(pkg, launch, problems)

    // start.html frames index.html with the course path appended at runtime
    if (!pkg.text(launch).includes('README.md')) {
      problems.add('launch page does not open the course', launch)
    }
  }

  return { title, launch }
}

function checkTincan(pkg: Package, problems: Problems): Record<string, unknown> {
  const doc = readXml(pkg, 'tincan.xml', problems)
  if (!doc) return {}

  const activity = byName(doc, 'activity')[0]
  const name = textOf(activity && byName(activity, 'name')[0])
  if (name !== COURSE.title) problems.add('wrong activity name', `"${name}"`)

  const launch = textOf(byName(doc, 'launch')[0])
  if (!launch) problems.add('no launch', 'tincan.xml has no <launch>')
  else if (!pkg.has(launch)) problems.add('launch file missing', launch)

  const resources = byName(doc, 'resource').map(textOf)
  problems.many(
    'tincan.xml lists missing files',
    resources.filter((file) => !pkg.has(file)),
  )

  return { name, launch, resources: resources.length }
}
