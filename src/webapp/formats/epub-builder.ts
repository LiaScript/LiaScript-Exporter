'use strict'

/**
 * Builds an EPUB package in memory.
 *
 * Stands in for `@lesjoursfr/html-to-epub`, which cannot run in a browser and
 * cannot be made to: its five private methods write the package to a temp
 * directory (~25 `mkdirSync`/`writeFileSync`/`copySync` call sites) and then
 * hand `archiver` a *directory path*, with no in-memory exit. Its templates are
 * read off disk through `ejs.renderFile` and `__dirname`. That is a fork, not a
 * patch — so the package is assembled here instead.
 *
 * The markup is not invented: the OPF, NCX, nav and cover documents below are
 * ports of that library's own EJS templates, which are known-good against real
 * readers. What is dropped is everything the exporter never uses — collections,
 * per-chapter authors and URLs, `beforeToc`, EPUB 2 (the CLI defaults to 3 and
 * nothing here asks for 2).
 */

import { zipSync, Zippable } from 'fflate'

/** An EPUB is a zip whose first entry must be this, uncompressed. */
const MIMETYPE = 'application/epub+zip'

/** Fixed by the spec: where a reader looks to find the package document. */
const CONTAINER =
  '<?xml version="1.0" encoding="UTF-8" ?>' +
  '<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">' +
  '<rootfiles>' +
  '<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>' +
  '</rootfiles>' +
  '</container>'

/** The library's `templates/template.css`, carried over verbatim. */
const BASE_CSS = `.epub-author {
	color: #555;
}

.epub-link {
	margin-bottom: 30px;
}

.epub-link a {
	color: #666;
	font-size: 90%;
}

.toc-author {
	font-size: 90%;
	color: #555;
}

.toc-link {
	color: #999;
	font-size: 85%;
	display: block;
}

hr {
	border: 0;
	border-bottom: 1px solid #dedede;
	margin: 60px 10%;
}

/* Cover page */

body.cover {
	padding: 0;
	margin: 0;
}

div.cover {
	display: block;
	text-align: center;
	max-width: 100%;
	height: auto;
	/* ignored on older devices */
	height: 100vh;
}
`

/** One chapter: a title for the table of contents and its body markup. */
export interface Chapter {
  title: string
  /** XHTML-safe body content — see `sanitize` in [epub.ts](./epub.ts). */
  data: string
}

/** A binary resource referenced by the chapters. */
export interface Resource {
  /** Filename inside its folder, extension included. */
  name: string
  mediaType: string
  bytes: Uint8Array
}

/** Everything the package needs. Mirrors the library's options, minus the unused. */
export interface Book {
  title: string
  author: string[]
  lang: string
  publisher?: string
  description?: string
  tocTitle: string
  /** Emit each chapter's title as an `<h1>` above its content. */
  appendChapterTitles: boolean
  /** Leave the table of contents out of the reading order. */
  hideToC: boolean
  /** Appended to {@link BASE_CSS}. */
  css?: string
  chapters: Chapter[]
  images: Resource[]
  fonts: Resource[]
  cover?: Resource
}

/** Escapes text for XML content and attribute values. */
function xml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

/**
 * A stable, syntactically valid UUID for `dc:identifier`.
 *
 * `crypto.randomUUID` needs a secure context, which a locally served build is
 * not always; the fallback keeps the export working there.
 */
function uuid(): string {
  const random = globalThis.crypto as Crypto | undefined

  if (random?.randomUUID) return `urn:uuid:${random.randomUUID()}`

  const hex = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const value = Math.floor(Math.random() * 16)

    return (c === 'x' ? value : (value & 0x3) | 0x8).toString(16)
  })

  return `urn:uuid:${hex}`
}

/** `chapter_0.xhtml` — the href a chapter is reached by. */
function href(index: number): string {
  return `chapter_${index}.xhtml`
}

/** The XML declaration and root element every content document opens with. */
function docHeader(lang: string): string {
  return (
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<!DOCTYPE html>\n' +
    '<html xmlns="http://www.w3.org/1999/xhtml" ' +
    'xmlns:epub="http://www.idpf.org/2007/ops" ' +
    `xml:lang="${xml(lang)}" lang="${xml(lang)}">`
  )
}

/** One chapter as an XHTML document. Ports `templates/content.xhtml.ejs`. */
function chapterDocument(book: Book, chapter: Chapter): string {
  const heading =
    book.appendChapterTitles && chapter.title
      ? `<h1>${xml(chapter.title)}</h1>`
      : ''

  return `${docHeader(book.lang)}
<head>
<title>${xml(chapter.title || '')}</title>
<meta charset="UTF-8" />
<link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
${heading}
${chapter.data}
</body>
</html>`
}

