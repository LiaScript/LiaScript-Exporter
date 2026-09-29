/*
 * The checkers' own tests: a correct output passes, and each way an export has
 * broken before is reported. Without these, a checker that silently stopped
 * looking would pass every export.
 */
import { describe, expect, it } from 'vitest'
import { checkOutput } from '../../checkers'
import { COURSE } from '../../fixtures/course'
import * as build from './build'

/** Asserts exactly one problem was reported, and that it matches. */
function expectOnly(problems: string[], pattern: RegExp) {
  expect(problems).toHaveLength(1)
  expect(problems[0]).toMatch(pattern)
}

describe('scorm1.2', () => {
  const check = (files: build.Files) => checkOutput('scorm1.2', build.writeZip(files))

  it('passes a correct package', async () => {
    expect((await check(build.scorm12())).problems).toEqual([])
  })

  it('reports a package without the course', async () => {
    const files = build.scorm12()
    delete files['README.md']
    const { problems } = await check(files)
    expect(problems).toContainEqual(expect.stringMatching(/^course missing/))
    expect(problems).toContainEqual(expect.stringMatching(/^course parameter missing: README.md/))
  })

  /** --scorm-embed: no parameter, the markdown travels in course.js. */
  const embedded = () => {
    const files = build.scorm12()
    files['imsmanifest.xml'] = String(files['imsmanifest.xml']).replace(' parameters="README.md"', '')
    files['index.html'] = `${files['index.html']}<script src="course.js"></script>`
    files['course.js'] = `window["liascript_course"] = ${JSON.stringify(`# ${COURSE.title}`)}`
    return files
  }

  it('passes an embedded course', async () => {
    expect((await check(embedded())).problems).toEqual([])
  })

  it('reports an embedded course that is missing or foreign', async () => {
    const missing = embedded()
    delete missing['course.js']
    expect((await check(missing)).problems).toEqual([
      'index.html references missing files: 1 × course.js',
      'embedded course missing: course.js',
    ])

    const foreign = embedded()
    foreign['course.js'] = 'window["liascript_course"] = "# Other"'
    expectOnly((await check(foreign)).problems, /^embedded course is not the course/)
  })

  it('passes a course opened by start.html (--scorm-iframe)', async () => {
    const files = build.scorm12()
    files['imsmanifest.xml'] = String(files['imsmanifest.xml'])
      .replace(' parameters="README.md"', '')
      .replace('href="index.html"', 'href="start.html"')
      .replace('<file href=', '<file href="start.html"/><file href=')
    files['start.html'] =
      '<script>const src = path + "index.html?" + path + "README.md"</script>'
    expect((await check(files)).problems).toEqual([])

    files['start.html'] = String(files['start.html']).replace('README.md', 'GONE.md')
    expectOnly((await check(files)).problems, /^course parameter missing: GONE.md/)
  })

  it('reports a launch file that delivers no course', async () => {
    const files = build.scorm12()
    files['imsmanifest.xml'] = String(files['imsmanifest.xml']).replace(' parameters="README.md"', '')
    expectOnly((await check(files)).problems, /^no course parameter/)
  })

  it('reports a changed course', async () => {
    const files = build.scorm12()
    files['README.md'] = '# Something else'
    expectOnly((await check(files)).problems, /^course changed/)
  })

  it('reports a missing course asset', async () => {
    const files = build.scorm12()
    delete files['media/tone.wav']
    const { problems } = await check(files)
    expect(problems).toContainEqual(expect.stringMatching(/^course files missing: 1 × media\/tone.wav/))
  })

  it('reports shipped hidden files', async () => {
    const files = build.scorm12()
    files['.hidden/secret.txt'] = 'secret'
    expectOnly((await check(files)).problems, /^hidden files shipped: 1 × .hidden\/secret.txt/)
  })

  it('reports a script the entry page cannot load', async () => {
    const files = build.scorm12()
    delete files['app.js']
    const { problems } = await check(files)
    expect(problems).toContainEqual(expect.stringMatching(/^index.html references missing files: 1 × app.js/))
  })

  it('reports a wrong schemaversion and title', async () => {
    const files = build.scorm12()
    files['imsmanifest.xml'] = String(files['imsmanifest.xml'])
      .replace('<schemaversion>1.2', '<schemaversion>2004 4th Edition')
      .replace(`<title>${COURSE.title}</title>`, '<title>Untitled</title>')
    const { problems } = await check(files)
    expect(problems).toContainEqual(expect.stringMatching(/^wrong schemaversion/))
    expect(problems).toContainEqual(expect.stringMatching(/^wrong organization title: "Untitled"/))
  })

  it('reports a broken manifest', async () => {
    const files = build.scorm12()
    files['imsmanifest.xml'] = '<manifest><organizations>'
    expect((await check(files)).problems).toContainEqual(
      expect.stringMatching(/^imsmanifest.xml is not well-formed/),
    )
  })
})

