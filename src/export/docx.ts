import * as helper from './helper'
import * as COLOR from '../colorize'
import * as path from 'path'
import puppeteer, { Browser, Page } from 'puppeteer'
import * as fs from 'fs'
import HTMLtoDOCX from '@turbodocx/html-to-docx'

// Default DOCX generation settings
const DEFAULT_TIMEOUT_MS = 15000
const DEFAULT_ORIENTATION = 'portrait'
const DEFAULT_FONT = 'Arial'
const DEFAULT_FONT_SIZE = 22 // half-points, equals 11pt
const DEFAULT_LANG = 'en-US'

/** Displays help information about DOCX export options. */
export function help() {
  console.log('')
  console.log(COLOR.heading('DOCX settings:'), '\n')

  COLOR.info(
    'DOCX export generates Microsoft Word documents from your LiaScript course using Puppeteer to render the content and the @turbodocx/html-to-docx library to create the DOCX file. The output is compatible with Microsoft Word 2007+, LibreOffice Writer, and Google Docs.',
  )

  console.log('\nLearn more: https://github.com/TurboDocx/html-to-docx \n')

  console.log(COLOR.heading('Optional settings:'), '\n')

  COLOR.command(null, '--docx-title', '              Title of the document')
  COLOR.command(null, '--docx-author', '             Author / creator of the document')
  COLOR.command(null, '--docx-subject', '            Subject of the document')
  COLOR.command(null, '--docx-description', '        Description of the document')
  COLOR.command(null, '--docx-language', `           Language code for spell checker (default: ${DEFAULT_LANG})`)
  COLOR.command(null, '--docx-orientation', `       Page orientation: portrait or landscape (default: ${DEFAULT_ORIENTATION})`)
  COLOR.command(null, '--docx-font', `               Font name (default: ${DEFAULT_FONT})`)
  COLOR.command(null, '--docx-font-size', `          Font size in half-points/HIP (default: ${DEFAULT_FONT_SIZE}, equals 11pt)`)
  COLOR.command(null, '--docx-header', '             Enable header in the document (default: false)')
  COLOR.command(null, '--docx-header-html', '        Custom HTML string for the header')
  COLOR.command(null, '--docx-footer', '             Enable footer in the document (default: false)')
  COLOR.command(null, '--docx-footer-html', '        Custom HTML string for the footer')
  COLOR.command(null, '--docx-page-number', '        Add page numbers to the footer (default: false)')
  COLOR.command(null, '--docx-stylesheet', '         Path to a local CSS file to inject before export')
  COLOR.command(null, '--docx-theme', '              LiaScript theme: default, turquoise, blue, red, yellow')
  COLOR.command(null, '--docx-timeout', `            Additional wait time after rendering in ms (default: ${DEFAULT_TIMEOUT_MS})`)
  COLOR.command(null, '--docx-preview', '            Open preview browser for debugging (default: false)')
}

/** Configuration options for DOCX export. */
export interface DocxExportArguments {
  input: string
  output: string
  'docx-title'?: string
  'docx-author'?: string
  'docx-subject'?: string
  'docx-description'?: string
  'docx-language'?: string
  'docx-orientation'?: 'portrait' | 'landscape'
  'docx-font'?: string
  'docx-font-size'?: number
  'docx-header'?: boolean
  'docx-header-html'?: string
  'docx-footer'?: boolean
  'docx-footer-html'?: string
  'docx-page-number'?: boolean
  'docx-stylesheet'?: string
  'docx-theme'?: string
  'docx-timeout'?: number
  'docx-preview'?: boolean
}

export const format = 'docx'

