// @ts-ignore
import { Elm } from '../LiaScript/src/elm/Worker.elm'

import { web } from './export/web'
import { scorm1_2 } from './export/scorm12'

global.XMLHttpRequest = require('xhr2')

const fs = require('fs-extra')
const argv = require('minimist')(process.argv.slice(2))

//console.warn(argv);

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

if (argv.v || argv.version) {
  console.log('version: 1.0.51--0.9.51')
} else if (argv.h || argv.help) {
  help()
} else if (argv.i || argv.input) {
  var app = Elm.Worker.init({ flags: { cmd: '' } })

  app.ports.output.subscribe(function (event) {
    let [ok, string] = event
    let output = argv.o || argv.output || 'output'
    let format = argv.f || argv.format || 'json'

    format = format.toLowerCase()

    if (!ok) {
      console.warn(string)
      return
    }

    switch (format) {
      case 'json': {
        fs.writeFile(output + '.json', string, function (err) {
          if (err) console.error(err)
        })
        break
      }
      case 'fulljson': {
        fs.writeFile(output + '.json', string, function (err) {
          if (err) console.error(err)
        })
        break
      }
      case 'fulljson2': {
        fs.writeFile(output + '.json', string, function (err) {
          if (err) console.error(err)
        })
        break
      }
      case 'scorm1.2': {
        scorm1_2(argv, JSON.parse(string))
        break
      }
      case 'web': {
        web(argv, JSON.parse(string))
        break
      }

      default: {
        console.warn('unknown output format', format)
      }
    }
  })

  try {
    const data = fs.readFileSync(argv.i || argv.input, 'utf8')

    let format = argv.f || argv.format || 'json'

    if (format == 'scorm1.2' || format == 'web') {
      format = 'fullJson2'
    }

    app.ports.input.send([format, data])
  } catch (err) {
    console.error(err)
  }
} else {
  console.warn('No input defined')
  help()
}
