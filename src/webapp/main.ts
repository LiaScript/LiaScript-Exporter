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
import { exportCourse, download, Course } from './export'
import * as jobs from './jobs'
import { print as printPdf } from './formats/pdf'
import { isZipFile, unpackZip } from './import/zip'
import { fetchCourse } from './import/github'
import { ExportError, translate } from './errors'

import moodleLogo from 'url:./generated/logos/moodle.svg'
import scormLogo from 'url:./generated/logos/scorm.png'
import iliasLogo from 'url:./generated/logos/ilias.png'
import opalLogo from 'url:./generated/logos/opal.png'
import openolatLogo from 'url:./generated/logos/openolat.png'
import edxLogo from 'url:./generated/logos/edx.svg'
import learnworldsLogo from 'url:./generated/logos/learnworlds.png'

// Converted from presets.yaml by scripts/build-webapp-assets.js — neither the
// YAML transformer nor the `yaml` library survives bundling.
import presetsConfig from './generated/presets.json'

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
  'docx',
  'epub',
])

/** Formats rendered as one document in memory; big courses strain the tab. */
const IN_MEMORY = new Set(['pdf', 'docx', 'epub'])

/**
 * Jobs this tab is running, so the status page's poll does not export twice.
 * Per tab, since a record could not be cleared when its tab goes away.
 */
const running = new Set<string>()

/** Reads a form field as a non-empty string, or undefined. */
function field(formData: FormData, name: string): string | undefined {
  const value = formData.get(name)

  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

/** Reads the course out of the form: a GitHub repository, or uploaded files. */
async function readCourse(
  formData: FormData,
  onProgress?: (message: string) => void,
): Promise<Course> {
  const gitUrl = field(formData, 'gitUrl')

  // A repository is a whole-directory source like an archive, and yields the
  // same `Course` shape.
  if (gitUrl) {
    return fetchCourse(gitUrl, {
      branch: field(formData, 'gitBranch'),
      subdir: field(formData, 'gitSubdir'),
      file: field(formData, 'gitFile'),
      onProgress,
    })
  }

  const files = formData.getAll('files').filter((f): f is File => f instanceof File)

  if (files.length === 0) {
    throw new ExportError(
      'errors.upload.noFile',
      'Please choose a course file to export.',
    )
  }

  // An archive carries its own directory structure, so it is unpacked rather
  // than treated as a file alongside the course. The server does the same
  // ahead of the export ([export.ts](../server/routes/export.ts)).
  const zipFile = files.find((f) => isZipFile(f.name))

  if (zipFile) {
    return unpackZip(zipFile)
  }

  // The markdown file is the course; anything alongside it (images, imports)
  // is carried into the store so exporters can copy it.
  const markdownFile = files.find((f) => /\.(md|markdown)$/i.test(f.name))

  if (!markdownFile) {
    throw new ExportError(
      'errors.upload.noMarkdown',
      'No markdown file found. Please choose a .md course file, or a .zip containing one.',
    )
  }

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
      throw new ExportError(
        'errors.export.unknownPreset',
        'Unknown preset "{preset}"',
        { preset: presetId },
      )
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
   * What the UI should say about a format beyond its description:
   * `unavailable` when it cannot run here, `largeCourses` when it builds the
   * whole document in memory and a big course may exhaust the tab.
   */
  formatNotice(format: string): 'unavailable' | 'largeCourses' | null {
    if (!SUPPORTED.has(format)) return 'unavailable'
    if (IN_MEMORY.has(format)) return 'largeCourses'
    return null
  },

  /**
   * Exports the course described by the UI's form.
   *
   * Returns the `{ jobId }` shape `/api/export` returns, so the UI follows one
   * flow either way: confirmation, status page, download. Like the service,
   * this only accepts the job — {@link run} does the work, on the status page.
   * Exporting here instead would tie the export to the home page and finish it
   * before the status page had anything to show.
   *
   * The source is read first, so a bad repository URL or an archive with no
   * markdown still fails on the home page, where the form can be fixed.
   */
  async exportFormData(
    formData: FormData,
    onProgress?: (message: string) => void,
  ): Promise<{ jobId: string; queuePosition: number }> {
    const { format, options } = resolveTarget(formData)

    if (!SUPPORTED.has(format)) {
      throw new ExportError(
        'errors.export.serverOnly',
        '"{format}" needs the export service — it cannot run in a browser.',
        { format },
      )
    }

    // One job at a time, deliberately unlike the service's queue
    // (src/server/queue/jobQueue.ts): a job only runs while its status page is
    // open, and one export can take gigabytes. Before `readCourse`, so nothing
    // is fetched.
    const blocking = await jobs.unfinished()

    if (blocking) {
      throw new ExportError(
        'submit.busy',
        'Another export ({jobId}) has not finished yet. This version runs one export at a time, and only while its status page is open — open it to let it finish, or discard it there.',
        { jobId: blocking.id },
      )
    }

    const course = await readCourse(formData, onProgress)
    const preset = formData.get('preset')

    const jobId = await jobs.start({
      format,
      options,
      course,
      preset: typeof preset === 'string' && preset ? preset : undefined,
      // A fetched course has no uploads to count, so the files it carries stand
      // in — the status page reports what the export actually holds either way.
      fileCount:
        formData.getAll('files').length ||
        Object.keys(course.files ?? {}).length + 1,
    })

    // Nothing is queued, so the position is always zero — the field exists to
    // match the service's response shape.
    return { jobId, queuePosition: 0 }
  },

  /**
   * Runs an unfinished job, where the service's queue would. Called by the
   * status page on every poll; does nothing if the job is missing, finished, or
   * already running.
   */
  async run(id: string, onProgress?: (message: string) => void): Promise<void> {
    if (running.has(id)) return

    running.add(id)

    try {
      const job = await jobs.get(id)

      if (!job || !jobs.isUnfinished(job) || !job.course) return

      const report = (message: string) => {
        onProgress?.(message)
        void jobs.progress(id, message)
      }

      try {
        const result = await exportCourse(
          job.course,
          job.format,
          job.options,
          report,
        )
        await jobs.complete(id, result)
      } catch (error) {
        await jobs.fail(id, LiaExporter.message(error))
      }
    } finally {
      running.delete(id)
    }
  },

  /** Job record for the status page, or undefined if it is unknown. */
  async job(id: string): Promise<jobs.Job | undefined> {
    return jobs.get(id)
  },

  /**
   * Deletes a job. One running in this tab cannot be stopped; its result is
   * dropped.
   */
  async discard(id: string): Promise<void> {
    await jobs.remove(id)
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

  /**
   * The message to show for a failed export, in the current language. The
   * export modules carry locale keys; this is where they meet `window.i18n`.
   */
  message(error: unknown): string {
    const i18n = (window as any).i18n

    return translate(error, i18n ? (key: string) => i18n.t(key) : undefined)
  },
}

declare global {
  interface Window {
    LiaExporter: typeof LiaExporter
  }
}

window.LiaExporter = LiaExporter
