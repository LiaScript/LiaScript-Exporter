import * as helper from './export/helper'
import * as WEB from './export/web'
import * as SCORM12 from './export/scorm12'
import * as SCORM2004 from './export/scorm2004'
import * as IMS from './export/ims'
import * as PROJECT from './export/project'
import * as RDF from './export/rdf'
import * as XAPI from './export/xapi'
import * as H5P from './export/h5p'

/*
 * Server-only formats are imported for their argument types only: `parser.ts`
 * is reached from the browser build (it owns `Arguments`), and a value import
 * would put Puppeteer and the Android toolchain in its graph for the bundler to
 * choke on. `ANDROID_FORMAT` below is inlined for the same reason.
 */
import type * as PDF from './export/pdf'
import type * as EPUB from './export/epub'
import type * as ANDROID from './export/android'
import type * as DOCX from './export/docx'

/** Mirrors `ANDROID.format`, inlined to keep that module out of the graph. */
const ANDROID_FORMAT = 'android'
import * as PRESETS from './export/presets'
import * as STORAGE from './export/scorm-storage'
import path from 'path'
import { ExportFormat } from './types'
import { ExportFS, NodeFS } from './fs'

// @ts-expect-error - minimist has no type definitions
import minimist from 'minimist'

// Type aliases for cleaner composition
type BaseArguments = {
  input: string
  readme: string
  output: string
  format: string
  path: string
  key?: string
  style?: string

  /**
   * Storage backing for this export.
   *
   * Optional while exporters are ported one at a time: those still calling
   * `fs-extra` directly ignore it, ported ones use it instead and so become
   * runnable in the browser. Defaults to a `NodeFS` when the CLI builds the
   * arguments. Once every format is ported this can become required.
   */
  fs?: ExportFS

  /**
   * Where the SCORM packager's own schemas live, when they are not at its
   * install location — which is the case in the browser, where they are seeded
   * into the store. Left undefined under Node, so the packager resolves them
   * itself. See `src/fs/scorm-adapter.ts`.
   */
  'scorm-schema-root'?: string
}

// Compose all export-specific arguments into a single type
export type Arguments = BaseArguments &
  Partial<WEB.WebExportArguments> &
  Partial<SCORM12.Scorm12ExportArguments> &
  Partial<SCORM2004.Scorm2004ExportArguments> &
  Partial<PDF.PdfExportArguments> &
  Partial<EPUB.EpubExportArguments> &
  Partial<DOCX.DocxExportArguments> &
  Partial<IMS.ImsExportArguments> &
  Partial<ANDROID.AndroidExportArguments> &
  Partial<PROJECT.ProjectExportArguments> &
  Partial<RDF.RDFArguments> &
  Partial<XAPI.XapiExportArguments> &
  Partial<H5P.H5pExportArguments>

/**
 * Escapes backslashes in Windows paths
 */
function escapeBackslash(path?: string): string | undefined {
  if (path) {
    return path.replace(/\\/g, '\\\\')
  }
  return path
}

/**
 * Parses command-line arguments into a structured Arguments object
 */