/** Exports a LiaScript course to DOCX format. */
export async function exporter(argument: DocxExportArguments) {
  const dirname = helper.dirname()

  let url = `file://${dirname}/assets/pdf/index.html?`
  if (helper.isURL(argument.input)) {
    url += argument.input
  } else {
    url += 'file://' + path.resolve(argument.input)
  }

  let browser: Browser | null = null
  let page: Page | null = null

  try {
    const launchOptions: any = {
      pipe: true,
      args: [
        '--no-sandbox',
        '--disable-web-security',
        '--disable-features=IsolateOrigins',
        '--disable-site-isolation-trials',
        '--unhandled-rejections=strict',
        '--disable-features=BlockInsecurePrivateNetworkRequests',
        '--allow-file-access-from-files',
        '--enable-local-file-accesses',
      ],
    }

    if (argument['docx-preview']) {
      launchOptions.headless = false
      launchOptions.devtools = true
    }

    browser = await puppeteer.launch(launchOptions)
    page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 800 })
    
    console.log('Loading course content... This may take a while for large courses.')

    // Set up render done listener BEFORE navigating
    let renderDoneResolve: () => void
    const renderDonePromise = new Promise<void>((resolve) => {
      renderDoneResolve = resolve
    })

    page.on('console', (msg) => {
      if (msg.text().startsWith('__RENDER_DONE__')) {
        renderDoneResolve()
      }
    })

    await page.setExtraHTTPHeaders({
      referer: 'https://liascript.github.io/',
    })

    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: DEFAULT_TIMEOUT_MS,
    })

    if (argument['docx-stylesheet']) {
      const href = path.resolve(dirname + '/../', argument['docx-stylesheet'])
      try {
        await page.evaluate(async (href) => {
          const link = document.createElement('link')
          link.rel = 'stylesheet'
          link.href = href
          const promise = new Promise((resolve, reject) => {
            link.onload = resolve
            link.onerror = reject
          })
          document.head.appendChild(link)
          await promise
        }, href)
      } catch (e) {
        throw new Error(
          `Failed to load custom stylesheet from '${argument['docx-stylesheet']}': ${e}`,
        )
      }
    }

    if (argument['docx-theme']) {
      try {
        await page.evaluate(async (theme) => {
          document.documentElement.classList.remove('lia-theme-default')
          document.documentElement.classList.add('lia-theme-' + theme)
        }, argument['docx-theme'])
      } catch (e) {
        throw new Error(
          `Failed to apply theme '${argument['docx-theme']}': ${e}`,
        )
      }
    }

    if (!argument['docx-preview']) {
      await renderDonePromise

      if (argument['docx-timeout']) {
        await helper.sleep(argument['docx-timeout'])
      }

      await toDOCX(argument, page, dirname)
    } else {
      console.log('Preview mode enabled - browser will remain open')
    }
  } catch (e) {
    const error = e as Error
    console.error('DOCX export failed:', error.message)
    throw new Error(`Failed to export DOCX: ${error.message}`)
  } finally {
    if (argument['docx-preview']) {
      console.log('Browser kept open for preview. Close manually when done.')
    } else {
      if (page) {
        try { await page.close() } catch (e) { console.error('Failed to close page:', e) }
      }
      if (browser) {
        try { await browser.close() } catch (e) { console.error('Failed to close browser:', e) }
      }
    }
  }
}

