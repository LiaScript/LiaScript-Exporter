'use strict'

/**
 * Renders a course in a hidden iframe and hands back its document.
 *
 * The browser counterpart to the Puppeteer page every document exporter drives:
 * `docx.ts` and `epub.ts` launch Chrome, load `assets/pdf/index.html`, wait for
 * the render, then scrape the DOM. Here the same render runs in an iframe and
 * the scraping happens directly.
 *
 * Same-origin is what makes this work at all: the render is served from the
 * app's own origin (copied there by `scripts/copy-webapp-pdf.js`), so
 * `contentDocument` and its shadow roots are reachable.
 */

import { PDF_ENTRY, prepare, PrintJob } from './pdf'

/**
 * The render's "I am done" signal.
 *
 * LiaScript dispatches this on its own `window` once the course has settled,
 * alongside the `__RENDER_DONE__` console line the CLI greps for instead.
 */
const READY_EVENT = 'puppeteer:ready'

/** Title prefix of LiaScript's error report, rendered when a course won't load. */
const ERROR_TITLE = 'Ups, something went wrong'

/** A live render. Call {@link Render.dispose} when finished with `document`. */
export interface Render {
  /** The rendered course's document, ready to scrape. */
  document: Document
  /** The render's window — needed for `getComputedStyle` on its elements. */
  window: Window
  /** Removes the iframe and revokes the course URL. */
  dispose(): void
}

/**
 * Renders `markdown` and resolves once the course has settled.
 *
 * Local files are inlined as data URLs first, by the print path's own
 * {@link prepare}: the render resolves relative paths against the course URL,
 * and a `blob:` course has no directory to resolve against.
 */
export async function render(
  markdown: string,
  files: Record<string, Uint8Array> = {},
  options: Record<string, any> = {},
  onProgress?: (message: string) => void,
): Promise<Render> {
  onProgress?.('Preparing course…')

  const job = await prepare(markdown, files, options)

  onProgress?.('Rendering course…')

  return mount(job, onProgress)
}

/** Mounts the render in a hidden iframe and waits for it to signal. */
function mount(
  job: PrintJob,
  onProgress?: (message: string) => void,
): Promise<Render> {
  const course = URL.createObjectURL(
    new Blob([job.markdown], { type: 'text/markdown' }),
  )

  const frame = document.createElement('iframe')

  /*
   * Off-screen rather than `display: none` or zero-sized: elements in a hidden
   * frame have no layout, so `getBoundingClientRect` returns zeros and anything
   * measured or rasterised comes out empty. The size is also the viewport the
   * course lays out against, matching the CLI's `setViewport` in docx.ts.
   */
  frame.setAttribute(
    'style',
    'position:absolute;left:-10000px;top:0;width:1200px;height:800px;border:0;visibility:hidden;',
  )

  const entry = new URL(PDF_ENTRY, location.href).href
  frame.src = `${entry}?${course}`

  let settled = false

  return new Promise<Render>((resolve, reject) => {
    const dispose = () => {
      frame.remove()
      URL.revokeObjectURL(course)
    }

    const fail = (message: string) => {
      if (settled) return
      settled = true
      stopWatching()
      dispose()
      reject(new Error(message))
    }

    let stopWatching = () => {}

    frame.addEventListener('load', () => {
      const win = frame.contentWindow
      const doc = frame.contentDocument

      if (!win || !doc) {
        fail('the render could not be reached')
        return
      }

      silenceDialogs(win)
      stopWatching = watchProgress(doc, onProgress)

      win.addEventListener(
        READY_EVENT,
        () => {
          if (settled) return

          /*
           * `puppeteer:ready` fires for the error report too — what renders when
           * the course could not be fetched. Scraping that would quietly produce
           * a document of the wrong content. Same check as
           * `scripts/webapp-autoprint.js`.
           */
          if (doc.title.indexOf(ERROR_TITLE) >= 0) {
            fail('the course could not be loaded')
            return
          }

          settled = true
          stopWatching()
          onProgress?.('Extracting content…')
          resolve({ document: doc, window: win, dispose })
        },
        { once: true },
      )
    })

    frame.addEventListener('error', () => fail('the render failed to load'))

    document.body.appendChild(frame)
  })
}

/**
 * Stops the course's own scripts from blocking the render on a modal.
 */
function silenceDialogs(win: Window): void {
  const view = win as any

  view.alert = () => {}
  view.confirm = () => true
  view.prompt = (_message?: string, fallback?: string) => fallback ?? ''
}

/**
 * Reports which slide the render is on, and returns a function to stop.
 */
function watchProgress(
  doc: Document,
  onProgress?: (message: string) => void,
): () => void {
  if (!onProgress) return () => {}

  const title = doc.querySelector('title')

  if (!title) return () => {}

  let last = ''

  const report = () => {
    const slide = doc.title.split('·')[0].trim()

    // The error report has its own title, and `mount` reports that failure.
    if (!slide || slide === last || doc.title.indexOf(ERROR_TITLE) >= 0) return

    last = slide
    onProgress(`Rendering: ${slide}`)
  }

  const observer = new MutationObserver(report)

  observer.observe(title, { childList: true, characterData: true, subtree: true })
  report()

  return () => observer.disconnect()
}
