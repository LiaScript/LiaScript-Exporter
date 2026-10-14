/*
 * The value checks of Moodle's SCORM players (mod/scorm/datamodels/scorm_12.js
 * and scorm_13.js, Moodle 4.5), made stricter where Moodle's own patterns are
 * accidentally lax (its optional groups let over-long or `{`-prefixed text
 * pass), plus the limits ILIAS adds (1.2 student_response ≤ 255, no `"`).
 *
 * `check(version, element, value, type?)` returns null or the reason a strict
 * LMS would refuse the value.
 */

const R12 = {
  CMIIdentifier: /^[!-~]{0,255}$/,
  CMIType: /^true-false$|^choice$|^fill-in$|^matching$|^performance$|^sequencing$|^likert$|^numeric$/,
  CMIResult: /^correct$|^wrong$|^unanticipated$|^neutral$|^([0-9]{0,3})?(\.[0-9]*)?$/,
  CMIDecimal: /^-?([0-9]{0,3})(\.[0-9]*)?$/,
  CMITime: /^([0-2]{1}[0-9]{1}):([0-5]{1}[0-9]{1}):([0-5]{1}[0-9]{1})(\.[0-9]{1,2})?$/,
  CMITimespan: /^([0-9]{2,4}):([0-9]{2}):([0-9]{2})(\.[0-9]{1,2})?$/,
  CMIStatus: /^passed$|^completed$|^failed$|^incomplete$|^browsed$/,
  CMIExit: /^time-out$|^suspend$|^logout$|^$/,
}

