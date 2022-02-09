// @ts-ignore
import { Elm } from '../LiaScript/src/elm/Worker.elm'

import { web } from './export/web'
import { scorm1_2 } from './export/scorm12'

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
      case 'fulljson':
      case 'fulljson2': {
        fs.writeFile(argument.output + '.json', string, function (err) {
          if (err) console.error(err)
        })
        break
      }
      case 'scorm1.2': {
        scorm1_2(argument, JSON.parse(string))
        break
      }
      case 'web': {
        web(argument, JSON.parse(string))
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
      argument.format == 'scorm1.2' || argument.format == 'web'
        ? 'fullJson2'
        : argument.format

    const data = fs.readFileSync(argument.input, 'utf8')

    app.ports.input.send([format, data])
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
    '         scorm1.2, json, fullJson, fullJson2, web (default is json)'
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
  }

  argument.format = argument.format.toLowerCase()

  if (!argument.path) {
    argument.path = path.dirname(argument.input)
    argument.readme = path.basename(argument.input)
  }

  return argument
}
