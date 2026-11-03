import * as helper from './helper'
import * as WEB from './web'
import * as COLOR from '../colorize'
import * as path from '../fs/path'
import type { ExportFS } from '../fs/types'
import { zipSync } from 'fflate'
import * as ResEdit from 'resedit'
import './uzip-global'
import * as png2icons from 'png2icons'

export function help() {
  console.log('')
  console.log(COLOR.heading('Desktop settings:'), '\n')

  COLOR.info(
    'Desktop export wraps your course into an offline Neutralinojs app that uses the system webview: macOS (.zip with a universal .app), Windows (.exe) and Linux (.zip). Unsigned apps trigger Gatekeeper/SmartScreen warnings.\n',
  )

  console.log('\nLearn more:')
  console.log('- Neutralinojs: https://neutralino.js.org/')
  console.log('')

  COLOR.command(
    null,
    '--desktop-appId',
    '           Required to identify your App reverse url such as io.github.liascript',
  )
  COLOR.command(
    null,
    '--desktop-appName',
    '         Name of the App (Main-title is used as default).',
  )
  COLOR.command(
    null,
    '--desktop-icon',
    '            Optional icon (png with 1024x1024 px)',
  )
  COLOR.command(
    null,
    '--desktop-platform',
    '        Comma separated: mac, win, linux (default: all)',
  )
}

export interface DesktopExportArguments {
  'desktop-appId'?: string
  'desktop-appName'?: string
  'desktop-icon'?: string
  'desktop-platform'?: string
}

export const format = 'desktop'

export const PLATFORMS = ['mac', 'win', 'linux']

/** The Neutralinojs binary in `assets/desktop-<platform>`, see scripts/fetch-neutralino.js. */
const BINARY: Record<string, string> = {
  mac: 'neutralino-mac_universal',
  win: 'neutralino-win_x64.exe',
  linux: 'neutralino-linux_x64',
}

/** Marks a binary as carrying `resources.neu`, as `neu build --embed-resources` does. */
const SENTINEL = 'POSTJECT_SENTINEL_fce680ab2cc467b6e072b8b5df1996b2:'
const RESOURCE_NAME = 'NEUTRALINOJS_RESOURCES_NEU'
const RT_RCDATA = 10
const EN_US = 1033

/** Unix modes for zip entries: a downloaded binary needs its executable bit. */
const EXECUTABLE = { os: 3, attrs: 0o100755 << 16 }
const REGULAR = { os: 3, attrs: 0o100644 << 16 }

/** The platforms `--desktop-platform` asks for, all by default. */
export function platforms(argument: any): string[] {
  const list = (argument['desktop-platform'] || PLATFORMS.join(','))
    .split(',')
    .map((p: string) => p.trim())
  const unknown = list.filter((p: string) => !PLATFORMS.includes(p))
  if (unknown.length) {
    throw new Error(`Unknown --desktop-platform: ${unknown.join(', ')}`)
  }
  return list
}

