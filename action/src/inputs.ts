import * as core from '@actions/core';

export interface LiaScriptExporterArgs {
  input: string;
  readme: string;
  output: string;
  format: string;
  path?: string;
  key?: string;
  style?: string;

  // SCORM settings
  'scorm-organization'?: string;
  'scorm-masteryScore'?: string;
  'scorm-typicalDuration'?: string;
  'scorm-iframe'?: boolean;
  'scorm-embed'?: boolean;
  'scorm-alwaysActive'?: boolean;

  // IMS settings
  'ims-indexeddb'?: boolean;

  // Web settings
  'web-zip'?: boolean;
  'web-indexeddb'?: boolean;
  'web-iframe'?: boolean;

  // PDF settings
  'pdf-preview'?: boolean;
  'pdf-scale'?: string;
  'pdf-displayHeaderFooter'?: boolean;
  'pdf-headerTemplate'?: string;
  'pdf-footerTemplate'?: string;
  'pdf-printBackground'?: boolean;
  'pdf-landscape'?: boolean;
  'pdf-format'?: string;
  'pdf-width'?: string;
  'pdf-height'?: string;
  'pdf-margin-top'?: string;
  'pdf-margin-bottom'?: string;
  'pdf-margin-right'?: string;
  'pdf-margin-left'?: string;
  'pdf-preferCSSPageSize'?: boolean;
  'pdf-omitBackground'?: boolean;
  'pdf-timeout'?: string;
  'pdf-stylesheet'?: string;
  'pdf-theme'?: string;

  // Project settings
  'project-no-meta'?: boolean;
  'project-no-rdf'?: boolean;
  'project-no-categories'?: boolean;
  'project-category-blur'?: boolean;
  'project-generate-pdf'?: boolean;
  'project-generate-ims'?: boolean;
  'project-generate-scorm12'?: boolean;
  'project-generate-scorm2004'?: boolean;
  'project-generate-android'?: boolean;
  'project-generate-cache'?: boolean;

  // RDF settings
  'rdf-format'?: string;
  'rdf-preview'?: boolean;
  'rdf-url'?: string;
  'rdf-type'?: string;
  'rdf-license'?: string;
  'rdf-educationalLevel'?: string;
  'rdf-template'?: string;

  // xAPI settings
  'xapi-endpoint'?: string;
  'xapi-auth'?: string;
  'xapi-actor'?: string;
  'xapi-course-id'?: string;
  'xapi-course-title'?: string;
  'xapi-debug'?: boolean;
  'xapi-zip'?: boolean;
}

/**
 * Helper function to safely get boolean inputs, handling empty/undefined values
 */
function getBooleanInput(name: string, defaultValue: boolean = false): boolean {
  const input = core.getInput(name);
  return input ? core.getBooleanInput(name) : defaultValue;
}

/**
 * Parse and validate GitHub Action inputs into LiaScript Exporter arguments
 */
