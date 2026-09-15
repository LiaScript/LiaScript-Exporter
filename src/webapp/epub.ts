'use strict'

/**
 * Browser EPUB export.
 *
 * Mirrors [epub.ts](../export/epub.ts) without Puppeteer: the course is rendered
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
import { render } from './render'
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

  try {
    title = courseTitle(course.document, options)
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

  for (const chapter of chapters) {
    chapter.data = sanitize(externalize(chapter.data, images, seen))
  }

  const cover = await loadCover(options, files)

  const book: Book = {
    title,
    author: authors(options),
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

/** The book's title: the flag, else the course's own heading. */
function courseTitle(doc: Document, options: Record<string, any>): string {
  if (options['epub-title']) return options['epub-title']

  const heading = doc.querySelector('main header .h1, main header .h2')
  const text = heading?.textContent?.trim()

  return text || doc.title || 'LiaScript Course'
}

/** Authors, semicolon-separated as the CLI documents. */
function authors(options: Record<string, any>): string[] {
  const author = options['epub-author']

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
  // Before cloning: shadow roots and computed styles exist only on the live
  // document, and the clone must carry the `data-*-index` tags placed here.
  const charts = extract.charts(doc)
  const abcTerminal = extract.abc(doc, true)
  const abcStandalone = extract.abc(doc, false)
  const formulas = extract.mathml(doc)
  const figures = extract.figures(doc)
  const inlineSvgs = extract.inlineSvgs(doc)
  const code = extract.code(doc, view)
  const terminals = extract.terminals(doc)

  const body = doc.body.cloneNode(true) as HTMLElement

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
    img.removeAttribute('onerror')
    img.removeAttribute('onclick')
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

  // The option itself is worth keeping; the control in front of it is not.
  body
    .querySelectorAll('input, select, textarea')
    .forEach((el) => el.remove())

  // Whatever is left carries ARIA for a widget that no longer exists.
  body.querySelectorAll('[role]').forEach((el) => {
    el.removeAttribute('role')

    Array.from(el.attributes).forEach((attribute) => {
      if (attribute.name.startsWith('aria-')) {
        el.removeAttribute(attribute.name)
      }
    })
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
    const media = figure.querySelector('.lia-figure__media')
    const type = media?.getAttribute('data-media-type')

    if (type !== 'iframe' && type !== 'movie') return

    const url =
      figure.querySelector('a.lia-print-only')?.getAttribute('href') ||
      figure.querySelector('iframe')?.getAttribute('src') ||
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

    wrapper.appendChild(link(doc, url, '▶ Watch video: '))
    figure.replaceWith(wrapper)
  })

  const bare = (selector: string, prefix: string) => {
    body.querySelectorAll(selector).forEach((el) => {
      const url =
        el.getAttribute('src') ||
        el.querySelector('source')?.getAttribute('src') ||
        ''

      if (url) {
        el.replaceWith(link(doc, url, prefix))
      } else {
        el.remove()
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

/** A centred paragraph holding one link. */
function link(doc: Document, url: string, prefix: string): HTMLElement {
  const p = doc.createElement('p')
  p.setAttribute(
    'style',
    'text-align: center; font-size: 0.9em; margin: 0.5em 0;',
  )

  const a = doc.createElement('a')
  a.href = url
  a.textContent = prefix + url

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
      el.innerHTML = ''
      el.appendChild(img)

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

      images.push({ name, mediaType, bytes })

      const href = `images/${name}`
      seen.set(url, href)

      return `${prefix}${href}"`
    },
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
 */
function sanitize(html: string): string {
  const VOID =
    'area|base|br|col|embed|hr|img|input|link|meta|param|source|track|wbr'

  return (
    html
      .replace(/<!--[\s\S]*?-->/g, '')
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
  )
}
