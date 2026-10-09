/*
 * How the xAPI connector describes quizzes, surveys, task lists and code to
 * the LRS (LiaScript/src/typescript/connectors/SCORMSuspend/report.ts,
 * `interaction`): readable names, xAPI interaction types, and responses in
 * the formats the xAPI specification defines for each type.
 */
import { describe, expect, it } from 'vitest'
import * as Report from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/report'
import type { Snapshot } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/codec'
import { answered, defaults, meta } from '../scorm-suspend/fixture-meta'

const TYPES = [
  'true-false',
  'choice',
  'fill-in',
  'long-fill-in',
  'matching',
  'performance',
  'sequencing',
  'likert',
  'numeric',
  'other',
]

const stateOf = (snapshot: Snapshot, item: Report.Item) =>
  item.table === 'code'
    ? snapshot.code[item.slide]?.[item.index]
    : (snapshot as any)[item.table][item.slide]?.[item.index]

function all(snapshot = answered()) {
  return Report.catalogue(defaults, meta(), Infinity).map((item) => ({
    item,
    interaction: Report.interaction(item, stateOf(snapshot, item), 'en'),
  }))
}

const find = (id: string) => all().find((entry) => entry.item.id.startsWith(id))!.interaction

const ids = (list?: { id: string }[]) => (list || []).map((entry) => entry.id)

describe('interaction', () => {
  it('uses only xAPI interaction types, as cmi.interaction activities', () => {
    for (const { interaction } of all()) {
      expect(interaction.definition.type).toBe('http://adlnet.gov/expapi/activities/cmi.interaction')
      expect(TYPES).toContain(interaction.definition.interactionType)
    }
  })

  it('answers with the ids it defines: choice ids joined by [,], matching pairs by [.]', () => {
    for (const { interaction } of all()) {
      const { definition, response } = interaction
      const patterns = definition.correctResponsesPattern || []

      if (definition.interactionType === 'choice') {
        for (const value of [response, ...patterns].filter((v) => v)) {
          for (const id of value!.split('[,]')) expect(ids(definition.choices)).toContain(id)
        }
      }

      if (definition.interactionType === 'matching') {
        for (const value of [response, ...patterns].filter((v) => v)) {
          for (const pair of value!.split('[,]')) {
            const [source, target] = pair.split('[.]')
            expect(ids(definition.source)).toContain(source)
            expect(ids(definition.target)).toContain(target)
          }
        }
      }

      // components belong to their type only (strict LRS reject others)
      if (definition.choices) expect(definition.interactionType).toBe('choice')
      if (definition.source || definition.target) expect(definition.interactionType).toBe('matching')
    }
  })

  it('names a quiz by its question, lists the options and the solution', () => {
    const multiple = find('Q14.3')

    expect(multiple.definition.name).toEqual({ en: 'MKQuizMultiple Which are programming languages?' })
    expect(multiple.definition.interactionType).toBe('choice')
    expect(multiple.definition.choices).toEqual([
      { id: 'o1', description: { en: 'Python' } },
      { id: 'o2', description: { en: 'JavaScript' } },
      { id: 'o3', description: { en: 'HTML' } },
    ])
    expect(multiple.definition.correctResponsesPattern).toEqual(['o1[,]o2'])
    expect(multiple.response).toBe('o1[,]o3')
    expect(multiple.answer).toBe('Python; HTML')
    // for views that do not show choices
    expect(multiple.definition.description.en).toContain('o3=HTML')
  })

  it('reports text, gaps and matrices in xAPI formats', () => {
    expect(find('Q14.1')).toMatchObject({
      definition: { interactionType: 'fill-in', correctResponsesPattern: ['Paris'] },
      response: 'Paris',
      answer: 'Paris',
    })

    expect(find('Q14.5')).toMatchObject({
      definition: { interactionType: 'fill-in', correctResponsesPattern: ['Berlin[,]Rome'] },
      response: 'Berlin[,]Rome',
      answer: 'Berlin | Rome',
    })

    const matrix = find('Q14.6')
    expect(matrix.definition.interactionType).toBe('matching')
    expect(ids(matrix.definition.source)).toEqual(['r1', 'r2', 'r3'])
    expect(matrix.definition.target).toContainEqual({ id: 'c2', description: { en: 'Paris' } })
    expect(matrix.response).toBe('r1[.]c1[,]r2[.]c2[,]r3[.]c3')
    expect(matrix.definition.correctResponsesPattern).toEqual(['r1[.]c1[,]r2[.]c2[,]r3[.]c3'])
  })

  it('leaves out the answer of a revealed solution, which is not the learner’s', () => {
    const resolved = find('Q14.4')

    expect(resolved.response).toBeUndefined()
    expect(resolved.answer).toBeUndefined()
    expect(resolved.definition.correctResponsesPattern).toEqual(['blue'])
  })

  it('reports surveys with their own keys and readable labels', () => {
    const single = find('S15.1')

    expect(single.definition.interactionType).toBe('choice')
    expect(ids(single.definition.choices)).toEqual(['good', 'bad'])
    expect(single.response).toBe('good')
    expect(single.answer).toBe('It is good')
    expect(single.definition.correctResponsesPattern).toBeUndefined()

    expect(find('S15.2').answer).toBe('Artificial intelligence; Web development')
  })

  it('keeps real line breaks and quotes in long texts', () => {
    const textarea = find('S15.4')

    expect(textarea.definition.interactionType).toBe('long-fill-in')
    expect(textarea.answer).toBe('{lang=de} line one\nline two\r\n"three" [,] [.]')
    // [,] separates fill-in answers, so it cannot stand in one
    expect(textarea.response).toBe('{lang=de} line one\nline two\r\n"three" [ ,] [ .]')
  })

  it('reports a task list as a choice of its items', () => {
    const task = find('T3.1')

    expect(task.definition.interactionType).toBe('choice')
    expect(task.definition.choices).toEqual([
      { id: 'i1', description: { en: 'MKTaskDone completed task' } },
      { id: 'i2', description: { en: 'MKTaskOpen open task' } },
    ])
    expect(task.response).toBe('i2')
    expect(task.answer).toBe('[ ] MKTaskDone completed task; [x] MKTaskOpen open task')
  })

  it('reports code as readable long-fill-in text', () => {
    const code = find('C7.1')

    expect(code.definition.interactionType).toBe('long-fill-in')
    expect(code.definition.name).toEqual({ en: 'Run this' })
    expect(code.definition.description.en).toContain('main.js')
    expect(code.response).toBe('console.log("hi")\n// done')
    // the response already is plain text, and the statement carries the code
    // of the whole slide besides: no third copy
    expect(code.answer).toBeUndefined()
  })

  it('names an element without a question after its slide', () => {
    const items = Report.catalogue(defaults, meta(), Infinity)
    // the task list of slide 3 has no paragraph in front of it
    const task = items.find((item) => item.id.startsWith('T3.1'))!

    const named = Report.interaction(task, [false, true], 'en')
    expect(named.definition.name.en).toBe('Lists and Tasks (Task 1)')
  })

  it('describes an element before it is answered, without a response', () => {
    const items = Report.catalogue(defaults, meta(), Infinity)
    const quiz = items.find((item) => item.id.startsWith('Q14.3'))!
    const fresh = Report.interaction(quiz, defaults.quiz[13][2], 'en')

    expect(fresh.definition.choices).toHaveLength(3)
    expect(fresh.response).toBeUndefined()
    expect(fresh.answer).toBeUndefined()
  })

  it('cuts only very long answers, and says how much is missing', () => {
    const snapshot = answered()
    snapshot.survey[14][3] = { submitted: true, state: { Text: 'x'.repeat(20000) } }
    const long = all(snapshot).find((entry) => entry.item.id.startsWith('S15.4'))!.interaction

    expect(long.answer!.length).toBeLessThanOrEqual(10000)
    expect(long.answer).toMatch(/…\[\+\d+\]$/)
  })
})

