// @ts-expect-error - Elm module has no type definitions
import { Elm } from '../LiaScript/src/elm/Worker.elm'

import * as WEB from './export/web'
import * as SCORM12 from './export/scorm12'
import * as SCORM2004 from './export/scorm2004'
import * as helper from './export/helper'
import * as IMS from './export/ims'
import * as RDF from './export/rdf'
import * as XAPI from './export/xapi'

import { getNext, storeNext } from './export/collection'

import {
  ExportFormat,
  HelperCommand,
  ElmApp,
  ElmWorker,
  ProjectCollection,
} from './types'
import { Arguments } from './parser'

import * as fsPath from './fs/path'

/*
 * Formats that cannot be part of the browser bundle, named here rather than
 * imported.
 *
 * `pdf`, `docx` and `epub` import Puppeteer at module scope, `android` shells
 * out to Gradle, and `project` imports all four plus `child_process`. A static
 * import or require — even in an unreachable branch — puts them in the module
 * graph, which Parcel then fails to bundle. The Node entry point registers the
 * real exporters instead, so the browser build simply never has them and
 * reports a clear error.
 *
 * "Server only" is about this module graph, not what the browser can produce:
 * `pdf` also renders in a print tab, returning from `exportCourse` before the
 * `Exporter` is built, so the `PDF` branches below stay Node's.
 * @see [src/webapp/pdf.ts](./webapp/pdf.ts)
 *
 * @see registerServerExporters, called by [src/index.ts](./index.ts)
 */
const SERVER_ONLY = {
  PDF: 'pdf',
  EPUB: 'epub',
  DOCX: 'docx',
  ANDROID: 'android',
  PROJECT: 'project',
} as const

const registry = new Map<string, any>()

/** Registers the Node-only exporters. Called once by the CLI entry point. */
export function registerServerExporters(exporters: Record<string, any>): void {
  for (const [name, exporter] of Object.entries(exporters)) {
    registry.set(name, exporter)
  }
}

function serverExporter(name: string): any {
  const exporter = registry.get(name)

  if (!exporter) {
    throw new Error(
      `"${name}" cannot be exported here — it needs the export service`,
    )
  }

  return exporter
}

/*
 * Node-only dependencies, required lazily so this module can be bundled for the
 * browser — see the same note in `helper.ts`, including why call sites must
 * write `require(...)` literally. Every call below is on a CLI-only path; in
 * the browser the course lives in `argument.fs`, which `readInput` prefers.
 */
function nodeFS() {
  return require('fs-extra')
}

function nodePath() {
  return require('path')
}

/**
 * Main exporter class that orchestrates the export process
 */
export class Exporter {
  private collection: ProjectCollection | null = null
  private embed: string | undefined = undefined

  /**
   * Reads a course or template from the export store when it is there, and from
   * disk otherwise — which keeps `--git-*` and temp-dir inputs working.
   */
  private async readInput(argument: Arguments, file: string): Promise<string> {
    const store = argument.fs

    if (store && (await store.exists(file))) {
      return store.readFile(file)
    }

    return nodeFS().readFileSync(file, 'utf8')
  }

  /**
   * True while a `project` collection still has courses left to fetch, so the
   * run is not yet finished even though the output port has fired.
   */
  private hasPending(): boolean {
    return !!this.collection && getNext(this.collection) !== null
  }

  /** Resolves the current run once an exporter has finished writing. */
  private finish: (() => void) | null = null
  /** Rejects the current run when Elm or an exporter reports failure. */
  private fail: ((reason: Error) => void) | null = null

  /**
   * Executes the export process for the given arguments.
   *
   * Resolves once the exporter has finished writing, not once the course has
   * merely been handed to Elm: the browser reads the result out of the store
   * afterwards, and under Node the process previously survived long enough only
   * by accident.
   */
  async run(argument: Arguments): Promise<void> {
    const app: ElmApp = (Elm as unknown as { Worker: ElmWorker }).Worker.init({
      flags: { cmd: '' },
    })

    const completed = new Promise<void>((resolve, reject) => {
      this.finish = resolve
      this.fail = reject
    })

    this.setupHelperPort(app, argument)
    this.setupOutputPort(app, argument)

    await this.initiateExport(app, argument)

    return completed
  }

