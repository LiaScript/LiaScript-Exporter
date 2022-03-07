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

    'android-sdk'?: string
    'android-appId'?: string
    'android-appName'?: string
  },
  json: any
) {
  // make temp folder
  let tmp = await helper.tmpDir()

  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp/dist
  await fs.copy(
    path.join(__dirname, './assets/capacitor'),
    path.join(tmpPath, './dist')
  )

  // copy base path or readme-directory into temp
  await fs.copy(argument.path, path.join(tmpPath, './dist/'), {
    filter: helper.filterHidden,
  })

  await helper.writeFile(
    path.join(tmpPath, '../capacitor.config.json'),
    `{
      "appId": "${argument['android-appId']}",
      "appName": "${argument['android-appName'] || json.lia.str_title}",
      "bundledWebRuntime": true,
      "webDir": "pro/dist",
      "plugins": {
        "SplashScreen": {
          "launchShowDuration": 0
        }
      }
    }`
  )

  await helper.writeFile(
    path.join(tmpPath, '../package.json'),
    `{
    "scripts": {
      "build": "npx cap add android"
    },
    "dependencies": {
      "@capacitor-community/text-to-speech": "^1.1.2",
      "@capacitor/android": "^3.4.1",
      "@capacitor/cli": "^3.4.3"
    },
    "engines": {
      "node": ">= 12"
    }
  }`
  )

  let index = fs.readFileSync(path.join(tmpPath, 'dist/index.html'), 'utf8')

  index = helper.inject(
    `<script> if (!window.LIA) { window.LIA = {} } window.LIA.defaultCourseURL = "./${path.basename(
      argument.readme
    )}"</script>`,
    index
  )

  try {
    await helper.writeFile(path.join(tmpPath, 'dist/index.html'), index)
  } catch (e) {
    console.warn(e)
    return
  }

  execute(
    `cd ${tmpPath} && cd .. && npm i && npx cap add android`,
    async function () {
      await sdk(tmpPath, argument['android-sdk'])

      execute(
        `cd ${tmpPath} && cd .. && cd android && ./gradlew assembleDebug`,
        function () {
          console.warn('DONE')
          fs.copy(
            path.join(
              tmpPath,
              '../android/app/build/outputs/apk/debug/app-debug.apk'
            ),
            argument.output + '.apk'
          )
        }
      )
    }
  )
}

async function sdk(tmpPath: string, uri?: string) {
  if (!uri) return

  try {
    helper.writeFile(
      path.join(tmpPath, '../android/local.properties'),
      `sdk.dir=${uri}`
    )
  } catch (e) {
    console.warn(e)
    return
  }
}

function execute(cmd: string, callback) {
  exec(cmd, async (error, stdout, stderr) => {
    if (error) {
      console.log(`error: ${error.message}`)
    }
    if (stderr) {
      console.log(`stderr: ${stderr}`)
    }
    console.log(`stdout: ${stdout}`)

    callback()
  })
}