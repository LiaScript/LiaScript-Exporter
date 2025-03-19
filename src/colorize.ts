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
  description: string
): undefined {
  if (short_command) {
    console.log(short(short_command), bold(long(long_command)), description)
  } else {
    console.log(bold(long(long_command)), description)
  }
}
