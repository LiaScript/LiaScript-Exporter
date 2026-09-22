'use strict'

/**
 * Reading an uploaded course out of a ZIP archive.
 *
 * The browser counterpart to the server's
 * [zipExtractor](../server/utils/zipExtractor.ts): the server unpacks to a temp
 * directory and hands the exporter a path, while here the entries stay in
 * memory and become the `files` map of a {@link Course}. The selection rules
 * are deliberately the same, so the same archive yields the same course either
 * way.
 */

import { unzipSync } from 'fflate'

/** Directories that never hold course content, skipped like the server does. */
const SKIPPED_DIRECTORIES = ['node_modules', 'dist', 'build']

/** Whether an upload should be treated as an archive rather than as a course file. */
export function isZipFile(filename: string): boolean {
  return /\.zip$/i.test(filename)
}

/**
 * Whether a zip entry is course content.
 *
 * Mirrors the server's `findMarkdownFiles` walk, which skips dot-directories
 * and build output — except that this applies to *every* entry, not only to the
 * markdown search. The server can afford to be laxer: it extracts to disk and
 * copies from there, so the junk is already on the filesystem either way.
 */
function isContent(path: string): boolean {
  const segments = path.split('/')

  return !segments.some(
    (segment) =>
      segment.startsWith('.') || SKIPPED_DIRECTORIES.includes(segment),
  )
}

/**
 * Picks the course file out of the archive's markdown files.
 *
 * Priority is the server's `findMainMarkdown`: a `README.md` anywhere, else the
 * first markdown file. Ties are broken by depth so a `README.md` at the archive
 * root wins over one nested inside a chapter directory — entry order in a zip
 * is the writer's, not something to rely on.
 */
function findMainMarkdown(paths: string[]): string | undefined {
  const markdown = paths.filter((path) => /\.(md|markdown)$/i.test(path))

  if (markdown.length === 0) return undefined

  const depth = (path: string) => path.split('/').length

  const readme = markdown
    .filter((path) => /(^|\/)readme\.(md|markdown)$/i.test(path))
    .sort((a, b) => depth(a) - depth(b))

  if (readme.length > 0) return readme[0]

  return markdown.slice().sort((a, b) => depth(a) - depth(b))[0]
}

/** A course unpacked from an archive, ready for `exportCourse`. */
export interface UnpackedZip {
  /** The markdown source of the chosen course file. */
  markdown: string
  /** Name for the export, taken from the course file. */
  name: string
  /** Everything alongside it, re-keyed relative to the course file's directory. */
  files: Record<string, Uint8Array>
}

/**
 * Unpacks an uploaded archive into a course.
 *
 * Paths are re-keyed relative to the directory holding the course file, so a
 * `docs/README.md` referencing `img/x.png` finds it at `img/x.png` rather than
 * `docs/img/x.png`. This is the one place the browser must do more than the
 * server: the server keeps the markdown's full path and lets `argument.path`
 * (its *directory*) become the export root, whereas here every file is written
 * flat under `COURSE_ROOT`, so the prefix has to come off for the relative
 * references in the markdown to resolve.
 */
export async function unpackZip(file: File): Promise<UnpackedZip> {
  const entries = unzipSync(new Uint8Array(await file.arrayBuffer()))

  // Directory entries come back as zero-length values; keep only real files.
  const paths = Object.keys(entries).filter(
    (path) => !path.endsWith('/') && isContent(path),
  )

  const main = findMainMarkdown(paths)

  if (!main) {
    throw new Error(
      `No markdown file found in "${file.name}". Please include a README.md or any .md file.`,
    )
  }

  const directory = main.includes('/')
    ? main.slice(0, main.lastIndexOf('/') + 1)
    : ''

  const files: Record<string, Uint8Array> = {}

  for (const path of paths) {
    // Files outside the course's own directory cannot be referenced relative to
    // it, so they are dropped rather than given a misleading `../` key.
    if (!path.startsWith(directory)) continue

    // The course file is kept here too, so the export carries the same tree the
    // archive held; `exportCourse` stages it by name and skips the duplicate.
    files[path.slice(directory.length)] = entries[path]
  }

  return {
    markdown: new TextDecoder().decode(entries[main]),
    name:
      main
        .slice(directory.length)
        .replace(/\.(md|markdown)$/i, '') || 'course',
    files,
  }
}
