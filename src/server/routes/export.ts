import { FastifyPluginAsync } from 'fastify'
import { jobQueue } from '../server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join, basename } from 'path'
import { randomUUID } from 'crypto'
import { tmpdir } from 'os'

export const exportRouter: FastifyPluginAsync = async (fastify) => {
  // POST /api/export - Create new export job
  fastify.post('/export', async (request, reply) => {
    try {
      const data = await request.body

      let jobData: any = {
        source: {},
        target: {},
        options: {},
      }

      // Check if it's multipart (file upload)
      if (request.isMultipart()) {
        const parts = request.parts()
        const files: any[] = []

        for await (const part of parts) {
          if (part.type === 'file') {
            // Save file temporarily
            const uploadId = randomUUID()
            const uploadDir = join(tmpdir(), 'liaex-uploads', uploadId)
            await mkdir(uploadDir, { recursive: true })

            const filepath = join(uploadDir, part.filename)
            const buffer = await part.toBuffer()
            await writeFile(filepath, buffer)

            files.push({
              filename: part.filename,
              path: filepath,
              mimetype: part.mimetype,
            })
          } else {
            // Handle form fields
            const fieldName = part.fieldname
            const value = (part as any).value

            if (fieldName === 'preset') {
              jobData.target.preset = value
            } else if (fieldName === 'format') {
              jobData.target.format = value
            } else if (fieldName === 'gitUrl') {
              jobData.source.gitUrl = value
            } else if (fieldName === 'gitBranch') {
              jobData.source.gitBranch = value
            } else if (fieldName === 'gitSubdir') {
              jobData.source.gitSubdir = value
            } else if (fieldName.startsWith('option_')) {
              const optionName = fieldName.substring(7)
              jobData.options[optionName] = value
            }
          }
        }

        if (files.length > 0) {
          jobData.source.type = 'upload'
          jobData.source.files = files
        } else if (jobData.source.gitUrl) {
          jobData.source.type = 'git'
        } else {
          return reply.code(400).send({
            error: 'No files uploaded and no git URL provided',
          })
        }
      } else {
        // JSON request
        const body = data as any

        if (body.gitUrl) {
          jobData.source.type = 'git'
          jobData.source.gitUrl = body.gitUrl
          jobData.source.gitBranch = body.gitBranch
          jobData.source.gitSubdir = body.gitSubdir
        } else {
          return reply.code(400).send({
            error: 'Invalid request format',
          })
        }

        jobData.target = body.target || {}
        jobData.options = body.options || {}
      }

      // Add job to queue
      const result = jobQueue.addJob(jobData)

      return reply.send(result)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: 'Failed to create export job',
        message: error.message,
      })
    }
  })

  // GET /api/job/:jobId - Get job status
  fastify.get('/job/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string }

    const job = jobQueue.getJob(jobId)
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' })
    }

    const queuePosition = jobQueue.getQueuePosition(jobId)

    return reply.send({
      job,
      queuePosition,
    })
  })

  // GET /api/queue - Get queue status
  fastify.get('/queue', async (request, reply) => {
    return reply.send(jobQueue.getQueueStatus())
  })

  // GET /api/download/:jobId - Download export result
  fastify.get('/download/:jobId', async (request, reply) => {
    const { jobId } = request.params as { jobId: string }

    const job = jobQueue.getJob(jobId)
    if (!job) {
      return reply.code(404).send({ error: 'Job not found' })
    }

    if (job.status !== 'completed') {
      return reply.code(400).send({ error: 'Job not completed yet' })
    }

    if (!job.result || !job.result.outputPath) {
      return reply.code(404).send({ error: 'Export file not found' })
    }

    try {
      const fileBuffer = await readFile(job.result.outputPath)
      const filename = job.result.filename || basename(job.result.outputPath)

      reply.header('Content-Disposition', `attachment; filename="${filename}"`)
      reply.type('application/zip')
      return reply.send(fileBuffer)
    } catch (error: any) {
      fastify.log.error(error)
      return reply.code(500).send({
        error: 'Failed to download file',
        message: error.message,
      })
    }
  })
}
