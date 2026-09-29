/*
 * Web app matrix: drives the static browser build the way a user does —
 * upload the course zip, pick a format, submit, open the status page, press
 * download — and judges the file with the shared checkers.
 *
 *   npm run webapp:build && npm run test:webapp
 *   DEEP=1 npm run test:webapp        + xmllint and epubcheck
 *   NETWORK=1 npm run test:webapp     + GitHub import
 *
 * The web app re-implements every exporter in the browser, so unlike the
 * server it gets the same deep checks as the CLI. `fullJson` is reached
 * through the "Full JSON" box, as in the UI; android is server-only.
 *
 * pdf has no file to download: the app opens LiaScript's print view in a new
 * tab, which calls `window.print()`. The test stubs `print`, waits for that
 * call and prints the tab with `page.pdf()` — the same Chrome print engine
 * "Save as PDF" uses, honouring the injected `@page` rule.
 *
 * A case with a `bug` is marked `test.fail()`; delete the `bug` once fixed.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { Browser, BrowserContext, expect, Page, test } from '@playwright/test'
import { checkOutput, Format } from '../checkers'
import { openPackage } from '../checkers/package'
import { checkRendered, servePackage } from '../checkers/render'
import { COURSE_DIR, zipCourse } from '../fixtures/course'

const ROOT = path.resolve(__dirname, '../..')
const BUILD = path.join(ROOT, 'dist/webapp/build')
const OUT_DIR = path.join(ROOT, 'test-results/webapp-exports')

const DEEP = !!process.env.DEEP && process.env.DEEP !== '0'
const NETWORK = !!process.env.NETWORK && process.env.NETWORK !== '0'

const QUICK_TIMEOUT = 90_000
// Formats that render the whole course in the tab first
const RENDER_TIMEOUT = 150_000

interface Case {
  name: string
  format: Format
  /** The tile to pick; `fullJson` is the json tile plus its option. */
  tile: string
  /** Checkboxes (by id) to tick in the advanced settings. */
  tick?: string[]
  timeout: number
  /** Also walk every slide of the downloaded player. */
  render?: boolean
  /** Known bug that fails this case in every tier. */
  bug?: string
  /** Known bug that fails this case only with DEEP=1. */
  deepBug?: string
}

// Slowest first, so the two workers finish at about the same time.
const CASES: Case[] = [
  { name: 'docx', format: 'docx', tile: 'docx', timeout: RENDER_TIMEOUT },
  { name: 'epub', format: 'epub', tile: 'epub', timeout: RENDER_TIMEOUT },
  { name: 'pdf', format: 'pdf', tile: 'pdf', timeout: RENDER_TIMEOUT },
  { name: 'scorm1.2', format: 'scorm1.2', tile: 'scorm1.2', timeout: QUICK_TIMEOUT },
  { name: 'scorm2004', format: 'scorm2004', tile: 'scorm2004', timeout: QUICK_TIMEOUT },
  { name: 'ims', format: 'ims', tile: 'ims', timeout: QUICK_TIMEOUT },
  // "Package as ZIP" is ticked by default for web and xapi.
  { name: 'web', format: 'web', tile: 'web', timeout: QUICK_TIMEOUT, render: true },
  { name: 'xapi', format: 'xapi', tile: 'xapi', timeout: QUICK_TIMEOUT, render: true },
  { name: 'json', format: 'json', tile: 'json', timeout: QUICK_TIMEOUT },
  { name: 'fullJson', format: 'fullJson', tile: 'json', tick: ['jsonFull'], timeout: QUICK_TIMEOUT },
  { name: 'rdf', format: 'rdf', tile: 'rdf', timeout: QUICK_TIMEOUT },
]

let appURL = ''
let closeApp: (() => Promise<void>) | undefined

test.describe.configure({ mode: 'parallel' })

// Each worker serves its own copy of the build.
test.beforeAll(async () => {
  if (!fs.existsSync(path.join(BUILD, 'index.html'))) {
    throw new Error(`${BUILD} is missing; run npm run webapp:build first`)
  }
  fs.mkdirSync(OUT_DIR, { recursive: true })

  const app = await servePackage(openPackage(BUILD))
  appURL = app.url
  closeApp = app.close
})

test.afterAll(async () => {
  await closeApp?.()
})

interface Session {
  context: BrowserContext
  page: Page
  /** Messages of every alert/confirm the app raised; they signal errors. */
  dialogs: string[]
  /** Page errors and console errors, for the report. */
  log: string[]
}

/**
 * A fresh context per export: the app keeps its jobs in IndexedDB and runs one
 * at a time, so a shared context would block the next test on the last one.
 */
