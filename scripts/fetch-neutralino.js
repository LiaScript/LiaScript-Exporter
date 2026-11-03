#!/usr/bin/env node
'use strict'

/**
 * Downloads the Neutralinojs binaries the desktop export wraps a course in,
 * one asset folder per platform, so the web app loads only the one it builds.
 */

const fs = require('fs')
const path = require('path')
const { unzipSync } = require('fflate')

const VERSION = '6.10.0'
const URL = `https://github.com/neutralinojs/neutralinojs/releases/download/v${VERSION}/neutralinojs-v${VERSION}.zip`

const PLATFORMS = {
  win: 'neutralino-win_x64.exe',
  linux: 'neutralino-linux_x64',
  mac: 'neutralino-mac_universal',
}

const ASSETS = path.join(__dirname, '..', 'dist', 'assets')
const ICON = path.join(ASSETS, '..', 'resources', 'icon.png')

async function main() {
  const response = await fetch(URL)
  if (!response.ok) throw new Error(`${response.status} from ${URL}`)

  const files = unzipSync(new Uint8Array(await response.arrayBuffer()))

  for (const [platform, binary] of Object.entries(PLATFORMS)) {
    const dir = path.join(ASSETS, `desktop-${platform}`)
    fs.rmSync(dir, { recursive: true, force: true })
    fs.mkdirSync(dir, { recursive: true })
    fs.writeFileSync(path.join(dir, binary), files[binary])
    fs.copyFileSync(ICON, path.join(dir, 'icon.png'))
    console.log(`desktop-${platform}  ${binary} (${files[binary].length} bytes)`)
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
