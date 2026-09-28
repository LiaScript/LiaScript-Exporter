'use strict'

/**
 * Filter callback used by {@link ExportFS.copy}, matching the `fs-extra`
 * signature so `helper.filterHidden` carries over unchanged.
 */
export type CopyFilter = (src: string, dest: string) => boolean

export interface CopyOptions {
  filter?: CopyFilter
}

/**
 * Storage abstraction shared by every exporter.
 *
 * Two backings implement it: `NodeFS` (fs-extra, used by the CLI, the desktop
 * app and the server) and `MemoryFS` (a flat map + fflate, used in the browser).
 * Exporters must never import `fs`, `fs-extra`, `path` or `archiver` directly —
 * everything they need to touch storage is on this interface.
 *
 * Paths are always POSIX-style and use `/` as separator, on every backing.
 */
export interface ExportFS {
  // --- reading -------------------------------------------------------------

  /** Reads a file as UTF-8 text. */
  readFile(file: string): Promise<string>

  /** Reads a file as raw bytes, for binary assets that must not be decoded. */
  readFileRaw(file: string): Promise<Uint8Array>

  /** True if a file or directory exists at `target`. */
  exists(target: string): Promise<boolean>

  /** Lists the immediate children (names only) of a directory. */
  readDir(dir: string): Promise<string[]>

  /** True if `target` exists and is a directory. */
  isDirectory(target: string): Promise<boolean>

  /** Byte length of a file. */
  size(file: string): Promise<number>

  // --- writing -------------------------------------------------------------

  /** Writes UTF-8 text, creating parent directories as needed. */
  writeFile(file: string, content: string): Promise<void>

  /** Writes raw bytes, creating parent directories as needed. */
  writeFileRaw(file: string, content: Uint8Array): Promise<void>

  /** Creates a directory, including any missing parents. Idempotent. */
  ensureDir(dir: string): Promise<void>

  /**
   * Recursively copies a file or directory tree.
   * `options.filter` is consulted per entry; returning false skips it.
   */
  copy(src: string, dest: string, options?: CopyOptions): Promise<void>

  /** Moves a file or directory tree. */
  move(src: string, dest: string): Promise<void>

  /** Recursively removes a file or directory tree. Missing paths are ignored. */
  remove(target: string): Promise<void>

  // --- beyond plain fs -----------------------------------------------------

  /**
   * Root the bundled `dist/assets` tree is read from.
   *
   * Replaces `helper.dirname()`, which resolved the CLI entry point via
   * `require.main` — meaningless in a browser, where assets are fetched
   * and seeded into memory instead.
   */
  assetRoot(): string

  /**
   * Creates a scratch directory unique to this export run.
   * On Node this is a real temp dir, in memory it is just a fresh prefix.
   */
  tmpDir(): Promise<string>

  /**
   * Zips a directory and returns the archive bytes.
   *
   * Returning bytes rather than writing a stream is what lets the browser hand
   * the result to a download while the CLI writes it to disk — the callers
   * decide where it lands, not the archiver.
   */
  zip(dir: string): Promise<Uint8Array>

  /**
   * Zips `dir` and stores the archive at `<filename>.zip`.
   *
   * Convenience over {@link zip} for the callers that only ever wrote the
   * archive straight back to storage, preserving the old `helper.zip(dir,
   * filename)` shape and its `.zip` suffixing.
   */
  writeZip(dir: string, filename: string): Promise<void>
}
