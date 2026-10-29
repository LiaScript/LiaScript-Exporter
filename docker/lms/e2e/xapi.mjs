/*
 * Runs an xAPI export against the lab's learning record store.
 *
 *   node xapi.mjs <lrs url> <export.zip | export dir> <api key> <api secret>
 *
 * Serves the package; answers the fixture course's text and multiple-choice
 * quizzes, submits a survey, edits and runs code; moves to slide 5 and
 * reloads, checks that all of it came back, then asks the LRS what it
 * received. Prints one JSON record.
 */
import fs from 'node:fs'
import http from 'node:http'
import os from 'node:os'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import { chromium } from '@playwright/test'

const [lrs, source, key, secret] = process.argv.slice(2)

if (!lrs || !source || !key || !secret) {
  console.error('usage: node xapi.mjs <lrs url> <export.zip|dir> <api key> <api secret>')
  process.exit(1)
}

let root = source
if (fs.statSync(source).isFile()) {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'lia-xapi-'))
  execFileSync('unzip', ['-q', source, '-d', root])
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.md': 'text/markdown',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.xml': 'application/xml' }

const server = http.createServer((request, response) => {
  let file = path.join(root, decodeURIComponent(new URL(request.url, 'http://x').pathname))
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html')
  if (!file.startsWith(root) || !fs.existsSync(file)) {
    response.writeHead(404)
    return response.end()
  }
  response.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' })
  fs.createReadStream(file).pipe(response)
})
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve))
const url = `http://127.0.0.1:${server.address().port}/index.html`

const lrsFetch = async (route) => {
  const response = await fetch(`${lrs}/xapi/${route}`, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(`${key}:${secret}`).toString('base64'),
      'X-Experience-API-Version': '1.0.3',
    },
  })
  return response.ok ? response.json() : { error: response.status }
}

const since = new Date().toISOString()
const record = { package: path.basename(source) }
const browser = await chromium.launch()

try {
  const page = await browser.newPage()
  const failed = []
  const rejected = []
  page.on('response', async (r) => {
    if (!r.url().startsWith(lrs) || r.status() < 400) return
    failed.push(`${r.request().method()} ${r.url().replace(lrs, '')} -> ${r.status()}`)
    // what the LRS objected to, and to which statement
    const sent = r.request().postData() || ''
    const reason = await r.text().catch(() => '')
    rejected.push({ status: r.status(), reason, statement: sent })
  })

  const course = async () => {
    for (let i = 0; i < 60; i++) {
      const ready = await page.evaluate(() => /MKCourseIntro/.test(document.body?.innerText || '') && !!window.LIA?.goto).catch(() => false)
      if (ready) return true
      await page.waitForTimeout(1000)
    }
    return false
  }
  const quiz = () => page.locator('xpath=//*[contains(text(),"MKQuizText")]/following::input[1]')
  const survey = () => page.locator('xpath=//*[contains(text(),"MKSurveyText ")]/following::input[1]')
  const editor = () => page.locator('lia-editor', { hasText: 'MKCodeRunLog' })
  const goto = async (slide, wait = 2500) => {
    await page.evaluate((s) => window.LIA.goto(s), slide)
    await page.waitForTimeout(wait)
  }

  await page.goto(url)
  record.rendered = await course()
  if (record.rendered) {
    await page.evaluate(() => window.LIA.goto(13))
    await quiz().waitFor({ timeout: 15000 })
    await quiz().fill('Paris')
    await page.locator('xpath=//*[contains(text(),"MKQuizText")]/following::button[1]').click()
    await page.waitForTimeout(2000)

    // Python and HTML: a wrong answer, readable as "Python; HTML"
    const multiple = page.locator('xpath=//*[contains(text(),"MKQuizMultiple")]/following::div[contains(@class,"lia-quiz")][1]')
    await multiple.locator('input[type=checkbox]').nth(0).check()
    await multiple.locator('input[type=checkbox]').nth(2).check()
    await multiple.locator('.lia-quiz__check').click()
    await page.waitForTimeout(2000)

    await goto(14)
    await survey().fill('MKSurveyAnswer')
    await page.locator('xpath=//*[contains(text(),"MKSurveyText ")]/following::button[1]').click()
    await page.waitForTimeout(2000)

    await goto(6)
    await editor().locator('.ace_content').click()
    await page.keyboard.press('Control+End')
    await page.keyboard.type('\n// MKCodeEdited')
    await page.locator('.lia-code', { has: editor() }).locator('button[title="Execute"]').click()
    await page.waitForTimeout(3000)

    await goto(4, 4000)

    await page.reload()
    await course()
    await page.waitForTimeout(4000)
    record.resumedAt = await page.evaluate(() =>
      [...document.querySelectorAll('h1,h2')].filter((h) => h.offsetParent).map((h) => h.innerText.trim())[0])
    await goto(13)
    record.quizRestored = (await quiz().inputValue({ timeout: 5000 }).catch(() => null)) === 'Paris'
    await goto(14)
    record.surveyRestored = (await survey().inputValue({ timeout: 5000 }).catch(() => null)) === 'MKSurveyAnswer'
    await goto(6)
    record.codeRestored = /MKCodeEdited/.test(await editor().innerText({ timeout: 5000 }).catch(() => ''))
  }
  record.lrsRequestsFailed = [...new Set(failed)]
  if (process.env.XAPI_DEBUG) record.rejected = rejected

  const { statements = [] } = await lrsFetch(`statements?since=${encodeURIComponent(since)}&limit=200`)
  record.statements = statements.length
  record.verbs = [...new Set(statements.map((s) => s.verb?.id?.split('/').pop()))]
  const answer = statements.find((s) => /answered/.test(s.verb?.id || ''))
  record.answered = answer ? { response: answer.result?.response, success: answer.result?.success, object: answer.object?.id } : null

  // what an LRS statement browser and its CSV show, oldest first
  const ext = (s, key) => s.object?.definition?.extensions?.[`http://liascript.github.io/extensions/${key}`]
  const shown = statements.filter((s) => /answered|interacted/.test(s.verb?.id || '')).reverse()
  record.readable = shown.map((s) => ({
    verb: s.verb.id.split('/').pop(),
    name: Object.values(s.object?.definition?.name || {})[0],
    type: s.object?.definition?.interactionType,
    response: s.result?.response,
    answer: s.result?.extensions?.['http://liascript.github.io/extensions/answer'],
    success: s.result?.success,
  }))
  record.surveyStatements = statements.filter((s) => ext(s, 'surveyIndex') !== undefined).length
  record.codeStatements = statements.filter((s) => ext(s, 'codeIndex') !== undefined).length
  record.slideNames = [...new Set(statements.filter((s) => /experienced/.test(s.verb?.id || ''))
    .map((s) => Object.values(s.object?.definition?.name || {})[0]))]
} finally {
  await browser.close()
  server.close()
}

console.log(JSON.stringify(record, null, 1))
