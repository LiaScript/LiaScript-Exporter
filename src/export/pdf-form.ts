'use strict'

/**
 * `--pdf-form`: the quizzes of a PDF as a fillable form, whose check and
 * solution buttons work in readers that run PDF JavaScript (Acrobat, Firefox,
 * …); elsewhere it is still a form to fill in.
 *
 * Chrome prints no form fields. So before printing, {@link markFields} wraps
 * every field and button of the page in a link that names it, and Chrome
 * writes each link with its exact place on its page. {@link addForm} then swaps
 * those links for AcroForm fields, and gives LiaScript's own (drawn) buttons a
 * script that compares with the solutions of the course description (`meta`,
 * see scorm-storage.ts).
 */
import {
  AppearanceProviderFor,
  drawCheckMark,
  drawEllipse,
  PDFArray,
  PDFCheckBox,
  PDFDict,
  PDFDocument,
  PDFHexString,
  PDFName,
  PDFNumber,
  PDFPage,
  PDFRadioGroup,
  PDFString,
  rgb,
  StandardFonts,
} from 'pdf-lib'
import TEXTS from './pdf-form-texts.json'
import type { QuizSpot } from './pdf-form-marks'

export { markFields } from './pdf-form-marks'
export type { QuizSpot }

const LINK = 'https://liaex.invalid/field/'

type Spec = {
  id: number
  name: string
  kind: string
  value?: string
  options?: string[]
  placeholder?: string
  /** a counter takes the look of its button: a CSS color and the size in pt */
  color?: string
  size?: number
  /** a feedback field carries its quiz, the solution and the language */
  spot?: QuizSpot
  meta?: any
  lang?: string
}

// Only the mark: LiaScript draws the box. pdf-lib's own looks always stroke a
// border (black unless told otherwise, and width 0 is a hairline in PDF), and
// without one they leave its path open for the mark to paint along.
const MARK = rgb(0.15, 0.15, 0.15)
const checkLook: AppearanceProviderFor<PDFCheckBox> = (_, widget) => {
  const { width, height } = widget.getRectangle()
  const on = drawCheckMark({ x: width / 2, y: height / 2, size: Math.min(width, height) / 2, thickness: 1.5, color: MARK })
  return { normal: { on, off: [] } }
}
const radioLook: AppearanceProviderFor<PDFRadioGroup> = (_, widget) => {
  const { width, height } = widget.getRectangle()
  const r = Math.min(width, height) * 0.22
  const on = drawEllipse({ x: width / 2, y: height / 2, xScale: r, yScale: r, color: MARK, borderColor: undefined, borderWidth: 0 })
  return { normal: { on, off: [] } }
}
type Place = { x: number; y: number; width: number; height: number }

/**
 * Swaps the links {@link markFields} left in a printed PDF for form fields,
 * and gives the quiz buttons their scripts. Null if the PDF has none of these
 * links: printed without them, or by a browser that drops links.
 */
