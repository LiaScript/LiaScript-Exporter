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

const LINK = 'https://liaex.invalid/field/'

/** One quiz of the page, by the names of its PDF fields. */
export interface QuizSpot {
  section: number
  quiz: number
  /** The quiz class: text, single-choice, multiple-choice, select, matrix, multi, generic */
  type: string
  /** Answer fields per row (a matrix has several, every other quiz one); a radio group counts once. */
  rows: string[][]
  /** A survey: its check button submits, if every row is answered. */
  survey?: boolean
  check?: string
  resolve?: string
  feedback?: string
}

/**
 * Wraps the fields and quiz buttons of the rendered course in links that name
 * them, and returns the quizzes. Runs in the page, so it is self-contained.
 * `checks` is false without solutions: then the quiz buttons are hidden, the
 * fields are still marked.
 */
export function markFields(checks: boolean): QuizSpot[] {
  const LINK = 'https://liaex.invalid/field/'

  // the pdf runtime hides the quiz controls; hints have no text in the page yet
  const style = document.createElement('style')
  style.textContent =
    '.lia-quiz__control{display:flex!important;align-items:center;gap:.5rem}' +
    '.lia-quiz__control.liaex-off,.lia-quiz__hint{display:none!important}' +
    // a matrix shrinks its feedback box to nothing
    'a.liaex-feedback{display:block;height:1.6em;min-width:20em;margin-top:.25rem}'
  document.head.appendChild(style)

  let count = 0
  const link = (spec: object) => {
    const a = document.createElement('a')
    a.href = LINK + encodeURIComponent(JSON.stringify(Object.assign({ id: count++ }, spec)))
    return a
  }
  type Spec = { name: string; [key: string]: unknown }

  // Chrome prints no link around a lone form control, and LiaScript draws a
  // field anew once it is moved. So an empty link is laid over each field,
  // where nothing is redrawn: a gap of a gap text, HTML that LiaScript writes
  // itself, gets it right behind, pulled back over the gap by a negative margin.
  const follow = (el: Element, spec: Spec) => {
    const a = link(spec)
    const rect = el.getBoundingClientRect()
    const style = getComputedStyle(el)
    a.style.display = 'inline-block'
    a.style.width = rect.width + 'px'
    a.style.height = rect.height + 'px'
    a.style.marginLeft = -(rect.width + parseFloat(style.marginRight || '0')) + 'px'
    a.style.verticalAlign = style.verticalAlign
    el.after(a)
    return spec.name
  }

  // Anything else is Elm's, which finds its nodes by their place, but leaves
  // trailing children be: the link is appended, and laid over the field.
  // Horizontally in percent, as the paper is narrower than the screen.
  const cover = (el: Element, spec: Spec) => {
    const host = (el.matches('input, textarea') ? el.parentElement : el) as HTMLElement
    if (getComputedStyle(host).position === 'static') host.style.position = 'relative'
    const a = link(spec)
    a.style.position = 'absolute'
    a.style.display = 'block'
    if (host === el) {
      a.style.left = a.style.top = a.style.right = a.style.bottom = '0'
    } else {
      const outer = host.getBoundingClientRect()
      const inner = el.getBoundingClientRect()
      a.style.left = ((inner.left - outer.left - host.clientLeft) / host.clientWidth) * 100 + '%'
      a.style.width = (inner.width / host.clientWidth) * 100 + '%'
      a.style.top = inner.top - outer.top - host.clientTop + 'px'
      a.style.height = inner.height + 'px'
    }
    host.appendChild(a)
    return spec.name
  }

  const done = new Set<Element>()
  const field = (el: Element, name: string, inline = false): string => {
    const mark = inline && el.matches('input') ? follow : cover
    done.add(el)
    if (el.matches('.lia-dropdown')) {
      const id = el.querySelector('[aria-controls]')?.getAttribute('aria-controls')
      const list = (id && document.getElementById(id)) || el
      return mark(el, {
        kind: 'select',
        name,
        placeholder: el.querySelector('.lia-dropdown__selected')?.textContent?.trim(),
        options: Array.from(list.querySelectorAll('.lia-dropdown__option'), (o) => (o.textContent || '').trim()),
      })
    }
    el.removeAttribute('placeholder')
    if (el.matches('textarea')) return mark(el, { kind: 'area', name })
    if ((el as HTMLInputElement).type === 'checkbox') return mark(el, { kind: 'check', name })
    return mark(el, { kind: 'text', name })
  }
  const radios = (els: ArrayLike<Element>, group: string) => {
    Array.from(els).forEach((el, i) => {
      done.add(el)
      cover(el, { kind: 'radio', name: group, value: 'o' + i })
    })
    return group
  }

  const mains = Array.from(document.querySelectorAll('main.lia-slide__content'))
  const sectionOf = (el: Element) => mains.indexOf(el.closest('main.lia-slide__content') as Element)

  // The gaps of a gap text sit outside their quiz; their handlers name it:
  // track: [["quiz",S],["input",Q]] … param: {id: G
  const gaps = new Map<string, string[]>()
  document.querySelectorAll('main.lia-slide__content [oninput], main.lia-slide__content [onclick]').forEach((el) => {
    const handler = el.getAttribute('oninput') || el.getAttribute('onclick') || ''
    const match = handler.match(/\["quiz",\d+\],\["input",(\d+)\]\][\s\S]*?\bid: ?(\d+)/)
    if (!match || !el.matches('input, .lia-dropdown')) return
    const s = sectionOf(el)
    const key = s + '-' + match[1]
    const list = gaps.get(key) || []
    list[Number(match[2])] = field(el, 's' + s + 'q' + match[1] + 'g' + match[2], true)
    gaps.set(key, list)
  })

  const quizzes: QuizSpot[] = []
  document.querySelectorAll('main.lia-slide__content .lia-quiz').forEach((quiz) => {
    const feedback = quiz.querySelector(':scope > [id^="lia-quiz-feedback-"]')
    const control = quiz.querySelector(':scope > .lia-quiz__control')
    const check = control?.querySelector('.lia-quiz__check')
    // a survey has a submit button, but no feedback; a task has neither
    const survey = (!feedback && check && quiz.querySelector('[aria-labelledby^="lia-survey-"]')?.getAttribute('aria-labelledby')) || ''
    if (!feedback && !survey) {
      control?.classList.add('liaex-off')
      return
    }

    const s = sectionOf(quiz)
    const q = Number(feedback ? feedback.id.split('-').pop() : survey.split(' ')[0].split('-')[3])
    const type = (quiz.className.match(/\blia-quiz-(text|single-choice|multiple-choice|select|matrix|multi|generic)\b/) || [])[1] || ''
    const name = 's' + s + (survey ? 'v' : 'q') + q
    const spot: QuizSpot = { section: s, quiz: q, type, rows: [], survey: !!survey }

    if (type === 'multi') {
      spot.rows = [gaps.get(s + '-' + q) || []]
    } else {
      // a text survey has its field right in the quiz
      const answers = quiz.querySelector(':scope > .lia-quiz__answers') || (survey ? quiz : null)
      const rows = answers ? (type === 'matrix' ? Array.from(answers.querySelectorAll('tbody tr')) : [answers]) : []
      rows.forEach((row, r) => {
        const options = row.querySelectorAll('input[type=radio]')
        spot.rows.push(
          options.length
            ? [radios(options, name + 'r' + r)]
            : Array.from(row.querySelectorAll('input, textarea, .lia-dropdown'), (el, i) => field(el, name + 'r' + r + 'f' + i)),
        )
      })
    }

    const resolve = survey ? null : quiz.querySelector('.lia-quiz__resolve:not(.hide)')
    if ((checks || survey) && type !== 'generic' && spot.rows.flat().length && check) {
      spot.check = cover(check, { kind: 'button', name: name + 'check' })
      if (resolve) spot.resolve = cover(resolve, { kind: 'button', name: name + 'resolve' })
      const box = link({ kind: 'feedback', name: name + 'feedback' })
      box.className = 'liaex-feedback'
      ;(feedback || quiz).appendChild(box)
      spot.feedback = name + 'feedback'
    } else {
      control?.classList.add('liaex-off')
    }
    quizzes.push(spot)
  })

  // surveys, tasks and anything else: fields without a check
  const groups = new Map<string, Element[]>()
  document
    .querySelectorAll('main.lia-slide__content input, main.lia-slide__content textarea, main.lia-slide__content .lia-dropdown')
    .forEach((el) => {
      if (done.has(el) || el.closest('.lia-code, .ace_editor')) return
      const type = (el as HTMLInputElement).type
      if (/^(button|submit|reset|hidden|range|file|color|image)$/.test(type)) return
      if (type === 'radio') {
        const group = 'r' + ((el as HTMLInputElement).name || String(count)).replace(/\W/g, '_')
        groups.set(group, (groups.get(group) || []).concat(el))
      } else {
        field(el, 'f' + count)
      }
    })
  groups.forEach((els, group) => radios(els, group))

  return quizzes
}

