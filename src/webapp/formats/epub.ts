'use strict'

/**
 * Browser EPUB export.
 *
 * Mirrors [epub.ts](../../export/epub.ts) without Puppeteer: the course is rendered
 * in an iframe ([render.ts](./render.ts)), scraped in place
 * ([extract.ts](./extract.ts)), rewritten into XHTML chapters here, and packaged
 * by [epub-builder.ts](./epub-builder.ts).
 *
 * Two things set it apart from the DOCX path, both because EPUB is HTML
 * underneath rather than a foreign document format:
 *
 * - Formulas stay **MathML**. EPUB 3 renders it natively, so they remain
 *   selectable and scale with the reader's font, where DOCX needs a screenshot.
 * - Chapters stay **separate**. Each `<main>` becomes its own XHTML file and an
 *   entry in the table of contents, where DOCX concatenates them into one flow.
 */

import * as extract from './extract'
import { render, EMBED_SRC } from './render'
import { build, Book, Chapter, Resource } from './epub-builder'

/** Matches the CLI's defaults. */
const DEFAULTS = {
  language: 'en',
  tocTitle: 'Table Of Contents',
  appendChapterTitles: true,
  hideToC: false,
}

/** Builds the EPUB for `markdown`, returning the bytes to download. */
export async function exporter(
  markdown: string,
  files: Record<string, Uint8Array> = {},
  options: Record<string, any> = {},
  onProgress?: (message: string) => void,
): Promise<Uint8Array> {
  const course = await render(markdown, files, options, onProgress)

  let chapters: Chapter[]
  let title: string
  let author: string | undefined

  try {
    // The flags win, else the course's own heading and `author:`, as in the CLI.
    title =
      options['epub-title'] ||
      extract.courseTitle(course.document) ||
      'LiaScript Course'
    author = options['epub-author'] || extract.courseAuthor(course.document)
    chapters = assemble(course.document, course.window)
  } finally {
    // Only needed for the scrape; freed before packaging rather than holding a
    // second copy of the course in memory.
    course.dispose()
  }

  onProgress?.('Building book…')

  // Images arrive inline, as data URLs, from both the course's own markup and
  // everything rewritten into an image above. They are lifted back out into
  // real files so the package stays a fraction of the size base64 would make it.
  const images: Resource[] = []

  // Shared across chapters, not per chapter: the same diagram or logo usually
  // appears in several, and each copy would otherwise become its own file.
  const seen = new Map<string, string>()

  let packaged = 0
  let failed = 0

  for (const [index, chapter] of chapters.entries()) {
    // Before `externalize`, which then treats them as any other local image.
    const fetched = await absorb(chapter.data, images, seen)

    packaged += fetched.packaged
    failed += fetched.failed

    if (fetched.packaged || fetched.failed) {
      onProgress?.(
        `Fetching linked images (chapter ${index + 1} of ${chapters.length})…`,
      )
    }

    chapter.data = sanitize(externalize(fetched.html, images, seen))
  }

  if (packaged || failed) {
    onProgress?.(
      `Packaged ${packaged} linked image${packaged === 1 ? '' : 's'}` +
        (failed ? `; ${failed} could not be fetched` : ''),
    )
  }

  const cover = await loadCover(options, files)

  const book: Book = {
    title,
    author: authors(author),
    lang: options['epub-language'] || DEFAULTS.language,
    publisher: options['epub-publisher'],
    description: options['epub-description'],
    tocTitle: options['epub-toc-title'] || DEFAULTS.tocTitle,
    // The CLI reads a custom chapter title as "do not repeat titles".
    appendChapterTitles:
      options['epub-chapter-title'] === undefined &&
      DEFAULTS.appendChapterTitles,
    hideToC: options['epub-hide-toc'] ?? DEFAULTS.hideToC,
    css: options['epub-css'],
    chapters,
    images,
    // The CLI embeds the render's own fonts, read off disk. In the browser they
    // are not reachable as files, and readers substitute their own anyway.
    fonts: [],
    cover,
  }

  return build(book)
}

