import * as helper from './helper'
import * as PDF from './pdf'
import * as IMS from './ims'
import * as SCORM12 from './scorm12'
import * as SCORM2004 from './scorm2004'
import * as ANDROID from './android'
import * as RDF from './rdf'

const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

var Categories: Set<string> = new Set([])

export function getNext(collection: any): string | null {
  if (collection['collection']) {
    collection = collection['collection']
  }

  if (collection['url'] && collection['data'] === undefined) {
    return collection['url']
  } else {
    for (let i = 0; i < collection.length; i++) {
      let course = collection[i]

      if (course.collection) {
        let url = getNext(course)

        if (url) {
          return url
        }
      } else if (course.url && course.data === undefined) {
        return course.url
      }
    }
  }
  return null
}

export function storeNext(collection: any, data: any) {
  if (collection['collection']) {
    collection = collection['collection']
  }

  for (let i = 0; i < collection.length; i++) {
    if (collection[i].collection) {
      for (let j = 0; j < collection[i].collection.length; j++) {
        if (
          collection[i].collection[j].url &&
          collection[i].collection[j].data === undefined
        ) {
          collection[i].collection[j].data = data
          return
        }
      }
    } else if (collection[i].url && collection[i].data === undefined) {
      collection[i].data = data
      return
    }
  }

  return
}

export function help() {
  console.log('\nProject settings:')
  console.log('')
  console.log(
    '--project-no-meta          Disable the generation of meta information for OpenGraph and Twitter-cards.'
  )
  console.log('--project-no-rdf           Disable the generation of json-ld.')
  console.log(
    '--project-no-categories    Disable the filter for categories/tags.'
  )
  console.log(
    '--project-category-blur    Enable this and the categories will be blurred instead of deleted.'
  )
  console.log(
    '--project-generate-scrom12 SCORM12 and pass additional scrom settings.'
  )
  console.log(
    '--project-generate-scrom2004 SCORM2004 and pass additional scrom settings.'
  )
  console.log(
    '--project-generate-ims     IMS resources with additional config settings.'
  )
  console.log(
    '--project-generate-pdf     PDFs are automatically generated and added to every card.'
  )
  console.log(
    '--project-generate-cache   Only generate new files, if they do not exist.'
  )
}

