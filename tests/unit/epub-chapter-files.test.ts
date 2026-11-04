/*
 * `withChapterFiles` (src/export/epub.ts): html-to-epub names a chapter file
 * after the slug of its title when it gets no `filename`. A heading that holds
 * a macro (JSXGraph) made a 499-character name and the export stopped with
 * ENAMETOOLONG, so every chapter gets a short file name of its own.
 */
import { describe, expect, it } from 'vitest'
import { withChapterFiles } from '../../src/export/epub'

describe('withChapterFiles', () => {
  it('gives every chapter a short, unique file name and keeps its title', () => {
    const long = 'JXG.Options.slider.snapValues = [-5, -2, -1, 0, 1, 2, 5]; '.repeat(10)
    const chapters = withChapterFiles([
      { title: 'Intro', data: '<p>a</p>' },
      { title: long, data: '<p>b</p>' },
      { title: long, data: '<p>c</p>' },
    ])

    expect(chapters.map((c) => c.filename)).toEqual([
      'chapter_1.xhtml',
      'chapter_2.xhtml',
      'chapter_3.xhtml',
    ])
    expect(chapters[1].title).toBe(long)
    expect(chapters[2].data).toBe('<p>c</p>')
  })
})
