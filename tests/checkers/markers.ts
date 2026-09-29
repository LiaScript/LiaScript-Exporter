import {
  COURSE,
  MARKER_PATTERN,
  Method,
  NEVER_RENDERED,
  RenderedFormat,
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
 * searched there, because extracting visible text would hide them.
 */
export function checkRenderedMarkers(
  problems: Problems,
  format: RenderedFormat,
  method: Method,
  found: string[],
  raw: string,
): void {
  const have = new Set(found)
  const gaps = knownGaps(format, method)
  const expected = renderedMarkers()

  problems.many(
    'missing markers',
    expected.filter((marker) => !have.has(marker) && !(marker in gaps)),
  )

  problems.many(
    'known gap now renders, remove it from KNOWN_GAPS',
    Object.keys(gaps).filter((marker) => have.has(marker)),
  )

  problems.many(
    'must never render',
    Object.keys(NEVER_RENDERED).filter((marker) => raw.includes(marker)),
  )

  // A word the course never wrote means markers were glued or mangled,
  // e.g. "MKTableCellA" + "MKTableCellB" → "MKTableCellAMKTableCellB".
  const known = new Set([...expected, ...sourceMarkers()])
  problems.many(
    'unexpected marker-like words',
    found.filter((marker) => !known.has(marker)),
  )
}

/** Every section heading must appear in the text, whitespace-insensitively. */
export function checkSectionTitles(problems: Problems, text: string): void {
  const flat = text.replace(/\s+/g, ' ')
  problems.many(
    'missing section titles',
    COURSE.sections.filter((title) => !flat.includes(title)),
  )
}

/** The Markdown-carrying formats must keep every marker verbatim. */
export function checkSourceMarkers(problems: Problems, found: string[]): void {
  const have = new Set(found)
  problems.many(
    'missing markers',
    sourceMarkers().filter((marker) => !have.has(marker)),
  )
}
