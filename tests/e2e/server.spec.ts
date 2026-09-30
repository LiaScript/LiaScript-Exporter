/*
 * Server matrix: uploads the fixture course to `dist/index.js serve` once per
 * format through the HTTP API, waits for the job and downloads the result.
 *
 *   npm run build && npm run test:server
 *   NETWORK=1 npm run test:server     + git import from GitHub
 *
 * The server spawns the same CLI for every job, so the CLI matrix already
 * covers the exporters in depth. What is the server's own is the path in
 * between: the upload and zip extraction, form fields → CLI arguments, the
 * spawn with the output directory as cwd, finding the output file and the
 * download headers. The checkers still run (without DEEP) because a course
 * extracted to a temp dir and exported from another cwd breaks differently
 * from `-i tests/fixtures/course/README.md`.
 *
 * The server runs one job at a time, so the whole file shares one server;
 * only the expiry test starts its own, with a TTL of seconds.
 */
import { ChildProcess, spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as net from 'node:net'
import * as os from 'node:os'
import * as path from 'node:path'
import { APIRequestContext, expect, test } from '@playwright/test'
import { zipSync } from 'fflate'
import { checkOutput, Format } from '../checkers'
import { COURSE_DIR, zipCourse } from '../fixtures/course'

const ROOT = path.resolve(__dirname, '../..')
const CLI = path.join(ROOT, 'dist/index.js')
const OUT_DIR = path.join(ROOT, 'test-results/server-exports')

const NETWORK = !!process.env.NETWORK && process.env.NETWORK !== '0'
/**
 * The git import clones a tiny, long-untouched course (a README with quizzes,
 * ~4 KB). GIT_URL / GIT_BRANCH / GIT_SUBDIR override it; the content check
 * then only asks for valid JSON.
 */
const GIT_SOURCE: Record<string, string> = process.env.GIT_URL
  ? {
      gitUrl: process.env.GIT_URL,
      ...(process.env.GIT_BRANCH && { gitBranch: process.env.GIT_BRANCH }),
      ...(process.env.GIT_SUBDIR && { gitSubdir: process.env.GIT_SUBDIR }),
    }
  : { gitUrl: 'https://github.com/LiaPlayground/Quiz-Demo' }

/** Text of the default git course that its JSON export must contain. */
const GIT_COURSE_TEXT = process.env.GIT_URL ? [] : ['Quizze', 'Hier muss das Kreuz hin']

const QUICK_TIMEOUT = 90_000
const CHROME_TIMEOUT = 150_000

const MIME: Record<string, string> = {
  zip: 'application/zip',
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  json: 'application/octet-stream',
  jsonld: 'application/octet-stream',
}

interface Case {
  name: string
  format: Format
  /** Form fields besides `format`, as the UI sends them. */
  fields?: Record<string, string>
  /** Extension of the downloaded file. */
  ext: string
  timeout: number
  /** Known bug that fails this case; delete once fixed. */
  bug?: string
}

const CASES: Case[] = [
  { name: 'docx', format: 'docx', ext: 'docx', timeout: CHROME_TIMEOUT },
  { name: 'epub', format: 'epub', ext: 'epub', timeout: CHROME_TIMEOUT },
  { name: 'pdf', format: 'pdf', ext: 'pdf', timeout: CHROME_TIMEOUT },
  { name: 'scorm1.2', format: 'scorm1.2', ext: 'zip', timeout: QUICK_TIMEOUT },
  { name: 'scorm2004', format: 'scorm2004', ext: 'zip', timeout: QUICK_TIMEOUT },
  { name: 'ims', format: 'ims', ext: 'zip', timeout: QUICK_TIMEOUT },
  // The UI's "Package as ZIP" boxes are checked by default.
  { name: 'web', format: 'web', fields: { option_webZip: 'true' }, ext: 'zip', timeout: QUICK_TIMEOUT },
  { name: 'xapi', format: 'xapi', fields: { 'option_xapi-zip': 'true' }, ext: 'zip', timeout: QUICK_TIMEOUT },
  { name: 'json', format: 'json', ext: 'json', timeout: QUICK_TIMEOUT },
  { name: 'fullJson', format: 'fullJson', ext: 'json', timeout: QUICK_TIMEOUT },
  { name: 'rdf', format: 'rdf', ext: 'jsonld', timeout: QUICK_TIMEOUT },
]

interface Server {
  proc: ChildProcess
  url: string
  log: string
  /** Its TMPDIR, so everything it and its CLI runs leave behind is here. */
  tmp: string
}

let main: Server | undefined
let baseURL = ''
let courseZip: Buffer

function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = net.createServer()
    probe.unref()
    probe.on('error', reject)
    probe.listen(0, () => {
      const { port } = probe.address() as net.AddressInfo
      probe.close(() => resolve(port))
    })
  })
}

