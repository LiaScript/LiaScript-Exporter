/*
 * The network course (tests/fixtures/network): remote images, embeds, a remote
 * template import and a remote script. Only exported with NETWORK=1, since
 * every host it needs can be slow or down.
 *
 * Markers are read from its README like the local course's; this lists what
 * each format is known to lose of it, measured on 2026-09-29.
 */
import * as path from 'node:path'
import type { Fixture } from './course'

const ALT_TEXT = 'alt text is not visible text in a PDF'
const DRAWN = 'the tune title is drawn inside the captured ABC image'
const PRINT_EMBED_LABEL = 'an iframe prints its live content; the label is not kept'
const WATCH_VIDEO = {
  reason: 'a video becomes a thumbnail and a "Watch video" link; the label is not kept',
  fallback: 'dQw4w9WgXcQ',
}
const PLAYER_LABEL = 'the label is a print-only link; the player shows the embed itself'

export const NETWORK_FIXTURE: Fixture = {
  dir: path.join(__dirname, 'network'),

  course: {
    title: 'Network Test Course',
    author: 'LiaScript Exporter Tests',
    email: 'LiaScript@web.de',
    language: 'en',
    version: '1.0.0',
    sections: ['Network Test Course', 'Remote Images', 'Embeds', 'ABC Notation', 'Chartist'],
    quizzes: {},
    surveys: {},
    tasks: {},
    hidden: [],
    // from the remote `import:` of the ABCjs template
    macros: ['ABCJS.render'],
  },

  neverRendered: {},
  renderedAs: {},

  knownGaps: {
    epub: {
      MKNetAbcTune: { reason: DRAWN },
      MKNetYoutube: { ...WATCH_VIDEO, only: ['webapp'] },
    },
    docx: {
      MKNetAbcTune: { reason: DRAWN },
      MKNetYoutube: WATCH_VIDEO,
    },
    pdf: {
      MKNetImageGithub: { reason: ALT_TEXT },
      MKNetImageWikimedia: { reason: ALT_TEXT },
      MKNetImageCors: { reason: ALT_TEXT },
      MKNetYoutube: { reason: PRINT_EMBED_LABEL },
      MKNetEmbed: { reason: PRINT_EMBED_LABEL },
    },
    /** The live player, as for the local course. */
    web: {
      MKNetYoutube: { reason: PLAYER_LABEL },
      MKNetEmbed: { reason: PLAYER_LABEL },
    },
  },
}
