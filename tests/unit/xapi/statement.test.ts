/*
 * The xAPI statements LiaScript sends (connectors/XAPI/statement.ts) and the
 * code it stores in them (connectors/XAPI/code.ts). Restoring reads object
 * ids and the liascript extensions only, so those must not change when a
 * statement gets a readable description.
 */
import { describe, expect, it } from 'vitest'
import * as Statement from '../../../LiaScript/src/typescript/connectors/XAPI/statement'
import * as Code from '../../../LiaScript/src/typescript/connectors/XAPI/code'
import * as Report from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/report'
import { decodeProject } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/codec'
import { md5 } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/md5'
import { answered, defaults, meta, project } from '../scorm-suspend/fixture-meta'

const EXT = 'http://liascript.github.io/extensions/'
const actor = { objectType: 'Agent', name: 'Learner', mbox: 'mailto:learner@example.com' }
const course = 'https://example.com/course'

const item = (id: string) => Report.catalogue(defaults, meta(), Infinity).find((item) => item.id.startsWith(id))!

describe('answered statements', () => {
  const quiz = answered().quiz[13][2]
  const interaction = Report.interaction(item('Q14.3'), quiz, 'en')

  const plain = () =>
    Statement.generateAnsweredStatement(actor, course, 'Course', 13, 2, 'MultipleChoice', quiz.state, null, 0, 1, quiz, 'reg')
  const described = () =>
    Statement.generateAnsweredStatement(
      actor, course, 'Course', 13, 2, 'MultipleChoice', quiz.state, null, 0, 1, quiz, 'reg', undefined, false, interaction
    )

  it('keeps id, verb and everything restoring reads', () => {
    const before = plain()
    const after = described()

    expect(after.object.id).toBe(before.object.id)
    expect(after.verb).toEqual(before.verb)
    expect(after.object.definition.extensions).toEqual(before.object.definition.extensions)
    expect(after.object.definition.extensions[EXT + 'slideId']).toBe(13)
    expect(after.object.definition.extensions[EXT + 'quizIndex']).toBe(2)
    for (const key of ['state', 'trial', 'hint']) {
      expect(after.result.extensions[EXT + key]).toEqual(before.result.extensions[EXT + key])
    }
    expect(after.result.success).toBe(before.result.success)
    expect(after.result.completion).toBe(before.result.completion)
    expect(after.context.registration).toBe('reg')
  })

  it('describes the question and answers readably', () => {
    const statement = described()

    expect(statement.object.definition).toMatchObject({
      type: 'http://adlnet.gov/expapi/activities/cmi.interaction',
      name: { en: 'MKQuizMultiple Which are programming languages?' },
      interactionType: 'choice',
      correctResponsesPattern: ['o1[,]o2'],
    })
    expect(statement.result.response).toBe('o1[,]o3')
    expect(statement.result.extensions[EXT + 'answer']).toBe('Python; HTML')
  })

  it('leaves out a response the description has none for', () => {
    const resolved = answered().quiz[13][3]
    const statement = Statement.generateAnsweredStatement(
      actor, course, 'Course', 13, 3, 'Multi', resolved.state, false, 0, 1, resolved, 'reg', undefined, false,
      Report.interaction(item('Q14.4'), resolved, 'en')
    )

    expect('response' in statement.result).toBe(false)
    expect(EXT + 'answer' in statement.result.extensions).toBe(false)
  })

  it('encodes a survey without a description once, not twice', () => {
    const survey = answered().survey[14][2]
    const statement = Statement.generateAnsweredStatement(
      actor, course, 'Course', 14, 2, 'Survey', survey.state, survey.submitted, 0, 0, survey, 'reg', 2, true
    )

    expect(JSON.parse(statement.result.response)).toEqual(survey.state)
    expect(statement.object.definition.extensions[EXT + 'surveyIndex']).toBe(2)
    expect(statement.result.extensions[EXT + 'state']).toEqual(survey.state)
  })
})

describe('task statements', () => {
  it('keeps the task extensions and adds the description', () => {
    const state = [false, true]
    const before = Statement.generateTaskStatement(actor, course, 'Course', 2, 0, state, 'reg')
    const after = Statement.generateTaskStatement(
      actor, course, 'Course', 2, 0, state, 'reg', Report.interaction(item('T3.1'), state, 'en')
    )

    expect(after.object.id).toBe(before.object.id)
    expect(after.object.definition.extensions).toEqual(before.object.definition.extensions)
    expect(after.result.extensions[EXT + 'state']).toEqual(state)
    expect(after.object.definition.interactionType).toBe('choice')
    expect(after.result.response).toBe('i2')
    expect(after.result.extensions[EXT + 'answer']).toContain('[x] MKTaskOpen open task')
  })
})

describe('experienced statements', () => {
  it('names the slide in the course language', () => {
    const statement = Statement.generateExperiencedStatement(actor, course, 'Course', 2, '3. Lists and Tasks', 'reg', 'PT1S', 'de')

    expect(statement.object.definition.name).toEqual({ de: '3. Lists and Tasks' })
    expect(statement.object.definition.extensions[EXT + 'slideId']).toBe(2)
  })
})

