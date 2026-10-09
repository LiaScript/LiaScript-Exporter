/*
 * The suspend_data codec of the SCORM "suspend" connectors
 * (LiaScript/src/typescript/connectors/SCORMSuspend/codec.ts), against the
 * initial state of the fixture course (tests/fixtures/course).
 */
import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import * as Codec from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/codec'
import * as Base64 from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/base64url'
import { md5 } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/md5'
import fixture from './fixture-config.json'

const defaults: Codec.Defaults = fixture as any
const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value))

/** The fixture course after a learner answered everything. */
function answered(): Codec.Snapshot {
  const snapshot = Codec.emptySnapshot(defaults)
  const quiz = snapshot.quiz[13]

  quiz[0] = { ...quiz[0], solved: 1, trial: 1, state: { Text: 'Paris' } }
  quiz[1] = { ...quiz[1], solved: 1, trial: 2, hint: 1, state: { SingleChoice: [false, true, false] } }
  quiz[2] = { ...quiz[2], solved: 0, trial: 1, state: { MultipleChoice: [true, false, true] }, error_msg: 'try again' }
  quiz[3] = { ...quiz[3], solved: -1, trial: 3, state: { Multi: [{ Select: 0 }] } }
  quiz[4] = { ...quiz[4], solved: 1, trial: 1, state: { Multi: [{ Text: 'Berlin' }, { Text: 'Rome' }] } }
  quiz[5] = {
    ...quiz[5],
    solved: 1,
    trial: 1,
    state: {
      Matrix: [
        { SingleChoice: [true, false, false] },
        { SingleChoice: [false, true, false] },
        { SingleChoice: [false, false, true] },
      ],
    },
  }

  const survey = snapshot.survey[14]
  survey[0] = { submitted: true, state: { MultipleChoice: { bad: false, good: true } } }
  survey[1] = { submitted: true, state: { SingleChoice: { ai: true, web: true } } }
  survey[2] = { submitted: true, state: { Text: 'Grüße 😀 "quoted" {braces}\nsecond line' } }

  snapshot.task[2] = [[false, true]]
  snapshot.settings = { mode: 'Slides', theme: 'red' }
  snapshot.visited = 14
  snapshot.index = { hash: 'abc12345', base: 0 }

  return snapshot
}

function project(...files: Array<[string, string]>) {
  // what Elm sends for a project; version and repository are rebuilt anyway
  return {
    file: files.map(([name, code], i) => ({ lang: 'js', name, code, visible: i === 0, fullscreen: false })),
    version: [{ hashes: [], log: { ok: true, level: -1, messages: [], details: [] } }],
    version_active: 0,
    log: { ok: true, level: -1, messages: [], details: [] },
    repository: {},
  }
}

describe('md5 and base64url', () => {
  it('md5 matches node:crypto, including multi-byte text', () => {
    for (const text of ['', 'a', 'console.log("hi")', 'Grüße 😀', 'x'.repeat(1000)]) {
      expect(md5(text)).toBe(createHash('md5').update(text, 'utf8').digest('hex'))
    }
  })

  it('base64url round-trips bytes and uses only safe characters', () => {
    const bytes = Uint8Array.from({ length: 70000 }, (_, i) => (i * 37) % 256)
    const text = Base64.encode(bytes)
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(Array.from(Base64.decode(text))).toEqual(Array.from(bytes))
    expect(() => Base64.decode('not base64!')).toThrow()
  })
})