export async function exporter(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string
    style?: string

    // special project settings
    'project-no-meta'?: boolean
    'project-no-categories'?: boolean
    'project-category-blur'?: boolean
    'project-generate-pdf'?: boolean
    'project-generate-cache'?: boolean
  },
  json
) {
  // make temp folder

  let cards = ''
  const output = argument.output
  const itemList: any[] = []

  for (let i = 0; i < json.collection.length; i++) {
    let course = json.collection[i]

    if (course.collection) {
      let subCards = ''
      let subItemList: any[] = []

      for (let j = 0; j < course.collection.length; j++) {
        if (course.collection[j].link) {
          subCards += `<div class='col-sm-6 col-md-4 col-lg-3 ${
            course.grid ? 'mb-3' : ''
          }'>
          ${toLinkCard(argument, course.collection[j], true)}
          </div>`
        } else {
          let { html, json } = await toCard(
            argument,
            course.collection[j],
            true
          )
          subCards += `<div class='col-sm-6 col-md-4 col-lg-3 ${
            course.grid ? 'mb-3' : ''
          }'>
          ${html}
          </div>`

          subItemList.push(json)
        }
      }

      const itemListElement = {
        '@type': 'ItemList',
        itemListElement: subItemList,
      }

      if (course.title) {
        itemListElement['name'] = course.title
      }
      if (course.comment) {
        itemListElement['description'] = course.comment
      }

      itemList.push(itemListElement)

      cards += `
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    ${course.title}
                </div>
                <div class="card-body">
                    <p class="card-text">${course.comment}</p>
                    <div ${
                      course.grid
                        ? 'class="row"'
                        : 'style="display: flex; scroll-snap-type: x mandatory; overflow-x: auto; overflow-y: hidden; padding-bottom: 10px"'
                    }>
                        ${subCards}
                    </div>
                </div>
            </div>
        </div>`
    } else if (course.html) {
      cards += "<div class='col-12'>" + course.html + '</div>'
    } else if (course.link) {
      cards += "<div class='col'>" + toLinkCard(argument, course) + '</div>'
    } else {
      let { html, json } = await toCard(argument, course)
      cards += "<div class='col'>" + html + '</div>'

      itemList.push(json)
    }
  }

  const background = json.logo
    ? `style="background-size: cover; background-image: url('${json.logo}'); background-position: center center; background-repeat: no-repeat;"`
    : ''

  let options = ''

  if (Categories.size > 0 && !argument['project-no-categories']) {
    const opt = [...Categories].sort()

    for (let i = 0; i < opt.length; i++) {
      options += `<option value="${opt[i]}">${opt[i]}</option>`
    }

    options =
      `<select class="form-select" aria-label="Default select example" onchange="window.blur(this.value)">
          <option value="" selected>All categories</option>` +
      options +
      '</select>'
  }

  const jsonLD = {
    '@context': 'http://schema.org/',
    '@type': 'ItemList',
    itemListElement: removeContext(itemList),
  }

  let title = json.title || 'LiaScript Course Index'

  if (json.title) {
    title = cleanHTML(title).replace(/\s+/g, ' ').trim()
    jsonLD['name'] = title
  }

  if (json.comment) {
    jsonLD['description'] = cleanHTML(json.comment).replace(/\s+/g, ' ').trim()
  }

  const html = `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>

    <script type="application/ld+json">
    ${JSON.stringify(jsonLD, null, 2)}
    </script>
  
    ${
      json.icon
        ? '<link rel="icon" type="image/x-icon" href="' + json.icon + '">'
        : ''
    }

    ${argument['project-no-meta'] ? '' : meta(json)}

    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">

    <script>
        window.blur = function(category) {
            const cards = document.querySelectorAll('div[data-category]')

            for (card of cards) {
                if(card.dataset.category.includes(category)) {
                    ${
                      argument['project-category-blur']
                        ? 'card.style.filter = ""'
                        : 'card.parentNode.style.display = "block"'
                    }
                } else {
                  ${
                    argument['project-category-blur']
                      ? 'card.style.filter = "blur(1px) opacity(35%)"'
                      : 'card.parentNode.style.display = "none"'
                  }
                }
            }
        }
    </script>
</head>
<body>
    
    <main>
        <div class="container-fluid" ${background} >
            <section class="py-5 text-center container">
                <div class="row py-lg-5">
                    <div class="col-lg-6 col-md-8 mx-auto">
                        <h1 class="fw-light">${
                          json.title || 'LiaScript Course Index'
                        }</h1>
                        <p class="lead text-muted">${json.comment || ''}</p>

                        ${options}
                    </div>
                </div>
            </section>
        </div>

        <div class="album py-5 bg-light">
            <div class="container">
                <div class="row row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-xl-3 g-3">
                    ${cards}
                </div>
            </div>
        </div>

    </main>
    

    <footer class="text-muted py-3">
        <div class="container">
            <p class="float-end">
                <a href="#">Back to top</a>
            </p>
            <p>${
              json.footer ||
              '<a href="https://liascript.github.io" target="_blank">LiaScript</a> is a Markdown dialect made for education. For more information checkout out <a href="https://www.youtube.com/channel/UCyiTe2GkW_u05HSdvUblGYg" target="_blank">YouTube-Channel</a> or follow us on <a href="https://twitter.com/LiaScript" target="_blank">Twitter</a>.'
            }</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
</body>
</html> 
`

  helper.writeFile(output + '.html', helper.prettify(helper.prettify(html)))
}

function removeContext(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (key === '@context') {
        delete obj[key]
      } else if (typeof obj[key] === 'object') {
        removeContext(obj[key])
      }
    }
  }
  return obj
}
async function moveFile(oldPath, newPath) {
  // 1. Create the destination directory if it does not exist
  // Set the `recursive` option to `true` to create all the subdirectories
  await fs.mkdir(path.dirname(newPath), { recursive: true })
  // 2. Rename the file (move it to the new directory)
  // Return the promise
  return fs.rename(oldPath, newPath)
}

function cleanHTML(html: string) {
  return html.replace(/<[^>]+>/g, '')
}

function meta(json: any) {
  const title =
    json.meta?.title || cleanHTML(json.title) || 'LiaScript Course Index'

  const description = json.meta?.description || cleanHTML(json.comment)

  const image = json.meta?.image || json.logo

  return `<meta property="og:type" content="website">
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${image}">

  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${image}">
  `
}

