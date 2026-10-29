/*
 * `embedBase` (src/export/helper.ts): LiaScript reads the header from top to
 * bottom, so `base:` must come before the `import:` it applies to.
 */
import { describe, expect, it } from 'vitest'
import { embedBase } from '../../src/export/helper'

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