/** Generates a DOCX file from a Puppeteer page. */
async function toDOCX(
  argument: DocxExportArguments,
  page: Page,
  dirname: string,
) {
  try {
    console.log('Converting SVG diagrams to PNG images...')
    const svgImages = await screenshotTaggedElements(
      page,
      'figure.lia-figure',
      'data-svg-index',
      'SVG diagram',
      `return !!el.querySelector('.lia-figure__media svg')`,
    )
    console.log(`Converted ${svgImages.size} SVG diagrams to PNG`)

    console.log('Extracting syntax-highlighted code blocks...')
    const highlightedBlocks = await extractHighlightedCode(page)
    console.log(`Extracted ${highlightedBlocks.size} highlighted code block(s)`)

    console.log('Extracting terminal output blocks...')
    const terminalOutputs = await extractTerminalOutputs(page)
    console.log(`Extracted ${terminalOutputs.size} terminal output block(s)`)

    console.log('Screenshotting ABC music notation blocks...')
    const abcImages = await extractAbcSvgs(page, true)
    console.log(`Captured ${abcImages.size} ABC notation block(s)`)

    console.log('Screenshotting standalone ABC music notation blocks...')
    const standaloneAbcImages = await extractAbcSvgs(page, false)
    console.log(`Captured ${standaloneAbcImages.size} standalone ABC notation block(s)`)

    console.log('Screenshotting embedded media (Spotify, SoundCloud, etc.)...')
    const embedImages = await screenshotTaggedElements(
      page, 'lia-embed', 'data-embed-index', 'embed',
    )
    console.log(`Captured ${embedImages.size} embed cover(s)`)

    console.log('Extracting ECharts diagrams...')
    const chartImages = await extractChartSvgs(page)
    console.log(`Extracted ${chartImages.size} chart(s)`)

    // Inject KaTeX CSS so formula clones render correctly outside shadow DOM
    await page.evaluate(() => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/katex@0.16.27/dist/katex.min.css'
      document.head.appendChild(link)
    })
    await page.waitForFunction(() => {
      const sheets = document.styleSheets
      for (let i = 0; i < sheets.length; i++) {
        try {
          if (sheets[i].href?.includes('katex') && sheets[i].cssRules.length > 0) return true
        } catch (e) { /* CORS */ }
      }
      return false
    }, { timeout: 5000 }).catch(() => console.warn('KaTeX CSS load timeout — formulas may not render correctly'))

    console.log('Screenshotting math formulas...')
    const formulaImages = await screenshotTaggedElements(
      page, 'lia-formula', 'data-formula-index', 'formula',
    )
    console.log(`Captured ${formulaImages.size} formula(s)`)

    // Hide formula MathML inside SVG foreignObjects before screenshotting
    await page.evaluate(() => {
      document
        .querySelectorAll('svg foreignObject lia-formula')
        .forEach((formula) => {
          formula.childNodes.forEach((child) => {
            if (child.nodeType === Node.ELEMENT_NODE) {
              ;(child as HTMLElement).style.display = 'none'
            }
          })
          const shadow = formula.shadowRoot
          if (shadow) {
            shadow.querySelectorAll('.katex-mathml').forEach((mathml) => {
              ;(mathml as HTMLElement).style.display = 'none'
            })
          }
        })
    })

    console.log('Screenshotting inline SVGs (foreignObject, interactive)...')
    const inlineSvgImages = await screenshotTaggedElements(
      page, 'svg', 'data-inline-svg-index', 'inline SVG',
      `if (!el.hasAttribute('viewBox')) return false;
       const skip = el.closest('.lia-figure, .lia-code, lia-chart, lia-abcjs, lia-embed');
       if (skip) return false;
       const rect = el.getBoundingClientRect();
       if (rect.width < 50 || rect.height < 50) return false;
       return true;`,
    )
    console.log(`Captured ${inlineSvgImages.size} inline SVG(s)`)

    console.log('Screenshotting video/iframe figures...')
    const videoIframeImages = await screenshotTaggedElements(
      page, 'figure.lia-figure', 'data-video-index', 'video/iframe figure',
      `const media = el.querySelector('.lia-figure__media');
       if (!media) return false;
       const type = media.getAttribute('data-media-type');
       return type === 'iframe' || type === 'movie';`,
    )
    console.log(`Captured ${videoIframeImages.size} video/iframe thumbnail(s)`)

    const toEntries = (map: Map<number, string>) =>
      Array.from(map.entries()) as [number, string][]

    const payload = {
      svgImages: toEntries(svgImages),
      codeBlocks: toEntries(highlightedBlocks),
      terminalOutputs: toEntries(terminalOutputs),
      abcImages: toEntries(abcImages),
      standaloneAbcImages: toEntries(standaloneAbcImages),
      embedImages: toEntries(embedImages),
      chartImages: toEntries(chartImages),
      formulaImages: toEntries(formulaImages),
      inlineSvgImages: toEntries(inlineSvgImages),
      videoIframeImages: toEntries(videoIframeImages),
    }

    // Extract and process the full document HTML
    const htmlContent = await page.evaluate((data) => {
      const {
        svgImages: svgImagesData,
        codeBlocks,
        terminalOutputs: terminalOutputsData,
        abcImages: abcImagesData,
        standaloneAbcImages: standaloneAbcImagesData,
        embedImages: embedImagesData,
        chartImages: chartImagesData,
        formulaImages: formulaImagesData,
        inlineSvgImages: inlineSvgImagesData,
        videoIframeImages: videoIframeImagesData,
      } = data

      const bodyClone = document.body.cloneNode(true) as HTMLElement

      // Remove UI elements not relevant in a document
      bodyClone
        .querySelectorAll(
          'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], ' +
            'link[rel="manifest"], link[rel="preconnect"], link[rel="dns-prefetch"], ' +
            'link[rel="preload"], link[rel="stylesheet"]',
        )
        .forEach((el: any) => el.remove())

      bodyClone.querySelectorAll('.lia-code__copy, .lia-code__copy--inverted').forEach((el: Element) => el.remove())
      bodyClone.querySelectorAll('.lia-code-control').forEach((el: Element) => el.remove())
      bodyClone.querySelectorAll('.lia-lightbox__clickarea').forEach((el: Element) => el.remove())

      // Convert gallery flex containers to vertical layout
      bodyClone.querySelectorAll('.lia-gallery').forEach((gallery: Element) => {
        (gallery as HTMLElement).setAttribute('style', 'display: block; margin-bottom: 1em;')
      })

      // Strip JS attributes from images
      bodyClone.querySelectorAll('img').forEach((img: Element) => {
        img.removeAttribute('onerror')
        img.removeAttribute('onclick')
        img.removeAttribute('loading')
      })

      // Unwrap images from lia-figure__media divs (html-to-docx needs <img> as direct child of <figure>)
      bodyClone
        .querySelectorAll('figure.lia-figure > .lia-figure__media')
        .forEach((mediaDiv: Element) => {
          const figure = mediaDiv.parentElement!
          if (figure.hasAttribute('data-video-index')) return
          while (mediaDiv.firstChild) {
            figure.insertBefore(mediaDiv.firstChild, mediaDiv)
          }
          mediaDiv.remove()
        })

      // Convert <figcaption> to styled paragraph after figure
      bodyClone.querySelectorAll('figure > figcaption').forEach((caption: Element) => {
        const figure = caption.parentElement!
        const p = document.createElement('p')
        p.setAttribute('style',
          'text-align: center; font-style: italic; color: #555; font-size: 0.9em; margin-top: 0.3em; margin-bottom: 1em;')
        p.innerHTML = caption.innerHTML
        figure.parentNode?.insertBefore(p, figure.nextSibling)
        caption.remove()
      })

      // Replace video/iframe figures with screenshot thumbnail + clickable link
      bodyClone
        .querySelectorAll('figure.lia-figure[data-video-index]')
        .forEach((figure: Element) => {
          const idx = parseInt(figure.getAttribute('data-video-index') || '-1')
          const entry = videoIframeImagesData.find((item: [number, string]) => item[0] === idx)

          const printLink = figure.querySelector('a.lia-print-only')
          const linkUrl = printLink?.getAttribute('href') || ''
          const iframeSrc = figure.querySelector('iframe')?.getAttribute('src') || ''
          const videoSrc =
            figure.querySelector('video')?.getAttribute('src') ||
            figure.querySelector('video source')?.getAttribute('src') || ''
          const mediaUrl = linkUrl || iframeSrc || videoSrc

          const wrapper = document.createElement('div')
          wrapper.setAttribute('style', 'margin: 1em 0; text-align: center; page-break-inside: avoid;')

          if (entry && entry[1]) {
            const img = document.createElement('img')
            img.src = entry[1]
            img.alt = printLink?.textContent?.trim() || 'Video thumbnail'
            img.setAttribute('style', 'max-width: 100%; height: auto; display: block; margin: 0 auto;')
            wrapper.appendChild(img)
          } else if (mediaUrl) {
            const ytMatch = mediaUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/)
            if (ytMatch) {
              const img = document.createElement('img')
              img.src = `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`
              img.alt = printLink?.textContent?.trim() || 'YouTube video'
              img.setAttribute('style', 'max-width: 100%; height: auto; display: block; margin: 0 auto;')
              wrapper.appendChild(img)
            }
          }

          if (mediaUrl) {
            const p = document.createElement('p')
            p.setAttribute('style', 'text-align: center; font-size: 0.9em; margin-top: 0.5em;')
            const a = document.createElement('a')
            a.href = mediaUrl
            a.textContent = '▶ Watch video: ' + mediaUrl
            a.setAttribute('style', 'color: #1a73e8; text-decoration: underline;')
            p.appendChild(a)
            wrapper.appendChild(p)
          } else if (!entry || !entry[1]) {
            const p = document.createElement('p')
            p.setAttribute('style', 'text-align: center; color: #888;')
            p.textContent = '[Video/iframe content — no source available]'
            wrapper.appendChild(p)
          }

          figure.replaceWith(wrapper)
        })

      // Replace stray <iframe> and <video> elements with links
      const replaceMediaWithLink = (selector: string, prefix: string) => {
        bodyClone.querySelectorAll(selector).forEach((el: Element) => {
          const src = el.getAttribute('src') ||
            el.querySelector('source')?.getAttribute('src') || ''
          if (src) {
            const p = document.createElement('p')
            p.setAttribute('style', 'text-align: center; font-size: 0.9em; margin: 0.5em 0;')
            const a = document.createElement('a')
            a.href = src
            a.textContent = prefix + src
            a.setAttribute('style', 'color: #1a73e8; text-decoration: underline;')
            p.appendChild(a)
            el.replaceWith(p)
          } else {
            el.remove()
          }
        })
      }
      replaceMediaWithLink('iframe', '🔗 ')
      replaceMediaWithLink('video', '▶ ')

      // Helper: replace tagged elements with their pre-captured images
      const replaceWithImage = (
        selector: string,
        dataAttr: string,
        images: [number, string][],
        options: {
          alt: string | ((el: Element) => string)
          wrapInFigure?: boolean
          reuseAsContainer?: boolean
          imgStyle?: string | ((el: Element) => string)
          figureStyle?: string
        },
      ) => {
        const defaultImgStyle = 'max-width: 100%; height: auto; display: block; margin: 0 auto;'
        bodyClone.querySelectorAll(selector).forEach((el: Element) => {
          try {
            const idx = parseInt(el.getAttribute(dataAttr) || '-1')
            const entry = images.find((item: any) => item[0] === idx)
            if (!entry || !entry[1]) { el.remove(); return }

            const img = document.createElement('img')
            img.src = entry[1]
            img.alt = typeof options.alt === 'function' ? options.alt(el) : options.alt
            const style = typeof options.imgStyle === 'function'
              ? options.imgStyle(el) : (options.imgStyle ?? defaultImgStyle)
            img.setAttribute('style', style)

            if (options.reuseAsContainer) {
              el.innerHTML = ''
              el.appendChild(img)
              if (options.figureStyle) el.setAttribute('style', options.figureStyle)
            } else if (options.wrapInFigure) {
              const figure = document.createElement('figure')
              figure.setAttribute('style',
                options.figureStyle || 'margin: 1.5em auto; text-align: center; page-break-inside: avoid;')
              figure.appendChild(img)
              el.replaceWith(figure)
            } else {
              el.replaceWith(img)
            }
          } catch (e) {
            console.error(`Error replacing ${selector}:`, e)
          }
        })
      }

      replaceWithImage('lia-embed[data-embed-index]', 'data-embed-index', embedImagesData, {
        alt: 'Embedded media',
        imgStyle: (el) => el.getAttribute('style') || 'width:250px;height:250px;',
      })

      replaceWithImage('lia-chart[data-chart-index]', 'data-chart-index', chartImagesData, {
        alt: (el) => el.getAttribute('aria-label') || 'Chart',
        wrapInFigure: true,
      })

      replaceWithImage('.lia-code-terminal[data-abc-index]', 'data-abc-index', abcImagesData, {
        alt: 'ABC Music Notation', wrapInFigure: true,
      })

      replaceWithImage('lia-abcjs[data-standalone-abc-index]', 'data-standalone-abc-index', standaloneAbcImagesData, {
        alt: 'ABC Music Notation', wrapInFigure: true,
      })

      replaceWithImage('figure.lia-figure[data-svg-index]', 'data-svg-index', svgImagesData, {
        alt: 'ASCII Diagram',
        reuseAsContainer: true,
        figureStyle:
          'margin: 1.5em auto; padding: 1.5em; background-color: #f8f9fa; ' +
          'border: 1px solid #dee2e6; border-radius: 4px; text-align: center; ' +
          'page-break-inside: avoid; max-width: 90%;',
      })

      replaceWithImage('svg[data-inline-svg-index]', 'data-inline-svg-index', inlineSvgImagesData, {
        alt: 'SVG Graphic',
        wrapInFigure: true,
        figureStyle: 'margin: 1.5em auto; text-align: center; page-break-inside: avoid;',
      })

      // Replace <lia-formula> with screenshot image (DOCX does not support MathML)
      replaceWithImage('lia-formula[data-formula-index]', 'data-formula-index', formulaImagesData, {
        alt: 'Math Formula',
        wrapInFigure: false,
      })

      // Process terminal output blocks
      bodyClone.querySelectorAll('.lia-code-terminal').forEach((terminal: Element) => {
        try {
          if (terminal.querySelector('lia-abcjs')) { terminal.remove(); return }
          if (terminal.querySelector('lia-formula')) { terminal.remove(); return }

          // If terminal contains a formula image (already replaced), unwrap it
          const formulaImg = terminal.querySelector('img[alt="Math Formula"]')
          if (formulaImg) { terminal.replaceWith(formulaImg); return }

          const idx = parseInt(terminal.getAttribute('data-terminal-index') || '-1')
          const entry = terminalOutputsData.find((item: [number, string]) => item[0] === idx)
          if (entry && entry[1]) {
            const wrapper = document.createElement('div')
            wrapper.innerHTML = entry[1]
            terminal.replaceWith(wrapper.firstChild || wrapper)
          } else {
            // Fallback: read lia-terminal from clone
            const terminalOutput = terminal.querySelector('lia-terminal')
            if (!terminalOutput) { terminal.remove(); return }
            const text = (terminalOutput.textContent || '')
              .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            const lines = text.split('\n').map(
              (line: string) => `<span style="color:#d4d4d4;">${line}</span>`,
            )
            const fallbackHTML =
              `<table style="width:100%;border-collapse:collapse;">` +
              `<tr><td style="background-color:#1e1e1e;padding:8px;">` +
              `<pre style="font-family:Courier;color:#d4d4d4;margin:0;white-space:pre;">${lines.join('<br>')}</pre>` +
              `</td></tr></table>`
            const wrapper = document.createElement('div')
            wrapper.innerHTML = fallbackHTML
            terminal.replaceWith(wrapper.firstChild || wrapper)
          }
        } catch (e) {
          console.error('Error processing terminal block:', e)
        }
      })

      // Replace Ace Editor code blocks with pre-extracted syntax-highlighted HTML
      bodyClone.querySelectorAll('.lia-code__input').forEach((codeInput: Element) => {
        try {
          const idx = parseInt(codeInput.getAttribute('data-code-index') || '-1')
          const entry = codeBlocks.find((item) => item[0] === idx)
          if (entry && entry[1]) {
            const wrapper = document.createElement('div')
            wrapper.innerHTML = entry[1]
            const newNode = wrapper.firstChild || wrapper
            // Insert before .lia-code--block parent to preserve terminal siblings
            const codeBlock = codeInput.parentElement?.classList.contains('lia-code--block')
              ? codeInput.parentElement : null
            if (codeBlock) {
              codeBlock.parentElement?.insertBefore(newNode, codeBlock)
              codeInput.remove()
            } else {
              codeInput.replaceWith(newNode)
            }
          } else {
            codeInput.remove()
          }
        } catch (e) {
          console.error('Error injecting highlighted code block:', e)
        }
      })

      // Build combined HTML from all <main> sections
      const mainElements = bodyClone.querySelectorAll('main')
      let combinedHTML = ''

      if (mainElements.length > 0) {
        mainElements.forEach((main: Element, index: number) => {
          const headerEl = main.querySelector('header')
          let chapterTitle = `Chapter ${index + 1}`
          const hTag = headerEl?.querySelector('.h1, .h2, .h3, .h4, .h5, .h6')
          if (hTag?.textContent) chapterTitle = hTag.textContent.trim()
          if (headerEl) headerEl.remove()
          main.querySelectorAll('script').forEach((el: Element) => el.remove())

          const tempDiv = document.createElement('div')
          tempDiv.appendChild(main.cloneNode(true))
          combinedHTML += `<h1>${chapterTitle}</h1>`
          combinedHTML += tempDiv.innerHTML
        })
      } else {
        bodyClone.querySelectorAll('script').forEach((el: Element) => el.remove())
        combinedHTML = bodyClone.outerHTML
      }

      return combinedHTML
    }, payload)

    // Convert external images to data URIs
    console.log('Fetching external/URL-based images as data URIs...')
    const processedHTML = await page.evaluate(async (html: string) => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, 'text/html')

      const imgs = Array.from(doc.querySelectorAll('img[src]'))
      let fetched = 0
      let failed = 0
      await Promise.all(
        imgs.map(async (img) => {
          const src = img.getAttribute('src')!
          if (src.startsWith('data:') || src.startsWith('file://')) return
          try {
            const response = await fetch(src)
            if (!response.ok) { failed++; return }
            const blob = await response.blob()
            const dataUri = await new Promise<string>((resolve) => {
              const reader = new FileReader()
              reader.onload = () => resolve(reader.result as string)
              reader.readAsDataURL(blob)
            })
            img.setAttribute('src', dataUri)
            fetched++
          } catch (e) {
            console.warn('Failed to fetch image:', src, e)
            failed++
          }
        }),
      )
      console.log(`Image fetch: ${fetched} succeeded, ${failed} failed`)
      return doc.body.innerHTML
    }, htmlContent)

    const fullHTML = `<!DOCTYPE html>
<html lang="${argument['docx-language'] || DEFAULT_LANG}">
<head>
  <meta charset="UTF-8" />
  <title>${argument['docx-title'] || 'LiaScript Export'}</title>
</head>
<body>
${processedHTML}
</body>
</html>`

    const docOptions: any = {
      orientation: argument['docx-orientation'] || DEFAULT_ORIENTATION,
      title: argument['docx-title'] || 'LiaScript Export',
      creator: argument['docx-author'] || 'LiaScript Exporter',
      subject: argument['docx-subject'],
      description: argument['docx-description'],
      lang: argument['docx-language'] || DEFAULT_LANG,
      font: argument['docx-font'] || DEFAULT_FONT,
      fontSize: argument['docx-font-size'] || DEFAULT_FONT_SIZE,
      table: { row: { cantSplit: false } },
      header: argument['docx-header'] ?? false,
      footer: argument['docx-footer'] ?? false,
      pageNumber: argument['docx-page-number'] ?? false,
      imageProcessing: {
        maxRetries: 3,
        downloadTimeout: 10000,
        maxImageSize: 20 * 1024 * 1024,
        verboseLogging: false,
      },
    }

    const headerHTML = argument['docx-header-html'] || null
    const footerHTML = argument['docx-footer-html'] || null

    console.log('Generating DOCX document...')
    const docxBuffer = await HTMLtoDOCX(fullHTML, headerHTML, docOptions, footerHTML)

    const outputPath = argument.output.endsWith('.docx')
      ? argument.output
      : argument.output + '.docx'

    fs.writeFileSync(outputPath, Buffer.from(docxBuffer as ArrayBuffer))
    console.log(`DOCX successfully generated: ${outputPath}`)
  } catch (e) {
    const error = e as Error
    throw new Error(`Failed to generate DOCX: ${error.message}`)
  }
}

