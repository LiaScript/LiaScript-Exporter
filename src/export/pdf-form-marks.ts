'use strict'

/**
 * The page side of `--pdf-form`, see [pdf-form.ts](./pdf-form.ts): free of
 * pdf-lib, as the web app's print tab runs it too.
 */

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
  /** The trial count next to "Check", as LiaScript shows it. */
  counter?: string
}

/**
 * Lays a link over every field and quiz button of the rendered course that
 * names it, and returns how many quizzes it found. Runs in the page, so it is
 * self-contained.
 *
 * `meta` is the course description (`json.meta`, see scorm-storage.ts). The
 * feedback link of each quiz carries the quiz, its solution and the language,
 * so the printed PDF is all that `addForm` needs, also when a browser printed
 * it. Without `meta` the quiz buttons are hidden; surveys still submit.
 */
export function markFields(meta: any): number {
  const LINK = 'https://liaex.invalid/field/'
  const checks = !!meta
  const lang = (meta && meta.lang) || document.documentElement.lang || 'en'

  // the pdf runtime hides the quiz controls; hints have no text in the page yet
  const style = document.createElement('style')
  style.textContent =
    '.lia-quiz__control{display:flex!important;align-items:center;gap:.5rem}' +
    '.lia-quiz__control.liaex-off,.lia-quiz__hint{display:none!important}' +
    // a matrix shrinks its feedback box to nothing
    'a.liaex-feedback{display:block;height:1.6em;min-width:20em;margin-top:.25rem}' +
    // room in the check button for its trial count
    '.liaex-count{display:inline-block;width:1.4em;height:1.6em;vertical-align:-.38em;margin:-.3em 0 -.3em .2em}'
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
      if (!survey) {
        const count = document.createElement('span')
        count.className = 'liaex-count'
        check.appendChild(count)
        const look = getComputedStyle(check)
        spot.counter = cover(count, { kind: 'counter', name: name + 'count', color: look.color, size: parseFloat(look.fontSize) * 0.75 })
      }
      if (resolve) spot.resolve = cover(resolve, { kind: 'button', name: name + 'resolve' })
      spot.feedback = name + 'feedback'
      const solution = (!survey && meta && meta.slides && meta.slides[s] && meta.slides[s].quiz && meta.slides[s].quiz[q]) || null
      const box = link({ kind: 'feedback', name: spot.feedback, spot, meta: solution, lang })
      box.className = 'liaex-feedback'
      ;(feedback || quiz).appendChild(box)
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

  return quizzes.length
}

