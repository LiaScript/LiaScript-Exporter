'use strict'

import fetch from 'node-fetch'
import * as temp from 'temp'
import * as fs from 'fs-extra'
import * as path from 'path'
const archiver = require('archiver')
const beautify = require('simply-beautiful')

// Constants
const TEMP_DIR_PREFIX = 'lia'
const DIST_DIR_RELATIVE_PATH = '../../dist'
const ZIP_COMPRESSION_LEVEL = 9
const RANDOM_STRING_LENGTH = 16
const RANDOM_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const BEAUTIFY_OPTIONS = {
  indent_size: 4,
  space_before_conditional: true,
  jslint_happy: true,
  max_char: 0,
}

/**
 * Creates a temporary directory with a unique name.
 * @returns Promise that resolves to the path of the created temporary directory
 */
export function tmpDir(): Promise<string> {
  return new Promise((resolve, reject) => {
    temp.mkdir(TEMP_DIR_PREFIX, function (err: Error | null, tmpPath: string) {
      if (err) reject(err)
      else resolve(tmpPath)
    })
  })
}

/**
 * Returns the absolute path to the distribution directory.
 * @returns The path to the dist directory
 */
export function dirname(): string {
  return path.join(__dirname, DIST_DIR_RELATIVE_PATH)
}

/**
 * Delays execution for a specified number of milliseconds.
 * @param ms - Number of milliseconds to sleep
 * @returns Promise that resolves after the specified delay
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Writes content to a file.
 * @param filename - Path to the file to write
 * @param content - Content to write to the file
 * @returns Promise that resolves when the file is written
 */
export function writeFile(filename: string, content: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filename, content, function (err: Error | null) {
      if (err) reject(err)
      else resolve('ok')
    })
  })
}

/**
 * Creates a filter function to exclude hidden folders and node_modules during copy operations.
 * @param sourceDir - The source directory being copied
 * @returns A filter function that returns false for hidden folders and node_modules
 */
export function filterHidden(
  sourceDir: string
): (src: string, dest: string) => boolean {
  return function (src: string, dest: string): boolean {
    // Get the relative path of the source folder being copied
    const relPath = path.relative(path.resolve(sourceDir), src)

    // Split the relative path into its components
    const components = relPath.split(path.sep)

    // Check each component for hidden folders
    for (const component of components) {
      // Check if the component starts with a dot (i.e., hidden folder)
      if (component.startsWith('.')) {
        return false // Exclude the folder from the copy
      }

      // Check if the current folder being copied is the "node_modules" folder
      if (component === 'node_modules') {
        return false // Exclude the folder from the copy
      }
    }

    return true // Include the folder in the copy
  }
}

/**
 * Injects ResponsiveVoice script tag into an HTML string.
 * @param key - ResponsiveVoice API key
 * @param into - HTML content to inject the script into
 * @returns Modified HTML content with the ResponsiveVoice script
 */
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
export function inject(
  element: string,
  into: string,
  head: boolean = false
): string {
  return head
    ? into.replace('<head>', '<head>' + element)
    : into.replace('</head>', element + '</head>')
}

/**
 * Checks if a string is a valid URL (http, https, or file protocol).
 * @param uri - The string to check
 * @returns True if the string is a URL, false otherwise
 */
export function isURL(uri: string): boolean {
  return (
    uri.startsWith('http://') ||
    uri.startsWith('https://') ||
    uri.startsWith('file://')
  )
}

/**
 * Creates an HTML iframe wrapper file for embedding LiaScript content.
 * @param tmpPath - Path to the temporary directory
 * @param filename - Name of the file to create
 * @param readme - Path to the README file
 * @param jsonLD - JSON-LD metadata to inject
 * @param style - Optional custom CSS styles for the iframe
 * @param index - Optional custom index.html filename
 * @returns Promise that resolves when the file is written
 */
export async function iframe(
  tmpPath: string,
  filename: string,
  readme: string,
  jsonLD: string,
  style?: string,
  index?: string
): Promise<string> {
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

  return 'ok'
}

