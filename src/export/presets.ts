import * as COLOR from '../colorize'
import * as fs from 'fs-extra'
import * as path from 'path'
import YAML from 'yaml'
import { Preset, PresetsConfig } from '../types'

export const format = 'presets'

/**
 * Displays help information about preset functionality
 */
export function help() {
  console.log('')
  console.log(COLOR.heading('Presets:'), '\n')

  COLOR.info(
    'Presets provide pre-configured export settings optimized for specific Learning Management Systems (LMS). Use presets to quickly export your LiaScript course with tested configurations.',
  )

  console.log('\nUsage examples:\n')
  console.log('  List all available presets:')
  console.log(COLOR.italic('    liaex -f presets\n'))

  console.log('  Show configuration for a specific preset:')
  console.log(COLOR.italic('    liaex -f presets --moodle\n'))

  console.log('  Export with preset configuration:')
  console.log(
    COLOR.italic('    liaex -i course.md -f presets --moodle -o output\n'),
  )

  console.log('  Override preset parameters with additional flags:')
  console.log(
    COLOR.italic(
      '    liaex -i course.md -f presets --moodle --scorm-organization "My Org" -o output\n',
    ),
  )

  COLOR.info(
    'Note: You can add any format-specific parameters (like --scorm-organization, --scorm-iframe, etc.) to override the preset defaults.',
  )
}

/**
 * Load and parse the presets.yaml file
 * @returns Parsed presets configuration
 */
export function loadPresets(): PresetsConfig {
  try {
    const dirname = path.resolve(__dirname, '..')
    const presetsPath = path.join(dirname, 'presets.yaml')

    if (!fs.existsSync(presetsPath)) {
      throw new Error(`Presets file not found at: ${presetsPath}`)
    }

    const fileContents = fs.readFileSync(presetsPath, 'utf8')
    const data = YAML.parse(fileContents) as PresetsConfig

    if (!data || !data.presets || !Array.isArray(data.presets)) {
      throw new Error('Invalid presets.yaml structure')
    }

    return data
  } catch (error) {
    console.error('\x1b[31mError loading presets:\x1b[0m', error)
    throw error
  }
}

/**
 * Find a preset by its ID
 * @param presetId - The preset identifier
 * @returns The preset configuration or undefined
 */
export function findPreset(presetId: string): Preset | undefined {
  const config = loadPresets()
  return config.presets.find((p) => p.id === presetId)
}

/**
 * List all available presets with their descriptions
 */
export function listPresets(): void {
  const config = loadPresets()

  console.log('')
  console.log(COLOR.heading('Available Presets:'))
  console.log('')

  config.presets.forEach((preset) => {
    console.log(`  ${preset.logo.icon}  ${COLOR.bold(preset.id)}`)
    console.log(`      ${preset.name} - ${preset.subtitle}`)

    // Remove HTML tags from description for console output
    const cleanDesc = preset.description.en
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()

    console.log(`      ${COLOR.italic(cleanDesc)}`)
    console.log('')
  })

  console.log('\nUsage:')
  console.log(
    COLOR.italic(
      '  liaex -i <input.md> -f presets --<preset-id> [-o <output>]',
    ),
  )
  console.log(
    COLOR.italic(
      '  liaex -i <input.md> -f presets --<preset-id> [--scorm-organization "..."] [-o <output>]\n',
    ),
  )
  console.log('Tip: Add format-specific flags to override preset defaults.\n')
}

/**
 * Display configuration parameters for a specific preset
 * @param presetId - The preset identifier
 */
export function showPresetConfig(presetId: string): void {
  const preset = findPreset(presetId)

  if (!preset) {
    console.error(`\x1b[31mPreset '${presetId}' not found.\x1b[0m`)
    console.log(
      '\nRun ' +
        COLOR.italic('liaex -f presets') +
        ' to see all available presets.\n',
    )
    process.exit(1)
  }

  console.log('')
  console.log(
    `${preset.logo}  ${COLOR.heading(preset.name)} - ${preset.subtitle}`,
  )
  console.log('')

  // Remove HTML tags from description
  const cleanDesc = preset.description
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  console.log(COLOR.italic(cleanDesc))
  console.log('')
  console.log(COLOR.bold('Configuration Parameters:'))
  console.log('')

  Object.entries(preset.options).forEach(([key, value]) => {
    const displayValue =
      typeof value === 'string' ? (value === '' ? '""' : value) : String(value)
    console.log(`  ${COLOR.bold(key)}: ${displayValue}`)
  })

  console.log('')
  console.log('Usage:')
  console.log(
    COLOR.italic(
      `  liaex -i <input.md> -f presets --${presetId} [-o <output>]`,
    ),
  )
  console.log('')
  console.log(COLOR.bold('Override Parameters:'))
  console.log(
    '  You can override any parameter by adding the corresponding flag:',
  )
  console.log(
    COLOR.italic(
      `  liaex -i <input.md> -f presets --${presetId} --scorm-organization "Custom" -o output`,
    ),
  )
  console.log('')
  console.log(
    '  Available override flags: --scorm-organization, --scorm-masteryScore,',
  )
  console.log(
    '  --scorm-typicalDuration, --scorm-iframe, --scorm-embed, and more.\n',
  )
}

/**
 * Get preset options merged with command-line arguments
 * @param presetId - The preset identifier
 * @param cliArgs - Command-line arguments to override preset values
 * @returns Merged configuration
 */
export function getPresetOptions(presetId: string, cliArgs: any): any {
  const preset = findPreset(presetId)

  if (!preset) {
    console.error(`\x1b[31mPreset '${presetId}' not found.\x1b[0m`)
    process.exit(1)
  }

  // Map preset options to CLI argument format
  const presetArgs: any = {
    format: preset.options.format || preset.format,
  }

  // Map common options
  if (preset.options.scormOrganization !== undefined) {
    presetArgs['scorm-organization'] = preset.options.scormOrganization
  }
  if (preset.options.typicalDuration !== undefined) {
    presetArgs['scorm-typicalDuration'] = preset.options.typicalDuration
  }
  if (preset.options.scormIframe !== undefined) {
    presetArgs['scorm-iframe'] = preset.options.scormIframe
  }
  if (preset.options.scormEmbed !== undefined) {
    presetArgs['scorm-embed'] = preset.options.scormEmbed
  }

  // Merge with CLI args, CLI args take precedence
  return { ...presetArgs, ...cliArgs }
}
