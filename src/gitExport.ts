/**
 * Git export support for the CLI.
 *
 * Clones a git repository into a temp directory, resolves the markdown file to
 * export (either an explicit file or the main markdown found in the repo), and
 * returns the local path together with a cleanup callback. Mirrors the git flow
 * used by the server route in src/server/routes/export.ts.
 */

import { rmSync } from 'fs'
import { mkdir, access } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import { tmpdir } from 'os'

import { cloneGitRepo, findMainMarkdown } from './server/utils/zipExtractor'

export type GitExportOptions = {
  gitUrl: string
  gitBranch?: string
  gitSubdir?: string
  gitFile?: string
}

export type ResolvedGitExport = {
  inputPath: string
  cleanup: () => void
}

export function getGitOptions(argv: any): GitExportOptions | null {
  const gitUrl = argv['git-url']
  if (!gitUrl) {
    return null
  }

  return {
    gitUrl,
    gitBranch: argv['git-branch'],
    gitSubdir: argv['git-subdir'],
    gitFile: argv['git-file'],
  }
}

/**
 * Clones the repository and resolves the markdown file to export.
 * The caller is responsible for invoking the returned cleanup callback.
 */
export async function prepareGitExport(
  options: GitExportOptions,
): Promise<ResolvedGitExport> {
  const cloneDir = join(tmpdir(), 'liaex-git', randomUUID())
  await mkdir(cloneDir, { recursive: true })

  const cleanup = () => {
    try {
      rmSync(cloneDir, { recursive: true, force: true })
    } catch {
      // best-effort cleanup
    }
  }

  try {
    const repoPath = await cloneGitRepo(
      options.gitUrl,
      cloneDir,
      options.gitBranch,
      options.gitSubdir,
    )

    let mainMarkdown: string | null
    if (options.gitFile) {
      const specificFile = join(repoPath, options.gitFile)
      try {
        await access(specificFile)
      } catch {
        throw new Error(
          `Specified file not found in repository: ${options.gitFile}`,
        )
      }
      mainMarkdown = specificFile
    } else {
      mainMarkdown = await findMainMarkdown(repoPath)
      if (!mainMarkdown) {
        throw new Error(
          'No markdown file found in Git repository. Please include a README.md or any .md file.',
        )
      }
    }

    return { inputPath: mainMarkdown, cleanup }
  } catch (error) {
    cleanup()
    throw error
  }
}
