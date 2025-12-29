// Terminal configuration
const TERMINAL_WIDTH = 80
const DEFAULT_INDENT = 28
const ANSI_REGEX = /\x1b\[[0-9;]*m/g

// Check if colors should be disabled
const SUPPORTS_COLOR =
  process.env.NO_COLOR === undefined &&
  process.stdout.isTTY &&
  process.env.TERM !== 'dumb'

// ANSI color codes
const GREEN = '\x1b[32m' // For short options (-h)
const CYAN = '\x1b[36m' // For long options (--help)
const YELLOW = '\x1b[33m' // Could be used for parameter values
const RESET = '\x1b[0m' // Reset to default color

/**
 * Helper function to wrap text to a specified width
 * @param text - The text to wrap
 * @param maxLength - Maximum line length
 * @returns Array of wrapped lines
 */
function wrapText(text: string, maxLength: number): string[] {
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine + word + ' '
    if (testLine.length > maxLength && currentLine.length > 0) {
      lines.push(currentLine.trim())
      currentLine = word + ' '
    } else {
      currentLine = testLine
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim())
  }

  return lines
}

/**
 * Helper function to strip ANSI codes from a string
 * @param text - Text with ANSI codes
 * @returns Text without ANSI codes
 */
function stripAnsi(text: string): string {
  return text.replace(ANSI_REGEX, '')
}

/**
 * Helper function to apply color only if terminal supports it
 * @param color - ANSI color code
 * @param text - Text to colorize
 * @returns Colorized text or plain text
 */
function colorize(color: string, text: string): string {
  return SUPPORTS_COLOR ? `${color}${text}${RESET}` : text
}

/**
 * Colorize text in green (for short options like -h)
 * @param text - The text to colorize
 * @returns Colorized text
 */
export function short(text: string): string {
  return colorize(GREEN, text)
}

/**
 * Colorize text in cyan (for long options like --help)
 * @param text - The text to colorize
 * @returns Colorized text
 */
export function long(text: string): string {
  return colorize(CYAN, text)
}

/**
 * Format text as a heading (yellow, bold, underlined)
 * @param text - The text to format
 * @returns Formatted heading text
 */
export function heading(text: string): string {
  const colored = colorize(YELLOW, text)
  return underline(bold(colored))
}

/**
 * Make text bold
 * @param text - The text to make bold
 * @returns Bold text
 */
export function bold(text: string): string {
  return SUPPORTS_COLOR ? `\x1b[1m${text}${RESET}` : text
}

/**
 * Make text italic
 * @param text - The text to make italic
 * @returns Italic text
 */
export function italic(text: string): string {
  return SUPPORTS_COLOR ? `\x1b[3m${text}${RESET}` : text
}

/**
 * Underline text
 * @param text - The text to underline
 * @returns Underlined text
 */
export function underline(text: string): string {
  return SUPPORTS_COLOR ? `\x1b[4m${text}${RESET}` : text
}

/**
 * Print a formatted command with description
 * @param short_command - Short command option (e.g., '-h') or null
 * @param long_command - Long command option (e.g., '--help')
 * @param description - Description text
 * @param indentation - Column width for command alignment (default: 28)
 */
export function command(
  short_command: string | null,
  long_command: string,
  description: string,
  indentation: number = DEFAULT_INDENT
): void {
  // Format the command portion
  let commandPart = ''

  if (short_command) {
    // Handle newline character if present in short_command
    const cleanShort = short_command.replace('\n', '')
    commandPart = short(cleanShort) + ' ' + bold(long(long_command))
  } else {
    commandPart = bold(long(long_command))
  }

  // Get the visible length of the command part (without ANSI codes)
  const commandPartLength = stripAnsi(commandPart).length

  // Calculate indentation padding
  const padding = Math.max(0, indentation - commandPartLength)

  // Calculate available space for description after indentation
  const wrapLength = TERMINAL_WIDTH - indentation

  // Word wrap the description
  const lines = wrapText(description, wrapLength)

  // Output first line with proper indentation
  console.log(commandPart + ' '.repeat(padding) + (lines[0] || ''))

  // Output additional lines with consistent indentation
  for (let i = 1; i < lines.length; i++) {
    console.log(' '.repeat(indentation) + lines[i])
  }
}

/**
 * Print formatted info text with optional indentation
 * @param text - The text to display
 * @param indentation - Number of spaces to indent (default: 0)
 */
export function info(text: string, indentation: number = 0): void {
  // Calculate available space for text after indentation
  const wrapLength = TERMINAL_WIDTH - indentation

  // Word wrap the text
  const lines = wrapText(text, wrapLength)

  // Print each line with indentation and styling
  for (const line of lines) {
    console.log(' '.repeat(indentation) + italic(line))
  }
}
