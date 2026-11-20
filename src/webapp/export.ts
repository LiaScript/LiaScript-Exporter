'use strict'

import { MemoryFS } from '../fs/memory'
import { Arguments } from '../parser'
import { Exporter, registerServerExporters } from '../exporter'
import { useHttpsSchemaOrg } from '../export/rdf'
import { AssetLoader, SCORM_SCHEMA_ROOT } from './assets'
import { prepare as preparePrint, PrintJob } from './formats/pdf'
import * as epub from './formats/epub'

useHttpsSchemaOrg()

/** Where the course is staged inside the store before exporting. */
const COURSE_ROOT = '/course'
const OUTPUT_ROOT = '/out'

/** A course as the user supplied it. */
export interface Course {
  /** The markdown source. */
  markdown: string
  /** Name shown in the UI and used for the downloaded file. */
  name: string
  /** Local files the course references (images, imports), keyed by relative path. */
  files?: Record<string, Uint8Array>
}

/**
 * The finished export: bytes to download, or — for `pdf` — the {@link PrintJob}
 * the print tab needs. `print` is what tells the two apart downstream.
 */
export type Export =
  | { bytes: Uint8Array; filename: string; print?: undefined }
  | { print: PrintJob; bytes?: undefined; filename?: undefined }

/**
 * Exports a course entirely in the browser.
 *
 * The counterpart to `validateAndNormalize` in [parser.ts](../parser.ts): with
 * no argv to normalise, the equivalent `Arguments` are built directly. The
 * export runs through the same {@link Exporter} the CLI uses — only storage and
 * input differ.
 */
export async function exportCourse(
  course: Course,
  format: string,
  options: Record<string, any> = {},
  onProgress?: (message: string) => void,
): Promise<Export> {
  // `pdf` produces no files: nothing to seed, and the Exporter only parses
  // the course for the solutions of a form.
  if (format === 'pdf') {
    onProgress?.('Preparing…')
    const print = await preparePrint(course.markdown, course.files, options)

    if (options['pdf-form']) {
      onProgress?.('Reading the quizzes…')
      print.form = { meta: await courseMeta(course, options) }
    }

    return { print }
  }

  // `docx` and `epub` render the course rather than transforming its markdown,
  // so they run outside the Exporter and return bytes directly — there is no
  // store for `collect` to find them in.
  if (format === 'docx') {
    const { exporter: toDocx } = await import('./formats/docx')

    return {
      bytes: await toDocx(course.markdown, course.files, options, onProgress),
      filename: `${course.name}.docx`,
    }
  }

  if (format === 'epub') {
    if (options['epub-form']) onProgress?.('Reading the quizzes…')
    const meta = options['epub-form'] ? await courseMeta(course, options) : null

    return {
      bytes: await epub.exporter(
        course.markdown,
        course.files,
        options,
        onProgress,
        meta,
      ),
      filename: `${course.name}.epub`,
    }
  }

  const fs = new MemoryFS()

  onProgress?.('Loading assets…')
  await new AssetLoader(fs).ensure(
    format,
    (bundle, index, total) =>
      onProgress?.(`Loading assets (${index + 1}/${total}): ${bundle}…`),
    options,
  )

  const readme = await stage(fs, course)
  const output = `${OUTPUT_ROOT}/${course.name}`

  const argument = {
    ...options,
    input: `${COURSE_ROOT}/${readme}`,
    readme: `./${readme}`,
    path: COURSE_ROOT,
    output,
    format,
    fs,

    // The packager cannot resolve its own install location here, so it is
    // pointed at the seeded schemas. Ignored by every other format.
    'scorm-schema-root': SCORM_SCHEMA_ROOT,

    ...zipDefaults(format),
  } as Arguments

  onProgress?.('Exporting…')
  await new Exporter().run(argument)

  return collect(fs, output, course.name, format)
}

/**
 * Puts the course into the store: exporters copy `argument.path` wholesale
 * into their temp dir, and rewrite the readme in place. Returns its name.
 */
async function stage(fs: MemoryFS, course: Course): Promise<string> {
  const readme = `${course.name}.md`
  await fs.writeFile(`${COURSE_ROOT}/${readme}`, course.markdown)

  for (const [name, bytes] of Object.entries(course.files ?? {})) {
    // The staged course wins over a file of the same name: it is the document
    // the user actually asked to export.
    if (name === readme) continue

    await fs.writeFileRaw(`${COURSE_ROOT}/${name}`, bytes)
  }

  return readme
}

/**
 * The course description with the quiz solutions (`json.meta`), as the CLI's
 * `--pdf-form` gets it: the Exporter parses the course for `pdf` with
 * `pdf-form`, and hands the result to the `pdf` exporter, which here only
 * keeps it. Null if the course could not be parsed.
 */
async function courseMeta(course: Course, options: Record<string, any>): Promise<any> {
  const fs = new MemoryFS()
  const readme = await stage(fs, course)
  let meta: any = null

  registerServerExporters({ pdf: { exporter: async (_: unknown, json: any) => (meta = json?.meta ?? null) } })

  await new Exporter().run({
    ...options,
    input: `${COURSE_ROOT}/${readme}`,
    readme: `./${readme}`,
    path: COURSE_ROOT,
    output: `${OUTPUT_ROOT}/${course.name}`,
    format: 'pdf',
    'pdf-form': true,
    fs,
  } as Arguments)

  return meta
}

/**
 * Archive flags forced on so a format yields one downloadable file. The CLI
 * leaves this to the user, who has a filesystem to unpack into. Everything else
 * already writes a single file or always produces an archive.
 */
function zipDefaults(format: string): Record<string, boolean> {
  switch (format) {
    case 'web':
      return { 'web-zip': true }
    case 'xapi':
      return { 'xapi-zip': true }
    default:
      return {}
  }
}

/**
 * Finds what the exporter wrote and reads it back out of the store.
 *
 * Exporters return `void` and write through `ExportFS`, so the output is
 * located by extension rather than handed back — which is what lets the CLI and
 * the browser share them unchanged.
 */
async function collect(
  fs: MemoryFS,
  output: string,
  name: string,
  format: string,
): Promise<Export> {
  for (const extension of ['.zip', '.h5p', '.json', '.jsonld', '.nq', '.pdf']) {
    const file = output + extension

    if (await fs.exists(file)) {
      return { bytes: await fs.readFileRaw(file), filename: name + extension }
    }
  }

  // desktop names its output by platform: `<output>-win-x64.exe` and the like
  const suffixed = fs.list().find((f) => f.startsWith(`${output}-`))
  if (suffixed) {
    return {
      bytes: await fs.readFileRaw(suffixed),
      filename: name + suffixed.slice(output.length),
    }
  }

  throw new Error(
    `the "${format}" export produced no recognisable output — found: ${fs
      .list()
      .filter((f) => f.startsWith(OUTPUT_ROOT))
      .join(', ') || 'nothing'}`,
  )
}

/** Hands the finished bytes to the browser as a file download. */
export function download(bytes: Uint8Array, filename: string): void {
  // Copy into a fresh buffer: the view may be backed by a larger pooled
  // ArrayBuffer, which Blob would otherwise include in full.
  const blob = new Blob([bytes.slice()], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()

  URL.revokeObjectURL(url)
}
