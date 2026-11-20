import {
  Fixture,
  LOCAL_FIXTURE,
  MARKER_PATTERN,
  Method,
  RenderedFormat,
  gapFallbacks,
  knownGaps,
  renderedMarkers,
  sourceMarkers,
} from '../fixtures/course'
import { Problems } from './types'

/** Every distinct marker-like word in a text. */
export function findMarkers(text: string): string[] {
  return [...new Set(text.match(MARKER_PATTERN) ?? [])].sort()
}

/**
 * Compares the markers of a rendered output with the course: each one must be
 * present unless it is a known gap, a known gap that renders after all must be
 * removed from the list, and the never-rendered ones must stay out.
 *
 * `raw` is the unfiltered output (markup, comments, attributes); leaks are
 * searched there, because extracting visible text would hide them. `text` is
 * what a reader sees, where a gap's fallback must appear.
 */
export function checkRenderedMarkers(
  problems: Problems,
  format: RenderedFormat,
  method: Method,
  found: string[],
  raw: string,
  text: string,
  fixture: Fixture,
): void {
  const have = new Set(found)
  const gaps = knownGaps(format, method, fixture)
  const expected = renderedMarkers(fixture)

  problems.many(
    'missing markers',
    expected.filter((marker) => !have.has(marker) && !(marker in gaps)),
  )

  problems.many(
    'known gap now renders, remove it from KNOWN_GAPS',
    Object.keys(gaps).filter((marker) => have.has(marker)),
  )

  const flat = text.replace(/\s+/g, ' ')
  problems.many(
    'known gap without its fallback text',
    Object.entries(gapFallbacks(format, method, fixture))
      .filter(([marker, fallback]) => !have.has(marker) && !flat.includes(fallback))
      .map(([marker, fallback]) => `${marker} (${fallback})`),
  )

  problems.many(
    'must never render',
    Object.keys(fixture.neverRendered).filter((marker) => raw.includes(marker)),
  )

  // A word the course never wrote means markers were glued or mangled,
  // e.g. "MKTableCellA" + "MKTableCellB" → "MKTableCellAMKTableCellB".
  const known = new Set([...expected, ...sourceMarkers(fixture)])
  problems.many(
    'unexpected marker-like words',
    found.filter((marker) => !known.has(marker)),
  )
}

/** Every section heading must appear in the text, whitespace-insensitively. */
export function checkSectionTitles(problems: Problems, text: string, fixture: Fixture): void {
  const flat = text.replace(/\s+/g, ' ')
  problems.many(
    'missing section titles',
    fixture.course.sections.filter((title) => !flat.includes(title)),
  )
}

/** The Markdown-carrying formats must keep every marker verbatim. */
export function checkSourceMarkers(problems: Problems, found: string[], fixture: Fixture): void {
  const have = new Set(found)
  problems.many(
    'missing markers',
    sourceMarkers(fixture).filter((marker) => !have.has(marker)),
  )
}

/**
 * Quizzes on paper: a selection lists its options, and where the format cannot
 * keep a drawn field (`lines`), each text field is a line to write on — the
 * text quiz, two gaps and the survey text — and the survey text area three.
 */
export function checkQuizPaper(problems: Problems, text: string, lines: boolean, fixture: Fixture): void {
  // only the local course has these quizzes
  if (fixture.dir !== LOCAL_FIXTURE.dir) return

  if (!/\[\s*blue\s*\|\s*red\s*\|\s*green\s*\]/.test(text)) {
    problems.add('quiz selection', 'options not listed as [ blue | red | green ]')
  }
  if (!lines) return

  const fields = text.match(/(?<!_)_{10}(?!_)/g)?.length ?? 0
  if (fields !== 4) problems.add('quiz text fields', `${fields} lines, expected 4`)
  const area = text.match(/_{40}/g)?.length ?? 0
  if (area !== 3) problems.add('quiz text area', `${area} lines, expected 3`)
}