describe('interaction without or with partial descriptions', () => {
  const quiz = (meta: any, state: any): Report.Item =>
    ({ table: 'quiz', slide: 0, index: 0, id: 'Q1.1', title: 'Slide', meta, weight: 1 }) as Report.Item
  const survey = (meta: any): Report.Item =>
    ({ table: 'survey', slide: 0, index: 0, id: 'S1.1', title: 'Slide', meta, weight: 1 }) as Report.Item

  it('accepts every correct option of a selection', () => {
    const item = quiz({ type: 'select', question: 'Pick', options: ['a', 'b', 'c'], solution: [0, 2] }, null)
    const described = Report.interaction(item, { solved: 1, trial: 1, state: { Select: 2 } }, 'en')

    expect(described.definition.correctResponsesPattern).toEqual(['o1', 'o3'])
    expect(described.response).toBe('o3')
  })

  it('lists every id the response uses, even without option labels', () => {
    const described = Report.interaction(quiz(undefined, null), { solved: 1, trial: 1, state: { Select: 1 } }, 'en')

    expect(described.response).toBe('o2')
    expect(ids(described.definition.choices)).toContain('o2')

    const submitted = Report.interaction(survey(undefined), { submitted: true, state: { Select: 3 } }, 'en')
    expect(ids(submitted.definition.choices)).toContain('o4')
  })

  it('gives survey options unique ids, whatever their keys', () => {
    const described = Report.interaction(
      survey(undefined),
      { submitted: true, state: { MultipleChoice: { o2: true, 'a b': false } } },
      'en'
    )
    const choices = ids(described.definition.choices)

    expect(new Set(choices).size).toBe(choices.length)
    expect(described.response).toBe(choices[0])
  })
})

describe('language', () => {
  it('uses the course language as language map key, en-US otherwise', () => {
    expect(Report.language({ ...meta(), lang: 'de' })).toBe('de')
    expect(Report.language({ ...meta(), lang: 'pt-BR' })).toBe('pt-BR')
    expect(Report.language({ ...meta(), lang: '' })).toBe('en-US')
    expect(Report.language({ ...meta(), lang: 'not a tag' })).toBe('en-US')
    expect(Report.language(null)).toBe('en-US')
  })
})

describe('catalogue', () => {
  it('lists every element when no limit applies', () => {
    expect(Report.catalogue(defaults, meta(), Infinity)).toHaveLength(Report.catalogue(defaults, meta()).length)
  })
})
