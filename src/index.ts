/**
 * LiaScript-Exporter - Main Entry Point
 *
 * This module coordinates the command-line interface, argument parsing,
 * and export orchestration for converting LiaScript markdown files to
 * various output formats.
 */

import packageJson from '../package.json'
// @ts-expect-error - xhr2 has no type definitions
import XMLHttpRequest from 'xhr2'
// @ts-expect-error - minimist has no type definitions
import minimist from 'minimist'

import { displayHelp } from './cli'
import { parseArguments, validateAndNormalize } from './parser'
import { Exporter } from './exporter'

// Setup global XMLHttpRequest for Node.js environment
global.XMLHttpRequest = XMLHttpRequest

const argv = minimist(process.argv.slice(2))

/**
 * Main execution flow
 */
async function main(): Promise<void> {
  if (argv.v || argv.version) {
    console.log('version:', packageJson.version)
  } else if (argv.h || argv.help) {
    displayHelp()
  } else if (argv.i || argv.input) {
    const args = parseArguments()
    const validatedArgs = validateAndNormalize(args)
    const exporter = new Exporter()
    await exporter.run(validatedArgs)
  } else {
    console.warn('No input defined')
    displayHelp()
  }
}

// Execute main function
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
