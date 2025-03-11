import * as helper from './helper'

const path = require('path')
import puppeteer from 'puppeteer'

export function help() {
  console.log('\nPDF settings:\n')
  console.log(
    '--pdf-stylesheet           Inject an local CSS for changing the appearance.'
  )
  console.log(
    '--pdf-theme                LiaScript themes: default, turquoise, blue, red, yellow'
  )
  console.log(
    '--pdf-timeout              Set an additional time horizon to wait until finished.'
  )
  console.log(
    '\nhttps://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions\n'
  )
  console.log(
    '--pdf-preview              Open preview-browser (default false), print not possible'
  )
  console.log(
    '--pdf-scale                Scale of the webpage rendering. Defaults to 1. Scale amount must be between 0.1 and 2.'
  )
  console.log(
    '--pdf-displayHeaderFooter  Display header and footer. Defaults to false.'
  )
  console.log(
    '--pdf-headerTemplate       HTML template for the print header, inject classes date, title, url, pageNumber, totalPages'
  )

  console.log(
    '--pdf-footerTemplate       HTML template for the print footer. Should use the same format as the headerTemplate'
  )
  console.log(
    '--pdf-printBackground      Print background graphics. Defaults to false'
  )
  console.log(
    '--pdf-landscape            Paper orientation. Defaults to false.'
  )
  console.log(
    '--pdf-pageRanges           Paper ranges to print, e.g., "1-5, 8, 11-13"'
  )
  console.log(
    '--pdf-format               Paper format. If set, takes priority over width or height options. Defaults to a4.'
  )
  console.log(
    '--pdf-width                Paper width, accepts values labeled with units.'
  )
  console.log(
    '--pdf-height               Paper height, accepts values labeled with units.'
  )
  console.log(
    '--pdf-margin-top           Top margin, accepts values labeled with units.'
  )
  console.log(
    '--pdf-margin-right         Right margin, accepts values labeled with units.'
  )
  console.log(
    '--pdf-margin-bottom        Bottom margin, accepts values labeled with units.'
  )
  console.log(
    '--pdf-margin-left          Left margin, accepts values labeled with units. '
  )
  console.log(
    '--pdf-preferCSSPageSize    Give any CSS @page size declared in the page priority over what is declared in width and height or format options.'
  )
  console.log(
    '--pdf-omitBackground       Hides default white background and allows capturing screenshots with transparency. Defaults to true. '
  )
}

export async function exporter(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string

    // special cases for PDF
    'pdf-preview'?: boolean
    'pdf-scale'?: number
    'pdf-displayHeaderFooter'?: string
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

    'pdf-stylesheet'?: string
    'pdf-theme'?: string
  },
  json
) {
  const dirname = helper.dirname()

  let url = `file://${dirname}/assets/pdf/index.html?`

  if (helper.isURL(argument.input)) {
    url += argument.input
  } else {
    url += 'file://' + path.resolve(argument.input)
  }

  const browser = await puppeteer.launch({
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
    headless: argument['pdf-preview'] ? false : 'new',
    // Try to use the system Chrome if available
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    // Add this to use the installed browser if no executable path is provided
    channel: process.env.PUPPETEER_EXECUTABLE_PATH ? undefined : 'chrome',
  })
  const page = await browser.newPage()

  console.warn(
    'depending on the size of the course, this can take a while, please be patient...'
  )

  // this handle the alert - boxes, so that these are not blocking
  page.on('dialog', async (dialog) => {
    console.log(dialog.type())
    console.log(dialog.message())
    await dialog.accept()
  })

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      // remove timeout
      timeout: 0,
    })
  } catch (e) {
    console.warn('pdf generation failed:', e)
  }

  if (argument['pdf-stylesheet']) {
    const href = path.resolve(dirname + '/../', argument['pdf-stylesheet'])

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
  }

  if (argument['pdf-theme']) {
    await page.evaluate(async (theme) => {
      document.documentElement.classList.remove('lia-theme-default')
      document.documentElement.classList.add('lia-theme-' + theme)
    }, argument['pdf-theme'])
  }

  /*
  await page.evaluate(async () => {
    const style = document.createElement('style')
    style.type = 'text/css'
    const content = `
    :root {
  
      --color-highlight: 2,255,0;
  --color-background: 122,122,122;
  --color-border: 0,0,0;
  --color-highlight-dark: 0,0,0;
  --color-highlight-menu: 0,0,0;
  --color-text: 0,0,255;
  --global-font-size: 1rem;
  --font-size-multiplier: 2;
    }
    `
    style.appendChild(document.createTextNode(content))
    const promise = new Promise((resolve, reject) => {
      style.onload = resolve
      style.onerror = reject
    })
    document.head.appendChild(style)
    await promise
  })

  console.warn(argument)
  */
  if (!argument['pdf-preview']) {
    await helper.sleep(argument['pdf-timeout'] || 30000)
    await toPDF(argument, browser, page)
  }
}

async function toPDF(argument: any, browser: any, page: any) {
  try {
    await page.emulateMediaType('screen')
    await page.pdf({
      path: argument.output + '.pdf',
      format: argument['pdf-format'] || 'a4',
      printBackground: argument['pdf-printBackground'] || true,
      displayHeaderFooter: argument['pdf-displayHeaderFooter'] || false,
      margin: {
        top: argument['pdf-margin-top'] || 80,
        bottom: argument['pdf-margin-bottom'] || 80,
        left: argument['pdf-margin-left'] || 30,
        right: argument['pdf-margin-right'] || 30,
      },
      scale: argument['pdf-scale'] || 1,
      headerTemplate: argument['pdf-headerTemplate'],
      footerTemplate: argument['pdf-footerTemplate'] || '',
      landscape: argument['pdf-landscape'] || false,
      width: argument['pdf-width'] || '',
      height: argument['pdf-height'] || '',
      //preferCSSPageSize: argument['pdf-preferCSSPageSize'] || '',
      omitBackground: argument['pdf-omitBackground'] || false,
    })
  } catch (e) {
    console.warn('failed to print to pdf', e)
  }

  await browser.close()
}
