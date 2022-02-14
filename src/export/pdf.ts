import * as helper from './helper'

const path = require('path')
const puppeteer = require('puppeteer')

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
  let url = `file://${__dirname}/assets/pdf/index.html?`

  if (helper.isURL(argument.input)) {
    url += argument.input
  } else {
    url += 'file:///' + path.resolve(__dirname + '/../', argument.input)
  }

  const browser = await puppeteer.launch({
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--unhandled-rejections=strict',
      '--disable-features=BlockInsecurePrivateNetworkRequests',
    ],
    headless: argument['pdf-preview'] ? false : true,
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
  } catch (e) {}

  if (argument['pdf-stylesheet']) {
    const href = path.resolve(__dirname + '/../', argument['pdf-stylesheet'])

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
  if (!argument['pdf-preview'])
    setTimeout(async function () {
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
      await browser.close()
    }, argument['pdf-timeout'] || 30000)
}
