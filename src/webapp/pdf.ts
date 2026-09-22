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
export const PDF_ENTRY = 'pdf/index.html'

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
      avif: 'image/avif',
      mp4: 'video/mp4',
      m4v: 'video/mp4',
      webm: 'video/webm',
      ogv: 'video/ogg',
      mov: 'video/quicktime',
      avi: 'video/x-msvideo',
      mkv: 'video/x-matroska',
      mp3: 'audio/mpeg',
      m4a: 'audio/mp4',
      aac: 'audio/aac',
      opus: 'audio/opus',
      flac: 'audio/flac',
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
  const edits: Array<{ index: number; length: number; name: string }> = []
  const wanted = new Set<string>()

  for (const match of matchReferences(markdown)) {
    const name = match.name

    if (!(name in files) || isTimedMedia(mimeType(name))) continue

    edits.push(match)
    wanted.add(name)
  }

  const urls = new Map<string, string>()

  for (const name of wanted) {
    urls.set(name, await dataURL(files[name], mimeType(name)))
  }

  const parts: string[] = []
  let cursor = 0

  for (const edit of edits) {
    // The name sits at the end of the match, behind the `](`/`]: ` that marks
    // it as a target — everything before it is kept as written.
    parts.push(markdown.slice(cursor, edit.index + edit.length - edit.name.length))
    parts.push(urls.get(edit.name)!)
    cursor = edit.index + edit.length
  }

  parts.push(markdown.slice(cursor))

  return {
    markdown: parts.join(''),
    css: pageRule(options),
    theme: options['pdf-theme'],
  }
}

/**
 * Whether a media type is one no target format can embed.
 *
 * Every document format turns a `<video>` into a link to its source — see
 * `bare('video', '▶ ')` in [docx.ts](./docx.ts) and [epub.ts](./epub.ts) — and
 * print cannot play one either, so inlining the bytes would only turn that link
 * into a multi-megabyte data URL. Asked of {@link mimeType} so that the one
 * table decides what a file is.
 */
function isTimedMedia(type: string): boolean {
  return type.startsWith('video/') || type.startsWith('audio/')
}

/**
 * Every path markdown uses as a target: `](path)`, `](path "title")`, or a
 * `[id]: path` reference definition.
 *
 * Code is skipped: a course that documents markdown prints link syntax as an
 * example, and rewriting it swaps 51 characters for a base64 blob the reader
 * then sees in full. Link shape alone is not enough — inside code it is text.
 */
function* matchReferences(
  markdown: string,
): Generator<{ index: number; length: number; name: string }> {
  const pattern = /(?:\]\(\s*|\]:\s*)([^\s)"']+)/g
  const skip = code(markdown)
  let next = 0
  let match: RegExpExecArray | null

  while ((match = pattern.exec(markdown)) !== null) {
    // Both run left to right, so this resumes rather than rescans.
    while (next < skip.length && skip[next].end <= match.index) next++

    if (next < skip.length && skip[next].start <= match.index) continue

    yield { index: match.index, length: match[0].length, name: match[1] }
  }
}

/** Code regions, in source order and non-overlapping. */
function code(markdown: string): Array<{ start: number; end: number }> {
  const regions: Array<{ start: number; end: number }> = []
  let cursor = 0

  // Fences first, then the inline spans in the gaps between them, so the two
  // kinds cannot overlap and the result is already ordered.
  for (const fence of [...fencedBlocks(markdown), null]) {
    const end = fence ? fence.start : markdown.length

    regions.push(...backtickSpans(markdown, cursor, end))

    if (fence) {
      regions.push(fence)
      cursor = fence.end
    }
  }

  return regions
}

/**
 * Fenced code blocks, ``` or ~~~.
 *
 * Follows CommonMark's closing rule — same character, at least as long as the
 * opener, no info string — because a markdown tutorial nests a ``` block
 * inside a ```` one, which a naive toggle would pair up wrongly. An unclosed
 * fence runs to the end of the document.
 */
function fencedBlocks(markdown: string): Array<{ start: number; end: number }> {
  const blocks: Array<{ start: number; end: number }> = []
  const line = /^[ \t]*(`{3,}|~{3,})(.*)$/gm
  let open: { start: number; marker: string } | null = null
  let match: RegExpExecArray | null

  while ((match = line.exec(markdown)) !== null) {
    const marker = match[1]

    if (open === null) {
      // An info string may not contain a backtick — that is what stops a
      // lone `` `code` `` line opening a block.
      if (marker[0] === '`' && match[2].includes('`')) continue

      open = { start: match.index, marker }
    } else if (
      marker[0] === open.marker[0] &&
      marker.length >= open.marker.length &&
      match[2].trim() === ''
    ) {
      blocks.push({ start: open.start, end: match.index + match[0].length })
      open = null
    }
  }

  if (open !== null) blocks.push({ start: open.start, end: markdown.length })

  return blocks
}

/**
 * Inline code spans within `[start, end)`: a run of backticks closed by the
 * next run of exactly that length. A span may not cross a blank line, so one
 * stray backtick cannot hide the rest of the document.
 */
function* backtickSpans(
  markdown: string,
  start: number,
  end: number,
): Generator<{ start: number; end: number }> {
  const run = /`+/g
  run.lastIndex = start
  let match: RegExpExecArray | null

  while ((match = run.exec(markdown)) !== null && match.index < end) {
    const closer = new RegExp(`(?<!\`)\`{${match[0].length}}(?!\`)`, 'g')
    closer.lastIndex = match.index + match[0].length

    const close = closer.exec(markdown)

    if (close === null || close.index >= end) continue
    if (markdown.slice(match.index, close.index).includes('\n\n')) continue

    yield { start: match.index, end: close.index + close[0].length }
    run.lastIndex = close.index + close[0].length
  }
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