/**
 * Starts a server in its own process group: every job spawns the CLI, and
 * the CLI may start Chrome; all of it must go when the suite ends.
 */
async function launchServer(env: NodeJS.ProcessEnv = {}): Promise<Server> {
  const port = await freePort()
  // Right in the system's temp dir: Chrome puts a socket in TMPDIR, and
  // socket paths may not exceed 108 characters, which a folder in
  // test-results already does (Chrome then dies with "Target closed").
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'liat-'))

  const proc = spawn(process.execPath, [CLI, 'serve', '--port', String(port), '--no-browser'], {
    cwd: ROOT,
    env: { ...process.env, TMPDIR: tmp, ...env },
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const server: Server = { proc, url: `http://127.0.0.1:${port}`, log: '', tmp }
  proc.stdout!.on('data', (chunk) => (server.log += chunk))
  proc.stderr!.on('data', (chunk) => (server.log += chunk))

  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    if (proc.exitCode !== null) break
    try {
      if ((await fetch(`${server.url}/api/queue`)).ok) return server
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 250))
  }

  stopServer(server)
  throw new Error(`server did not start; log:\n${server.log.slice(-2_000)}`)
}

function stopServer(server: Server | undefined): void {
  if (!server?.proc.pid) return
  try {
    process.kill(-server.proc.pid, 'SIGKILL')
  } catch {
    // the group is already gone
  }
  fs.rmSync(server.tmp, { recursive: true, force: true })
}

/**
 * What a server left in its TMPDIR, besides downloads it still serves (kept
 * until they expire): its own upload/clone/export folders, and any temp folder
 * an export made.
 */
function leftovers(server: Server, keepExports: boolean): string[] {
  const found: string[] = []

  for (const entry of fs.readdirSync(server.tmp)) {
    if (['liaex-uploads', 'liaex-git', 'liaex-exports'].includes(entry)) {
      if (entry === 'liaex-exports' && keepExports) continue
      for (const inner of fs.readdirSync(path.join(server.tmp, entry))) found.push(`${entry}/${inner}`)
    } else {
      found.push(entry)
    }
  }

  return found
}

interface Job {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  error?: string
  result?: { filename: string }
}

async function submit(
  request: APIRequestContext,
  fields: Record<string, string>,
  upload?: { name: string; mimeType: string; buffer: Buffer },
  base = baseURL,
): Promise<{ status: number; body: any }> {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  if (upload) form.append('file', new Blob([new Uint8Array(upload.buffer)], { type: upload.mimeType }), upload.name)

  const response = await request.post(`${base}/api/export`, { multipart: form })
  return { status: response.status(), body: await response.json() }
}

/** Polls the job until it is done; the job status is nested at `job.status`. */
async function waitForJob(
  request: APIRequestContext,
  jobId: string,
  timeout: number,
  base = baseURL,
): Promise<Job> {
  const deadline = Date.now() + timeout
  let job: Job | undefined

  while (Date.now() < deadline) {
    const response = await request.get(`${base}/api/job/${jobId}`)
    expect(response.ok(), `GET /api/job/${jobId}`).toBe(true)
    job = (await response.json()).job as Job
    if (job.status === 'completed' || job.status === 'failed') return job
    await new Promise((r) => setTimeout(r, 500))
  }

  throw new Error(`job ${jobId} still ${job?.status} after ${timeout / 1000} s`)
}

