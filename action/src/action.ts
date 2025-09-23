import * as core from '@actions/core';
import * as path from 'path';
import { parseInputs, validateInputs, logInputs, LiaScriptExporterArgs } from './inputs';
import {
  resolvePaths,
  validateFiles,
  findOutputFiles,
  generateOutputName,
  logEnvironmentInfo,
  ensureOutputDirectory,
  getFileSize
} from './utils';

/**
 * Main action execution function
 */
export async function run(): Promise<void> {
  try {
    core.info('Starting LiaScript Exporter Action');
    
    // Log environment info for debugging
    logEnvironmentInfo();
    
    // Parse and validate inputs
    core.startGroup('Parsing inputs');
    let args = parseInputs();
    logInputs(args);
    validateInputs(args);
    core.endGroup();
    
    // Generate output name if not specified
    if (args.output === 'output') {
      args.output = generateOutputName(args);
      core.info(`Generated output name: ${args.output}`);
    }
    
    // Resolve file paths
    core.startGroup('Resolving paths');
    args = resolvePaths(args);
    core.info(`Resolved input file: ${args.input}`);
    core.info(`Resolved course path: ${args.path || 'not set'}`);
    core.info(`Resolved readme path: ${args.readme}`);
    validateFiles(args);
    core.endGroup();
    
    // Ensure output directory exists
    ensureOutputDirectory();
    
    // Install CLI dependencies
    core.startGroup('Installing CLI dependencies');
    const dependenciesInstalled = await installCliDependencies();
    core.endGroup();
    
    if (!dependenciesInstalled) {
      core.setFailed('Failed to install CLI dependencies');
      core.setOutput('success', 'false');
      return;
    }
    
    // Execute the export
    core.startGroup(`Exporting to ${args.format}`);
    const success = await executeExport(args);
    core.endGroup();
    
    if (success) {
      // Find and set outputs
      core.info('Searching for output files...');
      core.info(`Working directory: ${process.cwd()}`);
      core.info(`Course path: ${args.path || 'not set'}`);
      
      const outputFiles = findOutputFiles(args);
      core.info(`Found ${outputFiles.length} output files: ${outputFiles.join(', ')}`);
      
      if (outputFiles.length > 0) {
        const primaryOutputFile = outputFiles[0];
        const fileSize = getFileSize(primaryOutputFile);
        
        core.setOutput('output-file', primaryOutputFile);
        core.setOutput('file-size', fileSize.toString());
        core.setOutput('format', args.format);
        core.setOutput('success', 'true');
        
        core.info(`Successfully exported to: ${primaryOutputFile}`);
        core.info(`File size: ${fileSize} bytes`);
        
        if (outputFiles.length > 1) {
          core.info(`Additional files generated: ${outputFiles.slice(1).join(', ')}`);
        }
      } else {
        core.warning('Export completed but no output files found');
        
        // List directories searched for troubleshooting
        const searchDirs = [process.cwd(), args.path || path.dirname(args.input)];
        core.info(`Searched directories: ${searchDirs.join(', ')}`);
        for (const dir of searchDirs) {
          try {
            const files = require('fs').readdirSync(dir);
            const fileCount = files.length;
            core.info(`Found ${fileCount} files in ${dir}${fileCount > 0 ? ' - check output name pattern' : ''}`);
          } catch (error) {
            core.warning(`Could not list files in ${dir}: ${error}`);
          }
        }
        
        core.setOutput('success', 'false');
      }
    } else {
      core.setFailed('Export failed');
      core.setOutput('success', 'false');
    }
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.setFailed(`Action failed: ${errorMessage}`);
    core.setOutput('success', 'false');
  }
}

/**
 * Install CLI dependencies in the main directory
 */
