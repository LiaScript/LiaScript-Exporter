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
        
        // Debug: List all files in potential output directories
        const searchDirs = [process.cwd(), args.path || path.dirname(args.input)];
        for (const dir of searchDirs) {
          try {
            const files = require('fs').readdirSync(dir);
            core.info(`Files in ${dir}: ${files.join(', ')}`);
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
 * Execute the LiaScript export using the CLI library
 */
async function executeExport(args: LiaScriptExporterArgs): Promise<boolean> {
  try {
    // Import the CLI library from the parent directory
    const cliPath = path.resolve(__dirname, '../../dist/index.js');
    core.info(`Loading CLI library from: ${cliPath}`);
    
    // Verify CLI exists
    if (!require('fs').existsSync(cliPath)) {
      throw new Error(`CLI library not found at ${cliPath}. Please run 'npm run build' in the main directory first.`);
    }
    
    // Install CLI dependencies in the action's working directory
    core.info('Installing CLI dependencies...');
    const { spawn } = require('child_process');
    
    // First, install the LiaScript exporter package globally to get all dependencies
    const installResult = await new Promise<boolean>((resolve) => {
      const npmInstall = spawn('npm', ['install', '-g', '@liascript/exporter'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env }
      });
      
      let installOutput = '';
      let installError = '';
      
      npmInstall.stdout.on('data', (data: Buffer) => {
        installOutput += data.toString();
        core.info(`npm install: ${data.toString().trim()}`);
      });
      
      npmInstall.stderr.on('data', (data: Buffer) => {
        installError += data.toString();
        core.warning(`npm install warning: ${data.toString().trim()}`);
      });
      
      npmInstall.on('close', (code: number | null) => {
        if (code === 0) {
          core.info('CLI dependencies installed successfully');
          resolve(true);
        } else {
          core.error(`Failed to install CLI dependencies: ${installError}`);
          resolve(false);
        }
      });
      
      npmInstall.on('error', (error: Error) => {
        core.error(`Failed to start npm install: ${error.message}`);
        resolve(false);
      });
    });
    
    if (!installResult) {
      throw new Error('Failed to install CLI dependencies');
    }
    
    // Now use the globally installed CLI instead of the local one
    const globalCliCommand = 'liascript-exporter';
    
    // Build CLI arguments
    const cliArgs = buildCliArguments(args);
    core.info(`CLI arguments: ${cliArgs.join(' ')}`);
    
    return new Promise((resolve) => {
      const childProcess = spawn(globalCliCommand, cliArgs, {
        cwd: args.path || path.dirname(args.input),
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'production' }
      });
      
      let stderr = '';
      let hasOutput = false;
      
      // Set up timeout warning for long-running processes
      const timeout = setTimeout(() => {
        core.warning('Export process is taking longer than expected (5 minutes). This is normal for PDF exports with complex content.');
      }, 5 * 60 * 1000);
      
      // Provide feedback if process seems quiet
      const outputCheck = setInterval(() => {
        if (!hasOutput) {
          core.info('Export process is running (no output yet)...');
        }
        hasOutput = false; // Reset for next check
      }, 30000);
      
      const cleanup = () => {
        clearTimeout(timeout);
        clearInterval(outputCheck);
      };
      
      childProcess.stdout.on('data', (data: Buffer) => {
        const output = data.toString();
        hasOutput = true;
        
        // Log output in real-time, filtering out excessive debug info
        output.split('\\n').filter(line => {
          const trimmed = line.trim();
          return trimmed && !trimmed.startsWith('DEBUG');
        }).forEach(line => {
          core.info(`CLI: ${line}`);
        });
      });
      
      childProcess.stderr.on('data', (data: Buffer) => {
        const output = data.toString();
        stderr += output;
        hasOutput = true;
        
        // Log warnings from CLI, but classify different types of messages
        output.split('\\n').filter(line => line.trim()).forEach(line => {
          const trimmed = line.trim();
          if (trimmed.includes('warning:') || trimmed.includes('depending on the size')) {
            core.warning(`CLI: ${trimmed}`);
          } else if (trimmed.includes('error:') || trimmed.includes('ERROR')) {
            core.error(`CLI: ${trimmed}`);
          } else {
            core.info(`CLI: ${trimmed}`);
          }
        });
      });
      
      childProcess.on('close', (code: number | null, signal: string | null) => {
        cleanup();
        
        if (signal) {
          core.warning(`Export process was terminated by signal: ${signal}`);
          resolve(false);
        } else if (code === 0) {
          core.info('Export completed successfully');
          resolve(true);
        } else if (code === null) {
          core.error('Export process terminated unexpectedly');
          resolve(false);
        } else {
          core.error(`Export failed with exit code ${code}`);
          
          // Provide helpful error messages based on common failure patterns
          if (stderr.includes('ENOENT')) {
            core.error('Input file not found or CLI path incorrect');
          } else if (stderr.includes('permission denied') || stderr.includes('EACCES')) {
            core.error('Permission denied. Check file and directory permissions');
          } else if (stderr.includes('puppeteer') || stderr.includes('chrome')) {
            core.error('Browser automation failed. This may be due to missing Chrome dependencies or sandboxing issues');
          } else if (stderr.includes('timeout')) {
            core.error('Export timed out. Try simplifying the course or increasing timeout limits');
          } else if (stderr) {
            core.error(`CLI stderr: ${stderr.slice(-1000)}`); // Last 1000 chars to avoid too much output
          }
          
          resolve(false);
        }
      });
      
      childProcess.on('error', (error: Error) => {
        cleanup();
        
        if (error.message.includes('ENOENT')) {
          core.error(`Failed to start export process: CLI command not found (${error.message})`);
        } else {
          core.error(`Failed to start export process: ${error.message}`);
        }
        resolve(false);
      });
      
      childProcess.on('close', () => {
        cleanup();
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