function overwrite(check, defaultsTo) {
  return check === null ? null : check || defaultsTo
}

function hash(url: string) {
  const value = url
    .split('')
    .map((v) => v.charCodeAt(0))
    .reduce((a, v) => (a + ((a << 7) + (a << 3))) ^ v)
    .toString(16)

  return value.startsWith('-') ? '0' + value.slice(1) : value
}

function toLinkCard(
  argument: any,
  course: any,
  small: boolean = false
): string {
  if (course.arguments) {
    argument = course.arguments.reduce((a, b) => {
      return { ...a, ...b }
    }, argument)
  }

  let tags = []

  const tagList = course.tags || tags
  for (let i = 0; i < tagList.length; i++) {
    Categories.add(tagList[i].toLowerCase())
  }

  let comment = course.title ? course.comment : course.comment || course.link

  return card(
    small,
    '',
    course.title || '',
    comment || '',
    tagList,
    {},
    course.logo,
    course.link
  )
}

async function toCard(
  argument: any,
  course: any,
  small: boolean = false
): Promise<{ html: string; json: any }> {
  // if other parameters are defined for a specific course
  // then they are treated

  if (course.arguments) {
    argument = course.arguments.reduce((a, b) => {
      return { ...a, ...b }
    }, argument)
  }

  let tags
  try {
    tags = course.data.lia.definition.macro.tags
      .split(',')
      .map((e: string) => e.trim())
  } catch (e) {
    tags = []
  }

  const tagList = course.tags || tags
  for (let i = 0; i < tagList.length; i++) {
    Categories.add(tagList[i].toLowerCase())
  }

  let downloads = {}
  if (argument['project-generate-pdf']) {
    argument.input = course.data.lia.readme
    argument.output = hash(course.data.lia.readme)
    const file = argument.output + '.pdf'

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), 'assets/pdf/' + file))
    ) {
      downloads['pdf'] = 'assets/pdf/' + file
    } else {
      console.log('generate pdf of', argument.input, ' -> ', file)

      await PDF.exporter(argument, {})

      if (fs.existsSync(file)) {
        moveFile(file, 'assets/pdf/' + file)
        downloads['pdf'] = 'assets/pdf/' + file
      }
    }
  }

  let repo
  if (
    argument['project-generate-ims'] ||
    argument['project-generate-scorm12'] ||
    argument['project-generate-scorm2004'] ||
    argument['project-generate-android']
  ) {
    repo = helper.getRepository(course.url)

    if (repo) {
      execSync(repo.cmd)
      argument.input = path.join('tmp', repo.path)
      argument.path = 'tmp'
      argument.readme = path.join('./', repo.path)

      argument.output = hash(course.data.lia.readme)

      execSync('rm -rf tmp/.git')
      execSync('rm -rf tmp/.github')
      execSync('rm -rf tmp/.gitignore')
    }
  }

  // IMS
  if (repo && argument['project-generate-ims']) {
    const file = argument.output + '.zip'
    const asset = 'assets/ims/' + file

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), asset))
    ) {
      downloads['ims'] = asset
    } else {
      await IMS.exporter(argument, course.data)

      if (fs.existsSync(file)) {
        moveFile(file, asset)
        downloads['ims'] = asset
      }
    }
  }

  // SCORM12
  if (repo && argument['project-generate-scorm12']) {
    const file = argument.output + '.zip'
    const asset = 'assets/scorm12/' + file

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), asset))
    ) {
      downloads['scorm12'] = asset
    } else {
      await SCORM12.exporter(argument, course.data)

      if (fs.existsSync(file)) {
        moveFile(file, asset)
        downloads['scorm12'] = asset
      }
    }
  }

  // SCORM2004
  if (repo && argument['project-generate-scorm2004']) {
    const file = argument.output + '.zip'
    const asset = 'assets/scorm2004/' + file

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), asset))
    ) {
      downloads['scorm2004'] = asset
    } else {
      await SCORM2004.exporter(argument, course.data)

      if (fs.existsSync(file)) {
        moveFile(file, asset)
        downloads['scorm2004'] = asset
      }
    }
  }

  // Android
  if (repo && argument['project-generate-android']) {
    const file = argument.output + '.apk'

    const asset = 'assets/android/' + file

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), asset))
    ) {
      downloads['apk'] = asset
    } else {
      await ANDROID.exporter(argument, course.data)

      if (fs.existsSync(file)) {
        moveFile(file, asset)
        downloads['apk'] = asset
      }
    }
  }

  // clean up
  if (repo) {
    execSync('rm -rf tmp')
  }

  argument['rdf-url'] = course.data.lia.readme

  return {
    html: card(
      small,
      course.data.lia.readme,
      overwrite(course.title, course.data.lia.str_title),
      overwrite(course.comment, course.data.lia.comment),
      tagList,
      downloads,
      overwrite(course.logo, course.data.lia.definition.logo)
    ),
    json: await RDF.parse(argument, course.data),
  }
}

