import * as helper from './helper'
// eslint-disable-next-line @typescript-eslint/no-var-requires
const jsonld = require('jsonld')
import * as fs from 'fs-extra'
import fetch from 'node-fetch'
import * as COLOR from '../colorize'

// Type definitions
export interface RDFArguments {
  input: string
  readme: string
  output: string
  format: string
  path: string
  key?: string
  style?: string
  'rdf-format'?: string
  'rdf-preview'?: string
  'rdf-url'?: string
  'rdf-type'?: string
  'rdf-template'?: string
  'rdf-license'?: string
  'rdf-educationalLevel'?: string
}

interface LiaDefinition {
  author?: string
  email?: string
  language?: string
  logo?: string
  version?: string
  macro?: {
    comment?: string
    tags?: string
  }
}

interface SchemaDoc {
  [key: string]: any
}

// Schema.org constants
const SCHEMA_ORG_CONTEXT = 'http://schema.org/'
const SCHEMA_ORG_PROPS = {
  TYPE: 'http://schema.org/@type',
  ID: 'http://schema.org/@id',
  NAME: 'http://schema.org/name',
  URL: 'http://schema.org/url',
  AUTHOR: 'http://schema.org/author',
  EMAIL: 'http://schema.org/email',
  DESCRIPTION: 'http://schema.org/description',
  KEYWORDS: 'http://schema.org/keywords',
  VERSION: 'http://schema.org/version',
  IN_LANGUAGE: 'http://schema.org/inLanguage',
  IMAGE: 'http://schema.org/image',
  LICENSE: 'http://schema.org/license',
  EDUCATIONAL_LEVEL: 'http://schema.org/educationalLevel',
} as const

const SCHEMA_TYPES = {
  PERSON: 'Person',
  IMAGE_OBJECT: 'ImageObject',
  COURSE: 'Course',
} as const

const LIASCRIPT_COURSE_URL = 'https://LiaScript.github.io/course/?'

/**
 * Displays help information for RDF export options.
 * Shows available command-line flags and their descriptions for configuring
 * RDF/JSON-LD metadata export from LiaScript courses.
 */
export function help() {
  console.log('')
  console.log(COLOR.heading('RDF settings:'), '\n')

  COLOR.info(
    'RDF (Resource Description Framework) export generates structured metadata for your LiaScript course or your project-yaml in standard linked data formats. This helps with course discovery and enables semantic web applications to understand your content. Available output formats are n-quads and JSON-LD.',
  )

  console.log('\nLearn more:')
  console.log('- RDF:     https://www.w3.org/RDF/')
  console.log('- N-Quads: https://www.w3.org/TR/n-quads/')
  console.log('- JSON-LD: https://json-ld.org/')
  console.log('')

  COLOR.command(
    null,
    '--rdf-format',
    '              Output format n-quads, json-ld (defaults to json-ld).',
  )
  COLOR.command(
    null,
    '--rdf-preview',
    '             Output the result to the console.',
  )
  COLOR.command(
    null,
    '--rdf-url',
    '                 Refer to an external URL when parsing a local project.',
  )
  COLOR.command(
    null,
    '--rdf-type',
    '                Course from schema.org is applied as default, overwrite this with EducationalResource, etc.',
  )
  COLOR.command(
    null,
    '--rdf-license',
    '             Add a license-URL, otherwise if url was provided as input, this will check for an existing LICENSE file.',
  )
  COLOR.command(
    null,
    '--rdf-educationalLevel',
    '    Typically beginner, intermediate or advanced, and formal sets of level indicators.',
  )
  COLOR.command(
    null,
    '--rdf-template',
    '            Use a URL or json-file as a template.',
  )
}

export const format = 'rdf'

/**
 * Exports LiaScript course metadata as RDF in either n-quads or JSON-LD format.
 *
 * @param argument Configuration options including output format, preview mode, and RDF settings
 * @param json Parsed LiaScript course data containing metadata and content
 * @throws Error if export fails (template loading, file writing, or JSON-LD processing)
 *
 * @example
 * // Export as JSON-LD
 * await exporter({ input: 'course.md', output: 'course', 'rdf-format': 'json-ld' }, liaJson)
 *
 * @example
 * // Preview n-quads output
 * await exporter({ input: 'course.md', output: 'course', 'rdf-format': 'n-quads', 'rdf-preview': 'true' }, liaJson)
 */
