/*
 * Runs one checker on an export by hand, e.g. to look at a web app download:
 *
 *   npm run test:check -- epub path/to/course.epub [--deep] [--method webapp]
 *   npm run test:check -- web path/to/web-dir --render
 */
import { chromium } from '@playwright/test'
import { checkOutput, FORMATS, Format } from '../checkers'
import { checkRendered } from '../checkers/render'

async function main() {
  const args = process.argv.slice(2)
  const deep = args.includes('--deep')
  const methodAt = args.indexOf('--method')
  const method = methodAt >= 0 ? args[methodAt + 1] : 'cli'
  const [format, source] = args.filter(
    (arg, i) => !arg.startsWith('--') && (methodAt < 0 || i !== methodAt + 1),
  )

  if (!FORMATS.includes(format as Format) || !source) {
    console.error(`usage: check-output <${FORMATS.join('|')}> <file or dir> [--deep] [--render] [--method cli|webapp]`)
    process.exit(2)
  }

  const options = { deep, method: method as 'cli' | 'webapp' }
  const results = [await checkOutput(format as Format, source, options)]

  if (args.includes('--render')) {
    if (format !== 'web' && format !== 'xapi') {
      console.error('--render works for web and xapi only')
      process.exit(2)
    }

    const browser = await chromium.launch()
    try {
      results.push(await checkRendered(await browser.newPage(), source, options))
    } finally {
      await browser.close()
    }
  }

  let failed = false

  for (const result of results) {
    console.log(`\n== ${result.format}${results.length > 1 && result === results[1] ? ' (rendered)' : ''}`)
    console.log(JSON.stringify(result.summary, null, 2))
    console.log(`markers: ${result.markers.length}`)

    if (result.problems.length) {
      failed = true
      console.log(`${result.problems.length} problem(s):`)
      for (const problem of result.problems) console.log(`  ✗ ${problem}`)
    } else {
      console.log('ok')
    }
  }

  process.exit(failed ? 1 : 0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
