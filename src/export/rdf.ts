import * as helper from './helper'

const jsonld = require('jsonld')
const fs = require('fs-extra')
import fetch from 'node-fetch'
import * as COLOR from '../colorize'

export function help() {
  console.log('')
  console.log(COLOR.heading('RDF settings:'), '\n')

  COLOR.info(
    'RDF (Resource Description Framework) export generates structured metadata for your LiaScript course or your project-yaml in standard linked data formats. This helps with course discovery and enables semantic web applications to understand your content. Available output formats are n-quads and JSON-LD.'
  )

  console.log('\nLearn more:')
  console.log('- RDF:     https://www.w3.org/RDF/')
  console.log('- N-Quads: https://www.w3.org/TR/n-quads/')
  console.log('- JSON-LD: https://json-ld.org/')
  console.log('')

  COLOR.command(
    null,
    '--rdf-format',
    '              Output format n-quads, json-ld (defaults to json-ld).'
  )
  COLOR.command(
    null,
    '--rdf-preview',
    '             Output the result to the console.'
  )
  COLOR.command(
    null,
    '--rdf-url',
    '                 Refer to an external URL when parsing a local project.'
  )
  COLOR.command(
    null,
    '--rdf-type',
    '                Course frm schmema.org is applied as default, overwrite this with EducationalResource, etc.'
  )
  COLOR.command(
    null,
    '--rdf-license',
    '             Add a license-URL, otherwise if url was provided as input, this will check for an existing LICENSE file.'
  )
  COLOR.command(
    null,
    '--rdf-educationalLevel',
    '    Typically beginner, intermediate or advanced, and formal sets of level indicators.'
  )
  COLOR.command(
    null,
    '--rdf-template',
    '            Use a URL or json-file as a template.'
  )
}

export async function exporter(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string
    style?: string

    // special cases for RDF
    'rdf-format'?: string
    'rdf-preview'?: string
    'rdf-url'?: string
    'rdf-type'?: string
    'rdf-template'?: string
    'rdf-license'?: string
    'rdf-educationalLevel'?: string
  },
  json
) {
  let doc = await parse(argument, json)

  if (argument['rdf-format'] === 'n-quads') {
    const nquads = await jsonld.toRDF(doc, { format: 'application/n-quads' })
    if (argument['rdf-preview']) {
      console.log(nquads)
    } else {
      fs.writeFile(argument.output + '.nq', nquads, function (err) {
        if (err) console.error(err)
      })
    }
  } else {
    doc = clean(doc)
    if (argument['rdf-preview']) {
      console.log(JSON.stringify(doc, null, 2))
    } else {
      fs.writeFile(
        argument.output + '.jsonld',
        JSON.stringify(doc, null, 2),
        function (err) {
          if (err) console.error(err)
        }
      )
    }
  }
}

export async function script(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string
    style?: string

    // special cases for RDF
    'rdf-format'?: string
    'rdf-preview'?: string
    'rdf-url'?: string
    'rdf-type'?: string
    'rdf-template'?: string
    'rdf-license'?: string
    'rdf-educationalLevel'?: string
  },
  json
) {
  let doc = await parse(argument, json)
  doc = await jsonld.compact(doc, 'http://schema.org/')
  doc = clean(doc)

  return `<script type="application/ld+json">
    ${JSON.stringify(doc, null, 2)}
  </script>`
}

export async function compact(doc: any) {
  return await jsonld.compact(doc, 'http://schema.org/')
}

export async function parse(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string
    style?: string

    // special cases for RDF
    'rdf-format'?: string
    'rdf-preview'?: string
    'rdf-url'?: string
    'rdf-type'?: string
    'rdf-template'?: string
    'rdf-license'?: string
    'rdf-educationalLevel'?: string
  },
  json
) {
  let doc = {}

  if (argument['rdf-template']) {
    if (helper.isURL(argument['rdf-template'])) {
      const resp = await fetch(argument['rdf-template'], {})
      const data = await resp.json()

      if (data) {
        doc = await jsonld.expand(data)
      } else {
        console.warn('could not load template from:', argument['rdf-template'])
      }
    } else {
      const data = fs.readFileSync(argument['rdf-template'], 'utf8')
      doc = await jsonld.expand(JSON.parse(data))
    }
  }

  doc['http://schema.org/name'] = json.lia.str_title
  doc['http://schema.org/@type'] =
    doc['http://schema.org/@type'] || argument['rdf-type'] || 'Course'

  let baseURL: string | null = null

  // If a Url is defined, this Url is used as the key and to generate
  if (helper.isURL(argument.input) || argument['rdf-url']) {
    doc['http://schema.org/@id'] =
      doc['http://schema.org/@id'] || argument['rdf-url'] || argument.input
    doc['http://schema.org/url'] =
      doc['http://schema.org/url'] ||
      'https://LiaScript.github.io/course/?' +
        (argument['rdf-url'] || argument.input)

    baseURL = helper.baseURL(argument['rdf-url'] || argument.input)
  }

  if (argument['rdf-educationalLevel']) {
    doc['http://schema.org/educationalLevel'] = argument['rdf-educationalLevel']
  }

  doc = baseInformation(doc, json.lia.definition)
  doc = langInformation(doc, json.lia.definition)
  doc = logoInformation(doc, json.lia.definition, baseURL)
  doc = await licenseInformation(doc, argument, baseURL)
  doc = await jsonld.compact(doc, 'http://schema.org')

  return clean(doc)
}

