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

    // special cases for IMS
    'ims-indexeddb'?: boolean
  },
  json: any
) {
  // make temp folder
  let tmp = await helper.tmpDir()

  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp
  await fs.copy(
    path.join(
      __dirname,
      argument['ims-indexeddb'] ? './assets/indexeddb' : './assets/web'
    ),
    tmpPath
  )

  let index = fs.readFileSync(path.join(tmpPath, 'index.html'), 'utf8')

  // change responsive key
  if (argument.key) {
    index = helper.injectResponsivevoice(argument.key, index)
  }

  try {
    await helper.writeFile(path.join(tmpPath, 'index.html'), index)
  } catch (e) {
    console.warn(e)
    return
  }

  await manifest(tmpPath, json.lia)

  // copy base path or readme-directory into temp
  await fs.copy(argument.path, tmpPath, { filter: helper.filterHidden })

  if (argument['ims-indexeddb']) {
    let newReadme = helper.random(20) + '.md'

    let old_ = path.join(tmpPath, argument.readme)
    let new_ = path.join(path.dirname(old_), newReadme)

    argument.readme = argument.readme.replace(
      path.basename(argument.readme),
      newReadme
    )

    await fs.move(old_, new_)
  }

  await helper.iframe(tmpPath, 'start.html', argument.readme)

  helper.zip(tmpPath, argument.output)
}

async function manifest(tmpPath: any, meta: any) {
  let keywords = ''

  try {
    const tags = meta.definition.macro.tags
      .split(',')
      .map((e: string) => e.trim())

    for (let i = 0; i < tags.length; i++) {
      keywords += `<imsmd:langstring xml:lang="${meta.definition.language}">${tags[i]}</imsmd:langstring>`
    }
  } catch (e) {}

  await helper.writeFile(
    path.join(tmpPath, 'imsmanifest.xml'),
    `<manifest xmlns="http://www.imsglobal.org/xsd/imscp_v1p1" xmlns:imsmd="http://www.imsglobal.org/xsd/imsmd_v1p2"
    xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
    xsi:schemaLocation="http://www.imsglobal.org/xsd/imscp_v1p1 http://www.imsglobal.org/xsd/imscp_v1p1.xsd http://www.imsglobal.org/xsd/imsmd_v1p2 http://www.imsglobal.org/xsd/imsmd_v1p2.xsd "
    identifier="Manifest5-CEC3D3-3201-DF8E-8F42-3CEED12F4197" version="IMS CP 1.1.4">
    <metadata>
        <schema>IMS Content</schema>
        <schemaversion>1.1.4</schemaversion>
        <imsmd:lom>
            <imsmd:general>
                <imsmd:title>
                    <imsmd:langstring xml:lang="${meta.definition.language}">${meta.str_title}</imsmd:langstring>
                </imsmd:title>
                <imsmd:language>${meta.definition.language}</imsmd:language>
                <imsmd:description>
                    <imsmd:langstring xml:lang="${meta.definition.language}">${meta.comment}</imsmd:langstring>
                </imsmd:description>
                <imsmd:keyword>
                    ${keywords}
                </imsmd:keyword>
            </imsmd:general>
            <imsmd:lifecycle>
                <imsmd:version>
                    <imsmd:langstring xml:lang="${meta.definition.language}">${meta.definition.version}</imsmd:langstring>
                </imsmd:version>
            </imsmd:lifecycle>
        </imsmd:lom>
    </metadata>
    <organizations default="TOC1">
        <organization identifier="TOC1" structure="hierarchical">
            <title>All Lessons</title>
            <item identifier="ITEM1" identifierref="LIASCRIPT">
                <title>LiaScript - Course</title>
            </item>
        </organization>
    </organizations>
    <resources>
        <resource identifier="LIASCRIPT" type="webcontent" href="start.html">
            <file href="start.html" />
        </resource>
    </resources>
</manifest>`
  )
}