export async function exporter(argument: any, json: any) {
  const fs: ExportFS = argument.fs
  const appId = argument['desktop-appId']
  if (!appId) {
    throw new Error(
      'The appId has to be provided via --desktop-appId, e.g. io.github.liascript',
    )
  }
  const targets = platforms(argument)

  // the offline web export is the app's content; the appId as readme name
  // keeps the stored course state stable across app updates
  const www = path.join(await fs.tmpDir(), 'www')
  await WEB.exporter(
    {
      ...argument,
      'web-indexeddb': appId,
      'web-zip': false,
      'web-iframe': false,
      output: www,
    },
    json,
  )

  const assets = (platform: string) =>
    path.join(fs.assetRoot(), 'assets', `desktop-${platform}`)

  const icon = await fs.readFileRaw(
    argument['desktop-icon'] || path.join(assets(targets[0]), 'icon.png'),
  )

  const productName = argument['desktop-appName'] || json.lia.str_title || appId
  const version = /^\d+\.\d+\.\d+$/.test(json.lia?.definition?.version)
    ? json.lia.definition.version
    : '1.0.0'
  const binaryName = productName.replace(/[^\w-]+/g, '-')

  // the course is served from http://127.0.0.1:<port>, so a port fixed per app
  // keeps its IndexedDB origin, and with it the stored state, across starts
  let hash = 0
  for (const char of appId) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  const port = 20000 + (hash % 40000)

  const config = {
    applicationId: appId,
    applicationName: productName,
    description: productName,
    version,
    defaultMode: 'window',
    port,
    documentRoot: '/www/',
    url: '/index.html',
    enableServer: true,
    // course scripts must not reach the system
    enableNativeAPI: false,
    dataLocation: 'system',
    modes: {
      window: {
        title: productName,
        width: 1280,
        height: 860,
        icon: '/icon.png',
      },
    },
  }

  const files: Record<string, Uint8Array> = {
    'neutralino.config.json': new TextEncoder().encode(JSON.stringify(config)),
    'icon.png': icon,
  }
  for (const [name, bytes] of Object.entries(await readTree(fs, www))) {
    files[`www/${name}`] = bytes
  }
  const resources = asar(files)

  for (const platform of targets) {
    const binary = await fs.readFileRaw(
      path.join(assets(platform), BINARY[platform]),
    )
    let target = `${argument.output}-${platform}`

    if (platform === 'win') {
      target += '-x64.exe'
      const ico = png2icons.createICO(Buffer.from(icon), png2icons.BICUBIC, 0, true, true)
      if (!ico) throw new Error('The icon could not be converted to .ico')
      await fs.writeFileRaw(
        target,
        windowsExe(binary, resources, ico, productName, version, binaryName),
      )
    } else if (platform === 'linux') {
      // zipped, as a downloaded single file loses its executable bit
      target += '-x64.zip'
      await fs.writeFileRaw(
        target,
        zipSync({
          [binaryName]: {
            [binaryName]: [binary, EXECUTABLE],
            'resources.neu': [resources, REGULAR],
          },
        }),
      )
    } else {
      // resources.neu stays beside the binary: embedding would break its
      // ad-hoc signature, without which Apple Silicon refuses to run it
      target += '-universal.zip'
      const icns = png2icons.createICNS(
        Buffer.from(icon),
        png2icons.BICUBIC,
        0,
      )
      if (!icns) throw new Error('The icon could not be converted to .icns')

      await fs.writeFileRaw(
        target,
        zipSync({
          [`${productName.replace(/[/\\:]/g, '-')}.app`]: {
            Contents: {
              'Info.plist': [
                new TextEncoder().encode(
                  infoPlist({ appId, productName, version, binaryName }),
                ),
                REGULAR,
              ],
              MacOS: {
                [binaryName]: [binary, EXECUTABLE],
                'resources.neu': [resources, REGULAR],
              },
              Resources: { 'icon.icns': [new Uint8Array(icns), REGULAR] },
            },
          },
        }),
      )
    }

    console.warn('✅', target)
  }
}

/** Every file below `dir`, keyed by its path relative to `dir`. */
async function readTree(
  fs: ExportFS,
  dir: string,
  prefix = '',
  into: Record<string, Uint8Array> = {},
): Promise<Record<string, Uint8Array>> {
  for (const name of await fs.readDir(dir)) {
    const full = path.join(dir, name)
    if (await fs.isDirectory(full)) {
      await readTree(fs, full, `${prefix}${name}/`, into)
    } else {
      into[prefix + name] = await fs.readFileRaw(full)
    }
  }
  return into
}

/**
 * Packs files into an asar archive, the format of Neutralino's resources.neu:
 * two little-endian pickles (header size, then the JSON file tree) followed by
 * the file contents in tree order.
 */