async function installCliDependencies(): Promise<boolean> {
  try {
    const mainDir = path.resolve(__dirname, '../../');
    const nodeModulesPath = path.join(mainDir, 'node_modules');
    
    // Check if node_modules already exists and has content
    try {
      const fs = require('fs');
      const nodeModulesExists = fs.existsSync(nodeModulesPath);
      if (nodeModulesExists) {
        const nodeModulesStats = fs.readdirSync(nodeModulesPath);
        if (nodeModulesStats.length > 0) {
          core.info(`Dependencies already installed in ${nodeModulesPath} (${nodeModulesStats.length} packages found)`);
          return true;
        }
      }
    } catch (checkError) {
      core.info('Could not check existing node_modules, proceeding with installation');
    }
    
    core.info(`Installing CLI dependencies in: ${mainDir}`);
    
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const child = spawn('npm', ['install', '--production', '--no-audit', '--no-fund'], {
        cwd: mainDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        // Log npm install progress
        core.info(`npm install: ${output.trim()}`);
      });
      
      child.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        // npm often sends normal output to stderr, so treat it as info unless it's clearly an error
        if (output.toLowerCase().includes('error')) {
          core.error(`npm install error: ${output.trim()}`);
        } else {
          core.info(`npm install: ${output.trim()}`);
        }
      });
      
      child.on('close', (code: number | null) => {
        if (code === 0) {
          core.info('CLI dependencies installed successfully');
          resolve(true);
        } else {
          core.error(`npm install exited with code ${code}`);
          if (stderr) {
            core.error(`npm install error output: ${stderr}`);
          }
          resolve(false);
        }
      });
      
      child.on('error', (error: Error) => {
        core.error(`Failed to run npm install: ${error.message}`);
        reject(error);
      });
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(`Failed to install CLI dependencies: ${errorMessage}`);
    return false;
  }
}

/**
 * Execute the LiaScript export using the local CLI
 */
async function executeExport(args: LiaScriptExporterArgs): Promise<boolean> {
  try {
    // Use the local CLI from this repository
    const cliPath = path.resolve(__dirname, '../../dist/index.js');
    core.info(`Using local CLI from: ${cliPath}`);
    
    // Verify CLI exists
    if (!require('fs').existsSync(cliPath)) {
      throw new Error(`CLI not found at ${cliPath}. Please run 'npm run build' in the main directory first.`);
    }
    
    // Build command arguments for the local CLI
    const cliArgs = buildCliArguments(args);
    // Log CLI execution info without exposing sensitive arguments
    const safeArgs = cliArgs.map(arg => 
      (arg.includes('key') || arg.includes('auth')) && !arg.startsWith('--') 
        ? (arg.length > 4 ? `${arg.substring(0, 4)}***` : '***')
        : arg
    );
    core.info(`CLI command: node ${path.basename(cliPath)} ${safeArgs.join(' ')}`);
    
    // Execute the local CLI using spawn
    const { spawn } = require('child_process');
    
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, ...cliArgs], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let stdout = '';
      let stderr = '';
      
      child.stdout?.on('data', (data: Buffer) => {
        const output = data.toString();
        stdout += output;
        core.info(output.trim());
      });
      
      child.stderr?.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        // Log warnings and debug info, but don't treat as errors
        if (output.toLowerCase().includes('warn')) {
          core.warning(output.trim());
        } else if (output.toLowerCase().includes('debug')) {
          core.info(`DEBUG: ${output.trim()}`);
        } else {
          core.error(output.trim());
        }
      });
      
      child.on('close', (code: number | null) => {
        if (code === 0) {
          core.info('CLI execution completed successfully');
          resolve(true);
        } else {
          core.error(`CLI exited with code ${code}`);
          if (stderr) {
            core.error(`Error output: ${stderr}`);
          }
          resolve(false);
        }
      });
      
      child.on('error', (error: Error) => {
        core.error(`Failed to spawn CLI process: ${error.message}`);
        reject(error);
      });
    });
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    core.error(`Export execution failed: ${errorMessage}`);
    return false;
  }
}

/**
 * Convert action arguments to CLI arguments
 */
function buildCliArguments(args: LiaScriptExporterArgs): string[] {
  const cliArgs: string[] = [];
  
  // Core arguments
  cliArgs.push('--input', args.input);
  cliArgs.push('--format', args.format);
  cliArgs.push('--output', args.output);
  
  if (args.path) {
    cliArgs.push('--path', args.path);
  }
  
  if (args.style) {
    cliArgs.push('--style', args.style);
  }
  
  if (args.key) {
    cliArgs.push('--key', args.key);
  }
  
  // Add format-specific arguments
  Object.entries(args).forEach(([key, value]) => {
    if (key.includes('-') && value !== undefined && value !== false && value !== '') {
      if (typeof value === 'boolean' && value === true) {
        cliArgs.push(`--${key}`);
      } else if (typeof value === 'string' || typeof value === 'number') {
        cliArgs.push(`--${key}`, String(value));
      }
    }
  });
  
  return cliArgs;
}

// Run the action if this file is executed directly
if (require.main === module) {
  run().catch(error => {
    core.setFailed(error.message);
  });
}