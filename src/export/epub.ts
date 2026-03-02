import * as helper from './helper'
import * as COLOR from '../colorize'
import * as path from 'path'
import puppeteer, { Browser, Page } from 'puppeteer'
import { EPub } from '@lesjoursfr/html-to-epub'
import * as fs from 'fs'

// Default EPUB generation settings
const DEFAULT_TIMEOUT_MS = 15000 // 15 seconds
const DEFAULT_EPUB_VERSION = 3
const DEFAULT_LANG = 'en'
const DEFAULT_TOC_TITLE = 'Table Of Contents'
const DEFAULT_APPEND_CHAPTER_TITLES = true
const DEFAULT_HIDE_TOC = false

/**
 * Displays help information about EPUB export options and settings.
 */
export function help() {
  console.log('')
  console.log(COLOR.heading('EPUB settings:'), '\n')

  COLOR.info(
    'EPUB export generates e-books from your LiaScript course using Puppeteer to render the content and the @lesjoursfr/html-to-epub library to create the EPUB file. This allows for high-quality e-books compatible with most e-readers.',
  )

  console.log(
    '\nLearn more: https://www.npmjs.com/package/@lesjoursfr/html-to-epub \n',
  )

  console.log(COLOR.heading('Required settings:'), '\n')
  COLOR.command(null, '--epub-title', '              Title of the book (required)')
  COLOR.command(null, '--epub-author', '             Author name(s), comma-separated for multiple authors')

  console.log('')
  console.log(COLOR.heading('Optional settings:'), '\n')

  COLOR.command(null, '--epub-publisher', '          Publisher name')
  COLOR.command(null, '--epub-cover', '              Path to cover image (absolute path or URL)')
  COLOR.command(null, '--epub-description', '        Book description')
  COLOR.command(null, '--epub-language', `           Language code in 2 letters (default: ${DEFAULT_LANG})`)
  COLOR.command(null, '--epub-version', `            EPUB version: 2 or 3 (default: ${DEFAULT_EPUB_VERSION})`)
  COLOR.command(null, '--epub-stylesheet', '        Path to custom CSS file for styling')
  COLOR.command(null, '--epub-theme', '              LiaScript theme: default, turquoise, blue, red, yellow')
  COLOR.command(null, '--epub-toc-title', `         Title for table of contents (default: "${DEFAULT_TOC_TITLE}")`)
  COLOR.command(null, '--epub-hide-toc', '           Hide table of contents in the generated EPUB (default: false)')
  COLOR.command(null, '--epub-timeout', `            Additional wait time for rendering in ms (default: ${DEFAULT_TIMEOUT_MS})`)
  COLOR.command(null, '--epub-fonts', '             Comma-separated paths to custom font files to embed')
  COLOR.command(null, '--epub-chapter-title', '     Custom title for the main chapter (default: course title)')
  COLOR.command(null, '--epub-preview', '           Open preview browser for debugging (default: false)')
}

/**
 * Configuration options for EPUB export.
 */
export interface EpubExportArguments {
  input: string
  output: string

  // Required EPUB settings
  'epub-title': string
  'epub-author'?: string

  // Optional EPUB settings
  'epub-publisher'?: string
  'epub-cover'?: string
  'epub-description'?: string
  'epub-language'?: string
  'epub-version'?: 2 | 3
  'epub-stylesheet'?: string
  'epub-theme'?: string
  'epub-toc-title'?: string
  'epub-hide-toc'?: boolean
  'epub-timeout'?: number
  'epub-fonts'?: string
  'epub-chapter-title'?: string
  'epub-preview'?: boolean
}

export const format = 'epub'

/**
 * Exports a LiaScript course to EPUB format using Puppeteer and @lesjoursfr/html-to-epub.
 * 
 * This function launches a headless Chrome browser, loads the LiaScript content,
 * applies any custom styling or themes, extracts the rendered HTML DOM,
 * and generates an EPUB file.
 *
 * @param argument - Configuration options for the EPUB export
 * @throws {Error} If browser launch fails, page navigation fails, or EPUB generation fails
 *
 * @example
 * ```typescript
 * await exporter({
 *   input: './course.md',
 *   output: './output/book',
 *   'epub-title': 'My Course',
 *   'epub-author': 'John Doe',
 *   'epub-language': 'en'
 * })
 * ```
 */
