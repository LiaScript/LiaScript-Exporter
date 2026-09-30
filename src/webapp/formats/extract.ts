'use strict'

/**
 * Pulls rendered content out of a course document.
 *
 * The browser counterpart to the `page.evaluate` helpers in
 * [docx.ts](../../export/docx.ts) and [epub.ts](../../export/epub.ts). Those marshal
 * results through Puppeteer as JSON, tagging elements with `data-*-index`
 * attributes and rebuilding the mapping on the far side. Here the document is in
 * hand, so each helper returns a `Map` keyed by the same index — the tagging is
 * kept because the replacement pass still looks elements up by it.
 *
 * What has no counterpart is `elementHandle.screenshot()`. Two things stand in:
 *
 * - Anything already drawn as SVG — charts, ABC notation, figures, inline
 *   graphics — is serialised rather than rasterised ({@link serializeSvg}),
 *   which is lossless and what the CLI does for those cases anyway.
 * - Formulas are rasterised with `html2canvas` ({@link formulas}), because a
 *   document converter cannot render MathML and KaTeX's output is HTML, not SVG.
 */

import * as path from '../../fs/path'

/**
 * Whether a URL still resolves once the document leaves the app.
 *
 * A course's own files reach the render as `blob:` URLs and its markdown
 * references them relatively, so neither survives export — only an absolute
 * remote address means anything to a reader opening the file elsewhere.
 */
export function isRemote(url: string): boolean {
  return /^(https?:|\/\/)/i.test(url)
}

/**
 * The course's title as the render shows it: the first slide's heading, else
 * the document title. Read before the render is disposed.
 */
export function courseTitle(doc: Document): string | undefined {
  const heading = doc.querySelector('main header .h1, main header .h2')

  return heading?.textContent?.trim() || doc.title || undefined
}

/**
 * The course's `author:`, which LiaScript writes into `<meta name="author">`
 * once the course is parsed — where the CLI reads it off the parsed JSON.
 */
export function courseAuthor(doc: Document): string | undefined {
  return (
    doc.querySelector('meta[name="author"]')?.getAttribute('content')?.trim() ||
    undefined
  )
}

/**
 * The file's own name, for labelling media that carries no description.
 */
