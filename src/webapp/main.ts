'use strict'

/**
 * Browser entry point for the standalone app.
 *
 * Publishes `window.LiaExporter`, the seam [app.js](../server/public/app.js)
 * branches on: when it exists the UI exports in this tab, otherwise the same UI
 * posts to the export service as before. One UI serves both, which is why this
 * is a small adapter rather than a second front end.
 */

import { toOptions } from '../export/options'
import { exportCourse, download, Course } from './index'
import * as jobs from './jobs'
import { print as printPdf } from './pdf'

import moodleLogo from 'url:./static/logos/moodle.svg'
import scormLogo from 'url:./static/logos/scorm.png'
import iliasLogo from 'url:./static/logos/ilias.png'
import opalLogo from 'url:./static/logos/opal.png'
import openolatLogo from 'url:./static/logos/openolat.png'
import edxLogo from 'url:./static/logos/edx.svg'
import learnworldsLogo from 'url:./static/logos/learnworlds.png'

// Converted from presets.yaml by scripts/build-webapp-assets.js — neither the
// YAML transformer nor the `yaml` library survives bundling.
import presetsConfig from './static/presets.json'

// Locales are inlined for the same reason; i18n.js reads them off the global
// rather than fetching `locales/<lang>.json`.
import enLocale from '../server/public/locales/en.json'
import deLocale from '../server/public/locales/de.json'

;(window as any).LiaLocales = { en: enLocale, de: deLocale }

// Logos are named by the preset data, not by markup, so Parcel cannot discover
// them: each is imported explicitly and the data's `../assets/<file>` URLs are
// rewritten to the emitted ones.
const LOGOS: Record<string, string> = {
  'moodle.svg': moodleLogo,
  'scorm.png': scormLogo,
  'ilias.png': iliasLogo,
  'opal.png': opalLogo,
  'openolat.png': openolatLogo,
  'edx.svg': edxLogo,
  'learnworlds.png': learnworldsLogo,
}

for (const preset of (presetsConfig as any).presets ?? []) {
  const file = preset?.logo?.url?.split('/').pop()

  if (file && LOGOS[file]) {
    preset.logo.url = LOGOS[file]
  }
}

/** Formats this build can export; everything else needs the export service. */
const SUPPORTED = new Set([
  'json',
  'fulljson',
  'web',
  'ims',
  'xapi',
  'rdf',
  'scorm1.2',
  'scorm2004',
  'pdf',
])

/** Reads the course out of the form's uploaded files. */
async function readCourse(formData: FormData): Promise<Course> {
  const files = formData.getAll('files').filter((f): f is File => f instanceof File)

  if (files.length === 0) {
    throw new Error('Please choose a course file to export.')
  }

  // The markdown file is the course; anything alongside it (images, imports)
  // is carried into the store so exporters can copy it.
  const markdownFile =
    files.find((f) => /\.(md|markdown)$/i.test(f.name)) ?? files[0]

  const extra: Record<string, Uint8Array> = {}

  for (const file of files) {
    if (file === markdownFile) continue
    extra[file.name] = new Uint8Array(await file.arrayBuffer())
  }

  return {
    markdown: await markdownFile.text(),
    name: markdownFile.name.replace(/\.(md|markdown)$/i, '') || 'course',
    files: extra,
  }
}

/** Resolves the form's preset or format choice into a format plus options. */
function resolveTarget(formData: FormData): {
  format: string
  options: Record<string, any>
} {
  const userOptions: Record<string, any> = {}

  // `forEach` rather than `entries()`: tsconfig omits dom.iterable.
  formData.forEach((value, key) => {
    if (key.startsWith('option_')) {
      userOptions[key.slice('option_'.length)] = value
    }
  })

  const presetId = formData.get('preset')

  if (typeof presetId === 'string' && presetId) {
    const preset = presetsConfig.presets.find((p: any) => p.id === presetId)

    if (!preset) {
      throw new Error(`Unknown preset "${presetId}"`)
    }

    const format = preset.format || 'scorm2004'
    return { format, options: toOptions(format, preset.options, userOptions) }
  }

  const format = String(formData.get('format') || 'web')
  return { format, options: toOptions(format, {}, userOptions) }
}

const LiaExporter = {
  /** Presets for the UI, in the same shape `/api/presets` returns. */
  presets(): any[] {
    return presetsConfig.presets
  },

  /** Formats this build can handle, for greying out the rest. */
  supports(format: string): boolean {
    return SUPPORTED.has(format)
  },

  /**
   * Exports the course described by the UI's form.
   *
   * Returns the `{ jobId }` shape `/api/export` returns, so the UI follows one
   * flow either way: confirmation, status page, download. The export is already
   * finished by the time this resolves — the job record exists to give the
   * status page something to show and somewhere to keep the bytes.
   */
  async exportFormData(
    formData: FormData,
    onProgress?: (message: string) => void,
  ): Promise<{ jobId: string; queuePosition: number }> {
    if (formData.get('gitUrl')) {
      throw new Error(
        'Exporting straight from a Git URL is not available in the browser yet — download the course and upload it instead.',
      )
    }

    const { format, options } = resolveTarget(formData)

    if (!SUPPORTED.has(format)) {
      throw new Error(
        `"${format}" needs the export service — it cannot run in a browser.`,
      )
    }

    const course = await readCourse(formData)
    const preset = formData.get('preset')

    const jobId = await jobs.start({
      format,
      preset: typeof preset === 'string' && preset ? preset : undefined,
      fileCount: formData.getAll('files').length,
    })

    try {
      const result = await exportCourse(course, format, options, onProgress)
      await jobs.complete(jobId, result)
    } catch (error) {
      await jobs.fail(
        jobId,
        error instanceof Error ? error.message : String(error),
      )
      throw error
    }

    // Nothing is queued, so the position is always zero — the field exists to
    // match the service's response shape.
    return { jobId, queuePosition: 0 }
  },

  /** Job record for the status page, or undefined if it is unknown. */
  async job(id: string): Promise<jobs.Job | undefined> {
    return jobs.get(id)
  },

  /**
   * Finishes a job: a download for most formats, the print dialog for `pdf`.
   * `'gone'` means the record expired, `'blocked'` that the browser refused the
   * print tab, so the UI can say which happened.
   *
   * Must be called from a user gesture, or the print tab is blocked as a popup;
   * the IndexedDB read below stays inside the activation window.
   */
  async download(id: string): Promise<'ok' | 'gone' | 'blocked'> {
    const job = await jobs.get(id)

    if (!job) return 'gone'

    if (job.print) {
      return printPdf(job.print) ? 'ok' : 'blocked'
    }

    if (!job.bytes || !job.filename) {
      return 'gone'
    }

    download(job.bytes, job.filename)
    return 'ok'
  },
}

declare global {
  interface Window {
    LiaExporter: typeof LiaExporter
  }
}

window.LiaExporter = LiaExporter
