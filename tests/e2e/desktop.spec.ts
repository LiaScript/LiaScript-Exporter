/*
 * Desktop smoke test: launches the Electron app and exports through its window
 * the way a user does.
 *
 *   npm run build && npm run test:desktop
 *   DESKTOP_APP=release/linux-unpacked/liascript-exporter npm run test:desktop
 *                                     the packaged app (npm run electron:pack)
 *
 * The app is the export server plus its UI in a window, and the server suite
 * already runs every format through that server. So this file does not repeat
 * the matrix. It covers only what the desktop app does differently:
 *
 * - main.js starts the server (ts-node in dev, dist/ in the package) and the
 *   window loads it with the preload bridge.
 * - the upload area opens the native file dialog, whose files reach the page
 *   as base64 instead of through <input type=file>.
 * - the job queue finds the CLI and presets by Electron-only paths, and runs
 *   the CLI with the Electron binary (ELECTRON_RUN_AS_NODE), which has to
 *   start Chrome for docx.
 * - the download goes through Electron's download handling.
 * - the update banner, wired to the main process over IPC.
 *
 * Native dialogs cannot be driven, so the tests replace `dialog.showOpenDialog`
 * and `shell.openExternal` in the main process and set the save path of each
 * download. The update check is stubbed too: the real one asks GitHub.
 *
 * The window opens on the current display; on a machine without one, run
 * under `xvfb-run`.
 */
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { _electron as electron, ElectronApplication, expect, Page, test } from '@playwright/test'
import { checkOutput, Format } from '../checkers'
import { zipCourse } from '../fixtures/course'

const ROOT = path.resolve(__dirname, '../..')
const OUT_DIR = path.join(ROOT, 'test-results/desktop-exports')
/** The packaged executable to test instead of `electron/main.js`. */
const PACKAGED = process.env.DESKTOP_APP ? path.resolve(ROOT, process.env.DESKTOP_APP) : undefined

const QUICK_TIMEOUT = 90_000
const CHROME_TIMEOUT = 150_000

interface App {
  app: ElectronApplication
  page: Page
  /** Messages of every alert/confirm the app raised; they signal errors. */
  dialogs: string[]
  log: string[]
  /** Its TMPDIR; Chrome puts a socket there, so it must stay short. */
  tmp: string
}

async function launch(): Promise<App> {
  if (!PACKAGED && !fs.existsSync(path.join(ROOT, 'dist/index.js'))) {
    throw new Error('dist/index.js is missing; run npm run build first')
  }
  if (PACKAGED && !fs.existsSync(PACKAGED)) {
    throw new Error(`${PACKAGED} is missing; run npm run electron:pack first`)
  }

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'liat-'))
  const env = { ...process.env, TMPDIR: tmp } as Record<string, string>
  // Playwright sets this for its own browsers; the app's server must not inherit it.
  delete env.ELECTRON_RUN_AS_NODE

  const app = await electron.launch({
    ...(PACKAGED
      ? { executablePath: PACKAGED, args: ['--no-sandbox'] }
      : { args: [path.join(ROOT, 'electron/main.js')] }),
    // In dev the job queue finds the CLI at <cwd>/dist/index.js.
    cwd: ROOT,
    env,
    timeout: 60_000,
  })

  const log: string[] = []
  app.process().stdout?.on('data', (chunk) => log.push(String(chunk)))
  app.process().stderr?.on('data', (chunk) => log.push(String(chunk)))

  const page = await app.firstWindow()
  const session: App = { app, page, dialogs: [], log, tmp }

  page.on('dialog', (dialog) => {
    session.dialogs.push(dialog.message())
    void dialog.dismiss()
  })
  page.on('pageerror', (error) => log.push(`pageerror: ${error.message}\n`))

  // The window shows about:blank until the server is up.
  await page.waitForURL(/^http:\/\/localhost:\d+\//, { timeout: 60_000 })
  await expect(page.locator('#submitBtn')).toBeVisible()

  return session
}

async function close(session: App | undefined): Promise<void> {
  if (!session) return
  await session.app.close().catch(() => {})
  fs.rmSync(session.tmp, { recursive: true, force: true })
}

/** Makes the next native file dialog return these files. */
async function stubFileDialog(app: ElectronApplication, files: string[]): Promise<void> {
  await app.evaluate(({ dialog }, filePaths) => {
    dialog.showOpenDialog = (async () => ({ canceled: false, filePaths })) as any
  }, files)
}

/** Saves every download to `dir` instead of asking where. */
async function saveDownloadsTo(app: ElectronApplication, dir: string): Promise<void> {
  await app.evaluate(({ session }, dir) => {
    const g = globalThis as any
    g.__downloads = []
    session.defaultSession.on('will-download', (_event, item) => {
      // `require` is not in scope here; the test only runs where `/` separates paths.
      const entry = { file: `${dir}/${item.getFilename()}`, state: 'progressing' }
      g.__downloads.push(entry)
      item.setSavePath(entry.file)
      item.once('done', (_e: unknown, state: string) => (entry.state = state))
    })
  }, dir)
}

