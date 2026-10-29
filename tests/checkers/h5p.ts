/*
 * H5P packages: what an H5P platform checks before it accepts a package
 * (manifests, versions, the file whitelists, no directory entries, as Moodle
 * refuses those), that the course and its files made it into content/, and
 * that every runtime file the H5P.LiaScript wrapper loads is in the library.
 *
 * Whether the course then runs inside an H5P player needs a browser and a
 * player: see docker/lms (Moodle) and the H5P unit tests.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { unzipSync } from 'fflate'
import { courseAssets, LOCAL_FIXTURE, readmeOf } from '../fixtures/course'
import { hiddenFiles, openPackage, Package } from './package'
import { CheckOptions, CheckResult, Problems } from './types'
import { CONTENT_EXTENSIONS, LIBRARY_EXTENSIONS, MACHINE_NAME } from '../../src/export/h5p'

/** H5P core's rules for library.json, see h5p.classes.php */
const VERSION = /^[0-9]{1,5}$/
const MACHINE = /^[\w0-9\-.]{1,255}$/i

const extension = (file: string) => path.extname(file).slice(1).toLowerCase()

function json(pkg: Package, file: string, problems: Problems): any {
  if (!pkg.has(file)) {
    problems.add('manifest missing', file)
    return null
  }
  try {
    return JSON.parse(pkg.text(file))
  } catch (e: any) {
    problems.add(`${file} is not JSON`, e.message)
    return null
  }
}

export function checkH5p(source: string, options: CheckOptions = {}): CheckResult {
  const fixture = options.fixture ?? LOCAL_FIXTURE
  const pkg = openPackage(source)
  const problems = new Problems()
  const summary: Record<string, unknown> = { files: pkg.files.length }

  if (!fs.statSync(source).isDirectory()) {
    const entries = Object.keys(unzipSync(new Uint8Array(fs.readFileSync(source))))
    problems.many('directory entries, refused by Moodle', entries.filter((name) => name.endsWith('/')))
  }

  problems.many('hidden files shipped', hiddenFiles(pkg))

  // --- h5p.json --------------------------------------------------------------

  const h5p = json(pkg, 'h5p.json', problems)
  if (h5p) {
    if (h5p.mainLibrary !== MACHINE_NAME) problems.add('h5p.json', `mainLibrary is ${h5p.mainLibrary}`)
    if (!h5p.title) problems.add('h5p.json', 'no title')
    if (h5p.title !== fixture.course.title) problems.add('h5p.json', `title "${h5p.title}"`)
    if (!(h5p.embedTypes || []).includes('iframe')) problems.add('h5p.json', 'not embedded as iframe')
  }

  const main = (h5p?.preloadedDependencies || []).find((dep: any) => dep.machineName === MACHINE_NAME)
  if (h5p && !main) problems.add('h5p.json', `${MACHINE_NAME} is no dependency`)

  // --- the library -----------------------------------------------------------

  const dir = main ? `${main.machineName}-${main.majorVersion}.${main.minorVersion}` : ''
  const library = main ? json(pkg, `${dir}/library.json`, problems) : null

  if (library) {
    summary.library = `${library.machineName} ${library.majorVersion}.${library.minorVersion}.${library.patchVersion}`
    if (!MACHINE.test(library.machineName ?? '')) problems.add('library.json', 'invalid machineName')
    for (const key of ['majorVersion', 'minorVersion', 'patchVersion']) {
      if (!VERSION.test(String(library[key]))) problems.add('library.json', `invalid ${key} ${library[key]}`)
    }
    if (library.runnable !== 1) problems.add('library.json', 'not runnable')

    const preloaded = [...(library.preloadedJs || []), ...(library.preloadedCss || [])].map(
      (entry: any) => `${dir}/${entry.path}`,
    )
    problems.many('library files missing', preloaded.filter((file) => !pkg.has(file)))

    // content parameters are filtered by these; without them Moodle fails
    const semantics = json(pkg, `${dir}/semantics.json`, problems)
    const fields = (semantics || []).map((field: any) => field.name)
    for (const name of ['course', 'markdown', 'config', 'height']) {
      if (semantics && !fields.includes(name)) problems.add('semantics.json', `no field "${name}"`)
    }

    checkRuntime(pkg, dir, problems)
  }

  // --- whitelists ------------------------------------------------------------

  const misplaced: string[] = []
  for (const file of pkg.files) {
    if (file === 'h5p.json') continue
    const allowed = file.startsWith('content/') ? CONTENT_EXTENSIONS : LIBRARY_EXTENSIONS
    if (!allowed.includes(extension(file))) misplaced.push(file)
  }
  problems.many('files H5P refuses', misplaced)

  // --- the course ------------------------------------------------------------

  const content = json(pkg, 'content/content.json', problems)
  const course = content?.course
  if (content && (!course || !pkg.has(`content/${course}`))) {
    problems.add('content.json', `course "${course}" is not in content/`)
  }

  // the course and its settings are embedded, Moodle 5.2 may not serve content files
  const decode = (text: unknown) => Buffer.from(String(text ?? ''), 'base64').toString('utf8')
  if (content && !decode(content.markdown).includes('base: %H5P_CONTENT%/')) {
    problems.add('content.json', 'no embedded course pointing at its content folder')
  }
  let settings: any = null
  try {
    settings = content && JSON.parse(decode(content.config))
  } catch {}
  if (content && !Array.isArray(settings?.config?.quiz)) {
    problems.add('content.json', 'no embedded quiz states')
  }

  checkCourse(pkg, problems, fixture)

  return { format: 'h5p', problems: problems.list, markers: [], summary }
}

