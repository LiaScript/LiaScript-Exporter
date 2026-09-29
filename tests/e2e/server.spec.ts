/*
 * Server matrix: uploads the fixture course to `dist/index.js serve` once per
 * format through the HTTP API, waits for the job and downloads the result.
 *
 *   npm run build && npm run test:server
 *   NETWORK=1 npm run test:server     + git import of this repo's fixture on GitHub
 *
 * The server spawns the same CLI for every job, so the CLI matrix already
 * covers the exporters in depth. What is the server's own is the path in
 * between: the upload and zip extraction, form fields → CLI arguments, the
 * spawn with the output directory as cwd, finding the output file and the
 * download headers. The checkers still run (without DEEP) because a course
 * extracted to a temp dir and exported from another cwd breaks differently
 * from `-i tests/fixtures/course/README.md`.
 *
 * The server runs one job at a time, so the whole file shares one server.
 */
import { ChildProcess, spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as net from 'node:net'
import * as path from 'node:path'
import { APIRequestContext, expect, test } from '@playwright/test'
import { zipSync } from 'fflate'
import { checkOutput, Format } from '../checkers'

const ROOT = path.resolve(__dirname, '../..')
const CLI = path.join(ROOT, 'dist/index.js')
const COURSE_DIR = path.join(ROOT, 'tests/fixtures/course')
const OUT_DIR = path.join(ROOT, 'test-results/server-exports')

const NETWORK = !!process.env.NETWORK && process.env.NETWORK !== '0'
const GIT_SOURCE: Record<string, string> = process.env.GIT_URL
  ? {
      gitUrl: process.env.GIT_URL,
      ...(process.env.GIT_BRANCH && { gitBranch: process.env.GIT_BRANCH }),
      ...(process.env.GIT_SUBDIR && { gitSubdir: process.env.GIT_SUBDIR }),
    }
  : {
      gitUrl: 'https://github.com/LiaScript/LiaScript-Exporter',
      gitSubdir: 'tests/fixtures/course',
    }

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

let server: ChildProcess | undefined
let serverLog = ''
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

/** The course directory as the zip a user would upload, `.hidden/` included. */
function zipCourse(): Buffer {
  const files: Record<string, Uint8Array> = {}

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else files[`course/${path.relative(COURSE_DIR, full).split(path.sep).join('/')}`] =
        new Uint8Array(fs.readFileSync(full))
    }
  }

  walk(COURSE_DIR)
  return Buffer.from(zipSync(files))
}

/**
 * Starts the server in its own process group: every job spawns the CLI, and
 * the CLI may start Chrome; all of it must go when the suite ends.
 */
async function startServer(): Promise<void> {
  const port = await freePort()
  server = spawn(process.execPath, [CLI, 'serve', '--port', String(port), '--no-browser'], {
    cwd: ROOT,
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout!.on('data', (chunk) => (serverLog += chunk))
  server.stderr!.on('data', (chunk) => (serverLog += chunk))

  baseURL = `http://127.0.0.1:${port}`
  const deadline = Date.now() + 30_000

  while (Date.now() < deadline) {
    if (server.exitCode !== null) break
    try {
      if ((await fetch(`${baseURL}/api/queue`)).ok) return
    } catch {
      // not listening yet
    }
    await new Promise((r) => setTimeout(r, 250))
  }

  throw new Error(`server did not start; log:\n${serverLog.slice(-2_000)}`)
}

function stopServer(): void {
  if (!server?.pid) return
  try {
    process.kill(-server.pid, 'SIGKILL')
  } catch {
    // the group is already gone
  }
  server = undefined
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
): Promise<{ status: number; body: any }> {
  const form = new FormData()
  for (const [key, value] of Object.entries(fields)) form.append(key, value)
  if (upload) form.append('file', new Blob([new Uint8Array(upload.buffer)], { type: upload.mimeType }), upload.name)

  const response = await request.post(`${baseURL}/api/export`, { multipart: form })
  return { status: response.status(), body: await response.json() }
}

/** Polls the job until it is done; the job status is nested at `job.status`. */
async function waitForJob(
  request: APIRequestContext,
  jobId: string,
  timeout: number,
): Promise<Job> {
  const deadline = Date.now() + timeout
  let job: Job | undefined

  while (Date.now() < deadline) {
    const response = await request.get(`${baseURL}/api/job/${jobId}`)
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

const courseUpload = () => ({ name: 'course.zip', mimeType: 'application/zip', buffer: courseZip })

// Not serial: a failing test restarts the worker, which starts a fresh server,
// and the remaining tests still run.
test.beforeAll(async () => {
  if (!fs.existsSync(CLI)) throw new Error(`${CLI} is missing; run npm run build first`)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  courseZip = zipCourse()

  await startServer()
})

test.afterAll(async ({}, testInfo) => {
  stopServer()
  await testInfo.attach('server.log', { body: serverLog, contentType: 'text/plain' })
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
    expect(serverLog).toMatch(/--format scorm1\.2 .*--scorm-embed/)

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

    const line = serverLog.split('\n').find((l) => l.includes(result.job.id) && l.includes('Starting export'))
    expect(line).toContain('--scorm-masteryScore 75')
    expect(line).not.toContain('--pdf-format')
    expect(line).not.toContain('--web-zip')
  })

  test('git import over multipart', async ({ request }) => {
    test.skip(!NETWORK, 'needs NETWORK=1')
    test.setTimeout(3 * 60_000)

    const { status, body } = await submit(request, { format: 'json', ...GIT_SOURCE })
    expect(status, JSON.stringify(body)).toBe(200)

    const job = await waitForJob(request, body.jobId, 2 * 60_000)
    expect(job.status, job.error).toBe('completed')

    // Default source is our fixture, so the checker applies.
    if (!process.env.GIT_URL) {
      const response = await request.get(`${baseURL}/api/download/${job.id}`)
      const file = path.join(OUT_DIR, 'git.json')
      fs.writeFileSync(file, await response.body())
      expect((await checkOutput('json', file)).problems).toEqual([])
    }
  })

  test('git import over JSON', async ({ request }) => {
    test.skip(!NETWORK, 'needs NETWORK=1')
    test.fail(true, 'the JSON branch of POST /api/export never clones, so the job fails with "No main file found"')
    test.setTimeout(3 * 60_000)

    const response = await request.post(`${baseURL}/api/export`, {
      data: { ...GIT_SOURCE, target: { format: 'json' } },
    })
    expect(response.status()).toBe(200)

    const job = await waitForJob(request, (await response.json()).jobId, 2 * 60_000)
    expect(job.status, job.error).toBe('completed')
  })
})