/** Extracts syntax-highlighted HTML from all Ace Editor code blocks. */
async function extractHighlightedCode(page: Page): Promise<Map<number, string>> {
  const result = await page.evaluate(() => {
    const escape = (text: string) =>
      text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;')

    const blocks: [number, string][] = []
    let idx = 0

    document.querySelectorAll('.lia-code__input').forEach((codeInput: Element) => {
      codeInput.setAttribute('data-code-index', idx.toString())

      try {
        const aceEditor = codeInput.querySelector('.ace_editor')
        const aceContent = aceEditor?.querySelector('.ace_text-layer')

        if (!aceEditor || !aceContent) { blocks.push([idx, '']); idx++; return }

        const bgColor =
          window.getComputedStyle(aceEditor as HTMLElement).backgroundColor || '#f5f5f5'

        // Render a single .ace_line element's tokens as HTML with syntax colors
        const renderLineContent = (line: Element): string => {
          let lineHTML = ''
          const hasTokenSpans = line.querySelector('span[class*="ace_"]') !== null
          if (hasTokenSpans) {
            line.childNodes.forEach((node: ChildNode) => {
              if (node.nodeType === Node.TEXT_NODE) {
                const cleaned = (node.textContent || '').replace(/[\u200B-\u200D\uFEFF]/g, '')
                if (cleaned) lineHTML += escape(cleaned)
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tokenEl = node as HTMLElement
                const cleaned = (tokenEl.textContent || '').replace(/[\u200B-\u200D\uFEFF]/g, '')
                if (!cleaned) return
                const color = window.getComputedStyle(tokenEl).color
                const fontWeight = window.getComputedStyle(tokenEl).fontWeight
                const fontStyle = window.getComputedStyle(tokenEl).fontStyle
                const escaped = escape(cleaned)
                let style = ''
                if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') style += `color:${color};`
                if (fontWeight === 'bold' || parseInt(fontWeight) >= 700) style += 'font-weight:bold;'
                if (fontStyle === 'italic') style += 'font-style:italic;'
                lineHTML += style ? `<span style="${style}">${escaped}</span>` : escaped
              }
            })
          } else {
            lineHTML += escape((line.textContent || '').replace(/[\u200B-\u200D\uFEFF\n]/g, ''))
          }
          return lineHTML
        }

        const lineParas: string[] = []
        const pStyle = 'font-family:Courier;margin:0;padding:0;white-space:pre;'

        const lineGroups = aceContent.querySelectorAll('.ace_line_group')
        if (lineGroups.length > 0) {
          lineGroups.forEach((lineGroup: Element) => {
            const subLines = lineGroup.querySelectorAll('.ace_line')
            if (subLines.length === 0) { lineParas.push(`<p style="${pStyle}"> </p>`); return }
            let lineHTML = ''
            subLines.forEach((line: Element) => { lineHTML += renderLineContent(line) })
            lineParas.push(`<p style="${pStyle}">${lineHTML || ' '}</p>`)
          })
        } else {
          const rawText = (aceContent.textContent || '').replace(/[\u200B-\u200D\uFEFF]/g, '').trimEnd()
          rawText.split('\n').forEach((line: string) => {
            lineParas.push(`<p style="${pStyle}">${escape(line) || ' '}</p>`)
          })
        }

        // Single-cell table for reliable background + border in DOCX
        const html =
          `<table style="width:100%;border-collapse:collapse;">` +
          `<tr><td style="background-color:${bgColor};border-left:3px solid #4caf50;padding:8px;">` +
          lineParas.join('') +
          `</td></tr></table>`

        blocks.push([idx, html])
      } catch (e) {
        blocks.push([idx, ''])
      }

      idx++
    })

    return blocks
  })

  return new Map(result)
}

