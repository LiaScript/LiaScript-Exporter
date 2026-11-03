/**
 * Shared by the CLI, the server and the browser webapp, so it must not import
 * Node modules.
 */

export type GitSource = {
  url: string
  branch?: string
  subdir?: string
  file?: string
}

/** Whether this is a GitLab link: gitlab.com, `gitlab://` or a `/-/` link. */
export function isGitLabUrl(gitUrl: string): boolean {
  const url = gitUrl.trim()
  return (
    /^gitlab:\/\//i.test(url) ||
    /^(https?:\/\/)?(www\.)?gitlab\.com\//i.test(url) ||
    url.includes('/-/')
  )
}

/**
 * Splits a GitLab link into what `cloneGitRepo` needs, like LiaScript does in
 * `UrlPattern/GitLab.elm`: gitlab.com, self-hosted instances (`/-/` links) and
 * LiaScript's `gitlab://host/group/repo/...` form, e.g.
 * `gitlab://git.example.org/group/repo/-/blob/main/course/README.md` →
 * `https://git.example.org/group/repo.git`, `main`, `course`, `README.md`.
 * Other URLs pass through unchanged.
 */
export function parseGitUrl(gitUrl: string): GitSource {
  if (!isGitLabUrl(gitUrl)) return { url: gitUrl }
  const url = gitUrl.trim().replace(/^gitlab:\/\//i, 'https://')

  const plain = url.replace(/[?#].*$/, '').replace(/\/+$/, '')
  // shortcut: a branch name containing "/" is read as branch + path, pass --git-branch/--git-subdir for those
  const link = plain.match(/^(.*?)\/-\/(?:blob|raw|tree)\/([^/]+)(?:\/(.*))?$/)
  const repo = (link ? link[1] : plain).replace(/\.git$/, '') + '.git'
  if (!link) return { url: repo }

  const path = decodeURIComponent(link[3] || '').split('/').filter(Boolean)
  const file = /\.md$/i.test(path[path.length - 1] || '') ? path.pop() : undefined
  return {
    url: repo,
    branch: link[2],
    subdir: path.join('/') || undefined,
    file,
  }
}
