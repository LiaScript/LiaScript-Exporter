import * as helper from './helper'
import type { ExportFS } from '../fs/types'
import { scormAdapter } from '../fs/scorm-adapter'
import * as path from '../fs/path'

import * as RDF from './rdf'

const scormPackager = require('@liascript/simple-scorm-packager')

export interface Scorm2004ExportArguments {
  input: string
  readme: string
  output: string
  format: string
  path: string
  key?: string
  style?: string
  'scorm-organization'?: string
  'scorm-masteryScore'?: string
  'scorm-typicalDuration'?: string
  'scorm-iframe'?: boolean
  'scorm-embed'?: string | boolean
  'scorm-alwaysActive'?: boolean
  'lia-subfolder'?: boolean
  /** Storage backing; supplied by the CLI or the browser host. */
  fs?: ExportFS
  /** Packager schema location; only the browser sets it. See scormAdapter. */
  'scorm-schema-root'?: string
}

export const format = 'scorm2004'

export async function exporter(argument: Scorm2004ExportArguments, json: any) {
  const fs = argument.fs!

  // make temp folder
  let tmp = await fs.tmpDir()
  const dirname = fs.assetRoot()

  let tmpPath = path.join(tmp, 'pro')
  const contentPath = argument['lia-subfolder']
    ? path.join(tmpPath, 'content')
    : tmpPath

  // copy assets to temp (always to root)
  await fs.copy(path.join(dirname, './assets/scorm2004'), tmpPath)
  await fs.copy(path.join(dirname, './assets/common'), tmpPath)

  let index = await fs.readFile(path.join(tmpPath, 'index.html'))

  // change responsive key
  if (argument.key) {
    index = helper.injectResponsivevoice(argument.key, index)
  }

  index = helper.inject('<script src="config.js"></script>', index)

  let conf =
    'window.config_ = ' +
    JSON.stringify({
      task: json.task,
      quiz: json.quiz,
      survey: json.survey,
    }) +
    ';'

  if (argument['scorm-alwaysActive']) {
    conf += '\n\nwindow["ACTIVE"] = true;'

    if (argument['scorm-masteryScore']) {
      conf +=
        '\n\nwindow["MASTERY_SCORE"] =' +
        parseFloat(argument['scorm-masteryScore']) / 100
    }
  }

  await fs.writeFile(path.join(tmpPath, 'config.js'), conf)

  const jsonLD = await RDF.script(argument, json)

  if (argument['scorm-iframe']) {
    await helper.iframe(
      fs,
      tmpPath,
      'start.html',
      argument.readme,
      jsonLD,
      argument.style
    )
  }

  if (argument['scorm-embed']) {
    index = helper.inject('<script src="course.js"></script>', index, true)
    await fs.writeFile(
      path.join(tmpPath, 'course.js'),
      'window["liascript_course"] = ' + JSON.stringify(argument['scorm-embed'])
    )
  }

  index = helper.inject(jsonLD, index)
  await fs.writeFile(path.join(tmpPath, 'index.html'), index)

  // copy user course files into content/ (subfolder mode) or root
  await fs.copy(argument.path, contentPath, {
    filter: helper.filterHidden(argument.path),
  })

  let config = {
    // Storage backing, so the packager writes through the same abstraction
    fs: scormAdapter(fs, argument['scorm-schema-root']),
    version: '2004 4th Edition',
    organization: argument['scorm-organization'] || 'LiaScript',
    title: json.lia.str_title,
    language: json.lia.definition.language,
    masteryScore: argument['scorm-masteryScore'] || 0,
    startingPage: argument['scorm-iframe'] ? 'start.html' : 'index.html',
    startingParameters:
      argument['scorm-iframe'] || argument['scorm-embed']
        ? undefined
        : argument.readme,
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

  await scormPackager(config, function (msg: string) {
    console.log(msg)
  })
}
