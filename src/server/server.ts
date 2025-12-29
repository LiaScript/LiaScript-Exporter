import Fastify from 'fastify'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { exportRouter } from './routes/export'
import { JobQueue } from './queue/jobQueue'

export const jobQueue = new JobQueue()

export async function startServer(port: number = 3000): Promise<void> {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
        },
      },
    },
  })

  // Register plugins
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  })

  // Serve static files (HTML, CSS, JS)
  // In development, public is in src/server/public
  // In production (built), it will be in dist/server/public
  const publicDir = join(__dirname, 'public')

  await fastify.register(fastifyStatic, {
    root: publicDir,
    prefix: '/',
  })

  // Register routes
  await fastify.register(exportRouter, { prefix: '/api' })

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down server...')
    await fastify.close()
    process.exit(0)
  }

  process.on('SIGTERM', shutdown)
  process.on('SIGINT', shutdown)

  try {
    await fastify.listen({ port, host: '0.0.0.0' })
    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 LiaScript Export Server                         ║
║                                                       ║
║   📍 http://localhost:${port.toString().padEnd(4)}                         ║
║                                                       ║
║   Press Ctrl+C to stop the server                    ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
    `)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}
