import { DOMParser } from '@xmldom/xmldom'

export type XmlDocument = ReturnType<DOMParser['parseFromString']>
export type XmlElement = ReturnType<XmlDocument['createElement']>

export interface Parsed {
  doc: XmlDocument | null
  /** Well-formedness errors; the document may still be usable if non-empty. */
  errors: string[]
}

/**
 * Parses XML strictly and collects every error instead of throwing, so a
 * checker can report them and still read what parsed.
 */
export function parseXml(
  source: string,
  mime: 'text/xml' | 'application/xhtml+xml' = 'text/xml',
): Parsed {
  const errors: string[] = []
  let doc: XmlDocument | null = null

  try {
    doc = new DOMParser({
      onError: (level, message) => {
        if (level !== 'warning') errors.push(String(message).trim())
      },
    }).parseFromString(source, mime)
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err))
  }

  return { doc, errors }
}

/**
 * Parses tolerantly, for reading content out of markup that may be broken.
 * xmldom still throws on some errors (mismatched tags), so the last resort is
 * the markup's text with tags, comments and scripts stripped.
 */
export function parseHtml(source: string): XmlDocument {
  const parser = new DOMParser({ onError: () => {} })

  try {
    return parser.parseFromString(source, 'text/html')
  } catch {
    const text = source
      .replace(/<!--[\s\S]*?-->/g, ' ')
      .replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ')
      .replace(/<[^>]*>/g, ' ')
      .replace(/&(?!(?:amp|lt|gt|quot|#\d+);)/g, '&amp;')

    return parser.parseFromString(`<html><body>${text}</body></html>`, 'text/html')
  }
}

/** Elements by local name, ignoring namespaces and prefixes. */
export function byName(
  root: XmlDocument | XmlElement,
  localName: string,
): XmlElement[] {
  const all = root.getElementsByTagName('*')
  const out: XmlElement[] = []

  for (let i = 0; i < all.length; i++) {
    const el = all[i]
    if ((el.localName ?? el.nodeName.split(':').pop()) === localName) {
      out.push(el)
    }
  }

  return out
}

export function attr(el: XmlElement, name: string): string | null {
  if (el.hasAttribute(name)) return el.getAttribute(name)

  // prefixed attributes such as `r:embed` or `xlink:href`, matched by local name
  for (let i = 0; i < el.attributes.length; i++) {
    const a = el.attributes[i]
    if ((a.localName ?? a.name.split(':').pop()) === name) return a.value
  }

  return null
}

export function textOf(el: XmlElement | null | undefined): string {
  return (el?.textContent ?? '').replace(/\s+/g, ' ').trim()
}

/**
 * The visible text of a document plus the alt and title attributes, which
 * screen readers present as text. Comments and scripts are left out, so
 * whatever they contain cannot count as rendered.
 */
export function visibleText(root: XmlDocument | XmlElement): string {
  const parts: string[] = []

  const walk = (node: any) => {
    if (node.nodeType === 3 /* text */) {
      parts.push(node.nodeValue ?? '')
      return
    }

    if (node.nodeType !== 1 && node.nodeType !== 9) return

    const name = String(node.localName ?? '').toLowerCase()
    if (name === 'script' || name === 'style') return

    if (node.nodeType === 1) {
      for (const a of ['alt', 'title', 'aria-label']) {
        const value = node.getAttribute?.(a)
        if (value) parts.push(` ${value} `)
      }
    }

    for (let child = node.firstChild; child; child = child.nextSibling) {
      walk(child)
    }

    // block boundaries become whitespace, so words never glue together
    parts.push(' ')
  }

  walk(root)
  return parts.join('')
}
