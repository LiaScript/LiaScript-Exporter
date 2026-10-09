/*
 * Runs exported SCORM packages in a real LMS, the way a learner would.
 *
 *   node run.mjs moodle   <url> <cmid>...   activities already imported by lms.sh
 *   node run.mjs ilias    <url> <zip>...    imports each package itself
 *   node run.mjs openolat <url> <zip>...    imports each package itself
 *
 * Every package is opened twice. The first visit answers the fixture course's
 * text quiz ("MKQuizText", tests/fixtures/course) and moves to slide 5; the
 * second checks that the LMS brought both back. Every call the LMS's own SCORM
 * API answers is recorded, so a value the LMS rejects shows up with its error
 * code. Prints one JSON record per package.
 */
import path from 'node:path'
import { chromium } from '@playwright/test'

const [platform, base, ...items] = process.argv.slice(2)
const PASSWORD = 'LiaTest-2026'
// LMS_SHOTS=<dir>: a screenshot of every page an error leaves behind
const SHOTS = process.env.LMS_SHOTS
let current

async function shoot(name) {
  if (!SHOTS || !current) return
  await current.screenshot({ path: path.join(SHOTS, `${platform}-${name}.png`) }).catch(() => {})
}

if (!['moodle', 'ilias', 'openolat'].includes(platform) || !base || items.length === 0) {
  console.error('usage: node run.mjs moodle|ilias|openolat <url> <cmid|zip>...')
  process.exit(1)
}

/** Wraps a SCORM API object so every call lands in window.__calls. */
function wrapApi(api) {
  if (!api || api.__hooked) return
  api.__hooked = true
  const lastError = (api.LMSGetLastError || api.GetLastError)?.bind(api)
  for (const fn of ['LMSInitialize', 'LMSSetValue', 'LMSGetValue', 'LMSCommit', 'LMSFinish',
    'Initialize', 'SetValue', 'GetValue', 'Commit', 'Terminate']) {
    if (typeof api[fn] !== 'function') continue
    const orig = api[fn].bind(api)
    api[fn] = (...args) => {
      const result = orig(...args)
      ;(window.__calls = window.__calls || []).push({
        fn, args: args.map(String), result: String(result), err: String(lastError ? lastError() : '?'),
      })
      return result
    }
  }
}

/** Init script: catches window.API / API_1484_11 the moment the LMS sets them. */
function hookApiOnAssign(wrap) {
  // eslint-disable-next-line no-new-func
  const wrapApi = new Function(`return (${wrap})`)()
  for (const name of ['API', 'API_1484_11']) {
    let api
    try {
      Object.defineProperty(window, name, {
        configurable: true,
        get: () => api,
        set: (value) => { api = value; wrapApi(value) },
      })
    } catch {}
  }
}

/** The frame running LiaScript, once the fixture course shows. */
async function liaFrame(page) {
  for (let i = 0; i < 90; i++) {
    for (const frame of page.frames()) {
      const ready = await frame
        .evaluate(() => /MK[A-Z][a-z]+/.test(document.body?.innerText || '') && !!window.LIA?.goto)
        .catch(() => false)
      if (ready) return frame
    }
    await page.waitForTimeout(1000)
  }
  return null
}

async function calls(page) {
  const all = []
  for (const frame of page.frames()) {
    all.push(...(await frame.evaluate(() => window.__calls || []).catch(() => [])))
  }
  return all
}

const quizInput = (frame) => frame.locator('xpath=//*[contains(text(),"MKQuizText")]/following::input[1]')