export async function exporter(
  argument: RDFArguments,
  json: any,
): Promise<void> {
  try {
    let doc = await parse(argument, json)

    if (argument['rdf-format'] === 'n-quads') {
      const nquads = await jsonld.toRDF(doc, { format: 'application/n-quads' })
      if (argument['rdf-preview']) {
        console.log(nquads)
      } else {
        await fs.writeFile(argument.output + '.nq', nquads)
      }
    } else {
      doc = clean(doc)
      if (argument['rdf-preview']) {
        console.log(JSON.stringify(doc, null, 2))
      } else {
        await fs.writeFile(
          argument.output + '.jsonld',
          JSON.stringify(doc, null, 2),
        )
      }
    }
  } catch (err) {
    console.error('Error exporting RDF:', err)
    throw err
  }
}

/**
 * Generates an HTML script tag containing JSON-LD structured data.
 * Useful for embedding schema.org metadata directly in HTML pages for SEO.
 *
 * @param argument RDF configuration options
 * @param json Parsed LiaScript course data
 * @returns HTML script tag with embedded JSON-LD
 * @throws Error if parsing or compaction fails
 *
 * @example
 * const scriptTag = await script(argument, liaJson)
 * // Returns: <script type="application/ld+json">{ ... }</script>
 */
export async function script(
  argument: RDFArguments,
  json: LiaJSON,
): Promise<string> {
  try {
    let doc = await parse(argument, json)

    doc = await jsonld.compact(doc, SCHEMA_ORG_CONTEXT)
    doc = clean(doc)

    return `<script type="application/ld+json">
    ${JSON.stringify(doc, null, 2)}
  </script>`
  } catch (error) {
    console.error('Error generating RDF script tag:', error)
    throw error
  }
}

/**
 * Compacts a JSON-LD document using the schema.org context.
 * Reduces verbosity by using the schema.org context to shorten property names.
 *
 * @param doc The expanded JSON-LD document to compact
 * @returns The compacted JSON-LD document
 * @throws Error if compaction fails
 */
export async function compact(doc: SchemaDoc): Promise<SchemaDoc> {
  try {
    return await jsonld.compact(doc, SCHEMA_ORG_CONTEXT)
  } catch (error) {
    console.error('Error compacting JSON-LD document:', error)
    throw error
  }
}

/**
 * Loads and expands a template from a URL or local file.
 * @param templatePath URL or file path to the template
 * @returns Expanded JSON-LD document or empty object if template is not provided
 */
async function loadTemplate(templatePath?: string): Promise<SchemaDoc> {
  if (!templatePath) {
    return {}
  }

  try {
    let data: any

    if (helper.isURL(templatePath)) {
      const resp = await fetch(templatePath, {})
      if (!resp.ok) {
        throw new Error(`Failed to fetch template: ${resp.statusText}`)
      }
      data = await resp.json()
    } else {
      const fileContent = await fs.readFile(templatePath, 'utf8')
      data = JSON.parse(fileContent)
    }

    if (data) {
      return await jsonld.expand(data)
    } else {
      console.warn('could not load template from:', templatePath)
      return {}
    }
  } catch (error) {
    console.error('Error loading template:', error)
    throw error
  }
}

/**
 * Sets the core schema properties (name, type) on the document.
 * @param doc The document to populate
 * @param json LiaScript JSON data
 * @param rdfType Optional type override from arguments
 */
function setCoreProperties(doc: SchemaDoc, json: any, rdfType?: string): void {
  doc[SCHEMA_ORG_PROPS.NAME] = json.lia.str_title
  doc[SCHEMA_ORG_PROPS.TYPE] =
    doc[SCHEMA_ORG_PROPS.TYPE] || rdfType || SCHEMA_TYPES.COURSE
}

/**
 * Resolves the base URL from input or rdf-url argument.
 * @param input The input URL/path
 * @param rdfUrl Optional explicit RDF URL
 * @returns Base URL or null if not a URL
 */
function resolveBaseURL(input: string, rdfUrl?: string): string | null {
  if (helper.isURL(input) || rdfUrl) {
    return helper.baseURL(rdfUrl || input)
  }
  return null
}

/**
 * Sets URL-related properties on the document if a base URL is available.
 * @param doc The document to populate
 * @param input The input URL/path
 * @param rdfUrl Optional explicit RDF URL
 * @returns The resolved base URL or null
 */