/** Authors, semicolon-separated as the CLI documents. */
function authors(author: string | undefined): string[] {
  if (!author) return ['Unknown']

  return String(author)
    .split(';')
    .map((name) => name.trim())
    .filter(Boolean)
}

/**
 * Fetches the cover image, if one was given.
 *
 * Accepts an uploaded file as readily as a URL: the flag carries a path for the
 * CLI, and in the browser that path is a key into the course's own files.
 */
async function loadCover(
  options: Record<string, any>,
  files: Record<string, Uint8Array>,
): Promise<Resource | undefined> {
  const source = options['epub-cover']

  if (!source) return undefined

  const local = files[source] || files[source.replace(/^\.?\//, '')]

  if (local) {
    return {
      name: `cover.${extension(mediaTypeFor(source))}`,
      mediaType: mediaTypeFor(source),
      bytes: local,
    }
  }

  try {
    const response = await fetch(source)

    if (!response.ok) throw new Error(`status ${response.status}`)

    const bytes = new Uint8Array(await response.arrayBuffer())
    const mediaType =
      response.headers.get('content-type')?.split(';')[0] ||
      mediaTypeFor(source)

    return { name: `cover.${extension(mediaType)}`, mediaType, bytes }
  } catch (error) {
    // A missing cover is not worth failing an otherwise complete book over.
    console.warn('could not load the cover image:', error)

    return undefined
  }
}

/**
 * Rewrites the rendered course into one XHTML fragment per chapter.
 *
 * Everything interactive is replaced with something static, as in the DOCX path
 * — except formulas, which stay as markup.
 */
function assemble(doc: Document, view: Window): Chapter[] {
  // First: shadow roots and computed styles are readable only while the
  // document is live, and the rewrite below relies on the `data-*-index` tags
  // these place.
  const charts = extract.charts(doc)
  const abcTerminal = extract.abc(doc, true)
  const abcStandalone = extract.abc(doc, false)
  const formulas = extract.mathml(doc)
  const figures = extract.figures(doc)
  const inlineSvgs = extract.inlineSvgs(doc)
  const code = extract.code(doc, view)
  const terminals = extract.terminals(doc)

  // Rewritten in place rather than on a clone.
  const body = doc.body

  strip(body)
  replaceMedia(body)

  swap(body, 'lia-chart[data-chart-index]', 'data-chart-index', charts, {
    alt: (el) => el.getAttribute('aria-label') || 'Chart',
    figure: true,
  })

  swap(
    body,
    '.lia-code-terminal[data-abc-index]',
    'data-abc-index',
    abcTerminal,
    { alt: 'ABC Music Notation', figure: true },
  )

  swap(
    body,
    'lia-abcjs[data-standalone-abc-index]',
    'data-standalone-abc-index',
    abcStandalone,
    { alt: 'ABC Music Notation', figure: true },
  )

  swap(body, 'figure.lia-figure[data-svg-index]', 'data-svg-index', figures, {
    alt: 'Diagram',
    reuse: true,
    figureStyle:
      'margin: 1.5em auto; padding: 1.5em; background-color: #f8f9fa; ' +
      'border: 1px solid #dee2e6; border-radius: 4px; text-align: center; ' +
      'page-break-inside: avoid; max-width: 90%;',
  })

  swap(body, 'svg[data-inline-svg-index]', 'data-inline-svg-index', inlineSvgs, {
    alt: 'Graphic',
    figure: true,
  })

  replaceFormulas(body, formulas)
  replaceTerminals(body, terminals)
  replaceCode(body, code)
  extract.unlinkLocal(body)

  return chapters(body)
}

/** Removes chrome that has no place in a book. */
function strip(body: HTMLElement): void {
  body
    .querySelectorAll(
      'link, script, style, .lia-code__copy, .lia-code__copy--inverted, ' +
        '.lia-code-control, .lia-lightbox__clickarea',
    )
    .forEach((el) => el.remove())

  body.querySelectorAll('img').forEach((img) => {
    img.removeAttribute('loading')
  })

  /*
   * LiaScript sizes a figure with a bare `width` attribute, which XHTML allows
   * on no element but a handful of media ones — on a `<figure>` it is a
   * validity error. The value is carried into CSS, where it belongs, rather
   * than dropped.
   */
  body.querySelectorAll('figure[width], figcaption[width]').forEach((el) => {
    const width = el.getAttribute('width')

    el.removeAttribute('width')

    if (width && /^\d+$/.test(width)) {
      const style = el.getAttribute('style') || ''

      el.setAttribute('style', `${style};max-width:${width}px;`.replace(/^;/, ''))
    }
  })

  unwrapFigures(body)
  strand(body)
}

/**
 * Lifts figures out of the paragraphs they were written in.
 *
 * An image written inline in a sentence still renders as a `<figure>`, and a
 * `<figure>` inside a `<p>` is "element figure not allowed here" — a paragraph
 * takes inline content only. Rather than unwrap the figure (losing its caption)
 * the paragraph is split around it, which is what a browser does with the same
 * markup anyway.
 */
function unwrapFigures(body: HTMLElement): void {
  body.querySelectorAll('p figure').forEach((figure) => {
    const paragraph = figure.closest('p')

    if (!paragraph?.parentNode) return

    paragraph.parentNode.insertBefore(figure, paragraph.nextSibling)
  })

  // A paragraph that held nothing but the figure is now empty.
  body.querySelectorAll('p').forEach((paragraph) => {
    if (!paragraph.textContent?.trim() && !paragraph.querySelector('img')) {
      paragraph.remove()
    }
  })
}

/**
 * Removes what only works in a live document.
 *
 * A quiz cannot be answered in a book, so its controls go and its options stay
 * as a plain list. This is also a validity matter, not only a tidiness one:
 * EPUB's XHTML profile rejects the markup LiaScript uses for them — a bare
 * `role` on a `<label>` or `<input>` is "attribute role not allowed here", and
 * a `role="radio"` input without `aria-checked` is an error in its own right.
 */
function strand(body: HTMLElement): void {
  // Buttons do nothing on a page that cannot run scripts.
  body
    .querySelectorAll(
      'button, .lia-quiz__control, .lia-survey__control, .lia-btn',
    )
    .forEach((el) => el.remove())

  body.querySelectorAll('select, textarea').forEach((el) => el.remove())

  // Choices and tasks keep a printed box that shows their state, as in the
  // CLI; any other input goes.
  body.querySelectorAll('input').forEach((input) => {
    const kind = `${input.type} ${input.getAttribute('role') || ''} ${input.className}`
    const mark = /radio/.test(kind)
      ? input.checked ? '◉ ' : '○ '
      : /checkbox/.test(kind)
        ? input.checked ? '☑ ' : '☐ '
        : ''

    input.replaceWith(input.ownerDocument.createTextNode(mark))
  })

  // Whatever is left carries ARIA for a widget that no longer exists.
  body.querySelectorAll('[role]').forEach((el) => {
    el.removeAttribute('role')

    Array.from(el.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('aria-')) {
        el.removeAttribute(attribute.name)
      }
    })
  })

  // A label takes inline content only, and LiaScript puts block content in
  // them: each quiz option's `<div>`, a code tab's `<h3>`.
  body.querySelectorAll('label').forEach((label) => {
    const div = label.ownerDocument.createElement('div')

    Array.from(label.attributes).forEach((a) => div.setAttribute(a.name, a.value))
    while (label.firstChild) div.appendChild(label.firstChild)

    label.replaceWith(div)
  })

  dropdowns(body)
  tables(body)
  extract.stripHandlers(body)
}

