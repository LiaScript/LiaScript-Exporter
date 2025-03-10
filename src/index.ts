// @ts-ignore
import { Elm } from '../LiaScript/src/elm/Worker.elm'

import * as WEB from './export/web'
import * as SCORM12 from './export/scorm12'
import * as SCORM2004 from './export/scorm2004'
import * as PDF from './export/pdf'
import * as helper from './export/helper'
import * as IMS from './export/ims'
import * as ANDROID from './export/android'
// import * as IOS from './export/ios'
import * as PROJECT from './export/project'
import * as RDF from './export/rdf'

global.XMLHttpRequest = require('xhr2')

import YAML from 'yaml'
const path = require('path')
const fs = require('fs-extra')
const argv = require('minimist')(process.argv.slice(2))
import fetch from 'node-fetch'

// -------------------------------Main Execution-------------------------------
if (argv.v || argv.version) {
  console.log('version: 2.6.36--0.16.11')
} else if (argv.h || argv.help) {
  help()
} else if (argv.i || argv.input) {
  run(parseArguments())
} else {
  console.warn('No input defined')
  help()
}
// ----------------------------------------------------------------------------

var collection: any

async function run(argument) {
  var app = Elm.Worker.init({ flags: { cmd: '' } })

  var embed = undefined

  app.ports.helper.subscribe(async function ([cmd, param]) {
    switch (cmd) {
      case 'debug':
        console.warn('DEBUG', param)
        break
      case 'file':
        const template = path.resolve(path.dirname(argument.input), param)
        console.warn('loading:', template)
        const data = fs.readFileSync(template, 'utf8')
        app.ports.input.send(['template', param, data])
        break
      default:
        console.warn('unknown command:', cmd, param)
    }
  })

  app.ports.output.subscribe(function (event) {
    let [ok, string] = event

    // the worker did not succeed
    if (!ok) {
      console.warn(string)
      return
    }

    switch (argument.format) {
      case 'json':
      case 'fulljson': {
        fs.writeFile(argument.output + '.json', string, function (err) {
          if (err) console.error(err)
        })
        break
      }
      case 'rdf': {
        RDF.exporter(argument, JSON.parse(string))
        break
      }
      case 'scorm1.2': {
        if (argument['scorm-embed']) {
          argument['scorm-embed'] = embed
        }
        SCORM12.exporter(argument, JSON.parse(string))
        break
      }
      case 'scorm2004': {
        if (argument['scorm-embed']) {
          argument['scorm-embed'] = embed
        }
        SCORM2004.exporter(argument, JSON.parse(string))
        break
      }
      case 'ims': {
        IMS.exporter(argument, JSON.parse(string))
        break
      }
      case 'web': {
        WEB.exporter(argument, JSON.parse(string))
        break
      }
      case 'pdf': {
        PDF.exporter(argument, JSON.parse(string))
        break
      }
      case 'android': {
        ANDROID.exporter(argument, JSON.parse(string))
        break
      }
      case 'project': {
        if (collection) {
          try {
            PROJECT.storeNext(collection, JSON.parse(string))

            const next = PROJECT.getNext(collection)

            if (next) {
              console.warn('loading:', next)
              app.ports.input.send(['fulljson', next])
            } else {
              PROJECT.exporter(argument, collection)
            }
          } catch (e) {
            console.warn('project export error:', e)
          }
        }

        break
      }
      /*
      case 'ios': {
        IOS.exporter(argument, JSON.parse(string))
        break
      }*/
      default: {
        console.warn('unknown output format', argument.format)
      }
    }
  })

  try {
    // the format is changed only locally, the SCORM and web exporters simply
    // require some meta data from the parsed json output
    const format =
      argument.format == 'scorm1.2' ||
      argument.format == 'scorm2004' ||
      argument.format == 'pdf' ||
      argument.format == 'web' ||
      argument.format == 'ims' ||
      argument.format == 'android' ||
      argument.format == 'ios' ||
      argument.format == 'rdf' ||
      argument.format == 'project'
        ? 'fulljson'
        : argument.format

    if (argument.format === 'project') {
      const file = fs.readFileSync(argument.input, 'utf8')
      collection = YAML.parse(file)

      if (collection) {
        const next = PROJECT.getNext(collection)

        if (next === null) {
          PROJECT.exporter(argument, collection)
        } else {
          console.warn('loading:', next)

          app.ports.input.send([format, next])
        }
      }
    } else if (!helper.isURL(argument.input)) {
      const data = fs.readFileSync(argument.input, 'utf8')

      embed = data

      app.ports.input.send([format, data])
    } else if (argument.format === 'pdf') {
      PDF.exporter(argument, {})
    } else if (argument.format === 'rdf') {
      const resp = await fetch(argument.input, {})
      const data = await resp.text()

      if (data) {
        app.ports.input.send([format, data])
      }
    } else {
      console.warn('URLs are not allowed as input')
    }
  } catch (err) {
    console.error(err)
  }
}

