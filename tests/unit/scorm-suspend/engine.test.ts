/*
 * The lifecycle of the suspend connectors (engine.ts) against a strict fake
 * LMS: what is written when, status rules, resuming, refusals.
 */
import { describe, expect, it, vi } from 'vitest'
import { Engine, TIMING } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/engine'
import { profile } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/profile'
import * as Codec from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/codec'
import { md5 } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/md5'
import { FakeClock, FakeLMS, type FakeOptions } from './fake-lms'
import { answered, defaults, meta, project } from './fixture-meta'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

function session(lms: FakeLMS, version: '1.2' | '2004', extra: { mastery?: number; slides?: number } = {}) {
  const clock = new FakeClock()
  const warn = vi.fn()
  const engine = new Engine(lms, { profile: profile(version), defaults, meta: meta(), warn, ...extra }, clock)
  engine.start()
  return { engine, clock, warn, lms }
}

const start = (options: FakeOptions, extra = {}) => session(new FakeLMS(options), options.version, extra)

/** what LiaScript sends when the learner checks quiz i of slide 13 */
function check(engine: Engine, i: number, change: any) {
  const slide = clone(engine.load('quiz', 13))
  slide[i] = { ...slide[i], ...change }
  engine.store('quiz', 13, slide)
}

const STATUS = { '1.2': 'cmi.core.lesson_status', '2004': 'cmi.completion_status' }

