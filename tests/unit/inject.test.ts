/*
 * `inject` (src/export/helper.ts): Parcel >= 2.16 omits <head>, </head> and
 * </body>, the SCORM/xAPI config scripts must still land in the head.
 */
import { describe, expect, it } from 'vitest'
import { inject } from '../../src/export/helper'

const MINIFIED = '<!DOCTYPE html><html lang=en><script src=lia.1.js></script><body>\n<noscript>x</noscript>'
const FULL = '<html><head><script src=a.js></script></head><body></body></html>'

describe('inject', () => {
  it('appends to the head of a minified page', () => {
    expect(inject('<script src=config.js></script>', MINIFIED)).toBe(
      '<!DOCTYPE html><html lang=en><head><script src=lia.1.js></script><script src=config.js></script></head><body>\n<noscript>x</noscript>',
    )
  })

  it('prepends to the head of a minified page', () => {
    expect(inject('<X>', MINIFIED, true)).toMatch(/^<!DOCTYPE html><html lang=en><head><X><script src=lia/)
  })

  it('injects after <body> of a minified page', () => {
    expect(inject('<X>', MINIFIED, '<body>')).toContain('</head><body><X>\n')
  })

  it('leaves complete pages as before', () => {
    expect(inject('<X>', FULL)).toBe('<html><head><script src=a.js></script><X></head><body></body></html>')
    expect(inject('<X>', FULL, true)).toBe('<html><head><X><script src=a.js></script></head><body></body></html>')
  })
})
