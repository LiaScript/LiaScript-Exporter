import * as helper from './helper'
import * as COLOR from '../colorize'
import * as path from 'path'
import puppeteer, { Browser, Page } from 'puppeteer'

// Default PDF generation settings
const DEFAULT_TIMEOUT_MS = 15000 // 15 seconds
const DEFAULT_MARGIN_TOP = 80
const DEFAULT_MARGIN_BOTTOM = 80
const DEFAULT_MARGIN_LEFT = 30
const DEFAULT_MARGIN_RIGHT = 30
const DEFAULT_SCALE = 1
const DEFAULT_FORMAT = 'a4'
const DEFAULT_PRINT_BACKGROUND = true
const DEFAULT_DISPLAY_HEADER_FOOTER = false
const DEFAULT_LANDSCAPE = false
const DEFAULT_OMIT_BACKGROUND = false

/**
 * Displays help information about PDF export options and settings.
 * Shows both LiaScript-specific settings and Puppeteer PDF options.
 */
export function help() {
  console.log('')
  console.log(COLOR.heading('PDF settings:'), '\n')

  COLOR.info(
    'PDF export generates printable documents from your LiaScript course using Puppeteer, a headless Chrome browser automation tool. This allows for high-quality rendering of all course elements including interactive content.',
  )

  console.log('\nLearn more: https://pptr.dev/ \n')

  COLOR.command(
    null,
    '--pdf-stylesheet',
    '          Inject an local CSS for changing the appearance.',
  )
  COLOR.command(
    null,
    '--pdf-theme',
    '               LiaScript themes: default, turquoise, blue, red, yellow',
  )
  COLOR.command(
    null,
    '--pdf-timeout',
    `             Set an additional time horizon to wait until finished (default ${DEFAULT_TIMEOUT_MS} ms)`,
  )
  COLOR.command(
    null,
    '--pdf-preview',
    '             Open preview-browser (default false), print not possible',
  )

  console.log('')
  console.log(COLOR.italic('The following are puppeteer specific settings.'))

  console.log(
    '\nLearn more:\n  https://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions\n',
  )

  COLOR.command(
    null,
    '--pdf-scale',
    '               Scale of the webpage rendering. Defaults to 1. Scale amount must be between 0.1 and 2.',
  )
  COLOR.command(
    null,
    '--pdf-displayHeaderFooter',
    ' Display header and footer. Defaults to false.',
  )
  COLOR.command(
    null,
    '--pdf-headerTemplate',
    '      HTML template for the print header, inject classes date, title, url, pageNumber, totalPages',
  )

  COLOR.command(
    null,
    '--pdf-footerTemplate',
    '      HTML template for the print footer. Should use the same format as the headerTemplate',
  )
  COLOR.command(
    null,
    '--pdf-printBackground',
    '     Print background graphics. Defaults to false',
  )
  COLOR.command(
    null,
    '--pdf-landscape',
    '           Paper orientation. Defaults to false.',
  )
  COLOR.command(
    null,
    '--pdf-pageRanges',
    '          Paper ranges to print, e.g., "1-5, 8, 11-13"',
  )
  COLOR.command(
    null,
    '--pdf-format',
    '              Paper format. If set, takes priority over width or height options. Defaults to a4.',
  )
  COLOR.command(
    null,
    '--pdf-width',
    '               Paper width, accepts values labeled with units.',
  )
  COLOR.command(
    null,
    '--pdf-height',
    '              Paper height, accepts values labeled with units.',
  )
  COLOR.command(
    null,
    '--pdf-margin-top',
    '          Top margin, accepts values labeled with units.',
  )
  COLOR.command(
    null,
    '--pdf-margin-right',
    '        Right margin, accepts values labeled with units.',
  )
  COLOR.command(
    null,
    '--pdf-margin-bottom',
    '       Bottom margin, accepts values labeled with units.',
  )
  COLOR.command(
    null,
    '--pdf-margin-left',
    '         Left margin, accepts values labeled with units. ',
  )
  COLOR.command(
    null,
    '--pdf-preferCSSPageSize',
    '   Give any CSS @page size declared in the page priority over what is declared in width and height or format options.',
  )
  COLOR.command(
    null,
    '--pdf-omitBackground',
    '      Hides default white background and allows capturing screenshots with transparency. Defaults to true. ',
  )
}

/**
 * Configuration options for PDF export.
 */
export interface PdfExportArguments {
  input: string
  output: string