/**
 * Adds the following information, if they exist:
 *
 * - author:
 *   - name
 *   - email
 * - description
 * - keywords
 * - version
 */
function baseInformation(doc: any, definition: any) {
  if (definition?.author || definition?.email) {
    const author = { 'http://schema.org/@type': 'Person' }

    if (definition?.author) {
      author['http://schema.org/name'] = definition?.author
    }

    if (definition?.email) {
      author['http://schema.org/email'] = definition?.email
    }

    doc['http://schema.org/author'] = doc['http://schema.org/author'] || author
  }

  if (definition.macro?.comment) {
    doc['http://schema.org/description'] =
      doc['http://schema.org/description'] || definition.macro?.comment
  }

  if (definition.macro?.tags) {
    if (typeof doc['http://schema.org/keywords'] === 'string') {
      doc['http://schema.org/keywords'] += ', ' + definition.macro.tags
    } else {
      const tags = definition.macro.tags.split(',').map((e: string) => e.trim())

      if (typeof doc['http://schema.org/keywords'] === 'undefined') {
        doc['http://schema.org/keywords'] = tags
      } else {
        doc['http://schema.org/keywords'] =
          doc['http://schema.org/keywords'].concat(tags)
      }
    }
  }

  if (definition?.version) {
    doc['http://schema.org/version'] =
      doc['http://schema.org/version'] || definition?.version
  }

  return doc
}

/**
 * Adds language information:
 *
 * - inLanguage
 * - TODO: Translations
 * @returns
 */
function langInformation(doc: any, definition: any) {
  if (definition?.language) {
    doc['http://schema.org/inLanguage'] =
      doc['http://schema.org/inLanguage'] || definition.language
  }

  return doc
}

/**
 * Adds the image information.
 *
 * - image: from LiaScript logo
 * - TODO: thumbnailUrl: from LiaScript icon
 */
function logoInformation(doc: any, definition: any, baseURL: null | string) {
  if (definition?.logo) {
    let imageUrl: string | null = null

    if (helper.isURL(definition?.logo)) {
      imageUrl = definition?.logo
    } else if (baseURL) {
      imageUrl = new URL(definition?.logo, baseURL).href
    }

    if (imageUrl) {
      doc['http://schema.org/image'] = doc['http://schema.org/image'] || {
        'http://schema.org/@type': 'ImageObject',
        'http://schema.org/url': imageUrl,
      }
    }
  }

  return doc
}

async function licenseInformation(
  doc: any,
  argument: any,
  baseURL: null | string
) {
  let licenseUrl: string | null = null

  if (argument['rdf-license']) {
    licenseUrl = argument['rdf-license']
  } else if (baseURL && (await helper.checkLicense(baseURL))) {
    licenseUrl = new URL(baseURL, 'LICENSE').href
  }

  if (licenseUrl) {
    doc['http://schema.org/license'] =
      doc['http://schema.org/license'] || licenseUrl
  }

  return doc
}

/**
 * For some reason, jsonld puts to all keys with a "Url" a "schema:"
 * to the front. This functions replaces all "schema:.*" by ".*".
 */
function clean(obj: Object) {
  if (!obj || typeof obj !== 'object') {
    return obj
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => clean(item))
  }
  return Object.keys(obj).reduce((acc, key) => {
    const value = obj[key]
    if (key.startsWith('schema:')) {
      acc[key.split(':').pop() || key] = value
    } else {
      acc[key] = clean(value)
    }
    return acc
  }, {})
}
