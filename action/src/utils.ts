import * as path from 'path';
import * as fs from 'fs';
import * as core from '@actions/core';
import { LiaScriptExporterArgs } from './inputs';

/**
 * Check if a string is a URL
 */
export function isURL(input: string): boolean {
  try {
    new URL(input);
    return true;
  } catch {
    return false;
  }
}

/**
 * Resolve file paths and set up the working directory structure
 */
export function resolvePaths(args: LiaScriptExporterArgs): LiaScriptExporterArgs {
  const resolvedArgs = { ...args };
  
  // Convert input file to absolute path
  if (!path.isAbsolute(args.input) && !isURL(args.input)) {
    resolvedArgs.input = path.resolve(process.cwd(), args.input);
  }
  
  // Set course path if not provided
  if (!args.path && !isURL(args.input)) {
    resolvedArgs.path = path.dirname(resolvedArgs.input);
  } else if (args.path && !path.isAbsolute(args.path)) {
    resolvedArgs.path = path.resolve(process.cwd(), args.path);
  }
  
  // Set readme path relative to course path
  if (resolvedArgs.path && !isURL(resolvedArgs.input)) {
    resolvedArgs.readme = path.relative(resolvedArgs.path, resolvedArgs.input);
    if (resolvedArgs.readme.startsWith('../')) {
      // If input file is outside course path, use the full path
      resolvedArgs.readme = resolvedArgs.input;
    } else {
      resolvedArgs.readme = './' + resolvedArgs.readme;
    }
  }
  
  return resolvedArgs;
}

/**
 * Validate that required files exist
 */
export function validateFiles(args: LiaScriptExporterArgs): void {
  if (!isURL(args.input)) {
    if (!fs.existsSync(args.input)) {
      throw new Error(`Input file does not exist: ${args.input}`);
    }
    
    const stat = fs.statSync(args.input);
    if (!stat.isFile()) {
      throw new Error(`Input path is not a file: ${args.input}`);
    }
  }
  
  // Validate course path if provided
  if (args.path && !fs.existsSync(args.path)) {
    throw new Error(`Course path does not exist: ${args.path}`);
  }
  
  // Validate PDF stylesheet if provided
  if (args['pdf-stylesheet']) {
    const stylesheetPath = path.isAbsolute(args['pdf-stylesheet'])
      ? args['pdf-stylesheet']
      : path.resolve(args.path || path.dirname(args.input), args['pdf-stylesheet']);
      
    if (!fs.existsSync(stylesheetPath)) {
      throw new Error(`PDF stylesheet does not exist: ${stylesheetPath}`);
    }
    
    // Update with resolved path
    (args as any)['pdf-stylesheet'] = stylesheetPath;
  }
}

/**
 * Get file size in bytes
 */
export function getFileSize(filePath: string): number {
  try {
    const stats = fs.statSync(filePath);
    return stats.size;
  } catch (error) {
    core.warning(`Could not get file size for ${filePath}: ${error}`);
    return 0;
  }
}

/**
 * Helper function to check for a file and add it to outputs if found
 */
function checkAndAddFile(searchDir: string, fileName: string, description: string, outputFiles: string[]): void {
  const filePath = path.join(searchDir, fileName);
  core.info(`Checking for ${description} file: ${filePath}`);
  if (fs.existsSync(filePath)) {
    outputFiles.push(filePath);
    core.info(`Found ${description} file: ${filePath}`);
  }
}

/**
 * Find output files based on format and output name
 */