/**
 * Creates a ZIP archive from a directory.
 * @param dir - Directory to archive
 * @param filename - Base filename for the ZIP archive (without .zip extension)
 * @returns Promise that resolves when the archive is finalized
 */
export async function zip(dir: string, filename: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(
      path.dirname(filename) + '/' + path.basename(filename + '.zip')
    )

    const archive = archiver('zip', {
      zlib: { level: ZIP_COMPRESSION_LEVEL }, // Sets the compression level.
    })

    // listen for all archive data to be written
    // 'close' event is fired only when a file descriptor is involved
    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes')
      console.log(
        'archiver has been finalized and the output file descriptor has closed.'
      )
      resolve()
    })

    // This event is fired when the data source is drained no matter what was the data source.
    // It is not part of this library but rather from the NodeJS Stream API.
    // @see: https://nodejs.org/api/stream.html#stream_event_end
    output.on('end', function () {
      console.log('Data has been drained')
    })

    // good practice to catch warnings (ie stat failures and other non-blocking errors)
    archive.on('warning', function (err: any) {
      if (err.code === 'ENOENT') {
        console.warn('Archive warning:', err)
      } else {
        reject(err)
      }
    })

    // good practice to catch this error explicitly
    archive.on('error', function (err: Error) {
      reject(err)
    })

    // pipe archive data to the file
    archive.pipe(output)

    archive.directory(dir, false)
    archive.finalize()
  })
}

/**
 * Generates a random alphanumeric string.
 * Note: Uses Math.random() - not cryptographically secure.
 * @param length - Length of the random string to generate (default: 16)
 * @returns Random alphanumeric string
 */
export function random(length: number = RANDOM_STRING_LENGTH): string {
  // Pick characters randomly
  let str = ''
  for (let i = 0; i < length; i++) {
    str += RANDOM_CHARS.charAt(Math.floor(Math.random() * RANDOM_CHARS.length))
  }

  return str
}

/**
 * Parses a raw GitHub URL and extracts repository information.
 * Supports URLs in format: raw.githubusercontent.com/org/repo/branch/path or raw.githubusercontent.com/org/repo/refs/heads/branch/path
 * @param raw_url - Raw GitHub URL to parse
 * @returns Object with repository information or null if URL doesn't match
 */
export function getRepository(raw_url: string): {
  url: string
  branch: string
  path: string
  cmd: string
} | null {
  const match = raw_url.match(
    /raw\.githubusercontent\.com\/([^\/]+)\/([^\/]+)\/(?:refs\/heads\/)?([^\/]+)\/(.*)/i
  )

  if (match?.length === 5) {
    const [_, organization, repository, branch, filePath] = match

    const url = `https://github.com/${organization}/${repository}`

    return {
      url,
      branch,
      path: filePath,
      cmd: `git clone --branch ${branch} ${url} tmp`,
    }
  }

  return null
}

/**
 * Checks if a LICENSE file exists at the given base URL.
 * @param baseURL - Base URL to check for LICENSE file
 * @returns Promise that resolves to true if LICENSE exists, false otherwise
 */
export async function checkLicense(baseURL: string): Promise<boolean> {
  const url = new URL('LICENSE', baseURL).href

  return await checkFileExists(url)
}

/**
 * Extracts the base URL by removing the last path segment.
 * @param url - URL to extract base from
 * @returns Base URL without the last path segment
 */
export function baseURL(url: string): string {
  const pathSegments = url.split('/')
  pathSegments.pop()
  return pathSegments.join('/')
}

/**
 * Checks if a file exists at the given URL using a HEAD request.
 * @param fileUrl - URL of the file to check
 * @returns Promise that resolves to true if file exists (200 status), false otherwise
 */
async function checkFileExists(fileUrl: string): Promise<boolean> {
  try {
    const response = await fetch(fileUrl, { method: 'HEAD' })
    return response.status === 200
  } catch (error) {
    console.warn(`Error checking if file exists: ${error}`)
    return false
  }
}

/**
 * Prettifies HTML content using beautification options.
 * @param html - HTML string to prettify
 * @returns Prettified HTML string
 */
export function prettify(html: string): string {
  return beautify.html(html, BEAUTIFY_OPTIONS)
}
