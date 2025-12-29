import { EventEmitter } from 'events'
import { randomUUID } from 'crypto'

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
  private isProcessing = false

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
    return this.queue.find((job) => job.id === jobId)
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
      this.currentJob = null
      this.isProcessing = false

      // Process next job in queue
      if (this.queue.length > 0) {
        setImmediate(() => this.processNext())
      }
    }
  }

  private async performExport(job: ExportJob): Promise<void> {
    // This is where the actual export logic would go
    // For now, simulate processing time
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log(
          `Exporting job ${job.id} with target ${
            job.target.preset || job.target.format
          }`
        )
        resolve()
      }, 5000) // 5 second delay to simulate export
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