export async function addForm(bytes: Uint8Array): Promise<Uint8Array | null> {
  const pdf = await PDFDocument.load(bytes)
  const form = pdf.getForm()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const groups = new Map<string, PDFRadioGroup>()
  const options = new Map<string, string[]>()
  const seen = new Set<number>()

  // `'…Color' in options` decides: undefined is none, LiaScript's field shows through
  const clear = { borderWidth: 0, borderColor: undefined, backgroundColor: undefined }

  const create = (spec: Spec, page: PDFPage, place: Place) => {
    if (spec.kind === 'counter') {
      const [r, g, b] = (spec.color?.match(/[\d.]+/g) || ['0', '0', '0']).map(Number)
      const field = form.createTextField(spec.name)
      field.enableReadOnly()
      field.addToPage(page, { ...place, ...clear, font, textColor: rgb(r / 255, g / 255, b / 255) })
      field.setFontSize(spec.size || 10)
    } else if (spec.kind === 'text' || spec.kind === 'area' || spec.kind === 'feedback') {
      const field = form.createTextField(spec.name)
      if (spec.kind === 'area') field.enableMultiline()
      if (spec.kind === 'feedback') field.enableReadOnly()
      field.addToPage(page, { ...place, ...clear, font })
      field.setFontSize(spec.kind === 'feedback' ? 10 : 11)
    } else if (spec.kind === 'check') {
      const field = form.createCheckBox(spec.name)
      field.addToPage(page, { ...place, ...clear })
      field.updateAppearances(checkLook)
    } else if (spec.kind === 'radio') {
      const group = groups.get(spec.name) ?? form.createRadioGroup(spec.name)
      groups.set(spec.name, group)
      group.addOptionToPage(spec.value!, page, { ...place, ...clear })
      group.updateAppearances(radioLook)
    } else if (spec.kind === 'select') {
      const field = form.createDropdown(spec.name)
      const blank = spec.placeholder || '–'
      field.addOptions([blank, ...spec.options!])
      field.select(blank)
      field.addToPage(page, { ...place, font, borderWidth: 0, borderColor: undefined })
      field.setFontSize(11)
      try {
        // Helvetica knows Latin-1 only: an option it cannot write keeps the drawn field
        field.updateAppearances(font)
      } catch (e) {
        form.removeField(field)
        throw e
      }
      options.set(spec.name, spec.options!)
    } else if (spec.kind === 'button') {
      const button = form.createButton(spec.name)
      button.addToPage('', page, { ...place, borderWidth: 0 })
      // pdf-lib paints buttons grey; LiaScript's drawn button stays visible
      button.acroField.getWidgets()[0].getAppearanceCharacteristics()?.dict.delete(PDFName.of('BG'))
      button.updateAppearances(font)
    }
  }

  const found: { spec: Spec; page: PDFPage; place: Place }[] = []
  for (const page of pdf.getPages()) {
    const annots = page.node.Annots()
    if (!annots) continue

    for (let i = annots.size() - 1; i >= 0; i--) {
      const annot = annots.lookup(i)
      if (!(annot instanceof PDFDict)) continue
      const uri = annot.lookupMaybe(PDFName.of('A'), PDFDict)?.lookup(PDFName.of('URI'))
      const text = uri instanceof PDFString || uri instanceof PDFHexString ? uri.decodeText() : ''
      if (!text.startsWith(LINK)) continue

      annots.remove(i)
      const spec: Spec = JSON.parse(decodeURIComponent(text.slice(LINK.length)))
      // a link broken over two lines or pages comes twice
      if (seen.has(spec.id)) continue
      seen.add(spec.id)

      const [x1, y1, x2, y2] = annot.lookup(PDFName.of('Rect'), PDFArray).asArray().map((n) => (n as PDFNumber).asNumber())
      found.push({ spec, page, place: { x: x1, y: y1, width: x2 - x1, height: y2 - y1 } })
    }
  }

  if (!found.length) return null

  // in the order of the page, which is the order of the tab key
  for (const { spec, page, place } of found.sort((a, b) => a.spec.id - b.spec.id)) {
    try {
      create(spec, page, place)
    } catch (e) {
      console.warn(`pdf-form: field ${spec.name} left out (${(e as Error).message})`)
    }
  }

  const kinds = new Map(found.map(({ spec }) => [spec.name, spec.kind]))
  for (const { spec } of found) {
    const spot = spec.spot
    if (!spot) continue

    const lang = spec.lang || 'en'
    const texts = (TEXTS as Record<string, Record<string, string>>)[lang] ?? (TEXTS as any)[lang.split('-')[0]] ?? TEXTS.en
    const scripts = spot.survey
      ? { check: surveyScript(spot, kinds, options, texts), resolve: null }
      : quizScripts(spot, spec.meta, options, texts)
    for (const [button, js] of [
      [spot.check, scripts?.check],
      [spot.resolve, scripts?.resolve],
    ]) {
      if (!button || !js) continue
      const field = form.getFieldMaybe(button)
      field?.acroField.getWidgets()[0].dict.set(
        PDFName.of('A'),
        pdf.context.obj({ Type: 'Action', S: 'JavaScript', JS: PDFHexString.fromText(js) }),
      )
    }
  }

  // every field got its look when it was made; the defaults would draw borders again
  return pdf.save({ updateFieldAppearances: false })
}

const json = JSON.stringify

/**
 * What every script starts with. Like LiaScript, a quiz that is solved or
 * resolved, or a survey that is submitted, is closed: `lock()` makes its fields
 * read only, and `closed` keeps its buttons from doing anything after. ES5, as
 * Acrobat's JavaScript is.
 */
function prelude(feedback: string | undefined, fields: string[], closedBy: string[]): string {
  return (
    `var d = this;\n` +
    `function get(n) { var f = d.getField(n); return f ? f.value : ''; }\n` +
    `function say(text, color) { var f = d.getField(${json(feedback)}); if (f) { f.textColor = color; f.value = text; } }\n` +
    `function lock() { var n = ${json(Array.from(new Set(fields)))}; for (var i = 0; i < n.length; i++) { var f = d.getField(n[i]); if (f) f.readonly = true; } }\n` +
    `var closed = ${json(closedBy)}.indexOf(get(${json(feedback)})) >= 0;\n`
  )
}

/**
 * The submit script of a survey: it closes the survey once every row has an
 * answer, as LiaScript does, and otherwise says what is missing.
 */
