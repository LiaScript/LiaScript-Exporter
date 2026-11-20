/*
 * `addForm` (src/export/pdf-form.ts): the links `markFields` leaves in the
 * printed PDF become form fields, and the quiz buttons get scripts built from
 * the course description that check and resolve the quiz.
 */
import { describe, expect, it } from 'vitest'
import { PDFButton, PDFCheckBox, PDFDict, PDFDocument, PDFDropdown, PDFName, PDFRadioGroup, PDFString, PDFTextField } from 'pdf-lib'
import { addForm, QuizSpot } from '../../src/export/pdf-form'

const LINK = 'https://liaex.invalid/field/'

/** A one-page PDF with a link per spec, as Chrome prints the marked page. */
async function printed(specs: object[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.create()
  const page = pdf.addPage([600, 800])
  const annots = specs.map((spec, i) =>
    pdf.context.register(
      pdf.context.obj({
        Type: 'Annot',
        Subtype: 'Link',
        Rect: [20, 760 - i * 30, 140, 780 - i * 30],
        A: { S: 'URI', URI: PDFString.of(LINK + encodeURIComponent(JSON.stringify({ id: i, ...spec }))) },
      }),
    ),
  )
  page.node.set(PDFName.of('Annots'), pdf.context.obj(annots))
  return pdf.save()
}

/** Runs a button's script against a stand-in for the reader's document. */
function runner(form: ReturnType<PDFDocument['getForm']>) {
  const values = new Map<string, any>()
  const readonly = new Set<string>()
  const doc = {
    getField: (name: string) => ({
      set readonly(on: boolean) {
        if (on) readonly.add(name)
      },
      get value() {
        return values.get(name) ?? 'Off'
      },
      set value(value) {
        values.set(name, value)
      },
      textColor: null,
      checkThisBox: (_: number, on: boolean) => values.set(name, on ? 'Yes' : 'Off'),
    }),
  }
  const run = (button: string) => {
    const action = form.getButton(button).acroField.getWidgets()[0].dict.lookup(PDFName.of('A'), PDFDict)
    new Function((action.lookup(PDFName.of('JS')) as PDFString).decodeText()).call(doc)
  }
  return { values, readonly, run }
}

const TEXTS = {
  failed: 'The correct answer has not yet been given',
  resolved: 'Resolved answer',
  solved: 'Congratulations, that was the right answer',
}

describe('addForm', () => {
  it('turns every kind of link into its field and drops the links', async () => {
    const bytes = await addForm(
      await printed([
        { kind: 'text', name: 't' },
        { kind: 'check', name: 'c' },
        { kind: 'radio', name: 'r', value: 'o0' },
        { kind: 'radio', name: 'r', value: 'o1' },
        { kind: 'select', name: 's', placeholder: 'Auswahl', options: ['150 °C', '175 °C'] },
        { kind: 'button', name: 'b' },
        { kind: 'feedback', name: 'f' },
      ]),
      [],
      undefined,
    )
    const pdf = await PDFDocument.load(bytes)
    const form = pdf.getForm()

    expect(form.getField('t')).toBeInstanceOf(PDFTextField)
    expect(form.getField('c')).toBeInstanceOf(PDFCheckBox)
    expect((form.getField('r') as PDFRadioGroup).getOptions()).toEqual(['o0', 'o1'])
    expect((form.getField('s') as PDFDropdown).getOptions()).toEqual(['Auswahl', '150 °C', '175 °C'])
    expect(form.getField('b')).toBeInstanceOf(PDFButton)
    expect((form.getField('f') as PDFTextField).isReadOnly()).toBe(true)
    expect(pdf.getPage(0).node.Annots()?.size() ?? 0).toBe(7) // the widgets, no link left
  })

  it('checks and resolves a gap text with a text and a select gap', async () => {
    const spot: QuizSpot = { section: 0, quiz: 0, type: 'multi', rows: [['g0', 'g1']], check: 'k', resolve: 'x', feedback: 'f', counter: 'n' }
    const meta = {
      lang: 'en',
      slides: [
        {
          quiz: [
            {
              type: 'gap',
              gaps: [
                { type: 'text', solution: 'schaumig' },
                { type: 'select', options: ['halbiert', 'geviertelt'], solution: [1] },
              ],
            },
          ],
        },
      ],
    }
    const bytes = await addForm(
      await printed([
        { kind: 'text', name: 'g0' },
        { kind: 'select', name: 'g1', options: ['halbiert', 'geviertelt'] },
        { kind: 'button', name: 'k' },
        { kind: 'button', name: 'x' },
        { kind: 'feedback', name: 'f' },
        { kind: 'counter', name: 'n', color: 'rgb(11, 122, 117)', size: 10 },
      ]),
      [spot],
      meta,
      'en',
    )
    const { values, readonly, run } = runner((await PDFDocument.load(bytes)).getForm())

    values.set('g0', ' schaumig ')
    values.set('g1', 'halbiert')
    run('k')
    expect(values.get('f')).toBe(TEXTS.failed)

    values.set('g1', 'geviertelt')
    run('k')
    expect(values.get('f')).toBe(TEXTS.solved)
    // the trial count, as LiaScript shows it on its check button
    expect(values.get('n')).toBe('2')

    // solved closes the quiz, as in LiaScript: read only, the buttons are done
    expect([...readonly].sort()).toEqual(['g0', 'g1'])
    run('x')
    run('k')
    expect([values.get('f'), values.get('g0'), values.get('n')]).toEqual([TEXTS.solved, ' schaumig ', '2'])

    values.clear()
    run('x')
    expect([values.get('g0'), values.get('g1'), values.get('f')]).toEqual(['schaumig', 'geviertelt', TEXTS.resolved])
  })

  it('leaves the buttons without a script when the description does not fit', async () => {
    const spot: QuizSpot = { section: 0, quiz: 0, type: 'single-choice', rows: [['r']], check: 'k', feedback: 'f' }
    const meta = { slides: [{ quiz: [{ type: 'multiple', options: ['a'], solution: [true] }] }] }
    const bytes = await addForm(await printed([{ kind: 'button', name: 'k' }]), [spot], meta)
    const widget = (await PDFDocument.load(bytes)).getForm().getButton('k').acroField.getWidgets()[0]

    expect(widget.dict.has(PDFName.of('A'))).toBe(false)
  })
})