/** Submits, waits and downloads; returns the saved file. */
async function exportVia(
  request: APIRequestContext,
  name: string,
  fields: Record<string, string>,
  upload: { name: string; mimeType: string; buffer: Buffer },
  timeout: number,
): Promise<{ job: Job; file?: string; contentType?: string; disposition?: string }> {
  const { status, body } = await submit(request, fields, upload)
  expect(status, JSON.stringify(body)).toBe(200)
  expect(body.jobId).toBeTruthy()

  const job = await waitForJob(request, body.jobId, timeout)
  if (job.status !== 'completed') return { job }

  const response = await request.get(`${baseURL}/api/download/${job.id}`)
  expect(response.ok(), `GET /api/download/${job.id}`).toBe(true)

  const file = path.join(OUT_DIR, `${name}${path.extname(job.result!.filename)}`)
  fs.writeFileSync(file, await response.body())

  return {
    job,
    file,
    contentType: response.headers()['content-type'],
    disposition: response.headers()['content-disposition'],
  }
}

/** A git job completed and its download is the cloned course as JSON. */
async function expectGitCourse(request: APIRequestContext, job: Job, name: string) {
  expect(job.status, job.error).toBe('completed')

  const response = await request.get(`${baseURL}/api/download/${job.id}`)
  expect(response.ok()).toBe(true)

  const text = (await response.body()).toString('utf8')
  fs.writeFileSync(path.join(OUT_DIR, `${name}.json`), text)
  expect(() => JSON.parse(text)).not.toThrow()
  for (const expected of GIT_COURSE_TEXT) expect(text).toContain(expected)
}

const courseUpload = () => ({ name: 'course.zip', mimeType: 'application/zip', buffer: courseZip })

// Not serial: a failing test restarts the worker, which starts a fresh server,
// and the remaining tests still run.
test.beforeAll(async () => {
  if (!fs.existsSync(CLI)) throw new Error(`${CLI} is missing; run npm run build first`)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  courseZip = zipCourse()

  main = await launchServer()
  baseURL = main.url
})

test.afterAll(async ({}, testInfo) => {
  stopServer(main)
  await testInfo.attach('server.log', { body: main?.log ?? '', contentType: 'text/plain' })
})

test.describe('API', () => {
  test('lists the presets', async ({ request }) => {
    const response = await request.get(`${baseURL}/api/presets`)
    expect(response.ok()).toBe(true)

    const { presets } = await response.json()
    expect(presets.map((p: any) => p.id)).toContain('moodle4')
  })

  test('rejects a request without files or git URL', async ({ request }) => {
    const { status, body } = await submit(request, { format: 'json' })
    expect(status).toBe(400)
    expect(body.error).toMatch(/no files/i)
  })

  test('rejects a zip without markdown', async ({ request }) => {
    const buffer = Buffer.from(zipSync({ 'notes.txt': new TextEncoder().encode('no course') }))
    const { status, body } = await submit(
      request,
      { format: 'json' },
      { name: 'empty.zip', mimeType: 'application/zip', buffer },
    )
    expect(status).toBe(400)
    expect(body.error).toMatch(/no markdown/i)
  })

  test('answers 404 for an unknown job', async ({ request }) => {
    expect((await request.get(`${baseURL}/api/job/nope`)).status()).toBe(404)
    expect((await request.get(`${baseURL}/api/download/nope`)).status()).toBe(404)
  })
})

