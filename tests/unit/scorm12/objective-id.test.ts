/*
 * The classic SCORM 1.2 connector (LiaScript/src/typescript/connectors/SCORM1.2)
 * keeps every quiz, survey and task state in cmi.objectives.n.id, a
 * CMIIdentifier: printable ASCII without spaces, at most 255 characters.
 * Moodle refuses anything else with error 405.
 */
import { describe, expect, it } from 'vitest'
import * as Utils from '../../../LiaScript/src/typescript/connectors/utils'
import { check } from '../scorm-suspend/strict-lms'

const id = (value: string) => check('1.2', 'cmi.objectives.0.id', value)

// the textarea survey of the fixture course, as the lab test answers it
const survey = { submitted: true, state: { Text: '{lang=de} first line\nsays "hi"\nthird line' } }

const states = [
  survey,
  { solved: 1, state: { Text: 'New York' }, trial: 1, hint: 0, error_msg: '' },
  { submitted: true, state: { Text: 'Größe: 5 € ＂quoted＂ 😀' } },
  { submitted: true, state: { Text: '100% sure, literally %20 and ~tilde' } },
  { submitted: false, state: { MultipleChoice: [true, false, true] } },
  null,
]

describe('objective ids', () => {
  it('are valid CMIIdentifiers for answers with spaces, line breaks and non-ASCII', () => {
    for (const state of states) {
      expect(id(Utils.encodeIdentifier(state)), JSON.stringify(state)).toBeNull()
    }
  })

  it('restore the state they were made of', () => {
    for (const state of states) {
      expect(Utils.decodeIdentifier(Utils.encodeIdentifier(state))).toEqual(state)
    }
  })

  it('stay unchanged for states that were valid before', () => {
    const quiz = { solved: 1, state: { Text: 'Paris' }, trial: 1, hint: 0, error_msg: '' }
    expect(Utils.encodeIdentifier(quiz)).toBe(Utils.encodeJSON(quiz))
  })

  it('still read the values older packages stored', () => {
    for (const state of [...states, { submitted: true, state: { Text: '50%' } }]) {
      expect(Utils.decodeIdentifier(Utils.encodeJSON(state))).toEqual(state)
    }
  })

  it('fit the fixture survey into 255 characters', () => {
    expect(Utils.encodeIdentifier(survey).length).toBeLessThanOrEqual(255)
  })
})