function setURLProperties(
  doc: SchemaDoc,
  input: string,
  rdfUrl?: string,
): string | null {
  if (helper.isURL(input) || rdfUrl) {
    const urlValue = rdfUrl || input
    doc[SCHEMA_ORG_PROPS.ID] = doc[SCHEMA_ORG_PROPS.ID] || urlValue
    doc[SCHEMA_ORG_PROPS.URL] =
      doc[SCHEMA_ORG_PROPS.URL] || LIASCRIPT_COURSE_URL + urlValue

    return resolveBaseURL(input, rdfUrl)
  }
  return null
}

/**
 * Enriches the document with all metadata from LiaScript definition.
 * @param doc The document to enrich
 * @param definition LiaScript definition with metadata
 * @param baseURL Base URL for resolving relative URLs
 * @param argument RDF arguments for license and educational level
 */
async function enrichMetadata(
  doc: SchemaDoc,
  definition: LiaDefinition,
  baseURL: string | null,
  argument: RDFArguments,
): Promise<SchemaDoc> {
  doc = baseInformation(doc, definition)
  doc = langInformation(doc, definition)
  doc = logoInformation(doc, definition, baseURL)
  doc = await licenseInformation(doc, argument, baseURL)

  if (argument['rdf-educationalLevel']) {
    doc[SCHEMA_ORG_PROPS.EDUCATIONAL_LEVEL] = argument['rdf-educationalLevel']
  }

  return doc
}

/**
 * Parses LiaScript JSON and generates a schema.org JSON-LD document.
 * This is the main orchestration function that coordinates template loading,
 * property setting, metadata enrichment, and document compaction.
 *
 * @param argument RDF export arguments including URLs, type, and template options
 * @param json LiaScript JSON data containing course title and metadata
 * @returns A compacted and cleaned JSON-LD document ready for export
 * @throws Error if template loading, JSON-LD expansion, or compaction fails
 *
 * @example
 * const rdfDoc = await parse({
 *   input: 'https://example.com/course.md',
 *   'rdf-type': 'Course',
 *   'rdf-educationalLevel': 'beginner'
 * }, liaJson)
 */
export async function parse(
  argument: RDFArguments,
  json: string,
): Promise<SchemaDoc> {
  try {
    // Load template if provided
    let doc = await loadTemplate(argument['rdf-template'])

    // Set core properties
    setCoreProperties(doc, json, argument['rdf-type'])

    // Set URL properties and resolve base URL
    const baseURL = setURLProperties(doc, argument.input, argument['rdf-url'])

    // Enrich with all metadata
    doc = await enrichMetadata(doc, json.lia.definition, baseURL, argument)

    // Compact and clean the document
    doc = await jsonld.compact(doc, SCHEMA_ORG_CONTEXT)
    return clean(doc)
  } catch (error) {
    console.error('Error parsing LiaScript to RDF:', error)
    throw error
  }
}

/**
 * Adds base metadata information to the schema.org document.
 * Extracts and adds the following properties from the LiaScript definition:
 * - author (name and email as schema:Person)
 * - description (from macro comment)
 * - keywords (from macro tags, comma-separated)
 * - version
 *
 * @param doc The schema.org document to populate
 * @param definition LiaScript definition containing metadata
 * @returns The enriched document with base information
 */
function baseInformation(doc: SchemaDoc, definition: LiaDefinition): SchemaDoc {
  if (definition?.author || definition?.email) {
    const author: SchemaDoc = { [SCHEMA_ORG_PROPS.TYPE]: SCHEMA_TYPES.PERSON }

    if (definition?.author) {
      author[SCHEMA_ORG_PROPS.NAME] = definition?.author
    }

    if (definition?.email) {
      author[SCHEMA_ORG_PROPS.EMAIL] = definition?.email
    }

    doc[SCHEMA_ORG_PROPS.AUTHOR] = doc[SCHEMA_ORG_PROPS.AUTHOR] || author
  }

  if (definition.macro?.comment) {
    doc[SCHEMA_ORG_PROPS.DESCRIPTION] =
      doc[SCHEMA_ORG_PROPS.DESCRIPTION] || definition.macro?.comment
  }

  if (definition.macro?.tags) {
    if (typeof doc[SCHEMA_ORG_PROPS.KEYWORDS] === 'string') {
      doc[SCHEMA_ORG_PROPS.KEYWORDS] += ', ' + definition.macro.tags
    } else {
      const tags = definition.macro.tags.split(',').map((e: string) => e.trim())

      if (typeof doc[SCHEMA_ORG_PROPS.KEYWORDS] === 'undefined') {
        doc[SCHEMA_ORG_PROPS.KEYWORDS] = tags
      } else {
        doc[SCHEMA_ORG_PROPS.KEYWORDS] =
          doc[SCHEMA_ORG_PROPS.KEYWORDS].concat(tags)
      }
    }
  }

  if (definition?.version) {
    doc[SCHEMA_ORG_PROPS.VERSION] =
      doc[SCHEMA_ORG_PROPS.VERSION] || definition?.version
  }

  return doc
}