export async function exporter(argument: EpubExportArguments) {
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
    // Configure browser launch options
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
        '--enable-features=ExperimentalJavaScript',
      ],
      headless: !argument['epub-preview'],
    }

    // Use custom executable path if provided, otherwise use Chrome channel
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH
    } else {
      launchOptions.channel = 'chrome'
    }

    try {
      browser = await puppeteer.launch(launchOptions)
    } catch (launchError) {
      throw new Error(
        `Failed to launch browser for EPUB generation. Make sure Chrome is installed. ${launchError}`,
      )
    }

    page = await browser.newPage()
    console.log('Loading course content... This may take a while for large courses.')

    page.on('dialog', async (dialog) => {
      await dialog.accept()
    })

    // Set up render done listener BEFORE navigating to catch the signal
    let renderDoneResolve: () => void
    const renderDonePromise = new Promise<void>((resolve) => {
      renderDoneResolve = resolve
    })

    page.on('console', (msg) => {
      if (msg.text().startsWith('__RENDER_DONE__')) {
        renderDoneResolve()
      }
    })

    // Wait for page to load completely
    // Using 'networkidle2' ensures all network requests are complete
    // Timeout set to 0 (unlimited) to handle large courses
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: DEFAULT_TIMEOUT_MS,
    })

    if (argument['epub-stylesheet']) {
      const href = path.resolve(dirname + '/../', argument['epub-stylesheet'])
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
          `Failed to load custom stylesheet from '${argument['epub-stylesheet']}': ${e}`,
        )
      }
    }

    if (argument['epub-theme']) {
      try {
        await page.evaluate(async (theme) => {
          document.documentElement.classList.remove('lia-theme-default')
          document.documentElement.classList.add('lia-theme-' + theme)
        }, argument['epub-theme'])
      } catch (e) {
        throw new Error(`Failed to apply theme '${argument['epub-theme']}': ${e}`)
      }
    }

    if (!argument['epub-preview']) {
      // Wait for LiaScript to signal rendering is complete
      await renderDonePromise

      if (argument['epub-timeout']) {
        await helper.sleep(argument['epub-timeout'])
      }

      await toEPUB(argument, page, dirname)
    } else {
      console.log('Preview mode enabled - browser will remain open')
    }
  } catch (e) {
    const error = e as Error
    console.error('EPUB export failed:', error.message)
    throw new Error(`Failed to export EPUB: ${error.message}`)
  } finally {
    if (argument['epub-preview']) {
      console.log('Browser kept open for preview. Close manually when done.')
    } else {
      if (page) {
        try {
          await page.close()
        } catch (closeError) {
          console.error('Failed to close page:', closeError)
        }
      }
      if (browser) {
        try {
          await browser.close()
        } catch (closeError) {
          console.error('Failed to close browser:', closeError)
        }
      }
    }
  }
}

/**
 * Generates an EPUB file from a Puppeteer page.
 * 
 * Extracts the rendered HTML DOM, processes images and resources,
 * and creates an EPUB file using @lesjoursfr/html-to-epub.
 *
 * @param argument - EPUB export configuration options
 * @param page - Puppeteer page instance containing the rendered content
 * @param dirname - Base directory path
 * @throws {Error} If EPUB generation fails or HTML extraction fails
 */