const R2004 = {
  CMILongIdentifier: /^(?:(?!urn:)\S{1,4000}|urn:[A-Za-z0-9-]{1,31}:\S{1,4000})$/,
  CMIShortIdentifier: /^[\w.]{1,250}$/,
  // Moodle: '^(\{lang=…\})?([^\{].{0,250}$)?' — here anchored, so it holds
  CMILangString250: /^(?:[^{\n\r].{0,249})?$/,
  CMILangString4000: /^(?:[^{\n\r].{0,3999})?$/,
  CMIString4000: /^.{0,4000}$/,
  CMIType: /^true-false$|^choice$|^(long-)?fill-in$|^matching$|^performance$|^sequencing$|^likert$|^numeric$|^other$/,
  CMIResult: /^correct$|^incorrect$|^unanticipated$|^neutral$|^-?([0-9]{1,4})(\.[0-9]{1,18})?$/,
  CMIDecimal: /^-?([0-9]{1,5})(\.[0-9]{1,18})?$/,
  // Moodle 4.5: a time zone only after fractional seconds
  CMITime:
    /^(19[7-9]{1}[0-9]{1}|20[0-2]{1}[0-9]{1}|203[0-8]{1})((-(0[1-9]{1}|1[0-2]{1}))((-(0[1-9]{1}|[1-2]{1}[0-9]{1}|3[0-1]{1}))(T([0-1]{1}[0-9]{1}|2[0-3]{1})((:[0-5]{1}[0-9]{1})((:[0-5]{1}[0-9]{1})((\.[0-9]{1,2})((Z|([+|-]([0-1]{1}[0-9]{1}|2[0-3]{1})))(:[0-5]{1}[0-9]{1})?)?)?)?)?)?)?)?$/,
  CMITimespan:
    /^P(\d+Y)?(\d+M)?(\d+D)?(T(((\d+H)(\d+M)?(\d+(\.\d{1,2})?S)?)|((\d+M)(\d+(\.\d{1,2})?S)?)|((\d+(\.\d{1,2})?S))))?$/,
  CMICStatus: /^completed$|^incomplete$|^not attempted$|^unknown$/,
  CMISStatus: /^passed$|^failed$|^unknown$/,
  CMIExit: /^time-out$|^suspend$|^logout$|^normal$|^$/,
}

/** learner_response and correct_responses formats of SCORM 2004, per type */
const RESPONSE: Record<string, { format: RegExp; format2?: RegExp; max: number; delimiter: string; delimiter2?: string; unique: boolean }> = {
  'true-false': { format: /^true$|^false$/, max: 1, delimiter: '', unique: false },
  choice: { format: R2004.CMIShortIdentifier, max: 36, delimiter: '[,]', unique: true },
  'fill-in': { format: R2004.CMILangString250, max: 10, delimiter: '[,]', unique: false },
  'long-fill-in': { format: R2004.CMILangString4000, max: 1, delimiter: '', unique: false },
  matching: {
    format: R2004.CMIShortIdentifier,
    format2: R2004.CMIShortIdentifier,
    max: 36,
    delimiter: '[,]',
    delimiter2: '[.]',
    unique: false,
  },
  likert: { format: R2004.CMIShortIdentifier, max: 1, delimiter: '', unique: false },
  numeric: { format: R2004.CMIDecimal, max: 1, delimiter: '', unique: false },
  other: { format: R2004.CMIString4000, max: 1, delimiter: '', unique: false },
}

function checkResponse(type: string | undefined, value: string): string | null {
  // Moodle tests the raw value first against '^.*$': no line breaks at all
  if (/[\n\r]/.test(value)) return 'line break'
  if (value.includes('"')) return 'double quote (ILIAS strips it)'
  if (!type) return 'type not set before the response (408)'

  const rule = RESPONSE[type]
  if (!rule) return `no response format for type ${type}`

  const nodes = rule.delimiter ? value.split(rule.delimiter) : [value]
  if (nodes.length > rule.max) return `more than ${rule.max} parts`

  for (let i = 0; i < nodes.length; i++) {
    if (rule.delimiter2) {
      const pair = nodes[i].split(rule.delimiter2)
      if (pair.length !== 2) return `part ${i} is not a pair: ${nodes[i]}`
      if (!rule.format.test(pair[0]) || !rule.format2!.test(pair[1])) return `invalid pair ${nodes[i]}`
    } else {
      if (!rule.format.test(nodes[i])) return `invalid part ${JSON.stringify(nodes[i])}`
      if (rule.unique && nodes.indexOf(nodes[i]) < i) return `duplicate ${nodes[i]}`
    }
  }
  return null
}

const inRange = (value: string, min: number, max: number) => {
  const n = Number(value)
  return Number.isFinite(n) && n >= min && n <= max
}

/**
 * @param element the data model name with indices, e.g. `cmi.interactions.3.id`
 * @param type the interaction's type, for responses and patterns
 */
export function check(version: '1.2' | '2004', element: string, value: string, type?: string): string | null {
  if (typeof value !== 'string') return `not a string: ${typeof value}`
  const model = element.replace(/\.\d+\./g, '.n.')
  const test = (pattern: RegExp, extra = true) => (pattern.test(value) && extra ? null : `${model} = ${JSON.stringify(value)}`)

  if (version === '1.2') {
    switch (model) {
      case 'cmi.core.lesson_status':
        return test(R12.CMIStatus)
      case 'cmi.core.lesson_location':
        return test(/^[\s\S]{0,255}$/)
      case 'cmi.core.score.raw':
      case 'cmi.core.score.min':
      case 'cmi.core.score.max':
        return test(R12.CMIDecimal, inRange(value, 0, 100))
      case 'cmi.core.session_time':
        return test(R12.CMITimespan)
      case 'cmi.core.exit':
        return test(R12.CMIExit)
      case 'cmi.suspend_data':
        return test(/^[\s\S]{0,4096}$/)
      case 'cmi.objectives.n.id':
        return test(R12.CMIIdentifier)
      case 'cmi.interactions.n.id':
        return test(R12.CMIIdentifier, value.length > 0)
      case 'cmi.interactions.n.type':
        return test(R12.CMIType)
      case 'cmi.interactions.n.result':
        return test(R12.CMIResult)
      case 'cmi.interactions.n.weighting':
        return test(R12.CMIDecimal, inRange(value, -100, 100))
      case 'cmi.interactions.n.time':
        return test(R12.CMITime)
      case 'cmi.interactions.n.latency':
        return test(R12.CMITimespan)
      case 'cmi.interactions.n.student_response':
      case 'cmi.interactions.n.correct_responses.n.pattern':
        // CMIFeedback is CMIString256; ILIAS stores at most 255
        if (value.length > 255) return `${model} longer than 255`
        if (value.includes('"')) return `${model}: double quote`
        return null
    }
    return `unknown 1.2 element ${model}`
  }

  switch (model) {
    case 'cmi.completion_status':
      return test(R2004.CMICStatus)
    case 'cmi.success_status':
      return test(R2004.CMISStatus)
    case 'cmi.location':
      return test(/^[\s\S]{0,1000}$/)
    case 'cmi.progress_measure':
      return test(R2004.CMIDecimal, inRange(value, 0, 1))
    case 'cmi.score.scaled':
      return test(R2004.CMIDecimal, inRange(value, -1, 1))
    case 'cmi.score.raw':
    case 'cmi.score.min':
    case 'cmi.score.max':
      return test(R2004.CMIDecimal)
    case 'cmi.session_time':
      return test(R2004.CMITimespan)
    case 'cmi.exit':
      return test(R2004.CMIExit)
    case 'cmi.suspend_data':
      return test(/^[\s\S]{0,64000}$/)
    case 'cmi.interactions.n.id':
      return test(R2004.CMILongIdentifier)
    case 'cmi.interactions.n.type':
      return test(R2004.CMIType)
    case 'cmi.interactions.n.result':
      return test(R2004.CMIResult)
    case 'cmi.interactions.n.weighting':
      return test(R2004.CMIDecimal)
    case 'cmi.interactions.n.timestamp':
      return test(R2004.CMITime)
    case 'cmi.interactions.n.latency':
      return test(R2004.CMITimespan)
    case 'cmi.interactions.n.description':
      if (/[\n\r]/.test(value)) return `${model}: line break`
      return test(R2004.CMILangString250)
    case 'cmi.interactions.n.learner_response':
    case 'cmi.interactions.n.correct_responses.n.pattern': {
      const reason = checkResponse(type, value)
      return reason && `${model}: ${reason}`
    }
  }
  return `unknown 2004 element ${model}`
}
