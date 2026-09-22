'use strict'

/**
 * Importing a course straight from a GitHub repository.
 *
 * The browser counterpart to the server's `cloneGitRepo`
 * ([zipExtractor](../server/utils/zipExtractor.ts)). Cloning is impossible
 * here — github.com's git-upload-pack sends no `Access-Control-Allow-Origin`,
 * and the only workaround is a third-party CORS proxy, which would route the
 * user's course through someone else's server. `api.github.com` and
 * `raw.githubusercontent.com` are both CORS-open, so fetching needs none.
 *
 * Downloads go through `raw`, not the blob API that
 * [LiveEditor](../../../LiveEditor/src/ts/GitHubRepo.ts) uses for its diffing:
 * blobs are billed one request *per file* against the 60-per-hour anonymous
 * quota (48 of 60 for one import of `LiaScript/docs`), raw is not billed at
 * all. So an import costs exactly one request — the tree call.
 */

import { ExportError } from './errors'

const API = 'https://api.github.com'
const RAW = 'https://raw.githubusercontent.com'

/**
 * Size ceilings, matching the service's own upload limit
 * ([server.ts](../server/server.ts) `limits.fileSize`). 100 MB is also GitHub's
 * hard blob ceiling, so the per-file cap can never reject a real file.
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
 * Parses a user-supplied repository reference, after LiveEditor's own
 * `parseRepoUrl`: `owner/repo`, an `https://github.com/...` URL, a
 * `git@github.com:` SSH URL, or a `/tree/<branch>/<path>` deep link — the form
 * the GitHub UI copies, which carries the branch and subdirectory for free.
 */