export function parseArguments(): Arguments {
  const argv = minimist(process.argv.slice(2))

  const argument: Arguments = {
    input: argv.i || argv.input,
    readme: argv.i || argv.input,
    output: argv.o || argv.output || 'output',
    format: argv.f || argv.format || 'json',
    path: argv.p || argv.path,
    key: argv.k || argv.key,
    style: argv.s || argv.style,

    // special cases for SCORM
    'scorm-organization': argv['scorm-organization'],
    'scorm-masteryScore': argv['scorm-masteryScore'],
    'scorm-typicalDuration': argv['scorm-typicalDuration'],
    'scorm-iframe': argv['scorm-iframe'],
    'scorm-embed': argv['scorm-embed'],
    'scorm-alwaysActive': argv['scorm-alwaysActive'],
    'scorm-storage': argv['scorm-storage'],
    'lia-subfolder': argv['lia-subfolder'],

    // special IMS cases
    'ims-indexeddb': argv['ims-indexeddb'],

    // web-cases
    'web-zip': argv['web-zip'],
    'web-indexeddb': argv['web-indexeddb'],
    'web-iframe': argv['web-iframe'],

    // pdf cases
    'pdf-preview': argv['pdf-preview'],
    'pdf-scale': argv['pdf-scale'],
    'pdf-displayHeaderFooter': argv['pdf-displayHeaderFooter'],
    'pdf-headerTemplate': argv['pdf-headerTemplate'],
    'pdf-footerTemplate': argv['pdf-footerTemplate'],
    'pdf-printBackground': argv['pdf-printBackground'],
    'pdf-landscape': argv['pdf-landscape'],
    'pdf-format': argv['pdf-format'],
    'pdf-width': argv['pdf-width'],
    'pdf-height': argv['pdf-height'],
    'pdf-margin-top': argv['pdf-margin-top'],
    'pdf-margin-bottom': argv['pdf-margin-bottom'],
    'pdf-margin-right': argv['pdf-margin-right'],
    'pdf-margin-left': argv['pdf-margin-left'],
    'pdf-pageRanges': argv['pdf-pageRanges'],
    'pdf-preferCSSPageSize': argv['pdf-preferCSSPageSize'],
    'pdf-omitBackground': argv['pdf-omitBackground'],
    'pdf-timeout': argv['pdf-timeout'],
    'pdf-stylesheet': argv['pdf-stylesheet'],
    'pdf-theme': argv['pdf-theme'],

    // epub cases
    'epub-title': argv['epub-title'],
    'epub-author': argv['epub-author'],
    'epub-publisher': argv['epub-publisher'],
    'epub-cover': argv['epub-cover'],
    'epub-description': argv['epub-description'],
    'epub-language': argv['epub-language'],
    'epub-version': argv['epub-version'],
    'epub-stylesheet': argv['epub-stylesheet'],
    'epub-theme': argv['epub-theme'],
    'epub-toc-title': argv['epub-toc-title'],
    'epub-hide-toc': argv['epub-hide-toc'],
    'epub-timeout': argv['epub-timeout'],
    'epub-fonts': argv['epub-fonts'],
    'epub-chapter-title': argv['epub-chapter-title'],
    'epub-preview': argv['epub-preview'],

    // docx cases
    'docx-title': argv['docx-title'],
    'docx-author': argv['docx-author'],
    'docx-subject': argv['docx-subject'],
    'docx-description': argv['docx-description'],
    'docx-language': argv['docx-language'],
    'docx-orientation': argv['docx-orientation'],
    'docx-font': argv['docx-font'],
    'docx-font-size': argv['docx-font-size'],
    'docx-header': argv['docx-header'],
    'docx-header-html': argv['docx-header-html'],
    'docx-footer': argv['docx-footer'],
    'docx-footer-html': argv['docx-footer-html'],
    'docx-page-number': argv['docx-page-number'],
    'docx-stylesheet': argv['docx-stylesheet'],
    'docx-theme': argv['docx-theme'],
    'docx-timeout': argv['docx-timeout'],
    'docx-preview': argv['docx-preview'],

    'android-sdk': escapeBackslash(argv['android-sdk']),
    'android-appId': argv['android-appId'],
    'android-appName': argv['android-appName'],
    'android-icon': escapeBackslash(argv['android-icon']),
    'android-iconBackgroundColor': argv['android-iconBackgroundColor'],
    'android-iconBackgroundColorDark': argv['android-iconBackgroundColorDark'],
    'android-preview': argv['android-preview'],
    'android-release': argv['android-release'],
    'android-bundle': argv['android-bundle'],
    'android-keystore': escapeBackslash(argv['android-keystore']),
    'android-keystorePassword': argv['android-keystorePassword'],
    'android-keyAlias': argv['android-keyAlias'],
    'android-keyPassword': argv['android-keyPassword'],

    // project settings
    'project-no-meta': argv['project-no-meta'],
    'project-no-rdf': argv['project-no-rdf'],
    'project-no-categories': argv['project-no-categories'],
    'project-category-blur': argv['project-category-blur'],
    'project-search': argv['project-search'],
    'project-generate-pdf': argv['project-generate-pdf'],
    'project-generate-ims': argv['project-generate-ims'],
    'project-generate-scorm12': argv['project-generate-scorm12'],
    'project-generate-scorm2004': argv['project-generate-scorm2004'],
    'project-generate-android': argv['project-generate-android'],
    'project-generate-epub': argv['project-generate-epub'],
    'project-generate-docx': argv['project-generate-docx'],
    'project-generate-xapi': argv['project-generate-xapi'],
    'project-generate-h5p': argv['project-generate-h5p'],
    'project-generate-cache': argv['project-generate-cache'],

    // RDF settings
    'rdf-format': argv['rdf-format'],
    'rdf-preview': argv['rdf-preview'],
    'rdf-url': argv['rdf-url'],
    'rdf-type': argv['rdf-type'],
    'rdf-license': argv['rdf-license'],
    'rdf-educationalLevel': argv['rdf-educationalLevel'],
    'rdf-template': argv['rdf-template'],

    // xAPI settings
    'xapi-endpoint': argv['xapi-endpoint'],
    'xapi-auth': argv['xapi-auth'],
    'xapi-actor': argv['xapi-actor'],
    'xapi-course-id': argv['xapi-course-id'],
    'xapi-course-title': argv['xapi-course-title'],
    'xapi-mastery-threshold': argv['xapi-mastery-threshold'],
    'xapi-progress-threshold': argv['xapi-progress-threshold'],
    'xapi-debug': argv['xapi-debug'],
    'xapi-zip': argv['xapi-zip'],

    // H5P settings
    'h5p-height': argv['h5p-height'],
    'h5p-mastery': argv['h5p-mastery'],
  }

  return argument
}

