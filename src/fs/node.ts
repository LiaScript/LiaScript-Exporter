'use strict'

import * as fs from 'fs-extra'
import * as path from 'path'
import * as temp from 'temp'
import { ExportFS, CopyOptions } from './types'

const archiver = require('archiver')

const TEMP_DIR_PREFIX = 'lia'
const ZIP_COMPRESSION_LEVEL = 9

/**
 * Disk-backed {@link ExportFS} used by the CLI, the desktop app and the server.
 *
 * This is a thin pass-through to `fs-extra`: the behaviour it exposes is what
 * the exporters already relied on, so porting them to the interface must not
 * change a single output byte.
 */
export class NodeFS implements ExportFS {
  private root: string

  /**
   * @param assetRoot - directory holding `dist/assets`. Defaults to the
   *   location of the running entry point, matching the old `helper.dirname()`.
   */
  constructor(assetRoot?: string) {
    this.root = assetRoot ?? NodeFS.entryDirname()
  }

  /**
   * Resolves the directory of the main entry point, following symlinks so a
   * global npm install still finds its assets.
   */
  private static entryDirname(): string {
    const mainFile = require.main?.filename || process.argv[1]
    return path.dirname(require('fs').realpathSync(mainFile))
  }

  // --- reading -------------------------------------------------------------

  async readFile(file: string): Promise<string> {
    return fs.readFile(file, 'utf8')
  }

  async readFileRaw(file: string): Promise<Uint8Array> {
    return fs.readFile(file)
  }

  async exists(target: string): Promise<boolean> {
    return fs.pathExists(target)
  }

  async readDir(dir: string): Promise<string[]> {
    return fs.readdir(dir)
  }

  async isDirectory(target: string): Promise<boolean> {
    try {
      return (await fs.stat(target)).isDirectory()
    } catch {
      return false
    }
  }

  async size(file: string): Promise<number> {
    return (await fs.stat(file)).size
  }

  // --- writing -------------------------------------------------------------

  async writeFile(file: string, content: string): Promise<void> {
    await fs.outputFile(file, content)
  }

  async writeFileRaw(file: string, content: Uint8Array): Promise<void> {
    await fs.outputFile(file, content)
  }

  async ensureDir(dir: string): Promise<void> {
    await fs.ensureDir(dir)
  }

  async copy(
    src: string,
    dest: string,
    options: CopyOptions = {},
  ): Promise<void> {
    await fs.copy(src, dest, options.filter ? { filter: options.filter } : {})
  }

  async move(src: string, dest: string): Promise<void> {
    await fs.move(src, dest)
  }

  async remove(target: string): Promise<void> {
    await fs.remove(target)
  }

  // --- beyond plain fs -----------------------------------------------------

  assetRoot(): string {
    return this.root
  }

  tmpDir(): Promise<string> {
    return new Promise((resolve, reject) => {
      temp.mkdir(TEMP_DIR_PREFIX, (err: Error | null, tmpPath: string) => {
        if (err) reject(err)
        else resolve(tmpPath)
      })
    })
  }

  zip(dir: string): Promise<Uint8Array> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: ZIP_COMPRESSION_LEVEL },
      })

      const chunks: Buffer[] = []

      archive.on('data', (chunk: Buffer) => chunks.push(chunk))
      archive.on('error', reject)
      archive.on('warning', (err: any) => {
        // ENOENT is non-fatal in archiver and was only logged before.
        if (err.code === 'ENOENT') console.warn('Archive warning:', err)
        else reject(err)
      })
      archive.on('end', () => resolve(Buffer.concat(chunks)))

      archive.directory(dir, false)
      archive.finalize()
    })
  }

  async writeZip(dir: string, filename: string): Promise<void> {
    // Matches the old helper.zip: the archive lands beside `filename`, always
    // suffixed with .zip.
    const target = path.join(
      path.dirname(filename),
      path.basename(filename) + '.zip',
    )

    await fs.outputFile(target, await this.zip(dir))
  }
}
