/*
 * Builds small, known-good outputs of each format from the fixture course, so
 * the checker tests can break one thing at a time and see it reported.
 */
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { zipSync, Zippable } from 'fflate'
import { afterAll } from 'vitest'
import {
  COURSE,
  COURSE_DIR,
  COURSE_README,
  courseAssets,
  gapFallbacks,
  knownGaps,
  renderedMarkers,
  RenderedFormat,
} from '../../fixtures/course'

export type Files = Record<string, string | Uint8Array>

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'lia-checker-test-'))
// Registered with each test file that imports this (Vitest isolates modules per file).
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }))
let counter = 0

/** Writes files as a zip; `stored` entries go first and uncompressed. */
export function writeZip(files: Files, stored: string[] = []): string {
  const entries: Zippable = {}
  const bytes = (v: string | Uint8Array) => (typeof v === 'string' ? Buffer.from(v) : v)

  for (const name of stored) entries[name] = [bytes(files[name]), { level: 0 }]
  for (const [name, data] of Object.entries(files)) {
    if (!stored.includes(name)) entries[name] = bytes(data)
  }

  const file = path.join(tmp, `out-${++counter}.zip`)
  fs.writeFileSync(file, zipSync(entries))
  return file
}

export function writeDir(files: Files): string {
  const dir = path.join(tmp, `out-${++counter}`)
  for (const [name, data] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), data)
  }
  return dir
}

export function writeFile(name: string, data: string | Uint8Array): string {
  const file = path.join(tmp, `${++counter}-${name}`)
  fs.writeFileSync(file, data)
  return file
}

/** The markers a correct export of `format` contains: all but known gaps. */
export function goodMarkers(format: RenderedFormat): string[] {
  const gaps = knownGaps(format, 'cli')
  return [
    ...renderedMarkers().filter((marker) => !(marker in gaps)),
    ...Object.values(gapFallbacks(format, 'cli')),
  ]
}

/** The player's shell plus the course, as every packaged format ships it. */
function playerFiles(): Files {
  const files: Files = {
    'index.html':
      '<!DOCTYPE html><html><head><link rel="stylesheet" href="app.css"></head>' +
      '<body><script src="app.js"></script></body></html>',
    'app.js': '',
    'app.css': '',
    'README.md': fs.readFileSync(COURSE_README),
  }

  for (const asset of courseAssets()) {
    files[asset] = fs.readFileSync(path.join(COURSE_DIR, asset))
  }

  return files
}

export function scorm12(): Files {
  const files = playerFiles()
  const listed = Object.keys(files)
    .map((f) => `<file href="${f}"/>`)
    .join('')

  files['metadata.xml'] = '<lom/>'
  files['imsmanifest.xml'] = `<?xml version="1.0"?>
<manifest identifier="m" xmlns="http://www.imsproject.org/xsd/imscp_rootv1p1p2" xmlns:adlcp="http://www.adlnet.org/xsd/adlcp_rootv1p2">
  <metadata><schema>ADL SCORM</schema><schemaversion>1.2</schemaversion><adlcp:location>metadata.xml</adlcp:location></metadata>
  <organizations default="o"><organization identifier="o"><title>${COURSE.title}</title>
    <item identifier="i" identifierref="r" parameters="README.md"><title>${COURSE.title}</title></item>
  </organization></organizations>
  <resources><resource identifier="r" type="webcontent" href="index.html" adlcp:scormtype="sco">${listed}</resource></resources>
</manifest>`
  return files
}

export function xapi(): Files {
  const files = playerFiles()
  const resources = Object.keys(files)
    .map((f) => `<resource lang="en-us">${f}</resource>`)
    .join('')

  files['tincan.xml'] = `<?xml version="1.0"?>
<tincan xmlns="http://projecttincan.com/tincan.xsd"><activities><activity id="x" type="course">
  <name>${COURSE.title}</name><launch lang="en-us">index.html</launch>${resources}
</activity></activities></tincan>`
  return files
}

const xhtml = (title: string, body: string) =>
  `<?xml version="1.0" encoding="UTF-8"?>
<html xmlns="http://www.w3.org/1999/xhtml"><head><title>${title}</title></head>
<body><h1>${title}</h1>${body}</body></html>`

