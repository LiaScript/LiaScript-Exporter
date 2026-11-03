/*
 * `localCover` (src/export/epub.ts): an http(s) cover is downloaded by the
 * exporter and handed to html-to-epub as a file, with the extension taken from
 * the content type — the library rejects cover URLs without an extension.
 */
import * as fs from 'fs'
import * as os from 'os'
import * as path from 'path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { localCover } from '../../src/export/epub'

// a 1x1 PNG with bytes above 0x7f, which a text round trip would change
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64',
)

function fakeFetch(body: Buffer, contentType: string, status = 200) {
  const calls: string[] = []
  const fetch = (async (url: string) => {
    calls.push(url)
    return new Response(status === 200 ? body : null, {
      status,
      headers: { 'content-type': contentType },
    })
  }) as unknown as typeof globalThis.fetch
  return { fetch, calls }
}

describe('localCover', () => {
  let dir: string
  beforeEach(() => {
    dir = fs.mkdtempSync(path.join(os.tmpdir(), 'epub-cover-'))
  })
  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true })
  })

  it('downloads a URL cover byte for byte, extension from the content type', async () => {
    const { fetch, calls } = fakeFetch(PNG, 'image/png; charset=binary')
    const file = await localCover('https://example.org/avatar?id=1', dir, fetch)

    expect(calls).toEqual(['https://example.org/avatar?id=1'])
    expect(file).toBe(path.join(dir, 'cover.png'))
    expect(fs.readFileSync(file!).equals(PNG)).toBe(true)
  })

  it('falls back to the extension of the URL path', async () => {
    const { fetch } = fakeFetch(PNG, 'application/octet-stream')
    const file = await localCover('//example.org/img/logo.JPG', dir, fetch)
    expect(file).toBe(path.join(dir, 'cover.jpg'))
  })

  it('passes local files through unchanged', async () => {
    const { fetch, calls } = fakeFetch(PNG, 'image/png')
    expect(await localCover('/home/me/cover.png', dir, fetch)).toBe('/home/me/cover.png')
    expect(calls).toEqual([])
  })

  it('drops a cover that cannot be downloaded instead of failing the export', async () => {
    const { fetch } = fakeFetch(PNG, 'text/html', 404)
    expect(await localCover('https://example.org/missing.png', dir, fetch)).toBeUndefined()
  })
})
