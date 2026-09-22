'use strict'

/**
 * Importing a course straight from a GitHub repository.
 *
 * The browser counterpart to the server's `cloneGitRepo`
 * ([zipExtractor](../server/utils/zipExtractor.ts)), which clones with
 * isomorphic-git. Cloning is not an option here: github.com's git-upload-pack
 * endpoint sends no `Access-Control-Allow-Origin`, so a browser clone only works
 * through a third-party CORS proxy — which would mean routing the user's course
 * through someone else's server, against the whole premise of this app.
 *
 * Fetching needs no proxy, because `api.github.com` and
 * `raw.githubusercontent.com` are both CORS-open. The transport is deliberately 
 * `raw.githubusercontent.com` rather than the blob API that 
 * [LiveEditor](../../../LiveEditor/src/ts/GitHubRepo.ts) uses.
 * LiveEditor needs blobs by sha to diff against local edits; a one-shot import
 * does not, and the difference is decisive: blob requests are billed against the
 * 60-per-hour anonymous quota (one *per file*, so 48 of 60 for a single import
 * of `LiaScript/docs`), whereas raw downloads are not billed at all. This module
 * therefore spends exactly one request per export — the tree call.
 */

const API = 'https://api.github.com'
const RAW = 'https://raw.githubusercontent.com'

/**
 * Size ceilings, matching the export service's own upload limit
 * ([server.ts](../server/server.ts) `limits.fileSize`) so neither entry point
 * accepts a course the other would reject. 100 MB is also GitHub's hard blob
 * ceiling, so the per-file cap can never reject a file that could exist anyway.
 */
const MAX_FILE_BYTES = 100 * 1024 * 1024
const MAX_TOTAL_BYTES = 100 * 1024 * 1024

/** Directories that never hold course content, skipped as [zip.ts](zip.ts) does. */
const SKIPPED_DIRECTORIES = ['node_modules', 'dist', 'build']

/** A repository reference, however the user chose to write it. */
export interface RepoRef {
  owner: string
  repo: string
  branch?: string
  path?: string
}

/** A course fetched from a repository, ready for `exportCourse`. */
export interface FetchedCourse {
  markdown: string
  name: string
  files: Record<string, Uint8Array>
}

/** Whether this looks like a GitHub URL rather than some other host. */
export function isGitHubUrl(input: string): boolean {
  const s = (input || '').trim()

  if (!s) return false
  if (/^(https?:\/\/)?(www\.)?(github\.com|raw\.githubusercontent\.com)\//i.test(s)) {
    return true
  }
  if (/^git@github\.com:/i.test(s)) return true

  // "owner/repo" shorthand, which has no host to check.
  return /^[\w.-]+\/[\w.-]+\/?$/.test(s)
}

/**
 * Parses a user-supplied repository reference.
 *
 * Follows LiveEditor's `parseRepoUrl`, which accepts the four forms people
 * actually paste — `owner/repo`, an `https://github.com/...` URL, a
 * `/tree/<branch>/<path>` deep link, and an `git@github.com:` SSH URL. The deep
 * link matters most: it is what the GitHub UI puts on the clipboard when
 * somebody is looking at a course subdirectory, and it carries the branch and
 * subdirectory that would otherwise have to be typed into separate fields.
 */