test.describe('formats', () => {
  for (const c of CASES) {
    test(`${c.name}: exports through the API and passes its checker`, async ({ request }, testInfo) => {
      test.fail(!!c.bug, c.bug)
      test.setTimeout(c.timeout + 30_000)

      const result = await exportVia(
        request,
        c.name,
        { format: c.format, ...c.fields },
        courseUpload(),
        c.timeout,
      )
      expect(result.job.status, result.job.error).toBe('completed')

      expect(result.disposition).toBe(`attachment; filename="${result.job.result!.filename}"`)
      expect(path.extname(result.file!)).toBe(`.${c.ext}`)
      expect(result.contentType).toContain(MIME[c.ext])

      const check = await checkOutput(c.format, result.file!, { method: 'cli' })
      await testInfo.attach('checker.json', {
        body: JSON.stringify(check, null, 2),
        contentType: 'application/json',
      })
      expect(check.problems).toEqual([])
    })
  }
})

test.describe('sources and options', () => {
  test('a single README.md upload exports', async ({ request }) => {
    const result = await exportVia(
      request,
      'readme-only',
      { format: 'json' },
      {
        name: 'README.md',
        mimeType: 'text/markdown',
        buffer: fs.readFileSync(path.join(COURSE_DIR, 'README.md')),
      },
      QUICK_TIMEOUT,
    )
    expect(result.job.status, result.job.error).toBe('completed')

    const check = await checkOutput('json', result.file!)
    expect(check.problems).toEqual([])
  })

  test('the moodle4 preset exports SCORM 1.2 with its options', async ({ request }, testInfo) => {
    test.setTimeout(QUICK_TIMEOUT + 30_000)

    const result = await exportVia(request, 'preset-moodle4', { preset: 'moodle4' }, courseUpload(), QUICK_TIMEOUT)
    expect(result.job.status, result.job.error).toBe('completed')
    expect(path.extname(result.file!)).toBe('.zip')

    // moodle4 sets scormEmbed: the server must have passed --scorm-embed on.
    expect(main!.log).toMatch(/--format scorm1\.2 .*--scorm-embed/)

    const check = await checkOutput('scorm1.2', result.file!, { method: 'cli' })
    await testInfo.attach('checker.json', {
      body: JSON.stringify(check, null, 2),
      contentType: 'application/json',
    })
    expect(check.problems).toEqual([])
  })

  test('form options reach the CLI, other formats\' fields do not', async ({ request }) => {
    const result = await exportVia(
      request,
      'options-scorm2004',
      // The UI sends every tab's fields, whichever format is picked
      { format: 'scorm2004', option_masteryScore: '75', 'option_pdf-format': 'A3', option_webZip: 'true' },
      courseUpload(),
      QUICK_TIMEOUT,
    )
    expect(result.job.status, result.job.error).toBe('completed')

    const line = main!.log.split('\n').find((l) => l.includes(result.job.id) && l.includes('Starting export'))
    expect(line).toContain('--scorm-masteryScore 75')
    expect(line).not.toContain('--pdf-format')
    expect(line).not.toContain('--web-zip')
  })

  test('"Full JSON" exports fullJson instead of json', async ({ request }, testInfo) => {
    const result = await exportVia(
      request,
      'json-full-box',
      { format: 'json', option_jsonFull: 'true' },
      courseUpload(),
      QUICK_TIMEOUT,
    )
    expect(result.job.status, result.job.error).toBe('completed')

    const line = main!.log.split('\n').find((l) => l.includes(result.job.id) && l.includes('Starting export'))
    expect(line).toContain('--format fulljson')

    const check = await checkOutput('fullJson', result.file!)
    await testInfo.attach('checker.json', {
      body: JSON.stringify(check, null, 2),
      contentType: 'application/json',
    })
    expect(check.problems).toEqual([])
  })

  test('git import over multipart', async ({ request }) => {
    test.skip(!NETWORK, 'needs NETWORK=1')
    test.setTimeout(3 * 60_000)

    const { status, body } = await submit(request, { format: 'json', ...GIT_SOURCE })
    expect(status, JSON.stringify(body)).toBe(200)

    const job = await waitForJob(request, body.jobId, 2 * 60_000)
    await expectGitCourse(request, job, 'git-multipart')
  })

  test('a failed clone answers 400 and leaves no clone behind', async ({ request }) => {
    test.skip(!NETWORK, 'needs NETWORK=1')

    const clones = path.join(main!.tmp, 'liaex-git')
    const before = fs.existsSync(clones) ? fs.readdirSync(clones) : []

    for (const multipart of [true, false]) {
      const gitUrl = 'https://github.com/LiaScript/this-repo-does-not-exist'
      const response = multipart
        ? await submit(request, { format: 'json', gitUrl })
        : await request
            .post(`${baseURL}/api/export`, { data: { gitUrl, target: { format: 'json' } } })
            .then(async (r) => ({ status: r.status(), body: await r.json() }))

      expect(response.status, JSON.stringify(response.body)).toBe(400)
      expect(response.body.error).toMatch(/failed to clone/i)
    }

    const after = fs.existsSync(clones) ? fs.readdirSync(clones) : []
    expect(after.filter((dir) => !before.includes(dir))).toEqual([])
  })

  test('git import over JSON', async ({ request }) => {
    test.skip(!NETWORK, 'needs NETWORK=1')
    test.setTimeout(3 * 60_000)

    const response = await request.post(`${baseURL}/api/export`, {
      data: { ...GIT_SOURCE, target: { format: 'json' } },
    })
    expect(response.status()).toBe(200)

    const job = await waitForJob(request, (await response.json()).jobId, 2 * 60_000)
    await expectGitCourse(request, job, 'git-json')
  })
})