/**
 * Adds language information to the schema.org document.
 * Sets the inLanguage property from the LiaScript definition.
 *
 * @param doc The schema.org document to populate
 * @param definition LiaScript definition containing language metadata
 * @returns The document with language information added
 * @todo Add support for course translations
 */
function langInformation(doc: SchemaDoc, definition: LiaDefinition): SchemaDoc {
  if (definition?.language) {
    doc[SCHEMA_ORG_PROPS.IN_LANGUAGE] =
      doc[SCHEMA_ORG_PROPS.IN_LANGUAGE] || definition.language
  }

  return doc
}

/**
 * Adds image/logo information to the schema.org document.
 * Converts the LiaScript logo to a schema:ImageObject with proper URL resolution.
 * Handles both absolute URLs and relative paths (resolved against baseURL).
 *
 * @param doc The schema.org document to populate
 * @param definition LiaScript definition containing logo path
 * @param baseURL Base URL for resolving relative logo paths, or null if not available
 * @returns The document with image information added
 * @todo Add support for thumbnailUrl from LiaScript icon
 */
function logoInformation(
  doc: SchemaDoc,
  definition: LiaDefinition,
  baseURL: null | string,
): SchemaDoc {
  if (definition?.logo) {
    let imageUrl: string | null = null

    if (helper.isURL(definition?.logo)) {
      imageUrl = definition?.logo
    } else if (baseURL) {
      imageUrl = new URL(definition?.logo, baseURL).href
    }

    if (imageUrl) {
      doc[SCHEMA_ORG_PROPS.IMAGE] = doc[SCHEMA_ORG_PROPS.IMAGE] || {
        [SCHEMA_ORG_PROPS.TYPE]: SCHEMA_TYPES.IMAGE_OBJECT,
        [SCHEMA_ORG_PROPS.URL]: imageUrl,
      }
    }
  }

  return doc
}

/**
 * Adds license information to the schema.org document.
 * Attempts to determine license URL from:
 * 1. Explicit rdf-license argument
 * 2. LICENSE file at the base URL (if it exists)
 *
 * @param doc The schema.org document to populate
 * @param argument RDF arguments containing explicit license URL
 * @param baseURL Base URL for checking LICENSE file existence
 * @returns Promise resolving to the document with license information
 */
async function licenseInformation(
  doc: SchemaDoc,
  argument: RDFArguments,
  baseURL: null | string,
): Promise<SchemaDoc> {
  let licenseUrl: string | null = null

  if (argument['rdf-license']) {
    licenseUrl = argument['rdf-license']
  } else if (baseURL && (await helper.checkLicense(baseURL))) {
    try {
      licenseUrl = new URL('LICENSE', baseURL).href
    } catch (error) {
      console.warn(
        'Could not create a URL for the LICENSE file, using base URL as license URL.',
        baseURL,
      )
    }
  }

  if (licenseUrl) {
    doc[SCHEMA_ORG_PROPS.LICENSE] = doc[SCHEMA_ORG_PROPS.LICENSE] || licenseUrl
  }

  return doc
}

/**
 * Recursively cleans a JSON-LD document by removing 'schema:' prefixes from keys.
 * The jsonld library sometimes adds 'schema:' prefixes to keys ending in 'Url',
 * this function normalizes them by removing the prefix.
 *
 * @param obj The object to clean (can be nested objects or arrays)
 * @returns The cleaned object with 'schema:' prefixes removed from all keys
 *
 * @example
 * // Input: { 'schema:imageUrl': 'http://...', name: 'Course' }
 * // Output: { imageUrl: 'http://...', name: 'Course' }
 */
function clean(obj: any): any {
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map((item: any) => clean(item))
  }
  return Object.keys(obj).reduce(
    (acc: Record<string, any>, key: string) => {
      const value = obj[key]
      if (key.startsWith('schema:')) {
        acc[key.split(':').pop() || key] = value
      } else {
        acc[key] = clean(value)
      }
      return acc
    },
    {} as Record<string, any>,
  )
}