export function asar(files: Record<string, Uint8Array>): Uint8Array {
  const root: any = { files: {} }
  let offset = 0
  for (const [name, bytes] of Object.entries(files)) {
    const parts = name.split('/')
    let dir = root
    for (const part of parts.slice(0, -1)) dir = dir.files[part] ??= { files: {} }
    dir.files[parts.at(-1)!] = { size: bytes.length, offset: String(offset) }
    offset += bytes.length
  }

  const json = new TextEncoder().encode(JSON.stringify(root))
  const padded = (json.length + 3) & ~3
  const header = new Uint8Array(16 + padded)
  const view = new DataView(header.buffer)
  view.setUint32(0, 4, true)
  view.setUint32(4, 8 + padded, true)
  view.setUint32(8, 4 + padded, true)
  view.setUint32(12, json.length, true)
  header.set(json, 16)

  return concat([header, ...Object.values(files)])
}

/**
 * Embeds resources.neu into the Windows binary, as postject does for
 * `neu build --embed-resources`, and sets its icon and version info.
 */
function windowsExe(
  binary: Uint8Array,
  resources: Uint8Array,
  ico: Uint8Array,
  productName: string,
  version: string,
  binaryName: string,
): Uint8Array {
  const exe = ResEdit.NtExecutable.from(binary)
  const res = ResEdit.NtExecutableResource.from(exe)

  res.entries.push({
    type: RT_RCDATA,
    id: RESOURCE_NAME,
    lang: EN_US,
    codepage: 0,
    bin: resources.slice().buffer,
  })

  ResEdit.Resource.IconGroupEntry.replaceIconsForResource(
    res.entries,
    1,
    EN_US,
    ResEdit.Data.IconFile.from(new Uint8Array(ico)).icons.map((i) => i.data),
  )

  const info = ResEdit.Resource.VersionInfo.createEmpty()
  info.setFileVersion(version, EN_US)
  info.setProductVersion(version, EN_US)
  info.setStringValues(
    { lang: EN_US, codepage: 1200 },
    {
      FileDescription: productName,
      ProductName: productName,
      ProductVersion: version,
      OriginalFilename: `${binaryName}.exe`,
    },
  )
  info.outputToResourceEntries(res.entries)

  res.outputResource(exe)
  const out = new Uint8Array(exe.generate())

  // flip the sentinel's ':0' to ':1', which tells the binary to look inside
  const marker = new TextEncoder().encode(SENTINEL + '0')
  const at = indexOf(out, marker)
  if (at < 0) throw new Error('The Windows binary has no resource sentinel')
  out[at + marker.length - 1] = '1'.charCodeAt(0)

  return out
}

function indexOf(haystack: Uint8Array, needle: Uint8Array): number {
  outer: for (let i = 0; i <= haystack.length - needle.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer
    }
    return i
  }
  return -1
}

function concat(parts: Uint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((sum, p) => sum + p.length, 0))
  let offset = 0
  for (const part of parts) {
    out.set(part, offset)
    offset += part.length
  }
  return out
}

function infoPlist(app: {
  appId: string
  productName: string
  version: string
  binaryName: string
}): string {
  const entry = (key: string, value: string) =>
    `  <key>${key}</key>\n  <string>${helper.escapeHtml(value)}</string>`

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
${entry('CFBundleExecutable', app.binaryName)}
${entry('CFBundleIdentifier', app.appId)}
${entry('CFBundleName', app.productName)}
${entry('CFBundleDisplayName', app.productName)}
${entry('CFBundleIconFile', 'icon.icns')}
${entry('CFBundlePackageType', 'APPL')}
${entry('CFBundleShortVersionString', app.version)}
${entry('CFBundleVersion', app.version)}
${entry('LSApplicationCategoryType', 'public.app-category.education')}
  <key>NSHighResolutionCapable</key>
  <true/>
  <key>NSAppTransportSecurity</key>
  <dict>
    <key>NSAllowsLocalNetworking</key>
    <true/>
  </dict>
</dict>
</plist>
`
}
