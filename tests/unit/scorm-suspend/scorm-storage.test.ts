/*
 * The exporter's side of `--scorm-storage` (src/export/scorm-storage.ts).
 */
import { describe, expect, it, vi } from 'vitest'
import * as STORAGE from '../../../src/export/scorm-storage'
import { QUIZ_STATE_KEY } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/meta'
import { defaults, meta } from './fixture-meta'

const json = { ...defaults, meta: meta() }

describe('storage mode', () => {
  it('defaults to the classic connectors and refuses typos', () => {
    expect(STORAGE.storageMode({})).toBe('default')
    expect(STORAGE.storageMode({ 'scorm-storage': 'default' })).toBe('default')
    expect(STORAGE.storageMode({ 'scorm-storage': false })).toBe('default')
    expect(STORAGE.storageMode({ 'scorm-storage': 'suspend' })).toBe('suspend')
    expect(() => STORAGE.storageMode({ 'scorm-storage': 'suspended' })).toThrow(/default.*suspend/)
    expect(() => STORAGE.storageMode({ 'scorm-storage': true })).toThrow()
  })

  it('picks the runtime bundle', () => {
    expect(STORAGE.assetDir('scorm1.2', 'default')).toBe('./assets/scorm1.2')
    expect(STORAGE.assetDir('scorm2004', 'suspend')).toBe('./assets/scorm2004-suspend')
  })

  it('knows the same quiz state keys as the runtime', () => {
    expect(STORAGE.QUIZ_STATE_KEY).toEqual(QUIZ_STATE_KEY)
  })
})

describe('config.js', () => {
  // what scorm12.ts and scorm2004.ts wrote before --scorm-storage existed
  const classic = (j: any) => 'window.config_ = ' + JSON.stringify({ task: j.task, quiz: j.quiz, survey: j.survey }) + ';'

  it('is unchanged in the default mode', () => {
    expect(STORAGE.configScript('scorm1.2', json, {}, 'default')).toBe(classic(json))
    expect(STORAGE.configScript('scorm1.2', json, { 'scorm-alwaysActive': true, 'scorm-masteryScore': '80' }, 'default')).toBe(
      classic(json)
    )
    expect(STORAGE.configScript('scorm2004', json, { 'scorm-alwaysActive': true, 'scorm-masteryScore': '80' }, 'default')).toBe(
      classic(json) + '\n\nwindow["ACTIVE"] = true;\n\nwindow["MASTERY_SCORE"] =0.8'
    )
  })

  it('carries the course description in the suspend mode', () => {
    const script = STORAGE.configScript('scorm1.2', json, { 'scorm-alwaysActive': true, 'scorm-masteryScore': '50' }, 'suspend')
    const window: any = {}
    new Function('window', script)(window)

    expect(window.config_.quiz).toEqual(json.quiz)
    expect(window.config_.meta.slides[13].quiz[1]).toMatchObject({ type: 'single', options: ['3', '4', '5'] })
    expect(window.ACTIVE).toBe(true)
    expect(window.MASTERY_SCORE).toBe(0.5)
  })
})

describe('finalizeMeta', () => {
  it('aligns the description with the state vectors and clips long texts', () => {
    const description = meta()
    description.slides[13].quiz[0].question = 'x'.repeat(1000)
    description.slides[13].quiz.pop() // one quiz not found
    description.slides[14].survey[0] = { ...description.slides[14].survey[0], options: [{ key: 'good', label: 'y'.repeat(500) }] }

    const out = STORAGE.finalizeMeta(description, defaults, vi.fn())!

    expect(out.slides[13].quiz).toHaveLength(defaults.quiz[13].length)
    expect(out.slides[13].quiz[0].question).toHaveLength(250)
    expect(out.slides[13].quiz[6]).toMatchObject({ unknown: true })
    expect((out.slides[14].survey[0] as any).options[0].label).toHaveLength(120)
    expect(out.slides[2].task[0].items).toEqual(['MKTaskDone completed task', 'MKTaskOpen open task'])
  })

  it('drops a description that does not fit its quiz, with a warning', () => {
    const description = meta()
    description.slides[13].quiz[0] = { type: 'single', question: 'Q', options: ['a'], solution: [true] }
    const warn = vi.fn()

    const out = STORAGE.finalizeMeta(description, defaults, warn)!

    expect(out.slides[13].quiz[0]).toMatchObject({ question: 'Q', unknown: true })
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('slide 14, quiz 1'))
  })

  it('returns null without a description', () => {
    const warn = vi.fn()
    expect(STORAGE.finalizeMeta(undefined, defaults, warn)).toBeNull()
    expect(warn).toHaveBeenCalled()
  })
})
