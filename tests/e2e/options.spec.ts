/*
 * Option passing: exports the fixture course with format options set to
 * values that show up in the output, and checks that each one arrived.
 *
 *   npm run build && npm run test:cli
 *
 * cli.spec.ts checks that the course survives every format; this file checks
 * the flags. Each case names the flags it covers, so a flag that the parser
 * drops, or an exporter ignores, fails here even though the export succeeds.
 */
import { spawn } from 'node:child_process'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { expect, test } from '@playwright/test'
import { openPackage, Package } from '../checkers/package'

const ROOT = path.resolve(__dirname, '../..')
const CLI = path.join(ROOT, 'dist/index.js')
const COURSE = 'tests/fixtures/course/README.md'
const OUT_DIR = path.join(ROOT, 'test-results/cli-options')

const QUICK_TIMEOUT = 90_000
const CHROME_TIMEOUT = 150_000

/** Runs the CLI in its own process group, so a timeout also ends its Chrome. */
function runCli(args: string[], timeout: number): Promise<{ code: number | null; log: string }> {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'liao-'))
  const child = spawn(process.execPath, [CLI, ...args], {
    cwd: ROOT,
    env: { ...process.env, TMPDIR: tmp },
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
  const timer = setTimeout(killGroup, timeout)

  return new Promise((resolve) => {
    child.on('exit', (code) => {
      clearTimeout(timer)
      killGroup()
      fs.rmSync(tmp, { recursive: true, force: true })
      resolve({ code, log })
    })
  })
}

/** Exports `name` with `args` and returns its output, failing on a bad exit. */
async function exportWith(name: string, args: string[], output: string, timeout: number): Promise<string> {
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const file = path.join(OUT_DIR, output)
  fs.rmSync(file, { recursive: true, force: true })

  const run = await runCli(['-i', COURSE, '-o', path.join(OUT_DIR, name), ...args], timeout)

  expect(run.code, `CLI exit code; log:\n${run.log.slice(-2_000)}`).toBe(0)
  expect(fs.existsSync(file), `${output} was not written`).toBe(true)
  return file
}

function opfOf(pkg: Package): string {
  const opf = pkg.files.find((file) => file.endsWith('.opf'))
  expect(opf, 'the epub has no package document').toBeTruthy()
  return pkg.text(opf!)
}

test.describe.configure({ mode: 'parallel' })

test('epub: title, description, language, version, toc title, chapter title, fonts', async () => {
  test.setTimeout(CHROME_TIMEOUT)

  // Any font, under a name the epub cannot contain by itself
  fs.mkdirSync(OUT_DIR, { recursive: true })
  const font = path.join(OUT_DIR, 'OptFont.ttf')
  const bundled = fs.readdirSync(path.join(ROOT, 'dist/assets/common')).find((file) => file.endsWith('.ttf'))
  fs.copyFileSync(path.join(ROOT, 'dist/assets/common', bundled!), font)

  const args = [
    '-f', 'epub',
    '--epub-title', 'OptTitle',
    '--epub-description', 'OptDescription',
    '--epub-language', 'de',
    '--epub-version', '2',
    '--epub-toc-title', 'OptToc',
    '--epub-chapter-title', 'OptChapter',
    '--epub-publisher', 'OptPublisher',
    '--epub-fonts', font,
  ]

  const pkg = openPackage(await exportWith('epub', args, 'epub.epub', CHROME_TIMEOUT))
  const opf = opfOf(pkg)

  expect(opf).toContain('<dc:title>OptTitle</dc:title>')
  expect(opf).toContain('<dc:description>OptDescription</dc:description>')
  expect(opf).toContain('<dc:language>de</dc:language>')
  expect(opf).toContain('<dc:publisher>OptPublisher</dc:publisher>')
  expect(opf).toMatch(/<package[^>]*version="2\.0"/)

  const toc = pkg.files.filter((file) => /toc\.(ncx|xhtml)$/.test(file)).map((file) => pkg.text(file)).join('\n')
  expect(toc).toContain('OptToc')
  expect(toc).toContain('OptChapter')

  expect(pkg.files.some((file) => file.endsWith('OptFont.ttf'))).toBe(true)
})

test('epub: description defaults to the course comment', async () => {
  test.setTimeout(CHROME_TIMEOUT)

  const pkg = openPackage(await exportWith('epub-default', ['-f', 'epub'], 'epub-default.epub', CHROME_TIMEOUT))

  expect(opfOf(pkg)).toMatch(/<dc:description>Fixture course for the exporter test suite/)
})

test('pdf: width, height and page ranges', async () => {
  test.setTimeout(CHROME_TIMEOUT)

  const file = await exportWith(
    'pdf',
    ['-f', 'pdf', '--pdf-width', '100mm', '--pdf-height', '150mm', '--pdf-pageRanges', '1-2'],
    'pdf.pdf',
    CHROME_TIMEOUT,
  )

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const task = pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), verbosity: 0 })

  try {
    const doc = await task.promise
    expect(doc.numPages).toBe(2)

    // 100 x 150 mm in PDF points; Chrome rounds the page to whole pixels
    const [, , width, height] = (await doc.getPage(1)).view
    expect(Math.abs(width - (100 / 25.4) * 72)).toBeLessThan(2)
    expect(Math.abs(height - (150 / 25.4) * 72)).toBeLessThan(2)
  } finally {
    await task.destroy()
  }
})

