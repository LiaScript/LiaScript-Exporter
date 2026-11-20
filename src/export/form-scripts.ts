'use strict'

/**
 * The scripts of a quiz form, for the check, solution and submit buttons of
 * `--pdf-form` and `--epub-form`. They speak Acrobat's form API
 * (`this.getField(name).value`, `readonly`, `textColor`, `checkThisBox`),
 * which the PDF reader provides, and the book's runtime
 * ([epub-form-runtime.ts](./epub-form-runtime.ts)) imitates on HTML fields.
 */
import TEXTS from './pdf-form-texts.json'
import type { QuizSpot } from './pdf-form-marks'

/** What `markFields` writes about a field, quiz or button. */
export type Spec = {
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

/**
 * The scripts of every quiz and survey among the `specs` of a page: the
 * feedback spec of each carries its quiz, solution and language.
 */
export function formScripts(specs: Spec[]): { spot: QuizSpot; check: string | null; resolve: string | null }[] {
  const options = new Map(specs.filter((s) => s.kind === 'select').map((s) => [s.name, s.options || []]))
  const kinds = new Map(specs.map((s) => [s.name, s.kind]))

  return specs.flatMap((spec) => {
    const spot = spec.spot
    if (!spot) return []

    const lang = spec.lang || 'en'
    const texts = (TEXTS as Record<string, Record<string, string>>)[lang] ?? (TEXTS as any)[lang.split('-')[0]] ?? TEXTS.en
    const scripts = spot.survey
      ? { check: surveyScript(spot, kinds, options, texts), resolve: null }
      : quizScripts(spot, spec.meta, options, texts)
    return [{ spot, check: scripts?.check ?? null, resolve: scripts?.resolve ?? null }]
  })
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
