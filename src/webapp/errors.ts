'use strict'

/**
 * Translatable errors.
 *
 * The modules that throw these have no DOM, while translation lives in
 * [i18n.js](../server/public/i18n.js), a browser global. So an error carries a
 * locale key and its values, and whoever shows it resolves them. `message`
 * keeps the English, so logging and stack traces stay readable.
 */

/** Values substituted into a message's `{placeholders}`. */
export type ErrorParams = Record<string, string | number>

/** An error carrying the locale key for its own message. */
export class ExportError extends Error {
  readonly key: string
  readonly params: ErrorParams

  constructor(key: string, english: string, params: ErrorParams = {}) {
    super(fill(english, params))

    this.name = 'ExportError'
    this.key = key
    this.params = params

    // `instanceof` fails without this once the class is downlevelled.
    Object.setPrototypeOf(this, ExportError.prototype)
  }
}

/** Substitutes `{name}` placeholders; an unknown name is left as written. */
export function fill(template: string, params: ErrorParams): string {
  return template.replace(/\{(\w+)\}/g, (whole, name) =>
    name in params ? String(params[name]) : whole,
  )
}

/**
 * The message to show for an error, translated where possible.
 *
 * Falls back to the error's English — `i18n.t` returns the key itself when it
 * knows nothing, which would be worse. Errors without a key pass through.
 */
export function translate(
  error: unknown,
  lookup?: (key: string) => string,
): string {
  if (!(error instanceof ExportError)) {
    return error instanceof Error ? error.message : String(error)
  }

  const translated = lookup?.(error.key)

  if (!translated || translated === error.key) return error.message

  return fill(translated, error.params)
}
