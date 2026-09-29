/*
 * Downloads what the deep checks need into tests/.cache (git-ignored):
 * epubcheck. xmllint comes from the system (libxml2-utils on Debian/Ubuntu).
 *
 *   npm run test:setup
 */
import { spawnSync } from 'node:child_process'
import * as fs from 'node:fs'
import * as path from 'node:path'
import { unzipSync } from 'fflate'
import {
  CACHE_DIR,
  EPUBCHECK_VERSION,
  epubcheckJar,
  hasXmllint,
} from '../checkers/tools'

async function main() {
  const target = path.join(CACHE_DIR, `epubcheck-${EPUBCHECK_VERSION}`)

  if (fs.existsSync(path.join(target, 'epubcheck.jar'))) {
    console.log(`epubcheck ${EPUBCHECK_VERSION}: already in ${target}`)
  } else {
    const url = `https://github.com/w3c/epubcheck/releases/download/v${EPUBCHECK_VERSION}/epubcheck-${EPUBCHECK_VERSION}.zip`
    console.log(`downloading ${url}`)

    const response = await fetch(url)
    if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`)

    const files = unzipSync(new Uint8Array(await response.arrayBuffer()))
    for (const [name, data] of Object.entries(files)) {
      if (name.endsWith('/')) continue
      const out = path.join(CACHE_DIR, name)
      fs.mkdirSync(path.dirname(out), { recursive: true })
      fs.writeFileSync(out, data)
    }

    console.log(`epubcheck ${EPUBCHECK_VERSION}: installed in ${target}`)
  }

  const java = !spawnSync('java', ['-version'], { stdio: 'ignore' }).error
  console.log(`java:      ${java ? 'found' : 'MISSING (needed by epubcheck)'}`)
  console.log(`epubcheck: ${epubcheckJar() ? 'ready' : 'NOT usable'}`)
  console.log(`xmllint:   ${hasXmllint() ? 'found' : 'MISSING (apt install libxml2-utils)'}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
