#!/usr/bin/env node
'use strict'

/**
 * Copies the DOCX converter into a built web app, verbatim.
 *
 * Bypasses the bundler for two reasons: the browser build is an IIFE that
 * publishes `window.HTMLToDOCX` and exports nothing, so there is no binding to
 * import; and a `url:` import of a `.js` file makes Parcel bundle it as code
 * rather than emit it as an asset, yielding an undefined URL.
 *
 * `src/webapp/docx.ts` loads it from this fixed `docx/` path.
 *
 * Usage: node scripts/copy-webapp-docx.js <dist-dir>
 */

const fs = require('fs')
const path = require('path')

const SRC = path.join(
  __dirname,
  '..',
  'node_modules',
  '@turbodocx',
  'html-to-docx',
  'dist',
  'html-to-docx.browser.js',
)

const target = process.argv[2]

if (!target) {
  console.error('usage: node scripts/copy-webapp-docx.js <dist-dir>')
  process.exit(1)
}

if (!fs.existsSync(SRC)) {
  console.error(
    `missing ${path.relative(process.cwd(), SRC)} — run "npm install" first`,
  )
  process.exit(1)
}

const out = path.join(target, 'docx')

fs.rmSync(out, { recursive: true, force: true })
fs.mkdirSync(out, { recursive: true })
fs.copyFileSync(SRC, path.join(out, 'html-to-docx.browser.js'))

console.log('webapp docx   1 file ->', path.join(target, 'docx'))
