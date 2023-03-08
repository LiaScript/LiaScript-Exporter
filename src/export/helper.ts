'use strict'

import fetch from 'node-fetch'
const temp = require('temp')
const fs = require('fs-extra')
const path = require('path')
const archiver = require('archiver')
const beautify = require('simply-beautiful')

export function tmpDir() {
  return new Promise((resolve, reject) => {
    temp.mkdir('lia', function (err, tmpPath: string) {
      console.warn(err, tmpPath)
      if (err) reject(err)
      else resolve(tmpPath)
    })
  })
}

export function dirname() {
  return __dirname //path.join(__dirname, 'exporter')
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function writeFile(filename: string, content: string) {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, content, function (err) {
      if (err) reject(err)
      else resolve('ok')
    })
  })
}

export function filterHidden(src: string, dest: string) {
  const pattern = src.match(/(\/|\\)\.[^\\\/]+/g)

  console.warn(src)

  if (pattern === null) return true
  else if (pattern.length == 0) return true

  return false
}

export function injectResponsivevoice(key: string, into: string): string {
  return inject(
    `<script src="https://code.responsivevoice.org/responsivevoice.js?key=${key}"></script>`,
    into
  )
}

/**
 * Inject an arbitrary tag directly to the end of the html-head tag.
 * @param element - new tag to be added
 * @param into - old index.html content
 * @returns - new index.html content
 */
export function inject(element: string, into: string): string {
  return into.replace('</head>', element + '</head>')
}

export function isURL(uri: string) {
  return (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://')
  )
}

export async function iframe(
  tmpPath,
  filename: string,
  readme: string,
  jsonLD: string,
  style?: string,
  index?: string
) {
  await writeFile(
    path.join(tmpPath, filename),
    prettify(`<!DOCTYPE html>
    <html style="height:100%; overflow: hidden">
    <head>
      ${jsonLD}
    </head>
    <body style="height:100%; margin: 0px">
    
    <iframe id="lia-container" src="" style="${
      style || 'border: 0px; width: 100%; height: 100%'
    }"></iframe>
    
    <script>
      let path = window.location.pathname.replace("start.html", "")
      let iframe = document.getElementById("lia-container")

      if (iframe) {          
        const src = path + "${
          index || 'index.html'
        }?" + path + "${readme.replace('./', '')}"
        iframe.src = src 
      }
    </script>

    </body>
    </html> 
    `)
  )
}

export async function zip(dir: string, filename: string) {
  const output = fs.createWriteStream(
    path.dirname(filename) + '/' + path.basename(filename + '.zip')
  )

  const archive = archiver('zip', {
    zlib: { level: 9 }, // Sets the compression level.
  })

  // listen for all archive data to be written
  // 'close' event is fired only when a file descriptor is involved
  output.on('close', function () {
    console.log(archive.pointer() + ' total bytes')
    console.log(
      'archiver has been finalized and the output file descriptor has closed.'
    )
  })

  // This event is fired when the data source is drained no matter what was the data source.
  // It is not part of this library but rather from the NodeJS Stream API.
  // @see: https://nodejs.org/api/stream.html#stream_event_end
  output.on('end', function () {
    console.log('Data has been drained')
  })

  // good practice to catch warnings (ie stat failures and other non-blocking errors)
  archive.on('warning', function (err) {
    if (err.code === 'ENOENT') {
      // log warning
    } else {
      // throw error
      throw err
    }
  })

  // good practice to catch this error explicitly
  archive.on('error', function (err) {
    throw err
  })

  // pipe archive data to the file
  archive.pipe(output)

  archive.directory(dir, false)
  archive.finalize()
}

export function random(length: number = 16) {
  // Declare all characters
  let chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'

  // Pick characters randomly
  let str = ''
  for (let i = 0; i < length; i++) {
    str += chars.charAt(Math.floor(Math.random() * chars.length))
  }

  return str
}

export function getRepository(raw_url: string) {
  const match = raw_url.match(
    /raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/([^\/]+)\/(.*)/i
  )

  if (match?.length === 5) {
    const [_, organization, repository, branch, path] = match

    const url = `https://github.com/${organization}/${repository}`

    return {
      url,
      branch,
      path,
      cmd: `git clone --branch ${branch} ${url} tmp`,
    }
  }

  return null
}

export async function checkLicense(baseURL: string) {
  const url = new URL('LICENSE', baseURL).href

  return await checkFileExists(url)
}

export function baseURL(url: string) {
  const path = url.split('/')
  path.pop()
  return path.join('/')
}

async function checkFileExists(fileUrl: string) {
  try {
    const response = await fetch(fileUrl, { method: 'HEAD' })
    return response.status === 200
  } catch (error) {
    console.warn(`Error checking if file exists: ${error}`)
    return false
  }
}

export function prettify(html: string) {
  return beautify.html(html, {
    indent_size: 4,
    space_before_conditional: true,
    jslint_happy: true,
    max_char: 0,
  })
}
