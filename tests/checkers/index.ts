/*
 * One checker per export format, shared by every method that produces it
 * (CLI, server, web app). Each returns the problems it found; an empty list
 * means the output is good.
 *
 *   const result = await checkOutput('epub', 'out/course.epub', { method: 'cli' })
 *   expect(result.problems).toEqual([])
 */
import { checkDocx } from './docx'
import { checkEpub } from './epub'
import { checkJson, checkRdf } from './json'
import { checkLms } from './lms'
import { checkPdf } from './pdf'
import { CheckOptions, CheckResult, Format } from './types'

export type { CheckOptions, CheckResult, Format } from './types'
export { normalizeJson } from './json'

export const FORMATS: Format[] = [
  'json',
  'fullJson',
  'rdf',
  'scorm1.2',
  'scorm2004',
  'ims',
  'web',
  'xapi',
  'epub',
  'docx',
  'pdf',
]

export async function checkOutput(
  format: Format,
  source: string,
  options: CheckOptions = {},
): Promise<CheckResult> {
  switch (format) {
    case 'json':
      return checkJson(source, false, options.fixture)
    case 'fullJson':
      return checkJson(source, true, options.fixture)
    case 'rdf':
      return checkRdf(source, options.fixture)
    case 'scorm1.2':
    case 'scorm2004':
    case 'ims':
    case 'web':
    case 'xapi':
      return checkLms(format, source, options)
    case 'epub':
      return checkEpub(source, options)
    case 'docx':
      return checkDocx(source, options)
    case 'pdf':
      return checkPdf(source, options)
  }
}
