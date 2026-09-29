/*
 * `toOptions` / `toCliArguments` turn the server form (and presets) into the
 * CLI's argv. A wrong name here is silent: the CLI ignores flags it does not
 * know, so the export succeeds without the option the user picked.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { describe, expect, it } from 'vitest'
import * as YAML from 'yaml'
import { toCliArguments, toOptions } from '../../src/export/options'

const ROOT = path.resolve(__dirname, '../..')
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8')

/** Every `--flag` the CLI documents in its help (each exporter adds its own). */
const CLI_FLAGS = new Set(
  ['src/cli.ts', ...fs.readdirSync(path.join(ROOT, 'src/export')).map((f) => `src/export/${f}`)]
    .filter((file) => file.endsWith('.ts'))
    .flatMap((file) => [...read(file).matchAll(/'--([\w.-]+)/g)].map((m) => m[1])),
)

/** Every `option_*` field of the server form; the UI sends them all at once. */
const UI_OPTIONS = [
  ...new Set(
    [...read('src/server/public/index.html').matchAll(/name="option_([^"]+)"/g)].map(
      (m) => m[1],
    ),
  ),
]

const PRESETS: { id: string; format: string; options?: Record<string, any> }[] =
  YAML.parse(read('src/presets.yaml')).presets

const SERVER_FORMATS = [
  'scorm1.2',
  'scorm2004',
  'ims',
  'xapi',
  'web',
  'pdf',
  'epub',
  'docx',
  'json',
  'rdf',
]

/**
 * Known bugs: the case is marked `it.fails` and turns red once fixed; then
 * delete the entry.
 */
const BUGS: Record<string, string> = {
  json: 'the "Full JSON" and "Pretty print" checkboxes (jsonFull, jsonPretty) reach no exporter',
}

describe('toOptions', () => {
  it('finds the form fields and CLI flags it is checked against', () => {
    expect(UI_OPTIONS.length).toBeGreaterThan(15)
    expect(CLI_FLAGS.has('scorm-masteryScore')).toBe(true)
  })

  for (const format of SERVER_FORMATS) {
    const title = `${format}: every form field maps to a known CLI flag or is dropped`
    ;(BUGS[format] ? it.fails : it)(BUGS[format] ? `${title} (bug: ${BUGS[format]})` : title, () => {
      const all = Object.fromEntries(UI_OPTIONS.map((name) => [name, 'true']))
      const unknown = Object.keys(toOptions(format, {}, all)).filter(
        (flag) => !CLI_FLAGS.has(flag),
      )

      expect(unknown).toEqual([])
    })
  }

  for (const preset of PRESETS) {
    it(`preset ${preset.id}: every option maps to a known CLI flag`, () => {
      // Every preset also lists responsiveVoice, translateWithGoogle,
      // debugging and removeBase, which no CLI flag takes; all are false and
      // therefore dropped. Setting one to true would be silently ignored.
      const unknown = Object.keys(toOptions(preset.format, preset.options)).filter(
        (flag) => !CLI_FLAGS.has(flag),
      )

      expect(unknown).toEqual([])
    })
  }

  it('keeps only the options of the chosen format', () => {
    const form = {
      masteryScore: '80',
      scormIframe: 'true',
      webZip: 'true',
      'xapi-zip': 'true',
      'pdf-format': 'A4',
      imsIndexeddb: 'true',
    }

    expect(toOptions('scorm1.2', {}, form)).toEqual({
      'scorm-masteryScore': '80',
      'scorm-iframe': true,
    })
    expect(toOptions('scorm2004', {}, form)).toEqual({
      'scorm-masteryScore': '80',
      'scorm-iframe': true,
    })
    expect(toOptions('web', {}, form)).toEqual({ 'web-zip': true })
    expect(toOptions('xapi', {}, form)).toEqual({ 'xapi-zip': true })
    expect(toOptions('pdf', {}, form)).toEqual({ 'pdf-format': 'A4' })
    expect(toOptions('ims', {}, form)).toEqual({ 'ims-indexeddb': true })
  })

  it('lets user options override the preset', () => {
    expect(
      toOptions(
        'scorm1.2',
        { scormIframe: true, scormEmbed: false, typicalDuration: 'PT0H5M0S' },
        { scormIframe: 'false', scormEmbed: 'true' },
      ),
    ).toEqual({ 'scorm-embed': true, 'scorm-typicalDuration': 'PT0H5M0S' })
  })

  it('drops false, empty and null values and the format key', () => {
    expect(
      toOptions('pdf', {
        format: 'pdf',
        'pdf-landscape': false,
        'pdf-scale': '',
        'pdf-width': null,
        'pdf-printBackground': 'false',
      }),
    ).toEqual({})
  })

  it('shares the lia- options between the LMS formats only', () => {
    for (const format of ['scorm1.2', 'scorm2004', 'ims', 'xapi']) {
      expect(toOptions(format, {}, { liaSubfolder: 'true' })).toEqual({
        'lia-subfolder': true,
      })
    }
    expect(toOptions('web', {}, { liaSubfolder: 'true' })).toEqual({})
  })
})

describe('toCliArguments', () => {
  it('renders true as a bare flag and everything else as flag + value', () => {
    expect(
      toCliArguments({ 'scorm-iframe': true, 'scorm-masteryScore': 80, 'pdf-format': 'A4' }),
    ).toEqual(['--scorm-iframe', '--scorm-masteryScore', '80', '--pdf-format', 'A4'])
  })

  it('renders nothing for no options', () => {
    expect(toCliArguments({})).toEqual([])
  })
})