describe('code', () => {
  const slide = () => [
    project(['main.js', 'console.log("changed")'], ['test.js', 'assert(true)']),
    project(['other.js', 'let x = 1']),
  ]

  it('sends one interacted statement per project, carrying the whole slide', () => {
    const projects = slide()
    const statement = Statement.generateCodeStatement(actor, course, 'Course', 6, 0, projects, 'reg')

    expect(statement.verb.id).toBe('http://adlnet.gov/expapi/verbs/interacted')
    expect(statement.object.id).toBe(`${course}/slides/6/code/0`)
    expect(statement.object.definition.type).toBe('http://adlnet.gov/expapi/activities/cmi.interaction')
    expect(statement.object.definition.interactionType).toBe('long-fill-in')
    expect(statement.object.definition.extensions).toEqual({ [EXT + 'slideId']: 6, [EXT + 'codeIndex']: 0 })
    expect(statement.object.definition.description['en-US']).toContain('main.js')
    // only the visible file of the first project, named as one of several
    expect(statement.result.response).toBe('main.js:\nconsole.log("changed")')
    expect(statement.result.extensions[EXT + 'code']).toEqual(Code.encodeSlide(projects))
    expect(statement.result.extensions[EXT + 'code']).toHaveLength(2)
    expect(statement.context.registration).toBe('reg')
  })

  it('uses the description of the code block, if there is one', () => {
    const projects = [project(['main.js', 'console.log("hi")'])]
    const statement = Statement.generateCodeStatement(
      actor, course, 'Course', 6, 0, projects, 'reg', Report.interaction(item('C7.1'), projects[0], 'en')
    )

    expect(statement.object.definition.name).toEqual({ en: 'Run this' })
    expect(statement.object.definition.extensions[EXT + 'codeIndex']).toBe(0)
    expect(statement.result.extensions[EXT + 'code']).toEqual(Code.encodeSlide(projects))
  })

  it('restores the same files and versions from a statement', () => {
    const projects = slide()
    const statement = Statement.generateCodeStatement(actor, course, 'Course', 6, 1, projects, 'reg')
    const restored = Code.restore([statement])[6]

    expect(restored).toHaveLength(2)
    restored.forEach((project: any, i: number) => {
      expect(project.file).toEqual(projects[i].file)
      expect(project.version[0].hashes).toEqual(projects[i].file.map((file: any) => md5(file.code)))
      expect(project).toEqual(decodeProject(Code.encodeSlide(projects)[i]))
    })
  })

  it('restores each slide from its newest code statement', () => {
    const older = Statement.generateCodeStatement(actor, course, 'Course', 6, 0, [project(['a.js', 'old'])], 'reg')
    const newer = Statement.generateCodeStatement(actor, course, 'Course', 6, 0, [project(['a.js', 'new'])], 'reg')
    const elsewhere = Statement.generateCodeStatement(actor, course, 'Course', 8, 0, [project(['b.js', 'b'])], 'reg')
    older.timestamp = '2026-01-01T10:00:00.000Z'
    newer.timestamp = '2026-01-01T11:00:00.000Z'
    elsewhere.timestamp = '2026-01-01T09:00:00.000Z'

    const restored = Code.restore([older, elsewhere, newer])

    expect(restored[6][0].file[0].code).toBe('new')
    expect(restored[8][0].file[0].code).toBe('b')
  })

  it('skips statements whose code is unreadable', () => {
    const broken = Statement.generateCodeStatement(actor, course, 'Course', 6, 0, [project(['a.js', 'x'])], 'reg')
    broken.result.extensions[EXT + 'code'] = [[['js', 'a.js', 42, 1]]]

    expect(Code.restore([broken])).toEqual({})
  })

  it('restores a slide only if its code blocks still match the course', () => {
    const projects = slide()
    const statement = Statement.generateCodeStatement(actor, course, 'Course', 6, 0, projects, 'reg')
    const blocks = (...files: string[][]) => ({
      question: '',
      files: files.map((name) => ({ name: name[0], lang: 'js' })),
    })
    const slides = (code: any[]) => {
      const list: any[] = Array.from({ length: 8 }, () => ({ title: '', quiz: [], survey: [], task: [], code: [] }))
      list[6].code = code
      return list
    }

    const same = slides([blocks(['main.js'], ['test.js']), blocks(['other.js'])])
    same[6].code[0].files = [{ name: 'main.js', lang: 'js' }, { name: 'test.js', lang: 'js' }]
    expect(Code.restore([statement], same)[6]).toHaveLength(2)

    // the author added a code block, or a slide moved the old one here
    expect(Code.restore([statement], slides([blocks(['main.js']), blocks(['other.js']), blocks(['new.js'])]))).toEqual({})
    expect(Code.restore([statement], slides([blocks(['main.py']), blocks(['other.js'])]))).toEqual({})

    // without a course description, as before
    expect(Code.restore([statement])[6]).toHaveLength(2)
  })

  it('counts a project as changed only if its files’ code changed', () => {
    const before = slide()

    const flipped = slide()
    flipped[0].file[1].visible = true
    expect(Code.changed(before, flipped)).toEqual([])

    const ran = slide()
    ran[0].log = { ok: true, level: 0, messages: ['ok' as never], details: [] }
    expect(Code.changed(before, ran)).toEqual([])

    const edited = slide()
    edited[1].file[0].code = 'let x = 2'
    expect(Code.changed(before, edited)).toEqual([1])

    expect(Code.changed(null, edited)).toEqual([0, 1])
  })
})
