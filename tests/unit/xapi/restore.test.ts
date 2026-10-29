/*
 * Quiz states rebuilt from answered statements (connectors/XAPI/restore.ts):
 * they must look like the states LiaScript stores, or the next store on the
 * slide counts as a change and is sent again.
 */
import { describe, expect, it } from 'vitest'
import { quizState } from '../../../LiaScript/src/typescript/connectors/XAPI/restore'

const EXT = 'http://liascript.github.io/extensions/'

const statement = (result: any) => ({
  result: {
    response: 'o1[,]o3',
    score: { raw: 0, max: 2, min: 0, scaled: 0 },
    ...result,
    extensions: {
      [EXT + 'state']: { MultipleChoice: [true, false, true] },
      [EXT + 'trial']: 2,
      [EXT + 'hint']: 1,
      [EXT + 'answer']: 'Python; HTML',
    },
  },
})

describe('quizState', () => {
  const initial = { solved: 0, state: { MultipleChoice: [false, false, false] }, trial: 0, hint: 0, error_msg: '', score: 2 }

  it('has the fields of the course’s state, and its weight', () => {
    const quiz = quizState(statement({ success: false, completion: false }), initial)

    expect(quiz).toEqual({ solved: 0, state: { MultipleChoice: [true, false, true] }, trial: 2, hint: 1, error_msg: '', score: 2 })
    expect(Object.keys(quiz)).toEqual(Object.keys(initial))
  })

  it('tells solved, resolved and still trying apart', () => {
    expect(quizState(statement({ success: true, completion: true }), initial).solved).toBe(1)
    expect(quizState(statement({ success: false, completion: true }), initial).solved).toBe(-1)
    expect(quizState(statement({ completion: false }), initial).solved).toBe(0)
  })

  it('takes the weight from the statement without a course state', () => {
    expect(quizState(statement({ success: true }), undefined).score).toBe(2)
  })
})