/** First visit: answer the quiz, go to slide 5. Second visit: read both back. */
async function exercise(page, open, record, { revisit = true } = {}) {
  const frame = await open()
  record.rendered = !!frame
  if (!frame) return

  await page.waitForTimeout(2000)
  await frame.evaluate(() => window.LIA.goto(13))
  try {
    await quizInput(frame).waitFor({ timeout: 15000 })
    await quizInput(frame).fill('Paris')
    await frame.locator('xpath=//*[contains(text(),"MKQuizText")]/following::button[1]').click()
    record.quiz = 'answered'
  } catch (e) {
    record.quiz = 'failed: ' + e.message.split('\n')[0]
  }
  await page.waitForTimeout(2000)
  await frame.evaluate(() => window.LIA.goto(4))
  await page.waitForTimeout(3000)

  const made = await calls(page)
  record.apiCalls = made.length
  record.apiErrors = [...new Set(made
    // reading a value that was never set (401/403) is normal on a first visit
    .filter((c) => c.err !== '0' && c.err !== '?' && !(/GetValue/.test(c.fn) && ['401', '403'].includes(c.err)))
    .map((c) => `${c.fn}(${c.args.join(', ').slice(0, 80)}) -> ${c.err}`))]

  if (!revisit) return

  await page.goto(base) // leave, as a learner closing the activity
  await page.waitForTimeout(3000)

  const again = await open()
  if (!again) return
  await page.waitForTimeout(4000)
  record.resumedAt = await again.evaluate(() =>
    [...document.querySelectorAll('h1,h2')].filter((h) => h.offsetParent).map((h) => h.innerText.trim())[0])
  record.resumedOnSlide5 = record.resumedAt === 'Blockquotes'
  await again.evaluate(() => window.LIA.goto(13))
  await page.waitForTimeout(2500)
  record.quizRestored = (await quizInput(again).inputValue({ timeout: 5000 }).catch(() => null)) === 'Paris'
}

// --- Moodle -------------------------------------------------------------------

async function moodle(browser) {
  const context = await browser.newContext()
  await context.addInitScript(hookApiOnAssign, wrapApi.toString())
  const page = await context.newPage()

  await page.goto(`${base}/login/index.php`)
  // the login page's own requests must settle, or they overwrite its token
  await page.waitForLoadState('networkidle')
  await page.fill('#username', 'admin')
  await page.fill('#password', PASSWORD)
  await page.click('#loginbtn')
  await page.waitForURL((url) => !url.pathname.startsWith('/login'))

  const open = (cmid) => async () => {
    await page.goto(`${base}/mod/scorm/view.php?id=${cmid}`)
    if (await page.locator('#scormviewform button#n').count()) {
      await page.locator('#scormviewform button#n').click() // "Enter", not "Preview"
    } else {
      const normal = page.locator('#scormviewform input[name="mode"][value="normal"]') // Moodle 3
      if (await normal.count()) await normal.check()
      await page.locator('#scormviewform input[type="submit"]').click()
    }
    await page.waitForURL(/player\.php/)
    return liaFrame(page)
  }

  const results = []
  for (const cmid of items) {
    const record = { cmid }
    try {
      await exercise(page, open(cmid), record)
    } catch (e) {
      record.error = e.message.split('\n')[0]
    }
    results.push(record)
  }
  return results
}

// --- ILIAS --------------------------------------------------------------------

async function ilias(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
  await context.addInitScript(hookApiOnAssign, wrapApi.toString())
  const page = await context.newPage()

  await page.goto(`${base}/login.php`)
  await page.waitForLoadState('networkidle')
  const form = page.locator('form:has(input[type="password"])')
  await form.locator('input[type="text"]').first().fill('root')
  await form.locator('input[type="password"]').fill(PASSWORD)
  await form.locator('input[type="password"]').press('Enter')
  await page.waitForURL(/ilDashboard/i)

  const results = []
  for (const zip of items) {
    const name = path.basename(zip, '.zip')
    const record = { package: name }
    try {
      const manifest = await import('node:child_process').then(({ execFileSync }) =>
        execFileSync('unzip', ['-p', zip, 'imsmanifest.xml']).toString())
      const type = /<schemaversion>\s*1\.2/.test(manifest) ? 'scorm' : 'scorm2004'

      await page.goto(`${base}/ilias.php?baseClass=ilRepositoryGUI&ref_id=1&cmd=create&new_type=sahs`)
      await page.locator(`#sub_type_${type}`).check()
      await page.locator('#scormfile').setInputFiles(zip)
      await page.locator('input[name="cmd[upload]"]').click()
      await page.waitForLoadState('networkidle')
      const ref = page.url().match(/ref_id=(\d+)/)?.[1]
      if (!ref || ref === '1') throw new Error('import failed: ' + page.url())
      record.ref = ref

      await exercise(page, async () => {
        await page.goto(`${base}/ilias.php?baseClass=ilSAHSPresentationGUI&ref_id=${ref}`)
        return liaFrame(page)
      }, record)
    } catch (e) {
      record.error = e.message.split('\n')[0]
    }
    results.push(record)
  }
  return results
}

// --- OpenOlat -----------------------------------------------------------------

/**
 * OpenOlat allows one session per user, so every step logs in afresh. The
 * first login ever also accepts the terms and replaces the default password.
 */