for (const version of ['1.2', '2004'] as const) {
  describe(`SCORM ${version}`, () => {
    it('starts incomplete, never "not attempted", with every interaction laid out', () => {
      const { lms, warn } = start({ version })

      expect(lms.stored[STATUS[version]]).toBe('incomplete')
      expect(lms.sets.some(([, value]) => value === 'not attempted')).toBe(false)
      expect(lms.count).toBe(13)
      expect(lms.interaction(0).id).toBe('T3.1_Lists_and_Tasks')
      expect(lms.interaction(2).type).toBe(version === '1.2' ? 'fill-in' : 'fill-in')
      expect(lms.interaction(3).type).toBe(version === '1.2' ? 'fill-in' : 'choice')
      expect(lms.refusals).toEqual([])
      expect(warn).not.toHaveBeenCalled()
    })

    it('reports a checked quiz at once and saves the state', () => {
      const { engine, lms } = start({ version })
      const commits = lms.commits

      check(engine, 0, { solved: 1, trial: 1, state: { Text: 'Paris' } })

      const quiz = lms.byId()['Q14.1_MKQuizText_What_is_the_capital_of_France']
      expect(quiz[version === '1.2' ? 'student_response' : 'learner_response']).toBe('Paris')
      expect(quiz.result).toBe('correct')
      expect(quiz['correct_responses.0.pattern']).toBe('Paris')
      expect(lms.stored['cmi.suspend_data']).toMatch(/^LS1Z/)
      expect(lms.commits).toBeGreaterThan(commits)
      expect(lms.refusals).toEqual([])
      expect(engine.score()).toBeCloseTo(1 / 7)

      if (version === '1.2') expect(lms.stored['cmi.core.score.raw']).toBe('14.29')
      else expect(lms.stored['cmi.score.scaled']).toBe('0.1429')
    })

    it('waits for a pause before saving tasks and settings', () => {
      const { engine, lms, clock } = start({ version })
      const before = lms.stored['cmi.suspend_data']

      engine.store('task', 2, [[false, true]])
      engine.setSettings({ mode: 'Slides' })
      clock.advance(TIMING.quiet - 1)
      expect(lms.stored['cmi.suspend_data']).toBe(before)

      clock.advance(1)
      expect(lms.stored['cmi.suspend_data']).not.toBe(before)
      expect(lms.byId()['T3.1_Lists_and_Tasks'][version === '1.2' ? 'student_response' : 'learner_response']).toBe(
        version === '1.2' ? '[ ] MKTaskDone completed task; [x] MKTaskOpen open task' : 'i2'
      )
    })

    it('saves at the latest after a few seconds of constant changes', () => {
      const { engine, lms, clock } = start({ version })
      const before = lms.stored['cmi.suspend_data']
      for (let t = 0; t < TIMING.latest; t += TIMING.quiet / 2) {
        engine.store('task', 2, [[t % 2 === 0, true]])
        clock.advance(TIMING.quiet / 2)
      }
      expect(lms.stored['cmi.suspend_data']).not.toBe(before)
    })

    it('restores everything in the next session, without new interactions', () => {
      const first = start({ version })
      const done = answered()
      done.quiz[13].forEach((_, i) => check(first.engine, i, done.quiz[13][i]))
      first.engine.store('survey', 14, done.survey[14])
      first.engine.store('task', 2, done.task[2])
      first.engine.setSettings({ mode: 'Slides', theme: 'red' })
      first.engine.slide(14)
      first.engine.finish()

      expect(first.lms.refusals).toEqual([])
      const count = first.lms.count

      const second = session(first.lms.next(), version)
      expect(second.engine.settings()).toEqual({ mode: 'Slides', theme: 'red' })
      expect(second.engine.location()).toBe(14)
      expect(second.engine.load('quiz', 13)).toEqual(done.quiz[13])
      expect(second.engine.load('survey', 14)).toEqual(done.survey[14])
      expect(second.engine.load('task', 2)).toEqual(done.task[2])
      expect(second.lms.count).toBe(count)
      expect(second.warn).not.toHaveBeenCalled()
    })

    it('finishes once, with session time and exit=suspend', () => {
      const { engine, lms, clock } = start({ version })
      clock.advance(3_725_500)
      engine.finish()
      engine.finish()
      engine.store('task', 2, [[false, false]])
      clock.advance(10_000)

      expect(lms.finishes).toBe(1)
      const v12 = version === '1.2'
      expect(lms.stored[v12 ? 'cmi.core.exit' : 'cmi.exit']).toBe('suspend')
      expect(lms.stored[v12 ? 'cmi.core.session_time' : 'cmi.session_time']).toBe(v12 ? '01:02:05' : 'PT1H2M5.5S')
      expect(lms.refusals).toEqual([])
    })

    it('saves state and position without credit, but reports nothing', () => {
      const { engine, lms } = start({ version, credit: 'no-credit' })
      check(engine, 0, { solved: 1, trial: 1, state: { Text: 'Paris' } })
      engine.slide(3)

      expect(lms.stored['cmi.suspend_data']).toMatch(/^LS1Z/)
      expect(lms.stored[version === '1.2' ? 'cmi.core.lesson_location' : 'cmi.location']).toBe('3')
      expect(lms.count).toBe(0)
      expect(lms.stored[STATUS[version]]).toBe('not attempted')
    })

    it('writes nothing in review mode', () => {
      const { engine, lms } = start({ version, mode: 'review' })
      check(engine, 0, { solved: 1, trial: 1, state: { Text: 'Paris' } })
      engine.slide(3)
      engine.finish()
      expect(lms.sets).toEqual([])
    })

    it('keeps code changes, rebuilt for LiaScript in the next session', () => {
      const first = start({ version })
      const original = [project(['main.js', 'console.log(1)'])]

      // opening the slide: LiaScript stores its projects, nothing to save yet
      expect(first.engine.load('code', 6)).toBeNull()
      first.engine.store('code', 6, original)
      first.clock.advance(TIMING.latest)
      expect(first.lms.byId()['C7.1_Run_this'].learner_response ?? first.lms.byId()['C7.1_Run_this'].student_response).toBeUndefined()

      // the learner edits and runs the code
      first.engine.update('code', 6, (projects) => {
        projects[0].file[0].code = 'console.log(2)'
        projects[0].version.push({ hashes: ['x'], log: projects[0].log })
        projects[0].version_active = 1
        return projects
      })
      first.clock.advance(TIMING.quiet)

      // a project that was only run, not changed, is not reported
      const twin = start({ version })
      twin.engine.load('code', 6)
      twin.engine.store('code', 6, original)
      twin.engine.update('code', 6, (projects) => {
        projects[0].log = { ok: true, level: 0, messages: ['ran'], details: [] }
        return projects
      })
      twin.clock.advance(TIMING.latest)
      expect(Object.keys(twin.lms.byId()['C7.1_Run_this'])).toEqual(['id', 'type'])

      const code = first.lms.byId()['C7.1_Run_this']
      expect(code[version === '1.2' ? 'student_response' : 'learner_response']).toBe('console.log(2)')
      expect(code.result).toBe('neutral')

      const second = session(first.lms.next(), version)
      const [restored] = second.engine.load('code', 6)
      expect(restored.file[0].code).toBe('console.log(2)')
      expect(restored.version).toEqual([{ hashes: [md5('console.log(2)')], log: expect.any(Object) }])
    })

    it('starts a slide’s code afresh if its code blocks changed since', () => {
      const first = start({ version })
      first.engine.load('code', 6)
      first.engine.store('code', 6, [project(['main.js', 'console.log(1)'])])
      first.engine.update('code', 6, (projects) => {
        projects[0].file[0].code = 'console.log(2)'
        return projects
      })
      first.clock.advance(TIMING.quiet)

      // the author added a second code block to the slide
      const changed = meta()
      changed.slides[6].code.push({ question: 'More', files: [{ name: 'more.js', lang: 'js' }] })
      const second = session(first.lms.next(), version, { meta: changed } as any)

      expect(second.engine.load('code', 6)).toBeNull()
      expect(second.warn).toHaveBeenCalledWith(expect.stringContaining('the course changed'), 'code 6')
    })

    it('reads the classic connector’s settings and starts afresh', () => {
      const { engine, lms } = start({ version, stored: { 'cmi.suspend_data': '{"mode":"Slides"}' } })
      expect(engine.settings()).toEqual({ mode: 'Slides' })
      expect(lms.refusals).toEqual([])
    })

    it('leaves data of a newer format alone', () => {
      const { engine, lms, warn } = start({ version, stored: { 'cmi.suspend_data': 'LS2Zxyz' } })
      check(engine, 0, { solved: 1, trial: 1, state: { Text: 'Paris' } })
      engine.finish()
      expect(lms.stored['cmi.suspend_data']).toBe('LS2Zxyz')
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('newer version'))
    })

    it('keeps the checked answer when the solution is revealed', () => {
      const { engine, lms } = start({ version })
      const field = version === '1.2' ? 'student_response' : 'learner_response'
      const id = 'Q14.3_MKQuizMultiple_Which_are_programming_languages'

      check(engine, 2, { solved: 0, trial: 1, state: { MultipleChoice: [true, false, true] } })
      check(engine, 2, { solved: -1, trial: 1, state: { MultipleChoice: [true, true, false] } })

      expect(lms.byId()[id][field]).toBe(version === '1.2' ? 'Python; HTML' : 'o1[,]o3')
      expect(lms.byId()[id].result).toBe(version === '1.2' ? 'wrong' : 'incorrect')
    })

    it('retries a refused answer in ASCII, then leaves the field alone', () => {
      const { engine, lms, warn } = start({ version, asciiOnly: true })
      const field = version === '1.2' ? 'student_response' : 'learner_response'

      check(engine, 0, { solved: 1, trial: 1, state: { Text: 'Grüße' } })
      expect(lms.byId()['Q14.1_MKQuizText_What_is_the_capital_of_France'][field]).toBe('Grusse')
      expect(warn).not.toHaveBeenCalled()
    })
  })
}

