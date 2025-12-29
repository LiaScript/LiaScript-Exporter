const GREEN = '\x1b[32m' // For short options (-h)
const CYAN = '\x1b[36m' // For long options (--help)
const YELLOW = '\x1b[33m' // Could be used for parameter values
const RESET = '\x1b[0m' // Reset to default color

export function short(text: string): string {
  return `${GREEN}${text}${RESET}`
}

export function long(text: string): string {
  return `${CYAN}${text}${RESET}`
}

export function heading(text: string): string {
  return underline(bold(`${YELLOW}${text}${RESET}`))
}

export function bold(text: string): string {
  return `\x1b[1m${text}${RESET}`
}

export function italic(text: string): string {
  return `\x1b[3m${text}${RESET}`
}

export function underline(text: string): string {
  return `\x1b[4m${text}${RESET}`
}

export function command(
  short_command: string | null,
  long_command: string,
  description: string,
  indentation: number = 28
): undefined {
  // Format the command portion
  let commandPart = ''

  if (short_command) {
    // Handle newline character if present in short_command
    if (short_command.includes('\n')) {
      commandPart =
        short(short_command.replace('\n', '')) + ' ' + bold(long(long_command))
    } else {
      commandPart = short(short_command) + ' ' + bold(long(long_command))
    }
  } else {
    commandPart = bold(long(long_command))
  }

  // Get the visible length of the command part (without ANSI codes)
  const commandPartLength = commandPart.replace(/\x1b\[\d+m/g, '').length

  // Calculate indentation padding
  const padding = Math.max(0, indentation - commandPartLength)

  // Calculate available space for description after indentation
  const maxLineLength = 80 // Standard terminal width
  const wrapLength = maxLineLength - indentation

  // Word wrap the description
  const words = description.split(' ')
  let lines = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + word).length > wrapLength && currentLine.length > 0) {
      lines.push(currentLine.trim())
      currentLine = word + ' '
    } else {
      currentLine += word + ' '
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim())
  }

  // Output first line with proper indentation
  console.log(commandPart + ' '.repeat(padding) + lines[0])

  // Output additional lines with consistent indentation
  for (let i = 1; i < lines.length; i++) {
    console.log(' '.repeat(indentation) + lines[i])
  }
}

export function info(text: string, indentation: number = 0): void {
  // Calculate maximum line length
  const maxLineLength = 80
  const wrapLength = maxLineLength - indentation

  // Word wrap the text
  const words = text.split(' ')
  let lines = []
  let currentLine = ''

  for (const word of words) {
    if ((currentLine + word).length > wrapLength && currentLine.length > 0) {
      lines.push(currentLine.trim())
      currentLine = word + ' '
    } else {
      currentLine += word + ' '
    }
  }

  if (currentLine.trim().length > 0) {
    lines.push(currentLine.trim())
  }

  // Print each line with indentation and styling
  for (let i = 0; i < lines.length; i++) {
    console.log(' '.repeat(indentation) + italic(lines[i]))
  }
}