export function surveyScript(
  spot: QuizSpot,
  kinds: Map<string, string>,
  options: Map<string, string[]>,
  texts: Record<string, string>,
): string | null {
  const rows = spot.rows.filter((row) => row.length)
  if (!rows.length || rows.flat().some((name) => !kinds.has(name))) return null

  const answered = (name: string) => {
    const kind = kinds.get(name)
    return kind === 'text' || kind === 'area'
      ? `String(get(${json(name)})).replace(/^\\s+|\\s+$/g, '') != ''`
      : kind === 'select'
        ? `${json(options.get(name) || [])}.indexOf(get(${json(name)})) >= 0`
        : `get(${json(name)}) != 'Off'`
  }
  const missing = spot.type === 'matrix' ? texts.unansweredMatrix : texts.unanswered

  return (
    prelude(spot.feedback, rows.flat(), [texts.submitted]) +
    `if (!closed) {\n` +
    `var ok = ${rows.map((row) => '(' + row.map(answered).join(' || ') + ')').join(' && ')};\n` +
    `say(ok ? ${json(texts.submitted)} : ${json(missing)}, ok ? ['RGB', 0.4, 0.4, 0.4] : ['RGB', 0.75, 0.1, 0.1]);\n` +
    `if (ok) lock();\n}`
  )
}

type Answer = { name: string; kind: 'text' | 'radio' | 'check' | 'select'; want: string | boolean | string[] }

const QUIZ_TYPE: Record<string, string> = {
  text: 'text',
  'single-choice': 'single',
  'multiple-choice': 'multiple',
  select: 'select',
  matrix: 'matrix',
  multi: 'gap',
}

/**
 * The check and solution scripts of a quiz, or null if the course description
 * does not fit the fields found (then the buttons do nothing).
 */
export function quizScripts(
  spot: QuizSpot,
  meta: any,
  options: Map<string, string[]>,
  texts: Record<string, string>,
): { check: string; resolve: string } | null {
  if (!meta || meta.type !== QUIZ_TYPE[spot.type] || meta.solution === null) return null

  const select = (name: string, solution: number[]) => {
    const list = options.get(name)
    return list && solution.map((i) => list[i])
  }
  const choice = (name: string, solution: boolean[]) => ({ name, kind: 'radio' as const, want: 'o' + solution.indexOf(true) })
  const row = spot.rows[0] || []
  let answers: (Answer | null | undefined)[] = []

  switch (meta.type) {
    case 'text':
      answers = [{ name: row[0], kind: 'text', want: meta.solution }]
      break
    case 'single':
      answers = [choice(row[0], meta.solution)]
      break
    case 'multiple':
      answers = row.length === meta.solution.length ? row.map((name, i) => ({ name, kind: 'check' as const, want: meta.solution[i] })) : [null]
      break
    case 'select': {
      const want = select(row[0], meta.solution)
      answers = [want ? { name: row[0], kind: 'select', want } : null]
      break
    }
    case 'matrix':
      answers =
        spot.rows.length === meta.solution.length
          ? spot.rows.flatMap<Answer>((names, r) =>
              meta.multiple[r]
                ? names.map((name, c) => ({ name, kind: 'check' as const, want: meta.solution[r][c] }))
                : [choice(names[0], meta.solution[r])],
            )
          : [null]
      break
    case 'gap':
      answers =
        row.length === meta.gaps.length
          ? meta.gaps.map((gap: any, g: number) => {
              if (gap.type === 'text') return { name: row[g], kind: 'text', want: gap.solution }
              const want = gap.type === 'select' && gap.solution && select(row[g], gap.solution)
              return want ? { name: row[g], kind: 'select', want } : null
            })
          : [null]
      break
  }

  if (!answers.length || answers.some((a) => !a || !a.name || a.want === null || a.want === 'o-1')) return null

  const test = (a: Answer) =>
    a.kind === 'text'
      ? `String(get(${json(a.name)})).replace(/^\\s+|\\s+$/g, '') == ${json(a.want)}`
      : a.kind === 'check'
        ? `(get(${json(a.name)}) != 'Off') == ${a.want}`
        : a.kind === 'select'
          ? `${json(a.want)}.indexOf(get(${json(a.name)})) >= 0`
          : `get(${json(a.name)}) == ${json(a.want)}`
  const solve = (a: Answer) =>
    a.kind === 'check'
      ? `d.getField(${json(a.name)}).checkThisBox(0, ${a.want});`
      : `d.getField(${json(a.name)}).value = ${json(Array.isArray(a.want) ? a.want[0] : a.want)};`

  const head = prelude(spot.feedback, (answers as Answer[]).map((a) => a.name), [texts.solved, texts.resolved])

  return {
    check:
      head +
      `if (!closed) {\n` +
      (spot.counter ? `var c = d.getField(${json(spot.counter)}); if (c) c.value = String((parseInt(c.value, 10) || 0) + 1);\n` : '') +
      `var ok = ${(answers as Answer[]).map(test).join(' && ')};\n` +
      `say(ok ? ${json(texts.solved)} : ${json(texts.failed)}, ok ? ['RGB', 0.1, 0.5, 0.2] : ['RGB', 0.75, 0.1, 0.1]);\n` +
      `if (ok) lock();\n}`,
    resolve:
      head +
      `if (!closed) {\n` +
      (answers as Answer[]).map(solve).join('\n') +
      `\nsay(${json(texts.resolved)}, ['RGB', 0.4, 0.4, 0.4]);\nlock();\n}`,
  }
}