describe('state values', () => {
  it('round-trips every quiz, survey and task kind of the fixture', () => {
    const snapshot = answered()
    const payload = Codec.encodeSnapshot(snapshot, defaults)
    const { snapshot: back, skipped } = Codec.decodePayload(payload, defaults)

    expect(skipped).toEqual([])
    expect(back.quiz).toEqual(snapshot.quiz)
    expect(back.survey).toEqual(snapshot.survey)
    expect(back.task).toEqual(snapshot.task)
    expect(back.settings).toEqual(snapshot.settings)
    expect(back.visited).toBe(14)
    expect(back.index).toEqual({ hash: 'abc12345', base: 0 })
  })

  it('stores nothing for a learner who has not done anything', () => {
    const payload = Codec.encodeSnapshot(Codec.emptySnapshot(defaults), defaults)
    expect(payload).toEqual([0, [], [], [], [], 0, 0])
  })

  it('keeps survey option ids that the classic connectors would rename', () => {
    const initial = { submitted: false, state: { SingleChoice: { sc: false, tx: false, '10': false, '2': false } } }
    const local = { quiz: [], survey: [[initial]], task: [] }
    const snapshot = Codec.emptySnapshot(local)
    snapshot.survey[0][0] = { submitted: true, state: { SingleChoice: { sc: true, tx: false, '10': true, '2': false } } }

    const { snapshot: back } = Codec.decodePayload(Codec.encodeSnapshot(snapshot, local), local)
    expect(back.survey[0][0]).toEqual(snapshot.survey[0][0])
  })

  it('stores long choice vectors as a bit string', () => {
    const n = 40
    const initial = { solved: 0, state: { MultipleChoice: Array(n).fill(false) }, trial: 0, hint: 0, error_msg: '', score: 1 }
    const local = { quiz: [[initial]], survey: [], task: [] }
    const snapshot = Codec.emptySnapshot(local)
    const bools = Array.from({ length: n }, (_, i) => i % 3 === 0)
    snapshot.quiz[0][0] = { ...initial, trial: 1, state: { MultipleChoice: bools } }

    const { snapshot: back } = Codec.decodePayload(Codec.encodeSnapshot(snapshot, local), local)
    expect(back.quiz[0][0].state.MultipleChoice).toEqual(bools)
  })
})

describe('course changes', () => {
  it('drops only the entries that no longer fit the course', () => {
    const payload = Codec.encodeSnapshot(answered(), defaults)

    // the course was edited: quiz 1 gained an option, quiz 5 is gone
    const edited = clone(defaults)
    edited.quiz[13][1].state.SingleChoice.push(false)
    edited.quiz[13].splice(5)

    const { snapshot, skipped } = Codec.decodePayload(payload, edited)

    expect(skipped).toEqual(['quiz 13.1', 'quiz 13.5'])
    expect(snapshot.quiz[13][0].state).toEqual({ Text: 'Paris' })
    expect(snapshot.quiz[13][1]).toEqual(edited.quiz[13][1])
    expect(snapshot.survey[14][2].state.Text).toContain('second line')
  })
})

describe('code projects', () => {
  it('keeps the current files and rebuilds what Elm needs to load them', () => {
    const snapshot = Codec.emptySnapshot(defaults)
    snapshot.code[6] = [project(['main.js', 'console.log(1)']), project(['a.js', 'let a'], ['b.js', 'let b'])]

    const { snapshot: back } = Codec.decodePayload(Codec.encodeSnapshot(snapshot, defaults), defaults)
    const [one, two] = back.code[6]!

    expect(one.file).toEqual(snapshot.code[6]![0].file)
    expect(two.file.map((f: any) => f.code)).toEqual(['let a', 'let b'])
    expect(two.version).toEqual([{ hashes: [md5('let a'), md5('let b')], log: expect.any(Object) }])
    expect(two.repository).toEqual({ [md5('let a')]: 'let a', [md5('let b')]: 'let b' })
    expect(two.version_active).toBe(0)
  })
})

