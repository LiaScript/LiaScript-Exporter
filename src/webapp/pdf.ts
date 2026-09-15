'use strict'

/**
 * Browser PDF export.
 *
 * The odd one out: every other format writes files into the store and hands
 * back bytes, but pdf renders the course in LiaScript's print view and lets the
 * browser's print engine produce the document — KaTeX and ECharts live in
 * shadow DOM, which rasterising libraries render poorly.
 *
 * The render must own a top-level document: `@page` is ignored in a nested one,
 * so an embedded render prints at the host's paper size (measured: Letter
 * instead of A4, including the host page's content).
 */

/*
 * Not a bundler import: the render lazy-loads ~550 siblings by relative name,
 * and Parcel flattens the tree so those 404. Copied verbatim by
 * `scripts/copy-webapp-pdf.js` and served from this fixed path.
 */
const PDF_ENTRY = 'pdf/index.html'

/** Matches the CLI's page defaults; the assets carry no `@page` rule. */
const MARGIN = { top: 80, right: 30, bottom: 80, left: 30 }

/** Bare numbers are points, matching the CLI's margin defaults. */
function length(value: string | number): string {
  return /^\d+(\.\d+)?$/.test(String(value)) ? `${value}pt` : String(value)
}

/** Maps `--pdf-format`/`--pdf-width`/`--pdf-height` onto a CSS `@page size`. */
function pageSize(options: Record<string, any>): string {
  const width = options['pdf-width']
  const height = options['pdf-height']

  if (width && height) {
    return `${length(width)} ${length(height)}`
  }

  const format = options['pdf-format']
  const orientation = options['pdf-landscape'] ? ' landscape' : ''

  return `${format ? String(format).toUpperCase() : 'A4'}${orientation}`
}

/**
 * The CSS the render needs before printing.
 *
 * The margin becomes padding on the content and the page box gets none: with
 * `margin: 0` there is no margin box for the browser to draw its header and
 * footer in, which no API can turn off. Verified byte-identical whether or not
 * the dialog asks for that furniture.
 */
export function pageRule(options: Record<string, any>): string {
  const padding = [
    length(options['pdf-margin-top'] ?? MARGIN.top),
    length(options['pdf-margin-right'] ?? MARGIN.right),
    length(options['pdf-margin-bottom'] ?? MARGIN.bottom),
    length(options['pdf-margin-left'] ?? MARGIN.left),
  ].join(' ')

  return [
    `@page { size: ${pageSize(options)}; margin: 0; }`,
    `body { padding: ${padding}; box-sizing: border-box; }`,
  ].join('\n')
}

/** What the print tab needs, stored with the job: export now, print later. */
export interface PrintJob {
  /** Markdown with local references rewritten to data URLs. */
  markdown: string
  /** Injected into the render before printing. */
  css: string
  /** `--pdf-theme`, applied as a class on the render. */
  theme?: string
}

/** Enough of a content-type guess for the media a course embeds. */
function mimeType(name: string): string {
  const extension = name.split('.').pop()?.toLowerCase() ?? ''

  return (
    {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      gif: 'image/gif',
      svg: 'image/svg+xml',
      webp: 'image/webp',
      mp4: 'video/mp4',
      webm: 'video/webm',
      mp3: 'audio/mpeg',
      ogg: 'audio/ogg',
      wav: 'audio/wav',
      md: 'text/markdown',
      markdown: 'text/markdown',
      json: 'application/json',
      css: 'text/css',
      js: 'text/javascript',
      txt: 'text/plain',
    }[extension] ?? 'application/octet-stream'
  )
}

/**
 * Builds the print job, inlining the course's local files as data URLs.
 *
 * Data URLs rather than object URLs: the job is printed from a later page load,
 * and an object URL dies with the document that created it. The render also
 * won't resolve relative paths against a `blob:` course (`injectFetch` in
 * LiaScript's init.ts), so inlining is what makes local images work at all.
 */
export async function prepare(
  markdown: string,
  files: Record<string, Uint8Array> = {},
  options: Record<string, any> = {},
): Promise<PrintJob> {
  // Longest first: a shorter key that prefixes another must not pre-empt it.
  const names = Object.keys(files).sort((a, b) => b.length - a.length)
  let source = markdown

  for (const name of names) {
    const url = await dataURL(files[name], mimeType(name))

    // Only in a link or image target: a bare replace would also hit the
    // filename where it is merely mentioned in prose.
    source = source.replace(reference(name), (match) => match.replace(name, url))
  }

  return {
    markdown: source,
    css: pageRule(options),
    theme: options['pdf-theme'],
  }
}

/**
 * Matches a file path where markdown uses one as a target: `](path)`,
 * `](path "title")`, or a `[id]: path` reference definition.
 */
function reference(name: string): RegExp {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

  return new RegExp(`(?:\\]\\(\\s*|\\]:\\s*)${escaped}(?=[\\s)"']|$)`, 'g')
}

/** Encodes bytes as a data URL. */
function dataURL(bytes: Uint8Array, type: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(new Blob([bytes.slice()], { type }))
  })
}

/**
 * Opens the render in a new tab, which prints itself once ready. Must be called
 * from a user gesture or the popup is blocked.
 *
 * The course travels as an object URL — a data URL of a real course exceeds
 * what browsers accept in a location — created here rather than in the new tab,
 * where an `about:blank` blob would have an opaque origin and die on navigation.
 *
 * Never revoked: a timeout races the render on a slow machine, and the cost is
 * one course of text per print.
 */
export function print(job: PrintJob): boolean {
  const course = URL.createObjectURL(
    new Blob([job.markdown], { type: 'text/markdown' }),
  )

  const entry = new URL(PDF_ENTRY, location.href).href
  const options = encodeURIComponent(
    JSON.stringify({ css: job.css, theme: job.theme ?? null }),
  )

  const tab = window.open(
    `${entry}?${course}#autoprint=${options}`,
    '_blank',
  )

  if (!tab) {
    URL.revokeObjectURL(course)
    return false
  }

  return true
}