function card(
  small: boolean,
  url: string,
  title: string,
  comment: string,
  tags: string[],
  download: {
    pdf?: string
    scorm12?: string
    scorm2004?: string
    ims?: string
    apk?: string
  },
  img_url?: string,
  link?: string
): string {
  let image = ''

  if (img_url) {
    if (!(img_url.startsWith('http:') || img_url.startsWith('https:'))) {
      const fullImageUrl = new URL(img_url, url)

      img_url = fullImageUrl.toString()
    }

    image =
      //`<img src="${img_url}" class="card-img-top" alt="">`
      `<div class="card-img-top" style="background-size: cover; height: 175px; background-image: url('${img_url}'); background-position: center center; background-repeat: no-repeat;"></div>`
  }
  /*
  else {
    image = `<svg class="bd-placeholder-img card-img-top" width="100%" height="175" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: Thumbnail" preserveAspectRatio="xMidYMid slice" focusable="false"><title>Placeholder</title><rect width="100%" height="100%" fill="${stringToColor(
      title
    )}"></rect></svg>`
  }
  */

  let tag_list = ''

  if (tags.length > 0) {
    for (let i = 0; i < tags.length; i++) {
      tag_list += `<span style="display: inline; white-space: break-spaces;" class="badge rounded-pill bg-light text-dark">${tags[i]}</span>`
    }

    tag_list = `<p>${tag_list}</p>`
  }

  if (small && comment) {
    comment = '<small>' + comment + '</small>'
  }

  let footer = ''

  if (Object.keys(download).length > 0) {
    footer = `<div class="card-footer">
  <div class="dropdown">
    <a class="btn btn-secondary btn-sm dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false">
      Download as ...
    </a>
  
    <ul class="dropdown-menu" aria-labelledby="dropdownMenuLink" style="">
      ${
        download.pdf
          ? '<li><a class="dropdown-item btn-sm" target="_blank" href="' +
            download.pdf +
            '">PDF</a></li>'
          : ''
      }
      ${
        download.scorm12
          ? '<li><a class="dropdown-item btn-sm" href="' +
            download.scorm12 +
            '">SCORM 1.2</a></li>'
          : ''
      }
      ${
        download.scorm2004
          ? '<li><a class="dropdown-item btn-sm" href="' +
            download.scorm2004 +
            '">SCORM 2004</a></li>'
          : ''
      }
      ${
        download.ims
          ? '<li><a class="dropdown-item btn-sm" href="' +
            download.ims +
            '">IMS Content Packaging</a></li>'
          : ''
      }
      ${
        download.apk
          ? '<li><a class="dropdown-item btn-sm" href="' +
            download.apk +
            '">Android APK</a></li>'
          : ''
      }
    </ul>
  </div>
  </div>
  `
  }

  return `<div class="card shadow-sm m-1" style="height: 100%" data-category="${tags
    .map((e) => e.toLowerCase())
    .join('|')}">
    ${image}
    <div class="card-body" style="transform: rotate(0);">
        <a href="${link ? '' : 'https://liascript.github.io/course/?'}${
    link || url
  }" target="_blank" class="link-dark stretched-link">
            <h${small ? 6 : 5} class="card-title">${title}</h${small ? 6 : 5}>
        </a>
        <p class="card-text">${comment}</p>
        ${tag_list}
    </div>
    ${footer}
    </div>`
}

function stringToColor(str: string) {
  var hash = 0
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  var color = '#'
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xff
    color += ('00' + value.toString(16)).substr(-2)
  }
  return color
}