describe('xapi', () => {
  const check = (files: build.Files) => checkOutput('xapi', build.writeDir(files))

  it('passes a correct package', async () => {
    expect((await check(build.xapi())).problems).toEqual([])
  })

  it('reports tincan.xml listing a file the package lacks', async () => {
    const files = build.xapi()
    files['tincan.xml'] = String(files['tincan.xml']).replace(
      '</activity>',
      '<resource lang="en-us">.hidden/secret.txt</resource></activity>',
    )
    expectOnly((await check(files)).problems, /^tincan.xml lists missing files: 1 × .hidden\/secret.txt/)
  })
})

describe('epub', () => {
  const check = (files: build.Files, stored = ['mimetype']) =>
    checkOutput('epub', build.writeZip(files, stored))

  it('passes a correct book', async () => {
    expect((await check(build.epub())).problems).toEqual([])
  })

  it('reports a compressed or misplaced mimetype', async () => {
    expectOnly((await check(build.epub(), [])).problems, /^mimetype: must be the first zip entry/)
  })

  it('reports empty chapters', async () => {
    const files = build.epub()
    files['OEBPS/3.xhtml'] = `<?xml version="1.0"?><html xmlns="http://www.w3.org/1999/xhtml"><head><title>t</title></head><body><h1>${COURSE.sections[3]}</h1></body></html>`
    const { problems } = await check(files)
    expect(problems).toContainEqual(expect.stringMatching(/^empty chapters: 1 × OEBPS\/3.xhtml/))
  })

  it('reports a chapter count that does not match the sections', async () => {
    const files = build.epub()
    files['OEBPS/content.opf'] = String(files['OEBPS/content.opf']).replace('<itemref idref="c18"/>', '')
    const { problems } = await check(files)
    expect(problems).toContainEqual(expect.stringMatching(/^chapter count: 18 chapters for 19 sections/))
  })

  it('reports spine and manifest mismatches', async () => {
    const files = build.epub()
    files['OEBPS/content.opf'] = String(files['OEBPS/content.opf'])
      .replace('<spine>', '<spine><itemref idref="nowhere"/>')
      .replace('</manifest>', '<item id="img" href="images/photo.jpg" media-type="image/jpeg"/><item id="gone" href="gone.png" media-type="image/png"/></manifest>')
    files['OEBPS/extra.css'] = ''
    const { problems } = await check(files)
    expect(problems).toContainEqual(expect.stringMatching(/^spine idrefs without a manifest item: 1 × nowhere/))
    expect(problems).toContainEqual(expect.stringMatching(/^duplicate manifest ids: 1 × img/))
    expect(problems).toContainEqual(expect.stringMatching(/^manifest items missing from the book: 1 × OEBPS\/gone.png/))
    expect(problems).toContainEqual(expect.stringMatching(/^files not declared in the manifest: 1 × OEBPS\/extra.css/))
  })

  it('reports file: and blob: URLs and broken references', async () => {
    const files = build.epub()
    files['OEBPS/5.xhtml'] = String(files['OEBPS/5.xhtml']).replace(
      '<img src="images/photo.jpg"',
      '<audio src="file:///home/someone/course/media/tone.wav"/><a href="blob:http://x/media/tone.wav">tone</a><img src="images/missing.jpg"',
    )
    const { problems } = await check(files)
    expect(problems).toContainEqual(expect.stringMatching(/^file:\/blob: URLs in the book: 2 × file:\/\/\/home.*, blob:http/))
    expect(problems).toContainEqual(expect.stringMatching(/^references to missing files: 1 × 5.xhtml → images\/missing.jpg/))
  })

  it('reports a data: URI printed as text, but not one in an attribute', async () => {
    const files = build.epub()
    files['OEBPS/7.xhtml'] = String(files['OEBPS/7.xhtml']).replace(
      '</body>',
      '<pre><code>![x](data:image/png;base64,iVBORw0KGgo)</code></pre><img src="data:image/png;base64,iVBORw0KGgo" alt="ok"/></body>',
    )
    expectOnly((await check(files)).problems, /^data: URI printed in chapters: 1 × OEBPS\/7.xhtml/)
  })

  it('reports a chapter that is not well-formed XML', async () => {
    const files = build.epub()
    files['OEBPS/7.xhtml'] = String(files['OEBPS/7.xhtml']).replace('</p>', '')
    expect((await check(files)).problems).toContainEqual(
      expect.stringMatching(/^OEBPS\/7.xhtml is not well-formed/),
    )
  })
})