/** Extracts SVG from <lia-abcjs> shadow DOMs and returns as data URIs. */
async function extractAbcSvgs(page: Page, insideTerminal: boolean): Promise<Map<number, string>> {
  const dataAttr = insideTerminal ? 'data-abc-index' : 'data-standalone-abc-index'

  const count = await page.evaluate((inside: boolean, attr: string) => {
    let idx = 0
    if (inside) {
      document.querySelectorAll('.lia-code-terminal').forEach((terminal: Element) => {
        if (terminal.querySelector('lia-abcjs')) {
          terminal.setAttribute(attr, idx.toString())
          idx++
        }
      })
    } else {
      document.querySelectorAll('lia-abcjs').forEach((el: Element) => {
        if (!el.closest('.lia-code-terminal')) {
          el.setAttribute(attr, idx.toString())
          idx++
        }
      })
    }
    return idx
  }, insideTerminal, dataAttr)

  const images = new Map<number, string>()

  for (let i = 0; i < count; i++) {
    try {
      // Find the lia-abcjs element (directly or inside a tagged terminal)
      const svgDataUri = await page.evaluate((inside: boolean, attr: string, idx: number) => {
        let abcEl: Element | null = null
        if (inside) {
          const terminal = document.querySelector(`.lia-code-terminal[${attr}="${idx}"]`)
          abcEl = terminal?.querySelector('lia-abcjs') || null
        } else {
          abcEl = document.querySelector(`lia-abcjs[${attr}="${idx}"]`)
        }
        if (!abcEl) return null
        const svg = (abcEl as any).shadowRoot?.getElementById('paper')?.querySelector('svg')
        if (!svg) return null
        return 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg))
      }, insideTerminal, dataAttr, i)

      if (svgDataUri) images.set(i, svgDataUri)
    } catch (e) {
      console.error(`Failed to convert ABC block ${i}:`, e)
    }
  }

  return images
}

