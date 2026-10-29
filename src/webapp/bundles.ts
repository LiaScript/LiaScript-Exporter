'use strict'

/**
 * Which asset bundles a format needs in the browser. Free of Parcel's `url:`
 * imports, so it can be tested under Node; {@link AssetLoader} does the
 * fetching.
 */

/**
 * Bundles each format needs seeded, mirroring the `assets/<name>` directories
 * the exporters read via `fs.assetRoot()`. `ims` ships the `web` payload; `rdf`
 * and the json formats touch no assets at all.
 */
export const REQUIRED: Record<string, string[]> = {
  json: [],
  fulljson: [],
  rdf: [],
  // `pdf` seeds nothing: it renders from loose static assets, not the store.
  pdf: [],
  web: ['web', 'common'],
  ims: ['web', 'common'],
  xapi: ['xapi', 'common'],
  // the runtime and the H5P.LiaScript wrapper around it
  h5p: ['h5p', 'common', 'h5p-library'],
  'scorm1.2': ['scorm1.2', 'common', 'scorm-schemas'],
  scorm2004: ['scorm2004', 'common', 'scorm-schemas'],
}

/**
 * Options that swap a format's runtime payload for a variant: the IndexedDB
 * build for `web`/`ims`, the suspend connectors for SCORM.
 */
const SWAPS: Array<{
  formats: string[]
  /** true if the options ask for the variant */
  when: (options: Record<string, any>, format: string) => boolean
  swap: (bundle: string) => string
}> = [
  {
    formats: ['web', 'ims'],
    // A string is the database key, true asks for a generated one; an unticked
    // checkbox arrives as false
    when: (options, format) => {
      const value = options[`${format}-indexeddb`]
      return value !== undefined && value !== false
    },
    swap: (bundle) => (bundle === 'web' ? 'indexeddb' : bundle),
  },
  {
    formats: ['scorm1.2', 'scorm2004'],
    when: (options) => options['scorm-storage'] === 'suspend',
    swap: (bundle) => (bundle === 'scorm1.2' || bundle === 'scorm2004' ? `${bundle}-suspend` : bundle),
  },
]

/** The bundles `format` needs with `options`, or undefined for a format the browser cannot export. */
export function requiredBundles(format: string, options: Record<string, any> = {}): string[] | undefined {
  const required = REQUIRED[format]
  if (!required) return undefined

  return SWAPS.filter((s) => s.formats.includes(format) && s.when(options, format)).reduce(
    (bundles, s) => bundles.map(s.swap),
    required
  )
}
