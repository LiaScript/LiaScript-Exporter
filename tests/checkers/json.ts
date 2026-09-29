/*
 * json, fullJson and rdf: the parsed course and its metadata, no rendering.
 * json keeps each section's Markdown, so every marker must be in it verbatim;
 * fullJson adds the quiz, survey and task state per section.
 */
import * as fs from 'node:fs'
import { COURSE } from '../fixtures/course'
import { checkSourceMarkers, findMarkers } from './markers'
import { CheckResult, Problems } from './types'

export function checkJson(source: string, full = false): CheckResult {
  const format = full ? 'fullJson' : 'json'
  const problems = new Problems()
  const summary: Record<string, unknown> = {}
  const result = (markers: string[] = []): CheckResult => ({
    format,
    problems: problems.list,
    markers,
    summary,
  })

  const text = fs.readFileSync(source, 'utf8')

  let data: any
  try {
    data = JSON.parse(text)
  } catch (err) {
    problems.add('invalid JSON', err instanceof Error ? err.message : String(err))
    return result()
  }

  const lia = full ? data.lia : data
  if (!lia || typeof lia !== 'object') {
    problems.add('no course', full ? 'fullJson has no "lia" object' : 'not an object')
    return result()
  }

  if (lia.str_title !== COURSE.title) problems.add('wrong title', `"${lia.str_title}"`)

  const definition = lia.definition ?? {}
  for (const [key, expected] of [
    ['author', COURSE.author],
    ['email', COURSE.email],
    ['language', COURSE.language],
    ['version', COURSE.version],
  ]) {
    if (definition[key] !== expected) {
      problems.add(`wrong definition.${key}`, `"${definition[key]}"`)
    }
  }

  const sections: any[] = Array.isArray(lia.sections) ? lia.sections : []
  const titles = sections.map((s) => inlineText(s.title))
  summary.sections = sections.length

  if (sections.length !== COURSE.sections.length) {
    problems.add('section count', `${sections.length}, expected ${COURSE.sections.length}`)
  }

  problems.many(
    'wrong section titles',
    COURSE.sections
      .map((title, i) => (titles[i] === title ? null : `#${i} "${titles[i]}" ≠ "${title}"`))
      .filter((line): line is string => line !== null),
  )

  if (full) {
    for (const key of ['quiz', 'survey', 'task'] as const) {
      const perSection: any[] = Array.isArray(data[key]) ? data[key] : []
      const expected = { quiz: COURSE.quizzes, survey: COURSE.surveys, task: COURSE.tasks }[key]

      if (perSection.length !== sections.length) {
        problems.add(`${key} vector`, `${perSection.length} entries for ${sections.length} sections`)
      }

      const counts: Record<number, number> = {}
      perSection.forEach((list, i) => {
        if (Array.isArray(list) && list.length) counts[i] = list.length
      })
      summary[key] = counts

      if (JSON.stringify(counts) !== JSON.stringify(expected)) {
        problems.add(`${key} count`, `${JSON.stringify(counts)}, expected ${JSON.stringify(expected)}`)
      }
    }
  }

  // the whole file: header macros such as @greet live in `definition`
  const markers = findMarkers(text)
  checkSourceMarkers(problems, markers)
  return result(markers)
}

/** Flattens LiaScript's inline JSON (`[{ Chars: "…" }, …]`) to text. */
function inlineText(inlines: unknown): string {
  if (typeof inlines === 'string') return inlines
  if (Array.isArray(inlines)) return inlines.map(inlineText).join('')
  if (inlines && typeof inlines === 'object') {
    return Object.entries(inlines)
      .filter(([key]) => key !== 'a')
      .map(([, value]) => inlineText(value))
      .join('')
  }
  return ''
}

/**
 * JSON-LD (default) or n-quads: the schema.org Course description built from
 * the course header.
 */
export function checkRdf(source: string): CheckResult {
  const problems = new Problems()
  const summary: Record<string, unknown> = {}
  const text = fs.readFileSync(source, 'utf8')

  if (source.endsWith('.nq') || !text.trimStart().startsWith('{')) {
    const quads = text.split('\n').filter((line) => line.trim())
    const bad = quads.filter((line) => !/^\S+ \S+ .+ \.$/.test(line.trim()))
    problems.many('malformed n-quads lines', bad, 3)
    if (!text.includes(COURSE.title)) problems.add('course name', 'not in the quads')
    summary.quads = quads.length
    return { format: 'rdf', problems: problems.list, markers: [], summary }
  }

  let data: any
  try {
    data = JSON.parse(text)
  } catch (err) {
    problems.add('invalid JSON-LD', err instanceof Error ? err.message : String(err))
    return { format: 'rdf', problems: problems.list, markers: [], summary }
  }

  const expect = (label: string, actual: unknown, expected: unknown) => {
    if (actual !== expected) problems.add(`wrong ${label}`, `${JSON.stringify(actual)}, expected ${JSON.stringify(expected)}`)
  }

  expect('@context', data['@context'], 'http://schema.org/')
  expect('@type', data['@type'], 'Course')
  expect('name', data.name, COURSE.title)
  expect('inLanguage', data.inLanguage, COURSE.language)
  expect('version', data.version, COURSE.version)
  expect('author.name', data.author?.name, COURSE.author)
  expect('author.email', data.author?.email, COURSE.email)

  Object.assign(summary, { type: data['@type'], name: data.name })
  return { format: 'rdf', problems: problems.list, markers: findMarkers(text), summary }
}

/**
 * The parts of a json export that differ between runs or machines, removed
 * so two exports can be compared or snapshotted.
 */
export function normalizeJson(data: any): any {
  const copy = JSON.parse(JSON.stringify(data))
  const lia = copy.lia ?? copy
  for (const key of ['readme', 'url', 'origin']) delete lia[key]
  return copy
}
