/*
 * The pure parts of the H5P export (src/export/h5p.ts): the library version,
 * the runtime's head, the wrapper the package ships and the svg images H5P
 * refuses.
 */
import * as fs from 'node:fs'
import * as vm from 'node:vm'
import { describe, expect, it } from 'vitest'
import {
  CONTENT_EXTENSIONS,
  LIBRARY_EXTENSIONS,
  inlineImages,
  libraryVersion,
  runtimeHead,
  wrapper,
  WRAPPER_REVISION,
} from '../../../src/export/h5p'

const SOURCE = fs.readFileSync(new URL('../../../src/export/h5p-library/h5p-liascript.js', import.meta.url), 'utf8')

const INDEX =
  '<!DOCTYPE html><html><head><title>Lia</title><script src="index.1.js"></script>' +
  '<script type="module" src="index.2.js"></script><link rel="stylesheet" href="index.3.css">' +
  '<link rel="icon" href="https://example.org/logo.png"><link href="#x" rel="x">' +
  '<script src="/absolute.js"></script></head><body></body></html>'

describe('H5P export', () => {
  it('takes major and minor from LiaScript, the patch from the build', () => {
    expect(libraryVersion({ version: '2.2.2', built: 6879 })).toEqual({
      major: 2,
      minor: 2,
      patch: 6879 + WRAPPER_REVISION,
    })
    // H5P players read a major version of 0 as missing
    expect(libraryVersion({ version: '0.4.1', built: 1 }).major).toBe(1)
  })

  it('refuses a patch version of more than five digits, as H5P does', () => {
    expect(() => libraryVersion({ version: '2.2.2', built: 100000 })).toThrow(/five digits/)
  })

  it('prefixes the local scripts and stylesheets of the runtime', () => {
    const head = runtimeHead(INDEX)
    expect(head).toContain('src="%BASE%index.1.js"')
    expect(head).toContain('src="%BASE%index.2.js"')
    expect(head).toContain('href="%BASE%index.3.css"')
    expect(head).toContain('href="https://example.org/logo.png"')
    expect(head).toContain('href="#x"')
    expect(head).toContain('src="/absolute.js"')
    expect(head).not.toContain('<head>')
  })

  it('ships a wrapper that parses, also inlined in a <script>', () => {
    const head = runtimeHead(INDEX)
    const code = wrapper(SOURCE, head)

    expect(() => new vm.Script(code)).not.toThrow()
    // a platform may inline library code: nothing may end the element early
    expect(code).not.toMatch(/<\/script/i)

    // the runtime is in, and the wrapper defines H5P.LiaScript
    const H5P: any = { EventDispatcher: function () {} }
    H5P.EventDispatcher.prototype = {}
    vm.runInNewContext(code, { H5P, window: {}, console })
    expect(typeof H5P.LiaScript).toBe('function')
    expect(code).toContain(JSON.stringify(head).replace(/<\//g, '<\\/'))
  })

  it('needs exactly one runtime placeholder', () => {
    expect(() => wrapper('var RUNTIME = null', '')).toThrow(/one runtime placeholder/)
    expect(() => wrapper(SOURCE + "\n'__LIASCRIPT_RUNTIME__'", '')).toThrow(/has 2/)
  })

  it('embeds svg images as data URLs, wherever the Markdown refers to them', () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')
    const url = 'data:image/svg+xml;base64,' + Buffer.from(svg).toString('base64')
    const markdown = [
      '![a](img/a.svg)',
      '![b](./img/a.svg "title")',
      '<img src="img/a.svg">',
      'not img/a.svg.png or myimg/a.svg',
    ].join('\n')

    const result = inlineImages(markdown, [
      { path: 'img/a.svg', data: svg },
      { path: 'unused.svg', data: svg },
    ])

    expect(result.markdown.split('\n')).toEqual([
      `![a](${url})`,
      `![b](${url} "title")`,
      `<img src="${url}">`,
      'not img/a.svg.png or myimg/a.svg',
    ])
    expect(result.unused).toEqual(['unused.svg'])
  })

  it('allows only what Moodle allows, and scripts and styles in libraries', () => {
    expect(CONTENT_EXTENSIONS).not.toContain('svg')
    expect(CONTENT_EXTENSIONS).not.toContain('html')
    expect(CONTENT_EXTENSIONS).not.toContain('js')
    expect(LIBRARY_EXTENSIONS).toEqual(expect.arrayContaining(['js', 'css', 'woff2', 'png']))
  })
})