/**
 * Prints a selection quiz's options in place: `[blue | red | green]`.
 *
 * The dropdown sits inside the sentence's `<p>` and holds its options as
 * `<div>`s, which a paragraph cannot contain; a book cannot open it anyway.
 */
function dropdowns(body: HTMLElement): void {
  body.querySelectorAll('.lia-dropdown').forEach((dropdown) => {
    const options = Array.from(
      dropdown.querySelectorAll('.lia-dropdown__option'),
      (option) => option.textContent?.trim() ?? '',
    ).filter(Boolean)

    const span = dropdown.ownerDocument.createElement('span')
    span.textContent = `[${options.join(' | ')}]`

    dropdown.replaceWith(span)
  })
}

/**
 * Repairs table markup that XHTML rejects: header cells straight inside a
 * `<thead>` (the survey matrix) get their row, and the footnote table's
 * `align`/`valign` attributes become CSS.
 */
function tables(body: HTMLElement): void {
  body.querySelectorAll('thead, tbody, tfoot').forEach((section) => {
    let row: HTMLTableRowElement | null = null

    Array.from(section.childNodes).forEach((node) => {
      if (node.nodeName === 'TH' || node.nodeName === 'TD') {
        if (!row) {
          row = section.ownerDocument.createElement('tr')
          section.insertBefore(row, node)
        }
        row.appendChild(node)
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        row = null
      }
    })
  })

  body.querySelectorAll('[align], [valign]').forEach((el) => {
    const align = el.getAttribute('align')
    const valign = el.getAttribute('valign')
    const style = el.getAttribute('style') || ''

    el.removeAttribute('align')
    el.removeAttribute('valign')

    // On a table, `align` floats it — nothing a reflowing book should copy.
    const rules = [
      align && el.tagName !== 'TABLE' ? `text-align: ${align};` : '',
      valign ? `vertical-align: ${valign};` : '',
    ].join(' ').trim()

    if (rules) {
      el.setAttribute('style', style ? `${style.replace(/;?\s*$/, ';')} ${rules}` : rules)
    }
  })
}

