'use strict'

/**
 * The book's side of `--epub-form`: runs in the reader, so it is
 * self-contained and goes into each chapter with a quiz as `(${formRuntime})()`.
 *
 * Without JavaScript a reader shows the worksheet that quizPaper made: ☐, ○,
 * lines and `[ a | b ]`. With it, this turns every mark `markFields` tagged
 * (`.liaex-f`) back into its field, and every `.liaex-quiz` box into
 * LiaScript's buttons and feedback. The buttons run the very scripts of the
 * PDF form (form-scripts.ts), through an imitation of Acrobat's
 * `getField(name)` on the HTML fields.
 */
export function formRuntime(): void {
  const doc = document
  const read = (el: Element): any => {
    try {
      return JSON.parse(el.getAttribute('data-liaex') || 'null')
    } catch (e) {
      return null
    }
  }
  const fields: Record<string, any> = {}
  const groups: Record<string, HTMLInputElement[]> = {}
  const off = (els: (HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement)[], on: boolean) =>
    els.forEach((el) => {
      el.disabled = on
    })

  Array.from(doc.querySelectorAll('.liaex-f')).forEach((mark) => {
    const spec = read(mark)
    if (!spec) return

    let el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    if (spec.kind === 'select') {
      const select = doc.createElement('select')
      ;[spec.placeholder || '–'].concat(spec.options || []).forEach((text: string) => {
        const option = doc.createElement('option')
        option.textContent = text
        select.appendChild(option)
      })
      el = select
      fields[spec.name] = {
        get value() {
          return select.selectedIndex >= 0 ? select.options[select.selectedIndex].text : ''
        },
        set value(text: string) {
          Array.from(select.options).forEach((option, i) => {
            if (option.text === text) select.selectedIndex = i
          })
        },
        set readonly(on: boolean) {
          off([select], on)
        },
      }
    } else if (spec.kind === 'check' || spec.kind === 'radio') {
      const box = doc.createElement('input')
      box.type = spec.kind === 'check' ? 'checkbox' : 'radio'
      box.style.marginRight = '.4em'
      el = box
      if (spec.kind === 'check') {
        fields[spec.name] = {
          get value() {
            return box.checked ? 'Yes' : 'Off'
          },
          set value(value: string) {
            box.checked = value !== 'Off'
          },
          checkThisBox(_: number, on: boolean) {
            box.checked = on
          },
          set readonly(on: boolean) {
            off([box], on)
          },
        }
      } else {
        box.name = spec.name
        box.value = spec.value
        const group = (groups[spec.name] = groups[spec.name] || [])
        group.push(box)
        fields[spec.name] = {
          get value() {
            const on = group.filter((radio) => radio.checked)[0]
            return on ? on.value : 'Off'
          },
          set value(value: string) {
            group.forEach((radio) => {
              radio.checked = radio.value === value
            })
          },
          set readonly(on: boolean) {
            off(group, on)
          },
        }
      }
    } else {
      const text = doc.createElement(spec.kind === 'area' ? 'textarea' : 'input')
      if (text instanceof HTMLTextAreaElement) text.rows = 3
      else text.type = 'text'
      el = text
      fields[spec.name] = {
        get value() {
          return text.value
        },
        set value(value: string) {
          text.value = value
        },
        set readonly(on: boolean) {
          text.readOnly = on
          off([text], on)
        },
      }
    }

    el.className = 'liaex-input'
    // a book's style sheet seldom draws form fields: a plain box, as on paper
    if (!(el instanceof HTMLInputElement && (el.type === 'checkbox' || el.type === 'radio'))) {
      el.style.cssText =
        'border:1px solid #999;border-radius:.2em;padding:.1em .3em;font:inherit;color:inherit;background:transparent;' +
        (el instanceof HTMLTextAreaElement ? 'width:100%;box-sizing:border-box' : 'min-width:8em')
    }
    mark.parentNode && mark.parentNode.replaceChild(el, mark)
  })

  const run = (js: string) => {
    new Function(js).call({ getField: (name: string) => fields[name] || null })
  }
  const button = (label: string) => {
    const el = doc.createElement('button')
    el.type = 'button'
    el.textContent = label
    el.style.cssText = 'margin:.5em .5em 0 0;padding:.2em .8em;border:1px solid currentColor;border-radius:.3em;background:none;color:inherit;font:inherit'
    return el
  }

  Array.from(doc.querySelectorAll('.liaex-quiz')).forEach((box) => {
    const spec = read(box)
    const scripts = (spec && spec.scripts) || {}
    if (!spec || !spec.spot || !scripts.check) return

    const spot = spec.spot
    const labels = spec.labels || {}
    const check = button(labels.check || 'Check')
    box.appendChild(check)
    check.onclick = () => run(scripts.check)

    // the trial count, as LiaScript writes it on its button
    if (spot.counter) {
      let count = 0
      fields[spot.counter] = {
        get value() {
          return String(count)
        },
        set value(value: string) {
          count = Number(value) || 0
          check.textContent = (labels.check || 'Check') + (count ? ' ' + count : '')
        },
      }
    }

    if (spot.resolve && scripts.resolve) {
      const resolve = button(labels.resolve || '?')
      box.appendChild(resolve)
      resolve.onclick = () => run(scripts.resolve)
    }

    const feedback = doc.createElement('div')
    feedback.style.marginTop = '.4em'
    box.appendChild(feedback)
    fields[spot.feedback] = {
      get value() {
        return feedback.textContent || ''
      },
      set value(text: string) {
        feedback.textContent = text
      },
      set textColor(color: any) {
        if (color && color[0] === 'RGB') {
          feedback.style.color = 'rgb(' + [1, 2, 3].map((i) => Math.round(color[i] * 255)).join(',') + ')'
        }
      },
    }
  })
}

/**
 * The `<script>` that runs {@link formRuntime} in a chapter. Base64, as an
 * XHTML chapter would need `<` and `&` escaped in it, which the ePub library
 * does not do; `btoa` is the caller's, Node and the browser differ.
 */
export function runtimeScript(btoa: (text: string) => string): string {
  return `<script>new Function(decodeURIComponent(escape(atob("${btoa(`(${formRuntime})()`)}"))))()</script>`
}
