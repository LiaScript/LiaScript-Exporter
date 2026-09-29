/*
 * CLI matrix: exports the fixture course once per format with the real CLI
 * and judges the output with the shared checkers.
 *
 *   npm run build && npm run test:cli
 *   DEEP=1 npm run test:cli          + xmllint and epubcheck (nightly)
 *
 * A case with a `bug` fails today because of a known exporter bug and is
 * marked `test.fail()`, so the suite stays green and turns red ("expected to
 * fail, but passed") once the fix lands; then delete the `bug`.
 */
import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { expect, test } from '@playwright/test'
import { checkOutput, Format } from '../checkers'
import { checkRendered } from '../checkers/render'

const ROOT = path.resolve(__dirname, '../..')
const CLI = path.join(ROOT, 'dist/index.js')
const COURSE = 'tests/fixtures/course/README.md'
const OUT_DIR = path.join(ROOT, 'test-results/cli-exports')

const DEEP = !!process.env.DEEP && process.env.DEEP !== '0'

const QUICK_TIMEOUT = 90_000
// Formats that print the course with their own Chrome
const CHROME_TIMEOUT = 150_000

interface Case {
  name: string
  format: Format
  /** Extra CLI arguments. */
  args?: string[]
  /** What the CLI writes for `-o <OUT_DIR>/<name>`. */
  output: string
  timeout: number
  /** Also walk every slide of the player in a browser. */
  render?: boolean
  /** Known exporter bug that fails this case in every tier. */
  bug?: string
  /** Known exporter bug that fails this case only with DEEP=1. */
  deepBug?: string
}

// Slowest first, so the two workers finish at about the same time.
const CASES: Case[] = [
  {
    name: 'docx',
    format: 'docx',
    output: 'docx.docx',
    timeout: CHROME_TIMEOUT,
  },
  {
    name: 'epub',
    format: 'epub',
    output: 'epub.epub',
    timeout: CHROME_TIMEOUT,
  },
  { name: 'pdf', format: 'pdf', output: 'pdf.pdf', timeout: CHROME_TIMEOUT },
  { name: 'scorm1.2', format: 'scorm1.2', output: 'scorm1.2.zip', timeout: QUICK_TIMEOUT },
  { name: 'scorm2004', format: 'scorm2004', output: 'scorm2004.zip', timeout: QUICK_TIMEOUT },
  { name: 'ims', format: 'ims', output: 'ims.zip', timeout: QUICK_TIMEOUT },
  { name: 'web', format: 'web', output: 'web', timeout: QUICK_TIMEOUT, render: true },
  {
    name: 'web-zip',
    format: 'web',
    args: ['--web-zip'],
    output: 'web-zip.zip',
    timeout: QUICK_TIMEOUT,
  },
  {
    name: 'xapi',
    format: 'xapi',
    output: 'xapi',
    timeout: QUICK_TIMEOUT,
    render: true,
  },
  { name: 'json', format: 'json', output: 'json.json', timeout: QUICK_TIMEOUT },
  { name: 'fullJson', format: 'fullJson', output: 'fullJson.json', timeout: QUICK_TIMEOUT },
  { name: 'rdf', format: 'rdf', output: 'rdf.jsonld', timeout: QUICK_TIMEOUT },
]

interface CliRun {
  code: number | null
  timedOut: boolean
  log: string
  ms: number
}

/**
 * Runs the CLI in its own process group, so a timeout also kills the Chrome
 * that puppeteer started; killing only `node` would leave Chrome orphaned.
 */
function runCli(args: string[], timeout: number): Promise<CliRun> {
  const started = Date.now()
  const child = spawn(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  let log = ''
  child.stdout.on('data', (chunk) => (log += chunk))
  child.stderr.on('data', (chunk) => (log += chunk))

  const killGroup = () => {
    try {
      process.kill(-child.pid!, 'SIGKILL')
    } catch {
      // the group is already gone
    }
  }

  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    killGroup()
  }, timeout)

  return new Promise((resolve) => {
    child.on('exit', (code) => {
      clearTimeout(timer)
      // Nothing the CLI started may outlive it.
      killGroup()
      // Let the pipes drain, but do not wait on a grandchild holding them.
      const done = () => resolve({ code, timedOut, log, ms: Date.now() - started })
      child.on('close', done)
      setTimeout(done, 1_000)
    })
  })
}

test.describe.configure({ mode: 'parallel' })

for (const c of CASES) {
  test.describe(c.name, () => {
    // One export per format, shared by its tests; serial keeps them in one worker.
    test.describe.configure({ mode: 'serial' })

    const output = path.join(OUT_DIR, c.output)
    let run: CliRun

    test.beforeAll(async () => {
      if (!fs.existsSync(CLI)) throw new Error(`${CLI} is missing; run npm run build first`)

      fs.rmSync(output, { recursive: true, force: true })
      fs.mkdirSync(OUT_DIR, { recursive: true })

      run = await runCli(
        ['-i', COURSE, '-f', c.format, '-o', path.join(OUT_DIR, c.name), ...(c.args ?? [])],
        c.timeout,
      )
    })

    test('exports and passes its checker', async ({}, testInfo) => {
      const bug = c.bug ?? (DEEP ? c.deepBug : undefined)
      test.fail(!!bug, bug)

      await testInfo.attach('cli.log', { body: run.log, contentType: 'text/plain' })

      expect(run.timedOut, `CLI still running after ${c.timeout / 1000} s`).toBe(false)
      expect(run.code, `CLI exit code; log:\n${run.log.slice(-2_000)}`).toBe(0)
      expect(fs.existsSync(output), `${c.output} was not written`).toBe(true)

      const result = await checkOutput(c.format, output, { method: 'cli', deep: DEEP })
      await testInfo.attach('checker.json', {
        body: JSON.stringify(result, null, 2),
        contentType: 'application/json',
      })

      expect(result.problems).toEqual([])
    })

    if (c.render) {
      test('renders every slide in a browser', async ({ page }, testInfo) => {
        expect(fs.existsSync(output), `${c.output} was not written`).toBe(true)

        const result = await checkRendered(page, output, { method: 'cli' })
        await testInfo.attach('rendered.json', {
          body: JSON.stringify(result, null, 2),
          contentType: 'application/json',
        })

        expect(result.problems).toEqual([])
      })
    }
  })
}
