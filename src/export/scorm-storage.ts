/**
 * `--scorm-storage`: which LiaScript SCORM connector a package uses.
 *
 * - `default`: the classic connectors (settings in `cmi.suspend_data`, quiz
 *   states in objectives/interactions).
 * - `suspend`: the whole learner state in `cmi.suspend_data`, readable
 *   answers as interactions, see
 *   LiaScript/src/typescript/connectors/SCORMSuspend. It needs a description
 *   of every quiz, survey and task (`meta`), which the Elm worker writes for
 *   the internal format `fulljson-meta`.
 *
 * Free of Node dependencies, so the browser build uses it too.
 */

/*
 * The format of `meta` is defined by the runtime, in
 * LiaScript/src/typescript/connectors/SCORMSuspend/meta.ts; it is outside this
 * project's rootDir, so only its shape is repeated here (a unit test keeps
 * QUIZ_STATE_KEY in step).
 */
type QuizMeta = { type: string; question: string; [key: string]: any }
type SlideMeta = { title: string; quiz: QuizMeta[]; survey: any[]; task: any[]; code: any[] }
export type LiaMeta = { version: 1; lang: string; slides: SlideMeta[] }

/** The state key each quiz type of the meta data belongs to. */
export const QUIZ_STATE_KEY: Record<string, string> = {
  text: 'Text',
  single: 'SingleChoice',
  multiple: 'MultipleChoice',
  select: 'Select',
  drop: 'Drop',
  matrix: 'Matrix',
  gap: 'Multi',
  generic: 'Generic',
}

export type StorageMode = 'default' | 'suspend'

export const STORAGE_MODES: StorageMode[] = ['default', 'suspend']

/** The internal format the Elm worker produces for the suspend connectors. */
export const FULL_JSON_META = 'fulljson-meta'

export function storageMode(argument: { 'scorm-storage'?: string | boolean }): StorageMode {
  const value = argument['scorm-storage']
  if (value === undefined || value === false || value === '' || value === 'default') {
    return 'default'
  }
  if (value === 'suspend') return 'suspend'

  throw new Error(`--scorm-storage: unknown value "${value}", use "default" or "suspend"`)
}

/** The folder of the bundled LiaScript runtime for a SCORM format. */
export function assetDir(format: 'scorm1.2' | 'scorm2004', mode: StorageMode) {
  return mode === 'suspend' ? `./assets/${format}-suspend` : `./assets/${format}`
}

const LIMIT = { title: 120, question: 250, option: 120 }

const clip = (text: unknown, limit: number) => {
  const chars = Array.from(String(text ?? ''))
  return chars.length <= limit ? chars.join('') : chars.slice(0, limit - 1).join('') + '…'
}

const clipAll = (list: unknown, limit: number) => (Array.isArray(list) ? list.map((text) => clip(text, limit)) : [])

/** The state key of an initial quiz state: `Text`, `SingleChoice`, … */
const stateKey = (initial: any) => (initial?.state ? Object.keys(initial.state)[0] : undefined)

const unknown = (question = ''): QuizMeta => ({ type: 'generic', question, solution: null, unknown: true })

function quiz(meta: any, initial: any, where: string, warn: (message: string) => void): QuizMeta {
  if (!meta || meta.unknown) return unknown(clip(meta?.question, LIMIT.question))

  const expected = QUIZ_STATE_KEY[meta.type]
  if (expected !== stateKey(initial)) {
    warn(`${where}: described as ${meta.type}, but its state is ${stateKey(initial)}`)
    return unknown(clip(meta.question, LIMIT.question))
  }

  const out: any = { ...meta, question: clip(meta.question, LIMIT.question) }
  if (out.options) out.options = clipAll(out.options, LIMIT.option)
  if (out.rows) out.rows = clipAll(out.rows, LIMIT.option)
  if (out.columns) out.columns = clipAll(out.columns, LIMIT.option)
  if (out.gaps) {
    out.gaps = out.gaps.map((gap: any) => (gap.options ? { ...gap, options: clipAll(gap.options, LIMIT.option) } : gap))
  }
  return out
}

/**
 * Brings the worker's meta data in line with the state vectors the package
 * ships: one entry per quiz, survey and task, texts clipped. A mismatch only
 * makes that element's report generic, it never fails the export.
 */
export function finalizeMeta(
  meta: any,
  json: { quiz: any[][]; survey: any[][]; task: any[][] },
  warn: (message: string) => void = (message) => console.warn('scorm-storage:', message),
): LiaMeta | null {
  if (!meta || meta.version !== 1 || !Array.isArray(meta.slides)) {
    warn('the course description is missing, the LMS reports will be generic')
    return null
  }

  const count = Math.max(json.quiz?.length || 0, json.survey?.length || 0, json.task?.length || 0, meta.slides.length)
  const slides: SlideMeta[] = []

  for (let s = 0; s < count; s++) {
    const slide = meta.slides[s] || {}
    const align = <T>(list: any[] | undefined, length: number, make: (entry: any, i: number) => T) =>
      Array.from({ length }, (_, i) => make(list?.[i], i))

    slides.push({
      title: clip(slide.title, LIMIT.title),
      quiz: align(slide.quiz, json.quiz?.[s]?.length || 0, (entry, i) =>
        quiz(entry, json.quiz[s][i], `slide ${s + 1}, quiz ${i + 1}`, warn),
      ),
      survey: align(slide.survey, json.survey?.[s]?.length || 0, (entry) =>
        entry && !entry.unknown
          ? {
              ...entry,
              question: clip(entry.question, LIMIT.question),
              ...(entry.options && {
                options: entry.options.map((o: any) => ({ key: String(o.key), label: clip(o.label, LIMIT.option) })),
              }),
              ...(entry.rows && { rows: clipAll(entry.rows, LIMIT.option) }),
            }
          : { type: 'text', question: clip(entry?.question, LIMIT.question), unknown: true },
      ),
      task: align(slide.task, json.task?.[s]?.length || 0, (entry) => ({
        question: clip(entry?.question, LIMIT.question),
        items: clipAll(entry?.items, LIMIT.option),
      })),
      code: (slide.code || []).map((entry: any) => ({
        question: clip(entry?.question, LIMIT.question),
        files: Array.isArray(entry?.files) ? entry.files : [],
      })),
    })
  }

  return { version: 1, lang: String(meta.lang || ''), slides }
}

/**
 * `config.js` of a SCORM package. In the default mode exactly what the
 * classic connectors always got; in the suspend mode with `meta`.
 */
export function configScript(
  format: 'scorm1.2' | 'scorm2004',
  json: { quiz: any; survey: any; task: any; meta?: any },
  argument: { 'scorm-alwaysActive'?: boolean; 'scorm-masteryScore'?: string | number },
  mode: StorageMode,
  warn?: (message: string) => void,
): string {
  const config: Record<string, any> = { task: json.task, quiz: json.quiz, survey: json.survey }
  if (mode === 'suspend') {
    config.meta = finalizeMeta(json.meta, json, warn)
  }

  let script = 'window.config_ = ' + JSON.stringify(config) + ';'

  // the classic 1.2 connector knows neither
  if (argument['scorm-alwaysActive'] && (format === 'scorm2004' || mode === 'suspend')) {
    script += '\n\nwindow["ACTIVE"] = true;'

    if (argument['scorm-masteryScore']) {
      script += '\n\nwindow["MASTERY_SCORE"] =' + parseFloat(String(argument['scorm-masteryScore'])) / 100
    }
  }

  return script
}
