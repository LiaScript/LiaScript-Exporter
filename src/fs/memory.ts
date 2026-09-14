'use strict'

import { zipSync, Zippable } from 'fflate'
import { ExportFS, CopyOptions } from './types'
import * as p from './path'

const ZIP_COMPRESSION_LEVEL = 9
const ASSET_ROOT = '/assets'
const TMP_ROOT = '/tmp'

/**
 * In-memory {@link ExportFS} for the browser.
 *
 * Files live in a flat `Map` keyed by normalised absolute path. Directories are
 * implicit — one "exists" when any key is prefixed by it — which keeps copy and
 * remove to simple prefix operations. `dirs` records the few directories that
 * are created empty and would otherwise be invisible.
 */
export class MemoryFS implements ExportFS {
  private files = new Map<string, Uint8Array>()
  private dirs = new Set<string>()
  private tmpCounter = 0

  private encoder = new TextEncoder()
  private decoder = new TextDecoder()

  // --- seeding -------------------------------------------------------------

  /**
   * Seeds a fetched asset bundle into the store, below {@link assetRoot}.
   * Call once per session before exporting; paths are relative to the root.
   */
  seed(entries: Record<string, Uint8Array>): void {
    for (const [file, bytes] of Object.entries(entries)) {
      this.files.set(p.join(ASSET_ROOT, file), bytes)
    }
  }

  /** Every file path currently held, sorted — useful for tests and diffing. */
  list(): string[] {
    return [...this.files.keys()].sort()
  }

  // --- reading -------------------------------------------------------------

  async readFile(file: string): Promise<string> {
    return this.decoder.decode(await this.readFileRaw(file))
  }

  async readFileRaw(file: string): Promise<Uint8Array> {
    const bytes = this.files.get(p.normalize(file))

    if (!bytes) {
      throw new Error(`ENOENT: no such file or directory, open '${file}'`)
    }

    return bytes
  }

  async exists(target: string): Promise<boolean> {
    const key = p.normalize(target)

    return (
      this.files.has(key) || this.dirs.has(key) || this.hasChildren(key)
    )
  }

  async readDir(dir: string): Promise<string[]> {
    const key = p.normalize(dir)
    const children = new Set<string>()

    for (const path of [...this.files.keys(), ...this.dirs]) {
      if (path === key || !p.contains(key, path)) continue

      // Only the next segment down, so nested files collapse to their folder.
      const rest = path.slice(key === '/' ? 1 : key.length + 1)
      const next = rest.split('/')[0]

      if (next) children.add(next)
    }

    return [...children].sort()
  }

  async isDirectory(target: string): Promise<boolean> {
    const key = p.normalize(target)

    return !this.files.has(key) && (this.dirs.has(key) || this.hasChildren(key))
  }

  async size(file: string): Promise<number> {
    return (await this.readFileRaw(file)).length
  }

  // --- writing -------------------------------------------------------------

  async writeFile(file: string, content: string): Promise<void> {
    await this.writeFileRaw(file, this.encoder.encode(content))
  }

  async writeFileRaw(file: string, content: Uint8Array): Promise<void> {
    this.files.set(p.normalize(file), content)
  }

  async ensureDir(dir: string): Promise<void> {
    this.dirs.add(p.normalize(dir))
  }

  async copy(
    src: string,
    dest: string,
    options: CopyOptions = {},
  ): Promise<void> {
    const from = p.normalize(src)
    const to = p.normalize(dest)
    const filter = options.filter

    if (this.files.has(from)) {
      if (!filter || filter(from, to)) {
        this.files.set(to, this.files.get(from)!)
      }
      return
    }

    for (const [path, bytes] of [...this.files]) {
      if (!p.contains(from, path)) continue

      const target = p.join(to, p.relative(from, path))

      if (filter && !filter(path, target)) continue

      this.files.set(target, bytes)
    }

    for (const path of [...this.dirs]) {
      if (!p.contains(from, path)) continue

      const target = p.join(to, p.relative(from, path))

      if (filter && !filter(path, target)) continue

      this.dirs.add(target)
    }
  }

  async move(src: string, dest: string): Promise<void> {
    await this.copy(src, dest)
    await this.remove(src)
  }

  async remove(target: string): Promise<void> {
    const key = p.normalize(target)

    for (const path of [...this.files.keys()]) {
      if (p.contains(key, path)) this.files.delete(path)
    }

    for (const path of [...this.dirs]) {
      if (p.contains(key, path)) this.dirs.delete(path)
    }
  }

  // --- beyond plain fs -----------------------------------------------------

  assetRoot(): string {
    return ASSET_ROOT
  }

  async tmpDir(): Promise<string> {
    const dir = p.join(TMP_ROOT, `lia-${this.tmpCounter++}`)
    await this.ensureDir(dir)

    return dir
  }

  async zip(dir: string): Promise<Uint8Array> {
    const key = p.normalize(dir)
    const entries: Zippable = {}

    for (const [path, bytes] of this.files) {
      if (!p.contains(key, path) || path === key) continue

      entries[p.relative(key, path)] = bytes
    }

    return zipSync(entries, { level: ZIP_COMPRESSION_LEVEL })
  }

  async writeZip(dir: string, filename: string): Promise<void> {
    await this.writeFileRaw(filename + '.zip', await this.zip(dir))
  }

  // --- internals -----------------------------------------------------------

  /** True if any stored path lives beneath `dir`, making it an implicit dir. */
  private hasChildren(dir: string): boolean {
    for (const path of this.files.keys()) {
      if (path !== dir && p.contains(dir, path)) return true
    }

    for (const path of this.dirs) {
      if (path !== dir && p.contains(dir, path)) return true
    }

    return false
  }
}