describe('markers (via epub)', () => {
  const check = (markers: string[], extra = '') => {
    const files = build.epub(markers)
    files['OEBPS/0.xhtml'] = String(files['OEBPS/0.xhtml']).replace('</body>', `${extra}</body>`)
    return checkOutput('epub', build.writeZip(files, ['mimetype']))
  }

  it('reports missing markers', async () => {
    const markers = build.goodMarkers('epub').filter((m) => m !== 'MKTableCellA')
    expectOnly((await check(markers)).problems, /^missing markers: 1 × MKTableCellA/)
  })

  it('reports a known gap that renders after all', async () => {
    const markers = [...build.goodMarkers('epub'), 'MKQuizHint']
    expectOnly((await check(markers)).problems, /^known gap now renders, remove it from KNOWN_GAPS: 1 × MKQuizHint/)
  })

  it('reports a known gap whose fallback text is missing too', async () => {
    const markers = build.goodMarkers('epub').filter((m) => m !== 'tone.wav')
    expectOnly((await check(markers)).problems, /^known gap without its fallback text: 1 × MKAudio \(tone.wav\)/)
  })

  it('reports never-rendered markers, even inside comments', async () => {
    const { problems } = await check(build.goodMarkers('epub'), '<!-- MKCommentLeak -->')
    expectOnly(problems, /^must never render: 1 × MKCommentLeak/)
  })

  it('reports markers glued together', async () => {
    const markers = build.goodMarkers('epub').filter((m) => m !== 'MKTableCellA' && m !== 'MKTableCellB')
    const { problems } = await check([...markers, 'MKTableCellAMKTableCellB'])
    expect(problems).toContainEqual(expect.stringMatching(/^unexpected marker-like words: 1 × MKTableCellAMKTableCellB/))
  })

  it('reads the rendered form of script output', async () => {
    const markers = build.goodMarkers('epub').map((m) => (m === 'MKScriptResult42' ? 'MKScriptResult' : m))
    const { problems } = await check(markers)
    expect(problems).toContainEqual(expect.stringMatching(/^missing markers: 1 × MKScriptResult42/))
  })
})

describe('docx', () => {
  const check = (files: build.Files) => checkOutput('docx', build.writeZip(files))

  it('passes a correct document', async () => {
    expect((await check(build.docx())).problems).toEqual([])
  })

  it('reports orphaned media', async () => {
    const files = build.docx()
    files['word/media/unused.png'] = files['word/media/image1.png']
    expectOnly((await check(files)).problems, /^orphaned media: 1 × word\/media\/unused.png/)
  })

  it('reports relationships to missing parts and unknown relationship ids', async () => {
    const files = build.docx()
    delete files['word/media/image1.png']
    files['word/document.xml'] = String(files['word/document.xml']).replace('r:embed="rId1"', 'r:embed="rId1"/><a:blip r:embed="rId9"')
    const { problems } = await check(files)
    expect(problems).toContainEqual(expect.stringMatching(/^relationships to missing parts: 1 × rId1 → media\/image1.png/))
    expect(problems).toContainEqual(expect.stringMatching(/^document references unknown relationships: 1 × rId9/))
  })

  it('reports media without a content type', async () => {
    const files = build.docx()
    files['word/_rels/document.xml.rels'] = String(files['word/_rels/document.xml.rels']).replace('image1.png', 'image1.svg')
    files['word/media/image1.svg'] = '<svg/>'
    delete files['word/media/image1.png']
    expectOnly((await check(files)).problems, /^media without a content type: 1 × word\/media\/image1.svg/)
  })

  it('reports blob:, data: and file: leaks', async () => {
    const files = build.docx()
    files['word/document.xml'] = String(files['word/document.xml']).replace(
      '</w:body>',
      '<w:p><w:r><w:t>blob:http://x/1 data:image/png;base64,AAAA</w:t></w:r></w:p></w:body>',
    )
    files['word/_rels/document.xml.rels'] = String(files['word/_rels/document.xml.rels']).replace(
      '</Relationships>',
      '<Relationship Id="rId2" Type="hyperlink" Target="file:///home/x/tone.wav" TargetMode="External"/></Relationships>',
    )
    const { problems } = await check(files)
    expect(problems).toContainEqual('blob: URL in word/document.xml: found')
    expect(problems).toContainEqual('data: URI in word/document.xml: found')
    expect(problems).toContainEqual('file: URL in word/_rels/document.xml.rels: found')
  })

  it('reports missing section titles', async () => {
    const files = build.docx()
    files['word/document.xml'] = String(files['word/document.xml']).replace(`>${COURSE.sections[4]}<`, '><')
    expectOnly((await check(files)).problems, /^missing section titles: 1 × Blockquotes/)
  })

  it('reports a document title other than the course title', async () => {
    const files = build.docx()
    files['docProps/core.xml'] = String(files['docProps/core.xml']).replace(COURSE.title, 'LiaScript Export')
    expectOnly((await check(files)).problems, /^wrong dc:title: "LiaScript Export"/)
  })
})