  /**
   * Sets up the helper port for file loading and debugging
   */
  private setupHelperPort(app: ElmApp, argument: Arguments): void {
    app.ports.helper.subscribe(async ([cmd, param]) => {
      switch (cmd) {
        case HelperCommand.DEBUG:
          console.warn('DEBUG', param)
          break
        case HelperCommand.FILE:
          // Resolved against the course, which in the browser means the store's
          // own directory rather than a path on disk.
          const template = argument.fs
            ? fsPath.join(fsPath.dirname(argument.input), param)
            : nodePath().resolve(nodePath().dirname(argument.input), param)
          console.warn('loading:', template)
          try {
            const data = await this.readInput(argument, template)
            app.ports.input.send([HelperCommand.TEMPLATE, param, data])
          } catch (err) {
            console.warn(`could not load "${param}":`, err)
          }
          break
        default:
          console.warn('unknown command:', cmd, param)
      }
    })
  }

  /**
   * Sets up the output port for handling export results
   */
  private setupOutputPort(app: ElmApp, argument: Arguments): void {
    app.ports.output.subscribe(async (event) => {
      let [ok, json] = event

      if (!ok) {
        console.warn('Export failed:', json)
        this.fail?.(new Error(String(json)))
        return
      }

      try {
        await this.handleExportOutput(argument, json, app)

        // `project` drives this port once per course and drains the collection
        // itself, so only the final pass may resolve the run.
        if (argument.format !== SERVER_ONLY.PROJECT || !this.hasPending()) {
          this.finish?.()
        }
      } catch (err) {
        this.fail?.(err instanceof Error ? err : new Error(String(err)))
      }
    })
  }

  /**
   * Routes output to the appropriate exporter based on format
   */
  private async handleExportOutput(
    argument: Arguments,
    json: any,
    app: ElmApp,
  ): Promise<void> {
    switch (argument.format) {
      case ExportFormat.JSON:
      case ExportFormat.FULL_JSON:
        await this.exportJson(argument, json)
        break
      case RDF.format:
        await RDF.exporter(argument, JSON.parse(json))
        break
      case SCORM12.format:
        await this.exportScorm12(argument, JSON.parse(json))
        break
      case SCORM2004.format:
        await this.exportScorm2004(argument, JSON.parse(json))
        break
      case IMS.format:
        await IMS.exporter(argument, JSON.parse(json))
        break
      case WEB.format:
        await WEB.exporter(argument, JSON.parse(json))
        break
      case SERVER_ONLY.PDF:
        await serverExporter('pdf').exporter(argument)
        break
      case SERVER_ONLY.EPUB:
        await serverExporter('epub').exporter(argument, JSON.parse(json))
        break
      case SERVER_ONLY.DOCX:
        await serverExporter('docx').exporter(argument)
        break
      case SERVER_ONLY.ANDROID:
        await serverExporter('android').exporter(argument, JSON.parse(json))
        break
      case XAPI.format:
        await XAPI.exporter(argument, JSON.parse(json))
        break
      case SERVER_ONLY.PROJECT:
        await this.handleProjectExport(argument, JSON.parse(json), app)
        break
      default:
        console.warn('unknown output format', argument.format)
    }
  }

  /**
   * Exports to JSON format
   */
  private async exportJson(argument: Arguments, string: string): Promise<void> {
    // Awaited rather than `.catch`-logged: a failed write has to reach the
    // caller, which in the browser is waiting to read the result back.
    await argument.fs!.writeFile(argument.output + '.json', string)
  }

  /**
   * Exports to SCORM 1.2 format with embedded content if configured
   */
  private async exportScorm12(argument: Arguments, json: any): Promise<void> {
    if (argument['scorm-embed'] || argument['lia-subfolder']) {
      argument['scorm-embed'] = this.embed
    }
    await SCORM12.exporter(argument, json)
  }

