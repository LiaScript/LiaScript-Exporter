import * as helper from './helper'

import * as RDF from './rdf'

const scormPackager = require('@liascript/simple-scorm-packager')
const path = require('path')
const fs = require('fs-extra')

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
  },
  json
) {
  // make temp folder
  let tmp = await helper.tmpDir()
  const dirname = helper.dirname()

  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp
  await fs.copy(path.join(dirname, './assets/scorm2004'), tmpPath)

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

  try {
    index = helper.inject(jsonLD, index)
    await helper.writeFile(path.join(tmpPath, 'index.html'), index)
  } catch (e) {
    console.warn(e)
    return
  }

  // copy base path or readme-directory into temp
  await fs.copy(argument.path, tmpPath, { filter: helper.filterHidden })

  let config = {
    version: '2004 4th Edition',
    organization: argument['scorm-organization'] || 'LiaScript',
    title: json.lia.str_title,
    language: json.lia.definition.language,
    masteryScore: argument['scorm-masteryScore'] || 0,
    startingPage: argument['scorm-iframe'] ? 'start.html' : 'index.html',
    startingParameters: argument['scorm-iframe'] ? undefined : argument.readme,
    source: path.join(tmp, 'pro'),
    package: {
      version: json.lia.definition.version,
      appendTimeToOutput: false,
      date: '',
      filename: path.basename(argument.output + '.zip'),
      zip: true,
      name: path.basename(argument.output),
      author: json.lia.definition.author,
      outputFolder: path.dirname(argument.output),
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

  scormPackager(config, function (msg) {
    console.log(msg)
    process.exit(0)
  })
}
