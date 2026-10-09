/*
 * What the suspend connectors report to the LMS as interactions
 * (LiaScript/src/typescript/connectors/SCORMSuspend/report.ts): readable,
 * and accepted by the strictest LMS checks we know (strict-lms.ts).
 */
import { describe, expect, it } from 'vitest'
import * as Report from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/report'
import type { Snapshot } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/codec'
import { answered, defaults, meta, project } from './fixture-meta'
import { check } from './strict-lms'

const stateOf = (snapshot: Snapshot, item: Report.Item) =>
  item.table === 'code'
    ? snapshot.code[item.slide]?.[item.index]
    : (snapshot as any)[item.table][item.slide]?.[item.index]

/** Every value as a strict LMS would receive it; returns the refusals. */
function refusals(version: Report.Version, n: number, item: Report.Item, report: Report.Report) {
  const base = `cmi.interactions.${n}.`
  const values: Array<[string, string | undefined]> = [
    ['id', item.id],
    ['type', report.type],
    [version === '1.2' ? 'student_response' : 'learner_response', report.response],
    ['correct_responses.0.pattern', report.pattern],
    ['result', report.result],
    ['weighting', report.weighting],
  ]
  if (version === '2004') values.push(['description', report.description])

  return values
    .filter(([, value]) => value !== undefined)
    .map(([name, value]) => check(version, base + name, value!, report.type))
    .filter((reason) => reason !== null)
}

function reports(version: Report.Version, snapshot = answered()) {
  const items = Report.catalogue(defaults, meta())
  return items.map((item) => ({ item, report: Report.report(item, stateOf(snapshot, item), version) }))
}

const find = (all: ReturnType<typeof reports>, id: string) => all.find((r) => r.item.id.startsWith(id))!.report!

describe('catalogue', () => {
  it('lists quizzes, surveys, tasks and code per slide, with readable ids', () => {
    const ids = Report.catalogue(defaults, meta()).map((item) => item.id)
    expect(ids).toEqual([
      'T3.1_Lists_and_Tasks',
      'C7.1_Run_this',
      'Q14.1_MKQuizText_What_is_the_capital_of_France',
      'Q14.2_MKQuizSingle_What_is_2_2',
      'Q14.3_MKQuizMultiple_Which_are_programming_languages',
      'Q14.4_MKQuizSelection_The_sky_is_1',
      'Q14.5_MKQuizGap_The_capital_of_Germany_is_1_and_of_Italy_2',
      'Q14.6_MKQuizMatrix',
      'Q14.7_MKQuizGeneric_Script_driven_quiz',
      'S15.1_MKSurveySingle_How_satisfied_are_you',
      'S15.2_MKSurveyMultiple_Which_topics_interest_you',
      'S15.3_MKSurveyText_Your_reaction',
      'S15.4_MKSurveyTextarea_Describe_your_opinion',
    ])
    for (const id of ids) {
      expect(check('1.2', 'cmi.interactions.0.id', id)).toBeNull()
      expect(check('2004', 'cmi.interactions.0.id', id)).toBeNull()
    }
  })

  it('falls back to slide titles and plain ids without meta', () => {
    const ids = Report.catalogue(defaults, null).map((item) => item.id)
    expect(ids[0]).toBe('T3.1')
    expect(ids).toContain('Q14.7')
    expect(ids.some((id) => id.startsWith('C'))).toBe(false)
  })

  it('ignores meta that describes a different kind of quiz', () => {
    const wrong = meta()
    wrong.slides[13].quiz[0] = { type: 'single', question: 'Other', options: ['a'], solution: [true] }
    const item = Report.catalogue(defaults, wrong).find((i) => i.id.startsWith('Q14.1'))!
    expect(item.id).toBe('Q14.1_Quizzes')
    expect(item.meta).toBeUndefined()
  })

  it('keeps at most 250 interactions, quizzes first', () => {
    const many = { quiz: [Array(200).fill(defaults.quiz[13][0])], survey: [Array(100).fill(defaults.survey[14][2])], task: [] }
    const items = Report.catalogue(many, null)
    expect(items.length).toBe(Report.MAX_ITEMS)
    expect(items.filter((i) => i.table === 'quiz').length).toBe(200)
  })

  it('hashes the catalogue', () => {
    const a = Report.catalogueHash(Report.catalogue(defaults, meta()))
    expect(a).toMatch(/^[0-9a-f]{8}$/)
    expect(Report.catalogueHash(Report.catalogue(defaults, null))).not.toBe(a)
  })
})

