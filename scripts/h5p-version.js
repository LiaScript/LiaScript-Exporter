#!/usr/bin/env node
// Run from LiaScript/ by `npm run asset:h5p`, after the H5P runtime was
// copied to dist/assets/h5p: records which LiaScript version it is and when it
// was built. src/export/h5p.ts turns this into the version of the H5P.LiaScript
// library, which platforms only replace by one with a higher patch version.
const fs = require('fs')
const path = require('path')

const { version } = require(path.resolve('package.json'))
// hours since 2026, an integer that only grows with every build: H5P allows
// at most five digits for the patch version, enough until 2037
const built = Math.floor((Date.now() - Date.UTC(2026, 0, 1)) / 3600000)

const target = path.resolve('../dist/assets/h5p/version.json')
fs.writeFileSync(target, JSON.stringify({ version, built }) + '\n')
console.log(`H5P runtime ${version}, build ${built}`)