describe('status rules', () => {
  const solveAll = (engine: Engine, solved: (i: number) => number) => {
    const done = answered()
    done.quiz[13].forEach((quiz, i) => check(engine, i, { ...quiz, solved: solved(i), trial: 1 }))
    engine.store('survey', 14, done.survey[14])
  }

  it('1.2 without mastery: completed when everything is done', () => {
    const { engine, lms } = start({ version: '1.2' })
    solveAll(engine, (i) => (i < 6 ? 1 : 0))
    expect(lms.stored['cmi.core.lesson_status']).toBe('incomplete')
    check(engine, 6, { solved: -1, trial: 2 })
    expect(lms.stored['cmi.core.lesson_status']).toBe('completed')
    expect(lms.stored['cmi.core.score.raw']).toBe('85.71')
  })

  it('1.2 with mastery: passed or failed once everything is done, never back down', () => {
    const pass = start({ version: '1.2', mastery: '50' })
    solveAll(pass.engine, (i) => (i < 4 ? 1 : 0))
    // enough points, but not done: passed would end the attempt, and any
    // score would make Moodle set passed/failed when the learner leaves
    expect(pass.lms.stored['cmi.core.lesson_status']).toBe('incomplete')
    expect(pass.lms.stored['cmi.core.score.raw']).toBeUndefined()

    check(pass.engine, 4, { solved: -1, trial: 2 })
    check(pass.engine, 5, { solved: -1, trial: 2 })
    expect(pass.lms.stored['cmi.core.lesson_status']).toBe('incomplete')
    check(pass.engine, 6, { solved: -1, trial: 2 })
    expect(pass.lms.stored['cmi.core.lesson_status']).toBe('passed')
    expect(pass.lms.stored['cmi.core.score.raw']).toBe('57.14')

    const fail = start({ version: '1.2', mastery: '90' })
    solveAll(fail.engine, (i) => (i < 4 ? 1 : -1))
    expect(fail.lms.stored['cmi.core.lesson_status']).toBe('failed')

    // a later session with a reset state does not lower the status
    const again = session(pass.lms.next({ stored: { 'cmi.core.lesson_status': 'passed' } }), '1.2')
    expect(again.lms.sets.some(([key]) => key === 'cmi.core.lesson_status')).toBe(false)
  })

  it('2004 with a passing score: success separate from completion', () => {
    const { engine, lms } = start({ version: '2004', mastery: '0.5' })
    expect(lms.stored['cmi.success_status']).toBeUndefined()

    solveAll(engine, (i) => (i < 4 ? 1 : 0))
    expect(lms.stored['cmi.success_status']).toBe('passed')
    expect(lms.stored['cmi.completion_status']).toBe('incomplete')
    expect(lms.stored['cmi.score.raw']).toBe('4')
    expect(lms.stored['cmi.score.max']).toBe('7')

    check(engine, 4, { solved: -1, trial: 2 })
    check(engine, 5, { solved: -1, trial: 2 })
    check(engine, 6, { solved: -1, trial: 2 })
    expect(lms.stored['cmi.completion_status']).toBe('completed')
    expect(lms.stored['cmi.progress_measure']).toBe('1')
    expect(lms.refusals).toEqual([])
  })

  it('2004 without a passing score: no success status at all', () => {
    const { engine, lms } = start({ version: '2004' })
    solveAll(engine, () => 1)
    expect(lms.stored['cmi.completion_status']).toBe('completed')
    expect(lms.sets.some(([key]) => key === 'cmi.success_status')).toBe(false)
  })

  it('treats a mastery score of 0 as none', () => {
    const { engine, lms } = start({ version: '1.2', mastery: '0' })
    expect(lms.stored['cmi.core.lesson_status']).toBe('incomplete')
    solveAll(engine, (i) => (i < 6 ? 1 : -1))
    expect(lms.stored['cmi.core.lesson_status']).toBe('completed')
  })

  it('uses window.MASTERY_SCORE when the LMS has none', () => {
    const { engine, lms } = session(new FakeLMS({ version: '2004' }), '2004', { mastery: 0.5 })
    solveAll(engine, (i) => (i < 4 ? 1 : 0))
    expect(lms.stored['cmi.success_status']).toBe('passed')
  })
})