type Spec = { id: number; name: string; kind: string; value?: string; options?: string[]; placeholder?: string }

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
 * Swaps the links {@link markFields} left for form fields, and gives the quiz
 * buttons their scripts. `meta` is the course description (`json.meta`), the
 * texts follow the course language.
 */
export async function addForm(bytes: Uint8Array, quizzes: QuizSpot[], meta: any, lang = 'en'): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes)
  const form = pdf.getForm()
  const font = await pdf.embedFont(StandardFonts.Helvetica)
  const groups = new Map<string, PDFRadioGroup>()
  const options = new Map<string, string[]>()
  const seen = new Set<number>()

  // `'…Color' in options` decides: undefined is none, LiaScript's field shows through
  const clear = { borderWidth: 0, borderColor: undefined, backgroundColor: undefined }

  const create = (spec: Spec, page: PDFPage, place: Place) => {
    if (spec.kind === 'text' || spec.kind === 'area' || spec.kind === 'feedback') {
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

  // in the order of the page, which is the order of the tab key
  for (const { spec, page, place } of found.sort((a, b) => a.spec.id - b.spec.id)) {
    try {
      create(spec, page, place)
    } catch (e) {
      console.warn(`pdf-form: field ${spec.name} left out (${(e as Error).message})`)
    }
  }

  const texts = (TEXTS as Record<string, Record<string, string>>)[lang] ?? (TEXTS as any)[lang.split('-')[0]] ?? TEXTS.en
  const kinds = new Map(found.map(({ spec }) => [spec.name, spec.kind]))
  for (const spot of quizzes) {
    const scripts = spot.survey
      ? { check: surveyScript(spot, kinds, options, texts), resolve: null }
      : quizScripts(spot, meta?.slides?.[spot.section]?.quiz?.[spot.quiz], options, texts)
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