export function filename(url: string): string {
  if (/^data:/i.test(url)) return 'Media'

  return path.basename(url.split(/[?#]/)[0]) || 'Media'
}

/**
 * Removes the inline event handlers LiaScript renders with.
 */
export function stripHandlers(body: HTMLElement): void {
  // Named rather than found by scanning every attribute of every element,
  // which is ~100k visits on a big course. The quiz dropdown uses the key and
  // focus ones.
  const handlers = [
    'onload',
    'onerror',
    'onclick',
    'onkeydown',
    'onkeyup',
    'onfocus',
    'onblur',
    'oninput',
    'onchange',
  ]

  body
    .querySelectorAll(handlers.map((name) => `[${name}]`).join(','))
    .forEach((el) => handlers.forEach((name) => el.removeAttribute(name)))
}

/**
 * Unwraps links to course files (the audio gallery, relative hrefs): in the
 * render they are `blob:` URLs of this tab, dead once the document leaves the
 * app. What they show is kept. The CLI does the same for its `file:` URLs, and
 * likewise keeps `mailto:`.
 */
export function unlinkLocal(body: HTMLElement): void {
  body.querySelectorAll('a[href]').forEach((a) => {
    const href = a.getAttribute('href') || ''

    if (isRemote(href) || /^(#|mailto:)/i.test(href)) return

    a.replaceWith(...Array.from(a.childNodes))
  })
}

/** Escapes text for inclusion in HTML. */
function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Ace pads its DOM with zero-width characters that must not reach the output. */
function clean(text: string): string {
  return text.replace(/[​-‍﻿]/g, '')
}

/**
 * Encodes markup as a base64 data URL.
 *
 * Every detail here is load-bearing, and getting one wrong drops the image
 * silently — no `word/media/` entry, no `<w:drawing>` in the document:
 *
 * - Base64, not percent-encoding: `@turbodocx/html-to-docx` runs a non-URL `src`
 *   through `decodeURIComponent` and then expects a base64 data URI.
 * - The media type must be exactly `image/svg+xml;base64`. Verified: a `charset`
 *   parameter makes the converter reject the URL.
 * - The markup is encoded to UTF-8 bytes first, because `btoa` throws above
 *   U+00FF and course SVGs carry real text. (The CLI's own `btoa` calls are a
 *   latent bug for the same reason; the SVGs it feeds them happen to be ASCII.)
 */
function dataURL(xml: string): string {
  const utf8 = new TextEncoder().encode(xml)

  let binary = ''
  utf8.forEach((byte) => {
    binary += String.fromCharCode(byte)
  })

  return 'data:image/svg+xml;base64,' + btoa(binary)
}

/** Serialises an SVG element as a data URL. */
function serializeSvg(svg: SVGElement): string {
  return dataURL(new XMLSerializer().serializeToString(svg))
}

/**
 * Tags each element matching `selector` with an index, in document order.
 *
 * Kept from the CLI because the replacement pass in `docx.ts` finds elements by
 * these attributes, on a clone taken after tagging.
 */
function tag(
  doc: Document,
  selector: string,
  attribute: string,
  accept?: (el: Element) => boolean,
): Element[] {
  const tagged: Element[] = []

  doc.querySelectorAll(selector).forEach((el) => {
    if (accept && !accept(el)) return

    el.setAttribute(attribute, String(tagged.length))
    tagged.push(el)
  })

  return tagged
}

/**
 * Extracts every `<lia-chart>` (ECharts) as an SVG data URL.
 *
 * ECharts renders into an open shadow root, readable from the same document.
 */
export function charts(doc: Document): Map<number, string> {
  const images = new Map<number, string>()

  tag(doc, 'lia-chart', 'data-chart-index').forEach((host, index) => {
    const svg = host.shadowRoot?.querySelector('svg')

    if (svg) images.set(index, serializeSvg(svg))
  })

  return images
}

/**
 * Extracts ABC music notation as SVG data URLs.
 *
 * Two flavours, matching the CLI: blocks rendered inside a terminal (from a
 * code block) and standalone ones (from template macros like `@ABCJS.render`).
 * `insideTerminal` picks which, and they are indexed separately because the
 * replacement pass treats them as distinct.
 */
export function abc(doc: Document, insideTerminal: boolean): Map<number, string> {
  const images = new Map<number, string>()

  const hosts = insideTerminal
    ? tag(doc, '.lia-code-terminal', 'data-abc-index', (el) =>
        Boolean(el.querySelector('lia-abcjs')),
      )
    : tag(doc, 'lia-abcjs', 'data-standalone-abc-index', (el) =>
        !el.closest('.lia-code-terminal'),
      )

  hosts.forEach((host, index) => {
    const abcjs = insideTerminal ? host.querySelector('lia-abcjs') : host
    const svg = abcjs?.shadowRoot?.getElementById('paper')?.querySelector('svg')

    if (svg) images.set(index, serializeSvg(svg))
  })

  return images
}

/** A rasterised element: a PNG data URL and the size to place it at. */
export interface Raster {
  source: string
  width: number
  height: number
}

/**
 * KaTeX's stylesheet, which the render does not carry.
 *
 * `lia-formula` styles itself by scraping every `.katex` rule out of
 * `document.styleSheets` into its shadow root (`extractKatexStyles` in
 * LiaScript's webcomponents/formula/index.ts). The print render has no such
 * rules — measured: 16 stylesheets, 0 accessible `.katex` rules, 0 blocked — so
 * that `<style>` comes out empty and formulas render as unstyled inline glyphs.
 *
 * The version matches LiaScript's own dependency. The CLI loads it from a CDN
 * too (docx.ts).
 */
const KATEX_CSS = 'https://cdn.jsdelivr.net/npm/katex@0.16.45/dist/katex.min.css'

/** Resolves once the render has KaTeX's stylesheet applied. */
async function loadKatexStyles(doc: Document): Promise<void> {
  if (doc.querySelector(`link[href="${KATEX_CSS}"]`)) return

  const link = doc.createElement('link')

  link.rel = 'stylesheet'
  link.href = KATEX_CSS

  const applied = new Promise<void>((resolve) => {
    link.onload = () => resolve()
    // A formula rendered unstyled is better than no export at all.
    link.onerror = () => resolve()
  })

  doc.head.appendChild(link)

  await applied

  /*
   * The stylesheet arriving is not enough: its `@font-face` rules are fetched
   * separately, and until those land the glyphs are measured in a fallback font,
   * so a formula staged before then is sized too small and the capture clips it.
   */
  try {
    await (doc as any).fonts?.ready
  } catch (_) {
    // Best-effort; a mis-measured formula beats failing the export.
  }
}

/**
 * Rasterises each formula to a PNG, the way the CLI does.
 *
 * MathML is not an option, though KaTeX emits it and it is the better
 * representation on paper: `@turbodocx/html-to-docx` has no MathML-to-OMML
 * conversion, so a `<math>` tree reaches the document as its leaf text — the
 * formula arrives as loose characters ("∫ 0 ∞ e − x 2"). The CLI screenshots
 * instead, for the same reason (`DOCX does not support MathML`, docx.ts).
 *
 * `html2canvas` is handed a copy of KaTeX's markup in the light DOM — the case
 * it handles well, and the only way to apply {@link KATEX_CSS}, whose rules
 * cannot reach inside a shadow root.
 */
export async function formulas(
  doc: Document,
  view: Window,
): Promise<Map<number, Raster>> {
  const hosts = tag(doc, 'lia-formula', 'data-formula-index')

  if (hosts.length === 0) return new Map()

  await loadKatexStyles(doc)

  const extracted = new Map<number, Raster>()

  for (const [index, host] of hosts.entries()) {
    const katex = host.shadowRoot?.querySelector('.katex')

    if (!katex) continue

    const clone = katex.cloneNode(true) as HTMLElement

    // The MathML is for screen readers; visually it is empty, and in the
    // document it would render as stray text beside the image.
    clone.querySelectorAll('.katex-mathml').forEach((m) => m.remove())

    // Block formulas are centred by a wrapper that is not copied, so the class
    // is carried over to keep KaTeX's display-mode spacing.
    if (host.getAttribute('displaymode') === 'true') {
      clone.classList.add('katex-display')
    }

    const raster = await rasterize(doc, clone)

    if (raster) extracted.set(index, raster)
  }

  return extracted
}

/**
 * Extracts each formula as MathML, for formats that render it natively.
 *
 * The counterpart to {@link formulas}, which rasterises because DOCX cannot
 * represent a `<math>` tree. EPUB3 can, so the markup is kept: it stays
 * selectable, scales with the reader's font, and needs no KaTeX stylesheet —
 * which is why this path does not have to load {@link KATEX_CSS} at all.
 */
export function mathml(doc: Document): Map<number, string> {
  const extracted = new Map<number, string>()

  tag(doc, 'lia-formula', 'data-formula-index').forEach((host, index) => {
    const shadow = host.shadowRoot

    if (!shadow) return

    const katex = shadow.querySelector('.katex')

    if (!katex) return

    const math = katex.querySelector('.katex-mathml math')

    if (math) {
      extracted.set(index, math.outerHTML)
      return
    }

    // No MathML: fall back to the visual markup, which needs the shadow root's
    // own styles to mean anything once lifted out of it.
    const clone = katex.cloneNode(true) as HTMLElement
    let styles = ''

    shadow.querySelectorAll('style').forEach((style) => {
      styles += `<style>${style.textContent || ''}</style>`
    })

    extracted.set(index, styles + clone.outerHTML)
  })

  return extracted
}

/**
 * Draws `element` into a canvas and returns it as a PNG.
 *
 * Staged off-screen rather than hidden: `visibility: hidden` and `display: none`
 * both leave nothing for the rasteriser to paint. The stage shrink-wraps so the
 * formula lays out at its natural width, which is then what gets captured.
 */
async function rasterize(
  doc: Document,
  element: HTMLElement,
): Promise<Raster | undefined> {
  // `html2canvas` is a UMD bundle: depending on how the bundler interops it, the
  // callable is the module itself rather than its `default`. Getting this wrong
  // is a `TypeError` that surfaces only as every formula going missing.
  const module: any = await import('html2canvas')
  const html2canvas =
    typeof module === 'function' ? module : (module.default ?? module)

  /*
   * Staged in an iframe of its own rather than in the course document.
   *
   * `html2canvas` deep-clones the whole `documentElement` its target lives in,
   * on every call.
   */
  const host = doc.createElement('iframe')

  host.setAttribute(
    'style',
    'position:absolute;left:-10000px;top:0;width:2000px;height:2000px;border:0;',
  )

  doc.body.appendChild(host)

  const frame = host.contentDocument

  if (!frame) {
    host.remove()
    console.warn('could not stage a formula for rendering')

    return undefined
  }

  // The stylesheets must be *applied* before the formula is measured — they
  // carry the math `@font-face` rules — and a cloned `<link>` fetches
  // asynchronously, so each one is awaited.
  const sheets = Array.from(
    doc.querySelectorAll('link[rel="stylesheet"], style'),
  ).map((node) => {
    const copy = frame.head.appendChild(node.cloneNode(true)) as HTMLElement

    if (copy.tagName !== 'LINK') return Promise.resolve()

    return new Promise<void>((resolve) => {
      copy.onload = () => resolve()
      // An unstyled formula still beats failing the export.
      copy.onerror = () => resolve()
    })
  })

  await Promise.all(sheets)

  const stage = frame.createElement('div')

  // The padding is not cosmetic: it absorbs the overflow described below.
  stage.setAttribute(
    'style',
    'position:absolute;left:0;top:0;width:max-content;' +
      'padding:8px 16px;background:#fff;',
  )

  stage.appendChild(frame.importNode(element, true))
  frame.body.appendChild(stage)
  frame.body.setAttribute('style', 'margin:0;')

  try {
    // The frame's own fonts, not the course's: measuring before they land
    // undersizes the box.
    await (frame as any).fonts?.ready

    /*
     * `scrollWidth`/`scrollHeight` rather than the bounding box: KaTeX lays parts
     * of a formula out with negative offsets and fractional advances, so content
     * reaches past the box `max-content` settles on — measured, a formula whose
     * box is 280px needs ~296px, and capturing at the box width clips the
     * right-hand side of a fraction.
     */
    const box = stage.getBoundingClientRect()
    const width = Math.max(Math.ceil(box.width), stage.scrollWidth) || 1
    const height = Math.max(Math.ceil(box.height), stage.scrollHeight) || 1

    const canvas = await html2canvas(stage, {
      backgroundColor: null,
      // Formulas are small; rendering at 2× keeps them crisp in print.
      scale: 2,
      logging: false,
      width,
      height,
      // The staging frame's own viewport, since that is the document being
      // cloned; the stage sits at its origin.
      windowWidth: width,
      windowHeight: height,
    })

    return { source: canvas.toDataURL('image/png'), width, height }
  } catch (error) {
    // Dropped rather than failing the whole export, but reported: a silently
    // missing formula is a gap nobody notices until the document is in front of
    // a reader.
    console.warn('could not render a formula:', error)

    return undefined
  } finally {
    // The frame, not just the stage: it is the copy that costs memory.
    host.remove()
  }
}

/**
 * Renders each Ace code block as static, syntax-coloured HTML.
 *
 * Ace paints tokens with stylesheet classes, which do not survive being lifted
 * out of the document, so each token's computed colour is read here and written
 * inline. `view` is the render's own window: `getComputedStyle` must come from
 * the document the element lives in.
 *
 * Wrapped in a single-cell table because a styled `<pre>` does not survive the
 * conversion; it is how the CLI gets a background and border into DOCX.
 */
export function code(doc: Document, view: Window): Map<number, string> {
  const blocks = new Map<number, string>()

  tag(doc, '.lia-code__input', 'data-code-index').forEach((input, index) => {
    const editor = input.querySelector('.ace_editor')
    const content = editor?.querySelector('.ace_text-layer')

    if (!editor || !content) {
      blocks.set(index, '')
      return
    }

    const background =
      view.getComputedStyle(editor as HTMLElement).backgroundColor || '#f5f5f5'

    const line = (el: Element): string => {
      // A line without token spans is plain text; take it wholesale.
      if (!el.querySelector('span[class*="ace_"]')) {
        return escape(clean(el.textContent || '').replace(/\n/g, ''))
      }

      let html = ''

      el.childNodes.forEach((node) => {
        const text = clean(node.textContent || '')

        if (!text) return

        if (node.nodeType !== 1) {
          html += escape(text)
          return
        }

        const style = view.getComputedStyle(node as HTMLElement)
        let css = ''

        if (
          style.color &&
          style.color !== 'rgb(0, 0, 0)' &&
          style.color !== 'rgba(0, 0, 0, 0)'
        ) {
          css += `color:${style.color};`
        }

        if (style.fontWeight === 'bold' || parseInt(style.fontWeight) >= 700) {
          css += 'font-weight:bold;'
        }

        if (style.fontStyle === 'italic') css += 'font-style:italic;'

        html += css
          ? `<span style="${css}">${escape(text)}</span>`
          : escape(text)
      })

      return html
    }

    const paragraph = 'font-family:Courier;margin:0;padding:0;white-space:pre;'
    const rows: string[] = []

    const groups = content.querySelectorAll('.ace_line_group')

    if (groups.length > 0) {
      // One group is one logical line; its `.ace_line` children are soft-wrap
      // continuations and belong on that same line.
      groups.forEach((group) => {
        let html = ''
        group.querySelectorAll('.ace_line').forEach((el) => {
          html += line(el)
        })
        rows.push(`<p style="${paragraph}">${html || ' '}</p>`)
      })
    } else {
      clean(content.textContent || '')
        .trimEnd()
        .split('\n')
        .forEach((text) => {
          rows.push(`<p style="${paragraph}">${escape(text) || ' '}</p>`)
        })
    }

    blocks.set(
      index,
      '<table style="width:100%;border-collapse:collapse;">' +
        `<tr><td style="background-color:${background};border-left:3px solid #4caf50;padding:8px;">` +
        rows.join('') +
        '</td></tr></table>',
    )
  })

  return blocks
}

/**
 * Renders terminal output blocks as static HTML, preserving error and warning
 * colours.
 */
export function terminals(doc: Document): Map<number, string> {
  const blocks = new Map<number, string>()

  tag(doc, '.lia-code-terminal', 'data-terminal-index').forEach(
    (terminal, index) => {
      const output = terminal.querySelector('lia-terminal')

      if (!output) {
        blocks.set(index, '')
        return
      }

      const lines: string[] = []
      const typed = output.querySelectorAll('div[class^="text-"]')

      if (typed.length > 0) {
        typed.forEach((div) => {
          const text = escape(div.textContent || '')
          const color = div.classList.contains('text-error')
            ? '#f48771'
            : div.classList.contains('text-warning')
              ? '#dcdcaa'
              : '#d4d4d4'

          lines.push(`<span style="color:${color};">${text}</span>`)
        })
      } else {
        escape(output.textContent || '')
          .split('\n')
          .forEach((text) => {
            lines.push(`<span style="color:#d4d4d4;">${text}</span>`)
          })
      }

      blocks.set(
        index,
        '<table style="width:100%;border-collapse:collapse;">' +
          '<tr><td style="background-color:#1e1e1e;padding:8px;">' +
          '<pre style="font-family:Courier;color:#d4d4d4;margin:0;white-space:pre;">' +
          lines.join('<br>') +
          '</pre></td></tr></table>',
      )
    },
  )

  return blocks
}

/**
 * Extracts standalone inline SVGs (diagrams drawn by the course itself).
 *
 * Skips SVGs that belong to something already handled, and tiny ones — icons
 * and spinners, which are chrome rather than content. Same filter as the CLI.
 */
export function inlineSvgs(doc: Document): Map<number, string> {
  const images = new Map<number, string>()

  const accept = (el: Element): boolean => {
    if (!el.hasAttribute('viewBox')) return false
    if (el.closest('.lia-figure, .lia-code, lia-chart, lia-abcjs, lia-embed')) {
      return false
    }

    const rect = el.getBoundingClientRect()

    return rect.width >= 50 && rect.height >= 50
  }

  tag(doc, 'svg', 'data-inline-svg-index', accept).forEach((svg, index) => {
    images.set(index, serializeSvg(svg as unknown as SVGElement))
  })

  return images
}

/**
 * Extracts SVG figures — the diagrams LiaScript draws from ASCII art.
 *
 * Indexed on the `<figure>` rather than the `<svg>` because the replacement
 * pass reuses the figure as the image's container, keeping its framing.
 */
export function figures(doc: Document): Map<number, string> {
  const images = new Map<number, string>()

  const hosts = tag(doc, 'figure.lia-figure', 'data-svg-index', (el) =>
    Boolean(el.querySelector('.lia-figure__media svg')),
  )

  hosts.forEach((figure, index) => {
    const svg = figure.querySelector('.lia-figure__media svg')

    if (!svg) return

    /*
     * A formula written into ASCII art sits in a `<foreignObject>` as a
     * `<lia-formula>`, drawn in its shadow root, which serializing leaves
     * behind: the image would carry an unknown element and no formula. A copy
     * takes the formula's MathML in its place, its description as a fallback.
     */
    const live = svg.querySelectorAll('lia-formula')
    const copy = svg.cloneNode(true) as SVGElement

    copy.querySelectorAll('lia-formula').forEach((formula, i) => {
      const math = live[i]?.shadowRoot?.querySelector('.katex-mathml math')

      formula.replaceWith(
        math
          ? math.cloneNode(true)
          : doc.createTextNode(formula.textContent?.trim() ?? ''),
      )
    })

    images.set(index, serializeSvg(copy))
  })

  return images
}
