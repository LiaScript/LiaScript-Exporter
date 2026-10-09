/*
 * The meta data the exporter will write for tests/fixtures/course, by hand,
 * plus the course state after a learner answered everything.
 */
import type { LiaMeta, SlideMeta } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/meta'
import * as Codec from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/codec'
import fixture from './fixture-config.json'

export const defaults: Codec.Defaults = fixture as any

const empty = (title: string): SlideMeta => ({ title, quiz: [], survey: [], task: [], code: [] })

export function meta(): LiaMeta {
  const slides = Array.from({ length: 22 }, (_, i) => empty(`Slide ${i + 1}`))

  slides[2] = {
    ...empty('Lists and Tasks'),
    task: [{ question: '', items: ['MKTaskDone completed task', 'MKTaskOpen open task'] }],
  }
  slides[6] = {
    ...empty('Code Blocks'),
    code: [{ question: 'Run this', files: [{ name: 'main.js', lang: 'js' }] }],
  }
  slides[13] = {
    ...empty('Quizzes'),
    quiz: [
      { type: 'text', question: 'MKQuizText What is the capital of France?', solution: 'Paris' },
      { type: 'single', question: 'MKQuizSingle What is 2 + 2?', options: ['3', '4', '5'], solution: [false, true, false] },
      {
        type: 'multiple',
        question: 'MKQuizMultiple Which are programming languages?',
        options: ['Python', 'JavaScript', 'HTML'],
        solution: [true, true, false],
      },
      {
        type: 'gap',
        question: 'MKQuizSelection The sky is [1].',
        gaps: [{ type: 'select', options: ['blue', 'red', 'green'], solution: [0] }],
      },
      {
        type: 'gap',
        question: 'MKQuizGap The capital of Germany is [1] and of Italy [2].',
        gaps: [
          { type: 'text', solution: 'Berlin' },
          { type: 'text', solution: 'Rome' },
        ],
      },
      {
        type: 'matrix',
        question: 'MKQuizMatrix',
        rows: ['Germany', 'France', 'Italy'],
        columns: ['Berlin', 'Paris', 'Rome'],
        multiple: [false, false, false],
        solution: [
          [true, false, false],
          [false, true, false],
          [false, false, true],
        ],
      },
      { type: 'generic', question: 'MKQuizGeneric Script-driven quiz:', solution: null, script: true },
    ],
  }
  slides[14] = {
    ...empty('Surveys'),
    survey: [
      {
        type: 'single',
        question: 'MKSurveySingle How satisfied are you?',
        options: [
          { key: 'good', label: 'It is good' },
          { key: 'bad', label: 'It is bad' },
        ],
      },
      {
        type: 'multiple',
        question: 'MKSurveyMultiple Which topics interest you?',
        options: [
          { key: 'ai', label: 'Artificial intelligence' },
          { key: 'web', label: 'Web development' },
        ],
      },
      { type: 'text', question: 'MKSurveyText Your reaction?' },
      { type: 'textarea', question: 'MKSurveyTextarea Describe your opinion:' },
    ],
  }

  return { version: 1, lang: 'en', slides }
}

export function project(...files: Array<[string, string]>) {
  return {
    file: files.map(([name, code], i) => ({ lang: 'js', name, code, visible: i === 0, fullscreen: false })),
    version: [{ hashes: [], log: { ok: true, level: -1, messages: [], details: [] } }],
    version_active: 0,
    log: { ok: true, level: -1, messages: [], details: [] },
    repository: {},
  }
}

/** The fixture course after a learner answered everything. */
export function answered(): Codec.Snapshot {
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
  quiz[6] = { ...quiz[6], solved: 1, trial: 1 }

  const survey = snapshot.survey[14]
  survey[0] = { submitted: true, state: { MultipleChoice: { bad: false, good: true } } }
  survey[1] = { submitted: true, state: { SingleChoice: { ai: true, web: true } } }
  survey[2] = { submitted: true, state: { Text: 'Grüße 😀 "quoted" {braces}' } }
  survey[3] = { submitted: true, state: { Text: '{lang=de} line one\nline two\r\n"three" [,] [.]' } }

  snapshot.task[2] = [[false, true]]
  snapshot.code[6] = [project(['main.js', 'console.log("hi")\n// done'])]
  snapshot.settings = { mode: 'Slides', theme: 'red' }
  snapshot.visited = 14

  return snapshot
}
