import Fastify from 'fastify'
import fastifyMultipart from '@fastify/multipart'
import fastifyStatic from '@fastify/static'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { exportRouter } from './routes/export'
import { JobQueue } from './queue/jobQueue'
import { existsSync } from 'fs'

export const jobQueue = new JobQueue()

export async function startServer(
  port: number = 3000,
  returnInstance: boolean = false,
): Promise<any> {
  // Use pretty logging only in development when pino-pretty is available
  const loggerConfig =
    process.env.NODE_ENV === 'development'
      ? {
          level: 'info',
          transport: {
            target: 'pino-pretty',
            options: {
              translateTime: 'HH:MM:ss Z',
              ignore: 'pid,hostname',
            },
          },
        }
      : { level: 'info' }

  const fastify = Fastify({
    logger: loggerConfig,
  })

  // Register plugins
  await fastify.register(fastifyMultipart, {
    limits: {
      fileSize: 100 * 1024 * 1024, // 100MB
    },
  })

  // Serve static files (HTML, CSS, JS)
  // Handle ASAR unpacked files for Electron builds
  let publicDir: string

  // Check if running from ASAR (Electron packaged app)
  if (__dirname.includes('app.asar')) {
    // Replace app.asar with app.asar.unpacked for unpacked files
    publicDir = __dirname.replace('app.asar', 'app.asar.unpacked') + '/public'
    console.log('Running from ASAR, using unpacked path:', publicDir)
  } else {
    // Not in ASAR - try multiple locations for Docker/standalone/development
    const possibleDirs = [
      // Production Docker - relative to cwd
      join(process.cwd(), 'dist', 'server', 'public'),
      // Bundled production - relative to __dirname
      join(__dirname, 'public'),
      // Development
      join(process.cwd(), 'src', 'server', 'public'),
    ]

    publicDir = possibleDirs.find((dir) => existsSync(dir)) || possibleDirs[0]
  }

  console.log('Serving static files from:', publicDir)

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

    // Get the actual port (important when port is 0 for auto-assignment)
    const actualPort = (fastify.server.address() as any).port

    // Return the instance if requested (for Electron), otherwise just log
    if (returnInstance) {
      console.log(`Server started on http://localhost:${actualPort}`)
      return fastify
    }

    console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 LiaScript Export Server                         ║
║                                                       ║
║   📍 http://localhost:${actualPort.toString().padEnd(4)}                         ║
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
