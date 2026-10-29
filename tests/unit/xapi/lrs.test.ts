/*
 * Reading statements back from the LRS (connectors/XAPI/lrs.ts): an LRS
 * returns them in pages and links the next one in `more`.
 */
import { afterEach, describe, expect, it, vi } from 'vitest'
import { LRSConnection } from '../../../LiaScript/src/typescript/connectors/XAPI/lrs'

const page = (statements: any[], more = '') => ({ ok: true, json: async () => ({ statements, more }) })

afterEach(() => vi.unstubAllGlobals())

describe('getStatements', () => {
  it('follows more, relative to the LRS, and collects every page', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a' }], '/xapi/statements?more=abc'))
      .mockResolvedValueOnce(page([{ id: 'b' }]))
    vi.stubGlobal('fetch', fetch)

    const lrs = new LRSConnection('https://lrs.example.com/xapi/', 'Basic x')
    const result = await lrs.getStatements({ activity: 'course' })

    expect(result.statements).toEqual([{ id: 'a' }, { id: 'b' }])
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(fetch.mock.calls[0][0]).toBe('https://lrs.example.com/xapi/statements?activity=course')
    expect(fetch.mock.calls[1][0]).toBe('https://lrs.example.com/xapi/statements?more=abc')
    expect(fetch.mock.calls[1][1].headers.Authorization).toBe('Basic x')
  })

  it('reads up to 10 000 statements, however small the pages are', async () => {
    // lrsql returns at most 50 statements per page
    const fifty = Array.from({ length: 50 }, (_, i) => ({ id: String(i) }))
    const fetch = vi.fn().mockImplementation(async () => page(fifty, '/xapi/statements?more=next'))
    vi.stubGlobal('fetch', fetch)
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    const result = await new LRSConnection('https://lrs.example.com/xapi', '').getStatements()

    expect(fetch).toHaveBeenCalledTimes(200)
    expect(result.statements).toHaveLength(10000)
    expect(warn).toHaveBeenCalled()
  })

  it('keeps what it got when a later page fails', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a' }], '/xapi/statements?more=abc'))
      .mockResolvedValueOnce({ ok: false, status: 500, text: async () => 'down' })
    vi.stubGlobal('fetch', fetch)
    vi.spyOn(console, 'error').mockImplementation(() => {})

    const result = await new LRSConnection('https://lrs.example.com/xapi/', '').getStatements()

    expect(result.statements).toEqual([{ id: 'a' }])
  })

  it('resolves more against the page for an endpoint without host', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(page([{ id: 'a' }], '/xapi/statements?more=abc'))
      .mockResolvedValueOnce(page([{ id: 'b' }]))
    vi.stubGlobal('fetch', fetch)
    vi.stubGlobal('location', { href: 'https://courses.example.com/course/index.html' })

    const result = await new LRSConnection('/xapi/', '').getStatements()

    expect(result.statements).toEqual([{ id: 'a' }, { id: 'b' }])
    expect(fetch.mock.calls[1][0]).toBe('https://courses.example.com/xapi/statements?more=abc')
  })

  it('returns null if the first page fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce({ ok: false, status: 401, text: async () => 'no' }))
    vi.spyOn(console, 'error').mockImplementation(() => {})

    expect(await new LRSConnection('https://lrs.example.com/xapi/', '').getStatements()).toBeNull()
  })
})

describe('sendOnUnload', () => {
  it('posts to the statements resource with its credentials, surviving the page', () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true })
    vi.stubGlobal('fetch', fetch)

    new LRSConnection('https://lrs.example.com/xapi/', 'Basic x').sendOnUnload({ id: 's' })

    const [url, init] = fetch.mock.calls[0]
    expect(url).toBe('https://lrs.example.com/xapi/statements')
    expect(init.method).toBe('POST')
    expect(init.keepalive).toBe(true)
    expect(init.headers.Authorization).toBe('Basic x')
    expect(init.headers['X-Experience-API-Version']).toBe('1.0.3')
    expect(JSON.parse(init.body)).toEqual({ id: 's' })
  })
})