/**
 * Replaces playable media with a link.
 *
 * A reader cannot play an embed or an iframe, and nothing here can capture one,
 * so the link carries the information instead — except for YouTube, whose
 * poster image is fetchable by URL.
 */
function replaceMedia(body: HTMLElement): void {
  const doc = body.ownerDocument

  body.querySelectorAll('figure.lia-figure').forEach((figure) => {
    const holder = figure.querySelector('.lia-figure__media')
    const type = holder?.getAttribute('data-media-type')

    if (type !== 'iframe' && type !== 'movie') return

    const url =
      figure.querySelector('a.lia-print-only')?.getAttribute('href') ||
      figure.querySelector('iframe')?.getAttribute('src') ||
      figure.querySelector('iframe')?.getAttribute(EMBED_SRC) ||
      figure.querySelector('video')?.getAttribute('src') ||
      figure.querySelector('video source')?.getAttribute('src') ||
      ''

    const wrapper = doc.createElement('div')
    wrapper.setAttribute(
      'style',
      'margin: 1em 0; text-align: center; page-break-inside: avoid;',
    )

    const youtube = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/,
    )

    if (youtube) {
      const img = doc.createElement('img')
      img.src = `https://img.youtube.com/vi/${youtube[1]}/hqdefault.jpg`
      img.alt = 'Video'
      img.setAttribute(
        'style',
        'max-width: 100%; height: auto; display: block; margin: 0 auto;',
      )
      wrapper.appendChild(img)
    }

    // A YouTube thumbnail already carries the title, so the link only has to
    // point somewhere; a local file still cannot be linked to at all.
    wrapper.appendChild(media(doc, figure, url, '▶ Watch video: '))

    const anchor = figure.parentElement
    const target = anchor?.tagName === 'A' ? anchor : figure

    target.replaceWith(wrapper)
  })

  const bare = (selector: string, prefix: string) => {
    body.querySelectorAll(selector).forEach((el) => {
      const url =
        el.getAttribute('src') ||
        el.getAttribute(EMBED_SRC) ||
        el.querySelector('source')?.getAttribute('src') ||
        ''

      // The whole figure, as in the CLI: the label is a `<p>`, and the
      // figure's own wrappers are `<span>`s it cannot sit in.
      const target = el.closest('figure.lia-figure') ?? el

      if (url) {
        target.replaceWith(media(doc, el, url, prefix))
      } else {
        target.remove()
      }
    })
  }

  bare('iframe', '🔗 ')
  bare('video', '▶ ')
  bare('audio', '🔊 ')

  body.querySelectorAll('lia-embed').forEach((embed) => {
    const url = embed.getAttribute('url') || embed.getAttribute('src') || ''

    if (url) {
      embed.replaceWith(link(doc, url, '🔗 '))
    } else {
      embed.remove()
    }
  })
}

