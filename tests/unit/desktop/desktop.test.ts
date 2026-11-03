/*
 * The desktop export's resources.neu (an asar archive Neutralino reads) and the
 * per-platform binaries the webapp loads.
 */
import { describe, expect, it } from 'vitest'
import { asar } from '../../../src/export/desktop'
import { requiredBundles } from '../../../src/webapp/bundles'

/** Reads an asar back the way Neutralino does: header size, JSON, then data. */
function read(archive: Uint8Array, file: string): string {
  const view = new DataView(archive.buffer)
  const tree = JSON.parse(
    new TextDecoder().decode(archive.subarray(16, 16 + view.getUint32(12, true))),
  )
  const entry = file.split('/').reduce((dir, part) => dir.files[part], tree)
  const start = 8 + view.getUint32(4, true) + Number(entry.offset)
  return new TextDecoder().decode(archive.subarray(start, start + entry.size))
}

describe('desktop', () => {
  it('packs files into an asar Neutralino can read back', () => {
    const encode = (s: string) => new TextEncoder().encode(s)
    const archive = asar({
      'neutralino.config.json': encode('{"a":1}'),
      'www/index.html': encode('<html>'),
      'www/js/app.js': encode('x()'),
    })

    expect(read(archive, 'neutralino.config.json')).toBe('{"a":1}')
    expect(read(archive, 'www/index.html')).toBe('<html>')
    expect(read(archive, 'www/js/app.js')).toBe('x()')
  })

  it('loads only the binaries of the chosen platforms in the webapp', () => {
    expect(requiredBundles('desktop', { 'desktop-platform': 'win' })).toEqual([
      'indexeddb',
      'common',
      'desktop-win',
    ])
    expect(requiredBundles('desktop')).toEqual([
      'indexeddb',
      'common',
      'desktop-mac',
      'desktop-win',
      'desktop-linux',
    ])
  })
})