  // PDF-specific settings
  'pdf-preview'?: boolean
  'pdf-scale'?: number
  'pdf-displayHeaderFooter'?: boolean
  'pdf-headerTemplate'?: string
  'pdf-footerTemplate'?: string
  'pdf-printBackground'?: boolean
  'pdf-landscape'?: boolean
  'pdf-format'?: string
  'pdf-width'?: string | number
  'pdf-height'?: string | number
  'pdf-margin-top'?: string | number
  'pdf-margin-bottom'?: string | number
  'pdf-margin-right'?: string | number
  'pdf-margin-left'?: string | number
  'pdf-preferCSSPageSize'?: boolean
  'pdf-omitBackground'?: boolean
  'pdf-timeout'?: number
  'pdf-pageRanges'?: string

  'pdf-stylesheet'?: string
  'pdf-theme'?: string
}

export const format = 'pdf'

/**
 * Exports a LiaScript course to PDF format using Puppeteer.
 *
 * This function launches a headless Chrome browser, loads the LiaScript content,
 * applies any custom styling or themes, and generates a PDF file.
 *
 * @param argument - Configuration options for the PDF export
 * @throws {Error} If browser launch fails, page navigation fails, or PDF generation fails
 *
 * @example
 * ```typescript
 * await exporter({
 *   input: './course.md',
 *   output: './output',
 *   'pdf-format': 'a4',
 *   'pdf-printBackground': true
 * })
 * ```
 */
export async function exporter(argument: PdfExportArguments) {
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
      headless: !argument['pdf-preview'],
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
        `Failed to launch browser. Make sure Chrome is installed. ${launchError}`,
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

    if (argument['pdf-stylesheet']) {
      const href = path.resolve(dirname + '/../', argument['pdf-stylesheet'])

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
          `Failed to load custom stylesheet from '${argument['pdf-stylesheet']}': ${e}`,
        )
      }
    }

    if (argument['pdf-theme']) {
      try {
        await page.evaluate(async (theme) => {
          document.documentElement.classList.remove('lia-theme-default')
          document.documentElement.classList.add('lia-theme-' + theme)
        }, argument['pdf-theme'])
      } catch (e) {
        throw new Error(
          `Failed to apply theme '${argument['pdf-theme']}': ${e}`,
        )
      }
    }

    if (!argument['pdf-preview']) {
      // Wait for LiaScript to signal rendering is complete
      await renderDonePromise

      // Additional wait time for any final rendering
      if (argument['pdf-timeout']) {
        await helper.sleep(argument['pdf-timeout'])
      }

      await toPDF(argument, page)
    } else {
      console.log('Preview mode enabled - browser will remain open')
    }
  } catch (e) {
    const error = e as Error
    console.error('PDF export failed:', error.message)
    throw new Error(`Failed to export PDF: ${error.message}`)
  } finally {
    // Clean up resources based on mode
    if (argument['pdf-preview']) {
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
 * Generates a PDF file from a Puppeteer page.
 *
 * Emulates screen media type for proper rendering and applies all PDF-specific
 * settings like margins, format, scaling, etc.
 *
 * @param argument - PDF export configuration options
 * @param page - Puppeteer page instance containing the rendered content
 * @throws {Error} If PDF generation fails or media type emulation fails
 */
async function toPDF(argument: PdfExportArguments, page: Page) {
  try {
    await page.emulateMediaType('screen')
  } catch (e) {
    throw new Error(`Failed to emulate media type: ${e}`)
  }

  try {
    await page.pdf({
      path: argument.output + '.pdf',
      format: (argument['pdf-format'] as any) || DEFAULT_FORMAT,
      printBackground:
        argument['pdf-printBackground'] ?? DEFAULT_PRINT_BACKGROUND,
      displayHeaderFooter:
        argument['pdf-displayHeaderFooter'] ?? DEFAULT_DISPLAY_HEADER_FOOTER,
      margin: {
        top: argument['pdf-margin-top'] || DEFAULT_MARGIN_TOP,
        bottom: argument['pdf-margin-bottom'] || DEFAULT_MARGIN_BOTTOM,
        left: argument['pdf-margin-left'] || DEFAULT_MARGIN_LEFT,
        right: argument['pdf-margin-right'] || DEFAULT_MARGIN_RIGHT,
      },
      scale: argument['pdf-scale'] ?? DEFAULT_SCALE,
      headerTemplate: argument['pdf-headerTemplate'],
      footerTemplate: argument['pdf-footerTemplate'] ?? '',
      landscape: argument['pdf-landscape'] ?? DEFAULT_LANDSCAPE,
      width: argument['pdf-width'] ?? '',
      height: argument['pdf-height'] ?? '',
      pageRanges: argument['pdf-pageRanges'],
      preferCSSPageSize: argument['pdf-preferCSSPageSize'],
      omitBackground: argument['pdf-omitBackground'] ?? DEFAULT_OMIT_BACKGROUND,
    })
    console.log(`PDF successfully generated: ${argument.output}.pdf`)
  } catch (e) {
    const error = e as Error
    throw new Error(
      `Failed to generate PDF at '${argument.output}.pdf': ${error.message}`,
    )
  }
}
