import * as helper from './helper'
import * as COLOR from '../colorize'
const path = require('path')
const fs = require('fs-extra')
import puppeteer from 'puppeteer'
const Epub = require('epub-gen')

export function help() {
  console.log('')
  console.log(COLOR.heading('EPUB settings:'), '\n')

  COLOR.info(
    'EPUB export generates eBook documents from your LiaScript course using Puppeteer. The content is extracted and packaged into a standard EPUB format compatible with most eBook readers.'
  )

  console.log('\nLearn more: https://pptr.dev/ \n')

  COLOR.command(
    null,
    '--epub-author',
    '             Author name for the EPUB metadata'
  )
  COLOR.command(
    null,
    '--epub-publisher',
    '          Publisher name for the EPUB metadata'
  )
  COLOR.command(null, '--epub-cover', '              Path to cover image file')
  COLOR.command(
    null,
    '--epub-stylesheet',
    '         Inject a local CSS for changing the appearance'
  )
  COLOR.command(
    null,
    '--epub-theme',
    '              LiaScript themes: default, turquoise, blue, red, yellow'
  )
  COLOR.command(
    null,
    '--epub-timeout',
    '            Set an additional time horizon to wait until finished'
  )
  COLOR.command(
    null,
    '--epub-preview',
    '            Open preview-browser (default false)'
  )
}

export interface EpubExportArguments {
  input: string
  readme: string
  output: string
  format: string
  path: string
  key?: string
  'epub-author'?: string
  'epub-publisher'?: string
  'epub-cover'?: string
  'epub-stylesheet'?: string
  'epub-theme'?: string
  'epub-timeout'?: number
  'epub-preview'?: boolean
}

export const format = 'epub'

export async function exporter(argument: EpubExportArguments, data?: any) {
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
    headless: argument['epub-preview'] ? false : true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    channel: process.env.PUPPETEER_EXECUTABLE_PATH ? undefined : 'chrome',
  })
  const page = await browser.newPage()

  console.warn(
    'depending on the size of the course, this can take a while, please be patient...'
  )

  // Handle alert boxes so they don't block
  page.on('dialog', async (dialog) => {
    console.log(dialog.type())
    console.log(dialog.message())
    await dialog.accept()
  })

  try {
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 300000,
    })
  } catch (e) {
    console.warn('epub generation failed:', e)
  }

  if (argument['epub-stylesheet']) {
    const href = path.resolve(dirname + '/../', argument['epub-stylesheet'])

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

  if (argument['epub-theme']) {
    await page.evaluate(async (theme) => {
      document.documentElement.classList.remove('lia-theme-default')
      document.documentElement.classList.add('lia-theme-' + theme)
    }, argument['epub-theme'])
  }

  if (!argument['epub-preview']) {
    await helper.sleep(argument['epub-timeout'] || 10000)
    await toEPUB(argument, browser, page, data)
  }
}

async function toEPUB(argument: any, browser: any, page: any, data: any) {
  try {
    // Extract content from the page
    const content = await page.evaluate(() => {
      const title =
        document.querySelector('h1')?.textContent ||
        document.title ||
        'LiaScript Course'

      // Helper function to clone element with computed styles as inline styles
      const cloneWithComputedStyles = (element: Element): string => {
        const clone = element.cloneNode(true) as Element

        // Simplify Ace editor elements for EPUB compatibility
        const aceEditors = clone.querySelectorAll('.ace_editor, .ace-editor')
        aceEditors.forEach((editor) => {
          const codeContent =
            editor.querySelector('.ace_text-layer')?.textContent ||
            editor.textContent ||
            ''

          // Replace complex Ace editor with simple pre/code block
          const pre = document.createElement('pre')
          const code = document.createElement('code')
          code.textContent = codeContent
          code.style.cssText =
            'display: block; font-family: monospace; white-space: pre-wrap; padding: 10px; background-color: #f5f5f5; border: 1px solid #ccc; overflow-x: auto;'
          pre.appendChild(code)
          pre.style.cssText = 'margin: 1em 0; padding: 0;'

          editor.parentNode?.replaceChild(pre, editor)
        })

        const allElements = [clone, ...Array.from(clone.querySelectorAll('*'))]

        allElements.forEach((el, index) => {
          const original =
            index === 0 ? element : element.querySelectorAll('*')[index - 1]
          if (original) {
            const computedStyle = window.getComputedStyle(original as Element)
            const importantStyles = [
              'color',
              'background-color',
              'font-size',
              'font-family',
              'font-weight',
              'text-align',
              'margin',
              'padding',
              'border',
              'width',
              'height',
              'display',
              'position',
              'top',
              'left',
              'right',
              'bottom',
              'line-height',
              'white-space',
            ]

            let inlineStyle = (el as HTMLElement).getAttribute('style') || ''
            importantStyles.forEach((prop) => {
              const value = computedStyle.getPropertyValue(prop)
              if (value && value !== 'none' && value !== 'auto') {
                if (!inlineStyle.includes(prop)) {
                  inlineStyle += `${prop}: ${value}; `
                }
              }
            })

            if (inlineStyle) {
              ;(el as HTMLElement).setAttribute('style', inlineStyle)
            }
          }
        })

        return clone.innerHTML
      }

      // Try to extract sections as chapters
      const sections = Array.from(document.querySelectorAll('section'))

      if (sections.length > 0) {
        return {
          title,
          chapters: sections.map((section, index) => {
            const heading =
              section.querySelector('h1, h2, h3')?.textContent ||
              `Chapter ${index + 1}`
            return {
              title: heading,
              data: cloneWithComputedStyles(section),
            }
          }),
        }
      } else {
        // Fallback: use the entire body content
        return {
          title,
          chapters: [
            {
              title: title,
              data: cloneWithComputedStyles(document.body),
            },
          ],
        }
      }
    })

    // Extract styles from the page
    const styles = await page.evaluate(() => {
      const allStyles = []

      // 1. Extract from <style> tags
      const styleTags = Array.from(document.querySelectorAll('style'))
      styleTags.forEach((tag) => {
        allStyles.push(tag.textContent)
      })

      // 2. Extract from styleSheets (includes <link> stylesheets)
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          if (sheet.cssRules) {
            const rules = Array.from(sheet.cssRules)
            allStyles.push(rules.map((rule) => rule.cssText).join('\n'))
          }
        } catch (e) {
          // Cross-origin stylesheets can't be accessed
          if (sheet.href) {
            console.warn('CORS restricted stylesheet:', sheet.href)
          }
        }
      }

      return allStyles.join('\n\n')
    })

    // Prepare EPUB options
    const options: any = {
      title: data?.definition?.title || content.title,
      author: argument['epub-author'] || data?.definition?.author || 'Unknown',
      publisher: argument['epub-publisher'] || 'LiaScript',
      content: content.chapters,
      css: styles, // Add extracted styles
      verbose: true,
    }

    // Add cover if provided
    if (argument['epub-cover']) {
      const coverPath = path.resolve(argument['epub-cover'])
      if (fs.existsSync(coverPath)) {
        options.cover = coverPath
      }
    }

    // Add description if available
    if (data?.definition?.comment) {
      options.description = data.definition.comment
    }

    console.warn(`Extracted ${styles.length} characters of CSS`)

    // Generate EPUB
    console.warn('Generating EPUB file...')
    await new Epub(options, argument.output + '.epub').promise

    console.warn(`EPUB created: ${argument.output}.epub`)
  } catch (e) {
    console.warn('Failed to generate EPUB:', e)
  }

  await browser.close()
}
