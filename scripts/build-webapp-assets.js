#!/usr/bin/env node
'use strict'

/**
 * Packs `dist/assets/<bundle>` into one zip per bundle for the web app.
 *
 * The browser seeds assets from these archives rather than fetching loose
 * files: `web` alone is 288 files and `common` 324, so the per-request overhead
 * would dominate. Paths inside each archive are relative to the bundle root,
 * which is what `AssetLoader.seedBundle` re-roots under `assets/<bundle>`.
 */

const fs = require('fs')
const path = require('path')
const { zipSync } = require('fflate')

/**
 * Asset directories the browser-portable formats read. `common` is shared by
 * every format, `web` doubles as the `ims` payload, and `indexeddb` backs the
 * `--*-indexeddb` variants. `pdf` is not here: it renders a page instead of
 * writing files, and is copied verbatim by scripts/copy-webapp-pdf.js.
 */
const BUNDLES = ['common', 'web', 'xapi', 'scorm1.2', 'scorm2004', 'indexeddb']

const ASSETS = path.join(__dirname, '..', 'dist', 'assets')

/**
 * Staging directory for the zips. Deliberately NOT Parcel's dist directory:
 * `parcel serve` clears and owns that, and answers unknown paths with the HTML
 * fallback rather than a 404 — so a stale `.zip` comes back as a page of HTML
 * and fails deep inside `unzipSync` as "invalid zip data".
 */
const OUT = path.join(__dirname, '..', 'src', 'webapp', 'generated', 'assets')

/** Collects every file under `dir` keyed by its path relative to `dir`. */
function collect(dir, base = dir, into = {}) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)

    if (entry.isDirectory()) {
      collect(full, base, into)
    } else if (entry.isFile()) {
      // Zip paths are always POSIX, regardless of the building platform.
      const key = path.relative(base, full).split(path.sep).join('/')
      into[key] = fs.readFileSync(full)
    }
  }

  return into
}

fs.mkdirSync(OUT, { recursive: true })

// The UI fetches translations by path (see i18n.js), which Parcel does not
// follow, so they are copied rather than bundled.
const LOCALES_SRC = path.join(__dirname, '..', 'src', 'server', 'public', 'locales')
const LOCALES_OUT = path.join(__dirname, '..', 'src', 'webapp', 'generated', 'locales')

fs.mkdirSync(LOCALES_OUT, { recursive: true })

for (const name of fs.readdirSync(LOCALES_SRC)) {
  fs.copyFileSync(path.join(LOCALES_SRC, name), path.join(LOCALES_OUT, name))
}

console.log(`locales    ${fs.readdirSync(LOCALES_SRC).length} files`)

/*
 * presets.yaml becomes JSON here rather than being parsed in the browser:
 * neither `@parcel/transformer-yaml` nor the `yaml` library survives bundling
 * (both emit a reference Parcel never links, and the page dies on
 * "$…$import$… is not defined"). JSON needs no parser and no transformer.
 */
const YAML = require('yaml')

const PRESETS_SRC = path.join(__dirname, '..', 'src', 'presets.yaml')
const PRESETS_OUT = path.join(__dirname, '..', 'src', 'webapp', 'generated', 'presets.json')

fs.writeFileSync(
  PRESETS_OUT,
  JSON.stringify(YAML.parse(fs.readFileSync(PRESETS_SRC, 'utf8'))),
)

console.log('presets    converted to presets.json')

// Preset logos are named by presets.yaml data (`url: ../assets/moodle.svg`),
// not by markup, so no bundler can find them; copied verbatim instead.
const LOGOS_SRC = path.join(__dirname, '..', 'src', 'server', 'public', 'assets')
const LOGOS_OUT = path.join(__dirname, '..', 'src', 'webapp', 'generated', 'logos')

fs.mkdirSync(LOGOS_OUT, { recursive: true })

let logos = 0
for (const name of fs.readdirSync(LOGOS_SRC)) {
  fs.copyFileSync(path.join(LOGOS_SRC, name), path.join(LOGOS_OUT, name))
  logos += 1
}

console.log(`logos      ${logos} files`)

/*
 * The SCORM packager copies its own XSD/DTD schemas into every package, from
 * the directory its `assetRoot` names — its install location under Node. A
 * browser has no install, so they are packed here and seeded into the store.
 */
const SCHEMAS_SRC = path.join(
  path.dirname(require.resolve('@liascript/simple-scorm-packager/package.json')),
  'lib',
  'schemas',
)
const schemaFiles = collect(SCHEMAS_SRC)

fs.writeFileSync(
  path.join(OUT, 'scorm-schemas.zip'),
  zipSync(schemaFiles, { level: 6 }),
)

console.log(`schemas    ${Object.keys(schemaFiles).length} files (scorm-schemas.zip)`)

for (const bundle of BUNDLES) {
  const source = path.join(ASSETS, bundle)

  if (!fs.existsSync(source)) {
    console.error(
      `missing ${path.relative(process.cwd(), source)} — run "npm run build:assets" first`,
    )
    process.exit(1)
  }

  const files = collect(source)
  // Level 6: served once per session and cached, so build time matters more
  // than the last few percent of size.
  const archive = zipSync(files, { level: 6 })

  fs.writeFileSync(path.join(OUT, `${bundle}.zip`), archive)

  const mb = (archive.length / 1024 / 1024).toFixed(1)
  console.log(
    `${bundle}.zip  ${String(Object.keys(files).length).padStart(4)} files  ${mb} MB`,
  )
}
