import * as helper from './helper'

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

    'web-iframe'?: boolean
    'web-indexeddb'?: boolean
    'web-zip'?: boolean
  },
  json: any
) {
  // make temp folder
  let tmp = await helper.tmpDir()
  const dirname = helper.dirname()

  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp
  await fs.copy(
    path.join(
      dirname,
      argument['web-indexeddb'] ? './assets/indexeddb' : './assets/web'
    ),
    tmpPath
  )

  // copy base path or readme-directory into temp
  await fs.copy(argument.path, tmpPath)

  // rename the readme if necessary
  if (argument['web-indexeddb'] !== undefined) {
    let newReadme =
      (typeof argument['web-indexeddb'] === 'string'
        ? argument['web-indexeddb']
        : helper.random(20)) + '.md'

    let old_ = path.join(tmpPath, argument.readme)
    let new_ = path.join(path.dirname(old_), newReadme)

    argument.readme = argument.readme.replace(
      path.basename(argument.readme),
      newReadme
    )

    await fs.move(old_, new_)
  }

  let index = fs.readFileSync(path.join(tmpPath, 'index.html'), 'utf8')

  // change responsive key
  if (argument.key) {
    index = helper.injectResponsivevoice(argument.key, index)
  }

  // add default course
  index = helper.inject(
    `<script>
  if (!window.LIA) {
    window.LIA = {}
  }
   window.LIA.defaultCourseURL = "${path.basename(argument.readme)}"
  </script>`,
    index
  )

  try {
    index = index.replace(
      '<title>Lia</title>',
      `<title>${json.lia.str_title}</title><meta property="og:title" content="${json.lia.str_title}"> <meta name="twitter:title" content="${json.lia.str_title}">`
    )
    console.log('updating title ...')
  } catch (e) {
    console.warn('could not add title')
  }

  // add description
  try {
    let description = json.lia.definition.macro.comment

    index = index.replace(
      '<meta name="description" content="LiaScript is a service for running free and interactive online courses, build with its own Markup-language. So check out the following course ;-)">',
      `<meta name="description" content="${description}"><meta property="og:description" content="${description}"><meta name="twitter:description" content="${description}">`
    )

    console.log('updating description ...')
  } catch (e) {
    console.warn('could not add description')
  }

  try {
    let logo = json.lia.definition.logo
    index = helper.inject(
      `<meta property="og:image" content="${logo}"><meta name="twitter:image" content="${logo}">`,
      index
    )

    console.log('updating logo ...')
  } catch (e) {
    console.warn('could not add image')
  }

  try {
    if (argument['web-iframe']) {
      await helper.writeFile(path.join(tmpPath, 'start.html'), index)
      await helper.iframe(
        tmpPath,
        'index.html',
        argument.readme,
        argument.style,
        'start.html'
      )
    } else {
      await helper.writeFile(path.join(tmpPath, 'index.html'), index)
    }
  } catch (e) {
    console.warn(e)
    return
  }

  if (argument['web-zip']) {
    helper.zip(tmpPath, argument.output)
  } else {
    await fs.move(tmpPath, argument.output, { filter: helper.filterHidden })
  }
}