describe('limits', () => {
  it('falls back to a smaller suspend_data when the LMS refuses it', () => {
    // code that packs to between 2000 and 4096 characters
    const noisy = (n: number) => Array.from({ length: n }, (_, i) => ((i * 7919) % 9973).toString(36)).join(' ')
    const packed = (code: string) => {
      const snapshot = Codec.emptySnapshot(defaults)
      snapshot.code[6] = [project(['main.js', code])]
      return Codec.pack(Codec.encodeSnapshot(snapshot, defaults)).length
    }
    let n = 100
    while (packed(noisy(n)) < 3000) n += 50
    const noise = noisy(n)
    expect(packed(noise)).toBeLessThan(4096)
    const { engine, lms, warn } = start({ version: '1.2', suspendLimit: 2000 })

    engine.load('code', 6)
    engine.store('code', 6, [project(['main.js', ''])])
    engine.update('code', 6, (projects) => {
      projects[0].file[0].code = noise
      return projects
    })
    engine.flush()

    expect(lms.stored['cmi.suspend_data'].length).toBeLessThanOrEqual(2000)
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('refused'), expect.anything())
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('limited to 2000'), 'code of slide 7')
  })

  it('an LMS without an API stores nothing and does not throw', () => {
    const engine = new Engine(null, { profile: profile('1.2'), defaults }, new FakeClock())
    engine.start()
    check(engine, 0, { solved: 1, trial: 1 })
    engine.slide(2)
    engine.finish()
    expect(engine.load('quiz', 13)[0].solved).toBe(1)
  })
})
