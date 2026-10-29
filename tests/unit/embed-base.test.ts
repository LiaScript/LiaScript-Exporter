/*
 * `embedBase` (src/export/helper.ts): LiaScript reads the header from top to
 * bottom, so `base:` must come before the `import:` it applies to.
 */
import { describe, expect, it } from 'vitest'
import { embedBase, unblockImports } from '../../src/export/helper'

describe('unblockImports', () => {
  it('renames local README.md imports, Moodle refuses URLs with /README', () => {
    const header = [
      '<!--',
      'import:   https://raw.githubusercontent.com/a/b/README.md',
      '          ./lia-templates/check/README.md',
      '          other/readme.md ./kept.md',
      'script:   ./README.md',
      '-->',
    ]
    expect(unblockImports(header.join('\n')).split('\n')).toEqual([
      '<!--',
      'import:   https://raw.githubusercontent.com/a/b/README.md',
      '          ./lia-templates/check/lia-template.md',
      '          other/lia-template.md ./kept.md',
      'script:   ./README.md',
      '-->',
    ])
    expect(unblockImports('# no header, import: ./README.md')).toBe('# no header, import: ./README.md')
  })
})

describe('embedBase', () => {
  it('puts base: first in the header', () => {
    expect(embedBase('<!--\nimport: ./t/README.md\n-->\n# A', 'sub')).toBe(
      '<!--\nbase: sub/\n\nimport: ./t/README.md\n-->\n# A',
    )
  })

  it('keeps a key on the line of <!-- a key of its own', () => {
    expect(embedBase('  <!-- author: x\n-->', 'sub')).toBe('  <!--\nbase: sub/\nauthor: x\n-->')
  })

  it('keeps a base: of the author, adds a header without one', () => {
    expect(embedBase('<!--\nbase: x/\n-->', 'sub')).toBe('<!--\nbase: x/\n-->')
    expect(embedBase('# A', 'sub')).toBe('<!--\nbase: sub/\n-->\n\n# A')
    expect(embedBase('# A', '.')).toBe('# A')
  })
})
