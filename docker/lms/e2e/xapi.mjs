/*
 * Runs an xAPI export against the lab's learning record store.
 *
 *   node xapi.mjs <lrs url> <export.zip | export dir> <api key> <api secret>
 *
 * Serves the package, answers the fixture course's text quiz, moves to slide 5
 * and reloads, then asks the LRS what it received. Prints one JSON record.
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

  await page.goto(url)
  record.rendered = await course()
  if (record.rendered) {
    await page.evaluate(() => window.LIA.goto(13))
    await quiz().waitFor({ timeout: 15000 })
    await quiz().fill('Paris')
    await page.locator('xpath=//*[contains(text(),"MKQuizText")]/following::button[1]').click()
    await page.waitForTimeout(2000)
    await page.evaluate(() => window.LIA.goto(4))
    await page.waitForTimeout(4000)

    await page.reload()
    await course()
    await page.waitForTimeout(4000)
    record.resumedAt = await page.evaluate(() =>
      [...document.querySelectorAll('h1,h2')].filter((h) => h.offsetParent).map((h) => h.innerText.trim())[0])
    await page.evaluate(() => window.LIA.goto(13))
    await page.waitForTimeout(2500)
    record.quizRestored = (await quiz().inputValue({ timeout: 5000 }).catch(() => null)) === 'Paris'
  }
  record.lrsRequestsFailed = [...new Set(failed)]
  if (process.env.XAPI_DEBUG) record.rejected = rejected

  const { statements = [] } = await lrsFetch(`statements?since=${encodeURIComponent(since)}&limit=200`)
  record.statements = statements.length
  record.verbs = [...new Set(statements.map((s) => s.verb?.id?.split('/').pop()))]
  const answer = statements.find((s) => /answered/.test(s.verb?.id || ''))
  record.answered = answer ? { response: answer.result?.response, success: answer.result?.success, object: answer.object?.id } : null
} finally {
  await browser.close()
  server.close()
}

console.log(JSON.stringify(record, null, 1))
