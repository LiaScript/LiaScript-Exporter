import * as helper from './helper'
import * as RDF from './rdf'
import * as COLOR from '../colorize'

const scormPackager = require('@liascript/simple-scorm-packager')
const path = require('path')
const fs = require('fs-extra')

export function help() {
  console.log('')
  console.log(COLOR.heading('SCORM settings:'), '\n')

  COLOR.info(
    'SCORM (Sharable Content Object Reference Model) 1.2 & 2004 are standards for e-learning content that can be imported into LMS platforms like Moodle, Blackboard, and others.'
  )

  console.log('\nLearn more: https://scorm.com/scorm-explained/\n')

  console.log(
    'Known SCORM configurations per LMS:\n  https://www.npmjs.com/package/@liascript/exporter#scorm-examples\n'
  )

  https: COLOR.command(
    null,
    '--scorm-organization',
    '      set the organization title'
  )
  COLOR.command(
    null,
    '--scorm-masteryScore',
    '      set the scorm masteryScore (a value between 0 -- 100), default is 0'
  )
  COLOR.command(
    null,
    '--scorm-typicalDuration',
    '   set the scorm duration, default is PT0H5M0S'
  )
  COLOR.command(
    null,
    '--scorm-iframe',
    '            use an iframe, when a SCORM starting parameter is not working'
  )
  COLOR.command(
    null,
    '--scorm-embed',
    '             embed the Markdown into the JS code, use in Moodle 4 to handle restrictions with dynamic loading'
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

    // special cases for SCORM
    'scorm-organization'?: string
    'scorm-masteryScore'?: string
    'scorm-typicalDuration'?: string
    'scorm-iframe'?: boolean
    'scorm-embed'?: string
  },
  json
) {
  // make temp folder
  let tmp = await helper.tmpDir()
  const dirname = helper.dirname()

  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp
  await fs.copy(path.join(dirname, './assets/scorm1.2'), tmpPath)
  // await fs.copy(path.join(dirname, './assets/common'), tmpPath)

  let index = fs.readFileSync(path.join(tmpPath, 'index.html'), 'utf8')

  // change responsive key
  if (argument.key) {
    index = helper.injectResponsivevoice(argument.key, index)
  }

  index = helper.inject('<script src="config.js"></script>', index)
  await helper.writeFile(
    path.join(tmpPath, 'config.js'),
    'window.config_ = ' +
      JSON.stringify({
        task: json.task,
        quiz: json.quiz,
        survey: json.survey,
      }) +
      ';'
  )

  const jsonLD = await RDF.script(argument, json)

  if (argument['scorm-iframe']) {
    await helper.iframe(
      tmpPath,
      'start.html',
      argument.readme,
      jsonLD,
      argument.style
    )
  }

  if (argument['scorm-embed']) {
    index = helper.inject('<script src="course.js"></script>', index, true)
    await helper.writeFile(
      path.join(tmpPath, 'course.js'),
      'window["liascript_course"] = ' + JSON.stringify(argument['scorm-embed'])
    )
  }

  try {
    index = helper.inject(jsonLD, index)
    await helper.writeFile(path.join(tmpPath, 'index.html'), index)
  } catch (e) {
    console.warn(e)
    return
  }

  // copy base path or readme-directory into temp
  await fs.copy(argument.path, tmpPath, {
    filter: helper.filterHidden(argument.path),
  })

  let config = {
    version: '1.2',
    organization: argument['scorm-organization'] || 'LiaScript',
    title: json.lia.str_title,
    language: json.lia.definition.language,
    masteryScore: argument['scorm-masteryScore'] || 0,
    startingPage: argument['scorm-iframe'] ? 'start.html' : 'index.html',
    startingParameters:
      argument['scorm-iframe'] || argument['embed']
        ? undefined
        : argument.readme,
    source: path.join(tmp, 'pro'),
    package: {
      version: json.lia.definition.version,
      zip: true,
      appendTimeToOutput: false,
      name: path.basename(argument.output),
      author: json.lia.definition.author,
      outputFolder: path.dirname(argument.output),
      filename: path.basename(argument.output + '.zip'),
      description: json.lia.comment,
      //keywords: ['scorm', 'test', 'course'],
      typicalDuration: argument['scorm-typicalDuration'] || 'PT0H5M0S',
      //rights: `©${new Date().getFullYear()} My Amazing Company. All right reserved.`,
      vcard: {
        author: json.lia.definition.author,
        org: argument['scorm-organization'] || 'LiaScript',
        //tel: '(000) 000-0000',
        //address: 'my address',
        mail: json.lia.definition.email,
        //url: 'https://mydomain.com'
      },
    },
  }

  await scormPackager(config)
}