export function findOutputFiles(args: LiaScriptExporterArgs): string[] {
  // Search directories - check both working directory and course path
  const searchDirs = [
    process.cwd(),
    args.path || path.dirname(args.input)
  ].filter((dir, index, arr) => arr.indexOf(dir) === index); // Remove duplicates
  
  core.info(`Searching for output files in directories: ${searchDirs.join(', ')}`);
  
  const outputFiles: string[] = [];
  
  for (const searchDir of searchDirs) {
    core.info(`Checking directory: ${searchDir}`);
    
    // Get all files in directory for debugging
    try {
      const allFiles = fs.readdirSync(searchDir);
      core.info(`All files in ${searchDir}: ${allFiles.join(', ')}`);
    } catch (error) {
      core.warning(`Cannot read directory ${searchDir}: ${error}`);
      continue;
    }
    
    // Format-specific file patterns
    const outputName = args.output;
    
    switch (args.format) {
      case 'scorm1.2':
        checkAndAddFile(searchDir, `${outputName}.zip`, 'SCORM 1.2', outputFiles);
        break;
        
      case 'scorm2004':
        checkAndAddFile(searchDir, `${outputName}.zip`, 'SCORM 2004', outputFiles);
        break;
        
      case 'pdf':
        checkAndAddFile(searchDir, `${outputName}.pdf`, 'PDF', outputFiles);
        break;
        
      case 'web':
        // Web format creates a directory
        const webDir = path.join(searchDir, outputName);
        if (fs.existsSync(webDir) && fs.statSync(webDir).isDirectory()) {
          outputFiles.push(webDir);
          core.info(`Found web directory: ${webDir}`);
        }
        break;
        
      case 'ims':
        checkAndAddFile(searchDir, `${outputName}.zip`, 'IMS', outputFiles);
        break;
        
      case 'xapi':
        checkAndAddFile(searchDir, `${outputName}.zip`, 'xAPI', outputFiles);
        break;
        
      case 'rdf':
        // RDF format depends on rdf-format setting
        const rdfPatterns = getRdfOutputPatterns(args);
        for (const pattern of rdfPatterns) {
          const rdfFile = path.join(searchDir, pattern);
          if (fs.existsSync(rdfFile)) {
            outputFiles.push(rdfFile);
            core.info(`Found RDF file: ${rdfFile}`);
          }
        }
        break;
        
      case 'project':
        // Project format is complex, delegate to helper
        const projectFiles = findProjectOutputFiles(args, searchDir);
        outputFiles.push(...projectFiles);
        for (const file of projectFiles) {
          core.info(`Found project file: ${file}`);
        }
        break;
        
      default:
        // JSON format or unknown - look for JSON files
        checkAndAddFile(searchDir, `${outputName}.json`, 'JSON', outputFiles);
    }
  }
  
  return outputFiles;
}

/**
 * Get RDF output patterns based on format setting
 */
function getRdfOutputPatterns(args: LiaScriptExporterArgs): string[] {
  const format = args['rdf-format'] || 'json-ld';
  switch (format) {
    case 'json-ld':
      return [`${args.output}.jsonld`, `${args.output}.json`];
    case 'n-quads':
      return [`${args.output}.nq`, `${args.output}.txt`];
    default:
      return [`${args.output}.json`, `${args.output}.jsonld`, `${args.output}.nq`];
  }
}

/**
 * Find project format output files (complex logic for project exports)
 */
function findProjectOutputFiles(args: LiaScriptExporterArgs, baseDir: string): string[] {
  const projectFiles: string[] = [];
  
  // Project format can generate multiple files based on settings
  const possibleExtensions = ['.zip', '.pdf', '.json', '.jsonld'];
  const possiblePrefixes = [args.output, 'project', 'course'];
  
  for (const prefix of possiblePrefixes) {
    for (const ext of possibleExtensions) {
      const file = path.join(baseDir, prefix + ext);
      if (fs.existsSync(file)) {
        projectFiles.push(file);
      }
    }
  }
  
  // Also look for directories
  const possibleDirs = [`${args.output}/`, 'project/', 'courses/'];
  for (const dir of possibleDirs) {
    const dirPath = path.join(baseDir, dir);
    if (fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory()) {
      projectFiles.push(dirPath);
    }
  }
  
  return projectFiles;
}

/**
 * Generate output filename based on input file and format if not specified
 */
export function generateOutputName(args: LiaScriptExporterArgs): string {
  if (args.output !== 'output') {
    return args.output; // User specified output name
  }
  
  // Generate from input file
  let baseName: string;
  
  if (isURL(args.input)) {
    // Extract name from URL
    try {
      const url = new URL(args.input);
      baseName = path.basename(url.pathname, path.extname(url.pathname)) || 'course';
    } catch {
      baseName = 'course';
    }
  } else {
    // Extract from file path
    baseName = path.basename(args.input, path.extname(args.input));
    if (baseName.toLowerCase() === 'readme') {
      // Use parent directory name for README files
      baseName = path.basename(path.dirname(args.input));
    }
  }
  
  // Sanitize filename
  baseName = baseName.replace(/[^a-zA-Z0-9-_]/g, '-').replace(/-+/g, '-');
  
  return baseName || 'course';
}

/**
 * Log system information for debugging
 */
export function logEnvironmentInfo(): void {
  core.info(`Node.js version: ${process.version}`);
  core.info(`Platform: ${process.platform}`);
  core.info(`Architecture: ${process.arch}`);
  core.info(`Working directory: ${process.cwd()}`);
}

/**
 * Ensure output directory exists
 */
export function ensureOutputDirectory(): void {
  const outputDir = process.cwd();
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
}