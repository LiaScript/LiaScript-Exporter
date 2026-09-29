/*
 * CLI matrix: exports the fixture course once per format with the real CLI
 * and judges the output with the shared checkers.
 *
 *   npm run build && npm run test:cli
 *   DEEP=1 npm run test:cli          + xmllint and epubcheck (nightly)
 *   NETWORK=1 npm run test:cli       + the network course, and export straight
 *                                      from a git repository
 *
 * A case with a `bug` fails today because of a known exporter bug and is
 * marked `test.fail()`, so the suite stays green and turns red ("expected to
 * fail, but passed") once the fix lands; then delete the `bug`.
 */
import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { expect, test, TestInfo } from '@playwright/test'
import { strFromU8, unzipSync } from 'fflate'
import { checkOutput, Format } from '../checkers'
import { checkRendered } from '../checkers/render'
import type { Fixture } from '../fixtures/course'
import { NETWORK_FIXTURE } from '../fixtures/network'

const ROOT = path.resolve(__dirname, '../..')
const CLI = path.join(ROOT, 'dist/index.js')
const COURSE = 'tests/fixtures/course/README.md'
const NETWORK_COURSE = 'tests/fixtures/network/README.md'
const OUT_DIR = path.join(ROOT, 'test-results/cli-exports')

const DEEP = !!process.env.DEEP && process.env.DEEP !== '0'
const NETWORK = !!process.env.NETWORK && process.env.NETWORK !== '0'

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

