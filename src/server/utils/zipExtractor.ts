import { createReadStream } from 'fs'
import { readdir, stat, rm } from 'fs/promises'
import { join, extname } from 'path'
import unzipper from 'unzipper'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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

/**
 * Clones a Git repository to a target directory
 * @param gitUrl Git repository URL
 * @param cloneDir Directory where to clone the repository
 * @param branch Optional branch or tag to checkout (defaults to 'main')
 * @param subdir Optional subdirectory within the repo to use as root
 * @returns Path to the cloned directory (including subdir if specified)
 */
export async function cloneGitRepo(
  gitUrl: string,
  cloneDir: string,
  branch?: string,
  subdir?: string,
): Promise<string> {
  try {
    // Build git clone command
    const branchArg = branch ? `--branch ${branch}` : ''
    const cmd = `git clone --depth 1 ${branchArg} "${gitUrl}" "${cloneDir}"`

    console.log(`Cloning git repository: ${cmd}`)
    const { stdout, stderr } = await execAsync(cmd)

    if (stderr && !stderr.includes('Cloning into')) {
      console.warn('Git clone warnings:', stderr)
    }
    if (stdout) {
      console.log('Git clone output:', stdout)
    }

    // If subdirectory specified, return the full path to it
    const finalPath = subdir ? join(cloneDir, subdir) : cloneDir

    // Verify the path exists
    try {
      await stat(finalPath)
    } catch (error) {
      throw new Error(`Subdirectory '${subdir}' not found in cloned repository`)
    }

    return finalPath
  } catch (error: any) {
    console.error('Git clone failed:', error)
    throw new Error(`Failed to clone git repository: ${error.message}`)
  }
}

/**
 * Removes a directory and all its contents
 * @param dir Directory to remove
 */
export async function removeDirectory(dir: string): Promise<void> {
  try {
    await rm(dir, { recursive: true, force: true })
  } catch (error) {
    console.warn(`Failed to remove directory ${dir}:`, error)
  }
}