/** The navigation document. Ports `templates/epub3/toc.xhtml.ejs`. */
function navDocument(book: Book): string {
  const items = book.chapters
    .map(
      (chapter, index) =>
        `<li class="table-of-content"><a href="${href(index)}">` +
        `${xml(chapter.title || `Chapter ${index + 1}`)}</a></li>`,
    )
    .join('\n')

  /*
   * `landmarks` is hidden but not optional: readers use it to find where the
   * body of the book starts, and EPUB 3 requires `bodymatter` to point at real
   * content — so it names the first chapter rather than the nav itself.
   */
  return `${docHeader(book.lang)}
<head>
<title>${xml(book.title)}</title>
<meta charset="UTF-8" />
<link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
<h1 class="h1">${xml(book.tocTitle)}</h1>
<nav id="toc" epub:type="toc">
<ol>
${items}
</ol>
</nav>
<nav epub:type="landmarks" hidden="hidden">
<h2>Guide</h2>
<ol>
${book.cover ? '<li><a epub:type="cover" href="cover.xhtml">Cover</a></li>' : ''}
<li><a epub:type="bodymatter" href="${href(0)}">Start of Content</a></li>
</ol>
</nav>
</body>
</html>`
}

/**
 * The EPUB 2 navigation map. Ports `templates/toc.ncx.ejs`.
 *
 * Still written for an EPUB 3 package: `toc.ncx` is what older readers fall
 * back to, and the library emits it unconditionally for the same reason.
 */
