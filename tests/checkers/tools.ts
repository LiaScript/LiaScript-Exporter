/*
 * External validators used by the deep checks. Both are optional installs:
 * callers report a missing tool as a problem instead of skipping silently.
 */
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'

export const EPUBCHECK_VERSION = '5.1.0'

export const CACHE_DIR = path.join(__dirname, '..', '.cache')

function onPath(command: string, args: string[]): boolean {
  const run = spawnSync(command, args, { stdio: 'ignore' })
  return !run.error
}

export function hasXmllint(): boolean {
  return onPath('xmllint', ['--version'])
}

/** `EPUBCHECK_JAR`, else the copy `npm run test:setup` downloads. */
export function epubcheckJar(): string | null {
  const jar =
    process.env.EPUBCHECK_JAR ??
    path.join(CACHE_DIR, `epubcheck-${EPUBCHECK_VERSION}`, 'epubcheck.jar')

  return fs.existsSync(jar) && onPath('java', ['-version']) ? jar : null
}

/** Validates `xml` against `schema`; both paths must be on disk. */
export function xmllint(schema: string, xml: string): string[] {
  const run = spawnSync(
    'xmllint',
    ['--noout', '--nonet', '--schema', schema, xml],
    { encoding: 'utf8', cwd: path.dirname(xml) },
  )

  if (run.status === 0) return []

  return run.stderr
    .split('\n')
    .filter((line) => /validity error|parser error/.test(line))
    .map((line) => line.replace(`${path.dirname(xml)}/`, '').trim())
}

export interface EpubcheckReport {
  fatals: string[]
  errors: string[]
  /** Error count per message code, e.g. { 'RSC-005': 32 }. */
  codes: Record<string, number>
}

export function epubcheck(jar: string, epub: string): EpubcheckReport {
  const run = spawnSync('java', ['-jar', jar, '--quiet', epub], {
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
  })

  const lines = `${run.stdout}\n${run.stderr}`.split('\n')
  const report: EpubcheckReport = { fatals: [], errors: [], codes: {} }

  for (const line of lines) {
    const match = line.match(/^(FATAL|ERROR)\(([A-Z]+-\d+)\)/)
    if (!match) continue

    const short = line.replace(`${epub}/`, '').replace(epub, '').trim()
    ;(match[1] === 'FATAL' ? report.fatals : report.errors).push(short)
    report.codes[match[2]] = (report.codes[match[2]] ?? 0) + 1
  }

  if (run.error) report.fatals.push(`epubcheck did not run: ${run.error.message}`)

  return report
}
