import * as helper from './export/helper'
import * as WEB from './export/web'
import * as SCORM12 from './export/scorm12'
import * as SCORM2004 from './export/scorm2004'
import * as PDF from './export/pdf'
import * as EPUB from './export/epub'
import * as IMS from './export/ims'
import * as ANDROID from './export/android'
import * as PROJECT from './export/project'
import * as RDF from './export/rdf'
import * as XAPI from './export/xapi'
import * as PRESETS from './export/presets'
import path from 'path'
import { ExportFormat } from './types'

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
}

// Compose all export-specific arguments into a single type
export type Arguments = BaseArguments &
  Partial<WEB.WebExportArguments> &
  Partial<SCORM12.Scorm12ExportArguments> &
  Partial<SCORM2004.Scorm2004ExportArguments> &
  Partial<PDF.PdfExportArguments> &
  Partial<EPUB.EpubExportArguments> &
  Partial<IMS.ImsExportArguments> &
  Partial<ANDROID.AndroidExportArguments> &
  Partial<PROJECT.ProjectExportArguments> &
  Partial<RDF.RDFArguments> &
  Partial<XAPI.XapiExportArguments>

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
    'pdf-format': argv['pdf-format'] || 'A4',
    'pdf-width': argv['pdf-width'],
    'pdf-height': argv['pdf-height'],
    'pdf-margin-top': argv['pdf-margin-top'],
    'pdf-margin-bottom': argv['pdf-margin-bottom'],
    'pdf-margin-right': argv['pdf-margin-right'],
    'pdf-margin-left': argv['pdf-margin-left'],
    'pdf-preferCSSPageSize': argv['pdf-preferCSSPageSize'],
    'pdf-omitBackground': argv['pdf-omitBackground'],
    'pdf-timeout': argv['pdf-timeout'],
    'pdf-stylesheet': argv['pdf-stylesheet'],
    'pdf-theme': argv['pdf-theme'],

    // epub cases
    'epub-author': argv['epub-author'],
    'epub-publisher': argv['epub-publisher'],
    'epub-cover': argv['epub-cover'],
    'epub-stylesheet': argv['epub-stylesheet'],
    'epub-theme': argv['epub-theme'],
    'epub-timeout': argv['epub-timeout'],
    'epub-preview': argv['epub-preview'],

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
    'project-generate-pdf': argv['project-generate-pdf'],
    'project-generate-ims': argv['project-generate-ims'],
    'project-generate-scorm12': argv['project-generate-scorm12'],
    'project-generate-scorm2004': argv['project-generate-scorm2004'],
    'project-generate-android': argv['project-generate-android'],
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
  }

  return argument
}

/**
 * Parses arguments when using presets mode
 */
export function parsePresetsArguments(presetId: string): Arguments {
  const argv = minimist(process.argv.slice(2))

  // Start with basic CLI arguments
  const cliArgs: any = {
    input: argv.i || argv.input,
    output: argv.o || argv.output || 'output',
  }

  // Get preset options and merge with CLI args
  const presetOptions = PRESETS.getPresetOptions(presetId, cliArgs)

  // Build full argument object
  const argument: Arguments = {
    input: presetOptions.input || cliArgs.input,
    readme: presetOptions.input || cliArgs.input,
    output: presetOptions.output || cliArgs.output || 'output',
    format: presetOptions.format || 'json',
    path: argv.p || argv.path,
    key: argv.k || argv.key,
    style: argv.s || argv.style,

    // Apply preset SCORM settings
    'scorm-organization': presetOptions['scorm-organization'],
    'scorm-masteryScore': presetOptions['scorm-masteryScore'],
    'scorm-typicalDuration': presetOptions['scorm-typicalDuration'],
    'scorm-iframe': presetOptions['scorm-iframe'],
    'scorm-embed': presetOptions['scorm-embed'],
    'scorm-alwaysActive': presetOptions['scorm-alwaysActive'],

    // IMS cases
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
    'pdf-format': argv['pdf-format'] || 'A4',
    'pdf-width': argv['pdf-width'],
    'pdf-height': argv['pdf-height'],
    'pdf-margin-top': argv['pdf-margin-top'],
    'pdf-margin-bottom': argv['pdf-margin-bottom'],
    'pdf-margin-right': argv['pdf-margin-right'],
    'pdf-margin-left': argv['pdf-margin-left'],
    'pdf-preferCSSPageSize': argv['pdf-preferCSSPageSize'],
    'pdf-omitBackground': argv['pdf-omitBackground'],
    'pdf-timeout': argv['pdf-timeout'],
    'pdf-stylesheet': argv['pdf-stylesheet'],
    'pdf-theme': argv['pdf-theme'],

    // epub cases
    'epub-author': argv['epub-author'],
    'epub-publisher': argv['epub-publisher'],
    'epub-cover': argv['epub-cover'],
    'epub-stylesheet': argv['epub-stylesheet'],
    'epub-theme': argv['epub-theme'],
    'epub-timeout': argv['epub-timeout'],
    'epub-preview': argv['epub-preview'],

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
    'project-generate-pdf': argv['project-generate-pdf'],
    'project-generate-ims': argv['project-generate-ims'],
    'project-generate-scorm12': argv['project-generate-scorm12'],
    'project-generate-scorm2004': argv['project-generate-scorm2004'],
    'project-generate-android': argv['project-generate-android'],
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
  }

  return argument
}

/**
 * Validates and normalizes parsed arguments
 */
export function validateAndNormalize(argument: Arguments): Arguments {
  argument.format = argument.format.toLowerCase()

  if (argument.format == ANDROID.format) {
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

  if (!argument.path && !helper.isURL(argument.input)) {
    argument.path = path.dirname(argument.input)
  }

  if (!argument.path) {
    argument.path = '.'
  }

  argument.readme = argument.input.replace(argument.path, '.')

  return argument
}
