import { createReadStream } from 'fs'
import { readdir, stat } from 'fs/promises'
import { join, extname } from 'path'
import unzipper from 'unzipper'

/**
 * Extracts a ZIP file to a target directory
 * @param zipPath Path to the ZIP file
 * @param extractPath Path where to extract the ZIP contents
 */
export async function extractZip(
  zipPath: string,
  extractPath: string,
): Promise<void> {
  return new Promise((resolve, reject) => {
    createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractPath }))
      .on('close', resolve)
      .on('error', reject)
  })
}

/**
 * Recursively finds all markdown files in a directory
 * @param dir Directory to search
 * @param files Array to collect found files (used internally for recursion)
 * @returns Array of markdown file paths
 */
async function findMarkdownFiles(
  dir: string,
  files: string[] = [],
): Promise<string[]> {
  const entries = await readdir(dir)

  for (const entry of entries) {
    const fullPath = join(dir, entry)
    const stats = await stat(fullPath)

    if (stats.isDirectory()) {
      // Skip common non-content directories
      if (
        !entry.startsWith('.') &&
        entry !== 'node_modules' &&
        entry !== 'dist' &&
        entry !== 'build'
      ) {
        await findMarkdownFiles(fullPath, files)
      }
    } else if (stats.isFile() && extname(entry).toLowerCase() === '.md') {
      files.push(fullPath)
    }
  }

  return files
}

/**
 * Finds the main markdown file in a directory
 * Priority:
 * 1. README.md (case insensitive)
 * 2. First markdown file found
 * @param dir Directory to search
 * @returns Path to the main markdown file or null if none found
 */
export async function findMainMarkdown(dir: string): Promise<string | null> {
  const markdownFiles = await findMarkdownFiles(dir)

  if (markdownFiles.length === 0) {
    return null
  }

  // Look for README.md (case insensitive)
  const readmeFile = markdownFiles.find((file) => {
    const filename = file.split('/').pop()?.toLowerCase()
    return filename === 'readme.md'
  })

  if (readmeFile) {
    return readmeFile
  }

  // Return first markdown file found
  return markdownFiles[0]
}

/**
 * Checks if a file is a ZIP file based on its extension
 * @param filename Filename to check
 * @returns true if the file is a ZIP file
 */
export function isZipFile(filename: string): boolean {
  return extname(filename).toLowerCase() === '.zip'
}