describe('packing', () => {
  it('round-trips through the header and compression', () => {
    const payload = Codec.encodeSnapshot(answered(), defaults)
    const text = Codec.pack(payload)

    expect(text.startsWith('LS1Z')).toBe(true)
    expect(text).toMatch(/^[A-Za-z0-9_-]+$/)
    expect(Codec.unpack(text)).toEqual({ kind: 'ok', payload })
  })

  it('recognizes empty, classic, newer and broken data', () => {
    expect(Codec.unpack('')).toEqual({ kind: 'empty' })
    expect(Codec.unpack(null)).toEqual({ kind: 'empty' })
    expect(Codec.unpack('{"mode":"Slides"}')).toEqual({ kind: 'legacy', settings: { mode: 'Slides' } })
    expect(Codec.unpack('LS2Zabc')).toEqual({ kind: 'future' })
    expect(Codec.unpack('LS1Z!!!').kind).toBe('corrupt')
    expect(Codec.unpack('LS1Zabcdef').kind).toBe('corrupt')
    expect(Codec.unpack('random').kind).toBe('corrupt')
  })

  it('is far smaller than the classic connectors need', () => {
    const text = Codec.pack(Codec.encodeSnapshot(answered(), defaults))
    // classic: 690 characters for the quiz table plus ~260 for settings
    expect(text.length).toBeLessThan(400)
    console.log(`fixture course, everything answered: ${text.length} characters`)
  })
})

describe('budget', () => {
  /** 50 answered quizzes plus code, larger than SCORM 1.2 allows. */
  function large() {
    const initial = clone(defaults.quiz[13])
    const local: Codec.Defaults = { quiz: [], survey: clone(defaults.survey), task: clone(defaults.task) }
    for (let s = 0; s < 8; s++) local.quiz.push(clone(initial))

    const snapshot = Codec.emptySnapshot(local)
    snapshot.quiz.forEach((slide) =>
      slide.forEach((quiz, i) => {
        slide[i] = { ...quiz, trial: 2, hint: 1, solved: i % 2 ? 1 : -1 }
        if (quiz.state.Text !== undefined) slide[i].state = { Text: 'answer ' + i }
      })
    )
    // code that does not compress well
    const noise = (n: number) => Array.from({ length: n }, (_, i) => ((i * 7919) % 9973).toString(36)).join(' ')
    snapshot.code[1] = [project(['big.js', noise(2500)])]
    snapshot.code[2] = [project(['small.js', noise(300)])]
    return { snapshot, local }
  }

  it('fits SCORM 1.2 by leaving out code first, keeping every quiz', () => {
    const { snapshot, local } = large()
    const unlimited = Codec.pack(Codec.encodeSnapshot(snapshot, local))
    expect(unlimited.length).toBeGreaterThan(4096)

    const { text, dropped } = Codec.fit(snapshot, local, 4096)

    expect(text.length).toBeLessThanOrEqual(4096)
    expect(dropped[0]).toBe('code of slide 2')
    expect(dropped.some((d) => d.startsWith('quiz'))).toBe(false)

    const unpacked = Codec.unpack(text)
    expect(unpacked.kind).toBe('ok')
    const { snapshot: back } = Codec.decodePayload((unpacked as any).payload, local)
    expect(back.quiz).toEqual(snapshot.quiz)
  })

  it('drops quizzes only as the last resort, from the end', () => {
    const { snapshot, local } = large()

    // just below what the quizzes alone need, with hints and messages
    const quizzesOnly = { ...snapshot, code: [], survey: clone(local.survey), task: clone(local.task) }
    const limit = Codec.pack(Codec.encodeSnapshot(quizzesOnly, local)).length - 1
    const { text, dropped } = Codec.fit(snapshot, local, limit)

    expect(text.length).toBeLessThanOrEqual(limit)
    expect(dropped).toContain('quiz hints and messages')
    expect(dropped[dropped.length - 1]).toMatch(/^quiz \d+\.\d+$/)
  })

  it('leaves a payload that fits untouched', () => {
    const { text, dropped } = Codec.fit(answered(), defaults, 4096)
    expect(dropped).toEqual([])
    expect(text).toBe(Codec.pack(Codec.encodeSnapshot(answered(), defaults)))
  })
})
