/*
 * Opens a packaged player (web, xapi; a zip or a directory) in a real browser
 * and walks every slide through the table of contents, so the check is that
 * the course renders, not merely that its files were copied.
 *
 * SCORM and IMS need an LMS API around the player and are not covered here.
 */
import * as http from 'node:http'
import type { AddressInfo } from 'node:net'
import * as path from 'node:path'
import type { Page } from '@playwright/test'
import { COURSE, Method } from '../fixtures/course'
import { checkRenderedMarkers, findMarkers } from './markers'
import { openPackage, Package } from './package'
import { CheckResult, Problems } from './types'

const TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript',
  '.mjs': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.md': 'text/markdown; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.webm': 'video/webm',
  '.mp4': 'video/mp4',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.wasm': 'application/wasm',
  '.xml': 'application/xml',
}

/**
 * Serves a package over HTTP; the player fetches the course, which file://
 * does not allow. Module scripts need a correct MIME type to run at all.
 */
export async function servePackage(
  pkg: Package,
): Promise<{ url: string; missing: string[]; close: () => Promise<void> }> {
  const missing: string[] = []

  const server = http.createServer((req, res) => {
    const file = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname).slice(1) || 'index.html'

    if (!pkg.has(file)) {
      missing.push(file)
      res.statusCode = 404
      res.end()
      return
    }

    res.setHeader('Content-Type', TYPES[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
    res.end(pkg.read(file))
  })

  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address() as AddressInfo

  return {
    url: `http://127.0.0.1:${port}/`,
    missing,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  }
}

export interface RenderOptions {
  method?: Method
  /** A slide counts as rendered once it is unchanged for this long. */
  settleMs?: number
  /** Upper bound per slide, for players that never stop animating. */
  maxSettleMs?: number
}

export async function checkRendered(
  page: Page,
  source: string,
  options: RenderOptions = {},
): Promise<CheckResult> {
  const method: Method = options.method ?? 'cli'
  const settleMs = options.settleMs ?? 2_000
  const maxSettleMs = options.maxSettleMs ?? 10_000
  const problems = new Problems()
  const summary: Record<string, unknown> = {}

  const pageErrors: string[] = []
  const dialogs: string[] = []
  const onError = (err: Error) => pageErrors.push(err.message.split('\n')[0])
  const onDialog = (dialog: any) => {
    dialogs.push(dialog.message())
    dialog.dismiss().catch(() => {})
  }

  page.on('pageerror', onError)
  page.on('dialog', onDialog)

  const server = await servePackage(openPackage(source))

  try {
    await page.goto(`${server.url}index.html`)

    const toc = page.locator('#lia-toc .lia-toc__link')
    try {
      await toc.first().waitFor({ timeout: 30_000 })
    } catch {
      problems.add('course did not render', 'no table of contents after 30 s')
      return { format: 'web', problems: problems.list, markers: [], summary }
    }

    const entries = (await toc.allInnerTexts()).map((t) => t.trim())
    summary.toc = entries.length

    if (JSON.stringify(entries) !== JSON.stringify(COURSE.sections)) {
      problems.add('table of contents', `${JSON.stringify(entries)}`)
    }

    const texts: string[] = []
    const raws: string[] = []
    const empty: string[] = []

    const readSlide = () =>
      page.evaluate(() => {
        // every section is a <main>; only the active one has content
        const main = document.querySelector('main.lia-slide__content') ?? document.body
        const attrs = [...main.querySelectorAll('[alt],[title],[aria-label]')]
          .map((el) => ['alt', 'title', 'aria-label'].map((a) => el.getAttribute(a) ?? '').join(' '))
          .join(' ')
        return { text: `${(main as HTMLElement).innerText}\n${attrs}`, html: main.outerHTML }
      })

    for (let i = 0; i < entries.length; i++) {
      await toc.nth(i).click()

      // Charts and scripts render after the slide appears, one after another;
      // read until the slide stops changing, within a bound.
      // A chart can take ~2 s to appear with nothing changing before, so the
      // slide must stay quiet for `settleMs`, not merely between two reads.
      let slide = await readSlide()
      let quietSince = Date.now()
      for (const deadline = Date.now() + maxSettleMs; Date.now() < deadline; ) {
        await page.waitForTimeout(250)
        const next = await readSlide()
        if (next.html !== slide.html) {
          slide = next
          quietSince = Date.now()
        } else if (Date.now() - quietSince >= settleMs) {
          break
        }
      }

      texts.push(slide.text)
      raws.push(slide.html)

      if (slide.text.replace(/\s+/g, ' ').trim().length <= entries[i].length + 5) {
        empty.push(entries[i])
      }
    }

    problems.many('empty slides', empty)
    problems.many('uncaught page errors', [...new Set(pageErrors)], 5)
    problems.many('files the player requested but the package lacks', [...new Set(server.missing)])
    Object.assign(summary, { dialogs })

    const markers = findMarkers(texts.join('\n'))
    checkRenderedMarkers(problems, 'web', method, markers, raws.join('\n'))

    return { format: 'web', problems: problems.list, markers, summary }
  } finally {
    page.off('pageerror', onError)
    page.off('dialog', onDialog)
    await server.close()
  }
}
