/*
 * The H5P connector's virtual LMS (LiaScript connectors/H5P/adapter.ts) with
 * the real suspend engine: what reaches H5P's user state, when a result is
 * reported, and that a later session neither loses nor repeats anything.
 */
import { describe, expect, it, vi } from 'vitest'
import { Engine, TIMING } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/engine'
import { profile } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/profile'
import * as Adapter from '../../../LiaScript/src/typescript/connectors/H5P/adapter'
import { FakeClock } from '../scorm-suspend/fake-lms'
import { answered, defaults, meta } from '../scorm-suspend/fixture-meta'

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

class FakeBridge implements Adapter.Bridge {
  states: Adapter.State[] = []
  results: Adapter.Result[] = []
  constructor(
    public previousState?: unknown,
    public mastery?: number | null
  ) {}
  save(state: Adapter.State) {
    // H5P stores what getCurrentState returns as JSON
    this.states.push(JSON.parse(JSON.stringify(state)))
  }
  report(result: Adapter.Result) {
    this.results.push(clone(result))
  }
  get state() {
    return this.states[this.states.length - 1]
  }
}

function session(bridge: FakeBridge) {
  const clock = new FakeClock()
  const warn = vi.fn()
  const engine = new Engine(Adapter.connect(bridge, warn), { profile: profile('2004'), defaults, meta: meta(), warn }, clock)
  engine.start()
  return { engine, clock, warn, bridge }
}

/** what LiaScript sends when the learner checks quiz i of slide 13 */
function check(engine: Engine, i: number, change: any) {
  const slide = clone(engine.load('quiz', 13))
  slide[i] = { ...slide[i], ...change }
  engine.store('quiz', 13, slide)
}

function solveAll(engine: Engine, solved: (i: number) => number) {
  const done = answered()
  done.quiz[13].forEach((quiz, i) => check(engine, i, { ...quiz, solved: solved(i), trial: 1 }))
  engine.store('survey', 14, done.survey[14])
}

describe('H5P adapter', () => {
  it('saves state and position into the H5P user state', () => {
    const { engine, clock, bridge, warn } = session(new FakeBridge())
    check(engine, 0, { solved: 1, trial: 1, state: { Text: 'Paris' } })
    engine.slide(5)
    clock.advance(TIMING.latest)

    expect(bridge.state.v).toBe(Adapter.STATE_VERSION)
    expect(bridge.state.suspend).toMatch(/^LS1Z/)
    expect(bridge.state.location).toBe('5')
    expect(bridge.state.completion).toBe('incomplete')
    expect(bridge.results).toEqual([])
    expect(warn).not.toHaveBeenCalled()
  })

  it('restores the answers and the slide in the next session', () => {
    const first = session(new FakeBridge())
    check(first.engine, 0, { solved: 1, trial: 1, state: { Text: 'Paris' } })
    first.engine.slide(5)
    first.clock.advance(TIMING.latest)

    const second = session(new FakeBridge(first.bridge.state))
    expect(second.engine.load('quiz', 13)[0].state).toEqual({ Text: 'Paris' })
    expect(second.engine.location()).toBe(5)
    expect(second.warn).not.toHaveBeenCalled()
  })

  it('takes the state as a JSON string as well', () => {
    const first = session(new FakeBridge())
    check(first.engine, 0, { solved: 1, trial: 1, state: { Text: 'Paris' } })
    first.engine.flush()

    const second = session(new FakeBridge(JSON.stringify(first.bridge.state)))
    expect(second.engine.load('quiz', 13)[0].state).toEqual({ Text: 'Paris' })
  })

  it('starts afresh from a state that is not its own', () => {
    const { warn, engine } = session(new FakeBridge({ some: 'other library' }))
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/not from this version/))
    expect(engine.location()).toBe(null)
  })

  it('reports once the course is completed, with score and readable answers', () => {
    const { engine, bridge } = session(new FakeBridge())
    solveAll(engine, (i) => (i < 6 ? 1 : 0))
    engine.flush()
    expect(bridge.results).toEqual([])

    check(engine, 6, { solved: -1, trial: 2 })
    engine.flush()

    expect(bridge.results).toHaveLength(1)
    const [result] = bridge.results
    expect(result).toMatchObject({ raw: 6, max: 7, success: null })
    expect(result.scaled).toBeCloseTo(6 / 7, 4)

    const text = result.interactions.find((item) => item.id.startsWith('Q14.1_MKQuizText'))!
    expect(text).toMatchObject({ response: 'Paris', result: 'correct' })
    expect(text.description).toMatch(/capital of France/)
    expect(bridge.state.completion).toBe('completed')
  })

  it('does not report the same result again, not even after a reload', () => {
    const first = session(new FakeBridge())
    solveAll(first.engine, () => 1)
    first.engine.flush()
    first.engine.slide(3)
    first.engine.flush()
    expect(first.bridge.results).toHaveLength(1)

    const second = session(new FakeBridge(first.bridge.state))
    second.engine.slide(4)
    second.engine.flush()
    expect(second.bridge.results).toEqual([])
    expect(second.bridge.state.completion).toBe('completed')
  })

  it('passes or fails with a mastery score', () => {
    const pass = session(new FakeBridge(undefined, 0.5))
    solveAll(pass.engine, (i) => (i < 4 ? 1 : -1))
    pass.engine.flush()
    expect(pass.bridge.results.at(-1)).toMatchObject({ raw: 4, max: 7, success: true })

    const fail = session(new FakeBridge(undefined, 0.9))
    solveAll(fail.engine, (i) => (i < 4 ? 1 : -1))
    fail.engine.flush()
    expect(fail.bridge.results.at(-1)).toMatchObject({ raw: 4, max: 7, success: false })
  })

  it('reports a course without quizzes as completed, without a score', () => {
    const bridge = new FakeBridge()
    const clock = new FakeClock()
    const empty = { quiz: [], survey: [], task: [] }
    const engine = new Engine(Adapter.connect(bridge, vi.fn()), { profile: profile('2004'), defaults: empty, slides: 3 }, clock)
    engine.start()
    engine.slide(1)
    engine.slide(2)
    engine.flush()

    expect(bridge.results).toEqual([{ success: null, interactions: [] }])
  })

  it('tries a failed report again on the next commit', () => {
    const bridge = new FakeBridge()
    const report = vi.spyOn(bridge, 'report').mockImplementationOnce(() => {
      throw new Error('offline')
    })
    const { engine, warn } = session(bridge)
    // the last answer completes the course, it is reported (and fails) at once
    solveAll(engine, () => 1)
    expect(report).toHaveBeenCalledTimes(1)
    expect(bridge.results).toEqual([])
    expect(warn).toHaveBeenCalledWith(expect.stringMatching(/report: offline/))

    engine.slide(2)
    engine.flush()
    expect(report).toHaveBeenCalledTimes(2)
    expect(bridge.results).toHaveLength(1)

    engine.flush()
    expect(report).toHaveBeenCalledTimes(2)
  })
})
