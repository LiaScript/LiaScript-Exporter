/**
 * Supported export formats
 */
export enum ExportFormat {
  JSON = 'json',
  FULL_JSON = 'fulljson',
}

/**
 * Helper port commands
 */
export enum HelperCommand {
  DEBUG = 'debug',
  FILE = 'file',
  TEMPLATE = 'template',
}

/**
 * Elm Worker interface
 */
export interface ElmWorker {
  init: (options: { flags: { cmd: string } }) => ElmApp
}

/**
 * Elm Application interface
 */
export interface ElmApp {
  ports: ElmPorts
}

/**
 * Elm ports for communication
 */
export interface ElmPorts {
  helper: {
    subscribe: (callback: (data: [string, string]) => void) => void
  }
  output: {
    subscribe: (callback: (event: [boolean, string]) => void) => void
  }
  input: {
    send: (data: [string, string] | [string, string, string]) => void
  }
}

/**
 * Project collection structure for multi-course exports
 */
export interface ProjectCollection {
  [key: string]: unknown
}