/** Extracts SVG from <lia-chart> elements (ECharts). */
async function extractChartSvgs(page: Page): Promise<Map<number, string>> {
  const count = await page.evaluate(() => {
    let idx = 0
    document.querySelectorAll('lia-chart').forEach((el: Element) => {
      el.setAttribute('data-chart-index', idx.toString())
      idx++
    })
    return idx
  })

  const images = new Map<number, string>()
  const elements = await page.$$('lia-chart')

  for (let i = 0; i < count; i++) {
    try {
      const el = elements[i]
      if (!el) continue

      const svgDataUri = await page.evaluate((host: Element) => {
        const svg = host.shadowRoot?.querySelector('svg')
        if (!svg) return null
        return 'data:image/svg+xml;base64,' + btoa(new XMLSerializer().serializeToString(svg))
      }, el)

      if (svgDataUri) images.set(i, svgDataUri)
    } catch (e) {
      console.error(`Failed to extract chart ${i}:`, e)
    }
  }

  return images
}

/** Tags matching elements with a data attribute index, then screenshots each one. */
async function screenshotTaggedElements(
  page: Page,
  selector: string,
  dataAttr: string,
  label: string,
  tagFilter?: string,
): Promise<Map<number, string>> {
  const count = await page.evaluate(
    (sel: string, attr: string, filterBody: string | null) => {
      let idx = 0
      const filterFn = filterBody
        ? (new Function('el', filterBody) as (el: Element) => boolean)
        : null
      document.querySelectorAll(sel).forEach((el: Element) => {
        if (!filterFn || filterFn(el)) {
          el.setAttribute(attr, idx.toString())
          idx++
        }
      })
      return idx
    },
    selector, dataAttr, tagFilter ?? null,
  )

  const images = new Map<number, string>()
  for (let i = 0; i < count; i++) {
    try {
      const el = await page.$(`${selector}[${dataAttr}="${i}"]`)
      if (!el) continue

      // For lia-formula: clone KaTeX HTML into a regular <div> where the
      // globally-injected KaTeX CDN stylesheet applies (declarative shadow
      // DOM styles don't work in headless Chromium).
      const hasShadow = await page.evaluate((el: Element) => {
        const shadow = (el as any).shadowRoot
        if (!shadow) return false

        const katex = shadow.querySelector('.katex-display') || shadow.querySelector('.katex')
        if (!katex) return false

        const clone = katex.cloneNode(true) as HTMLElement
        clone.querySelectorAll('.katex-mathml').forEach((m: Element) => m.remove())

        const container = document.createElement('div')
        container.setAttribute('data-formula-clone', 'true')
        container.style.cssText =
          'position:absolute;top:0;left:10000px;display:inline-block;background:white;padding:8px;'
        container.appendChild(clone)
        document.body.appendChild(container)
        return true
      }, el)

      let screenshot: Buffer | Uint8Array
      if (hasShadow) {
        const cloneHandle = await page.$('[data-formula-clone="true"]')
        screenshot = cloneHandle
          ? await cloneHandle.screenshot({ type: 'png' })
          : await el.screenshot({ type: 'png' })
        await page.evaluate(() => {
          document.querySelector('[data-formula-clone="true"]')?.remove()
        })
      } else {
        screenshot = await el.screenshot({ type: 'png' })
      }

      images.set(i, `data:image/png;base64,${Buffer.from(screenshot).toString('base64')}`)
    } catch (e) {
      console.error(`Failed to screenshot ${label} ${i}:`, e)
    }
  }

  return images
}

