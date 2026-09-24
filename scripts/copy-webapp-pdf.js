#!/usr/bin/env node
'use strict'

/**
 * Copies the pdf render assets into a built web app, verbatim.
 *
 * Runs after Parcel, which owns the output directory and clears it. These files
 * bypass the bundler: the render lazy-loads ~550 siblings (ace modes, fonts,
 * workers) by relative name, and Parcel flattens and renames them, so they
 * would 404. `src/webapp/formats/pdf.ts` points at this fixed `pdf/` path.
 *
 * Usage: node scripts/copy-webapp-pdf.js <dist-dir>
 */

const fs = require('fs')
const path = require('path')

const SRC = path.join(__dirname, '..', 'dist', 'assets', 'pdf')
const AUTOPRINT = path.join(__dirname, 'webapp-autoprint.js')

const target = process.argv[2]

if (!target) {
  console.error('usage: node scripts/copy-webapp-pdf.js <dist-dir>')
  process.exit(1)
}

if (!fs.existsSync(SRC)) {
  console.error(
    `missing ${path.relative(process.cwd(), SRC)} — run "npm run build:assets" first`,
  )
  process.exit(1)
}

const out = path.join(target, 'pdf')

fs.rmSync(out, { recursive: true, force: true })
fs.cpSync(SRC, out, { recursive: true })

/*
 * The print tab has to be the render itself: `@page` is ignored in a nested
 * document, and navigating a wrapper away discards its scripts. So the hook is
 * appended here, to the copy.
 */
const index = path.join(out, 'index.html')
const html = fs.readFileSync(index, 'utf8')

if (!html.includes('</body>')) {
  console.error('copy-webapp-pdf: no </body> in the pdf entry to hook into')
  process.exit(1)
}

const hook = `<script>\n${fs.readFileSync(AUTOPRINT, 'utf8')}</script>`

fs.writeFileSync(index, html.replace('</body>', `${hook}</body>`))

let count = 0
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) walk(path.join(dir, entry.name))
    else count += 1
  }
}
walk(out)

console.log(`webapp pdf   ${count} files -> ${path.relative(process.cwd(), out)}`)
