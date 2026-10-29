import * as helper from './helper'
import { finalizeMeta } from './scorm-storage'
import * as COLOR from '../colorize'
import * as path from '../fs/path'
import type { ExportFS } from '../fs/types'

/**
 * H5P export: a `.h5p` package whose main library, H5P.LiaScript, carries the
 * whole LiaScript runtime, so every feature of a course keeps working.
 *
 *   h5p.json
 *   content/content.json        H5P parameters: the course (file and, base64,
 *                               its Markdown), its settings (base64: quiz/survey/
 *                               task states, meta, mastery score) and height
 *   content/<course files>      only what H5P accepts, see CONTENT_EXTENSIONS
 *   H5P.LiaScript-<maj>.<min>/  library.json, semantics.json, the wrapper
 *     runtime/                  the LiaScript runtime (dist/assets/h5p)
 *
 * The wrapper, src/export/h5p-library, writes the runtime into an iframe and
 * connects it to H5P: the learner's state goes into H5P's user data, results
 * become xAPI statements, which Moodle and others grade.
 */

export function help() {
  console.log('')
  console.log(COLOR.heading('H5P settings:'), '\n')

  COLOR.info(
    'H5P packages run in Moodle, ILIAS, WordPress, Drupal, Lumi and other H5P platforms. The package brings its own library, H5P.LiaScript: installing it needs the right to install H5P libraries (in Moodle "moodle/h5p:updatelibraries", an administrator has it); after that, anyone can add LiaScript courses.',
  )

  console.log('\nLearn more: https://h5p.org/\n')

  COLOR.command(
    null,
    '--h5p-height',
    '           height of the course in pixels (default: 600)',
  )
  COLOR.command(
    null,
    '--h5p-mastery',
    '          percentage of points needed to pass (default: none, completion only)',
  )
}

export const format = 'h5p'

/**
 * What H5P accepts in `content/`, the list of Moodle (and of H5P core without
 * svg and xml): a package with any other file is refused as a whole.
 */
export const CONTENT_EXTENSIONS = [
  'json', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tif', 'tiff', 'eot', 'ttf', 'woff',
  'woff2', 'otf', 'webm', 'mp4', 'ogg', 'mp3', 'm4a', 'wav', 'txt', 'pdf', 'rtf',
  'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'odt', 'ods', 'odp', 'csv', 'diff',
  'patch', 'swf', 'md', 'textile', 'vtt', 'webvtt', 'gltf', 'glb',
]

/** libraries may also bring scripts and stylesheets */
export const LIBRARY_EXTENSIONS = [...CONTENT_EXTENSIONS, 'js', 'css']

export const MACHINE_NAME = 'H5P.LiaScript'

/**
 * Raise with every change in src/export/h5p-library: a platform only
 * replaces an installed library by one with a higher patch version.
 */
export const WRAPPER_REVISION = 4

/** the content folder in the embedded course's `base:`, the wrapper puts in its URL */
export const CONTENT_SENTINEL = '%H5P_CONTENT%'

