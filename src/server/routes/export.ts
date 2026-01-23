import { FastifyPluginAsync } from 'fastify'
import { jobQueue } from '../server'
import { writeFile, mkdir, readFile } from 'fs/promises'
import { join, basename } from 'path'
import { randomUUID } from 'crypto'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'
import * as YAML from 'yaml'
import { extractZip, findMainMarkdown, isZipFile } from '../utils/zipExtractor'
import { dirname } from '../../export/helper'

export const exportRouter: FastifyPluginAsync = async (fastify) => {
  // GET /api/presets - Get available presets configuration
  fastify.get('/presets', async (request, reply) => {
    try {
      // Find presets.yaml relative to the dist directory
      // When bundled by Parcel, __dirname points to the src directory
      // We need to go up and find the dist/server directory
      const distServerPath = join(dirname(), 'server')
      let presetsPath = join(distServerPath, 'presets.yaml')

      const presetsContent = await readFile(presetsPath, 'utf-8')
      const presets = YAML.parse(presetsContent)
      return { presets: presets.presets }
    } catch (error) {
      console.error('Failed to load presets:', error)
      return reply
        .code(500)
        .send({ error: 'Failed to load presets configuration' })
    }
  })

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
        const uploadId = randomUUID()
        const uploadDir = join(tmpdir(), 'liaex-uploads', uploadId)
        await mkdir(uploadDir, { recursive: true })

        for await (const part of parts) {
          if (part.type === 'file') {
            // Save file temporarily
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
          jobData.source.uploadDir = uploadDir

          // Check if any file is a ZIP - extract it
          const zipFile = files.find((f) => isZipFile(f.filename))
          if (zipFile) {
            fastify.log.info(`Extracting ZIP file: ${zipFile.filename}`)

            // Create extraction directory
            const extractDir = join(uploadDir, 'extracted')
            await mkdir(extractDir, { recursive: true })

            // Extract ZIP
            await extractZip(zipFile.path, extractDir)
            fastify.log.info(`ZIP extracted to: ${extractDir}`)

            // Find main markdown file
            const mainMarkdown = await findMainMarkdown(extractDir)
            if (!mainMarkdown) {
              return reply.code(400).send({
                error:
                  'No markdown file found in ZIP archive. Please include a README.md or any .md file.',
              })
            }

            fastify.log.info(`Found main markdown: ${mainMarkdown}`)

            // Update job data with extracted markdown
            jobData.source.mainFile = mainMarkdown
            jobData.source.extractedFrom = zipFile.filename
          }
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
