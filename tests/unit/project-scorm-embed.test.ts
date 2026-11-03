/*
 * `scormArguments` (src/export/project.ts): a project export must hand SCORM
 * the course's Markdown for `--scorm-embed` / `--lia-subfolder`, as the single
 * export does. Before, the package embedded the flag's value, `true`.
 */
import { describe, expect, it } from 'vitest'
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { scormArguments } from '../../src/export/project'

function course(markdown: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'lia-embed-test-'))
  const file = path.join(dir, 'README.md')
  fs.writeFileSync(file, markdown)
  return file
}

describe('scormArguments', () => {
  it('embeds the course Markdown for --scorm-embed', () => {
    const file = course('# Course A\n')
    const args = scormArguments({ 'scorm-embed': true, output: 'x' }, file)
    expect(args['scorm-embed']).toBe('# Course A\n')
    expect(args.output).toBe('x')
  })

  it('embeds for --lia-subfolder, like the single export', () => {
    const file = course('# Course B\n')
    expect(scormArguments({ 'lia-subfolder': true }, file)['scorm-embed']).toBe(
      '# Course B\n',
    )
  })

  it('leaves the arguments of the next course untouched', () => {
    const shared = { 'scorm-embed': true }
    scormArguments(shared, course('# Course C\n'))
    expect(shared['scorm-embed']).toBe(true)
  })

  it('changes nothing without the flags', () => {
    const args = { output: 'x' }
    expect(scormArguments(args, '/does/not/exist')).toBe(args)
  })
})