export function parseRepoUrl(input: string): RepoRef | null {
  let s = (input || '').trim()

  if (!s) return null

  s = s.replace(/^git@github\.com:/i, 'https://github.com/')

  // The scheme stays optional: the service accepts a bare "github.com/owner/repo",
  // and without `(https?://)?` the host survives and becomes the owner.
  s = s.replace(/^(https?:\/\/)?(www\.)?github\.com\//i, '')
  s = s.replace(/^(https?:\/\/)?(www\.)?raw\.githubusercontent\.com\//i, '')
  s = s.replace(/\.git$/, '')

  // A scheme or host still standing means another forge — GitHub's was stripped
  // above — and must not be read as an owner name.
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
 * Turns GitHub's failure modes into an error a course author can act on.
 *
 * The distinction that needs care is 403: it means an exhausted quota only when
 * the remaining-quota header is zero, and missing permissions otherwise.
 */
async function explain(response: Response, ref: RepoRef): Promise<ExportError> {
  let detail = ''

  try {
    detail = (await response.json())?.message || ''
  } catch {
    // Non-JSON error bodies carry nothing worth reporting.
  }

  const repo = `${ref.owner}/${ref.repo}`
  const remaining = response.headers.get('x-ratelimit-remaining')

  if ((response.status === 403 || response.status === 429) && remaining === '0') {
    const reset = response.headers.get('x-ratelimit-reset')

    if (reset) {
      return new ExportError(
        'errors.github.rateLimitUntil',
        "GitHub's hourly limit for anonymous requests is used up. It resets at {time} — or download the repository and upload it instead.",
        { time: new Date(parseInt(reset, 10) * 1000).toLocaleTimeString() },
      )
    }

    return new ExportError(
      'errors.github.rateLimit',
      "GitHub's hourly limit for anonymous requests is used up. Try again later, or download the repository and upload it instead.",
    )
  }

  // Reported on its own: a named branch is the likeliest thing to be wrong, and
  // the private-repository note would send the user after the wrong problem.
  if (response.status === 404 && ref.branch) {
    return new ExportError(
      'errors.github.noBranch',
      'Could not find branch or tag "{branch}" in "{repo}". Check the branch name, or leave it empty to use the default branch.',
      { branch: ref.branch, repo },
    )
  }

  if (response.status === 404) {
    return new ExportError(
      'errors.github.noRepo',
      'Could not find "{repo}". Check the address — private repositories cannot be read from the browser.',
      { repo },
    )
  }

  if (response.status === 403 || response.status === 401) {
    return new ExportError(
      'errors.github.forbidden',
      'GitHub refused access to "{repo}"{detail}. Private repositories cannot be read from the browser.',
      { repo, detail: detail ? `: ${detail}` : '' },
    )
  }

  return new ExportError(
    'errors.github.requestFailed',
    'GitHub request failed ({status}){detail}',
    { status: response.status, detail: detail ? `: ${detail}` : '' },
  )
}

/**
 * Whether a path is course content — the same rule as [zip.ts](zip.ts), so a
 * repository and an uploaded archive of it yield the same course. A clone would
 * carry `.git` and filter it later; dropping it here saves the bandwidth.
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

    throw new ExportError(
      'errors.github.fileTooLarge',
      '"{path}" is {size}, over the {limit} limit for a single file.',
      {
        path: worst.path,
        size: megabytes(worst.size || 0),
        limit: megabytes(MAX_FILE_BYTES),
      },
    )
  }

  if (total > MAX_TOTAL_BYTES) {
    const biggest = items
      .slice()
      .sort((a, b) => (b.size || 0) - (a.size || 0))
      .slice(0, 3)
      .map((item) => `${item.path} (${megabytes(item.size || 0)})`)
      .join(', ')

    throw new ExportError(
      'errors.github.courseTooLarge',
      'This course is {size}, over the {limit} limit. The largest files are: {files}. Export it with the desktop app or the command line instead.',
      {
        size: megabytes(total),
        limit: megabytes(MAX_TOTAL_BYTES),
        files: biggest,
      },
    )
  }
}

/**
 * Fetches a course from a GitHub repository.
 *
 * `subdir` and `file` mirror the CLI's `--git-subdir` / `--git-file`: the first
 * narrows what is fetched and becomes the course root, as it narrows
 * `argument.path` after a clone; the second names the course document outright.
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
    throw new ExportError(
      'errors.github.notGitHub',
      'Only GitHub repositories can be imported in the browser. Download the course and upload it instead.',
    )
  }

  const ref = parseRepoUrl(url)

  if (!ref) {
    throw new ExportError(
      'errors.github.badUrl',
      'Could not read a repository from "{url}". Expected something like "https://github.com/owner/repo".',
      { url },
    )
  }

  // The form's own fields win over anything the URL carried, so a pasted deep
  // link can still be overridden without editing the address.
  const branch = options.branch || ref.branch
  const subdir = options.subdir || ref.path
  const { onProgress } = options

  onProgress?.(`Reading ${ref.owner}/${ref.repo} from GitHub`)

  // `HEAD` resolves to the default branch: no extra request, and no guessing
  // between `main` and `master` (LiaScript/docs is still `master`).
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
    throw new ExportError(
      'errors.github.unreachable',
      'Could not reach GitHub. Check the network connection and try again.',
    )
  }

  if (!response.ok) {
    throw await explain(response, { ...ref, branch })
  }

  const tree = await response.json()

  // The endpoint caps very large repositories and says so; unchecked, the
  // import would quietly produce a course with files missing.
  if (tree.truncated) {
    throw new ExportError(
      'errors.github.tooManyFiles',
      '"{repo}" is too large for GitHub to list in one request, so some files would be missing. Download it and upload it instead.',
      { repo: `${ref.owner}/${ref.repo}` },
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
    throw subdir
      ? new ExportError(
          'errors.github.emptySubdir',
          'Nothing found in "{subdir}" — check the subdirectory.',
          { subdir },
        )
      : new ExportError(
          'errors.github.emptyRepo',
          '"{repo}" holds no files that can be exported.',
          { repo: `${ref.owner}/${ref.repo}` },
        )
  }

  checkSize(blobs)

  const paths = blobs.map((item) => item.path)

  // Resolved relative to the subdirectory, as the CLI treats `--git-file` after
  // narrowing to `--git-subdir`.
  const wanted = options.file
    ? `${prefix}${options.file.replace(/^\/+/, '')}`
    : undefined

  if (wanted && !paths.includes(wanted)) {
    throw new ExportError(
      'errors.github.noSuchFile',
      '"{file}" was not found in the repository.',
      // As the user wrote it — `wanted` carries a prefix they did not type.
      { file: options.file ?? wanted },
    )
  }

  const main = wanted || findMainMarkdown(paths)

  if (!main) {
    throw new ExportError(
      'errors.github.noMarkdown',
      'No markdown file found in "{where}". A course needs a README.md or another .md file.',
      {
        where: `${ref.owner}/${ref.repo}${
          subdir ? `/${subdir.replace(/^\/+|\/+$/g, '')}` : ''
        }`,
      },
    )
  }

  // Pinned to the commit the tree listed, so a push mid-import cannot assemble
  // a course from two revisions. `tree.sha` is the commit sha, and raw serves it.
  const revision = tree.sha || branch || 'HEAD'

  // The course file's directory becomes the root so relative links resolve once
  // the files are written flat into the store — the re-keying [zip.ts](zip.ts) does.
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

  // Kept in `files` as well as returned as markdown, so the export carries the
  // same tree a clone would; `exportCourse` stages it and skips the duplicate.
  const key = main.slice(root.length)

  return {
    markdown: new TextDecoder().decode(files[key]),
    name: key.replace(/\.(md|markdown)$/i, '') || 'course',
    files,
  }
}

/**
 * Downloads one file from `raw.githubusercontent.com`. Called sequentially, not
 * through `Promise.all`: a course runs to tens of megabytes, and holding every
 * response at once is what takes a tab over — as for `absorb` in [epub.ts](epub.ts).
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
    throw new ExportError(
      'errors.github.downloadFailed',
      'Could not download "{path}" from GitHub.',
      { path },
    )
  }

  if (!response.ok) {
    throw new ExportError(
      'errors.github.downloadFailedStatus',
      'Could not download "{path}" from GitHub ({status}).',
      { path, status: response.status },
    )
  }

  return new Uint8Array(await response.arrayBuffer())
}
