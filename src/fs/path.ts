'use strict'

/**
 * POSIX-only path helpers.
 *
 * Exporters used Node's `path`, whose separator is platform-dependent. The
 * browser has no `path` at all, and asset paths inside a zip are always `/`
 * separated, so every backing normalises to POSIX and shares these.
 */

/** Splits a path into non-empty segments, tolerating `\` from Windows callers. */
export function segments(p: string): string[] {
  return p.replace(/\\/g, '/').split('/').filter((s) => s.length > 0)
}

/** Normalises separators and resolves `.` / `..` segments. */
export function normalize(p: string): string {
  const absolute = /^[\\/]/.test(p)
  const out: string[] = []

  for (const segment of segments(p)) {
    if (segment === '.') continue
    if (segment === '..') {
      // A leading `..` on a relative path has nothing to pop and must survive.
      if (out.length > 0 && out[out.length - 1] !== '..') out.pop()
      else if (!absolute) out.push('..')
      continue
    }
    out.push(segment)
  }

  return (absolute ? '/' : '') + out.join('/')
}

/** Joins segments into a single normalised path. */
export function join(...parts: string[]): string {
  const joined = parts.filter((p) => p && p.length > 0).join('/')
  return normalize(joined)
}

/**
 * Everything before the last segment, or `.` when there is no parent.
 *
 * Lexical, like Node's `path.dirname`: `..` segments are left in place rather
 * than resolved, so `a/b/../c.txt` yields `a/b/..`.
 */
export function dirname(p: string): string {
  const cleaned = p.replace(/\\/g, '/').replace(/\/+$/, '')
  const index = cleaned.lastIndexOf('/')

  if (index < 0) return '.'
  if (index === 0) return '/'

  return cleaned.slice(0, index)
}

/** The last segment, optionally with `ext` stripped from its end. */
export function basename(p: string, ext?: string): string {
  const name = segments(p).pop() ?? ''

  if (ext && name !== ext && name.endsWith(ext)) {
    return name.slice(0, -ext.length)
  }

  return name
}

/** The extension of the last segment, including the dot, or `''` if none. */
export function extname(p: string): string {
  const name = basename(p)
  const index = name.lastIndexOf('.')

  // A leading dot marks a hidden file, not an extension.
  return index > 0 ? name.slice(index) : ''
}

/**
 * Path of `to` expressed relative to `from`.
 *
 * Differs from Node's `path.relative` for *relative* inputs: Node resolves
 * those against `process.cwd()` first, which has no meaning in a browser, so
 * they are treated as siblings of a common root instead. Results are identical
 * whenever both arguments are absolute, which is how exporters call it.
 */
export function relative(from: string, to: string): string {
  const fromParts = segments(normalize(from))
  const toParts = segments(normalize(to))

  let common = 0
  while (
    common < fromParts.length &&
    common < toParts.length &&
    fromParts[common] === toParts[common]
  ) {
    common++
  }

  const up = fromParts.slice(common).map(() => '..')

  return [...up, ...toParts.slice(common)].join('/')
}

/** True if `child` is `parent` itself or nested beneath it. */
export function contains(parent: string, child: string): boolean {
  const p = normalize(parent)
  const c = normalize(child)

  return c === p || c.startsWith(p.endsWith('/') ? p : p + '/')
}
