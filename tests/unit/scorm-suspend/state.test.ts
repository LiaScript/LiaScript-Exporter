/*
 * What counts as a change (connectors/SCORMSuspend/state.ts).
 */
import { describe, expect, it } from 'vitest'
import { changes } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/state'

describe('changes', () => {
  it('ignores the order of keys, which a store may not keep', () => {
    // as an LRS on jsonb returns a submitted survey, and as LiaScript sends it
    const stored = [{ submitted: true, state: { MultipleChoice: { bad: false, good: true } } }]
    const sent = [{ state: { MultipleChoice: { good: true, bad: false } }, submitted: true }]

    expect(changes('survey', stored, sent)).toEqual([])
  })

  it('still sees a changed value', () => {
    const stored = [{ submitted: false, state: { Text: '' } }]
    const sent = [{ submitted: true, state: { Text: 'hi' } }]

    expect(changes('survey', stored, sent)).toEqual([{ index: 0, urgent: true }])
  })
})