/**
 * Parses arguments when using presets mode
 *
 * The preset fills in only what the command line leaves open, so any flag
 * passed alongside the preset (`--scorm-organization`, `--no-scorm-iframe`,
 * ...) overrides the preset's default.
 */
export function parsePresetsArguments(presetId: string): Arguments {
  const argument: any = parseArguments()
  const presetOptions = PRESETS.getPresetOptions(presetId)

  for (const [key, value] of Object.entries(presetOptions)) {
    if (key === 'format' || argument[key] === undefined) {
      argument[key] = value
    }
  }

  return argument as Arguments
}

/**
 * Validates and normalizes parsed arguments
 */
export function validateAndNormalize(argument: Arguments): Arguments {
  argument.format = argument.format.toLowerCase()

  // minimist keeps `--pdf-printBackground false` as the string 'false', which
  // every exporter would read as true. Only a bare flag or `--no-x` is boolean.
  for (const [key, value] of Object.entries(argument)) {
    if (value === 'true' || value === 'false') {
      ;(argument as any)[key] = value === 'true'
    }
  }

  // Every CLI path lands here, so this is the one place the disk backing needs
  // to be supplied. A caller that already set one (the browser, or a test)
  // keeps it.
  argument.fs = argument.fs || new NodeFS()

  if (argument.format == ANDROID_FORMAT) {
    argument['android-sdk'] =
      argument['android-sdk'] ||
      process.env.ANDROID_SDK_ROOT ||
      process.env.ANDROID_HOME

    if (!argument['android-sdk']) {
      console.warn('Path to SDK has to be defined, you will have to install:')
      console.warn('https://developer.android.com/studio/')
      console.warn(
        'Or set the ANDROID_SDK_ROOT or ANDROID_HOME environment variable.',
      )
      process.exit(1)
    }

    if (!argument['android-appId']) {
      console.warn('The appId has to provided to uniquely identify your App.')
      console.warn('This can be the URL of your site in reverse order, eg.:')
      console.warn('io.github.liascript')
      process.exit(1)
    }
  }

  // fail early on a typo, not after parsing the course
  STORAGE.storageMode(argument)

  if (!argument.path && !helper.isURL(argument.input)) {
    argument.path = path.dirname(argument.input)
  }

  if (!argument.path) {
    argument.path = '.'
  }

  argument.readme = argument.input.replace(argument.path, '.')

  return argument
}