/**
 * Stands in for a media element the format cannot play.
 *
 * What the reader gets depends on whether the source is reachable from outside
 * the book: a remote URL becomes a real link, while a course-relative path
 * cannot resolve once the file is out of the app, so it is named rather than
 * linked. The label prefers the author's own words — `alt`, then `title`, then
 * `aria-label` — and falls back to the file's name so the reader can still tell
 * that something was left out.
 */
function media(
  doc: Document,
  el: Element,
  url: string,
  prefix: string,
): HTMLElement {
  const described =
    el.getAttribute('alt') ||
    el.getAttribute('title') ||
    el.querySelector('a.lia-print-only')?.textContent ||
    el.querySelector('figcaption')?.textContent ||
    ''

  const label = described.trim() || extract.filename(url)

  if (extract.isRemote(url)) {
    return link(doc, url, prefix, label)
  }

  const p = doc.createElement('p')
  p.setAttribute(
    'style',
    'text-align: center; font-size: 0.9em; margin: 0.5em 0;',
  )
  p.textContent = prefix + label

  return p
}

/** A centred paragraph holding one link. */
function link(
  doc: Document,
  url: string,
  prefix: string,
  label?: string,
): HTMLElement {
  const p = doc.createElement('p')
  p.setAttribute(
    'style',
    'text-align: center; font-size: 0.9em; margin: 0.5em 0;',
  )

  const a = doc.createElement('a')
  a.href = url
  // Never the raw URL when a label is given: an inlined source would otherwise
  // put its entire base64 payload on screen as the link text.
  a.textContent = prefix + (label ?? url)

  p.appendChild(a)

  return p
}

/** Replaces tagged elements with their extracted image. */
function swap(
  body: HTMLElement,
  selector: string,
  attribute: string,
  images: Map<number, string>,
  options: {
    alt: string | ((el: Element) => string)
    /** Wrap the image in a new `<figure>`. */
    figure?: boolean
    /** Keep the element and put the image inside it. */
    reuse?: boolean
    figureStyle?: string
  },
): void {
  const doc = body.ownerDocument

  body.querySelectorAll(selector).forEach((el) => {
    const source = images.get(Number(el.getAttribute(attribute)))

    if (!source) {
      el.remove()
      return
    }

    const img = doc.createElement('img')
    img.src = source
    img.alt = typeof options.alt === 'function' ? options.alt(el) : options.alt
    img.setAttribute(
      'style',
      'max-width: 100%; height: auto; display: block; margin: 0 auto;',
    )

    if (options.reuse) {
      // The figure's own caption (ASCII art's title) stays.
      const caption = el.querySelector(':scope > figcaption')
      el.replaceChildren(img, ...(caption ? [caption] : []))

      if (options.figureStyle) el.setAttribute('style', options.figureStyle)
    } else if (options.figure) {
      const figure = doc.createElement('figure')
      figure.setAttribute(
        'style',
        options.figureStyle ||
          'margin: 1.5em auto; text-align: center; page-break-inside: avoid;',
      )
      figure.appendChild(img)
      el.replaceWith(figure)
    } else {
      el.replaceWith(img)
    }
  })
}

/**
 * Replaces `<lia-formula>` with its MathML.
 *
 * The element is replaced rather than filled: its own text is the screen-reader
 * description ("x, squared, plus, y, squared"), which would otherwise print
 * beside the formula.
 */
