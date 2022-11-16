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

global.XMLHttpRequest = require('xhr2')

import YAML from 'yaml'
const path = require('path')
const fs = require('fs-extra')
const argv = require('minimist')(process.argv.slice(2))

// -------------------------------Main Execution-------------------------------
if (argv.v || argv.version) {
  console.log('version: 2.4.5--0.10.22')
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

function run(argument) {
  var app = Elm.Worker.init({ flags: { cmd: '' } })
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
      case 'scorm1.2': {
        SCORM12.exporter(argument, JSON.parse(string))
        break
      }
      case 'scorm2004': {
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
            PROJECT.storeNext(collection, JSON.parse(string).lia)

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
      argument.format == 'project'
        ? 'fulljson'
        : argument.format

    if (argument.format === 'project') {
      const file = fs.readFileSync(argument.input, 'utf8')
      collection = YAML.parse(file)

      if (collection) {
        const next = PROJECT.getNext(collection)
        console.warn('loading:', next)
        app.ports.input.send([format, next])
      }
    } else if (!helper.isURL(argument.input)) {
      const data = fs.readFileSync(argument.input, 'utf8')
      app.ports.input.send([format, data])
    } else if (argument.format === 'pdf') {
      PDF.exporter(argument, {})
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
    '         additional styling to passed to the export, can be used for fixes, such as "height: 100vh; width: 100%; border: 2px;"'
  )
  console.log(
    '-f',
    '--format',
    '         scorm1.2, scorm2004, json, fullJson, web, ims, pdf, android (default is json)'
  )
  console.log('-v', '--version', '        output the current version')

  console.log('\n-k', '--key', '            responsive voice key ')

  console.log('\nSCORM settings:')
  console.log('')
  console.log('--scorm-organization', '      set the organization title')
  console.log(
    '--scorm-masteryScore',
    '      set the scorm masteryScore (a value between 0 -- 100), default is 0'
  )
  console.log(
    '--scorm-typicalDuration',
    '   set the scorm duration, default is PT0H5M0S'
  )

  console.log(
    '--scorm-iframe',
    '            use an iframe, when a SCORM starting parameter is not working'
  )

  console.log('\nIMS settings:')
  console.log('')
  console.log(
    '--ims-indexeddb',
    '           Use IndexedDB to store data persistently'
  )

  console.log('\nWEB settings:')
  console.log('')
  console.log(
    '--web-iframe               Use an iframed version to hide the course URL.'
  )
  console.log(
    '--web-indexeddb            This will allow to store data within the browser using indexeddb, you can optionally pass a unique key (by default one is generated randomly).'
  )
  console.log(
    '--web-zip                  By default the result is not zipped, you can change this with this parameter.'
  )

  console.log('\nAndroid settings:')
  console.log('')
  console.log(
    '--android-sdk              Specify sdk.dir which is required for building.'
  )
  console.log(
    '--android-appName          Name of the App (Main-title is used as default).'
  )
  console.log(
    '--android-appId            Required to identify your App reverse url such as io.github.liascript'
  )
  console.log('--android-icon             Optional icon with 1024x1024 px')
  console.log(
    '--android-splash           Optional splash image with 2732x2732 px'
  )
  console.log(
    '--android-splashDuration   Duration for splash-screen default 0 milliseconds'
  )
  console.log('--android-preview          Open course in Android-Studio')

  console.log('\nPDF settings:\n')
  console.log(
    '--pdf-stylesheet           Inject an local CSS for changing the appearance.'
  )
  console.log(
    '--pdf-theme                LiaScript themes: default, turquoise, blue, red, yellow'
  )
  console.log(
    '--pdf-timeout              Set an additional time horizon to wait until finished.'
  )
  console.log(
    '\nhttps://github.com/puppeteer/puppeteer/blob/main/docs/api.md#pagepdfoptions\n'
  )
  console.log(
    '--pdf-preview              Open preview-browser (default false), print not possible'
  )
  console.log(
    '--pdf-scale                Scale of the webpage rendering. Defaults to 1. Scale amount must be between 0.1 and 2.'
  )
  console.log(
    '--pdf-displayHeaderFooter  Display header and footer. Defaults to false.'
  )
  console.log(
    '--pdf-headerTemplate       HTML template for the print header, inject classes date, title, url, pageNumber, totalPages'
  )

  console.log(
    '--pdf-footerTemplate       HTML template for the print footer. Should use the same format as the headerTemplate'
  )
  console.log(
    '--pdf-printBackground      Print background graphics. Defaults to false'
  )
  console.log(
    '--pdf-landscape            Paper orientation. Defaults to false.'
  )
  console.log(
    '--pdf-pageRanges           Paper ranges to print, e.g., "1-5, 8, 11-13"'
  )
  console.log(
    '--pdf-format               Paper format. If set, takes priority over width or height options. Defaults to a4.'
  )
  console.log(
    '--pdf-width                Paper width, accepts values labeled with units.'
  )
  console.log(
    '--pdf-height               Paper height, accepts values labeled with units.'
  )
  console.log(
    '--pdf-margin-top           Top margin, accepts values labeled with units.'
  )
  console.log(
    '--pdf-margin-right         Right margin, accepts values labeled with units.'
  )
  console.log(
    '--pdf-margin-bottom        Bottom margin, accepts values labeled with units.'
  )
  console.log(
    '--pdf-margin-left          Left margin, accepts values labeled with units. '
  )
  console.log(
    '--pdf-preferCSSPageSize    Give any CSS @page size declared in the page priority over what is declared in width and height or format options.'
  )
  console.log(
    '--pdf-omitBackground       Hides default white background and allows capturing screenshots with transparency. Defaults to true. '
  )

  console.log('\nProject settings:')
  console.log('')
  console.log(
    '--project-no-meta          Disable the generation of meta information for OpenGraph and Twitter-cards.'
  )
  console.log(
    '--project-no-categories    Disable the filter for categories/tags.'
  )
  console.log(
    '--project-category-blur    Enable this and the categories will be blurred instead of deleted.'
  )

  console.log(
    '--project-generate-pdf     PDFs are automatically generated and added to every card.'
  )
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
    'project-no-categories': argv['project-no-categories'],
    'project-category-blur': argv['project-category-blur'],
    'project-generate-pdf': argv['project-generate-pdf'],
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
