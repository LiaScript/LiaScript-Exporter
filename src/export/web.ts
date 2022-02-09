import {
  writeFile,
  tmpDir,
  injectResponsivevoice,
  inject,
  filterHidden,
} from './helper'

const path = require('path')
const fs = require('fs-extra')

export async function web(
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
  json: any
) {
  // make temp folder
  let tmp = await tmpDir()

  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp
  await fs.copy(path.join(__dirname, './assets/web'), tmpPath)

  let index = fs.readFileSync(path.join(tmpPath, 'index.html'), 'utf8')

  // change responsive key
  if (argument.key) {
    index = injectResponsivevoice(argument.key, index)
  }

  // add default course
  index = inject(
    `<script>
  if (!window.LIA) {
    window.LIA = {}
  }
  window.LIA.defaultCourse="${path.basename(argument.readme)}"
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
    index = inject(
      `<meta property="og:image" content="${logo}"><meta name="twitter:image" content="${logo}">`,
      index
    )

    console.log('updating logo ...')
  } catch (e) {
    console.warn('could not add image')
  }

  try {
    await writeFile(path.join(tmpPath, 'index.html'), index)
  } catch (e) {
    console.warn(e)
    return
  }

  // copy base path or readme-directory into temp
  await fs.copy(argument.path, tmpPath)
  await fs.move(tmpPath, argument.output, { filter: filterHidden })
}
