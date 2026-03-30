import { EventEmitter } from 'events'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs-extra'
import { tmpdir } from 'os'
import * as YAML from 'yaml'
import { removeDirectory } from '../utils/zipExtractor'

export interface ExportJob {
  id: string
  status: 'queued' | 'processing' | 'completed' | 'failed'
  source: {
    type: 'upload' | 'git'
    files?: any[]
    gitUrl?: string
    gitBranch?: string
    gitSubdir?: string
  }
  target: {
    preset?: string
    format?: string
  }
  options?: Record<string, any>
  createdAt: Date
  startedAt?: Date
  completedAt?: Date
  error?: string
  result?: any
}

export class JobQueue extends EventEmitter {
  private queue: ExportJob[] = []
  private currentJob: ExportJob | null = null
  private completedJobs: Map<string, ExportJob> = new Map()
  private isProcessing = false
  private maxCompletedJobs = 100 // Keep last 100 completed jobs
  private presetsConfig: any = null

  addJob(jobData: Omit<ExportJob, 'id' | 'status' | 'createdAt'>): {
    jobId: string
    queuePosition: number
  } {
    const job: ExportJob = {
      ...jobData,
      id: randomUUID(),
      status: 'queued',
      createdAt: new Date(),
    }

    this.queue.push(job)
    const queuePosition = this.queue.length + (this.currentJob ? 1 : 0)

    this.emit('job-added', job)

    // Start processing if not already processing
    if (!this.isProcessing) {
      this.processNext()
    }

    return {
      jobId: job.id,
      queuePosition,
    }
  }

  getJob(jobId: string): ExportJob | undefined {
    if (this.currentJob?.id === jobId) {
      return this.currentJob
    }
    const queuedJob = this.queue.find((job) => job.id === jobId)
    if (queuedJob) {
      return queuedJob
    }
    return this.completedJobs.get(jobId)
  }

  getQueuePosition(jobId: string): number {
    if (this.currentJob?.id === jobId) {
      return 0
    }
    const index = this.queue.findIndex((job) => job.id === jobId)
    return index >= 0 ? index + 1 : -1
  }