function help() {
  console.log('LiaScript-Exporter')
  console.log('')
  console.log('-h', '--help', '           show this help')
  console.log('-i', '--input', '          file to be used as input')
  console.log(
    '-p',
    '--path',
    '           path to be packed, if not set, the path of the input file is used'
  )
  console.log(
    '-o',
    '--output',
    '         output file name (default is output), the ending is define by the format'
  )
  console.log(
    '-s',
    '--style',
    '          additional styling to passed to the export, can be used for fixes, such as "height: 100vh; width: 100%; border: 2px;"'
  )
  console.log(
    '-f',
    '--format',
    '         scorm1.2, scorm2004, json, fullJson, web, ims, pdf, android, linkedData (default is json)'
  )
  console.log('-v', '--version', '        output the current version')

  console.log('\n-k', '--key', '            responsive voice key ')

  SCORM12.help()

  IMS.help()

  ANDROID.help()

  PDF.help()

  PROJECT.help()

  RDF.help()
}

function escapeBackslash(path?: string) {
  if (path) {
    return path.replace(/\\/g, '\\\\')
  }

  return path
}

function parseArguments() {
  const argument = {
    input: argv.i || argv.input,
    readme: argv.i || argv.input,
    output: argv.o || argv.output || 'output',
    format: argv.f || argv.format || 'json',
    path: argv.p || argv.path,
    key: argv.k || argv.key,
    style: argv.s || argv.style,

    // special cases for SCORM
    'scorm-organization': argv['scorm-organization'],
    'scorm-masteryScore': argv['scorm-masteryScore'],
    'scorm-typicalDuration': argv['scorm-typicalDuration'],
    'scorm-iframe': argv['scorm-iframe'],
    'scorm-embed': argv['scorm-embed'],
    'scorm-alwaysActive': argv['scorm-alwaysActive'],

    // special IMS cases
    'ims-indexeddb': argv['ims-indexeddb'],

    // web-cases
    'web-zip': argv['web-zip'],
    'web-indexeddb': argv['web-indexeddb'],
    'web-iframe': argv['web-iframe'],

    // pdf cases
    'pdf-preview': argv['pdf-preview'],
    'pdf-scale': argv['pdf-scale'],
    'pdf-displayHeaderFooter': argv['pdf-displayHeaderFooter'],
    'pdf-headerTemplate': argv['pdf-headerTemplate'],
    'pdf-footerTemplate': argv['pdf-footerTemplate'],
    'pdf-printBackground': argv['pdf-printBackground'],
    'pdf-landscape': argv['pdf-landscape'],
    'pdf-format': argv['pdf-format'] || 'A4',
    'pdf-width': argv['pdf-width'],
    'pdf-height': argv['pdf-height'],
    'pdf-margin-top': argv['pdf-margin-top'],
    'pdf-margin-bottom': argv['pdf-margin-bottom'],
    'pdf-margin-right': argv['pdf-margin-right'],
    'pdf-margin-left': argv['pdf-margin-left'],
    'pdf-preferCSSPageSize': argv['pdf-preferCSSPageSize'],
    'pdf-omitBackground': argv['pdf-omitBackground'],
    'pdf-timeout': argv['pdf-timeout'],

    'pdf-stylesheet': argv['pdf-stylesheet'],
    'pdf-theme': argv['pdf-theme'],

    'android-sdk': escapeBackslash(argv['android-sdk']),
    'android-appId': argv['android-appId'],
    'android-appName': argv['android-appName'],
    'android-icon': escapeBackslash(argv['android-icon']),
    'android-splash': escapeBackslash(argv['android-splash']),
    'android-splashDuration': argv['android-splashDuration'],
    'android-preview': argv['android-preview'],

    // project settings
    'project-no-meta': argv['project-no-meta'],
    'project-no-rdf': argv['project-no-rdf'],
    'project-no-categories': argv['project-no-categories'],
    'project-category-blur': argv['project-category-blur'],
    'project-generate-pdf': argv['project-generate-pdf'],
    'project-generate-ims': argv['project-generate-ims'],
    'project-generate-scorm12': argv['project-generate-scorm12'],
    'project-generate-scorm2004': argv['project-generate-scorm2004'],
    'project-generate-android': argv['project-generate-android'],
    'project-generate-cache': argv['project-generate-cache'],

    // RDF settngs
    'rdf-format': argv['rdf-format'],
    'rdf-preview': argv['rdf-preview'],
    'rdf-url': argv['rdf-url'],
    'rdf-type': argv['rdf-type'],
    'rdf-license': argv['rdf-license'],
    'rdf-educationalLevel': argv['rdf-educationalLevel'],
    'rdf-template': argv['rdf-template'],
  }

  argument.format = argument.format.toLowerCase()

  if (argument.format == 'android') {
    if (!argument['android-sdk']) {
      console.warn('Path to SDK has to be defined, you will have to install:')
      console.warn('https://developer.android.com/studio/')
      process.exit(1)
    }

    if (!argument['android-appId']) {
      console.warn('The appId has to provided to uniquely identify your App.')
      console.warn('This can be the URL of your site in reverse order, eg.:')
      console.warn('io.github.liascript')
      process.exit(1)
    }
  }

  if (!argument.path && !helper.isURL(argument.input)) {
    argument.path = path.dirname(argument.input)
  }

  argument.readme = argument.input.replace(argument.path, '.')

  return argument
}
