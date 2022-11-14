import * as helper from './helper'

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
        console.warn('group')
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
  },
  json
) {
  // make temp folder

  console.warn('Exporter', json)

  let cards = ''

  for (let i = 0; i < json.collection.length; i++) {
    let course = json.collection[i]

    if (course.collection) {
      console.warn('todo')

      let subCards = ''

      for (let j = 0; j < course.collection.length; j++) {
        subCards +=
          "<div class='col-sm-6 col-md-4 col-lg-3'>" +
          toCard(course.collection[j]) +
          '</div>'
      }

      cards += `
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    ${course.title}
                </div>
                <div class="card-body">
                    <p class="card-text">${course.comment}</p>
                    <div style="display: flex; scroll-snap-type: x mandatory; overflow-x: auto; overflow-y: hidden; padding-bottom: 10px">
                        ${subCards}
                    </div>
                </div>
            </div>
        </div>`
    } else if (course.html) {
      cards += "<div class='col-12'>" + course.html + '</div>'
    } else {
      cards += "<div class='col'>" + toCard(course) + '</div>'
      console.warn(course)
    }

    const background = json.logo
      ? `style="background-size: cover; background-image: url('${json.logo}'); background-position: center center; background-repeat: no-repeat;"`
      : ''

    const html = `<!DOCTYPE html>
<html>
<head>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">
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
                    <p>
                        <a href="#" class="btn btn-primary my-2">Main call to action</a>
                    </p>
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

  function toCard(course: any) {
    let tags
    try {
      tags = course.data.definition.macro.tags
        .split(',')
        .map((e: string) => e.trim())
    } catch (e) {
      tags = []
    }

    return card(
      course.data.readme,
      course.title || course.data.str_title,
      course.comment || course.data.comment,
      course.tags || tags,
      course.logo || course.data.definition.logo
    )
  }
}

function card(
  url: string,
  title: string,
  comment: string,
  tags: string[],
  img_url?: string
) {
  let image = ''

  if (img_url) {
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

  return `<div class="card shadow-sm m-1" style="height: 100%">
    ${image}
    <div class="card-body">
        <a href="https://liascript.github.io/course/?${url}" target="_blank" class="link-dark stretched-link">
            <h5 class="card-title">${title}</h5>
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
