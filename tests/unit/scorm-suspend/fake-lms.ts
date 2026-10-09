/*
 * A strict, in-memory LMS for the engine tests: it refuses every value that
 * strict-lms.ts refuses, interactions out of order (Moodle error 201/351),
 * fields of an interaction before its id, responses before the type, and in
 * SCORM 1.2 reading interactions (write-only). `stored` survives into the next
 * session, like the LMS database.
 */
import type { Clock, LMS } from '../../../LiaScript/src/typescript/connectors/SCORMSuspend/engine'
import { check } from './strict-lms'

export interface FakeOptions {
  version: '1.2' | '2004'
  mode?: string
  credit?: string
  mastery?: string
  /** refuse longer suspend_data, like a small database column */
  suspendLimit?: number
  /** refuse non-ASCII responses, like an LMS with a latin1 table */
  asciiOnly?: boolean
  stored?: Record<string, string>
}

export class FakeLMS implements LMS {
  stored: Record<string, string>
  refusals: string[] = []
  sets: Array<[string, string]> = []
  commits = 0
  finishes = 0
  private lastError = '0'
  private options: FakeOptions

  constructor(options: FakeOptions) {
    this.options = options
    this.stored = { ...(options.stored || {}) }

    const v12 = options.version === '1.2'
    this.stored[v12 ? 'cmi.core.lesson_mode' : 'cmi.mode'] = options.mode ?? 'normal'
    this.stored[v12 ? 'cmi.core.credit' : 'cmi.credit'] = options.credit ?? 'credit'
    this.stored[v12 ? 'cmi.student_data.mastery_score' : 'cmi.scaled_passing_score'] = options.mastery ?? ''
    this.stored[v12 ? 'cmi.core.entry' : 'cmi.entry'] = options.stored ? 'resume' : 'ab-initio'
    const status = v12 ? 'cmi.core.lesson_status' : 'cmi.completion_status'
    if (!(status in this.stored)) this.stored[status] = 'not attempted'
  }

  /** the next session of the same learner */
  next(options: Partial<FakeOptions> = {}) {
    const keep = { ...this.stored }
    for (const key of Object.keys(keep)) if (/mode|credit|entry|mastery|scaled_passing/.test(key)) delete keep[key]
    return new FakeLMS({ ...this.options, ...options, stored: keep })
  }

  get count() {
    return parseInt(this.stored['cmi.interactions._count'] || '0', 10)
  }

  interaction(n: number) {
    const prefix = `cmi.interactions.${n}.`
    const out: Record<string, string> = {}
    for (const [key, value] of Object.entries(this.stored)) {
      if (key.startsWith(prefix)) out[key.slice(prefix.length)] = value
    }
    return out
  }

  /** interactions by id */
  byId() {
    const out: Record<string, Record<string, string>> = {}
    for (let n = 0; n < this.count; n++) {
      const i = this.interaction(n)
      out[i.id] = i
    }
    return out
  }

  get(element: string) {
    if (this.options.version === '1.2' && /^cmi\.interactions\.\d+\./.test(element)) {
      this.lastError = '404'
      return ''
    }
    this.lastError = '0'
    return this.stored[element] ?? ''
  }

  private refuse(code: string, reason: string) {
    this.lastError = code
    this.refusals.push(reason)
    return false
  }

  set(element: string, value: string) {
    this.sets.push([element, value])
    if (this.finishes) return this.refuse('132', `${element} after finish`)

    const match = element.match(/^cmi\.interactions\.(\d+)\.(.*)$/)
    let type: string | undefined

    if (match) {
      const n = parseInt(match[1], 10)
      const field = match[2]
      if (n > this.count) return this.refuse('201', `${element}: index after _count ${this.count}`)
      if (n === this.count && field !== 'id') return this.refuse('408', `${element}: set before id`)
      type = this.stored[`cmi.interactions.${n}.type`]
      if (/learner_response|pattern/.test(field) && this.options.version === '2004' && !type) {
        return this.refuse('408', `${element}: set before type`)
      }
      if (field === 'type') type = value
    }

    const reason = check(this.options.version, element, value, type)
    if (reason) return this.refuse('406', reason)

    if (element === 'cmi.suspend_data' && this.options.suspendLimit && value.length > this.options.suspendLimit) {
      return this.refuse('405', `suspend_data of ${value.length}`)
    }
    if (this.options.asciiOnly && /response/.test(element) && /[^\x20-\x7e]/.test(value)) {
      return this.refuse('406', `${element}: not ASCII`)
    }

    if (match && parseInt(match[1], 10) === this.count) {
      this.stored['cmi.interactions._count'] = String(this.count + 1)
    }
    this.stored[element] = value
    this.lastError = '0'
    return true
  }

  error() {
    return this.lastError
  }

  commit() {
    if (this.finishes) return false
    this.commits++
    return true
  }

  finish() {
    this.finishes++
    return this.finishes === 1
  }
}

export class FakeClock implements Clock {
  time = Date.UTC(2026, 9, 9, 10, 0, 0)
  private timers: Array<{ at: number; fn: () => void; id: number }> = []
  private id = 0

  now() {
    return this.time
  }

  date() {
    return new Date(this.time)
  }

  later(fn: () => void, ms: number) {
    const id = ++this.id
    this.timers.push({ at: this.time + ms, fn, id })
    return () => {
      this.timers = this.timers.filter((t) => t.id !== id)
    }
  }

  advance(ms: number) {
    const until = this.time + ms
    for (;;) {
      this.timers.sort((a, b) => a.at - b.at)
      const next = this.timers[0]
      if (!next || next.at > until) break
      this.timers.shift()
      this.time = next.at
      next.fn()
    }
    this.time = until
  }

  get pending() {
    return this.timers.length
  }
}