  private async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return
    }

    this.isProcessing = true
    this.currentJob = this.queue.shift()!
    this.currentJob.status = 'processing'
    this.currentJob.startedAt = new Date()

    this.emit('job-started', this.currentJob)

    try {
      // Simulate export process
      await this.performExport(this.currentJob)

      this.currentJob.status = 'completed'
      this.currentJob.completedAt = new Date()
      this.emit('job-completed', this.currentJob)
    } catch (error: any) {
      this.currentJob.status = 'failed'
      this.currentJob.error = error.message
      this.currentJob.completedAt = new Date()
      this.emit('job-failed', this.currentJob)
    } finally {
      // Store completed job
      if (this.currentJob) {
        this.completedJobs.set(this.currentJob.id, this.currentJob)

        // Cleanup old completed jobs if limit exceeded
        if (this.completedJobs.size > this.maxCompletedJobs) {
          const firstKey = this.completedJobs.keys().next().value
          if (firstKey) {
            this.completedJobs.delete(firstKey)
          }
        }
      }

      this.currentJob = null
      this.isProcessing = false

      // Process next job in queue
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext())
      }
    }
  }

  private async loadPresets(): Promise<void> {
    if (this.presetsConfig) {
      return // Already loaded
    }

    try {
      // Find presets.yaml relative to the dist directory
      // The file is in src/ and gets copied to dist/ during build
      const distPath = path.join(__dirname, '..', '..', 'dist')
      let presetsPath = path.join(distPath, 'presets.yaml')

      // Fallback: try relative to the current working directory
      try {
        await fs.readFile(presetsPath, 'utf-8')
      } catch {
        presetsPath = path.join(process.cwd(), 'dist', 'presets.yaml')
      }

      const presetsContent = await fs.readFile(presetsPath, 'utf-8')
      this.presetsConfig = YAML.parse(presetsContent)
      console.log('Loaded presets configuration')
    } catch (error) {
      console.error('Failed to load presets:', error)
      this.presetsConfig = { presets: [] }
    }
  }

  private async performExport(job: ExportJob): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Load presets if needed
        await this.loadPresets()

        // Determine input file
        let inputFile: string
        if (
          job.source.type === 'upload' &&
          job.source.files &&
          job.source.files.length > 0
        ) {
          // Check if we have a main file from ZIP extraction
          if ((job.source as any).mainFile) {
            inputFile = (job.source as any).mainFile
            console.log(`Using main markdown from ZIP: ${inputFile}`)
          } else {
            // Use the first markdown file or fallback to first file
            const readmeFile = job.source.files.find(
              (f) =>
                f.filename === 'README.md' ||
                f.filename.toLowerCase().endsWith('.md'),
            )
            inputFile = readmeFile ? readmeFile.path : job.source.files[0].path
          }
        } else if (job.source.type === 'git' && job.source.gitUrl) {
          // Use main file from cloned git repository
          if ((job.source as any).mainFile) {
            inputFile = (job.source as any).mainFile
            console.log(`Using main markdown from Git: ${inputFile}`)
          } else {
            throw new Error('No main file found in Git repository')
          }
        } else {
          throw new Error('No valid input source')
        }

        // Determine format and options based on preset or format
        let format: string
        let presetOptions: Record<string, any> = {}

        if (job.target.preset) {
          // Find the preset configuration
          const preset = this.presetsConfig.presets?.find(
            (p: any) => p.id === job.target.preset,
          )

          if (preset) {
            format = preset.format || 'scorm2004'
            presetOptions = preset.options || {}
            console.log(
              `Using preset '${job.target.preset}' with format '${format}' and options:`,
              presetOptions,
            )
          } else {
            console.warn(
              `Preset '${job.target.preset}' not found, using default format`,
            )
            format = 'scorm2004'
          }
        } else {
          format = job.target.format || 'web'
        }

        // Merge preset options with user-provided options (user options take precedence)
        const mergedOptions = { ...presetOptions, ...(job.options || {}) }

        // Remove 'format' from options as it's already used to set the --format parameter
        delete mergedOptions.format

        // Create output directory
        const outputDir = path.join(tmpdir(), 'liaex-exports', job.id)
        await fs.ensureDir(outputDir)

        const outputFile = path.join(outputDir, 'export')

        // Convert merged options to proper types and build CLI arguments
        const args: string[] = [
          '--input',
          inputFile,
          '--format',
          format,
          '--output',
          outputFile,
        ]

        // Define which option prefixes are valid for each format
        const formatOptionPrefixes: Record<string, string[]> = {
          'scorm1.2': [
            'scorm',
            'mastery',
            'typical',
            'responsi',
            'translate',
            'debugging',
            'remove',
            'lia',
          ],
          scorm2004: [
            'scorm',
            'mastery',
            'typical',
            'responsi',
            'translate',
            'debugging',
            'remove',
            'lia',
          ],
          xapi: ['xapi', 'lia'],
          ims: ['ims', 'lia'],
          web: ['web'],
          pdf: ['pdf'],
          android: ['android'],
          ios: ['ios'],
          epub: ['epub'],
          docx: ['docx'],
          json: ['json'],
          rdf: ['rdf'],
          h5p: ['h5p'],
        }

        // Map option names to their CLI equivalents for each format
        const optionMapping: Record<string, (key: string) => string> = {
          'scorm1.2': (key: string) => {
            // Convert camelCase to kebab-case
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
            // Handle special cases first
            if (key === 'liaSubfolder') return 'lia-subfolder'
            if (key === 'masteryScore') return 'scorm-masteryScore'
            if (key === 'typicalDuration') return 'scorm-typicalDuration'
            if (key === 'scormOrganization') return 'scorm-organization'
            if (key === 'scormIframe') return 'scorm-iframe'
            if (key === 'scormEmbed') return 'scorm-embed'
            if (key === 'scormAlwaysActive') return 'scorm-alwaysActive'
            // Add scorm- prefix if not already present and not a general option
            if (
              !key.startsWith('scorm') &&
              !['mastery-score', 'typical-duration'].includes(kebabKey)
            ) {
              return `scorm-${kebabKey}`
            }
            return kebabKey
          },
          scorm2004: (key: string) => {
            // Same as scorm1.2
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
            // Handle special cases first
            if (key === 'liaSubfolder') return 'lia-subfolder'
            if (key === 'masteryScore') return 'scorm-masteryScore'
            if (key === 'typicalDuration') return 'scorm-typicalDuration'
            if (key === 'scormOrganization') return 'scorm-organization'
            if (key === 'scormIframe') return 'scorm-iframe'
            if (key === 'scormEmbed') return 'scorm-embed'
            if (key === 'scormAlwaysActive') return 'scorm-alwaysActive'
            return kebabKey
          },
        }

        // Default mapper for formats without special mapping
        const defaultMapper = (key: string) => {
          // If the key already contains hyphens (kebab-case), return as-is
          if (key.includes('-')) {
            return key
          }
          // Otherwise convert camelCase to kebab-case
          return key.replace(/([A-Z])/g, '-$1').toLowerCase()
        }

        // Get valid prefixes for the current format
        const validPrefixes = formatOptionPrefixes[format] || []
        const mapper = optionMapping[format] || defaultMapper

        for (const [key, value] of Object.entries(mergedOptions)) {
          // First check if this option is relevant for the current format
          // by checking the original key name before mapping
          const lowerKey = key.toLowerCase()

          // Skip options that clearly belong to other formats
          if (validPrefixes.length > 0) {
            const belongsToThisFormat = validPrefixes.some((prefix) =>
              lowerKey.startsWith(prefix),
            )

            // Also check if it's a format-specific option we don't want
            const belongsToOtherFormat = [
              'xapi',
              'web',
              'pdf',
              'epub',
              'docx',
              'android',
              'ios',
              'ims',
              'json',
              'rdf',
              'h5p',
              'app',
              'package',
            ].some(
              (otherPrefix) =>
                !validPrefixes.includes(otherPrefix) &&
                lowerKey.startsWith(otherPrefix),
            )

            if (!belongsToThisFormat || belongsToOtherFormat) {
              console.log(`[DEBUG]   SKIPPING option: ${key}`)
              continue
            }
          }

          // Convert option name to CLI format
          const mappedKey = mapper(key)

          // Convert to CLI argument
          const cliKey = `--${mappedKey}`

          // Handle boolean values (both actual booleans and string booleans)
          if (value === true || value === 'true') {
            args.push(cliKey)
          } else if (value === false || value === 'false') {
            // Don't add false flags
          } else if (value !== undefined && value !== null && value !== '') {
            args.push(cliKey, String(value))
          }
        }

        // Run export in separate process using the CLI
        let cliPath: string
        if (process.versions.electron) {
          // In Electron, check if we're in dev or production
          const isDev = (__dirname.includes('src/server') || __dirname.includes('src\\server')) && 
                        !__dirname.includes('app.asar')
          
          if (isDev) {
            // Development mode: use built CLI from dist
            cliPath = path.join(process.cwd(), 'dist', 'index.js')
          } else {
            // Production mode: running from ASAR
            // Find the resources directory and build path to unpacked dist/index.js
            let basePath = __dirname.replace(/app\.asar([/\\]|$)/, 'app.asar.unpacked$1')
            const resourcesIndex = basePath.indexOf('resources')
            
            if (resourcesIndex >= 0) {
              const resourcesPath = basePath.substring(0, resourcesIndex + 'resources'.length)
              cliPath = path.join(resourcesPath, 'app.asar.unpacked', 'dist', 'index.js')
            } else {
              // Fallback: find unpacked directory
              const parts = basePath.split(path.sep)
              const unpackedIndex = parts.indexOf('app.asar.unpacked')
              const unpackedPath = unpackedIndex >= 0 
                ? parts.slice(0, unpackedIndex + 1).join(path.sep)
                : basePath
              cliPath = path.join(unpackedPath, 'dist', 'index.js')
            }
          }
        } else {
          // Standalone Node.js server
          cliPath = process.argv[1]
        }
        
        // Use process.execPath instead of 'node'
        // In Electron, this points to the electron binary which includes Node.js
        // In standalone Node.js, this points to the node binary
        const nodePath = process.execPath
        
        console.log(
          `Starting export process for job ${
            job.id
          }: ${nodePath} ${cliPath} ${args.join(' ')}`,
        )

        const exportProcess = spawn(nodePath, [cliPath, ...args], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false,
          cwd: outputDir, // Set working directory to output directory
          env: {
            ...process.env,
            // Enable ELECTRON_RUN_AS_NODE so Electron runs the script as Node.js
            ELECTRON_RUN_AS_NODE: '1',
          }
        })

        let stdout = ''
        let stderr = ''

        exportProcess.stdout?.on('data', (data) => {
          stdout += data.toString()
          console.log(`[Job ${job.id}] ${data.toString().trim()}`)
        })

        exportProcess.stderr?.on('data', (data) => {
          stderr += data.toString()
          console.error(`[Job ${job.id}] ${data.toString().trim()}`)
        })

        exportProcess.on('error', (error) => {
          console.error(`Export process error for job ${job.id}:`, error)
          reject(error)
        })

        exportProcess.on('close', async (code) => {
          if (code !== 0) {
            reject(
              new Error(
                `Export process exited with code ${code}. stderr: ${stderr}`,
              ),
            )
            return
          }

          try {
            // Give the export process a moment to finish writing files
            await new Promise((resolveTimeout) =>
              setTimeout(resolveTimeout, 1000),
            )

            // Find the generated output file
            console.log(`Looking for output files in: ${outputDir}`)
            const files = await fs.readdir(outputDir)
            console.log(`Files in output directory: ${files.join(', ')}`)

            // Look for any output file with the expected extensions
            // (the exporter may create filenames based on course title/version)
            const outputFileName = files.find(
              (f) =>
                f.endsWith('.zip') ||
                f.endsWith('.html') ||
                f.endsWith('.pdf') ||
                f.endsWith('.epub') ||
                f.endsWith('.docx') ||
                f.endsWith('.json') ||
                f.endsWith('.jsonld') ||
                f.endsWith('.nq') ||
                f.endsWith('.apk'),
            )

            if (!outputFileName) {
              throw new Error(
                `Export completed but no output file was generated. Found files: ${files.join(
                  ', ',
                )} in directory: ${outputDir}`,
              )
            }

            const outputPath = path.join(outputDir, outputFileName)

            // Store result
            job.result = {
              outputPath: outputPath,
              filename: outputFileName,
            }

            console.log(`Export completed: ${job.id} -> ${outputPath}`)

            // Cleanup temporary directories
            try {
              // Clean up git clone directory if it exists
              if (job.source.type === 'git' && (job.source as any).cloneDir) {
                console.log(
                  `Cleaning up git clone: ${(job.source as any).cloneDir}`,
                )
                await removeDirectory((job.source as any).cloneDir)
              }

              // Clean up upload directory if it exists
              if (
                job.source.type === 'upload' &&
                (job.source as any).uploadDir
              ) {
                console.log(
                  `Cleaning up upload directory: ${(job.source as any).uploadDir}`,
                )
                await removeDirectory((job.source as any).uploadDir)
              }
            } catch (cleanupError) {
              console.warn(`Cleanup warning for job ${job.id}:`, cleanupError)
              // Don't fail the job if cleanup fails
            }

            resolve()
          } catch (error) {
            reject(error)
          }
        })
      } catch (error) {
        console.error(`Export failed for job ${job.id}:`, error)

        // Cleanup on error as well
        try {
          if (job.source.type === 'git' && (job.source as any).cloneDir) {
            await removeDirectory((job.source as any).cloneDir)
          }
          if (job.source.type === 'upload' && (job.source as any).uploadDir) {
            await removeDirectory((job.source as any).uploadDir)
          }
        } catch (cleanupError) {
          console.warn(
            `Cleanup error after failed job ${job.id}:`,
            cleanupError,
          )
        }

        reject(error)
      }
    })
  }

  getQueueStatus() {
    return {
      currentJob: this.currentJob,
      queueLength: this.queue.length,
      queue: this.queue.map((job) => ({
        id: job.id,
        status: job.status,
        createdAt: job.createdAt,
      })),
    }
  }
}