async function toEPUB(
  argument: EpubExportArguments,
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

    console.log('Screenshotting ABC music notation blocks...')
    const abcImages = await screenshotAbcBlocks(page)
    console.log(`Captured ${abcImages.size} ABC notation block(s)`)

    console.log('Screenshotting standalone ABC music notation blocks...')
    const standaloneAbcImages = await screenshotStandaloneAbcBlocks(page)
    console.log(`Captured ${standaloneAbcImages.size} standalone ABC notation block(s)`)

    console.log('Screenshotting embedded media (Spotify, SoundCloud, etc.)...')
    const embedImages = await screenshotTaggedElements(
      page,
      'lia-embed',
      'data-embed-index',
      'embed',
    )
    console.log(`Captured ${embedImages.size} embed cover(s)`)

    console.log('Extracting ECharts diagrams...')
    const chartImages = await extractChartSvgs(page)
    console.log(`Extracted ${chartImages.size} chart(s)`)

    console.log('Extracting math formulas...')
    const formulaHtml = await extractFormulaHtml(page)
    console.log(`Extracted ${formulaHtml.size} formula(s)`)

    // Hide formula accessibility/MathML content inside SVG foreignObjects before screenshotting
    await page.evaluate(() => {
      document.querySelectorAll('svg foreignObject lia-formula').forEach((formula) => {
        formula.childNodes.forEach((child) => {
          if (child.nodeType === Node.ELEMENT_NODE) {
            (child as HTMLElement).style.display = 'none'
          }
        })
        const shadow = formula.shadowRoot
        if (shadow) {
          shadow.querySelectorAll('.katex-mathml').forEach((mathml) => {
            (mathml as HTMLElement).style.display = 'none'
          })
        }
      })
    })

    console.log('Screenshotting inline SVGs (foreignObject, interactive)...')
    const inlineSvgImages = await screenshotTaggedElements(
      page,
      'svg',
      'data-inline-svg-index',
      'inline SVG',
      // Only content SVGs with viewBox, not inside containers already handled
      `if (!el.hasAttribute('viewBox')) return false;
       const skip = el.closest('.lia-figure, .lia-code, lia-chart, lia-abcjs, lia-embed');
       if (skip) return false;
       // Skip tiny decorative SVGs (icons, spinners, etc.)
       const rect = el.getBoundingClientRect();
       if (rect.width < 50 || rect.height < 50) return false;
       return true;`,
    )
    console.log(`Captured ${inlineSvgImages.size} inline SVG(s)`)

    const toEntries = (map: Map<number, string>) => Array.from(map.entries()) as [number, string][]
    const payload = {
      svgImages: toEntries(svgImages),
      codeBlocks: toEntries(highlightedBlocks),
      abcImages: toEntries(abcImages),
      standaloneAbcImages: toEntries(standaloneAbcImages),
      embedImages: toEntries(embedImages),
      chartImages: toEntries(chartImages),
      formulas: toEntries(formulaHtml),
      inlineSvgImages: toEntries(inlineSvgImages),
    }
    const chapters = await page.evaluate((data) => {
      const { 
        svgImages: svgImagesData, 
        codeBlocks, 
        abcImages: abcImagesData,
        standaloneAbcImages: standaloneAbcImagesData,
        embedImages: embedImagesData, 
        chartImages: chartImagesData, 
        formulas: formulasData,
        inlineSvgImages: inlineSvgImagesData
      } = data
      const bodyClone = document.body.cloneNode(true) as HTMLElement

      // Remove problematic link tags
      bodyClone
        .querySelectorAll(
          'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], ' +
            'link[rel="manifest"], link[rel="preconnect"], link[rel="dns-prefetch"], ' +
            'link[rel="preload"], link[rel="stylesheet"]',
        )
        .forEach((link: any) => link.remove())

      // Remove the copy-to-clipboard button from code blocks
      bodyClone
        .querySelectorAll('.lia-code__copy, .lia-code__copy--inverted')
        .forEach((btn: Element) => btn.remove())

      // Remove run/version control toolbar
      bodyClone
        .querySelectorAll('.lia-code-control')
        .forEach((ctrl: Element) => ctrl.remove())

      // Helper: replace tagged elements with their pre-captured images
      const replaceWithImage = (
        selector: string,
        dataAttr: string,
        images: [number, string][],
        options: {
          alt: string | ((el: Element) => string)
          wrapInFigure?: boolean           // true → wrap <img> in a new <figure>
          reuseAsContainer?: boolean       // true → clear element innerHTML and append <img> inside it
          imgStyle?: string | ((el: Element) => string)
          figureStyle?: string
        },
      ) => {
        const defaultImgStyle = 'max-width: 100%; height: auto; display: block; margin: 0 auto;'
        bodyClone.querySelectorAll(selector).forEach((el: Element) => {
          try {
            const idx = parseInt(el.getAttribute(dataAttr) || '-1')
            const entry = images.find((item: any) => item[0] === idx)
            if (!entry || !entry[1]) {
              el.remove()
              return
            }

            const img = document.createElement('img')
            img.src = entry[1]
            img.alt = typeof options.alt === 'function' ? options.alt(el) : options.alt
            const style = typeof options.imgStyle === 'function' ? options.imgStyle(el) : (options.imgStyle ?? defaultImgStyle)
            img.setAttribute('style', style)

            if (options.reuseAsContainer) {
              el.innerHTML = ''
              el.appendChild(img)
              if (options.figureStyle) el.setAttribute('style', options.figureStyle)
            } else if (options.wrapInFigure) {
              const figure = document.createElement('figure')
              figure.setAttribute(
                'style',
                options.figureStyle || 'margin: 1.5em auto; text-align: center; page-break-inside: avoid;',
              )
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

      // Replace <lia-embed> elements with their pre-captured cover screenshots
      replaceWithImage('lia-embed[data-embed-index]', 'data-embed-index', embedImagesData, {
        alt: 'Embedded media',
        imgStyle: (el) => el.getAttribute('style') || 'width:250px;height:250px;',
      })

      // Replace <lia-chart> elements with their extracted SVG images
      replaceWithImage('lia-chart[data-chart-index]', 'data-chart-index', chartImagesData, {
        alt: (el) => el.getAttribute('aria-label') || 'Chart',
        wrapInFigure: true,
      })

      // Replace ABC notation blocks with pre-captured SVG
      replaceWithImage('.lia-code-terminal[data-abc-index]', 'data-abc-index', abcImagesData, {
        alt: 'ABC Music Notation',
        wrapInFigure: true,
      })

      // Replace standalone ABC notation elements (from template macros like @ABCJS.render)
      replaceWithImage('lia-abcjs[data-standalone-abc-index]', 'data-standalone-abc-index', standaloneAbcImagesData, {
        alt: 'ABC Music Notation',
        wrapInFigure: true,
      })

      // Replace SVG diagrams with PNG images for better EPUB compatibility
      replaceWithImage('figure.lia-figure[data-svg-index]', 'data-svg-index', svgImagesData, {
        alt: 'ASCII Diagram',
        reuseAsContainer: true,
        figureStyle:
          'margin: 1.5em auto; padding: 1.5em; background-color: #f8f9fa; ' +
          'border: 1px solid #dee2e6; border-radius: 4px; text-align: center; ' +
          'page-break-inside: avoid; max-width: 90%;',
      })

      // Replace inline SVGs (foreignObject, interactive content) with PNG screenshots
      replaceWithImage('svg[data-inline-svg-index]', 'data-inline-svg-index', inlineSvgImagesData, {
        alt: 'SVG Graphic',
        wrapInFigure: true,
        figureStyle:
          'margin: 1.5em auto; text-align: center; page-break-inside: avoid;',
      })

      // Replace <lia-formula> elements with their pre-extracted MathML/KaTeX HTML
      bodyClone.querySelectorAll('lia-formula[data-formula-index]').forEach((formula: Element) => {
        try {
          const idx = parseInt(formula.getAttribute('data-formula-index') || '-1')
          const entry = formulasData.find((item: any) => item[0] === idx)
          if (entry && entry[1]) {
            const isBlock = formula.getAttribute('displaymode') === 'true'
            const wrapper = document.createElement(isBlock ? 'div' : 'span')
            wrapper.innerHTML = entry[1]

            // Set display attribute on <math> element for EPUB3 MathML rendering
            const mathEl = wrapper.querySelector('math')
            if (mathEl) {
              mathEl.setAttribute('display', isBlock ? 'block' : 'inline')
              if (isBlock) {
                wrapper.setAttribute('style', 'text-align: center; margin: 1em 0;')
              }
            }

            formula.replaceWith(wrapper)
          }
        } catch (e) {
          console.error('Error replacing formula:', e)
        }
      })

      // Process terminal output blocks
      bodyClone.querySelectorAll('.lia-code-terminal').forEach((terminal: Element) => {
        try {
          // Skip if this is an ABC block (already handled above)
          if (terminal.querySelector('lia-abcjs')) {
            terminal.remove()
            return
          }

          // If the terminal contains rendered MathML (from @runFormula macro)
          // Extract the formula and replace the terminal with it
          const mathEls = terminal.querySelectorAll('math')
          if (mathEls.length > 0) {
            const container = document.createElement('div')
            container.setAttribute(
              'style',
              'text-align: center; margin: 1em 0; background-color: #1e1e1e; color: #d4d4d4; padding: 1em; border-radius: 4px;'
            )
            mathEls.forEach((m) => {
              m.setAttribute('display', 'block')
              container.appendChild(m.cloneNode(true))
            })
            terminal.replaceWith(container)
            return
          }

          // If terminal still has an unreplaced <lia-formula> (no data extracted), remove it
          if (terminal.querySelector('lia-formula')) {
            terminal.remove()
            return
          }

          const terminalOutput = terminal.querySelector('lia-terminal')
          if (!terminalOutput) return

          const pre = document.createElement('pre')
          const code = document.createElement('code')

          pre.setAttribute(
            'style',
            'background-color: #1e1e1e; color: #d4d4d4; padding: 1em; ' +
              'border-radius: 4px; font-family: monospace; overflow-x: auto;',
          )

          const textDivs = terminalOutput.querySelectorAll('div[class^="text-"]')
          if (textDivs.length > 0) {
            textDivs.forEach((div: Element) => {
              const span = document.createElement('span')
              span.textContent = div.textContent || ''
              if (div.classList.contains('text-error')) {
                span.setAttribute('style', 'color: #f48771;')
              } else if (div.classList.contains('text-warning')) {
                span.setAttribute('style', 'color: #dcdcaa;')
              }
              code.appendChild(span)
              code.appendChild(document.createTextNode('\n'))
            })
          } else {
            code.textContent = terminalOutput.textContent || ''
          }

          pre.appendChild(code)
          terminal.replaceWith(pre)
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
            codeInput.replaceWith(wrapper.firstChild || wrapper)
          }
        } catch (e) {
          console.error('Error injecting highlighted code block:', e)
        }
      })

      // Extract chapters from <main> elements
      const mainElements = bodyClone.querySelectorAll('main')
      const chapterList: Array<{ title: string; data: string }> = []

      if (mainElements.length > 0) {
        mainElements.forEach((main: Element, index: number) => {
          let chapterTitle = `Chapter ${index + 1}`
          const headerEl = main.querySelector('header')
          const hTag = headerEl?.querySelector('.h1, .h2, .h3, .h4, .h5, .h6')
          if (hTag?.textContent) {
            chapterTitle = hTag.textContent.trim()
          }
          // Remove the header from DOM to avoid duplicate titles
          if (headerEl) {
            headerEl.remove()
          }

          main.querySelectorAll('script').forEach((el: Element) => el.remove())

          const tempDiv = document.createElement('div')
          tempDiv.appendChild(main.cloneNode(true))
          chapterList.push({ title: chapterTitle, data: tempDiv.innerHTML })
        })

        return chapterList
      } else {
        bodyClone.querySelectorAll('script').forEach((el: Element) => el.remove())
        return [{ title: 'Content', data: bodyClone.outerHTML }]
      }
    }, payload)

    // Sanitize chapter HTML for XHTML/XML compatibility
    for (const chapter of chapters) {
      // Strip HTML comments — XML forbids "--" inside comment bodies
      chapter.data = chapter.data.replace(/<!--[\s\S]*?-->/g, '')

      // Escape namespace-prefixed tags like <jc:trillian.mit.edu> that aren't valid HTML elements
      chapter.data = chapter.data.replace(
        /<((?!\/?\s*(?:svg|math|xlink|xml|xmlns)[:\s>])[a-zA-Z][a-zA-Z0-9]*:[^\s>]+[^>]*)>/g,
        '&lt;$1&gt;',
      )
    }

    // Read CSS and fonts from the pdf assets folder
    const pdfAssetsPath = path.join(dirname, 'assets', 'pdf')
    const cssFiles = fs.readdirSync(pdfAssetsPath).filter((f) => f.endsWith('.css'))

    let allCSS = ''
    const fontPaths: string[] = []

    if (cssFiles.length > 0) {
      cssFiles.forEach((cssFile) => {
        allCSS += fs.readFileSync(path.join(pdfAssetsPath, cssFile), 'utf-8') + '\n'
      })

      const fontMatches = allCSS.match(/url\(['"]?([^'")\s]+\.(?:woff2?|ttf|otf|eot))['"]?\)/gi)
      if (fontMatches) {
        const uniqueFonts = new Set<string>()
        fontMatches.forEach((match) => {
          const fontMatch = match.match(/url\(['"]?([^'")\s]+)['"]?\)/)
          if (fontMatch?.[1]) {
            uniqueFonts.add(path.basename(fontMatch[1]))
          }
        })
        uniqueFonts.forEach((fontFilename) => {
          const fontPath = path.join(pdfAssetsPath, fontFilename)
          if (fs.existsSync(fontPath)) {
            fontPaths.push(fontPath)
          } else {
            console.warn(`Warning: Font file not found: ${fontPath}`)
          }
        })
      }
    } else {
      console.warn('Warning: No CSS files found in pdf assets folder')
    }

    // Include KaTeX font files not already referenced in CSS
    fs.readdirSync(pdfAssetsPath)
      .filter(
        (f) =>
          f.startsWith('KaTeX_') &&
          (f.endsWith('.woff') || f.endsWith('.woff2') || f.endsWith('.ttf')),
      )
      .forEach((fontFile) => {
        const fontPath = path.join(pdfAssetsPath, fontFile)
        if (!fontPaths.includes(fontPath) && fs.existsSync(fontPath)) {
          fontPaths.push(fontPath)
        }
      })

    console.log(`Building EPUB with ${chapters.length} chapter(s) and ${fontPaths.length} font(s)...`)

    let authors: string | string[] = argument['epub-author'] || 'Unknown'
    if (typeof authors === 'string' && authors.includes(',')) {
      authors = authors.split(',').map((a) => a.trim())
    }

    let fonts: string[] = [...fontPaths]
    if (argument['epub-fonts']) {
      fonts.push(...argument['epub-fonts'].split(',').map((f) => f.trim()))
    }

    let customCSS = allCSS
    if (argument['epub-stylesheet']) {
      try {
        customCSS = fs.readFileSync(path.resolve(argument['epub-stylesheet']), 'utf-8') + '\n' + customCSS
      } catch (e) {
        console.warn(`Warning: Could not read custom stylesheet: ${e}`)
      }
    }

    const epubOptions: any = {
      title: argument['epub-title'],
      author: authors,
      lang: argument['epub-language'] || DEFAULT_LANG,
      tocTitle: argument['epub-toc-title'] || DEFAULT_TOC_TITLE,
      appendChapterTitles: argument['epub-chapter-title'] === undefined && DEFAULT_APPEND_CHAPTER_TITLES,
      hideToC: argument['epub-hide-toc'] ?? DEFAULT_HIDE_TOC,
      css: customCSS,
      version: (argument['epub-version'] || DEFAULT_EPUB_VERSION) as 2 | 3,
      content: chapters,
      verbose: false,
    }

    if (argument['epub-publisher']) epubOptions.publisher = argument['epub-publisher']
    if (argument['epub-cover']) epubOptions.cover = argument['epub-cover']
    if (argument['epub-description']) epubOptions.description = argument['epub-description']
    if (fonts.length > 0) epubOptions.fonts = fonts

    const outputPath = argument.output.endsWith('.epub')
      ? argument.output
      : argument.output + '.epub'

    await new EPub(epubOptions, outputPath).render()
    console.log(`EPUB successfully generated: ${outputPath}`)
  } catch (e) {
    const error = e as Error
    throw new Error(`Failed to generate EPUB: ${error.message}`)
  }
}

/**
 * Extracts syntax-highlighted HTML from all Ace Editor code blocks in the live page
 *
 * @param page - Puppeteer page instance
 * @returns Map of block indexes to static highlighted HTML strings
 */
async function extractHighlightedCode(page: Page): Promise<Map<number, string>> {
  const result = await page.evaluate(() => {
    const escape = (text: string) =>
      text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')

    const blocks: [number, string][] = []
    let idx = 0

    document.querySelectorAll('.lia-code__input').forEach((codeInput: Element) => {
      codeInput.setAttribute('data-code-index', idx.toString())

      try {
        const aceEditor = codeInput.querySelector('.ace_editor')
        const aceContent = aceEditor?.querySelector('.ace_text-layer')

        if (!aceEditor || !aceContent) {
          blocks.push([idx, ''])
          idx++
          return
        }

        const gutterCells = aceEditor.querySelectorAll('.ace_gutter-cell')
        const lineNumbers: string[] = []
        gutterCells.forEach((cell: Element) => {
          const n = cell.textContent?.trim()
          if (n && !isNaN(parseInt(n))) lineNumbers.push(n)
        })

        const bgColor = window.getComputedStyle(aceEditor as HTMLElement).backgroundColor || '#f5f5f5'

        let codeHTML = ''
        let lineIndex = 0

        // Helper: render a single .ace_line element's content as HTML string
        const renderLineContent = (line: Element): string => {
          let lineHTML = ''
          const hasTokenSpans = line.querySelector('span[class*="ace_"]') !== null
          if (hasTokenSpans) {
            line.childNodes.forEach((node: ChildNode) => {
              if (node.nodeType === Node.TEXT_NODE) {
                // Plain text node — raw space/whitespace between tokens
                const text = node.textContent || ''
                // Strip Ace zero-width / invisible control chars but keep real spaces
                const cleaned = text.replace(/[\u200B-\u200D\uFEFF]/g, '')
                if (cleaned) lineHTML += escape(cleaned)
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                const tokenEl = node as HTMLElement
                // Recurse one level: Ace sometimes nests spans (e.g. ace_indent_guide inside ace_indent)
                const text = tokenEl.textContent || ''
                if (!text) return
                const cleaned = text.replace(/[\u200B-\u200D\uFEFF]/g, '')
                if (!cleaned) return
                const color = window.getComputedStyle(tokenEl).color
                const fontWeight = window.getComputedStyle(tokenEl).fontWeight
                const fontStyle = window.getComputedStyle(tokenEl).fontStyle
                const escaped = escape(cleaned)
                let style = ''
                if (color && color !== 'rgb(0, 0, 0)' && color !== 'rgba(0, 0, 0, 0)') {
                  style += `color:${color};`
                }
                if (fontWeight === 'bold' || parseInt(fontWeight) >= 700) style += 'font-weight:bold;'
                if (fontStyle === 'italic') style += 'font-style:italic;'
                lineHTML += style ? `<span style="${style}">${escaped}</span>` : escaped
              }
            })
          } else {
            const cleanText = (line.textContent || '').replace(/[\u200B-\u200D\uFEFF\n]/g, '')
            lineHTML += escape(cleanText)
          }
          return lineHTML
        }

        aceContent.querySelectorAll('.ace_line_group').forEach((lineGroup: Element) => {
          // Each .ace_line_group represents ONE logical source line
          const subLines = lineGroup.querySelectorAll('.ace_line')
          if (subLines.length === 0) return

          let lineHTML = ''

          // Emit the gutter line number for this logical line
          if (lineIndex < lineNumbers.length) {
            lineHTML += `<span style="color:#858585;display:inline-block;width:3em;text-align:right;margin-right:1em;user-select:none;">${lineNumbers[lineIndex]}</span>`
            lineIndex++
          }

          // Concatenate content from every sub-line (soft-wrap continuations)
          subLines.forEach((line: Element) => {
            lineHTML += renderLineContent(line)
          })

          codeHTML += `<span style="display:block;">${lineHTML}\n</span>`
        })

        const html =
          `<pre style="background-color:${bgColor};padding:1em;border-radius:4px;` +
          `border-left:3px solid #4caf50;overflow-x:auto;font-family:monospace;` +
          `white-space:pre;margin:0.5em 0;">` +
          `<code style="display:block;">${codeHTML}</code></pre>`

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

/**
 * Screenshots every <lia-abcjs> music-notation element
 *
 * @param page - Puppeteer page instance
 * @returns Map of ABC block indexes to base64 PNG data URIs
 */
async function screenshotAbcBlocks(page: Page): Promise<Map<number, string>> {
  const abcImages = new Map<number, string>()

  // Tag each .lia-code-terminal that wraps a <lia-abcjs> element
  const abcCount = await page.evaluate(() => {
    let abcIndex = 0
    document.querySelectorAll('.lia-code-terminal').forEach((terminal: Element) => {
      if (terminal.querySelector('lia-abcjs')) {
        terminal.setAttribute('data-abc-index', abcIndex.toString())
        abcIndex++
      }
    })
    return abcIndex
  })

  // Find each <lia-abcjs> element and capture a screenshot of its rendered SVG content
  for (let i = 0; i < abcCount; i++) {
    try {
      const elements = await page.$$('lia-abcjs')
      const el = elements[i]
      if (!el) continue

      const svgDataUri = await page.evaluate((host: Element) => {
        const svg = host.shadowRoot?.getElementById('paper')?.querySelector('svg')
        if (!svg) return null
        const svgString = new XMLSerializer().serializeToString(svg)
        return 'data:image/svg+xml;base64,' + btoa(svgString)
      }, el)

      if (svgDataUri) {
        abcImages.set(i, svgDataUri)
      }
    } catch (e) {
      console.error(`Failed to convert ABC block ${i}:`, e)
    }
  }

  return abcImages
}

/**
 * Extracts SVG from standalone <lia-abcjs> elements (NOT inside .lia-code-terminal).
 * These come from imported template macros like @ABCJS.render.
 *
 * @param page - Puppeteer page instance
 * @returns Map of standalone ABC indexes to base64 SVG data URIs
 */
async function screenshotStandaloneAbcBlocks(page: Page): Promise<Map<number, string>> {
  const standaloneAbcImages = new Map<number, string>()

  // Tag each <lia-abcjs> that is NOT inside a .lia-code-terminal
  const count = await page.evaluate(() => {
    let idx = 0
    document.querySelectorAll('lia-abcjs').forEach((el: Element) => {
      if (!el.closest('.lia-code-terminal')) {
        el.setAttribute('data-standalone-abc-index', idx.toString())
        idx++
      }
    })
    return idx
  })

  // Extract SVG from each standalone <lia-abcjs> element's Shadow DOM
  for (let i = 0; i < count; i++) {
    try {
      const el = await page.$(`lia-abcjs[data-standalone-abc-index="${i}"]`)
      if (!el) continue

      const svgDataUri = await page.evaluate((host: Element) => {
        const svg = host.shadowRoot?.getElementById('paper')?.querySelector('svg')
        if (!svg) return null
        const svgString = new XMLSerializer().serializeToString(svg)
        return 'data:image/svg+xml;base64,' + btoa(svgString)
      }, el)

      if (svgDataUri) {
        standaloneAbcImages.set(i, svgDataUri)
      }
    } catch (e) {
      console.error(`Failed to convert standalone ABC block ${i}:`, e)
    }
  }

  return standaloneAbcImages
}

/**
 * Extracts SVG from every <lia-chart> element (ECharts, open Shadow DOM)
 *
 * @param page - Puppeteer page instance
 * @returns Map of chart indexes to base64 SVG data URIs
 */
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
        const svgString = new XMLSerializer().serializeToString(svg)
        return 'data:image/svg+xml;base64,' + btoa(svgString)
      }, el)

      if (svgDataUri) {
        images.set(i, svgDataUri)
      }
    } catch (e) {
      console.error(`Failed to extract chart ${i}:`, e)
    }
  }

  return images
}

/**
 * Extracts rendered KaTeX HTML from every <lia-formula> element (open Shadow DOM)
 *
 * @param page - Puppeteer page instance
 * @returns Map of formula indexes to rendered KaTeX HTML strings
 */
async function extractFormulaHtml(page: Page): Promise<Map<number, string>> {
  const result = await page.evaluate(() => {
    const formulas: [number, string][] = []
    let idx = 0

    document.querySelectorAll('lia-formula').forEach((el: Element) => {
      el.setAttribute('data-formula-index', idx.toString())

      try {
        const shadow = el.shadowRoot
        if (!shadow) {
          formulas.push([idx, ''])
          idx++
          return
        }

        // Collect all <style> content from the Shadow DOM
        let styleHTML = ''
        shadow.querySelectorAll('style').forEach((s: Element) => {
          styleHTML += `<style>${s.textContent || ''}</style>`
        })

        // Get the rendered KaTeX span
        const span = shadow.querySelector('span')
        if (!span) {
          formulas.push([idx, ''])
          idx++
          return
        }

        const spanClone = span.cloneNode(true) as HTMLElement
        const mathml = spanClone.querySelector('.katex-mathml')

        if (mathml) {
          // Extract the <math> element from inside .katex-mathml
          const mathEl = mathml.querySelector('math')
          formulas.push([idx, mathEl ? mathEl.outerHTML : spanClone.outerHTML])
        } else {
          // Fallback: strip MathML and use visual HTML if no MathML found
          spanClone.querySelectorAll('.katex-mathml').forEach((m) => m.remove())
          formulas.push([idx, styleHTML + spanClone.outerHTML])
        }
      } catch (e) {
        formulas.push([idx, ''])
      }

      idx++
    })

    return formulas
  })

  return new Map(result)
}

/**
 * Tags matching elements with a data attribute index, then screenshots each one
 *
 * @param page       - Puppeteer page instance
 * @param selector   - CSS selector to find elements
 * @param dataAttr   - data-attribute name used for indexing (e.g. 'data-svg-index')
 * @param label      - human-readable label for error messages
 * @param tagFilter  - optional filter run inside page.evaluate(); receives each
 *                     matched element and returns true to tag it
 * @returns Map of element indexes to base64 PNG data URIs
 */
async function screenshotTaggedElements(
  page: Page,
  selector: string,
  dataAttr: string,
  label: string,
  tagFilter?: string, // JS function body: (el) => boolean, serialised as string
): Promise<Map<number, string>> {
  const count = await page.evaluate(
    (sel: string, attr: string, filterBody: string | null) => {
      let idx = 0
      const filterFn = filterBody ? new Function('el', filterBody) as (el: Element) => boolean : null
      document.querySelectorAll(sel).forEach((el: Element) => {
        if (!filterFn || filterFn(el)) {
          el.setAttribute(attr, idx.toString())
          idx++
        }
      })
      return idx
    },
    selector,
    dataAttr,
    tagFilter ?? null,
  )

  const images = new Map<number, string>()
  for (let i = 0; i < count; i++) {
    try {
      const el = await page.$(`${selector}[${dataAttr}="${i}"]`)
      if (el) {
        const screenshot = await el.screenshot({ type: 'png' })
        images.set(i, `data:image/png;base64,${Buffer.from(screenshot).toString('base64')}`)
      }
    } catch (e) {
      console.error(`Failed to screenshot ${label} ${i}:`, e)
    }
  }

  return images
}
