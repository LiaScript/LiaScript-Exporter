/*
 * `commonsSource` (src/webapp/formats/render.ts): a Wikimedia Commons
 * `Special:FilePath` link is resolved through the API, since its redirects
 * carry no CORS headers; every other image, and a failed lookup, stays as is.
 */
import { describe, expect, it } from 'vitest'
import { commonsSource } from '../../src/webapp/formats/render'

const THUMB = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Apple_cake.JPG/500px-Apple_cake.JPG'
const ORIGINAL = 'https://upload.wikimedia.org/wikipedia/commons/e/ee/Apple_cake.JPG'

function fakeFetch(answer: unknown) {
  const calls: URL[] = []
  const fetch = (async (url: string) => {
    calls.push(new URL(url))
    if (answer instanceof Error) throw answer
    return new Response(JSON.stringify(answer))
  }) as unknown as typeof globalThis.fetch
  return { fetch, calls }
}

const info = (imageinfo: object) => ({ query: { pages: [{ imageinfo: [imageinfo] }] } })

describe('commonsSource', () => {
  it('resolves a FilePath link with a width to its thumbnail', async () => {
    const { fetch, calls } = fakeFetch(info({ thumburl: THUMB, url: ORIGINAL }))
    const src = 'https://commons.wikimedia.org/wiki/Special:FilePath/Apple_cake.JPG?width=500'

    expect(await commonsSource(src, fetch)).toBe(THUMB)
    expect(calls[0].searchParams.get('titles')).toBe('File:Apple cake.JPG')
    expect(calls[0].searchParams.get('iiurlwidth')).toBe('500')
    expect(calls[0].searchParams.get('origin')).toBe('*')
  })

  it('takes the original without a width', async () => {
    const { fetch, calls } = fakeFetch(info({ url: ORIGINAL }))
    const src = 'https://commons.m.wikimedia.org/wiki/Special:FilePath/Apple%20cake.JPG'

    expect(await commonsSource(src, fetch)).toBe(ORIGINAL)
    expect(calls[0].searchParams.has('iiurlwidth')).toBe(false)
  })

  it('leaves other images alone, and the link when the lookup fails', async () => {
    const { fetch, calls } = fakeFetch(info({ url: ORIGINAL }))
    expect(await commonsSource(THUMB, fetch)).toBe(THUMB)
    expect(await commonsSource('images/local.png', fetch)).toBe('images/local.png')
    expect(calls).toHaveLength(0)

    const src = 'https://commons.wikimedia.org/wiki/Special:FilePath/Missing.png'
    expect(await commonsSource(src, fakeFetch(new Error('offline')).fetch)).toBe(src)
    expect(await commonsSource(src, fakeFetch({ query: { pages: [{ missing: true }] } }).fetch)).toBe(src)
  })
})
