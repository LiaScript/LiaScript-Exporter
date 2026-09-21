'use strict'

/**
 * Browser DOCX export.
 *
 * Mirrors [docx.ts](../export/docx.ts) without Puppeteer: the course is rendered
 * in an iframe ([render.ts](./render.ts)), scraped in place
 * ([extract.ts](./extract.ts)), rewritten into document-shaped HTML here, and
 * handed to `@turbodocx/html-to-docx`, which builds the OOXML zip in memory.
 *
 * Media that cannot be represented (video, iframes, embeds) becomes a labelled
 * link, since nothing here can capture a playing element.
 */

import * as extract from './extract'
import { render } from './render'

/** Where `scripts/copy-webapp-docx.js` puts the converter. */
const CONVERTER = 'docx/html-to-docx.browser.js'

/** Matches the CLI's defaults. */
const DEFAULTS = {
  orientation: 'portrait',
  font: 'Arial',
  /** Half-points: 22 is 11pt. */
  fontSize: 22,
  language: 'en-US',
}

/**
 * The library reaches for two Node globals even in its browser build:
 *
 * - `global`, when deciding whether to return a Buffer or a Blob; without it the
 *   export throws at the very end, after all the work.
 * - `Buffer`, to embed images. The real polyfill is required — a stub forwarding
 *   to `Uint8Array` fails silently, writing zero-byte entries into `word/media/`
 *   with no `<w:drawing>` in the document.
 */
async function load(): Promise<any> {
  const view = window as any

  if (!view.global) view.global = view

  if (!view.Buffer) {
    view.Buffer = (await import('buffer')).Buffer
  }

  if (view.HTMLToDOCX) return view.HTMLToDOCX

  /*
   * Loaded as a script rather than imported: the browser build is an IIFE that
   * assigns `window.HTMLToDOCX` and exports nothing, so a bundler cannot bind to
   * it. The package entry is no alternative — that resolves to the UMD build,
   * which pulls in `fs`.
   */
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement('script')

    script.src = new URL(CONVERTER, location.href).href
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('could not load the DOCX converter'))

    document.head.appendChild(script)
  })

  if (!view.HTMLToDOCX) {
    throw new Error('the DOCX converter loaded but published nothing')
  }

  return view.HTMLToDOCX
}

/** Builds the DOCX for `markdown`, returning the bytes to download. */
export async function exporter(
  markdown: string,
  files: Record<string, Uint8Array> = {},
  options: Record<string, any> = {},
  onProgress?: (message: string) => void,
): Promise<Uint8Array> {
  const HTMLToDOCX = await load()
  const course = await render(markdown, files, options, onProgress)

  let html: string

  try {
    html = await assemble(course.document, course.window, options)
  } finally {
    // Only needed for the scrape; freed before the slow conversion rather than
    // holding a second copy of the course in memory.
    course.dispose()
  }

  onProgress?.('Building document…')

  const result = await HTMLToDOCX(
    html,
    options['docx-header-html'] || null,
    {
      orientation: options['docx-orientation'] || DEFAULTS.orientation,
      title: options['docx-title'] || 'LiaScript Export',
      creator: options['docx-author'] || 'LiaScript Exporter',
      subject: options['docx-subject'],
      description: options['docx-description'],
      lang: options['docx-language'] || DEFAULTS.language,
      font: options['docx-font'] || DEFAULTS.font,
      fontSize: options['docx-font-size'] || DEFAULTS.fontSize,
      table: { row: { cantSplit: false } },
      header: options['docx-header'] ?? false,
      footer: options['docx-footer'] ?? false,
      pageNumber: options['docx-page-number'] ?? false,
    },
    options['docx-footer-html'] || null,
  )

  // Blob in a browser, ArrayBuffer where `global.Buffer` was already present.
  const buffer =
    result instanceof Blob ? await result.arrayBuffer() : (result as ArrayBuffer)

  return new Uint8Array(buffer)
}

/**
 * Rewrites the rendered course into HTML a document converter can take.
 *
 * Everything interactive is replaced with something static: live elements become
 * images, code editors become coloured tables, media becomes links.
 */
async function assemble(
  doc: Document,
  view: Window,
  options: Record<string, any>,
): Promise<string> {
  // First: shadow roots and computed styles are readable only while the
  // document is live, and the rewrite below relies on the `data-*-index` tags
  // these place.
  const charts = extract.charts(doc)
  const abcTerminal = extract.abc(doc, true)
  const abcStandalone = extract.abc(doc, false)
  const formulas = await extract.formulas(doc, view)
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

  swap(
    body,
    'svg[data-inline-svg-index]',
    'data-inline-svg-index',
    inlineSvgs,
    { alt: 'Graphic', figure: true },
  )

  replaceFormulas(body, formulas)
  replaceTerminals(body, terminals)
  replaceCode(body, code)
  captions(body)

  return document_(chapters(body), options)
}