/** One chapter per section; the markers are spread over the chapters. */
export function epub(markers = goodMarkers('epub')): Files {
  const files: Files = {
    mimetype: 'application/epub+zip',
    'META-INF/container.xml': `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`,
    'OEBPS/images/photo.jpg': fs.readFileSync(path.join(COURSE_DIR, 'img/photo.jpg')),
  }

  const items: string[] = ['<item id="img" href="images/photo.jpg" media-type="image/jpeg"/>']
  const spine: string[] = []

  COURSE.sections.forEach((title, i) => {
    const own = markers.filter((_, m) => m % COURSE.sections.length === i)
    const image = i === 5 ? '<img src="images/photo.jpg" alt="photo"/>' : ''
    files[`OEBPS/${i}.xhtml`] = xhtml(title, `<p>${own.join(' ')} text</p>${image}`)
    items.push(`<item id="c${i}" href="${i}.xhtml" media-type="application/xhtml+xml"/>`)
    spine.push(`<itemref idref="c${i}"/>`)
  })

  files['OEBPS/content.opf'] = `<?xml version="1.0"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="id">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="id">x</dc:identifier><dc:title>${COURSE.title}</dc:title>
    <dc:language>${COURSE.language}</dc:language><dc:creator>${COURSE.author}</dc:creator>
  </metadata>
  <manifest>${items.join('')}</manifest>
  <spine>${spine.join('')}</spine>
</package>`

  return files
}

/** A document with every section title and marker, and one embedded image. */
export function docx(markers = goodMarkers('docx')): Files {
  const paragraph = (text: string) => `<w:p><w:r><w:t xml:space="preserve">${text}</w:t></w:r></w:p>`

  const body = [
    ...COURSE.sections.map(paragraph),
    paragraph(markers.join(' ')),
    `<w:p><w:r><w:drawing><wp:inline><wp:docPr id="1" name="p" descr="photo"/>
      <a:graphic><a:graphicData><pic:pic><pic:blipFill><a:blip r:embed="rId1"/></pic:blipFill></pic:pic></a:graphicData></a:graphic>
    </wp:inline></w:drawing></w:r></w:p>`,
  ].join('')

  return {
    '[Content_Types].xml': `<?xml version="1.0"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
</Types>`,
    '_rels/.rels': `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`,
    'word/document.xml': `<?xml version="1.0"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"
  xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"
  xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing"
  xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main"
  xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>${body}</w:body></w:document>`,
    'word/_rels/document.xml.rels': `<?xml version="1.0"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/image1.png"/>
</Relationships>`,
    'word/media/image1.png': fs.readFileSync(path.join(COURSE_DIR, 'img/marker.png')),
    'docProps/core.xml': `<?xml version="1.0"?>
<cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties"
  xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>${COURSE.title}</dc:title></cp:coreProperties>`,
  }
}

/**
 * A minimal one-page PDF showing `lines` in Helvetica. Enough for pdf.js to
 * open it and extract the text.
 */
export function pdf(lines: string[], title = COURSE.title): Uint8Array {
  const escape = (s: string) => s.replace(/[\\()]/g, (c) => `\\${c}`)
  const stream =
    'BT /F1 6 Tf 20 820 Td 8 TL\n' +
    lines.map((line) => `(${escape(line)}) Tj T*`).join('\n') +
    '\nET'

  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
    `<< /Title (${escape(title)}) >>`,
  ]

  let out = '%PDF-1.4\n'
  const offsets: number[] = []
  objects.forEach((body, i) => {
    offsets.push(Buffer.byteLength(out))
    out += `${i + 1} 0 obj\n${body}\nendobj\n`
  })

  const xref = Buffer.byteLength(out)
  out +=
    `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n` +
    offsets.map((o) => `${String(o).padStart(10, '0')} 00000 n \n`).join('') +
    `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R /Info 6 0 R >>\nstartxref\n${xref}\n%%EOF\n`

  return Buffer.from(out, 'latin1')
}

/** The lines of a correct PDF: titles, then the markers a few per line. */
export function pdfLines(markers = goodMarkers('pdf')): string[] {
  const lines = [...COURSE.sections]
  for (let i = 0; i < markers.length; i += 4) lines.push(markers.slice(i, i + 4).join(' '))
  return lines
}

/** A json export: sections with their Markdown, as LiaScript encodes them. */
export function json(): Record<string, any> {
  const source = fs.readFileSync(COURSE_README, 'utf8')
  const body = source.slice(source.indexOf('-->') + 3)
  const parts = body.split(/^#{1,2} .*$/m).slice(1)

  return {
    str_title: COURSE.title,
    definition: {
      author: COURSE.author,
      email: COURSE.email,
      language: COURSE.language,
      version: COURSE.version,
      macro: { greet: source.match(/@greet: (.*)/)![1] },
    },
    sections: COURSE.sections.map((title, i) => ({
      title: [{ Chars: title, a: null }],
      code: parts[i] ?? '',
      indentation: i === 0 || i === COURSE.sections.length - 1 ? 1 : 2,
    })),
  }
}

export function fullJson(): Record<string, any> {
  const vector = (counts: Record<number, number>) =>
    COURSE.sections.map((_, i) => Array.from({ length: counts[i] ?? 0 }, () => ({})))

  return {
    lia: json(),
    quiz: vector(COURSE.quizzes),
    survey: vector(COURSE.surveys),
    task: vector(COURSE.tasks),
  }
}