test('docx: --docx-theme colors headings and links', async () => {
  test.setTimeout(CHROME_TIMEOUT)

  const pkg = openPackage(
    await exportWith('docx-theme', ['-f', 'docx', '--docx-theme', 'red'], 'docx-theme.docx', CHROME_TIMEOUT),
  )

  // the red theme's --color-highlight: 191,44,26
  expect(pkg.text('word/document.xml')).toMatch(/<w:color w:val="bf2c1a"\/>/i)
})

test('presets: command line flags override the preset', async () => {
  test.setTimeout(QUICK_TIMEOUT)

  const pkg = openPackage(
    await exportWith(
      'preset-override',
      ['-f', 'presets', '--moodle4', '--scorm-organization', 'OptOrg', '--scorm-masteryScore', '42', '--no-scorm-embed'],
      'preset-override.zip',
      QUICK_TIMEOUT,
    ),
  )
  const manifest = pkg.text('imsmanifest.xml')

  expect(manifest).toContain('default="OptOrg"')
  expect(manifest).toMatch(/<adlcp:masteryscore>\s*42\s*</)
  // moodle4 embeds the course; --no-scorm-embed switched that off
  expect(pkg.has('course.js')).toBe(false)
})

test('presets: dotted ids and option mapping (scormcloud-1.2, learnworlds)', async () => {
  test.setTimeout(QUICK_TIMEOUT * 2)

  const cloud = openPackage(
    await exportWith('preset-cloud', ['-f', 'presets', '--scormcloud-1.2'], 'preset-cloud.zip', QUICK_TIMEOUT),
  )
  expect(cloud.text('imsmanifest.xml')).toMatch(/<schemaversion>\s*1\.2\s*</)
  expect(cloud.has('start.html')).toBe(true)

  const learnworlds = openPackage(
    await exportWith('preset-lw', ['-f', 'presets', '--learnworlds'], 'preset-lw.zip', QUICK_TIMEOUT),
  )
  // masteryScore: 80 from presets.yaml
  expect(learnworlds.text('imsmanifest.xml')).toMatch(/<imsss:minNormalizedMeasure>\s*0\.8\s*</)
})

test('scorm: --lia-subfolder points the embedded course at content/', async () => {
  test.setTimeout(QUICK_TIMEOUT)

  const pkg = openPackage(
    await exportWith('subfolder', ['-f', 'scorm2004', '--lia-subfolder'], 'subfolder.zip', QUICK_TIMEOUT),
  )

  expect(pkg.has('content/README.md')).toBe(true)
  expect(pkg.text('course.js')).toContain('base: content/')
})

test('web: --web-iframe works whatever the wrapper page is called', async () => {
  test.setTimeout(QUICK_TIMEOUT)

  const pkg = openPackage(
    await exportWith('web-iframe', ['-f', 'web', '--web-zip', '--web-iframe', '-s', 'outline: 1px solid red'], 'web-iframe.zip', QUICK_TIMEOUT),
  )
  const wrapper = pkg.text('index.html')

  expect(wrapper).not.toContain('replace("start.html"')
  expect(wrapper).toContain('start.html?')
  // -s adds to the iframe's own size instead of replacing it
  expect(wrapper).toMatch(/width: 100%; height: 100%; outline: 1px solid red/)
})

test('rdf: a template is merged with the course, --rdf-type wins', async () => {
  test.setTimeout(QUICK_TIMEOUT)

  fs.mkdirSync(OUT_DIR, { recursive: true })
  const template = path.join(OUT_DIR, 'template.json')
  fs.writeFileSync(
    template,
    JSON.stringify({
      '@context': 'http://schema.org/',
      '@type': 'Course',
      provider: { '@type': 'Organization', name: 'OptProvider' },
    }),
  )

  const doc = JSON.parse(
    fs.readFileSync(
      await exportWith(
        'rdf',
        ['-f', 'rdf', '--rdf-template', template, '--rdf-type', 'EducationalResource', '--rdf-url', 'https://example.org/course/README.md'],
        'rdf.jsonld',
        QUICK_TIMEOUT,
      ),
      'utf8',
    ),
  )

  expect(doc.name).toBe('Exporter Test Course')
  expect(doc.provider?.name).toBe('OptProvider')
  expect(doc['@type']).toBe('EducationalResource')
  expect(doc.type).toBeUndefined()
  // the logo is relative to the course's folder, not to its parent
  expect(doc.image?.url).toBe('https://example.org/course/img/marker.png')
})
