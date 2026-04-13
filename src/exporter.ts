// @ts-expect-error - Elm module has no type definitions
import { Elm } from '../LiaScript/src/elm/Worker.elm'

import * as WEB from './export/web'
import * as SCORM12 from './export/scorm12'
import * as SCORM2004 from './export/scorm2004'
import * as PDF from './export/pdf'
import * as EPUB from './export/epub'
import * as DOCX from './export/docx'
import * as helper from './export/helper'
import * as IMS from './export/ims'
import * as ANDROID from './export/android'
import * as PROJECT from './export/project'
import * as RDF from './export/rdf'
import * as XAPI from './export/xapi'

import {
  ExportFormat,
  HelperCommand,
  ElmApp,
  ElmWorker,
  ProjectCollection,
} from './types'
import { Arguments } from './parser'

import YAML from 'yaml'
import path from 'path'
import fs from 'fs-extra'
import fetch from 'node-fetch'

/**
 * Main exporter class that orchestrates the export process
 */
export class Exporter {
  private collection: ProjectCollection | null = null
  private embed: string | undefined = undefined

  /**
   * Executes the export process for the given arguments
   */
  async run(argument: Arguments): Promise<void> {
    const app: ElmApp = (Elm as unknown as { Worker: ElmWorker }).Worker.init({
      flags: { cmd: '' },
    })

    this.setupHelperPort(app, argument)
    this.setupOutputPort(app, argument)

    await this.initiateExport(app, argument)
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
          const template = path.resolve(path.dirname(argument.input), param)
          console.warn('loading:', template)
          const data = fs.readFileSync(template, 'utf8')
          app.ports.input.send([HelperCommand.TEMPLATE, param, data])
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
    app.ports.output.subscribe((event) => {
      let [ok, json] = event

      if (!ok) {
        console.warn('Export failed:', json)
        return
      }

      this.handleExportOutput(argument, json, app)
    })
  }

  /**
   * Routes output to the appropriate exporter based on format
   */
  private handleExportOutput(
    argument: Arguments,
    json: any,
    app: ElmApp,
  ): void {
    switch (argument.format) {
      case ExportFormat.JSON:
      case ExportFormat.FULL_JSON:
        this.exportJson(argument, json)
        break
      case RDF.format:
        RDF.exporter(argument, JSON.parse(json))
        break
      case SCORM12.format:
        this.exportScorm12(argument, JSON.parse(json))
        break
      case SCORM2004.format:
        this.exportScorm2004(argument, JSON.parse(json))
        break
      case IMS.format:
        IMS.exporter(argument, JSON.parse(json))
        break
      case WEB.format:
        WEB.exporter(argument, JSON.parse(json))
        break
      case PDF.format:
        PDF.exporter(argument)
        break
      case EPUB.format:
        EPUB.exporter(argument, JSON.parse(json))
        break
      case DOCX.format:
        DOCX.exporter(argument)
        break
      case ANDROID.format:
        ANDROID.exporter(argument, JSON.parse(json))
        break
      case XAPI.format:
        XAPI.exporter(argument, JSON.parse(json))
        break
      case PROJECT.format:
        this.handleProjectExport(argument, JSON.parse(json), app)
        break
      default:
        console.warn('unknown output format', argument.format)
    }
  }

  /**
   * Exports to JSON format
   */
  private exportJson(argument: Arguments, string: string): void {
    fs.writeFile(argument.output + '.json', string, function (err) {
      if (err) console.error(err)
    })
  }

  /**
   * Exports to SCORM 1.2 format with embedded content if configured
   */
  private exportScorm12(argument: Arguments, json: any): void {
    if (argument['scorm-embed'] || argument['lia-subfolder']) {
      argument['scorm-embed'] = this.embed
    }
    SCORM12.exporter(argument, json)
  }

  /**
   * Exports to SCORM 2004 format with embedded content if configured
   */
  private exportScorm2004(argument: Arguments, json: any): void {
    if (argument['scorm-embed'] || argument['lia-subfolder']) {
      argument['scorm-embed'] = this.embed
    }
    SCORM2004.exporter(argument, json)
  }

  /**
   * Handles multi-course project exports
   */
  private handleProjectExport(
    argument: Arguments,
    json: any,
    app: ElmApp,
  ): void {
    if (this.collection) {
      try {
        PROJECT.storeNext(this.collection, json)

        const next = PROJECT.getNext(this.collection)

        if (next) {
          console.warn('loading:', next)
          app.ports.input.send([ExportFormat.FULL_JSON, next])
        } else {
          PROJECT.exporter(argument, this.collection)
        }
      } catch (e: unknown) {
        console.warn('project export error:', e)
      }
    }
  }

  /**
   * Initiates the export process based on input type and format
   */
  private async initiateExport(
    app: ElmApp,
    argument: Arguments,
  ): Promise<void> {
    try {
      const format = this.determineInternalFormat(argument.format)

      if (argument.format === PROJECT.format) {
        await this.handleProjectInput(app, argument, format)
      } else if (!helper.isURL(argument.input)) {
        await this.handleFileInput(app, argument, format)
      } else if (argument.format === PDF.format) {
        await PDF.exporter(argument)
      } else if (argument.format === DOCX.format) {
        await DOCX.exporter(argument)
      } else if (argument.format === RDF.format) {
        await this.handleUrlInput(app, argument, format)
      } else {
        console.warn('URLs are not allowed as input')
      }
    } catch (err: unknown) {
      console.error(err)
    }
  }

  /**
   * Determines the internal format for processing
   * Some exporters need fulljson as intermediate format
   */
  private determineInternalFormat(format: string): string {
    return format == SCORM12.format ||
      format == SCORM2004.format ||
      format == PDF.format ||
      format == EPUB.format ||
      format == DOCX.format ||
      format == WEB.format ||
      format == IMS.format ||
      format == ANDROID.format ||
      //format == IOS.format ||
      format == RDF.format ||
      format == XAPI.format ||
      format == PROJECT.format ||
      format == EPUB.format
      ? ExportFormat.FULL_JSON
      : format
  }

  /**
   * Handles project (multi-course) input
   */
  private async handleProjectInput(
    app: ElmApp,
    argument: Arguments,
    format: string,
  ): Promise<void> {
    const file = fs.readFileSync(argument.input, 'utf8')
    this.collection = YAML.parse(file)

    if (this.collection) {
      const next = PROJECT.getNext(this.collection)

      if (next === null) {
        PROJECT.exporter(argument, this.collection)
      } else {
        console.warn('loading:', next)
        app.ports.input.send([format, next])
      }
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
    const data = fs.readFileSync(argument.input, 'utf8')
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
    const resp = await fetch(argument.input, {})
    const data = await resp.text()

    if (data) {
      app.ports.input.send([format, data])
    }
  }
}
