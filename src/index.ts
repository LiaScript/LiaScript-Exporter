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
import {
  parseArguments,
  validateAndNormalize,
  parsePresetsArguments,
} from './parser'
import { Exporter } from './exporter'
import { startServer } from './server/server'
import * as PRESETS from './export/presets'

// Setup global XMLHttpRequest for Node.js environment
global.XMLHttpRequest = XMLHttpRequest

const argv = minimist(process.argv.slice(2))

/**
 * Main execution flow
 */
async function main(): Promise<void> {
  // Check for serve command first (positional argument)
  const command = argv._[0]

  if (command === 'serve' || process.env.MODE === 'serve') {
    const port = argv.port || argv.p || 3000

    let openInBrowser = true

    if (argv['browser'] === false) {
      openInBrowser = false
    }

    await startServer(port, false, openInBrowser)
  } else if (argv.v || argv.version) {
    console.log('version:', packageJson.version)
  } else if (argv.h || argv.help) {
    displayHelp()
  } else if ((argv.f || argv.format) === 'presets') {
    // Handle presets mode
    handlePresetsMode()
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

/**
 * Handle preset mode operations
 */
async function handlePresetsMode(): Promise<void> {
  // Get all remaining arguments as potential preset IDs
  const presetFlags = Object.keys(argv).filter(
    (key) =>
      key !== '_' &&
      key !== 'f' &&
      key !== 'format' &&
      key !== 'o' &&
      key !== 'output' &&
      key !== 'i' &&
      key !== 'input',
  )

  // Check if a preset ID is specified (as a flag like --moodle)
  const presetId = presetFlags.length > 0 ? presetFlags[0] : null

  if (!presetId) {
    // No preset specified, list all presets
    PRESETS.listPresets()
  } else if (!argv.i && !argv.input) {
    // Preset specified but no input file, show preset configuration
    PRESETS.showPresetConfig(presetId)
  } else {
    // Preset specified with input file, execute export with preset
    const args = parsePresetsArguments(presetId)
    const validatedArgs = validateAndNormalize(args)
    const exporter = new Exporter()
    await exporter.run(validatedArgs)
  }
}

// Execute main function
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
