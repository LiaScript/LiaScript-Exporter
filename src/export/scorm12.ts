import { writeFile, tmpDir, filterHidden } from './helper'

const scormPackager = require('@liascript/simple-scorm-packager')
const path = require('path')
const fs = require('fs-extra')

export async function scorm1_2(argv, json) {
  // input
  let readme = argv.i || argv.input
  let output = argv.o || argv.output || 'output'
  let path_ = argv.p || argv.path

  if (!path_) {
    path_ = path.dirname(readme)
    readme = path.basename(readme)
  }

  console.warn('WWWWWWWWWWWWWWWWWWWWWWWWW', readme, path_)

  // make temp folder
  let tmp = await tmpDir()

  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp
  await fs.copy(path.join(__dirname, './assets/scorm1.2'), tmpPath)

  await writeFile(
    path.join(tmpPath, 'config.js'),
    'window.config_ = ' + JSON.stringify(json) + ';'
  )

  let index = fs.readFileSync(path.join(tmpPath, 'index.html'), 'utf8')

  // change responsive key
  /*let key = argv.k || argv.key
  if (key) {
    index = index.replace(
      'https://code.responsivevoice.org/responsivevoice.js',
      'https://code.responsivevoice.org/responsivevoice.js?key=' + key
    )
  }*/

  index = index.replace('</head>', '<script src="config.js"></script></head>')

  try {
    await writeFile(path.join(tmpPath, 'index.html'), index)
  } catch (e) {
    console.warn(e)
    return
  }

  // copy base path or readme-directory into temp
  await fs.copy(path_, tmpPath, { filter: filterHidden })

  let config = {
    version: '1.2',
    organization: argv.organization || 'LiaScript',
    title: json.lia.str_title,
    language: json.lia.definition.language,
    masteryScore: argv.masteryScore || 0,
    startingPage: 'index.html',
    startingParameters: readme,
    source: path.join(tmp, 'pro'),
    package: {
      version: json.lia.definition.version,
      zip: true,
      name: path.basename(output),
      author: json.lia.definition.author,
      outputFolder: path.dirname(output),
      description: json.lia.comment,
      //keywords: ['scorm', 'test', 'course'],
      typicalDuration: argv.typicalDuration || 'PT0H5M0S',
      //rights: `©${new Date().getFullYear()} My Amazing Company. All right reserved.`,
      vcard: {
        author: json.lia.definition.author,
        org: argv.organization || 'LiaScript',
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
