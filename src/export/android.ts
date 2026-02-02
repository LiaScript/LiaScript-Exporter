import * as helper from './helper'

import * as COLOR from '../colorize'
const path = require('path')
const fs = require('fs-extra')
const { exec } = require('child_process')

export function help() {
  console.log('')
  console.log(COLOR.heading('Android settings:'), '\n')

  COLOR.info(
    'Android export generates a native Android application (.apk) from your LiaScript course using Capacitor. This requires the Android SDK to be installed on your system.\n',
  )

  console.log('\nLearn more:')
  console.log('- Capacitor:   https://capacitorjs.com/')
  console.log('- Android SDK: https://developer.android.com/studio')
  console.log('')

  COLOR.command(
    null,
    '--android-sdk',
    '             Specify sdk.dir which is required for building.',
  )
  COLOR.command(
    null,
    '--android-appName',
    '         Name of the App (Main-title is used as default).',
  )
  COLOR.command(
    null,
    '--android-appId',
    '           Required to identify your App reverse url such as io.github.liascript',
  )
  COLOR.command(
    null,
    '--android-icon',
    '            Optional icon with 1024x1024 px',
  )
  COLOR.command(
    null,
    '--android-iconBackgroundColor',
    '  Optional background color for the icon',
  )
  COLOR.command(
    null,
    '--android-iconBackgroundColorDark',
    '  Optional background color for the icon in dark mode',
  )
  COLOR.command(
    null,
    '--android-release',
    '         Create release build (requires signing setup)',
  )

  COLOR.command(
    null,
    '--android-preview',
    '         Open course in Android-Studio',
  )
}

export interface AndroidExportArguments {
  input: string
  readme: string
  output: string
  format: string
  path: string
  key?: string
  'android-sdk'?: string
  'android-appId'?: string
  'android-appName'?: string
  'android-icon'?: string
  'android-iconBackgroundColor'?: string
  'android-iconBackgroundColorDark'?: string
  'android-preview'?: boolean
  'android-release'?: boolean
}

export const format = 'android'

export async function exporter(argument: AndroidExportArguments, json: any) {
  // make temp folder
  let tmp = await helper.tmpDir()
  const dirname = helper.dirname()

  // copy assets to temp/dist
  await fs.copy(
    path.join(dirname, './assets/capacitor'),
    path.join(tmp, './www'),
  )

  await fs.copy(path.join(dirname, './assets/common'), path.join(tmp, './www'))

  // copy logo and splash
  await fs.copy(path.join(dirname, './resources'), path.join(tmp, './assets'))

  if (argument['android-preview']) {
    // create a link, this way, the app can be updated interactively
    await fs.symlink(
      path.resolve(argument.path),
      path.join(tmp, './www/res'),
      'dir',
    )
  } else {
    // copy base path or readme-directory into temp
    await fs.copy(path.resolve(argument.path), path.join(tmp, './www/res'), {
      filter: helper.filterHidden(argument.path),
    })
  }

  await helper.writeFile(
    path.join(tmp, 'package.json'),
    `{
    "scripts": {
      "build": "npx cap sync android"
    },
    "dependencies": {
      "@capacitor/cli": "^8.0.0",
      "@capacitor-community/text-to-speech": "git+https://github.com/capacitor-community/text-to-speech.git#v8.0.0",
      "@capacitor/android": "^8.0.0",
      "@capacitor/assets": "^3.0.5",
      "@capacitor/core": "^8.0.0"
    },
    "devDependencies": {
      "typescript": "^5.7.3"
    },
    "engines": {
      "node": ">= 12"
    }
  }`,
  )

  await helper.writeFile(
    path.join(tmp, 'capacitor.config.ts'),
    `import { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: "${argument['android-appId']}",
  appName: "${argument['android-appName'] || json.lia.str_title}",
  webDir: 'www',
  server: { androidScheme: 'http' },
  plugins: {
    SystemBars: {
      insetsHandling: 'css',
      style: 'light',
      overlaysWebView: true,
      backgroundColor: '#00000000',
    },
  },
}

export default config`,
  )

  let index = fs.readFileSync(path.join(tmp, 'www/index.html'), 'utf8')

  index = helper.inject(
    `<script> if (!window.LIA) { window.LIA = {} } window.LIA.defaultCourseURL = "./res/${path.basename(
      argument.readme,
    )}"</script>`,
    index,
    '<body>',
  )

  try {
    await helper.writeFile(path.join(tmp, 'www/index.html'), index)
  } catch (e) {
    console.warn(e)
    return
  }

  execute(
    [
      'npm i',
      'npx cap add android',
      'npx cap sync',
      `npx @capacitor/assets generate --iconBackgroundColor '${argument['android-iconBackgroundColor'] || '#eeeeee'}' --iconBackgroundColorDark '${argument['android-iconBackgroundColorDark'] || '#222222'}'`,
    ],
    tmp,
    async function () {
      await sdk(tmp, argument['android-sdk'])

      if (argument['android-preview']) {
        execute(
          ['npx cap open android'],
          tmp,

          () => {
            console.log('ready')
          },
        )
      } else if (argument['android-release']) {
        execute(
          ['./gradlew assembleRelease'],
          path.join(tmp, 'android'),
          function () {
            console.warn('DONE')
            fs.copy(
              path.join(
                tmp,
                'android/app/build/outputs/apk/release/app-release.apk',
              ),
              argument.output + '.apk',
            )
          },
        )
      } else {
        execute(
          ['./gradlew assembleDebug'],
          path.join(tmp, 'android'),
          function () {
            console.warn('DONE')
            fs.copy(
              path.join(
                tmp,
                'android/app/build/outputs/apk/debug/app-debug.apk',
              ),
              argument.output + '.apk',
            )
          },
        )
      }
    },
  )
}

async function sdk(tmpPath: string, uri?: string) {
  const androidPath = path.join(tmpPath, 'android')

  // Always create gradle.properties with Java home
  try {
    const javaHome =
      process.env.JAVA_HOME || '/usr/lib/jvm/java-21-openjdk-amd64'
    await helper.writeFile(
      path.join(androidPath, 'gradle.properties'),
      `# Project-wide Gradle settings.
org.gradle.java.home=${javaHome}
org.gradle.jvmargs=-Xmx1536m
android.useAndroidX=true`,
    )
  } catch (e) {
    console.warn('Warning: Could not write gradle.properties:', e)
  }

  // Create local.properties if SDK path is provided
  if (uri) {
    try {
      await helper.writeFile(
        path.join(androidPath, 'local.properties'),
        `sdk.dir=${uri}`,
      )
    } catch (e) {
      console.warn('Warning: Could not write local.properties:', e)
    }
  }
}

function execute(cmds: string[], cwd: string, callback: () => void) {
  const cmd = cmds.shift()

  if (cmd) {
    console.log('exec:', cmd)
    exec(
      cmd,
      { cwd: cwd },
      async (error: Error | null, stdout: string, stderr: string) => {
        if (error) {
          console.warn(`error: ${error.message}`)
        }
        if (stderr) {
          console.warn(`stderr: ${stderr}`)
        }
        console.log(`stdout: ${stdout}`)

        execute(cmds, cwd, callback)
      },
    )
  } else {
    callback()
  }
}
