"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logInputs = exports.validateInputs = exports.parseInputs = void 0;
const core = __importStar(require("@actions/core"));
/**
 * Helper function to safely get boolean inputs, handling empty/undefined values
 */
function getBooleanInputSafely(name, defaultValue = false) {
    const input = core.getInput(name);
    if (!input || input.trim() === '') {
        return defaultValue;
    }
    return core.getBooleanInput(name);
}
/**
 * Parse and validate GitHub Action inputs into LiaScript Exporter arguments
 */
function parseInputs() {
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
    const args = {
        input: inputFile,
        readme: inputFile,
        output: outputName,
        format: format.toLowerCase(),
        path: coursePath,
        key: core.getInput('responsive-voice-key') || undefined,
        style: core.getInput('style') || undefined,
        // SCORM settings
        'scorm-organization': core.getInput('scorm-organization') || undefined,
        'scorm-masteryScore': core.getInput('scorm-mastery-score') || undefined,
        'scorm-typicalDuration': core.getInput('scorm-typical-duration') || 'PT0H5M0S',
        'scorm-iframe': getBooleanInputSafely('scorm-iframe'),
        'scorm-embed': getBooleanInputSafely('scorm-embed'),
        // IMS settings
        'ims-indexeddb': getBooleanInputSafely('ims-indexeddb'),
        // Web settings
        'web-zip': getBooleanInputSafely('web-zip', true),
        'web-indexeddb': getBooleanInputSafely('web-indexeddb'),
        'web-iframe': getBooleanInputSafely('web-iframe'),
        // PDF settings
        'pdf-scale': core.getInput('pdf-scale') || '1',
        'pdf-printBackground': getBooleanInputSafely('pdf-print-background'),
        'pdf-landscape': getBooleanInputSafely('pdf-landscape'),
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
        'xapi-debug': getBooleanInputSafely('xapi-debug'),
        'xapi-zip': getBooleanInputSafely('xapi-zip'),
    };
    return args;
}
exports.parseInputs = parseInputs;
/**
 * Validate required inputs based on format
 */
function validateInputs(args) {
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
exports.validateInputs = validateInputs;
/**
 * Helper function to validate URLs
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    }
    catch {
        return false;
    }
}
/**
 * Log the parsed inputs for debugging
 */
function logInputs(args) {
    core.info(`Input file: ${args.input}`);
    core.info(`Format: ${args.format}`);
    core.info(`Output name: ${args.output}`);
    if (args.path) {
        core.info(`Course path: ${args.path}`);
    }
    // Log format-specific settings that are set
    Object.entries(args).forEach(([key, value]) => {
        if (key.includes('-') && value !== undefined && value !== false && value !== '') {
            core.info(`${key}: ${value}`);
        }
    });
}
exports.logInputs = logInputs;
//# sourceMappingURL=inputs.js.map