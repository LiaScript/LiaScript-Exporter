/*
 * Which runtime bundle the browser webapp seeds (src/webapp/bundles.ts).
 */
import { describe, expect, it } from 'vitest'
import { requiredBundles } from '../../../src/webapp/bundles'

describe('webapp bundles', () => {
  it('uses the suspend runtime only when asked for', () => {
    expect(requiredBundles('scorm1.2')).toEqual(['scorm1.2', 'common', 'scorm-schemas'])
    expect(requiredBundles('scorm1.2', { 'scorm-storage': 'suspend' })).toEqual(['scorm1.2-suspend', 'common', 'scorm-schemas'])
    expect(requiredBundles('scorm2004', { 'scorm-storage': 'suspend' })).toEqual(['scorm2004-suspend', 'common', 'scorm-schemas'])
    expect(requiredBundles('scorm2004', { 'scorm-storage': '' })).toEqual(['scorm2004', 'common', 'scorm-schemas'])
  })

  it('keeps the IndexedDB swap of web and ims', () => {
    expect(requiredBundles('web', { 'web-indexeddb': true })).toEqual(['indexeddb', 'common'])
    expect(requiredBundles('ims', { 'ims-indexeddb': 'key' })).toEqual(['indexeddb', 'common'])
    expect(requiredBundles('ims', { 'ims-indexeddb': false })).toEqual(['web', 'common'])
    expect(requiredBundles('web', { 'scorm-storage': 'suspend' })).toEqual(['web', 'common'])
  })

  it('knows nothing of formats the browser cannot export', () => {
    expect(requiredBundles('android')).toBeUndefined()
  })
})
