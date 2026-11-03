/*
 * `parseGitUrl` turns GitLab links (gitlab.com, self-hosted, `gitlab://`) into
 * clone URL, branch, subdirectory and file for `--git-url`.
 */
import { describe, expect, it } from 'vitest'
import { parseGitUrl } from '../../src/server/utils/zipExtractor'

describe('parseGitUrl', () => {
  it('leaves GitHub and other URLs alone', () => {
    expect(parseGitUrl('https://github.com/LiaScript/LiaScript')).toEqual({
      url: 'https://github.com/LiaScript/LiaScript',
    })
  })

  it('adds .git to a plain gitlab.com repository', () => {
    expect(parseGitUrl('https://gitlab.com/group/sub/repo/')).toEqual({
      url: 'https://gitlab.com/group/sub/repo.git',
    })
  })

  it('splits a gitlab.com blob link into branch, subdir and file', () => {
    expect(
      parseGitUrl('https://gitlab.com/OvGU-ESS/eLab_v2/lia_script/-/blob/master/docs/My%20Course.md'),
    ).toEqual({
      url: 'https://gitlab.com/OvGU-ESS/eLab_v2/lia_script.git',
      branch: 'master',
      subdir: 'docs',
      file: 'My Course.md',
    })
  })

  it('maps gitlab:// to https for self-hosted instances', () => {
    expect(parseGitUrl('gitlab://git.example.org/group/repo')).toEqual({
      url: 'https://git.example.org/group/repo.git',
    })
    expect(parseGitUrl('gitlab://git.example.org/group/repo/-/raw/dev/README.md?inline=false')).toEqual({
      url: 'https://git.example.org/group/repo.git',
      branch: 'dev',
      subdir: undefined,
      file: 'README.md',
    })
  })

  it('reads a self-hosted https tree link as a subdirectory', () => {
    expect(parseGitUrl('https://gitlab.opencode.de/a/b/-/tree/main/kurs/teil1')).toEqual({
      url: 'https://gitlab.opencode.de/a/b.git',
      branch: 'main',
      subdir: 'kurs/teil1',
      file: undefined,
    })
  })
})