// The formats that fetch, capture or keep remote content themselves; the
// packaged ones only copy the README. json shows the remote import resolved.
const NETWORK_CASES: Case[] = [
  {
    name: 'docx',
    format: 'docx',
    output: 'docx.docx',
    timeout: CHROME_TIMEOUT,
    bug: 'the Chartist chart is lost: html-to-docx rejects its SVG ("Invalid SVG") and leaves it as orphaned media',
  },
  {
    name: 'epub',
    format: 'epub',
    output: 'epub.epub',
    timeout: CHROME_TIMEOUT,
    deepBug: 'epubcheck: the YouTube iframe stays remote and inside an <a>, the embed has a misplaced figcaption, the Chartist svg sits where no svg is allowed',
  },
  { name: 'pdf', format: 'pdf', output: 'pdf.pdf', timeout: CHROME_TIMEOUT },
  {
    name: 'web-zip',
    format: 'web',
    args: ['--web-zip'],
    output: 'web-zip.zip',
    timeout: QUICK_TIMEOUT,
    render: true,
  },
  { name: 'json', format: 'json', output: 'json.json', timeout: QUICK_TIMEOUT },
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
function runCli(
  args: string[],
  timeout: number,
  env: NodeJS.ProcessEnv = process.env,
): Promise<CliRun> {
  const started = Date.now()
  const child = spawn(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    env,
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

/**
 * A TMPDIR of its own, right in the system's: Chrome puts a socket in it, and
 * socket paths may not exceed 108 characters, which a folder in test-results
 * already does (Chrome then dies at launch with "Target closed").
 */
function shortTmp(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'liat-'))
}

test.describe.configure({ mode: 'parallel' })

exportMatrix(CASES, { course: COURSE, outDir: OUT_DIR })

/*
 * The network course: remote images, embeds, a remote import and a remote
 * script. Every host it needs can be slow or down, hence NETWORK=1 only.
 */
exportMatrix(NETWORK_CASES, {
  course: NETWORK_COURSE,
  outDir: path.join(OUT_DIR, 'network'),
  fixture: NETWORK_FIXTURE,
  title: 'network',
  network: true,
})

interface Matrix {
  /** The README to export, relative to the repository. */
  course: string
  outDir: string
  /** What the checkers compare with; the local course by default. */
  fixture?: Fixture
  /** Prefix of each describe title. */
  title?: string
  /** Skip unless NETWORK=1. */
  network?: boolean
}

function exportMatrix(cases: Case[], matrix: Matrix): void {
  for (const c of cases) {
    test.describe(matrix.title ? `${matrix.title} ${c.name}` : c.name, () => {
      // One export per format, shared by its tests; serial keeps them in one worker.
      test.describe.configure({ mode: 'serial' })
      // With every test skipped, beforeAll does not export either.
      if (matrix.network) test.skip(!NETWORK, 'needs NETWORK=1')

      const output = path.join(matrix.outDir, c.output)
      // Its own TMPDIR, so whatever the export leaves behind can be seen.
      let tmp: string
      let run: CliRun

      test.afterAll(() => {
        if (tmp) fs.rmSync(tmp, { recursive: true, force: true })
      })

      test.beforeAll(async () => {
        if (!fs.existsSync(CLI)) throw new Error(`${CLI} is missing; run npm run build first`)

        fs.rmSync(output, { recursive: true, force: true })
        fs.mkdirSync(matrix.outDir, { recursive: true })
        tmp = shortTmp()

        run = await runCli(
          ['-i', matrix.course, '-f', c.format, '-o', path.join(matrix.outDir, c.name), ...(c.args ?? [])],
          c.timeout,
          { ...process.env, TMPDIR: tmp },
        )
      })

      test('exports and passes its checker', async ({}, testInfo) => {
        const bug = c.bug ?? (DEEP ? c.deepBug : undefined)
        test.fail(!!bug, bug)

        await testInfo.attach('cli.log', { body: run.log, contentType: 'text/plain' })

        expect(run.timedOut, `CLI still running after ${c.timeout / 1000} s`).toBe(false)
        expect(run.code, `CLI exit code; log:\n${run.log.slice(-2_000)}`).toBe(0)
        expect(fs.existsSync(output), `${c.output} was not written`).toBe(true)
        expect(fs.readdirSync(tmp), 'temp folders left behind').toEqual([])

        const result = await checkOutput(c.format, output, {
          method: 'cli',
          deep: DEEP,
          fixture: matrix.fixture,
        })
        await testInfo.attach('checker.json', {
          body: JSON.stringify(result, null, 2),
          contentType: 'application/json',
        })

        expect(result.problems).toEqual([])
      })

      if (c.render) {
        test('renders every slide in a browser', async ({ page }, testInfo) => {
          expect(fs.existsSync(output), `${c.output} was not written`).toBe(true)

          const result = await checkRendered(page, output, { method: 'cli', fixture: matrix.fixture })
          await testInfo.attach('rendered.json', {
            body: JSON.stringify(result, null, 2),
            contentType: 'application/json',
          })

          expect(result.problems).toEqual([])
        })
      }
    })
  }
}

/*
 * A failed export must exit non-zero: the server trusts the exit code, and
 * each of these used to exit 0 without writing anything.
 */
test.describe('failed exports exit non-zero', () => {
  interface Failure {
    name: string
    /** Course files, written to the test's own directory. */
    files: Record<string, string>
    format: Format | 'android'
    args?: string[]
    /** Commands on PATH that fail at once, in place of the real ones. */
    failing?: string[]
    message: RegExp
  }

  const FAILURES: Failure[] = [
    {
      // Elm answers nothing without a section
      name: 'course without a heading',
      files: { 'README.md': '<!--\nauthor: x\n-->\n\njust text\n' },
      format: 'json',
      message: /has no "# heading"/,
    },
    {
      // Elm waits for every import
      name: 'missing local import',
      files: { 'README.md': '<!--\nimport: ./missing.md\n-->\n\n# Title\n' },
      format: 'json',
      message: /could not load import "\.\/missing\.md"/,
    },
    {
      // the build chain ran unawaited and logged its failures
      name: 'android build that fails',
      files: { 'README.md': '# Title\n' },
      format: 'android',
      args: ['--android-appId', 'io.test.app', '--android-sdk', '/nonexistent/sdk'],
      failing: ['npm', 'npx'],
      message: /Command failed: npm i/,
    },
  ]

  for (const f of FAILURES) {
    test(f.name, async ({}, testInfo) => {
      const dir = testInfo.outputPath('course')
      fs.mkdirSync(dir, { recursive: true })
      for (const [name, body] of Object.entries(f.files)) {
        fs.writeFileSync(path.join(dir, name), body)
      }

      let env = process.env
      if (f.failing) {
        const bin = testInfo.outputPath('bin')
        fs.mkdirSync(bin, { recursive: true })
        for (const cmd of f.failing) {
          fs.writeFileSync(path.join(bin, cmd), '#!/bin/sh\nexit 1\n', { mode: 0o755 })
        }
        env = { ...process.env, PATH: `${bin}${path.delimiter}${process.env.PATH}` }
      }

      const output = testInfo.outputPath('out')
      const run = await runCli(
        ['-i', path.join(dir, 'README.md'), '-f', f.format, '-o', output, ...(f.args ?? [])],
        QUICK_TIMEOUT,
        env,
      )
      await testInfo.attach('cli.log', { body: run.log, contentType: 'text/plain' })

      expect(run.timedOut, 'CLI still running').toBe(false)
      expect(run.code, `CLI exit code; log:\n${run.log.slice(-2_000)}`).not.toBe(0)
      expect(run.log).toMatch(f.message)
      expect(fs.readdirSync(testInfo.outputPath()).filter((n) => n.startsWith('out'))).toEqual([])
    })
  }
})

/*
 * `--git-url` clones the course, then hands its path on by appending
 * `--input` to process.argv, and removes the clone when the process exits.
 * The server imports from git by its own route, so only this covers that path.
 *
 * Same source as the server's git tests: GIT_URL / GIT_BRANCH / GIT_SUBDIR
 * override it, and the content check then only asks for valid JSON.
 */
test.describe('export from a git repository', () => {
  const GIT_ARGS = process.env.GIT_URL
    ? [
        '--git-url', process.env.GIT_URL,
        ...(process.env.GIT_BRANCH ? ['--git-branch', process.env.GIT_BRANCH] : []),
        ...(process.env.GIT_SUBDIR ? ['--git-subdir', process.env.GIT_SUBDIR] : []),
      ]
    : ['--git-url', 'https://github.com/LiaPlayground/Quiz-Demo']
  const GIT_COURSE_TEXT = process.env.GIT_URL ? [] : ['Quizze', 'Hier muss das Kreuz hin']

  /** Runs the CLI with its own TMPDIR, so the clone it makes can be looked for. */
  async function runGit(args: string[], testInfo: TestInfo) {
    const tmp = testInfo.outputPath('tmp')
    fs.mkdirSync(tmp, { recursive: true })

    const run = await runCli([...GIT_ARGS, ...args], QUICK_TIMEOUT, { ...process.env, TMPDIR: tmp })
    await testInfo.attach('cli.log', { body: run.log, contentType: 'text/plain' })
    expect(run.timedOut, 'CLI still running').toBe(false)

    const clones = path.join(tmp, 'liaex-git')
    const left = fs.existsSync(clones) ? fs.readdirSync(clones) : []
    expect(left, 'clone left behind').toEqual([])

    return run
  }

  test.beforeEach(() => {
    test.skip(!NETWORK, 'needs NETWORK=1')
  })

  test('exports the repository course', async ({}, testInfo) => {
    const output = testInfo.outputPath('course')
    const run = await runGit(['-f', 'json', '-o', output], testInfo)

    expect(run.code, `CLI exit code; log:\n${run.log.slice(-2_000)}`).toBe(0)
    const json = JSON.parse(fs.readFileSync(output + '.json', 'utf8'))
    for (const text of GIT_COURSE_TEXT) {
      expect(JSON.stringify(json)).toContain(text)
    }
  })

  test('fails on a --git-file the repository does not have', async ({}, testInfo) => {
    const output = testInfo.outputPath('course')
    const run = await runGit(['--git-file', 'no/such.md', '-f', 'json', '-o', output], testInfo)

    expect(run.code, `CLI exit code; log:\n${run.log.slice(-2_000)}`).not.toBe(0)
    expect(run.log).toContain('Specified file not found in repository: no/such.md')
    expect(fs.existsSync(output + '.json')).toBe(false)
  })

  test('exports with a preset', async ({}, testInfo) => {
    const output = testInfo.outputPath('course')
    const run = await runGit(['-f', 'presets', '--moodle4', '-o', output], testInfo)

    expect(run.code, `CLI exit code; log:\n${run.log.slice(-2_000)}`).toBe(0)

    // Not the scorm checker: that one compares against the fixture course.
    const files = unzipSync(fs.readFileSync(output + '.zip'))
    expect(Object.keys(files)).toContain('imsmanifest.xml')
    // moodle4 embeds the course
    const embedded = strFromU8(files['course.js'] ?? new Uint8Array())
    expect(embedded, 'course.js').not.toBe('')
    for (const text of GIT_COURSE_TEXT) {
      expect(embedded).toContain(text)
    }
  })
})
