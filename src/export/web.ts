import * as helper from './helper'
import * as RDF from './rdf'
import * as path from 'path'
import * as fs from 'fs-extra'

// Constants
const HTML_FILE = 'index.html'
const START_HTML_FILE = 'start.html'
const DEFAULT_TITLE_TAG = '<title>Lia</title>'
const DEFAULT_DESCRIPTION_META =
  '<meta name="description" content="LiaScript is a service for running free and interactive online courses, build with its own Markup-language. So check out the following course ;-)">'
const TEMP_FOLDER_NAME = 'pro'

// Type definitions
export interface WebExportArguments {
  input: string
  readme: string
  output: string
  format: string
  path: string
  key?: string
  style?: string
  'web-iframe'?: boolean
  'web-indexeddb'?: boolean | string
  'web-zip'?: boolean
  'rdf-format'?: string
  'rdf-preview'?: string
  'rdf-url'?: string
  'rdf-type'?: string
  'rdf-template'?: string
  'rdf-license'?: string
  'rdf-educationalLevel'?: string
}

interface LiaDefinition {
  macro?: {
    comment?: string
  }
  logo?: string
}

interface LiaJson {
  lia: {
    str_title: string
    definition: LiaDefinition
  }
}

interface ExportError {
  step: string
  error: Error | unknown
  critical: boolean
}

export const format = 'web'

/**
 * Exports a LiaScript course as a web application
 * @param argument - Export configuration parameters
 * @param json - Parsed LiaScript JSON data
 * @throws {Error} If critical operations fail
 */