async function downloads(app: ElectronApplication): Promise<{ file: string; state: string }[]> {
  return app.evaluate(() => (globalThis as any).__downloads ?? [])
}

async function choose(page: Page, format: string): Promise<void> {
  await page.locator('[data-export-tab="formats"]').click()
  await page.locator(`.preset-tile:has(input[name="format"][value="${format}"])`).click()
  await expect(page.locator(`input[name="format"][value="${format}"]`)).toBeChecked()
}

async function attachLog(session: App, testInfo: import('@playwright/test').TestInfo) {
  await testInfo.attach('electron.log', {
    body: [...session.dialogs.map((d) => `dialog: ${d}\n`), ...session.log].join(''),
    contentType: 'text/plain',
  })
}

let courseZip: string

test.beforeAll(() => {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  courseZip = path.join(OUT_DIR, 'course.zip')
  fs.writeFileSync(courseZip, zipCourse())
})

test.describe('window', () => {
  let session: App | undefined

  test.afterEach(async ({}, testInfo) => {
    if (session) await attachLog(session, testInfo)
    await close(session)
    session = undefined
  })

  test('starts the server, loads the UI and exposes the preload bridge', async () => {
    session = await launch()

    // Otherwise a DESKTOP_APP run could silently test the sources.
    expect(await session.app.evaluate(({ app }) => app.isPackaged)).toBe(!!PACKAGED)

    const api =await session.page.evaluate(() => {
      const api = (window as any).electronAPI
      return api && Object.keys(api).sort()
    })
    expect(api).toEqual(expect.arrayContaining(['openFileDialog', 'checkForUpdates', 'openExternal']))

    // The presets come from an Electron-only path; without them there are no tiles.
    await expect(session.page.locator('input[name="preset"]').first()).toBeAttached()
    expect(session.dialogs).toEqual([])
  })

  test('the update banner opens the release page when the app cannot self-update', async () => {
    session = await launch()
    const { app, page } = session
    const releaseUrl = 'https://github.com/LiaScript/LiaScript-Exporter/releases/tag/v99.0.0'

    await app.evaluate(({ ipcMain, shell }, releaseUrl) => {
      const g = globalThis as any
      g.__opened = []
      shell.openExternal = (async (url: string) => void g.__opened.push(url)) as any
      ipcMain.removeHandler('app:checkForUpdates')
      ipcMain.handle('app:checkForUpdates', () => ({ supported: false, hasUpdate: true, releaseUrl }))
    }, releaseUrl)

    await page.reload()
    await expect(page.locator('#update-banner')).toBeVisible()
    await page.locator('#update-btn').click()

    await expect.poll(() => app.evaluate(() => (globalThis as any).__opened)).toEqual([releaseUrl])
  })
})

interface Case {
  format: Format
  ext: string
  timeout: number
}

const CASES: Case[] = [
  { format: 'json', ext: 'json', timeout: QUICK_TIMEOUT },
  // Starts Chrome from a CLI run by the Electron binary.
  { format: 'docx', ext: 'docx', timeout: CHROME_TIMEOUT },
]

test.describe('exports', () => {
  for (const c of CASES) {
    test(`${c.format}: file dialog → export → download passes its checker`, async ({}, testInfo) => {
      test.setTimeout(c.timeout + 90_000)

      const session = await launch()
      const { app, page } = session
      const dir = path.join(OUT_DIR, c.format)
      fs.rmSync(dir, { recursive: true, force: true })
      fs.mkdirSync(dir, { recursive: true })

      try {
        await stubFileDialog(app, [courseZip])
        await saveDownloadsTo(app, dir)

        await choose(page, c.format)
        await page.locator('#uploadArea').click()
        await expect(page.locator('#fileList .file-item')).toHaveCount(1)
        await expect(page.locator('#fileList .file-name')).toHaveText('course.zip')

        await page.locator('#submitBtn').click()
        await expect(page.locator('#confirmationModal')).toBeVisible({ timeout: 60_000 })
        await page.locator('#statusLink').click()
        await page.waitForURL(/status\.html\?jobId=/)

        const done = page.locator('#statusContent .status-completed, #statusContent .status-failed')
        await expect(done).toBeVisible({ timeout: c.timeout })
        expect(
          await page.locator('#statusContent .status-failed').isVisible(),
          await page.locator('#statusContent').innerText(),
        ).toBe(false)

        await page.locator('#statusContent button[onclick="downloadResult()"]').click()
        await expect
          .poll(async () => (await downloads(app)).map((d) => d.state), { timeout: 30_000 })
          .toEqual(['completed'])

        const [{ file }] = await downloads(app)
        expect(path.extname(file)).toBe(`.${c.ext}`)
        expect(session.dialogs, 'the app raised a dialog').toEqual([])

        const check = await checkOutput(c.format, file, { method: 'cli' })
        await testInfo.attach('checker.json', {
          body: JSON.stringify(check, null, 2),
          contentType: 'application/json',
        })
        expect(check.problems).toEqual([])
      } finally {
        await attachLog(session, testInfo)
        await close(session)
      }
    })
  }
})
