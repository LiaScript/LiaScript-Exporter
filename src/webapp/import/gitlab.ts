'use strict'
/**
 * Importing a course from a GitLab repository: gitlab.com, a self-hosted
 * instance, or LiaScript's `gitlab://host/...` form.
 *
 * Git's own HTTP protocol sends no CORS headers, and GitLab answers browser
 * requests for repository archives with 406. The REST API's tree listing and
 * "raw file" endpoints are CORS-open (also on self-hosted instances by
 * default), so the course is listed and downloaded file by file, as LiaScript
 * itself loads GitLab files and as [github.ts](github.ts) does for GitHub.
 */
import { parseGitUrl } from '../../gitUrl'
import { ExportError } from '../errors'
import { findMainMarkdown, isContent, toCourse, type UnpackedZip } from './zip'

/**
 * Fetches a course from a GitLab repository. `branch`, `subdir` and `file`
 * mirror `--git-branch` / `--git-subdir` / `--git-file` and win over the link.
 */
export async function fetchGitLabCourse(
  url: string,
  options: {
    branch?: string
    subdir?: string
    file?: string
    onProgress?: (message: string) => void
  } = {},
): Promise<UnpackedZip> {
  const source = parseGitUrl(url)
  const subdir = (options.subdir || source.subdir || '').replace(/^\/+|\/+$/g, '')
  const file = options.file || source.file
  const { onProgress } = options

  const repo = new URL(
    /^https?:\/\//i.test(source.url) ? source.url : `https://${source.url}`,
  )
  const project = repo.pathname.replace(/^\/+/, '').replace(/\.git$/, '')
  const api = `${repo.origin}/api/v4/projects/${encodeURIComponent(project)}`
  const get = (target: string) => request(target, repo.host, project, onProgress)

  onProgress?.(`Reading ${project} from ${repo.host}`)

  // The raw endpoint needs a ref, and the default branch is not always `main`.
  const branch =
    options.branch ||
    source.branch ||
    (await (await get(api)).json()).default_branch

  const query = new URLSearchParams({
    ref: branch,
    recursive: 'true',
    per_page: '100',
    pagination: 'keyset',
  })
  if (subdir) query.set('path', subdir)

  const paths: string[] = []
  let next: string | undefined = `${api}/repository/tree?${query}`

  while (next) {
    const response = await get(next)
    for (const item of await response.json()) {
      if (item.type === 'blob' && isContent(item.path)) paths.push(item.path)
    }
    next = response.headers.get('Link')?.match(/<([^>]+)>;\s*rel="next"/)?.[1]
  }

  const wanted = file ? (subdir ? `${subdir}/${file}` : file) : undefined

  if (wanted && !paths.includes(wanted)) {
    throw new ExportError(
      'errors.github.noSuchFile',
      '"{file}" was not found in the repository.',
      { file: wanted },
    )
  }

  const main = wanted || findMainMarkdown(paths)

  if (!main) {
    throw new ExportError(
      'errors.github.noMarkdown',
      'No markdown file found in "{where}". A course needs a README.md or another .md file.',
      { where: subdir ? `${project}/${subdir}` : project },
    )
  }

  // Only the course file's directory can be referenced from it, see `toCourse`.
  const root = main.slice(0, main.lastIndexOf('/') + 1)
  const needed = paths.filter((path) => path.startsWith(root))
  const entries: Record<string, Uint8Array> = {}

  // shortcut: no size limit (the tree lists no sizes), add HEAD requests like github.ts checkSize if huge courses take a tab down
  // Sequential, not Promise.all, for the memory reason given in github.ts `download`.
  for (const [index, path] of needed.entries()) {
    onProgress?.(`Downloading ${index + 1} of ${needed.length}: ${path}`)
    const response = await get(
      `${api}/repository/files/${encodeURIComponent(path)}/raw?ref=${encodeURIComponent(branch)}`,
    )
    entries[path] = new Uint8Array(await response.arrayBuffer())
  }

  return toCourse(entries, needed, main)
}

/**
 * One API request, turned into an error a course author can act on. Waits out
 * the rate limit (60 requests a minute on some self-hosted instances), since a
 * course with many images would otherwise always fail there.
 */
async function request(
  target: string,
  host: string,
  project: string,
  onProgress?: (message: string) => void,
): Promise<Response> {
  for (let attempt = 0; ; attempt++) {
    let response: Response
    try {
      response = await fetch(target)
    } catch {
      // Also what a self-hosted instance without CORS headers looks like.
      throw new ExportError(
        'errors.gitlab.unreachable',
        'Could not reach {host}. Check the network connection, or download the course and upload it instead.',
        { host },
      )
    }

    if (response.ok) return response

    if (response.status === 429 && attempt < 3) {
      onProgress?.(`${host} limits requests per minute, waiting a minute`)
      await new Promise((resolve) => setTimeout(resolve, 60_000))
      continue
    }

    if (response.status === 404) {
      throw new ExportError(
        'errors.gitlab.notFound',
        '"{repo}" or its branch was not found on {host}. Please check the address — private repositories cannot be read from the browser.',
        { repo: project, host },
      )
    }

    if (response.status === 429) {
      throw new ExportError(
        'errors.gitlab.rateLimit',
        '{host} limits requests per minute. Try again later.',
        { host },
      )
    }

    throw new ExportError(
      'errors.gitlab.requestFailed',
      'GitLab request failed ({status})',
      { status: response.status },
    )
  }
}