async function openolatLogin(browser) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 1000 } })
  const page = await context.newPage()
  current = page

  const attempt = async (password) => {
    await page.goto(`${base}/`)
    await page.waitForLoadState('networkidle')
    const user = page.locator('input[type="text"]:visible').first()
    await user.fill('administrator')
    await user.press('Enter')
    const field = page.locator('input[type="password"]:visible').first()
    await field.waitFor()
    await field.fill(password)
    await field.press('Enter')
    await page.waitForTimeout(3000)
    // the first login stays on /dmz/ behind the terms of use
    return !page.url().includes('/dmz/') || (await page.locator('dialog[open]').count()) > 0
  }

  if (!(await attempt(`${PASSWORD}-oo`)) && !(await attempt('openolat'))) {
    throw new Error('OpenOlat login failed')
  }

  // Dialogs after login, each may come a moment late: terms of use, password
  // change (first login only), "resume your last session?"
  const dialog = page.locator('dialog[open]')
  for (let round = 0; round < 4; round++) {
    if (!(await dialog.first().waitFor({ timeout: 4000 }).then(() => true, () => false))) break

    const passwords = dialog.locator('input[type="password"]:visible')
    if (await dialog.getByRole('button', { name: 'Accept' }).count()) {
      await dialog.locator('input[type="checkbox"]').first().check()
      await dialog.getByRole('button', { name: 'Accept' }).click()
    } else if ((await passwords.count()) === 3) {
      await passwords.nth(0).fill('openolat')
      await passwords.nth(1).fill(`${PASSWORD}-oo`)
      await passwords.nth(2).fill(`${PASSWORD}-oo`)
      await dialog.getByRole('button', { name: 'Save' }).first().click()
    } else if (await dialog.getByRole('button', { name: 'No' }).count()) {
      await dialog.getByRole('button', { name: 'No' }).click()
    } else {
      break
    }
    await page.waitForTimeout(1500)
  }
  return { context, page }
}

async function openolat(browser) {
  const results = []
  for (const zip of items) {
    const name = path.basename(zip, '.zip')
    const record = { package: name }
    try {
      const importer = await openolatLogin(browser)
      const page = importer.page
      await page.locator('a:has-text("Authoring")').first().click()
      await page.waitForTimeout(2500)
      await page.locator('a:has-text("Import"), button:has-text("Import")').first().click()
      await page.waitForTimeout(2000)
      await page.locator('dialog[open] input[type="file"]').setInputFiles(zip)
      await page.waitForTimeout(4000)
      record.detectedAs = (await page.locator('dialog[open]').innerText()).match(/Type\s*\n?\s*([^\n]+)/)?.[1]?.trim()
      if (!record.detectedAs || record.detectedAs === 'n/a') {
        // OpenOlat imports SCORM 1.2 only; the Import button stays disabled
        record.error = 'OpenOlat does not recognise this package type'
        await importer.context.close()
        results.push(record)
        continue
      }
      await page.locator('dialog[open] input[type="text"]:visible').last().fill(name)
      await page.locator('dialog[open] button:has-text("Import")').click()
      await page.waitForURL(/RepositoryEntry\/\d+/, { timeout: 60000 })
      record.entry = page.url().match(/RepositoryEntry\/(\d+)/)[1]
      await importer.context.close()

      // played in a session of its own: the importing one reopens the settings
      const player = await openolatLogin(browser)
      await exercise(player.page, async () => {
        await player.page.goto(`${base}/auth/RepositoryEntry/${record.entry}`)
        const frame = await liaFrame(player.page)
        // hooked late: catching OpenOlat's API at page start breaks its setup
        for (const f of player.page.frames()) {
          await f.evaluate(`(${wrapApi.toString()})(window.API)`).catch(() => {})
        }
        return frame
      }, record, { revisit: false })
      // Started by its owner from the authoring view, OpenOlat runs a package
      // as a preview that keeps no progress, so there is nothing to revisit
      record.note = 'preview run: OpenOlat tracks only inside a published course'
      await player.context.close()
    } catch (e) {
      record.error = e.message.split('\n')[0]
      await shoot(name)
    }
    results.push(record)
  }
  return results
}

const browser = await chromium.launch()
try {
  const results = await { moodle, ilias, openolat }[platform](browser)
  console.log(JSON.stringify(results, null, 1))
} finally {
  await browser.close()
}
