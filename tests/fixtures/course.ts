/*
 * What the fixture course contains, and what each format is expected to keep
 * of it. The checkers compare every export against this.
 *
 * Markers are read from the README itself, so a new `MK...` word in the course
 * is checked everywhere without touching this file. Only the exceptions are
 * listed here: markers that must never render, markers whose rendered form
 * differs from the source, and known gaps per format.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

export const COURSE_DIR = path.join(__dirname, 'course')
export const COURSE_README = path.join(COURSE_DIR, 'README.md')

export const MARKER_PATTERN = /MK[A-Z][A-Za-z0-9]*/g

/** How an output is produced; known gaps can differ between the two. */
export type Method = 'cli' | 'webapp'

/** Formats that carry rendered course text, as opposed to the Markdown source. */
export type RenderedFormat = 'epub' | 'docx' | 'pdf' | 'web'

export interface KnownGap {
  reason: string
  /** Limits the gap to these methods; all methods when omitted. */
  only?: Method[]
}

export const COURSE = {
  title: 'Exporter Test Course',
  author: 'LiaScript Exporter Tests',
  email: 'LiaScript@web.de',
  language: 'en',
  version: '1.0.0',

  /** One entry per `#`/`##` heading, in order. */
  sections: [
    'Exporter Test Course',
    'Text Formatting',
    'Lists and Tasks',
    'Tables',
    'Blockquotes',
    'Images and Media',
    'Code Blocks',
    'Markdown Inside Code',
    'Formulas',
    'Footnotes',
    'Charts',
    'ASCII Art',
    'Inline SVG',
    'Quizzes',
    'Surveys',
    'Animations',
    'Scripts and Dialogs',
    'HTML',
    'Final Chapter',
  ],

  /** Section index → number of quizzes / surveys / task lists in it. */
  quizzes: { 13: 7 } as Record<number, number>,
  surveys: { 14: 4 } as Record<number, number>,
  tasks: { 2: 1 } as Record<number, number>,

  /** Files next to the README that must never ship. */
  hidden: ['.hidden/secret.txt'],
}

/** Every file of the course except the README and hidden ones, posix paths. */
export function courseAssets(): string[] {
  const out: string[] = []

  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name.startsWith('.')) continue

      const full = path.join(dir, entry.name)
      if (entry.isDirectory()) walk(full)
      else out.push(path.relative(COURSE_DIR, full).split(path.sep).join('/'))
    }
  }

  walk(COURSE_DIR)
  return out.filter((file) => file !== 'README.md').sort()
}

/** Every marker written in the course source. */
export function sourceMarkers(): string[] {
  const source = fs.readFileSync(COURSE_README, 'utf8')
  return [...new Set(source.match(MARKER_PATTERN) ?? [])].sort()
}

/** Markers that exist only in the source and must never reach rendered output. */
export const NEVER_RENDERED: Record<string, string> = {
  MKCommentLeak: 'sits in an HTML comment',
  MKAlertDialog: 'is the text of an alert() dialog',
}

/** Markers whose rendered text differs from the source. */
export const RENDERED_AS: Record<string, string> = {
  MKScriptResult: 'MKScriptResult42',
}

/** The markers a rendered format should contain, before known gaps. */
export function renderedMarkers(): string[] {
  return sourceMarkers()
    .filter((marker) => !(marker in NEVER_RENDERED))
    .map((marker) => RENDERED_AS[marker] ?? marker)
    .sort()
}

const MEDIA_LABEL =
  'audio/video labels become a link or player, the label text is not kept'
const HIDDEN_UNTIL_CLICKED =
  'quiz hints and explanations stay hidden until the reader asks for them'

/**
 * Markers each rendered format is known to lose, measured on the CLI output on
 * 2026-09-29. A gap that starts to render is reported too, so this list can
 * only shrink.
 */
export const KNOWN_GAPS: Record<RenderedFormat, Record<string, KnownGap>> = {
  epub: {
    MKAudio: { reason: MEDIA_LABEL },
    MKVideo: { reason: MEDIA_LABEL },
    MKQrCode: { reason: 'the QR code is an image, its title is not kept' },
    MKQuizHint: { reason: HIDDEN_UNTIL_CLICKED },
    MKQuizExplanation: { reason: HIDDEN_UNTIL_CLICKED },
    MKSvgText: { reason: 'inline SVG is captured as an image' },
    MKAsciiCaption: { reason: 'the ASCII figure caption is dropped (epub only)' },
  },
  docx: {
    MKAudio: { reason: MEDIA_LABEL },
    MKVideo: { reason: MEDIA_LABEL },
    MKQrCode: { reason: 'the QR code is an image, its title is not kept' },
    MKQuizHint: { reason: HIDDEN_UNTIL_CLICKED },
    MKQuizExplanation: { reason: HIDDEN_UNTIL_CLICKED },
    MKSvgText: { reason: 'inline SVG is captured as an image' },
    MKImagePng: { reason: 'image alt text is not written to the docx' },
    MKImageJpg: { reason: 'image alt text is not written to the docx' },
    MKImageSvg: { reason: 'image alt text is not written to the docx' },
    MKGalleryA: { reason: 'image alt text is not written to the docx' },
    MKGalleryB: { reason: 'image alt text is not written to the docx' },
    MKQuoteImage: { reason: 'image alt text is not written to the docx' },
    MKAfterFenceImage: { reason: 'image alt text is not written to the docx' },
    MKScriptResult42: { reason: 'inline <script> output is not captured' },
  },
  pdf: {
    MKAudio: { reason: MEDIA_LABEL },
    MKVideo: { reason: MEDIA_LABEL },
    MKQuizHint: { reason: HIDDEN_UNTIL_CLICKED },
    MKQuizExplanation: { reason: HIDDEN_UNTIL_CLICKED },
    MKDetailsBody: { reason: '<details> is printed collapsed' },
    MKImagePng: { reason: 'alt text is not visible text in a PDF' },
    MKImageJpg: { reason: 'alt text is not visible text in a PDF' },
    MKGalleryA: { reason: 'alt text is not visible text in a PDF' },
    MKGalleryB: { reason: 'alt text is not visible text in a PDF' },
    MKQuoteImage: { reason: 'alt text is not visible text in a PDF' },
    MKAfterFenceImage: { reason: 'alt text is not visible text in a PDF' },
  },
  /** The live player, read slide by slide as a reader first sees it. */
  web: {
    MKAudio: { reason: MEDIA_LABEL },
    MKVideo: { reason: MEDIA_LABEL },
    MKQuizHint: { reason: HIDDEN_UNTIL_CLICKED },
    MKQuizExplanation: { reason: HIDDEN_UNTIL_CLICKED },
    MKDetailsBody: { reason: '<details> starts collapsed' },
  },
}

export function knownGaps(
  format: RenderedFormat,
  method: Method,
): Record<string, string> {
  const out: Record<string, string> = {}

  for (const [marker, gap] of Object.entries(KNOWN_GAPS[format])) {
    if (!gap.only || gap.only.includes(method)) out[marker] = gap.reason
  }

  return out
}