async function openApp(browser: Browser): Promise<Session> {
  const context = await browser.newContext({ acceptDownloads: true })

  // The pdf print tab calls window.print(); record it instead of opening the
  // (headless: no-op) dialog, so the test knows when the render is ready.
  await context.addInitScript(() => {
    window.print = () => {
      ;(window as any).__printed = true
    }
  })

  const page = await context.newPage()
  const session: Session = { context, page, dialogs: [], log: [] }

  page.on('dialog', (dialog) => {
    session.dialogs.push(dialog.message())
    void dialog.dismiss()
  })
  page.on('pageerror', (error) => session.log.push(`pageerror: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') session.log.push(`console: ${message.text()}`)
  })

  await page.goto(appURL)
  await expect(page.locator('#submitBtn')).toBeVisible()
  // `window.LiaExporter` is what switches the UI to in-tab exports.
  expect(await page.evaluate(() => !!(window as any).LiaExporter)).toBe(true)

  return session
}

/** Picks a format tile (or preset tile) and ticks the given checkboxes. */
async function choose(page: Page, target: { format?: string; preset?: string }, tick: string[] = []) {
  if (target.format) {
    await page.locator('[data-export-tab="formats"]').click()
    await page.locator(`.preset-tile:has(input[name="format"][value="${target.format}"])`).click()
    await expect(page.locator(`input[name="format"][value="${target.format}"]`)).toBeChecked()
  } else {
    await page.locator(`.preset-tile:has(input[name="preset"][value="${target.preset}"])`).click()
    await expect(page.locator(`input[name="preset"][value="${target.preset}"]`)).toBeChecked()
  }

  if (tick.length) {
    const advanced = page.locator('#advancedSettings')
    if (await advanced.evaluate((el) => el.classList.contains('hidden'))) {
      await page.locator('#toggleAdvanced').click()
    }
    for (const id of tick) await page.locator(`#${id}`).check()
  }
}

/** Uploads through the drop zone's file dialog, as a click would. */
async function upload(page: Page, files: { name: string; mimeType: string; buffer: Buffer }[]) {
  const chooser = page.waitForEvent('filechooser')
  await page.locator('#uploadArea').click()
  await (await chooser).setFiles(files)
  await expect(page.locator('#fileList .file-item')).toHaveCount(files.length)
}

const courseUpload = () => [{ name: 'course.zip', mimeType: 'application/zip', buffer: zipCourse() }]

interface Result {
  status: 'completed' | 'failed' | 'refused'
  error?: string
  /** The downloaded (or, for pdf, printed) file. */
  file?: string
}

/**
 * Submits the form, follows the confirmation to the status page, waits for the
 * job there (the page is what runs it) and fetches the result.
 */
async function submitAndCollect(session: Session, name: string, timeout: number): Promise<Result> {
  const { page } = session

  await page.locator('#submitBtn').click()

  const modal = page.locator('#confirmationModal')
  await expect
    .poll(async () => (await modal.isVisible()) || session.dialogs.length > 0, { timeout: 60_000 })
    .toBe(true)

  // The form answers a bad submission with alert() and no job.
  if (!(await modal.isVisible())) return { status: 'refused', error: session.dialogs.join('\n') }

  await page.locator('#statusLink').click()
  await page.waitForURL(/status\.html\?jobId=/)

  const done = page.locator('#statusContent .status-completed, #statusContent .status-failed')
  await expect(done).toBeVisible({ timeout })

  if (await page.locator('#statusContent .status-failed').isVisible()) {
    return { status: 'failed', error: await page.locator('#statusContent').innerText() }
  }

  const button = page.locator('#statusContent button[onclick="downloadResult()"]')
  const isPrint = await page.evaluate(() => (window as any).lastJobData?.job?.print === true)

  if (isPrint) {
    const popup = page.context().waitForEvent('page')
    await button.click()
    const tab = await popup

    await tab.waitForFunction(() => (window as any).__printed === true, null, { timeout })
    const file = path.join(OUT_DIR, `${name}.pdf`)
    await tab.pdf({ path: file, preferCSSPageSize: true, printBackground: true })
    await tab.close()

    return { status: 'completed', file }
  }

  const download = page.waitForEvent('download')
  await button.click()
  const saved = await download

  const file = path.join(OUT_DIR, `${name}${path.extname(saved.suggestedFilename())}`)
  await saved.saveAs(file)

  return { status: 'completed', file }
}

async function attachLog(session: Session, testInfo: import('@playwright/test').TestInfo) {
  await testInfo.attach('browser.log', {
    body: [...session.dialogs.map((d) => `dialog: ${d}`), ...session.log].join('\n'),
    contentType: 'text/plain',
  })
}

for (const c of CASES) {
  test.describe(c.name, () => {
    // One export per format, shared by its tests; serial keeps them in one worker.
    test.describe.configure({ mode: 'serial' })

    let result: Result
    let session: Session

    test.beforeAll(async ({ browser }) => {
      test.setTimeout(c.timeout + 60_000)

      session = await openApp(browser)
      await choose(session.page, { format: c.tile }, c.tick)
      await upload(session.page, courseUpload())
      result = await submitAndCollect(session, c.name, c.timeout)
    })

    test.afterAll(async () => {
      await session?.context.close()
    })

    test('exports and passes its checker', async ({}, testInfo) => {
      const bug = c.bug ?? (DEEP ? c.deepBug : undefined)
      test.fail(!!bug, bug)

      await attachLog(session, testInfo)

      expect(result.status, result.error).toBe('completed')
      expect(session.dialogs, 'the app raised a dialog').toEqual([])

      const check = await checkOutput(c.format, result.file!, { method: 'webapp', deep: DEEP })
      await testInfo.attach('checker.json', {
        body: JSON.stringify(check, null, 2),
        contentType: 'application/json',
      })

      expect(check.problems).toEqual([])
    })

    if (c.render) {
      test('renders every slide in a browser', async ({ page }, testInfo) => {
        expect(result.file, 'nothing was downloaded').toBeTruthy()

        const rendered = await checkRendered(page, result.file!, { method: 'webapp' })
        await testInfo.attach('rendered.json', {
          body: JSON.stringify(rendered, null, 2),
          contentType: 'application/json',
        })

        expect(rendered.problems).toEqual([])
      })
    }
  })
}

test.describe('sources and targets', () => {
  test('android is refused as server-only', async ({ browser }, testInfo) => {
    const session = await openApp(browser)

    try {
      await choose(session.page, { format: 'android' })
      // A required field: without it the browser's own validation stops the
      // submit before the app can say android is unavailable.
      await session.page.locator('#toggleAdvanced').click()
      await session.page.locator('#androidAppId').fill('io.github.liascript.test')
      await upload(session.page, courseUpload())

      const result = await submitAndCollect(session, 'android', QUICK_TIMEOUT)
      await attachLog(session, testInfo)

      expect(result.status).toBe('refused')
      expect(result.error).toMatch(/android/i)
    } finally {
      await session.context.close()
    }
  })

  test('a single README.md upload exports', async ({ browser }, testInfo) => {
    const session = await openApp(browser)

    try {
      await choose(session.page, { format: 'json' })
      await upload(session.page, [
        {
          name: 'README.md',
          mimeType: 'text/markdown',
          buffer: fs.readFileSync(path.join(COURSE_DIR, 'README.md')),
        },
      ])

      const result = await submitAndCollect(session, 'readme-only', QUICK_TIMEOUT)
      await attachLog(session, testInfo)
      expect(result.status, result.error).toBe('completed')

      const check = await checkOutput('json', result.file!, { method: 'webapp' })
      expect(check.problems).toEqual([])
    } finally {
      await session.context.close()
    }
  })

  test('the moodle4 preset exports SCORM 1.2 with its options', async ({ browser }, testInfo) => {
    test.setTimeout(QUICK_TIMEOUT + 60_000)
    const session = await openApp(browser)

    try {
      await choose(session.page, { preset: 'moodle4' })
      await upload(session.page, courseUpload())

      const result = await submitAndCollect(session, 'preset-moodle4', QUICK_TIMEOUT)
      await attachLog(session, testInfo)
      expect(result.status, result.error).toBe('completed')
      expect(path.extname(result.file!)).toBe('.zip')

      const check = await checkOutput('scorm1.2', result.file!, { method: 'webapp', deep: DEEP })
      await testInfo.attach('checker.json', {
        body: JSON.stringify(check, null, 2),
        contentType: 'application/json',
      })
      expect(check.problems).toEqual([])

      // moodle4 sets scormEmbed: the course is bundled into course.js instead
      // of being fetched at runtime.
      expect(openPackage(result.file!).files).toContain('course.js')
    } finally {
      await session.context.close()
    }
  })

  test('GitHub import', async ({ browser }, testInfo) => {
    test.skip(!NETWORK, 'needs NETWORK=1')
    test.setTimeout(3 * 60_000)
    const session = await openApp(browser)

    try {
      const { page } = session
      await choose(page, { format: 'json' })
      await page.locator('[data-tab="git"]').click()
      await page.locator('#gitUrl').fill('https://github.com/LiaPlayground/Quiz-Demo')

      const result = await submitAndCollect(session, 'github', 2 * 60_000)
      await attachLog(session, testInfo)
      expect(result.status, result.error).toBe('completed')

      const text = fs.readFileSync(result.file!, 'utf8')
      expect(() => JSON.parse(text)).not.toThrow()
      expect(text).toContain('Hier muss das Kreuz hin')
    } finally {
      await session.context.close()
    }
  })
})