export function parseRepoUrl(input: string): RepoRef | null {
  let s = (input || '').trim()

  if (!s) return null

  s = s.replace(/^git@github\.com:/i, 'https://github.com/')

  // The scheme is optional throughout: the export service accepts a bare
  // "github.com/owner/repo" and prepends https, so the same input has to mean
  // the same thing here. Without the optional scheme the host is left in place
  // and silently becomes the owner.
  s = s.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
  s = s.replace(/^(https?:\/\/)?(www\.)?raw\.githubusercontent\.com\//i, '')
  s = s.replace(/\.git$/, '')

  // Anything with a scheme or a host left over belongs to another forge: the
  // strips above removed GitHub's, so whatever survives is not GitHub and must
  // not be read as an owner name.
  if (/^[a-z]+:\/\//i.test(s) || /^[^/]*\./.test(s.split('/')[0] || '')) {
    return null
  }

  const parts = s.split('/').filter((part) => part.length > 0)

  if (parts.length < 2) return null

  const ref: RepoRef = { owner: parts[0], repo: parts[1] }

  // owner/repo/tree/<branch>/<path...>, or the /blob/ form for a single file.
  if (parts.length > 3 && (parts[2] === 'tree' || parts[2] === 'blob')) {
    ref.branch = parts[3]

    if (parts.length > 4) ref.path = parts.slice(4).join('/')
  }

  return ref
}

/** One entry of the repository tree; `size` is absent for directories. */
interface TreeItem {
  path: string
  type: string
  size?: number
  sha: string
}

/**
 * Turns GitHub's failure modes into messages a course author can act on.
 */
async function explain(response: Response, ref: RepoRef): Promise<string> {
  let message = ''

  try {
    message = (await response.json())?.message || ''
  } catch {
    // Non-JSON error bodies carry nothing worth reporting.
  }

  const remaining = response.headers.get('x-ratelimit-remaining')

  if ((response.status === 403 || response.status === 429) && remaining === '0') {
    const reset = response.headers.get('x-ratelimit-reset')
    const at = reset ? new Date(parseInt(reset, 10) * 1000) : undefined

    return at
      ? `GitHub's hourly limit for anonymous requests is used up. It resets at ${at.toLocaleTimeString()} — or download the repository and upload it instead.`
      : `GitHub's hourly limit for anonymous requests is used up. Try again later, or download the repository and upload it instead.`
  }

  if (response.status === 404 && ref.branch) {
    return `Could not find branch or tag "${ref.branch}" in "${ref.owner}/${ref.repo}". Check the branch name, or leave it empty to use the default branch.`
  }

  if (response.status === 404) {
    return `Could not find "${ref.owner}/${ref.repo}". Check the address — private repositories cannot be read from the browser.`
  }

  if (response.status === 403 || response.status === 401) {
    return `GitHub refused access to "${ref.owner}/${ref.repo}"${
      message ? `: ${message}` : ''
    }. Private repositories cannot be read from the browser.`
  }

  return `GitHub request failed (${response.status})${message ? `: ${message}` : ''}`
}

/**
 * Whether a path is course content.
 *
 * The same rule as [zip.ts](zip.ts): skip dot-directories and build output, so
 * an imported repository and an uploaded archive of it yield the same course.
 * A clone would carry `.git` and the exporter would filter it later; dropping it
 * here means never spending bandwidth on it.
 */
function isContent(path: string): boolean {
  const segments = path.split('/')

  return !segments.some(
    (segment) =>
      segment.startsWith('.') || SKIPPED_DIRECTORIES.includes(segment),
  )
}

/**
 * Picks the course file, mirroring the server's `findMainMarkdown` exactly as
 * [zip.ts](zip.ts) does — a `README.md` anywhere, else the first markdown file,
 * ties broken by depth so a root README wins over a nested one.
 */
function findMainMarkdown(paths: string[]): string | undefined {
  const markdown = paths.filter((path) => /\.(md|markdown)$/i.test(path))

  if (markdown.length === 0) return undefined

  const depth = (path: string) => path.split('/').length

  const readme = markdown
    .filter((path) => /(^|\/)readme\.(md|markdown)$/i.test(path))
    .sort((a, b) => depth(a) - depth(b))

  if (readme.length > 0) return readme[0]

  return markdown.slice().sort((a, b) => depth(a) - depth(b))[0]
}

/** Human-readable byte count for size-limit messages. */
function megabytes(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

/**
 * Rejects a course too large to hold in a tab, naming what made it large.
 */
function checkSize(items: TreeItem[]): void {
  const total = items.reduce((sum, item) => sum + (item.size || 0), 0)
  const oversized = items.filter((item) => (item.size || 0) > MAX_FILE_BYTES)

  if (oversized.length > 0) {
    const worst = oversized
      .slice()
      .sort((a, b) => (b.size || 0) - (a.size || 0))[0]

    throw new Error(
      `"${worst.path}" is ${megabytes(worst.size || 0)}, over the ${megabytes(
        MAX_FILE_BYTES,
      )} limit for a single file.`,
    )
  }

  if (total > MAX_TOTAL_BYTES) {
    const biggest = items
      .slice()
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 3)
      .map((item) => `${item.path} (${megabytes(item.size || 0)})`)
      .join(', ')

    throw new Error(
      `This course is ${megabytes(total)}, over the ${megabytes(
        MAX_TOTAL_BYTES,
      )} limit. The largest files are: ${biggest}. Export it with the desktop app or the command line instead.`,
    )
  }
}

/**
 * Fetches a course from a GitHub repository.
 *
 * `subdir` and `file` mirror the CLI's `--git-subdir` / `--git-file`: the
 * subdirectory narrows what is fetched and becomes the course root, exactly as
 * it narrows `argument.path` after a clone, and the file names the course
 * document outright instead of searching for a README.
 */
export async function fetchCourse(
  url: string,
  options: {
    branch?: string
    subdir?: string
    file?: string
    onProgress?: (message: string) => void
  } = {},
): Promise<FetchedCourse> {
  if (!isGitHubUrl(url)) {
    throw new Error(
      'Only GitHub repositories can be imported in the browser. Download the course and upload it instead.',
    )
  }

  const ref = parseRepoUrl(url)

  if (!ref) {
    throw new Error(
      `Could not read a repository from "${url}". Expected something like "https://github.com/owner/repo".`,
    )
  }

  // The form's own fields win over anything the URL carried, so a pasted deep
  // link can still be overridden without editing the address.
  const branch = options.branch || ref.branch
  const subdir = options.subdir || ref.path
  const { onProgress } = options

  onProgress?.(`Reading ${ref.owner}/${ref.repo} from GitHub`)

  // `HEAD` resolves to the default branch, so naming no branch costs no extra
  // request — and avoids guessing between `main` and `master` (this project's
  // own docs repository is still `master`).
  const treeUrl = `${API}/repos/${ref.owner}/${ref.repo}/git/trees/${encodeURIComponent(
    branch || 'HEAD',
  )}?recursive=1`

  let response: Response

  try {
    response = await fetch(treeUrl, {
      headers: {
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
    })
  } catch {
    throw new Error(
      'Could not reach GitHub. Check the network connection and try again.',
    )
  }

  if (!response.ok) {
    throw new Error(await explain(response, { ...ref, branch }))
  }

  const tree = await response.json()

  // The tree endpoint caps very large repositories and says so. Without this
  // check the import would quietly produce a course with files missing.
  if (tree.truncated) {
    throw new Error(
      `"${ref.owner}/${ref.repo}" is too large for GitHub to list in one request, so some files would be missing. Download it and upload it instead.`,
    )
  }

  const prefix = subdir ? `${subdir.replace(/^\/+|\/+$/g, '')}/` : ''

  // Everything under the course root, not merely what the markdown references.
  const blobs: TreeItem[] = (tree.tree || []).filter(
    (item: TreeItem) =>
      item.type === 'blob' &&
      isContent(item.path) &&
      (!prefix || item.path.startsWith(prefix)),
  )

  if (blobs.length === 0) {
    throw new Error(
      subdir
        ? `Nothing found in "${subdir}" — check the subdirectory.`
        : `"${ref.owner}/${ref.repo}" holds no files that can be exported.`,
    )
  }

  checkSize(blobs)

  const paths = blobs.map((item) => item.path)

  // An explicitly named course file is resolved relative to the subdirectory,
  // matching how the CLI treats `--git-file` after narrowing to `--git-subdir`.
  const wanted = options.file
    ? `${prefix}${options.file.replace(/^\/+/, '')}`
    : undefined

  if (wanted && !paths.includes(wanted)) {
    throw new Error(`"${options.file}" was not found in the repository.`)
  }

  const main = wanted || findMainMarkdown(paths)

  if (!main) {
    throw new Error(
      `No markdown file found in "${ref.owner}/${ref.repo}${
        subdir ? `/${subdir.replace(/^\/+|\/+$/g, '')}` : ''
      }". A course needs a README.md or another .md file.`,
    )
  }

  // Everything is read at the commit the tree listed, so a push mid-import
  // cannot produce a course assembled from two different revisions. A clone gets
  // that consistency for free; fetching has to ask for it. `tree.sha` is the
  // commit sha, and raw serves it.
  const revision = tree.sha || branch || 'HEAD'

  // The course file's own directory becomes the root, so relative links resolve
  // once the files are written flat into the store — the same re-keying
  // [zip.ts](zip.ts) does, and the reason a subdirectory course works at all.
  const root = main.includes('/') ? main.slice(0, main.lastIndexOf('/') + 1) : ''

  const files: Record<string, Uint8Array> = {}
  let done = 0

  for (const path of paths) {
    done++

    // Files outside the course's own directory cannot be referenced relative to
    // it, so they are dropped rather than given a misleading `../` key.
    if (!path.startsWith(root)) continue

    onProgress?.(`Downloading ${done} of ${paths.length}: ${path}`)

    files[path.slice(root.length)] = await download(ref, revision, path)
  }

  // The course file is kept in `files` as well as being returned as markdown,
  // so the export carries the same tree a clone would. `exportCourse` stages it
  // under this name and skips the duplicate.
  const key = main.slice(root.length)

  return {
    markdown: new TextDecoder().decode(files[key]),
    name: key.replace(/\.(md|markdown)$/i, '') || 'course',
    files,
  }
}

/**
 * Downloads one file from `raw.githubusercontent.com`.
 *
 * Sequential at the call site rather than `Promise.all`: a course can run to
 * tens of megabytes, and holding every response in flight at once is what takes
 * a tab's memory over the edge. The same reasoning already governs `dataURL`
 * and `absorb` in [epub.ts](epub.ts).
 */
async function download(
  ref: RepoRef,
  revision: string,
  path: string,
): Promise<Uint8Array> {
  const url = `${RAW}/${ref.owner}/${ref.repo}/${revision}/${path
    .split('/')
    .map(encodeURIComponent)
    .join('/')}`

  let response: Response

  try {
    response = await fetch(url)
  } catch {
    throw new Error(`Could not download "${path}" from GitHub.`)
  }

  if (!response.ok) {
    throw new Error(`Could not download "${path}" from GitHub (${response.status}).`)
  }

  return new Uint8Array(await response.arrayBuffer())
}