function replaceFormulas(
  body: HTMLElement,
  formulas: Map<number, string>,
): void {
  const doc = body.ownerDocument

  body.querySelectorAll('lia-formula[data-formula-index]').forEach((el) => {
    const math = formulas.get(Number(el.getAttribute('data-formula-index')))

    if (!math) {
      el.remove()
      return
    }

    const block = el.getAttribute('displaymode') === 'true'

    /*
     * A `<span>` even for a block formula, styled to behave as one: the
     * formula sits inside the paragraph it was written in, and a `<div>` there
     * is a validity error ("element div not allowed here"), since a paragraph
     * may only contain inline content.
     */
    const wrapper = doc.createElement('span')

    wrapper.innerHTML = math

    // `display` is what tells a reader to centre a block formula on its own
    // line; KaTeX's MathML does not carry it.
    const root = wrapper.querySelector('math')

    if (root) root.setAttribute('display', block ? 'block' : 'inline')

    if (block) {
      wrapper.setAttribute(
        'style',
        'display: block; text-align: center; margin: 1em 0;',
      )
    }

    el.replaceWith(wrapper)
  })
}

/** Replaces terminal blocks with their static rendering. */
function replaceTerminals(
  body: HTMLElement,
  terminals: Map<number, string>,
): void {
  const doc = body.ownerDocument

  body.querySelectorAll('.lia-code-terminal').forEach((terminal) => {
    // A terminal holding an image was already replaced — an ABC block, or a
    // formula. That image is its output, so it is unwrapped rather than
    // re-rendered as terminal text.
    const image = terminal.querySelector('img')

    if (image) {
      terminal.replaceWith(image)
      return
    }

    // A terminal that rendered a formula (the `@runFormula` macro) keeps it.
    const math = terminal.querySelector('math')

    if (math) {
      const wrapper = doc.createElement('div')
      wrapper.setAttribute('style', 'text-align: center; margin: 1em 0;')
      math.setAttribute('display', 'block')
      wrapper.appendChild(math.cloneNode(true))
      terminal.replaceWith(wrapper)
      return
    }

    const html = terminals.get(
      Number(terminal.getAttribute('data-terminal-index')),
    )

    if (html) {
      const wrapper = doc.createElement('div')
      wrapper.innerHTML = html
      terminal.replaceWith(wrapper.firstChild || wrapper)
    } else {
      terminal.remove()
    }
  })
}

/** Replaces Ace editors with their static, coloured rendering. */
function replaceCode(body: HTMLElement, code: Map<number, string>): void {
  const doc = body.ownerDocument

  body.querySelectorAll('.lia-code__input').forEach((input) => {
    const html = code.get(Number(input.getAttribute('data-code-index')))

    if (!html) {
      input.remove()
      return
    }

    const wrapper = doc.createElement('div')
    wrapper.innerHTML = html

    const node = wrapper.firstChild || wrapper
    const block = input.parentElement?.classList.contains('lia-code--block')
      ? input.parentElement
      : null

    // Insert before the block so a sibling terminal keeps its position.
    if (block) {
      block.parentElement?.insertBefore(node, block)
      input.remove()
    } else {
      input.replaceWith(node)
    }
  })
}

/** Splits the course's `<main>` sections into chapters. */
function chapters(body: HTMLElement): Chapter[] {
  const mains = body.querySelectorAll('main')

  if (mains.length === 0) {
    return [{ title: 'Content', data: body.innerHTML }]
  }

  const list: Chapter[] = []

  mains.forEach((main, index) => {
    const header = main.querySelector('header')
    const heading = header?.querySelector('.h1, .h2, .h3, .h4, .h5, .h6')
    const title = heading?.textContent?.trim() || `Chapter ${index + 1}`

    // The builder emits the title itself; the rendered header is chrome.
    header?.remove()

    list.push({ title, data: main.innerHTML })
  })

  return list
}

/**
 * Packages images the course only links to.
 *
 * An EPUB is a sealed container, so a chapter pointing at `https://…` shows a
 * broken image offline. Mirrors the CLI's own pass ([epub.ts](../../export/epub.ts),
 * "Fetching external/URL-based images as data URIs"), with two differences: the
 * fetches are sequential, since a large course already peaks near the browser's
 * memory ceiling, and each one is given a timeout.
 *
 * Failures are counted rather than swallowed, because a good share of them are
 * permanent — a host sending no CORS header is unreadable to any browser, and a
 * dead URL has nothing to fetch — and the count is what tells those apart from
 * having dropped everything silently.
 */
