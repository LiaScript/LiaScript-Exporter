import type { Method } from '../fixtures/course'

export type Format =
  | 'json'
  | 'fullJson'
  | 'rdf'
  | 'scorm1.2'
  | 'scorm2004'
  | 'ims'
  | 'web'
  | 'xapi'
  | 'epub'
  | 'docx'
  | 'pdf'

export interface CheckOptions {
  /** How the output was produced, which selects the known gaps. */
  method?: Method
  /**
   * Also run the external validators: xmllint against the SCORM schemas and
   * epubcheck. A requested validator that is not installed is a problem, never
   * a silent pass.
   */
  deep?: boolean
}

export interface CheckResult {
  format: Format
  /** Everything wrong with the output; empty means it passed. */
  problems: string[]
  /** Markers found in the output's text, for reporting and parity checks. */
  markers: string[]
  /** Stable facts about the output (counts, titles), for parity checks. */
  summary: Record<string, unknown>
}

/** Collects problems under a short label, so reports stay greppable. */
export class Problems {
  readonly list: string[] = []

  add(label: string, detail: string): void {
    this.list.push(`${label}: ${detail}`)
  }

  /** Adds one problem naming up to `max` items, or nothing for an empty list. */
  many(label: string, items: string[], max = 10): void {
    if (items.length === 0) return

    const shown = items.slice(0, max).join(', ')
    const more = items.length > max ? ` … (+${items.length - max} more)` : ''
    this.add(label, `${items.length} × ${shown}${more}`)
  }
}
