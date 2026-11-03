/*
 * `getRepository` (src/export/helper.ts): which course URLs a project export
 * can clone for SCORM, IMS, xAPI, H5P and Android — GitHub raw URLs and
 * GitLab file links.
 */
import { describe, expect, it } from 'vitest'
import { getRepository } from '../../src/export/helper'

describe('getRepository', () => {
  it('reads raw.githubusercontent.com URLs as before', () => {
    expect(
      getRepository(
        'https://raw.githubusercontent.com/LiaTemplates/ABCjs/main/README.md',
      ),
    ).toEqual({
      url: 'https://github.com/LiaTemplates/ABCjs',
      branch: 'main',
      path: 'README.md',
      cmd: 'git clone --branch main https://github.com/LiaTemplates/ABCjs tmp',
    })
  })

  it('reads a gitlab.com raw link, also with sub-groups and folders', () => {
    expect(
      getRepository(
        'https://gitlab.com/group/sub/repo/-/raw/main/course/part%201/README.md',
      ),
    ).toEqual({
      url: 'https://gitlab.com/group/sub/repo.git',
      branch: 'main',
      path: 'course/part 1/README.md',
      cmd: "git clone --branch 'main' 'https://gitlab.com/group/sub/repo.git' tmp",
    })
  })

  it('reads blob links and self-hosted instances', () => {
    const repo = getRepository(
      'https://gitlab.opencode.de/a/b/-/blob/develop/kurs.md',
    )
    expect(repo?.url).toBe('https://gitlab.opencode.de/a/b.git')
    expect(repo?.branch).toBe('develop')
    expect(repo?.path).toBe('kurs.md')
  })

  it('reads the gitlab:// form', () => {
    const repo = getRepository(
      'gitlab://git.example.org/group/repo/-/raw/main/README.md',
    )
    expect(repo?.url).toBe('https://git.example.org/group/repo.git')
    expect(repo?.path).toBe('README.md')
  })

  it('quotes branch and URL for the shell, nothing is expanded', () => {
    expect(
      getRepository('https://gitlab.com/a/b/-/raw/x;rm -rf ~/README.md')?.cmd,
    ).toBe("git clone --branch 'x;rm -rf ~' 'https://gitlab.com/a/b.git' tmp")
    expect(
      getRepository("https://gitlab.com/a/b/-/raw/$(id)`id`'x/README.md")?.cmd,
    ).toBe(
      "git clone --branch '$(id)`id`'\\''x' 'https://gitlab.com/a/b.git' tmp",
    )
  })

  it('ignores links without a course file and other hosts', () => {
    expect(getRepository('https://gitlab.com/group/repo')).toBeNull()
    expect(getRepository('https://gitlab.com/group/repo/-/tree/main/docs')).toBeNull()
    expect(getRepository('https://example.org/course/README.md')).toBeNull()
  })
})