async function absorb(
  html: string,
  images: Resource[],
  seen: Map<string, string>,
): Promise<{ html: string; packaged: number; failed: number }> {
  const PATTERN = /(<img\b[^>]*?\bsrc=")(https?:\/\/[^"]+)"/g
  const TIMEOUT_MS = 15000

  // Collected up front, since `replace` cannot await the fetches.
  const urls = Array.from(html.matchAll(PATTERN), (match) => match[2])

  let packaged = 0
  let failed = 0

  for (const url of new Set(urls)) {
    if (seen.has(url)) continue

    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      })

      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const buffer = await response.arrayBuffer()

      // The URL is only the fallback: a thumbnail endpoint may have no extension.
      const served = response.headers.get('content-type')?.split(';')[0]?.trim()
      const mediaType =
        served && served.startsWith('image/') ? served : mediaTypeFor(url)

      let bytes: Uint8Array = new Uint8Array(buffer)

      // Parsed as standalone XML, so out of reach of the chapter-level repairs.
      if (mediaType === 'image/svg+xml') bytes = repairSvg(bytes)

      const name = `image_${images.length}.${extension(mediaType)}`

      images.push({ name, mediaType, bytes })
      seen.set(url, `images/${name}`)

      packaged += 1
    } catch (error) {
      // Left pointing at the remote URL, which still resolves online: a failure
      // degrades to the old behaviour rather than losing the reference.
      console.warn('could not package a remote image:', url, error)

      failed += 1
    }
  }

  return {
    html: html.replace(PATTERN, (match, prefix: string, url: string) => {
      const href = seen.get(url)

      return href ? `${prefix}${href}"` : match
    }),
    packaged,
    failed,
  }
}

/**
 * Lifts inline images out of the markup and into real files.
 *
 * Data URLs would otherwise survive into the package at 4/3 their byte size,
 * repeated in full for every use — and a course is mostly images by weight.
 * Identical images collapse onto one file through `seen`, which the caller owns
 * so that a diagram reused across chapters is still stored once.
 */
function externalize(
  html: string,
  images: Resource[],
  seen: Map<string, string>,
): string {
  return html.replace(
    /(<img\b[^>]*?\bsrc=")(data:([^;,"]+);base64,([^"]*))"/g,
    (match, prefix: string, url: string, mediaType: string, data: string) => {
      const existing = seen.get(url)

      if (existing) return `${prefix}${existing}"`

      let bytes: Uint8Array

      try {
        bytes = decode(data)
      } catch (error) {
        // A malformed data URL is left as it was: readers vary in what they
        // accept, and dropping the image outright is the worse outcome.
        console.warn('could not decode an inline image:', error)

        return match
      }

      const name = `image_${images.length}.${extension(mediaType)}`

      // Becomes its own file, parsed as standalone XML rather than as part of
      // a chapter, so the chapter-level repairs never reach it.
      if (mediaType === 'image/svg+xml') bytes = repairSvg(bytes)

      images.push({ name, mediaType, bytes })

      const href = `images/${name}`
      seen.set(url, href)

      return `${prefix}${href}"`
    },
  )
}

/**
 * Strips comments from an extracted SVG, which `sanitize()` never sees.
 *
 * These are hand-written by the course author, who writes prose in them, and a
 * `--` there is a fatal XML error ("From Error to P -- to summing").
 */
function repairSvg(bytes: Uint8Array): Uint8Array {
  const source = new TextDecoder().decode(bytes)
  // A formula in ASCII art carries its MathML along, see `extract.figures`.
  const svg = mathSpaces(source.replace(/<!--[\s\S]*?-->/g, ''))

  return svg === source ? bytes : new TextEncoder().encode(svg)
}

/**
 * MathML allows no text between its elements, and KaTeX writes a thin space
 * there; it becomes the equivalent `<mspace>`, as in the CLI.
 */
function mathSpaces(html: string): string {
  return html.replace(/<math\b[\s\S]*?<\/math>/g, (math) =>
    math.replace(/(<\/m[a-z]+>)([^<]+)(?=<m)/g, (_match, close: string, text: string) =>
      /^[ \t\r\n]*$/.test(text) ? close : `${close}<mspace width="0.1667em"></mspace>`,
    ),
  )
}

/** Decodes base64 to bytes. */
function decode(base64: string): Uint8Array {
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return bytes
}

/** Filename extension for a media type. */
function extension(mediaType: string): string {
  switch (mediaType) {
    case 'image/svg+xml':
      return 'svg'
    case 'image/jpeg':
      return 'jpg'
    default:
      // `image/png` → `png`, and anything unrecognised gets its own subtype,
      // which is right far more often than a fixed default would be.
      return mediaType.split('/')[1]?.replace(/\+.*/, '') || 'png'
  }
}

/** Guesses a media type from a filename or URL. */
function mediaTypeFor(source: string): string {
  const match = source.toLowerCase().match(/\.(\w+)(?:\?.*)?$/)

  switch (match?.[1]) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg'
    case 'gif':
      return 'image/gif'
    case 'svg':
      return 'image/svg+xml'
    case 'webp':
      return 'image/webp'
    default:
      return 'image/png'
  }
}

