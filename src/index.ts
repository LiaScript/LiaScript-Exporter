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
import { getGitOptions, prepareGitExport } from './gitExport'

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
  } else if (getGitOptions(argv)) {
    await runGitExport()
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
  const reservedFlags = new Set([
    '_',
    'f',
    'format',
    'o',
    'output',
    'i',
    'input',
    'git-url',
    'git-branch',
    'git-subdir',
    'git-file',
  ])
  const presetFlags = Object.keys(argv).filter((key) => !reservedFlags.has(key))

  // Check if a preset ID is specified (as a flag like --moodle)
  const presetId = presetFlags.length > 0 ? presetFlags[0] : null

  const gitOptions = getGitOptions(argv)

  if (!presetId) {
    // No preset specified, list all presets
    PRESETS.listPresets()
  } else if (!argv.i && !argv.input && !gitOptions) {
    // Preset specified but no input source, show preset configuration
    PRESETS.showPresetConfig(presetId)
  } else if (gitOptions) {
    // Preset specified with a git source: clone, then export with the preset
    const { inputPath, cleanup } = await prepareGitExport(gitOptions)
    process.on('exit', cleanup)
    process.argv.push('--input', inputPath)
    await runPresetExport(presetId)
  } else {
    // Preset specified with input file, execute export with preset
    await runPresetExport(presetId)
  }
}

/**
 * Runs an export using the given preset against the already-resolved input.
 */
async function runPresetExport(presetId: string): Promise<void> {
  const args = parsePresetsArguments(presetId)
  const validatedArgs = validateAndNormalize(args)
  const exporter = new Exporter()
  await exporter.run(validatedArgs)
}

/**
 * Handle export from a git repository.
 *
 * Clones the repo, resolves the markdown file, injects it as the input path so
 * the regular export pipeline can run unchanged, then removes the temp clone.
 */
async function runGitExport(): Promise<void> {
  const options = getGitOptions(argv)
  if (!options) {
    return
  }

  const { inputPath, cleanup } = await prepareGitExport(options)

  process.on('exit', cleanup)

  // Expose the resolved file to parseArguments(), which re-parses process.argv
  process.argv.push('--input', inputPath)

  const args = parseArguments()
  const validatedArgs = validateAndNormalize(args)
  const exporter = new Exporter()
  await exporter.run(validatedArgs)
}

// Execute main function
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})
