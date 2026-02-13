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
 * Shows both LiaScript-specific settings and EPUB generation options.
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
  COLOR.command(
    null,
    '--epub-title',
    '              Title of the book (required)',
  )
  COLOR.command(
    null,
    '--epub-author',
    '             Author name(s), comma-separated for multiple authors',
  )

  console.log('')
  console.log(COLOR.heading('Optional settings:'), '\n')

  COLOR.command(null, '--epub-publisher', '          Publisher name')
  COLOR.command(
    null,
    '--epub-cover',
    '              Path to cover image (absolute path or URL)',
  )
  COLOR.command(null, '--epub-description', '        Book description')
  COLOR.command(
    null,
    '--epub-language',
    `           Language code in 2 letters (default: ${DEFAULT_LANG})`,
  )
  COLOR.command(
    null,
    '--epub-version',
    `            EPUB version: 2 or 3 (default: ${DEFAULT_EPUB_VERSION})`,
  )
  COLOR.command(
    null,
    '--epub-stylesheet',
    '        Path to custom CSS file for styling',
  )
  COLOR.command(
    null,
    '--epub-theme',
    '              LiaScript theme: default, turquoise, blue, red, yellow',
  )
  COLOR.command(
    null,
    '--epub-toc-title',
    `         Title for table of contents (default: "${DEFAULT_TOC_TITLE}")`,
  )
  COLOR.command(
    null,
    '--epub-hide-toc',
    '           Hide table of contents in the generated EPUB (default: false)',
  )
  COLOR.command(
    null,
    '--epub-timeout',
    `            Additional wait time for rendering in ms (default: ${DEFAULT_TIMEOUT_MS})`,
  )
  COLOR.command(
    null,
    '--epub-fonts',
    '             Comma-separated paths to custom font files to embed',
  )
  COLOR.command(
    null,
    '--epub-chapter-title',
    '     Custom title for the main chapter (default: course title)',
  )
  COLOR.command(
    null,
    '--epub-preview',
    '           Open preview browser for debugging (default: false)',
  )
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
export async function exporter(argument: EpubExportArguments, json: any) {
  console.log('Starting EPUB export with arguments:', argument)
  // Validate required parameters

  const dirname = helper.dirname()

  // Use web assets instead of pdf assets for better resource loading
  let url = `file://${dirname}/assets/pdf/index.html?`

  if (helper.isURL(argument.input)) {
    url += argument.input
  } else {
    url += 'file://' + path.resolve(argument.input)
  }

  console.log('EPUB export started with URL:', json)

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

    console.log(
      'Loading course content... This may take a while for large courses.',
    )

    // Handle alert dialogs automatically to prevent blocking
    page.on('dialog', async (dialog) => {
      console.log(`[Dialog ${dialog.type()}]: ${dialog.message()}`)
      await dialog.accept()
    })

    // Set up render done listener BEFORE navigating to catch the signal
    let renderDoneResolve: () => void
    const renderDonePromise = new Promise<void>((resolve) => {
      renderDoneResolve = resolve
    })

    page.on('console', (msg) => {
      const text = msg.text()
      if (text.startsWith('__RENDER_DONE__')) {
        console.log('got render done signal:', text)
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
        throw new Error(
          `Failed to apply theme '${argument['epub-theme']}': ${e}`,
        )
      }
    }

    if (!argument['epub-preview']) {
      // Wait for LiaScript to signal rendering is complete
      await renderDonePromise

      // Additional wait time for any final rendering
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
    // Clean up resources based on mode
    if (argument['epub-preview']) {
      // In preview mode, keep browser open but inform user
      console.log('Browser kept open for preview. Close manually when done.')
    } else {
      // In normal mode, always close browser and page
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
    console.log('Extracting rendered HTML content...')

    // Extract chapters from main elements
    // Each main element becomes a separate chapter in the EPUB
    const chapters = await page.evaluate(() => {
      // Clone body to avoid modifying the actual page
      const bodyClone = document.body.cloneNode(true) as HTMLElement

      // Remove problematic link tags (icons, manifests, preconnect, etc.)
      // Keep only inline styles, scripts are removed by EPUB processor
      const linksToRemove = bodyClone.querySelectorAll(
        'link[rel="icon"], link[rel="shortcut icon"], link[rel="apple-touch-icon"], ' +
          'link[rel="manifest"], link[rel="preconnect"], link[rel="dns-prefetch"], ' +
          'link[rel="preload"], link[rel="stylesheet"]',
      )

      linksToRemove.forEach((link) => link.remove())

      // Process terminal output blocks first (before Ace editors)
      const terminals = bodyClone.querySelectorAll('.lia-code-terminal')
      console.log(`Found ${terminals.length} terminal output blocks`)

      terminals.forEach((terminal) => {
        try {
          const terminalOutput = terminal.querySelector('lia-terminal')
          if (terminalOutput) {
            const pre = document.createElement('pre')
            const code = document.createElement('code')

            // Style as terminal with dark background
            pre.setAttribute(
              'style',
              'background-color: #1e1e1e; color: #d4d4d4; padding: 1em; ' +
                'border-radius: 4px; font-family: monospace; overflow-x: auto;',
            )

            // Extract text from terminal divs
            const textDivs = terminalOutput.querySelectorAll(
              'div[class^="text-"]',
            )
            if (textDivs.length > 0) {
              textDivs.forEach((div) => {
                const text = div.textContent || ''
                const span = document.createElement('span')
                span.textContent = text

                // Preserve text type styling (info, error, warning)
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
            console.log('Replaced terminal block with styled output')
          }
        } catch (e) {
          console.error('Error processing terminal block:', e)
        }
      })

      // Fix Ace Editor code blocks - extract text with syntax highlighting and line numbers
      // Ace editor creates complex DOM structures that don't work in EPUB
      const codeInputs = bodyClone.querySelectorAll('.lia-code__input')
      console.log(`Found ${codeInputs.length} code editor blocks`)

      codeInputs.forEach((codeInput) => {
        try {
          const aceEditor = codeInput.querySelector('.ace_editor')
          if (!aceEditor) return

          // Get line numbers from gutter
          const gutterCells = aceEditor.querySelectorAll('.ace_gutter-cell')
          const lineNumbers: string[] = []
          gutterCells.forEach((cell) => {
            const lineNum = cell.textContent?.trim()
            if (lineNum && !isNaN(parseInt(lineNum))) {
              lineNumbers.push(lineNum)
            }
          })

          // Get code content from ace editor
          const aceContent = aceEditor.querySelector('.ace_text-layer')
          if (!aceContent) return

          // Extract lines with syntax highlighting preserved as inline styles
          // Only query for line groups, not individual lines, to avoid duplication
          const aceLineGroups = aceContent.querySelectorAll('.ace_line_group')

          // Create a simple pre/code block
          const pre = document.createElement('pre')
          const code = document.createElement('code')

          // Style for code blocks with light background
          pre.setAttribute(
            'style',
            'background-color: #f5f5f5; padding: 1em; border-radius: 4px; ' +
              'border-left: 3px solid #4caf50; overflow-x: auto; font-family: monospace; ' +
              'display: block; white-space: pre-wrap;',
          )

          // Also style the code element to ensure it's contained
          code.setAttribute('style', 'display: block;')

          let lineIndex = 0
          if (aceLineGroups.length > 0) {
            aceLineGroups.forEach((lineGroup) => {
              // Each line group contains one or more ace_line elements
              const lines = lineGroup.querySelectorAll('.ace_line')

              lines.forEach((line) => {
                // Build line as HTML string for better control
                let lineHTML = ''

                // Add line number if available
                if (lineIndex < lineNumbers.length) {
                  const lineNum = lineNumbers[lineIndex]
                  lineHTML += `<span style="color: #858585; display: inline-block; width: 3em; text-align: right; margin-right: 1em;">${lineNum}</span>`
                  lineIndex++
                }

                // Extract tokens with their colors
                const tokens = line.querySelectorAll('span[class*="ace_"]')

                if (tokens.length > 0) {
                  tokens.forEach((token) => {
                    const text = token.textContent || ''
                    if (!text.trim()) return

                    const computedStyle = window.getComputedStyle(token)
                    const color = computedStyle.color

                    if (
                      color &&
                      color !== 'rgb(0, 0, 0)' &&
                      color !== 'rgba(0, 0, 0, 0)'
                    ) {
                      lineHTML += `<span style="color: ${color};">${text}</span>`
                    } else {
                      lineHTML += text
                    }
                  })
                } else {
                  // No tokens, just get plain text
                  const text = line.textContent || ''
                  lineHTML += text.replace(/[\u200B-\u200D\uFEFF\n]/g, '')
                }

                // Create a span element for this line and set its innerHTML
                const lineSpan = document.createElement('span')
                lineSpan.innerHTML = lineHTML
                lineSpan.setAttribute(
                  'style',
                  'display: block; white-space: nowrap;',
                )

                code.appendChild(lineSpan)
              })
            })
          }

          pre.appendChild(code)

          // Replace the entire code input block with the pre/code block
          codeInput.replaceWith(pre)
          console.log(
            `Replaced code editor with line numbers and syntax highlighting`,
          )
        } catch (e) {
          console.error('Error processing code editor:', e)
        }
      })

      // Extract chapters from main elements
      const mainElements = bodyClone.querySelectorAll('main')
      const chapterList: Array<{ title: string; data: string }> = []

      if (mainElements.length > 0) {
        console.log(
          `Found ${mainElements.length} main elements to convert to chapters`,
        )

        mainElements.forEach((main, index) => {
          // Extract chapter title from first header with h1-h6 class
          let chapterTitle = `Chapter ${index + 1}`

          const header = main.querySelector('header')
          if (header) {
            // Look for h tags with classes .h1 to .h6
            const hTag = header.querySelector('.h1, .h2, .h3, .h4, .h5, .h6')
            if (hTag && hTag.textContent) {
              chapterTitle = hTag.textContent.trim()
            }
          }

          // Get the HTML content of this main element
          const chapterData = main.outerHTML

          chapterList.push({
            title: chapterTitle,
            data: chapterData,
          })

          console.log(`  Chapter ${index + 1}: ${chapterTitle}`)
        })

        return chapterList
      } else {
        // No main elements found, return entire body as single chapter
        console.log(
          'No main elements found, using entire body as single chapter',
        )
        return [
          {
            title: 'Content',
            data: bodyClone.outerHTML,
          },
        ]
      }
    })

    console.log('Reading CSS and fonts directly from dist/assets/pdf folder...')

    // Read CSS directly from the pdf assets folder
    const pdfAssetsPath = path.join(dirname, 'assets', 'pdf')
    const cssFiles = fs
      .readdirSync(pdfAssetsPath)
      .filter((f) => f.endsWith('.css'))

    let allCSS = ''
    const fontPaths: string[] = []

    if (cssFiles.length > 0) {
      console.log(
        `Found ${cssFiles.length} CSS file(s): ${cssFiles.join(', ')}`,
      )
      // Read and concatenate all CSS files
      cssFiles.forEach((cssFile) => {
        const cssPath = path.join(pdfAssetsPath, cssFile)
        const cssContent = fs.readFileSync(cssPath, 'utf-8')
        allCSS += cssContent + '\n'
      })

      // Extract font filenames from CSS
      const fontMatches = allCSS.match(
        /url\(['"]?([^'")\s]+\.(?:woff2?|ttf|otf|eot))['"]?\)/gi,
      )
      if (fontMatches) {
        const uniqueFonts = new Set<string>()
        fontMatches.forEach((match) => {
          const fontMatch = match.match(/url\(['"]?([^'")\s]+)['"]?\)/)
          if (fontMatch && fontMatch[1]) {
            // Extract just the filename (remove any path components)
            const fontFilename = path.basename(fontMatch[1])
            uniqueFonts.add(fontFilename)
          }
        })

        // Convert font filenames to absolute file system paths
        uniqueFonts.forEach((fontFilename) => {
          const fontPath = path.join(pdfAssetsPath, fontFilename)
          if (fs.existsSync(fontPath)) {
            fontPaths.push(fontPath)
          } else {
            console.warn(`Warning: Font file not found: ${fontPath}`)
          }
        })

        console.log(`Found ${fontPaths.length} font files referenced in CSS:`)
        fontPaths.forEach((font) => console.log(`  - ${path.basename(font)}`))
      }
    } else {
      console.warn('Warning: No CSS files found in pdf assets folder')
    }

    // Also scan directory for KaTeX font files specifically
    // KaTeX fonts follow pattern: KaTeX_*.woff2, KaTeX_*.woff, KaTeX_*.ttf
    console.log('Scanning for KaTeX font files...')
    const allFiles = fs.readdirSync(pdfAssetsPath)
    const katexFonts = allFiles.filter(
      (f) =>
        f.startsWith('KaTeX_') &&
        (f.endsWith('.woff') || f.endsWith('.woff2') || f.endsWith('.ttf')),
    )

    katexFonts.forEach((fontFile) => {
      const fontPath = path.join(pdfAssetsPath, fontFile)
      // Only add if not already in the list
      if (!fontPaths.includes(fontPath) && fs.existsSync(fontPath)) {
        fontPaths.push(fontPath)
      }
    })

    console.log(`Total fonts to embed: ${fontPaths.length}`)
    if (fontPaths.length > 0) {
      fontPaths.forEach((font) => console.log(`  - ${path.basename(font)}`))
    }

    console.log('Building EPUB file...')
    console.log(`Total chapters to include: ${chapters.length}`)

    // Parse authors if comma-separated
    let authors: string | string[] = argument['epub-author'] || 'Unknown'
    if (typeof authors === 'string' && authors.includes(',')) {
      authors = authors.split(',').map((a) => a.trim())
    }

    // Start with fonts from filesystem
    let fonts: string[] = [...fontPaths]

    // Add any custom fonts specified in arguments
    if (argument['epub-fonts']) {
      const customFonts = argument['epub-fonts'].split(',').map((f) => f.trim())
      fonts.push(...customFonts)
    }

    // Read custom CSS if provided and prepend to extracted CSS
    let customCSS = allCSS
    if (argument['epub-stylesheet']) {
      try {
        const cssPath = path.resolve(argument['epub-stylesheet'])
        const cssContent = fs.readFileSync(cssPath, 'utf-8')
        customCSS = cssContent + '\n' + customCSS
      } catch (e) {
        console.warn(`Warning: Could not read custom stylesheet: ${e}`)
      }
    }

    // Configure EPUB options
    const epubOptions: any = {
      title: argument['epub-title'],
      author: authors,
      lang: argument['epub-language'] || DEFAULT_LANG,
      tocTitle: argument['epub-toc-title'] || DEFAULT_TOC_TITLE,
      appendChapterTitles:
        argument['epub-chapter-title'] !== undefined ||
        DEFAULT_APPEND_CHAPTER_TITLES,
      hideToC: argument['epub-hide-toc'] ?? DEFAULT_HIDE_TOC,
      css: customCSS,
      version: (argument['epub-version'] || DEFAULT_EPUB_VERSION) as 2 | 3,
      content: chapters, // Use extracted chapters from main elements
      verbose: false,
    }

    // Add optional fields only if provided
    if (argument['epub-publisher']) {
      epubOptions.publisher = argument['epub-publisher']
    }
    if (argument['epub-cover']) {
      epubOptions.cover = argument['epub-cover']
    }
    if (argument['epub-description']) {
      epubOptions.description = argument['epub-description']
    }
    if (fonts.length > 0) {
      epubOptions.fonts = fonts
    }

    // Generate EPUB
    const outputPath = argument.output.endsWith('.epub')
      ? argument.output
      : argument.output + '.epub'

    const epub = new EPub(epubOptions, outputPath)
    await epub.render()

    console.log(`EPUB successfully generated: ${outputPath}`)
  } catch (e) {
    const error = e as Error
    throw new Error(`Failed to generate EPUB: ${error.message}`)
  }
}