/**
 * The course, unchanged but for its svg images: H5P refuses svg, so they
 * are embedded into the Markdown as data URLs and left out as files.
 */
function checkCourse(pkg: Package, problems: Problems, fixture = LOCAL_FIXTURE): void {
  const readme = 'content/README.md'
  if (!pkg.has(readme)) {
    problems.add('course missing', readme)
    return
  }

  const original = fs.readFileSync(readmeOf(fixture), 'utf8')
  const assets = courseAssets(fixture)
  const svgs = assets.filter((file) => extension(file) === 'svg')
  const shipped = pkg.text(readme)

  // the README with every data URL turned back into its file name
  let restored = shipped
  for (const file of svgs) {
    const url = 'data:image/svg+xml;base64,' + fs.readFileSync(path.join(fixture.dir, file)).toString('base64')
    restored = restored.split(url).join(file)
  }
  if (restored !== original) problems.add('course changed', 'README.md differs beyond its embedded svg images')

  const missing: string[] = []
  const changed: string[] = []
  for (const asset of assets) {
    const file = `content/${asset}`
    if (!CONTENT_EXTENSIONS.includes(extension(asset))) {
      if (pkg.has(file)) changed.push(`${asset} (not allowed)`)
    } else if (!pkg.has(file)) missing.push(asset)
    else if (!pkg.read(file).equals(fs.readFileSync(path.join(fixture.dir, asset)))) changed.push(asset)
  }
  problems.many('course files missing', missing)
  problems.many('course files changed', changed)
}

/** Every file the wrapper's runtime <head> loads must be in the library. */
function checkRuntime(pkg: Package, dir: string, problems: Problems): void {
  const wrapper = `${dir}/h5p-liascript.js`
  if (!pkg.has(wrapper)) return

  const code = pkg.text(wrapper)
  const refs = [...code.matchAll(/%BASE%([^"'\\\s]+)\\?["']/g)].map((match) => `${dir}/runtime/${match[1]}`)

  if (refs.length === 0) problems.add('runtime', 'the wrapper loads no runtime')
  problems.many('runtime files missing', [...new Set(refs)].filter((file) => !pkg.has(file)))
}
