import { FastifyPluginAsync } from 'fastify'
import { readFile, readdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import * as YAML from 'yaml'

// Cache for loaded translations
const translationsCache: Map<string, any> = new Map()

function getI18nDir(): string {
  // Try multiple locations for i18n files
  // 1. Docker/production: liascript-exporter/server/i18n
  const dockerDir = join(process.cwd(), 'liascript-exporter', 'server', 'i18n')
  if (existsSync(dockerDir)) {
    return dockerDir
  }

  // 2. Development: relative to this file (__dirname is dist/server/routes or src/server/routes)
  const devDir = join(__dirname, '..', 'i18n')
  if (existsSync(devDir)) {
    return devDir
  }

  // 3. Fallback: try from process.cwd()
  const cwdDir = join(process.cwd(), 'src', 'server', 'i18n')
  if (existsSync(cwdDir)) {
    return cwdDir
  }

  // Return the most likely path even if it doesn't exist (for error reporting)
  return devDir
}

export const i18nRouter: FastifyPluginAsync = async (fastify) => {
  // Log the i18n directory on startup
  const i18nDir = getI18nDir()
  console.log('i18n directory:', i18nDir)

  // GET /api/i18n/languages - Get available languages
  fastify.get('/languages', async (request, reply) => {
    try {
      const i18nDir = getI18nDir()
      const files = await readdir(i18nDir)

      const languages = await Promise.all(
        files
          .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'))
          .map(async (file) => {
            const lang = file.replace(/\.ya?ml$/, '')
            const content = await readFile(join(i18nDir, file), 'utf-8')
            const parsed = YAML.parse(content)
            return {
              code: lang,
              name: parsed.meta?.language || lang,
            }
          }),
      )

      return { languages }
    } catch (error) {
      console.error('Failed to load languages:', error)
      return reply
        .code(500)
        .send({ error: 'Failed to load available languages' })
    }
  })

  // GET /api/i18n/:lang - Get translations for a specific language
  fastify.get<{ Params: { lang: string } }>(
    '/:lang',
    async (request, reply) => {
      const { lang } = request.params

      // Validate language code (prevent path traversal)
      if (!/^[a-z]{2}(-[A-Z]{2})?$/.test(lang)) {
        return reply.code(400).send({ error: 'Invalid language code' })
      }

      try {
        // Check cache first
        if (translationsCache.has(lang)) {
          return translationsCache.get(lang)
        }

        const i18nDir = getI18nDir()
        const filePath = join(i18nDir, `${lang}.yaml`)

        const content = await readFile(filePath, 'utf-8')
        const translations = YAML.parse(content)

        // Cache the result
        translationsCache.set(lang, translations)

        return translations
      } catch (error: any) {
        if (error.code === 'ENOENT') {
          // Language file not found, try fallback to 'en'
          if (lang !== 'en') {
            try {
              const i18nDir = getI18nDir()
              const fallbackPath = join(i18nDir, 'en.yaml')
              const content = await readFile(fallbackPath, 'utf-8')
              const translations = YAML.parse(content)
              return translations
            } catch {
              // Ignore fallback errors
            }
          }
          return reply.code(404).send({ error: `Language '${lang}' not found` })
        }

        console.error(`Failed to load translations for '${lang}':`, error)
        return reply.code(500).send({ error: 'Failed to load translations' })
      }
    },
  )

  // Clear cache endpoint (useful for development)
  fastify.delete('/cache', async (request, reply) => {
    translationsCache.clear()
    return { message: 'Translation cache cleared' }
  })
}