  /**
   * Exports to SCORM 2004 format with embedded content if configured
   */
  private async exportScorm2004(argument: Arguments, json: any): Promise<void> {
    if (argument['scorm-embed'] || argument['lia-subfolder']) {
      argument['scorm-embed'] = this.embed
    }
    await SCORM2004.exporter(argument, json)
  }

  /**
   * Handles multi-course project exports
   */
  private async handleProjectExport(
    argument: Arguments,
    json: any,
    app: ElmApp,
  ): Promise<void> {
    if (!this.collection) return

    storeNext(this.collection, json)

    const next = getNext(this.collection)

    if (next) {
      console.warn('loading:', next)
      app.ports.input.send([ExportFormat.FULL_JSON, next])
    } else {
      await serverExporter('project').exporter(argument, this.collection)
    }
  }

  /**
   * Initiates the export process based on input type and format.
   *
   * Every branch must settle the run: those that hand the course to Elm leave
   * that to the output port, the two that export straight from a URL resolve
   * here instead.
   */
  private async initiateExport(
    app: ElmApp,
    argument: Arguments,
  ): Promise<void> {
    try {
      const format = this.determineInternalFormat(argument.format)

      if (argument.format === SERVER_ONLY.PROJECT) {
        await this.handleProjectInput(app, argument, format)
      } else if (!helper.isURL(argument.input)) {
        await this.handleFileInput(app, argument, format)
      } else if (argument.format === SERVER_ONLY.PDF) {
        await serverExporter('pdf').exporter(argument)
        this.finish?.()
      } else if (argument.format === SERVER_ONLY.DOCX) {
        await serverExporter('docx').exporter(argument)
        this.finish?.()
      } else if (argument.format === RDF.format) {
        await this.handleUrlInput(app, argument, format)
      } else {
        throw new Error(`URLs are not allowed as input for "${argument.format}"`)
      }
    } catch (err: unknown) {
      // Nothing fires the output port after this, so log-only would hang.
      this.fail?.(err instanceof Error ? err : new Error(String(err)))
    }
  }

  /**
   * Determines the internal format for processing
   * Some exporters need fulljson as intermediate format
   */
  private determineInternalFormat(format: string): string {
    const needsFullJson = new Set<string>([
      SCORM12.format,
      SCORM2004.format,
      WEB.format,
      IMS.format,
      RDF.format,
      XAPI.format,
      SERVER_ONLY.PROJECT,
      SERVER_ONLY.PDF,
      SERVER_ONLY.EPUB,
      SERVER_ONLY.DOCX,
      SERVER_ONLY.ANDROID,
    ])

    return needsFullJson.has(format) ? ExportFormat.FULL_JSON : format
  }

  /**
   * Handles project (multi-course) input
   */
  private async handleProjectInput(
    app: ElmApp,
    argument: Arguments,
    format: string,
  ): Promise<void> {
    const file = await this.readInput(argument, argument.input)
    // Required lazily: `project` is Node-only, and the `yaml` package does not
    // survive browser bundling — Parcel emits a reference it never links, and
    // the page dies on "$…$import$… is not defined" before the UI starts.
    this.collection = require('yaml').parse(file)

    if (!this.collection) {
      throw new Error(`"${argument.input}" holds no project collection`)
    }

    const next = getNext(this.collection)

    if (next === null) {
      // Already fully populated, so the output port never fires.
      await serverExporter('project').exporter(argument, this.collection)
      this.finish?.()
    } else {
      console.warn('loading:', next)
      app.ports.input.send([format, next])
    }
  }

  /**
   * Handles file-based input
   */
  private async handleFileInput(
    app: ElmApp,
    argument: Arguments,
    format: string,
  ): Promise<void> {
    const data = await this.readInput(argument, argument.input)
    this.embed = data
    app.ports.input.send([format, data])
  }

  /**
   * Handles URL-based input
   */
  private async handleUrlInput(
    app: ElmApp,
    argument: Arguments,
    format: string,
  ): Promise<void> {
    const resp = await helper.fetch(argument.input, {})
    const data = await resp.text()

    if (data) {
      app.ports.input.send([format, data])
    }
  }
}
