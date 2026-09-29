'use strict'

/**
 * Translates the UI's option names into exporter arguments.
 *
 * The UI names its fields in camelCase (`scormIframe`, `masteryScore`) while
 * the exporters expect CLI-style keys (`scorm-iframe`, `scorm-masteryScore`),
 * and each format accepts only its own options. This lived inside
 * [jobQueue.ts](../server/queue/jobQueue.ts), reachable only by spawning the
 * CLI; it is shared here so the browser applies the same rules rather than a
 * second, drifting copy.
 *
 * {@link toOptions} returns the object shape an exporter takes, and
 * {@link toCliArguments} renders that same result as argv for the server.
 */

const SCORM_PREFIXES = [
  'scorm',
  'mastery',
  'typical',
  'responsi',
  'translate',
  'debugging',
  'remove',
  'lia',
]

/** Option prefixes each format accepts; anything else is dropped. */
const FORMAT_PREFIXES: Record<string, string[]> = {
  'scorm1.2': SCORM_PREFIXES,
  scorm2004: SCORM_PREFIXES,
  xapi: ['xapi', 'lia'],
  ims: ['ims', 'lia'],
  web: ['web'],
  pdf: ['pdf'],
  android: ['android'],
  ios: ['ios'],
  epub: ['epub'],
  docx: ['docx'],
  json: ['json'],
  fulljson: ['json'],
  rdf: ['rdf'],
  h5p: ['h5p'],
}

/** Prefixes that identify an option as belonging to some other format. */
const ALL_FORMAT_PREFIXES = [
  'xapi',
  'web',
  'pdf',
  'epub',
  'docx',
  'android',
  'ios',
  'ims',
  'json',
  'rdf',
  'h5p',
  'app',
  'package',
]

/** camelCase to kebab-case, leaving keys that are already kebab-case alone. */
function kebab(key: string): string {
  if (key.includes('-')) {
    return key
  }

  return key.replace(/([A-Z])/g, '-$1').toLowerCase()
}

/** SCORM names that are neither plain kebab-case nor prefixed by the rule. */
const SCORM_NAMES: Record<string, string> = {
  liaSubfolder: 'lia-subfolder',
  masteryScore: 'scorm-masteryScore',
  typicalDuration: 'scorm-typicalDuration',
  scormOrganization: 'scorm-organization',
  scormIframe: 'scorm-iframe',
  scormEmbed: 'scorm-embed',
  scormAlwaysActive: 'scorm-alwaysActive',
}

const NAME_MAPPERS: Record<string, (key: string) => string> = {
  // 1.2 additionally prefixes everything with `scorm-`, bar the two general
  // options; 2004 takes the special cases only.
  'scorm1.2': (key) => {
    if (SCORM_NAMES[key]) return SCORM_NAMES[key]

    const kebabKey = kebab(key)

    return key.startsWith('scorm') ||
      ['mastery-score', 'typical-duration'].includes(kebabKey)
      ? kebabKey
      : `scorm-${kebabKey}`
  },
  scorm2004: (key) => SCORM_NAMES[key] ?? kebab(key),
}

/** True when `key` is an option this format should receive. */
function acceptedBy(format: string, key: string): boolean {
  const prefixes = FORMAT_PREFIXES[format.toLowerCase()] ?? []

  if (prefixes.length === 0) {
    return true
  }

  const lowerKey = key.toLowerCase()
  const mine = prefixes.some((prefix) => lowerKey.startsWith(prefix))
  const theirs = ALL_FORMAT_PREFIXES.some(
    (prefix) => !prefixes.includes(prefix) && lowerKey.startsWith(prefix),
  )

  return mine && !theirs
}

/**
 * Merges preset and user options and renders them as exporter arguments.
 *
 * User options win over the preset's. `format` is dropped: it selects the
 * exporter rather than being passed to it. Booleans follow CLI semantics —
 * true becomes a present flag, false is omitted entirely — so an exporter
 * checking `argument['scorm-iframe']` behaves the same either way.
 */
export function toOptions(
  format: string,
  presetOptions: Record<string, any> = {},
  userOptions: Record<string, any> = {},
): Record<string, any> {
  const merged: Record<string, any> = { ...presetOptions, ...userOptions }
  delete merged.format
  // Consumed by resolveFormat: it picks the exporter, like `format`.
  delete merged.jsonFull

  const mapper = NAME_MAPPERS[format] ?? kebab
  const out: Record<string, any> = {}

  for (const [key, value] of Object.entries(merged)) {
    if (!acceptedBy(format, key)) {
      continue
    }

    if (value === true || value === 'true') {
      out[mapper(key)] = true
    } else if (value === false || value === 'false') {
      // A false flag is absent, not present-and-false.
    } else if (value !== undefined && value !== null && value !== '') {
      out[mapper(key)] = value
    }
  }

  return out
}

/**
 * The format to export, given the one picked and the user's options: the UI
 * offers "Full JSON" as a checkbox of `json` rather than as its own format.
 */
export function resolveFormat(
  format: string,
  userOptions: Record<string, any> = {},
): string {
  const full = userOptions.jsonFull === true || userOptions.jsonFull === 'true'

  return format === 'json' && full ? 'fulljson' : format
}

/** Renders {@link toOptions} as argv, for callers that spawn the CLI. */
export function toCliArguments(options: Record<string, any>): string[] {
  const args: string[] = []

  for (const [key, value] of Object.entries(options)) {
    if (value === true) {
      args.push(`--${key}`)
    } else {
      args.push(`--${key}`, String(value))
    }
  }

  return args
}
