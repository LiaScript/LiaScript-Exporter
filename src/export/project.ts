import * as helper from './helper'

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
  },
  json
) {
  // make temp folder

  let cards = ''

  for (let i = 0; i < json.collection.length; i++) {
    let course = json.collection[i]

    if (course.collection) {
      let subCards = ''

      for (let j = 0; j < course.collection.length; j++) {
        subCards += `<div class='col-sm-6 col-md-4 col-lg-3 ${
          course.grid ? 'mb-3' : ''
        }'>
          ${toCard(course.collection[j], true)}
          </div>`
      }

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
    } else {
      cards += "<div class='col'>" + toCard(course) + '</div>'
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

  let title = json.title || 'LiaScript Course Index'

  if (json.title) {
    title = title.replace(/<[^>]+>/g, '')
  }

  const html = `<!DOCTYPE html>
<html>
<head>
    <title>${title}</title>

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

  await helper.writeFile(argument.output + '.html', html)
}

function cleanHTML(html: string) {
  return html.replace(/<[^>]+>/g, '')
}

function meta(json: any) {
  const title =
    json.meta.title || cleanHTML(json.title) || 'LiaScript Course Index'

  const description = json.meta.description || cleanHTML(json.comment)

  const image = json.meta.image || json.logo

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

function toCard(course: any, small: boolean = false) {
  let tags
  try {
    tags = course.data.definition.macro.tags
      .split(',')
      .map((e: string) => e.trim())
  } catch (e) {
    tags = []
  }

  const tagList = course.tags || tags
  for (let i = 0; i < tagList.length; i++) {
    Categories.add(tagList[i].toLowerCase())
  }

  return card(
    small,
    course.data.readme,
    overwrite(course.title, course.data.str_title),
    overwrite(course.comment, course.data.comment),
    tagList,
    overwrite(course.logo, course.data.definition.logo)
  )
}

function card(
  small: boolean,
  url: string,
  title: string,
  comment: string,
  tags: string[],
  img_url?: string
) {
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
      tag_list += `<span class="badge rounded-pill bg-light text-dark">${tags[i]}</span>`
    }

    tag_list = `<div class="d-flex align-items-center">${tag_list}</div>`
  }

  if (small && comment) {
    comment = '<small>' + comment + '</small>'
  }

  return `<div class="card shadow-sm m-1" style="height: 100%" data-category="${tags
    .map((e) => e.toLowerCase())
    .join('|')}">
    ${image}
    <div class="card-body">
        <a href="https://liascript.github.io/course/?${url}" target="_blank" class="link-dark stretched-link">
            <h${small ? 6 : 5} class="card-title">${title}</h${small ? 6 : 5}>
        </a>
        <p class="card-text">${comment}</p>
        ${tag_list}
    </div>
</div>
`
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
