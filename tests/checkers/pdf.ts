/*
 * PDF: a document that opens, has pages, and carries the course text. The text
 * is read with pdf.js, so no system poppler is needed.
 */
import * as fs from 'node:fs'
import { Fixture, LOCAL_FIXTURE, Method } from '../fixtures/course'
import { checkRenderedMarkers, checkSectionTitles, findMarkers } from './markers'
import { CheckOptions, CheckResult, Problems } from './types'

export async function checkPdf(
  source: string,
  options: CheckOptions = {},
): Promise<CheckResult> {
  const method: Method = options.method ?? 'cli'
  const fixture = options.fixture ?? LOCAL_FIXTURE
  const problems = new Problems()
  const summary: Record<string, unknown> = {}
  const result = (markers: string[] = []): CheckResult => ({
    format: 'pdf',
    problems: problems.list,
    markers,
    summary,
  })

  const data = new Uint8Array(fs.readFileSync(source))

  if (Buffer.from(data.subarray(0, 5)).toString('latin1') !== '%PDF-') {
    problems.add('not a PDF', 'the file does not start with %PDF-')
    return result()
  }

  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')

  const task = pdfjs.getDocument({ data, useSystemFonts: false, verbosity: 0 })

  let doc
  try {
    doc = await task.promise
  } catch (err) {
    problems.add('PDF does not open', err instanceof Error ? err.message : String(err))
    return result()
  }

  try {
    const pages: string[] = []

    for (let n = 1; n <= doc.numPages; n++) {
      const page = await doc.getPage(n)
      const content = await page.getTextContent()

      // Items are laid-out runs of text; a run can end mid-line, so they are
      // joined with a space unless pdf.js marks the end of the line.
      pages.push(
        content.items
          .map((item: any) => ('str' in item ? item.str + (item.hasEOL ? '\n' : ' ') : ''))
          .join(''),
      )
    }

    const { info } = (await doc.getMetadata()) as { info: Record<string, any> }
    const title = String(info?.Title ?? '')

    Object.assign(summary, { pages: doc.numPages, title })

    if (doc.numPages === 0) problems.add('no pages', 'the PDF has 0 pages')
    if (!title.includes(fixture.course.title)) problems.add('title', `"${title}" lacks the course title`)

    const blank = pages
      .map((text, i) => (text.trim() ? null : i + 1))
      .filter((n): n is number => n !== null)
    problems.many('blank pages', blank.map(String))

    const leaks = pages
      .map((text, i) => (printsDataUri(text) ? i + 1 : null))
      .filter((n): n is number => n !== null)
    problems.many('data: URI printed on pages', leaks.map(String))

    return result(checkPrintedText(problems, pages.join('\n'), method, fixture))
  } finally {
    await task.destroy()
  }
}

/**
 * What a browser would print, checked without the PDF: Firefox and WebKit
 * cannot save one from a test, so the web app suite reads the print view's
 * text in print media instead. Same expectations as the PDF's text.
 */
export function checkPrint(text: string, options: CheckOptions = {}): CheckResult {
  const problems = new Problems()
  if (printsDataUri(text)) problems.add('data: URI printed', 'in the print view')

  const fixture = options.fixture ?? LOCAL_FIXTURE
  const markers = checkPrintedText(problems, text, options.method ?? 'cli', {
    ...fixture,
    knownGaps: {
      ...fixture.knownGaps,
      pdf: { ...fixture.knownGaps.pdf, ...PDF_ENGINE_TEXT },
    },
  })
  return { format: 'pdf', problems: problems.list, markers, summary: {} }
}

/** Text Chrome's PDF engine adds, which a print view's text cannot show. */
const PDF_ENGINE_TEXT = {
  MKImageSvg: { reason: "Chrome's PDF carries an SVG image's alt text; the print view does not" },
}

/** Section titles and markers of printed text; returns the markers found. */
function checkPrintedText(problems: Problems, text: string, method: Method, fixture: Fixture): string[] {
  checkSectionTitles(problems, text, fixture)

  const markers = findMarkers(text)
  checkRenderedMarkers(problems, 'pdf', method, markers, text, text, fixture)
  return markers
}

/**
 * An image link shown in a code block, inlined as base64 and printed;
 * whitespace is dropped because a long run wraps over lines.
 */
function printsDataUri(text: string): boolean {
  return /data:[a-z]+\/[a-z0-9.+-]+;base64,/i.test(text.replace(/\s+/g, ''))
}