export function parseInputs(): LiaScriptExporterArgs {
  // Core required inputs
  const inputFile = core.getInput('input-file', { required: true });
  const format = core.getInput('format', { required: true });
  
  // Optional core inputs
  const outputName = core.getInput('output-name') || 'output';
  const coursePath = core.getInput('course-path');
  
  // Validate format
  const validFormats = [
    'scorm1.2', 'scorm2004', 'pdf', 'web', 'ims', 'xapi', 'rdf', 'json', 'project'
  ];
  
  if (!validFormats.includes(format.toLowerCase())) {
    throw new Error(`Invalid format '${format}'. Valid formats: ${validFormats.join(', ')}`);
  }

  // Build the arguments object
  const args: LiaScriptExporterArgs = {
    input: inputFile,
    readme: inputFile, // Will be adjusted in path resolution
    output: outputName,
    format: format.toLowerCase(),
    path: coursePath,
    key: core.getInput('responsive-voice-key') || undefined,
    style: core.getInput('style') || undefined,

    // SCORM settings
    'scorm-organization': core.getInput('scorm-organization') || undefined,
    'scorm-masteryScore': core.getInput('scorm-mastery-score') || undefined,
    'scorm-typicalDuration': core.getInput('scorm-typical-duration') || 'PT0H5M0S',
    'scorm-iframe': getBooleanInput('scorm-iframe'),
    'scorm-embed': getBooleanInput('scorm-embed'),
    'scorm-alwaysActive': getBooleanInput('scorm-always-active'),

    // IMS settings
    'ims-indexeddb': getBooleanInput('ims-indexeddb'),

    // Web settings
    'web-zip': getBooleanInput('web-zip', true), // Default to true
    'web-indexeddb': getBooleanInput('web-indexeddb'),
    'web-iframe': getBooleanInput('web-iframe'),

    // PDF settings
    'pdf-scale': core.getInput('pdf-scale') || '1',
    'pdf-printBackground': getBooleanInput('pdf-print-background'),
    'pdf-landscape': getBooleanInput('pdf-landscape'),
    'pdf-format': core.getInput('pdf-format') || 'A4',
    'pdf-stylesheet': core.getInput('pdf-stylesheet') || undefined,
    'pdf-theme': core.getInput('pdf-theme') || 'default',

    // RDF settings
    'rdf-format': core.getInput('rdf-format') || 'json-ld',
    'rdf-url': core.getInput('rdf-url') || undefined,
    'rdf-type': core.getInput('rdf-type') || 'Course',
    'rdf-license': core.getInput('rdf-license') || undefined,
    'rdf-educationalLevel': core.getInput('rdf-educational-level') || undefined,

    // xAPI settings
    'xapi-endpoint': core.getInput('xapi-endpoint') || undefined,
    'xapi-auth': core.getInput('xapi-auth') || undefined,
    'xapi-actor': core.getInput('xapi-actor') || undefined,
    'xapi-course-id': core.getInput('xapi-course-id') || undefined,
    'xapi-course-title': core.getInput('xapi-course-title') || undefined,
    'xapi-debug': getBooleanInput('xapi-debug'),
    'xapi-zip': getBooleanInput('xapi-zip'),
  };

  return args;
}

/**
 * Validate required inputs based on format
 */
export function validateInputs(args: LiaScriptExporterArgs): void {
  // Format-specific validations
  switch (args.format) {
    case 'xapi':
      if (args['xapi-endpoint'] && !isValidUrl(args['xapi-endpoint'])) {
        throw new Error('xapi-endpoint must be a valid URL');
      }
      break;
    
    case 'rdf':
      if (args['rdf-url'] && !isValidUrl(args['rdf-url'])) {
        throw new Error('rdf-url must be a valid URL');
      }
      if (args['rdf-license'] && !isValidUrl(args['rdf-license'])) {
        throw new Error('rdf-license must be a valid URL');
      }
      break;
    
    case 'pdf':
      if (args['pdf-scale']) {
        const scale = parseFloat(args['pdf-scale']);
        if (isNaN(scale) || scale <= 0 || scale > 2) {
          throw new Error('pdf-scale must be a number between 0 and 2');
        }
      }
      break;
      
    case 'scorm1.2':
    case 'scorm2004':
      if (args['scorm-masteryScore']) {
        const score = parseInt(args['scorm-masteryScore'], 10);
        if (isNaN(score) || score < 0 || score > 100) {
          throw new Error('scorm-mastery-score must be a number between 0 and 100');
        }
      }
      break;
  }
}

/**
 * Helper function to validate URLs
 */
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Log the parsed inputs for debugging
 */
export function logInputs(args: LiaScriptExporterArgs): void {
  const coreInputs = ['input', 'format', 'output', 'path'];
  
  // Log core inputs
  coreInputs.forEach(key => {
    const value = (args as any)[key];
    if (value) {
      core.info(`${key}: ${value}`);
    }
  });
  
  // Log format-specific settings that are set
  Object.entries(args).forEach(([key, value]) => {
    if (!coreInputs.includes(key) && key.includes('-') && value !== undefined && value !== false && value !== '') {
      core.info(`${key}: ${value}`);
    }
  });
}