/** the string in the wrapper that is replaced by the runtime's head */
const RUNTIME_SENTINEL = /(['"])__LIASCRIPT_RUNTIME__\1/g

/** `src`/`href` values that are not files of the runtime */
const NOT_LOCAL = /^([a-z][a-z0-9+.-]*:|\/|#|%BASE%)/i

export interface H5pExportArguments {
  input: string
  readme: string
  output: string
  format: string
  path: string
  key?: string
  style?: string
  /** Storage backing; supplied by the CLI or the browser host. */
  fs?: ExportFS
  'h5p-height'?: number | string
  'h5p-mastery'?: number | string
}

export interface LibraryVersion {
  major: number
  minor: number
  patch: number
}

/**
 * The library takes major and minor from the LiaScript runtime; the patch
 * version grows with every build of the runtime and every revision of the
 * wrapper, see scripts/h5p-version.js.
 */
export function libraryVersion(stamp: { version?: string; built?: number }): LibraryVersion {
  const [major, minor] = String(stamp.version || '0.0').split('.').map((n) => parseInt(n, 10) || 0)
  const patch = (stamp.built || 0) + WRAPPER_REVISION
  if (patch > 99999) {
    // H5P refuses more than five digits, see scripts/h5p-version.js
    throw new Error(`the H5P library version ${major}.${minor}.${patch} has more than five digits`)
  }
  return {
    // H5P players treat a major version of 0 as missing
    major: Math.max(1, major),
    minor,
    patch,
  }
}

/**
 * The runtime's `<head>`, every local `src` and `href` prefixed with
 * `%BASE%`, which the wrapper replaces by the library's URL.
 */
export function runtimeHead(index: string): string {
  const head = index.match(/<head[^>]*>([\s\S]*)<\/head>/i)
  if (!head) throw new Error('the H5P runtime has no <head>')

  return head[1].replace(/(\s(?:src|href)=)(["'])(.*?)\2/gi, (all, attribute, quote, url) =>
    NOT_LOCAL.test(url) ? all : `${attribute}${quote}%BASE%${url}${quote}`,
  )
}

/** the wrapper with the runtime filled in */
export function wrapper(source: string, head: string): string {
  const found = source.match(RUNTIME_SENTINEL)?.length ?? 0
  if (found !== 1) {
    throw new Error(`the H5P.LiaScript wrapper needs one runtime placeholder, it has ${found}`)
  }
  // `</` written as `<\/`: a platform may inline the library in a <script>
  return source.replace(RUNTIME_SENTINEL, () => JSON.stringify({ head }).replace(/<\//g, '<\\/'))
}

const extension = (file: string) => path.extname(file).slice(1).toLowerCase()

/**
 * Removes every file under `dir` whose extension is not in `allowed`,
 * returns their paths relative to `dir`.
 */
async function prune(fs: ExportFS, dir: string, allowed: string[], base = dir): Promise<string[]> {
  const removed: string[] = []
  for (const name of await fs.readDir(dir)) {
    const file = path.join(dir, name)
    if (await fs.isDirectory(file)) {
      removed.push(...(await prune(fs, file, allowed, base)))
    } else if (!allowed.includes(extension(name))) {
      await fs.remove(file)
      removed.push(path.relative(base, file))
    }
  }
  return removed
}

function base64(bytes: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

const escapeRegExp = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/**
 * H5P refuses svg files, so the course's svg images become data URLs in the
 * Markdown. Returns the Markdown and the svg files it does not mention.
 */
export function inlineImages(
  markdown: string,
  images: { path: string; data: Uint8Array }[],
): { markdown: string; unused: string[] } {
  const unused: string[] = []

  for (const image of images) {
    // a reference, with or without ./, between delimiters of Markdown or HTML
    const pattern = new RegExp(
      `(^|[\\s("'=<])(?:\\./)?${escapeRegExp(image.path)}(?=$|[\\s)"'>?#])`,
      'gm',
    )
    let found = false
    const url = 'data:image/svg+xml;base64,' + base64(image.data)
    markdown = markdown.replace(pattern, (_, before) => {
      found = true
      return before + url
    })
    if (!found) unused.push(image.path)
  }

  return { markdown, unused }
}

export async function exporter(argument: H5pExportArguments, json: any) {
  const fs = argument.fs!
  const warn = (message: string) => console.warn('h5p:', message)

  const assets = path.join(fs.assetRoot(), 'assets')
  const tmp = await fs.tmpDir()
  const root = path.join(tmp, 'h5p')

  const stamp = JSON.parse(await fs.readFile(path.join(assets, 'h5p', 'version.json')))
  const version = libraryVersion(stamp)
  const library = `${MACHINE_NAME}-${version.major}.${version.minor}`

  // --- the library ---------------------------------------------------------

  const libraryDir = path.join(root, library)
  const runtimeDir = path.join(libraryDir, 'runtime')

  await fs.copy(path.join(assets, 'h5p'), runtimeDir)
  await fs.copy(path.join(assets, 'common'), runtimeDir)
  await fs.remove(path.join(runtimeDir, 'version.json'))

  let index = await fs.readFile(path.join(runtimeDir, 'index.html'))
  if (argument.key) {
    index = helper.injectResponsivevoice(argument.key, index)
  }

  // H5P refuses svg files, so the default logo (Const.icon) becomes a data URL
  const icon = path.join(runtimeDir, 'icon.svg')
  if (await fs.exists(icon)) {
    const url = JSON.stringify('data:image/svg+xml;base64,' + base64(await fs.readFileRaw(icon)))
    for (const name of await fs.readDir(runtimeDir)) {
      if (extension(name) !== 'js') continue
      const file = path.join(runtimeDir, name)
      const code = await fs.readFile(file)
      if (code.includes('"icon.svg"')) await fs.writeFile(file, code.split('"icon.svg"').join(url))
    }
  }

  // svg: legacy fonts behind woff2, the default logo and the classroom
  // picture, which H5P does not run; html: written by the wrapper instead
  await prune(fs, runtimeDir, LIBRARY_EXTENSIONS)

  const source = await fs.readFile(path.join(assets, 'h5p-library', 'h5p-liascript.js'))
  await fs.writeFile(path.join(libraryDir, 'h5p-liascript.js'), wrapper(source, runtimeHead(index)))
  await fs.copy(
    path.join(assets, 'h5p-library', 'h5p-liascript.css'),
    path.join(libraryDir, 'h5p-liascript.css'),
  )

  await fs.writeFile(
    path.join(libraryDir, 'library.json'),
    JSON.stringify(
      {
        title: 'LiaScript',
        description: 'Runs a LiaScript course, written in Markdown, with all its quizzes, code, animations and narration.',
        machineName: MACHINE_NAME,
        majorVersion: version.major,
        minorVersion: version.minor,
        patchVersion: version.patch,
        runnable: 1,
        fullscreen: 1,
        embedTypes: ['iframe'],
        author: 'LiaScript',
        coreApi: { majorVersion: 1, minorVersion: 19 },
        preloadedJs: [{ path: 'h5p-liascript.js' }],
        preloadedCss: [{ path: 'h5p-liascript.css' }],
      },
      null,
      2,
    ),
  )

  // H5P filters the content parameters by these: anything else is dropped
  await fs.writeFile(
    path.join(libraryDir, 'semantics.json'),
    JSON.stringify(
      [
        {
          name: 'course',
          type: 'text',
          label: 'Course file',
          description: 'The Markdown file of the course, in the content folder',
          default: 'README.md',
        },
        {
          name: 'markdown',
          type: 'text',
          label: 'Course',
          description: 'The Markdown of the course, base64 encoded',
          optional: true,
        },
        {
          name: 'config',
          type: 'text',
          label: 'Settings',
          description: 'Quiz, survey and task states, meta and mastery score, base64 encoded JSON',
          optional: true,
        },
        {
          name: 'height',
          type: 'number',
          label: 'Height',
          description: 'in pixels',
          default: 600,
          min: 200,
        },
      ],
      null,
      2,
    ),
  )

  // --- the content ---------------------------------------------------------

  const contentDir = path.join(root, 'content')
  await fs.copy(argument.path, contentDir, { filter: helper.filterHidden(argument.path) })

  const removed = await prune(fs, contentDir, CONTENT_EXTENSIONS)

  const readme = path.normalize(argument.readme)
  const readmeFile = path.join(contentDir, readme)
  if (!(await fs.exists(readmeFile))) {
    throw new Error(`H5P accepts no file like ${readme}, rename the course to a .md file`)
  }

  const svgs = removed.filter((file) => extension(file) === 'svg')
  if (svgs.length) {
    const images = await Promise.all(
      svgs.map(async (file) => ({
        path: path.relative(path.dirname(readme), file),
        data: await fs.readFileRaw(path.join(argument.path, file)),
      })),
    )
    const inlined = inlineImages(await fs.readFile(readmeFile), images)
    await fs.writeFile(readmeFile, inlined.markdown)
    if (inlined.unused.length) {
      warn(`svg images are not allowed in H5P, not found in ${readme} to embed: ${inlined.unused.join(', ')}`)
    }
  }

  const dropped = removed.filter((file) => extension(file) !== 'svg')
  if (dropped.length) {
    warn(`H5P does not accept these files, they are left out: ${dropped.join(', ')}`)
  }

  // The course and its settings travel in the parameters, which the platform
  // hands over from its database: Moodle 5.2 may refuse to serve content
  // files. base64, because H5P escapes the HTML of text parameters.
  const utf8 = (text: string) => base64(new TextEncoder().encode(text))
  const markdown = helper.embedBase(
    await fs.readFile(readmeFile),
    path.join(CONTENT_SENTINEL, path.dirname(readme)),
  )
  const mastery = parseFloat(String(argument['h5p-mastery'] ?? ''))
  const settings = {
    // window.config_ of the runtime: initial states and their description
    config: {
      task: json.task,
      quiz: json.quiz,
      survey: json.survey,
      meta: finalizeMeta(json.meta, json, warn),
    },
    mastery: mastery > 0 && mastery <= 100 ? mastery / 100 : null,
  }

  const height = parseInt(String(argument['h5p-height'] ?? ''), 10)
  await fs.writeFile(
    path.join(contentDir, 'content.json'),
    JSON.stringify({
      course: readme,
      markdown: utf8(markdown),
      config: utf8(JSON.stringify(settings)),
      height: height >= 200 ? height : 600,
    }),
  )

  // --- the package ---------------------------------------------------------

  const definition = json.lia.definition || {}
  const author = String(definition.author || '').trim()

  await fs.writeFile(
    path.join(root, 'h5p.json'),
    JSON.stringify(
      {
        title: String(json.lia.str_title || 'LiaScript').slice(0, 255),
        language: String(definition.language || 'und').slice(0, 10),
        mainLibrary: MACHINE_NAME,
        embedTypes: ['iframe'],
        license: 'U',
        ...(author && { authors: [{ name: author, role: 'Author' }] }),
        preloadedDependencies: [
          { machineName: MACHINE_NAME, majorVersion: version.major, minorVersion: version.minor },
        ],
      },
      null,
      2,
    ),
  )

  await fs.writeFileRaw(argument.output + '.h5p', await fs.zip(root, { filesOnly: true }))
}