/**
 * Makes chapter markup safe to parse as XML.
 *
 * Every reader parses these files as XML, which is far less forgiving than the
 * HTML the render produces. Three things have to be fixed, all of them found
 * the same way by the CLI:
 *
 * - Void elements must be closed. `<br>` and `<img ...>` are valid HTML and a
 *   fatal XML error.
 * - Comments cannot contain `--`, which XML forbids inside a comment body.
 *   Dropping them wholesale is simpler than repairing them and loses nothing.
 * - A namespace-prefixed tag that is not a real element — `<jc:trillian.mit.edu>`,
 *   as written in prose — is an undeclared namespace and fails the parse, so it
 *   is escaped back into the text it was meant to be.
 * - `&nbsp;` is undeclared in XHTML. It is the only named reference that reaches
 *   output: the chapters come from `innerHTML`, whose serializer emits it for
 *   U+00A0 and decodes every other named entity to a literal character.
 * - An inline `<svg>` may use `xlink:href` without declaring the prefix, which
 *   is only ever bound to the one URI. Declared per element, so a sibling `<svg>`
 *   that does not use it stays untouched.
 * - Chartist binds the reserved xmlns namespace on the label spans inside a
 *   chart's `<foreignObject>`. That is fatal in XML and means nothing on a span.
 * - Text between MathML elements, see `mathSpaces`.
 */
function sanitize(html: string): string {
  const VOID =
    'area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr'

  const XLINK = 'http://www.w3.org/1999/xlink'

  return mathSpaces(
    html
      .replace(/<!--[\s\S]*?-->/g, '')
      .replace(/&nbsp;/g, '&#160;')
      .replace(/\s+xmlns="http:\/\/www\.w3\.org\/2000\/xmlns\/"/g, '')
      // Close void elements, leaving ones already self-closed alone.
      .replace(
        new RegExp(`<(${VOID})\\b([^>]*?)\\s*/?>`, 'gi'),
        (_match, tag: string, attributes: string) =>
          `<${tag}${attributes.replace(/\s+$/, '')} />`,
      )
      .replace(
        /<((?!\/?\s*(?:svg|math|xlink|xml|xmlns|epub)[:\s>])[a-zA-Z][a-zA-Z0-9]*:[^\s>]+[^>]*)>/g,
        '&lt;$1&gt;',
      )
      // Matched whole, so the prefix test sees this SVG's content alone.
      .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/g, (element) => {
        const open = element.slice(0, element.indexOf('>') + 1)

        if (!element.includes('xlink:') || open.includes('xmlns:xlink')) {
          return element
        }

        return (
          open.replace(/\s*\/?>$/, ` xmlns:xlink="${XLINK}">`) +
          element.slice(open.length)
        )
      })
  )
}
