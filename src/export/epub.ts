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

    // Extract the complete HTML including inline styles and processed content
    const htmlContent = await page.evaluate(() => {
      // Get the main content area
      const content = document.body

      return content ? content.outerHTML : document.body.innerHTML
    })

    // Extract inline CSS from the page
    const inlineCSS = await page.evaluate(() => {
      const styles: string[] = []
      // Get all style tags
      document.querySelectorAll('style').forEach((style) => {
        styles.push(style.textContent || '')
      })
      return styles.join('\n')
    })

    console.log('Building EPUB file...')

    // Parse authors if comma-separated
    let authors: string | string[] = argument['epub-author'] || 'Unknown'
    if (typeof authors === 'string' && authors.includes(',')) {
      authors = authors.split(',').map((a) => a.trim())
    }

    // Parse fonts if comma-separated
    let fonts: string[] = []
    if (argument['epub-fonts']) {
      fonts = argument['epub-fonts'].split(',').map((f) => f.trim())
    }

    // Read custom CSS if provided
    let customCSS = inlineCSS
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
    const epubOptions = {
      title: argument['epub-title'],
      author: authors,
      publisher: argument['epub-publisher'],
      cover: argument['epub-cover'],
      description: argument['epub-description'],
      lang: argument['epub-language'] || DEFAULT_LANG,
      tocTitle: argument['epub-toc-title'] || DEFAULT_TOC_TITLE,
      appendChapterTitles:
        argument['epub-chapter-title'] !== undefined ||
        DEFAULT_APPEND_CHAPTER_TITLES,
      hideToC: argument['epub-hide-toc'] ?? DEFAULT_HIDE_TOC,
      css: customCSS,
      fonts: fonts.length > 0 ? fonts : undefined,
      version: (argument['epub-version'] || DEFAULT_EPUB_VERSION) as 2 | 3,
      content: [
        {
          title:
            argument['epub-chapter-title'] ||
            argument['epub-title'] ||
            'Content',
          data: htmlContent,
        },
      ],
      verbose: false,
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