/** Removes chrome that has no place in a document. */
function strip(body: HTMLElement): void {
  body
    .querySelectorAll(
      'link, script, .lia-code__copy, .lia-code__copy--inverted, ' +
        '.lia-code-control, .lia-lightbox__clickarea',
    )
    .forEach((el) => el.remove())

  // Galleries lay out as a flex row, which the converter cannot express.
  body.querySelectorAll('.lia-gallery').forEach((gallery) => {
    gallery.setAttribute('style', 'display: block; margin-bottom: 1em;')
  })

  body.querySelectorAll('img').forEach((img) => {
    img.removeAttribute('loading')
  })

  extract.stripHandlers(body)

  // The converter wants `<img>` as a direct child of `<figure>`.
  body
    .querySelectorAll('figure.lia-figure > .lia-figure__media')
    .forEach((media) => {
      const figure = media.parentElement

      if (!figure || figure.hasAttribute('data-video-index')) return

      /*
       * `data-media-type` lives on this wrapper, and `replaceMedia` runs next
       * and needs it to recognise a video or an iframe. Unwrapping one here
       * would leave the raw `<video>` behind, whose `src` is a course-relative
       * `blob:` URL — dead once the document leaves the app.
       */
      const type = media.getAttribute('data-media-type')

      if (type === 'movie' || type === 'iframe') return

      while (media.firstChild) figure.insertBefore(media.firstChild, media)

      media.remove()
    })
}

/** Turns `<figcaption>` into a styled paragraph after its figure. */
function captions(body: HTMLElement): void {
  body.querySelectorAll('figure > figcaption').forEach((caption) => {
    const figure = caption.parentElement

    if (!figure) return

    const p = figure.ownerDocument.createElement('p')

    p.setAttribute(
      'style',
      'text-align: center; font-style: italic; color: #555; ' +
        'font-size: 0.9em; margin-top: 0.3em; margin-bottom: 1em;',
    )
    p.innerHTML = caption.innerHTML

    figure.parentNode?.insertBefore(p, figure.nextSibling)
    caption.remove()
  })
}

/**
 * Replaces playable media with a link.
 *
 * The CLI screenshots a thumbnail first; here the link carries the information
 * on its own, except for YouTube, whose poster image is fetchable by URL.
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

  // Whatever is left: a bare iframe or video outside a figure.
  const bare = (selector: string, prefix: string) => {
    body.querySelectorAll(selector).forEach((el) => {
      const url =
        el.getAttribute('src') ||
        el.querySelector('source')?.getAttribute('src') ||
        ''

      if (url) {
        el.replaceWith(media(doc, el, url, prefix))
      } else {
        el.remove()
      }
    })
  }

  bare('iframe', '🔗 ')
  bare('video', '▶ ')

  // Embeds are a rich preview of a remote page; the link is the content.
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
 * the document: a remote URL becomes a real link, while a course-relative path
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
  p.setAttribute('style', 'text-align: center; font-size: 0.9em; margin: 0.5em 0;')
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
  p.setAttribute('style', 'text-align: center; font-size: 0.9em; margin: 0.5em 0;')

  const a = doc.createElement('a')
  a.href = url
  // Never the raw URL when a label is given: an inlined source would otherwise
  // put its entire base64 payload on screen as the link text.
  a.textContent = prefix + (label ?? url)
  a.setAttribute('style', 'color: #1a73e8; text-decoration: underline;')

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
 * Replaces `<lia-formula>` with its rendered image.
 *
 * The element is replaced rather than filled: its own text is the screen-reader
 * description ("x, squared, plus, y, squared"), which would otherwise print
 * beside the formula.
 */
function replaceFormulas(
  body: HTMLElement,
  formulas: Map<number, extract.Raster>,
): void {
  const doc = body.ownerDocument

  body.querySelectorAll('lia-formula[data-formula-index]').forEach((el) => {
    const formula = formulas.get(Number(el.getAttribute('data-formula-index')))

    if (!formula) {
      el.remove()
      return
    }

    const img = doc.createElement('img')

    img.src = formula.source
    img.alt = el.textContent?.trim() || 'Formula'

    // Placed at the size it was measured at, not its pixel size: the capture is
    // taken at 2×, so otherwise every formula lands at twice its intended size.
    img.setAttribute('width', String(formula.width))
    img.setAttribute('height', String(formula.height))

    const block = el.getAttribute('displaymode') === 'true'

    if (!block) {
      // Inline formulas sit on the text baseline, not on their own line.
      img.setAttribute('style', 'vertical-align: middle;')
      el.replaceWith(img)
      return
    }

    const wrapper = doc.createElement('div')
    wrapper.setAttribute('style', 'text-align: center; margin: 1em 0;')
    wrapper.appendChild(img)

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

/** Joins the course's `<main>` sections into one flow, each under its title. */
function chapters(body: HTMLElement): string {
  const mains = body.querySelectorAll('main')

  if (mains.length === 0) return body.innerHTML

  let html = ''

  mains.forEach((main, index) => {
    const header = main.querySelector('header')
    const heading = header?.querySelector('.h1, .h2, .h3, .h4, .h5, .h6')
    const title = heading?.textContent?.trim() || `Chapter ${index + 1}`

    // The title is emitted as a real heading; the rendered header is chrome.
    header?.remove()

    html += `<h1>${title}</h1>${main.innerHTML}`
  })

  return html
}

/** Wraps the body in a document the converter will accept. */
function document_(body: string, options: Record<string, any>): string {
  const language = options['docx-language'] || DEFAULTS.language
  const title = options['docx-title'] || 'LiaScript Export'

  return `<!DOCTYPE html>
<html lang="${language}">
<head><meta charset="UTF-8" /><title>${title}</title></head>
<body>${body}</body>
</html>`
}