/** Extracts terminal output blocks from the live page. */
async function extractTerminalOutputs(page: Page): Promise<Map<number, string>> {
  const result = await page.evaluate(() => {
    const blocks: [number, string][] = []
    let idx = 0
    const escape = (text: string) =>
      text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    document.querySelectorAll('.lia-code-terminal').forEach((terminal: Element) => {
      terminal.setAttribute('data-terminal-index', idx.toString())

      try {
        const terminalOutput = terminal.querySelector('lia-terminal')
        if (!terminalOutput) { blocks.push([idx, '']); idx++; return }

        const lineSpans: string[] = []
        const textDivs = terminalOutput.querySelectorAll('div[class^="text-"]')
        if (textDivs.length > 0) {
          textDivs.forEach((div: Element) => {
            const text = escape(div.textContent || '')
            if (div.classList.contains('text-error')) {
              lineSpans.push(`<span style="color:#f48771;">${text}</span>`)
            } else if (div.classList.contains('text-warning')) {
              lineSpans.push(`<span style="color:#dcdcaa;">${text}</span>`)
            } else {
              lineSpans.push(`<span style="color:#d4d4d4;">${text}</span>`)
            }
          })
        } else {
          escape(terminalOutput.textContent || '').split('\n').forEach((line) => {
            lineSpans.push(`<span style="color:#d4d4d4;">${line}</span>`)
          })
        }

        const html =
          `<table style="width:100%;border-collapse:collapse;">` +
          `<tr><td style="background-color:#1e1e1e;padding:8px;">` +
          `<pre style="font-family:Courier;color:#d4d4d4;margin:0;white-space:pre;">${lineSpans.join('<br>')}</pre>` +
          `</td></tr></table>`

        blocks.push([idx, html])
      } catch (e) {
        blocks.push([idx, ''])
      }

      idx++
    })

    return blocks
  })

  return new Map(result)
}
