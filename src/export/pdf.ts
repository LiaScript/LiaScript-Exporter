import { isURL } from './helper'

const path = require('path')
const puppeteer = require('puppeteer')

export async function pdf(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string

    // special cases for SCORM
    organization?: string
    masteryScore?: string
    typicalDuration?: string

    // special cases for PDF
    pdfPreview?: boolean
    pdfTimeout?: number
    pdfFormat?: string
    pdfPrintBackground?: boolean
    pdfDisplayHeaderFooter?: boolean
  },
  json
) {
  let url = `file://${__dirname}/assets/pdf/index.html?`

  if (isURL(argument.input)) {
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
    headless: argument.pdfPreview ? false : true,
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

  await page.goto(url, {
    waitUntil: 'networkidle2',
    // remove timeout
    timeout: 0,
  })

  await page.evaluate(async () => {
    const style = document.createElement('style')
    style.type = 'text/css'
    const content = `
      .lia-quiz__control {
        display: none;
      }

      .lia-table__sort {
        display: none !important;
      }

      .lia-accordion__toggle {
        visibility: hidden;
        width: 5px !important;
      }

      .lia-code-terminal__output {
        height: fit-content !important;
        max-height: 800px !important;
      }

      .lia-table-responsive {
        max-height: fit-content !important;
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

  if (!argument.pdfPreview)
    setTimeout(async function () {
      await page.emulateMediaType('screen')
      await page.pdf({
        path: argument.output + '.pdf',
        format: argument.pdfFormat || 'a4',
        printBackground: argument.pdfPrintBackground || true,
        displayHeaderFooter: argument.pdfDisplayHeaderFooter || false,
        margin: {
          top: 80,
          bottom: 80,
          left: 30,
          right: 30,
        },
      })
      await browser.close()
    }, argument.pdfTimeout || 30000)
}