describe('SCORM 1.2: readable text', () => {
  const all = reports('1.2')

  it('reports every answer as fill-in text a teacher can read', () => {
    expect(find(all, 'Q14.1')).toEqual({
      type: 'fill-in',
      response: 'Paris',
      pattern: 'Paris',
      result: 'correct',
      weighting: '1',
    })
    expect(find(all, 'Q14.2').response).toBe('4')
    expect(find(all, 'Q14.3')).toMatchObject({ response: 'Python; HTML', pattern: 'Python; JavaScript', result: 'wrong' })
    // revealed solution: counts as wrong
    expect(find(all, 'Q14.4')).toMatchObject({ response: 'blue', pattern: 'blue', result: 'wrong' })
    expect(find(all, 'Q14.5')).toMatchObject({ response: 'Berlin | Rome', pattern: 'Berlin | Rome' })
    expect(find(all, 'Q14.6').response).toBe('Germany: Berlin; France: Paris; Italy: Rome')
    expect(find(all, 'Q14.7')).toMatchObject({ result: 'correct' })
    expect(find(all, 'S15.1')).toMatchObject({ response: 'It is good', result: 'neutral' })
    expect(find(all, 'S15.2').response).toBe('Artificial intelligence; Web development')
    expect(find(all, 'T3.1').response).toBe('[ ] MKTaskDone completed task; [x] MKTaskOpen open task')
    expect(find(all, 'C7.1').response).toBe('console.log(＂hi＂)⏎// done')
  })

  it('passes the strict checks', () => {
    all.forEach(({ item, report }, n) => {
      expect(report, item.id).not.toBeNull()
      expect(refusals('1.2', n, item, report!), item.id).toEqual([])
    })
  })
})

describe('SCORM 2004: semantic types', () => {
  const all = reports('2004')

  it('uses choice and matching ids explained in the description', () => {
    expect(find(all, 'Q14.1')).toMatchObject({ type: 'fill-in', response: 'Paris', pattern: 'Paris' })
    expect(find(all, 'Q14.2')).toMatchObject({
      type: 'choice',
      response: 'o2',
      pattern: 'o2',
      result: 'correct',
      description: 'MKQuizSingle What is 2 + 2? [o1=3, o2=4, o3=5]',
    })
    expect(find(all, 'Q14.3')).toMatchObject({ response: 'o1[,]o3', pattern: 'o1[,]o2', result: 'incorrect' })
    expect(find(all, 'Q14.4')).toMatchObject({ type: 'fill-in', response: 'blue', pattern: 'blue', result: 'incorrect' })
    expect(find(all, 'Q14.5')).toMatchObject({ type: 'fill-in', response: 'Berlin[,]Rome' })
    expect(find(all, 'Q14.6')).toMatchObject({
      type: 'matching',
      response: 'r1[.]c1[,]r2[.]c2[,]r3[.]c3',
      pattern: 'r1[.]c1[,]r2[.]c2[,]r3[.]c3',
    })
    expect(find(all, 'Q14.6').description).toContain('r1=Germany')
    expect(find(all, 'Q14.7')).toEqual({
      type: 'other',
      result: 'correct',
      weighting: '1',
      description: 'MKQuizGeneric Script-driven quiz:',
    })
    expect(find(all, 'S15.1')).toMatchObject({
      type: 'choice',
      response: 'good',
      result: 'neutral',
      // the legend follows the course, not the (sorted) state keys
      description: 'MKSurveySingle How satisfied are you? [good=It is good, bad=It is bad]',
    })
    expect(find(all, 'T3.1').description).toBe('Lists and Tasks [i1=MKTaskDone completed task, i2=MKTaskOpen open task]')
    expect(find(all, 'S15.2')).toMatchObject({ type: 'choice', response: 'ai[,]web' })
    expect(find(all, 'S15.4').type).toBe('long-fill-in')
    expect(find(all, 'T3.1')).toMatchObject({ type: 'choice', response: 'i2' })
    expect(find(all, 'C7.1')).toMatchObject({ type: 'long-fill-in', response: 'console.log(＂hi＂)⏎// done' })
  })

  it('makes line breaks, quotes, braces and delimiters harmless', () => {
    expect(find(all, 'S15.3').response).toBe('Grüße 😀 ＂quoted＂ {braces}')
    expect(find(all, 'S15.4').response).toBe(' {lang=de} line one⏎line two⏎＂three＂ [,] [.]')
  })

  it('passes the strict checks', () => {
    all.forEach(({ item, report }, n) => {
      expect(report, item.id).not.toBeNull()
      expect(refusals('2004', n, item, report!), item.id).toEqual([])
    })
  })
})