export async function exporter(
  argument: WebExportArguments,
  json: LiaJson
): Promise<void> {
  const errors: ExportError[] = []
  let tempPath: string | null = null

  try {
    // make temp folder
    const tmp = (await helper.tmpDir()) as string
    const dirname = helper.dirname()
    tempPath = path.join(tmp, TEMP_FOLDER_NAME)

    // Copy assets to temp
    await copyAssets(dirname, tempPath, argument['web-indexeddb'])

    // Copy base path or readme-directory into temp
    await fs.copy(argument.path, tempPath)

    // Rename the readme if necessary and update argument
    const readmePath = await handleReadmeRename(
      tempPath,
      argument.readme,
      argument['web-indexeddb']
    )

    // Read and process index.html
    let indexContent = await fs.readFile(path.join(tempPath, HTML_FILE), 'utf8')

    // Inject ResponsiveVoice key if provided
    if (argument.key) {
      indexContent = helper.injectResponsivevoice(argument.key, indexContent)
    }

    // Add default course URL
    indexContent = injectDefaultCourse(indexContent, readmePath)

    // Update metadata (title, description, logo)
    indexContent = updateMetadata(indexContent, json, errors)

    // Generate RDF metadata
    const jsonLD = await RDF.script(argument, json)

    // Write final output
    await writeOutput(
      tempPath,
      indexContent,
      readmePath,
      jsonLD,
      argument,
      errors
    )

    // Move or zip the output
    await finalizeOutput(tempPath, argument)

    // Report any non-critical errors
    if (errors.length > 0) {
      console.warn(`Export completed with ${errors.length} warning(s):`)
      errors.forEach((err) => {
        console.warn(`  - ${err.step}: ${err.error}`)
      })
    }
  } catch (error) {
    // Clean up temp directory on critical error
    if (tempPath) {
      try {
        await fs.remove(tempPath)
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary directory:', cleanupError)
      }
    }
    throw new Error(
      `Web export failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    )
  }
}

/**
 * Copy required assets to the temporary directory
 */
async function copyAssets(
  dirname: string,
  tmpPath: string,
  useIndexedDB?: boolean | string
): Promise<void> {
  const assetsDir = useIndexedDB ? './assets/indexeddb' : './assets/web'

  await fs.copy(path.join(dirname, assetsDir), tmpPath)
  await fs.copy(path.join(dirname, './assets/common'), tmpPath)
}

/**
 * Handle readme file renaming for IndexedDB mode
 * @returns The final readme path (relative or renamed)
 */
async function handleReadmeRename(
  tmpPath: string,
  readmePath: string,
  webIndexedDB?: boolean | string
): Promise<string> {
  if (webIndexedDB === undefined) {
    return readmePath
  }

  const newReadmeName =
    (typeof webIndexedDB === 'string' ? webIndexedDB : helper.random(20)) +
    '.md'

  const oldPath = path.join(tmpPath, readmePath)
  const newPath = path.join(path.dirname(oldPath), newReadmeName)

  await fs.move(oldPath, newPath)

  // Return the updated readme path (replace basename)
  return readmePath.replace(path.basename(readmePath), newReadmeName)
}

/**
 * Inject default course URL into index.html
 */
function injectDefaultCourse(indexContent: string, readmePath: string): string {
  const script = `<script>
  if (!window.LIA) {
    window.LIA = {}
  }
   window.LIA.defaultCourseURL = "${path.basename(readmePath)}"
  </script>`

  return helper.inject(script, indexContent)
}

/**
 * Update HTML metadata (title, description, logo)
 */
function updateMetadata(
  indexContent: string,
  json: LiaJson,
  errors: ExportError[]
): string {
  let updatedContent = indexContent

  // Update title
  try {
    const title = json.lia?.str_title
    if (title) {
      updatedContent = updatedContent.replace(
        DEFAULT_TITLE_TAG,
        `<title>${title}</title><meta property="og:title" content="${title}"> <meta name="twitter:title" content="${title}">`
      )
      console.log('updating title ...')
    }
  } catch (error) {
    errors.push({ step: 'Update title', error, critical: false })
  }

  // Update description
  try {
    const description = json.lia?.definition?.macro?.comment
    if (description) {
      updatedContent = updatedContent.replace(
        DEFAULT_DESCRIPTION_META,
        `<meta name="description" content="${description}"><meta property="og:description" content="${description}"><meta name="twitter:description" content="${description}">`
      )
      console.log('updating description ...')
    }
  } catch (error) {
    errors.push({ step: 'Update description', error, critical: false })
  }

  // Update logo
  try {
    const logo = json.lia?.definition?.logo
    if (logo) {
      updatedContent = helper.inject(
        `<meta property="og:image" content="${logo}"><meta name="twitter:image" content="${logo}">`,
        updatedContent
      )
      console.log('updating logo ...')
    }
  } catch (error) {
    errors.push({ step: 'Update logo', error, critical: false })
  }

  return updatedContent
}

/**
 * Write the final output (iframe or regular)
 */
async function writeOutput(
  tmpPath: string,
  indexContent: string,
  readmePath: string,
  jsonLD: string,
  argument: WebExportArguments,
  errors: ExportError[]
): Promise<void> {
  try {
    if (argument['web-iframe']) {
      await helper.writeFile(path.join(tmpPath, START_HTML_FILE), indexContent)
      await helper.iframe(
        tmpPath,
        HTML_FILE,
        readmePath,
        jsonLD,
        argument.style,
        START_HTML_FILE
      )
    } else {
      indexContent = helper.inject(jsonLD, indexContent)
      indexContent = helper.prettify(indexContent)

      await helper.writeFile(path.join(tmpPath, HTML_FILE), indexContent)
    }
  } catch (error) {
    errors.push({ step: 'Write output', error, critical: true })
    throw error
  }
}

/**
 * Finalize output by creating zip or moving directory
 */
async function finalizeOutput(
  tmpPath: string,
  argument: WebExportArguments
): Promise<void> {
  if (argument['web-zip']) {
    await helper.zip(tmpPath, argument.output)
  } else {
    // Copy with filter, then remove temp
    await fs.copy(tmpPath, argument.output, {
      filter: helper.filterHidden(argument.path),
    })
    await fs.remove(tmpPath)
  }
}
