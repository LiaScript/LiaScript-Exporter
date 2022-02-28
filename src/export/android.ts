import config from '../../capacitor.config'
import * as helper from './helper'

const path = require('path')
const fs = require('fs-extra')
const { exec } = require('child_process')

export async function exporter(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string
  },
  json: any
) {
  // make temp folder
  let tmp = await helper.tmpDir()

  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp
  await fs.copy(path.join(__dirname, '../android'), tmpPath)

  await fs.copy(
    path.join(__dirname, '../node_modules/@capacitor'),
    path.join(tmpPath, '../node_modules/@capacitor')
  )

  let index = fs.readFileSync(
    path.join(tmpPath, 'app/src/main/assets/public/index.html'),
    'utf8'
  )

  /*
  let config = fs.readFileSync(
    path.join(
      tmpPath,
      'app/build/intermediates/incremental/mergeDebugResources/merged.dir/values/values.xml'
    ),
    'utf8'
  )

  config = config.replace('LiaScript', json.lia.str_title)

  await helper.writeFile(
    path.join(
      tmpPath,
      'app/build/intermediates/incremental/mergeDebugResources/merged.dir/values/values.xml'
    ),
    config
  )
  */

  // change responsive key
  if (argument.key) {
    index = helper.injectResponsivevoice(argument.key, index)
  }

  // add default course
  index = helper.inject(
    `<script> if (!window.LIA) { window.LIA = {} } window.LIA.defaultCourseURL = "./${path.basename(
      argument.readme
    )}"</script>`,
    index
  )

  console.log(`<script>
    if (!window.LIA) {
      window.LIA = {}
    }
     window.LIA.defaultCourseURL = "./${path.basename(argument.readme)}"
    </script>`)

  try {
    await helper.writeFile(
      path.join(tmpPath, 'app/src/main/assets/public/index.html'),
      index
    )
  } catch (e) {
    console.warn(e)
    return
  }

  // copy base path or readme-directory into temp
  await fs.copy(
    argument.path,
    path.join(tmpPath, 'app/src/main/assets/public/'),
    { filter: helper.filterHidden }
  )

  console.warn('2222', path.join(tmpPath, 'app/src/main/assets/public/'))

  console.warn('SSSSSSSSSSSSSSSSSSSSSSSSs', tmpPath)

  exec(`cd ${tmpPath} && ./gradlew assembleDebug`, (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
    }
    console.log(`stdout: ${stdout}`)

    fs.copy(
      path.join(tmpPath, 'app/build/outputs/apk/debug/app-debug.apk'),
      argument.output + '.apk'
    )
  })

  console.log(path.join(tmpPath, 'app/build/outputs/apk/debug/app-debug.apk'))
}
