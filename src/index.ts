// @ts-ignore
import { Elm } from '../LiaScript/src/elm/Worker.elm'

import { web } from './export/web'
import { scorm1_2 } from './export/scorm12'
import { scorm2004 } from './export/scorm2004'
import { pdf } from './export/pdf'
import { isURL } from './export/helper'

global.XMLHttpRequest = require('xhr2')

const path = require('path')
const fs = require('fs-extra')
const argv = require('minimist')(process.argv.slice(2))

// -------------------------------Main Execution-------------------------------
if (argv.v || argv.version) {
  console.log('version: 1.0.51--0.9.51')
} else if (argv.h || argv.help) {
  help()
} else if (argv.i || argv.input) {
  run(parseArguments())
} else {
  console.warn('No input defined')
  help()
}
// ----------------------------------------------------------------------------

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
        scorm1_2(argument, JSON.parse(string))
        break
      }
      case 'scorm2004': {
        scorm2004(argument, JSON.parse(string))
        break
      }
      case 'web': {
        web(argument, JSON.parse(string))
        break
      }
      case 'pdf': {
        pdf(argument, JSON.parse(string))
        break
      }
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
      argument.format == 'web'
        ? 'fulljson'
        : argument.format

    if (!isURL(argument.input)) {
      const data = fs.readFileSync(argument.input, 'utf8')
      app.ports.input.send([format, data])
    } else if (argument.format === 'pdf') {
      pdf(argument, {})
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
    '-f',
    '--format',
    '         scorm1.2, scorm2004, json, fullJson, web, pdf (default is json)'
  )
  console.log('-v', '--version', '        output the current version')

  console.log('\n-k', '--key', '            responsive voice key ')

  console.log('\nSCORM 1.2 settings:')
  console.log('')
  console.log('--organization', '         set the organization title')
  console.log(
    '--masteryScore',
    '         set the scorm masteryScore (a value between 0 -- 100), default is 0'
  )
  console.log(
    '--typicalDuration',
    '      set the scorm duration, default is PT0H5M0S'
  )

  console.log('\nPDF settings:')
  console.log('')
  console.log(
    '--pdfPreview',
    '             open preview-browser (default false)'
  )
  console.log(
    '--pdfTimeout',
    '             set an additional time horizon to wait until finished'
  )
  console.log('--pdfFormat', '              paper format (default a4)')
  console.log(
    '--pdfPrintBackground',
    '     allow backgroung-color (default true)'
  )
  console.log(
    '--pdfDisplayHeaderFooter',
    ' print header and footer (default false)'
  )
}

function parseArguments() {
  const argument = {
    input: argv.i || argv.input,
    readme: argv.i || argv.input,
    output: argv.o || argv.output || 'output',
    format: argv.f || argv.format || 'json',
    path: argv.p || argv.path,
    key: argv.k || argv.key,

    // special cases for SCORM
    organization: argv.organization,
    masteryScore: argv.masteryScore,
    typicalDuration: argv.typicalDuration,

    // pdf cases
    pdfPreview: argv.pdfPreview,
    pdfTimeout: argv.pdfTimeout,
    pdfFormat: argv.pdfFormat,
    pdfPrintBackground: argv.pdfPrintBackground,
    pdfDisplayHeaderFooter: argv.pdfDisplayHeaderFooter,
  }

  argument.format = argument.format.toLowerCase()

  if (!argument.path && !isURL(argument.input)) {
    argument.path = path.dirname(argument.input)
    argument.readme = path.basename(argument.input)
  }

  return argument
}