describe('what is not reported', () => {
  it('skips quizzes never checked and surveys not submitted', () => {
    for (const version of ['1.2', '2004'] as const) {
      const fresh = reports(version, { ...answered(), quiz: JSON.parse(JSON.stringify(defaults.quiz)), survey: JSON.parse(JSON.stringify(defaults.survey)) })
      expect(fresh.filter((r) => r.item.table === 'quiz' || r.item.table === 'survey').every((r) => r.report === null)).toBe(true)
    }
  })
})

describe('limits', () => {
  const huge = 'x'.repeat(5000) + '\n' + '😀'.repeat(3000)

  it('cuts long text on character boundaries with a marker', () => {
    const cut = Report.sanitize(huge, 255)
    expect(cut.length).toBe(255)
    expect(cut).toMatch(/…\[\+7754\]$/)
    expect(Report.sanitize('😀'.repeat(300), 250)).toMatch(/^(😀)+…\[\+\d+\]$/u)
  })

  it('keeps long answers and code within every limit', () => {
    const snapshot = answered()
    snapshot.survey[14][3] = { submitted: true, state: { Text: huge } }
    snapshot.survey[14][2] = { submitted: true, state: { Text: huge } }
    snapshot.quiz[13][0] = { ...snapshot.quiz[13][0], state: { Text: huge } }
    snapshot.code[6] = [project(['a.js', huge], ['b.js', huge])]

    for (const version of ['1.2', '2004'] as const) {
      reports(version, snapshot).forEach(({ item, report }, n) => {
        expect(refusals(version, n, item, report!), `${version} ${item.id}`).toEqual([])
      })
    }
    expect(find(reports('2004', snapshot), 'C7.1').response!.startsWith('a.js:⏎xxx')).toBe(true)
  })

  it('reports long gap texts as one long-fill-in', () => {
    const initial = { solved: 0, trial: 0, hint: 0, error_msg: '', score: 2, state: { Multi: Array(12).fill({ Text: '' }) } }
    const local = { quiz: [[initial]], survey: [], task: [] }
    const [item] = Report.catalogue(local, null)
    const report = Report.report(item, { ...initial, solved: 1, trial: 1, state: { Multi: Array(12).fill({ Text: 'a[,]b' }) } }, '2004')!
    expect(report.type).toBe('long-fill-in')
    expect(report.weighting).toBe('2')
    expect(refusals('2004', 0, item, report)).toEqual([])
  })

  it('clamps 1.2 weighting to -100..100', () => {
    const initial = { ...defaults.quiz[13][0], score: 500 }
    const [item] = Report.catalogue({ quiz: [[initial]], survey: [], task: [] }, null)
    expect(Report.report(item, { ...initial, solved: 1, trial: 1 }, '1.2')!.weighting).toBe('100')
  })

  it('makes ascii slugs', () => {
    expect(Report.slug('Grüße, Welt! Ærø ß')).toBe('Grusse_Welt_AEro_ss')
    expect(Report.slug('😀 …')).toBe('')
    expect(Report.slug('a'.repeat(100)).length).toBe(60)
  })
})

describe('the strict checks themselves', () => {
  it('refuse what Moodle and ILIAS refuse', () => {
    const r = 'cmi.interactions.0.learner_response'
    expect(check('2004', r, 'a\nb', 'fill-in')).toMatch(/line break/)
    expect(check('2004', r, 'say "hi"', 'fill-in')).toMatch(/quote/)
    expect(check('2004', r, '{x}', 'fill-in')).not.toBeNull()
    expect(check('2004', r, 'x'.repeat(251), 'fill-in')).not.toBeNull()
    expect(check('2004', r, '', 'choice')).not.toBeNull()
    expect(check('2004', r, 'o1[,]o1', 'choice')).toMatch(/duplicate/)
    expect(check('2004', r, 'ö1', 'choice')).not.toBeNull()
    expect(check('2004', r, 'r1.c1', 'matching')).not.toBeNull()
    expect(check('2004', r, 'o1')).toMatch(/408/)
    expect(check('2004', 'cmi.interactions.0.timestamp', '2026-10-09T10:00:00Z')).not.toBeNull()
    expect(check('2004', 'cmi.interactions.0.timestamp', '2026-10-09T10:00:00')).toBeNull()
    expect(check('1.2', 'cmi.interactions.0.id', 'Q 1')).not.toBeNull()
    expect(check('1.2', 'cmi.interactions.0.result', 'incorrect')).not.toBeNull()
    expect(check('1.2', 'cmi.interactions.0.weighting', '101')).not.toBeNull()
    expect(check('1.2', 'cmi.core.score.raw', '150')).not.toBeNull()
    expect(check('1.2', 'cmi.interactions.0.student_response', '😀'.repeat(128))).not.toBeNull()
  })
})
