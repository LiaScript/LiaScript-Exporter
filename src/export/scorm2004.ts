import {
  writeFile,
  tmpDir,
  filterHidden,
  inject,
  injectResponsivevoice,
} from './helper'

const scormPackager = require('@liascript/simple-scorm-packager')
const path = require('path')
const fs = require('fs-extra')

export async function scorm2004(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string

    // special cases for SCORM
    organization?: string
    masteryScore?: string
    typicalDuration?: string
  },
  json
) {
  // make temp folder
  let tmp = await tmpDir()

  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp
  await fs.copy(path.join(__dirname, './assets/scorm2004'), tmpPath)

  let index = fs.readFileSync(path.join(tmpPath, 'index.html'), 'utf8')

  // change responsive key
  if (argument.key) {
    index = injectResponsivevoice(argument.key, index)
  }

  index = inject('<script src="config.js"></script>', index)
  await writeFile(
    path.join(tmpPath, 'config.js'),
    'window.config_ = ' + JSON.stringify(json) + ';'
  )

  try {
    await writeFile(path.join(tmpPath, 'index.html'), index)
  } catch (e) {
    console.warn(e)
    return
  }

  // copy base path or readme-directory into temp
  await fs.copy(argument.path, tmpPath, { filter: filterHidden })

  let config = {
    version: '2004 4th Edition',
    organization: argument.organization || 'LiaScript',
    title: json.lia.str_title,
    language: json.lia.definition.language,
    masteryScore: argument.masteryScore || 0,
    startingPage: 'index.html',
    startingParameters: argument.readme,
    source: path.join(tmp, 'pro'),
    package: {
      version: json.lia.definition.version,
      appendTimeToOutput: false,
      date: '',
      zip: true,
      name: path.basename(argument.output),
      author: json.lia.definition.author,
      outputFolder: path.dirname(argument.output),
      description: json.lia.comment,
      //keywords: ['scorm', 'test', 'course'],
      typicalDuration: argument.typicalDuration || 'PT0H5M0S',
      //rights: `©${new Date().getFullYear()} My Amazing Company. All right reserved.`,
      vcard: {
        author: json.lia.definition.author,
        org: argument.organization || 'LiaScript',
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
