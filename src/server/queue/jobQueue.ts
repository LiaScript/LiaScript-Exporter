import { EventEmitter } from 'events'
import { randomUUID } from 'crypto'
import { spawn } from 'child_process'
import * as path from 'path'
import * as fs from 'fs-extra'
import { tmpdir } from 'os'

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

  private async performExport(job: ExportJob): Promise<void> {
    return new Promise(async (resolve, reject) => {
      try {
        // Determine input file
        let inputFile: string
        if (
          job.source.type === 'upload' &&
          job.source.files &&
          job.source.files.length > 0
        ) {
          // Use the first file (README.md or similar)
          const readmeFile = job.source.files.find(
            (f) =>
              f.filename === 'README.md' ||
              f.filename.toLowerCase().endsWith('.md')
          )
          inputFile = readmeFile ? readmeFile.path : job.source.files[0].path
        } else if (job.source.type === 'git' && job.source.gitUrl) {
          // For git repos, we'd need to clone first - not implemented yet
          throw new Error('Git repository export not yet implemented')
        } else {
          throw new Error('No valid input source')
        }

        // Determine format based on preset or format
        let format: string
        if (job.target.preset) {
          // Map presets to formats
          const presetMap: Record<string, string> = {
            moodle: 'scorm2004',
            ilias: 'scorm2004',
            opal: 'scorm2004',
            generic: 'scorm2004',
            openolat: 'scorm2004',
            openedx: 'scorm2004',
          }
          format = presetMap[job.target.preset] || 'scorm2004'
        } else {
          format = job.target.format || 'web'
        }

        // Create output directory
        const outputDir = path.join(tmpdir(), 'liaex-exports', job.id)
        await fs.ensureDir(outputDir)

        const outputFile = path.join(outputDir, 'export')

        // Convert options to proper types and build CLI arguments
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
          scorm12: [
            'scorm',
            'mastery',
            'typical',
            'responsi',
            'translate',
            'debugging',
            'remove',
          ],
          scorm2004: [
            'scorm',
            'mastery',
            'typical',
            'responsi',
            'translate',
            'debugging',
            'remove',
          ],
          xapi: ['xapi'],
          ims: ['ims'],
          web: ['web'],
          pdf: ['pdf'],
          android: ['app', 'package'],
          ios: ['ios'],
          epub: ['epub'],
          json: ['json'],
          rdf: ['rdf'],
          h5p: ['h5p'],
        }

        // Map option names to their CLI equivalents for each format
        const optionMapping: Record<string, (key: string) => string> = {
          scorm12: (key: string) => {
            // Convert camelCase to kebab-case
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
            // Add scorm- prefix if not already present and not a general option
            if (
              !key.startsWith('scorm') &&
              !['mastery-score', 'typical-duration'].includes(kebabKey)
            ) {
              return key.startsWith('scorm') ? kebabKey : `scorm-${kebabKey}`
            }
            // Handle special cases
            if (key === 'masteryScore') return 'scorm-masteryScore'
            if (key === 'typicalDuration') return 'scorm-typicalDuration'
            if (key === 'scormOrganization') return 'scorm-organization'
            if (key === 'scormIframe') return 'scorm-iframe'
            if (key === 'scormEmbed') return 'scorm-embed'
            if (key === 'scormAlwaysActive') return 'scorm-alwaysActive'
            return kebabKey
          },
          scorm2004: (key: string) => {
            // Same as scorm12
            const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase()
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
        const defaultMapper = (key: string) =>
          key.replace(/([A-Z])/g, '-$1').toLowerCase()

        // Get valid prefixes for the current format
        const validPrefixes = formatOptionPrefixes[format] || []
        const mapper = optionMapping[format] || defaultMapper

        for (const [key, value] of Object.entries(job.options || {})) {
          // Convert option name to CLI format
          const mappedKey = mapper(key)

          // Skip if this option doesn't match any valid prefix for this format
          if (validPrefixes.length > 0) {
            const isValid = validPrefixes.some((prefix) =>
              mappedKey.startsWith(prefix)
            )
            if (!isValid) {
              continue
            }
          }

          // Convert to CLI argument
          const cliKey = `--${mappedKey}`

          // Convert string booleans to actual booleans
          if (value === 'true') {
            args.push(cliKey)
          } else if (value === 'false') {
            // Don't add false flags
          } else if (value) {
            args.push(cliKey, String(value))
          }
        }

        // Run export in separate process using the CLI
        // Use the current process's argv[1] which is the path to dist/index.js
        const cliPath = process.argv[1]
        console.log(
          `Starting export process for job ${
            job.id
          }: node ${cliPath} ${args.join(' ')}`
        )

        const exportProcess = spawn('node', [cliPath, ...args], {
          stdio: ['ignore', 'pipe', 'pipe'],
          detached: false,
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
                `Export process exited with code ${code}. stderr: ${stderr}`
              )
            )
            return
          }

          try {
            // Give the export process a moment to finish writing files
            await new Promise((resolveTimeout) =>
              setTimeout(resolveTimeout, 1000)
            )

            // Find the generated output file
            const files = await fs.readdir(outputDir)
            console.log(`Files in output directory: ${files.join(', ')}`)

            const outputFileName = files.find(
              (f) =>
                f.startsWith('export') &&
                (f.endsWith('.zip') ||
                  f.endsWith('.html') ||
                  f.endsWith('.pdf') ||
                  f.endsWith('.epub'))
            )

            if (!outputFileName) {
              throw new Error(
                `Export completed but no output file was generated. Found files: ${files.join(
                  ', '
                )}`
              )
            }

            const outputPath = path.join(outputDir, outputFileName)

            // Store result
            job.result = {
              outputPath: outputPath,
              filename: outputFileName,
            }

            console.log(`Export completed: ${job.id} -> ${outputPath}`)
            resolve()
          } catch (error) {
            reject(error)
          }
        })
      } catch (error) {
        console.error(`Export failed for job ${job.id}:`, error)
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