describe('pdf', () => {
  const check = (data: Uint8Array | string) => checkOutput('pdf', build.writeFile('out.pdf', data))

  it('passes a correct document', async () => {
    const result = await check(build.pdf(build.pdfLines()))
    expect(result.problems).toEqual([])
    expect(result.summary.pages).toBe(1)
  })

  it('reports a file that is not a PDF', async () => {
    expectOnly((await check('<html>error page</html>')).problems, /^not a PDF/)
  })

  it('reports a PDF that does not open', async () => {
    expectOnly((await check('%PDF-1.4\ngarbage')).problems, /^PDF does not open/)
  })

  it('reports missing text and a wrong title', async () => {
    const lines = build.pdfLines().filter((line) => line !== 'Tables')
    const { problems } = await check(build.pdf(lines, 'Untitled'))
    expect(problems).toContainEqual(expect.stringMatching(/^title: "Untitled"/))
    expect(problems).toContainEqual(expect.stringMatching(/^missing section titles: 1 × Tables/))
  })

  it('reports a data: URI printed on a page, even wrapped over lines', async () => {
    const lines = [...build.pdfLines(), '![x](data:image/pn', 'g;base64,iVBORw0KGgo)']
    expectOnly((await check(build.pdf(lines))).problems, /^data: URI printed on pages: 1 × 1/)
  })
})

describe('json and fullJson', () => {
  const write = (data: unknown) => build.writeFile('out.json', JSON.stringify(data))

  it('passes a correct export', async () => {
    expect((await checkOutput('json', write(build.json()))).problems).toEqual([])
    expect((await checkOutput('fullJson', write(build.fullJson()))).problems).toEqual([])
  })

  it('reports invalid JSON', async () => {
    expectOnly((await checkOutput('json', build.writeFile('x.json', '{'))).problems, /^invalid JSON/)
  })

  it('reports lost sections and markers', async () => {
    const data = build.json()
    data.sections.pop()
    const { problems } = await checkOutput('json', write(data))
    expect(problems).toContainEqual('section count: 18, expected 19')
    expect(problems).toContainEqual(expect.stringMatching(/^missing markers: 1 × MKCourseEnd/))
  })

  it('reports a wrong survey count', async () => {
    const data = build.fullJson()
    data.survey[14].pop()
    expectOnly((await checkOutput('fullJson', write(data))).problems, /^survey count: \{"14":3\}, expected \{"14":4\}/)
  })
})

describe('rdf', () => {
  const good = {
    '@context': 'http://schema.org/',
    '@type': 'Course',
    name: COURSE.title,
    inLanguage: COURSE.language,
    version: COURSE.version,
    author: { '@type': 'Person', name: COURSE.author, email: COURSE.email },
  }
  const write = (data: unknown) => build.writeFile('out.jsonld', JSON.stringify(data))

  it('passes correct JSON-LD', async () => {
    expect((await checkOutput('rdf', write(good))).problems).toEqual([])
  })

  it('reports a wrong type and name', async () => {
    const { problems } = await checkOutput('rdf', write({ ...good, '@type': 'Book', name: 'x' }))
    expect(problems).toEqual(['wrong @type: "Book", expected "Course"', 'wrong name: "x", expected "Exporter Test Course"'])
  })
})
