import * as COLOR from './colorize'
import * as SCORM12 from './export/scorm12'
import * as IMS from './export/ims'
import * as ANDROID from './export/android'
import * as PDF from './export/pdf'
import * as EPUB from './export/epub'
import * as DOCX from './export/docx'
import * as PROJECT from './export/project'
import * as RDF from './export/rdf'
import * as XAPI from './export/xapi'
import * as PRESETS from './export/presets'

/**
 * Displays comprehensive help information for all export formats
 */
export function displayHelp(): void {
  console.log(COLOR.heading('LiaScript-Exporter'))
  console.log('')
  COLOR.info(
    'Export your LiaScript Markdown files to different formats. You can either use the serve option in order to have a nice UI or use the commandline options below. Based on the selected output format, additional options can be used.',
  )
  console.log('')

  console.log(COLOR.heading('Server:'))
  COLOR.command(
    'serve',
    '[--port PORT]',
    'Start the export server with web interface (default port: 3000)',
  )

  console.log('')
  console.log(COLOR.heading('CLI - Commands:\n'))

  COLOR.command('-h', '--help', 'show this help')
  COLOR.command('-i', '--input', 'file to be used as input')
  COLOR.command(
    '-p',
    '--path',
    'path to be packed, if not set, the path of the input file is used',
  )
  COLOR.command(
    '-o',
    '--output',
    'output file name (default is output), the ending is define by the format',
  )
  COLOR.command(
    '-s',
    '--style',
    'additional styling to passed to the export, can be used for fixes, such as "height: 100vh; width: 100%; border: 2px;"',
  )
  COLOR.command(
    '-f',
    '--format',
    'scorm1.2, scorm2004, json, fullJson, web, ims, pdf, epub, docx, android, linkedData, presets (default is json)',
  )
  COLOR.command('-v', '--version', 'output the current version')
  COLOR.command('\n-k', '--key', 'responsive voice key ')

  PRESETS.help()
  SCORM12.help()
  IMS.help()
  ANDROID.help()
  PDF.help()
  EPUB.help()
  DOCX.help()
  PROJECT.help()
  RDF.help()
  XAPI.help()
}
