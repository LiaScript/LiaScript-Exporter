/*
 * One read-only view over an export, whether it is a zip (scorm, ims, epub,
 * docx, `--web-zip`) or a directory (web, xapi). Paths are posix and relative
 * to the package root, directories are left out.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { unzipSync } from 'fflate'

export interface Package {
  /** The zip file or directory this was read from. */
  source: string
  files: string[]
  has(file: string): boolean
  read(file: string): Buffer
  text(file: string): string
}

export function openPackage(source: string): Package {
  return fs.statSync(source).isDirectory() ? openDir(source) : openZip(source)
}

function openZip(source: string): Package {
  const entries = unzipSync(new Uint8Array(fs.readFileSync(source)))
  const files = new Map<string, Buffer>()

  for (const [name, data] of Object.entries(entries)) {
    if (!name.endsWith('/')) files.set(normalize(name), Buffer.from(data))
  }

  return fromMap(source, files)
}

function openDir(source: string): Package {
  const files = new Map<string, Buffer>()

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else
        files.set(
          path.relative(source, full).split(path.sep).join('/'),
          fs.readFileSync(full),
        )
    }
  }

  walk(source)
  return fromMap(source, files)
}

function fromMap(source: string, files: Map<string, Buffer>): Package {
  const get = (file: string) => {
    const data = files.get(normalize(file))
    if (!data) throw new Error(`${file} is not in ${source}`)
    return data
  }

  return {
    source,
    files: [...files.keys()].sort(),
    has: (file) => files.has(normalize(file)),
    read: get,
    text: (file) => get(file).toString('utf8'),
  }
}

export function normalize(file: string): string {
  return path.posix.normalize(file.replace(/\\/g, '/')).replace(/^(\.\/)+/, '')
}

/**
 * Resolves a reference found inside `from` to a package path, or returns null
 * for anything that is not a file of the package (URLs, anchors, data URIs).
 */
export function resolveRef(from: string, ref: string): string | null {
  const clean = ref.trim().split('#')[0].split('?')[0]

  if (!clean || /^[a-z][a-z0-9+.-]*:/i.test(clean) || clean.startsWith('//')) {
    return null
  }

  let decoded = clean
  try {
    decoded = decodeURIComponent(clean)
  } catch {
    // keep the raw reference; a missing file is reported by the caller
  }

  return normalize(path.posix.join(path.posix.dirname(from), decoded))
}

/** Files whose path has a segment starting with a dot. */
export function hiddenFiles(pkg: Package): string[] {
  return pkg.files.filter((file) =>
    file.split('/').some((part) => part.startsWith('.')),
  )
}

/**
 * The first local file header of a zip: EPUB requires `mimetype` to be the
 * first entry and stored uncompressed, which the unzipped view cannot tell.
 */
export function firstZipEntry(
  zipFile: string,
): { name: string; compression: number } | null {
  const head = Buffer.alloc(30 + 256)
  const fd = fs.openSync(zipFile, 'r')

  try {
    fs.readSync(fd, head, 0, head.length, 0)
  } finally {
    fs.closeSync(fd)
  }

  if (head.readUInt32LE(0) !== 0x04034b50) return null

  const nameLength = head.readUInt16LE(26)
  return {
    compression: head.readUInt16LE(8),
    name: head.toString('utf8', 30, 30 + Math.min(nameLength, 256)),
  }
}
