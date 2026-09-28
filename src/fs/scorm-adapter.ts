'use strict'

import type { ExportFS } from './types'

/**
 * Adapts an {@link ExportFS} to the storage contract expected by
 * `@liascript/simple-scorm-packager` (see its `lib/fs-adapter.js`).
 *
 * The two interfaces are deliberately independent — the packager is a separate
 * published library and should not depend on this repo's types — so the small
 * differences are reconciled here:
 *
 *   - `assetRoot` is a plain property there, a method here
 *   - the packager names single-entry copying `copyFile`
 *   - its `zip` writes to a destination path and reports the byte count,
 *     rather than returning the archive
 *
 * Note `assetRoot` refers to the *packager's* own `schemas/` directory, not to
 * this project's `dist/assets`. Leave it undefined under Node — the packager
 * then resolves its own install location. Only a browser caller, which has
 * seeded those files somewhere, needs to pass it.
 */
export function scormAdapter(fs: ExportFS, assetRoot?: string) {
  return {
    assetRoot,

    readFile: (file: string) => fs.readFileRaw(file),

    writeFile: (file: string, content: string | Uint8Array) =>
      typeof content === 'string'
        ? fs.writeFile(file, content)
        : fs.writeFileRaw(file, content),

    copyFile: (src: string, dest: string) => fs.copy(src, dest),

    ensureDir: (dir: string) => fs.ensureDir(dir),

    readDir: (dir: string) => fs.readDir(dir),

    isDirectory: (target: string) => fs.isDirectory(target),

    size: (file: string) => fs.size(file),

    zip: async (dir: string, destination: string): Promise<number> => {
      const bytes = await fs.zip(dir)
      await fs.writeFileRaw(destination, bytes)

      return bytes.length
    },
  }
}