// Last in the file: the file runs in one worker, in order, so every export
// above has used this server by now.
test.describe('cleanup', () => {
  test('exports leave no temp folders, and a failed one leaves nothing', async ({ request }) => {
    const { status, body } = await submit(
      request,
      { format: 'json' },
      { name: 'README.md', mimeType: 'text/markdown', buffer: Buffer.from('no heading here\n') },
    )
    expect(status, JSON.stringify(body)).toBe(200)

    const job = await waitForJob(request, body.jobId, QUICK_TIMEOUT)
    expect(job.status).toBe('failed')
    expect(job.error).toMatch(/no "# heading"/)

    expect(fs.existsSync(path.join(main!.tmp, 'liaex-exports', job.id)), 'output folder of the failed job').toBe(false)
    expect(leftovers(main!, true)).toEqual([])
  })

  test('a finished export expires, and so do orphans from before a restart', async ({ request, page }) => {
    // 3 s, swept every 3 s
    const server = await launchServer({ EXPORT_TTL_MINUTES: '0.05' })

    try {
      const exports = path.join(server.tmp, 'liaex-exports')
      const orphan = path.join(exports, 'from-an-earlier-run')
      fs.mkdirSync(orphan, { recursive: true })
      const hourAgo = new Date(Date.now() - 3_600_000)
      fs.utimesSync(orphan, hourAgo, hourAgo)

      const { body } = await submit(
        request,
        { format: 'json' },
        { name: 'README.md', mimeType: 'text/markdown', buffer: Buffer.from('# Title\n') },
        server.url,
      )
      const job = await waitForJob(request, body.jobId, QUICK_TIMEOUT, server.url)
      expect(job.status, job.error).toBe('completed')
      expect((await request.get(`${server.url}/api/download/${job.id}`)).ok()).toBe(true)

      await expect
        .poll(async () => {
          const { job: now } = await (await request.get(`${server.url}/api/job/${job.id}`)).json()
          return { expired: !!now.expired, folders: fs.readdirSync(exports) }
        }, { timeout: 20_000 })
        .toEqual({ expired: true, folders: [] })

      const gone = await request.get(`${server.url}/api/download/${job.id}`)
      expect(gone.status()).toBe(410)
      expect((await gone.json()).error).toMatch(/expired/)

      await page.goto(`${server.url}/status.html?jobId=${job.id}`)
      await expect(page.locator('#expiredNote')).toContainText('expired')
    } finally {
      stopServer(server)
    }
  })
})