function ncxDocument(book: Book, id: string): string {
  let order = 0

  const points = book.chapters
    .map(
      (chapter, index) =>
        `<navPoint id="content_${index}" playOrder="${order++}" class="chapter">` +
        `<navLabel><text>${xml(
          `${index + 1}. ${chapter.title || `Chapter ${index + 1}`}`,
        )}</text></navLabel>` +
        `<content src="${href(index)}"/></navPoint>`,
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head>
<meta name="dtb:uid" content="${xml(id)}" />
<meta name="dtb:depth" content="1"/>
<meta name="dtb:totalPageCount" content="0"/>
<meta name="dtb:maxPageNumber" content="0"/>
</head>
<docTitle><text>${xml(book.title)}</text></docTitle>
<docAuthor><text>${xml(book.author.join(', '))}</text></docAuthor>
<navMap>
${points}
</navMap>
</ncx>`
}

/** The cover page, drawn as a scaling SVG. Ports `templates/epub3/cover.xhtml.ejs`. */
function coverDocument(book: Book, cover: Resource): string {
  /*
   * The library measures the image to build the viewBox. Doing that here would
   * mean decoding it just for its dimensions, so the image is fitted with
   * `preserveAspectRatio` instead of stretched to a measured box — which also
   * avoids the distortion `preserveAspectRatio="none"` gives a cover whose
   * aspect ratio does not match.
   */
  return `${docHeader(book.lang)}
<head>
<meta charset="UTF-8" />
<title>${xml(book.title)}</title>
<link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body class="cover">
<div class="cover" epub:type="cover">
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     version="1.1" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
<image width="100%" height="100%" xlink:href="${xml(cover.name)}" />
</svg>
</div>
</body>
</html>`
}

/** The package document: metadata, manifest and reading order. Ports `epub3/content.opf.ejs`. */
function packageDocument(book: Book, id: string): string {
  const now = new Date()
  const modified = `${now.toISOString().split('.')[0]}Z`
  const date = now.toISOString().split('T')[0]
  const creator = book.author.join(',')
  const publisher = book.publisher || 'anonymous'

  const manifest: string[] = [
    '<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml" />',
    '<item id="toc" href="toc.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
    '<item id="css" href="style.css" media-type="text/css" />',
  ]

  if (book.cover) {
    manifest.push(
      '<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml" properties="svg"/>',
      `<item id="image_cover" href="${xml(book.cover.name)}" ` +
        `media-type="${xml(book.cover.mediaType)}" properties="cover-image" />`,
    )
  }

  book.chapters.forEach((chapter, index) => {
    /*
     * A chapter carrying MathML has to say so: readers use the manifest to
     * decide what a document needs before opening it, and epubcheck rejects an
     * undeclared one ("the property mathml should be declared in the OPF file").
     */
    const declared: string[] = []

    if (chapter.data.includes('<math')) declared.push('mathml')
    if (chapter.data.includes('<svg')) declared.push('svg')

    const properties = declared.length
      ? ` properties="${declared.join(' ')}"`
      : ''

    manifest.push(
      `<item id="content_${index}" href="${href(index)}" ` +
        `media-type="application/xhtml+xml"${properties} />`,
    )
  })

  book.images.forEach((image, index) => {
    manifest.push(
      `<item id="image_${index}" href="images/${xml(image.name)}" ` +
        `media-type="${xml(image.mediaType)}" />`,
    )
  })

  book.fonts.forEach((font, index) => {
    manifest.push(
      `<item id="font_${index}" href="fonts/${xml(font.name)}" ` +
        `media-type="${xml(font.mediaType)}" />`,
    )
  })

  const spine: string[] = []

  if (book.cover) spine.push('<itemref idref="cover"/>')
  if (!book.hideToC) spine.push('<itemref idref="toc" />')

  book.chapters.forEach((_, index) => {
    spine.push(`<itemref idref="content_${index}"/>`)
  })

  const description = book.description
    ? `<dc:description>${xml(book.description)}</dc:description>`
    : ''

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId"
         xmlns:dc="http://purl.org/dc/elements/1.1/"
         xmlns:dcterms="http://purl.org/dc/terms/"
         xml:lang="${xml(book.lang)}">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:opf="http://www.idpf.org/2007/opf">
<dc:identifier id="BookId">${xml(id)}</dc:identifier>
<dc:title>${xml(book.title)}</dc:title>
<dc:language>${xml(book.lang)}</dc:language>
<meta property="dcterms:modified">${modified}</meta>
<dc:creator id="creator">${xml(creator)}</dc:creator>
<meta refines="#creator" property="file-as">${xml(creator)}</meta>
<dc:publisher>${xml(publisher)}</dc:publisher>
<dc:date>${date}</dc:date>
<dc:rights>Copyright &#x00A9; ${now.getFullYear()} by ${xml(publisher)}</dc:rights>
${description}
${book.cover ? '<meta name="cover" content="image_cover"/>' : ''}
<meta name="generator" content="LiaScript-Exporter" />
</metadata>
<manifest>
${manifest.join('\n')}
</manifest>
<spine toc="ncx">
${spine.join('\n')}
</spine>
<guide>
${book.cover ? '<reference type="cover" title="Cover" href="cover.xhtml"/>' : ''}
${book.hideToC ? '' : `<reference type="toc" title="${xml(book.tocTitle)}" href="toc.xhtml"/>`}
<reference type="text" title="Start of Content" href="${href(0)}"/>
</guide>
</package>`
}

/** Assembles `book` into the bytes of an `.epub` file. */
export function build(book: Book): Uint8Array {
  const encoder = new TextEncoder()
  const id = uuid()

  const oebps: Zippable = {
    'content.opf': encoder.encode(packageDocument(book, id)),
    'toc.ncx': encoder.encode(ncxDocument(book, id)),
    'toc.xhtml': encoder.encode(navDocument(book)),
    'style.css': encoder.encode(BASE_CSS + (book.css ? `\n${book.css}` : '')),
  }

  book.chapters.forEach((chapter, index) => {
    oebps[href(index)] = encoder.encode(chapterDocument(book, chapter))
  })

  if (book.cover) {
    oebps['cover.xhtml'] = encoder.encode(coverDocument(book, book.cover))
    oebps[book.cover.name] = book.cover.bytes
  }

  if (book.images.length > 0) {
    const images: Zippable = {}

    book.images.forEach((image) => {
      images[image.name] = image.bytes
    })

    oebps.images = images
  }

  if (book.fonts.length > 0) {
    const fonts: Zippable = {}

    book.fonts.forEach((font) => {
      fonts[font.name] = font.bytes
    })

    oebps.fonts = fonts
  }

  /*
   * Entry order is the spec's, and fflate preserves it: `mimetype` must come
   * first and be STORED rather than deflated, so a reader can identify the file
   * by reading its first bytes. `level: 0` on that one entry is what makes the
   * result an EPUB rather than an unrecognisable zip.
   */
  return zipSync(
    {
      mimetype: [encoder.encode(MIMETYPE), { level: 0 }],
      'META-INF': { 'container.xml': encoder.encode(CONTAINER) },
      OEBPS: oebps,
    },
    { level: 9 },
  )
}
