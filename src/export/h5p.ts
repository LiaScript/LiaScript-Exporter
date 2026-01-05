import * as helper from './helper'
import * as RDF from './rdf'
import * as COLOR from '../colorize'

const path = require('path')
const fs = require('fs-extra')
const archiver = require('archiver')

export function help() {
  console.log('')
  console.log(COLOR.heading('H5P settings:'), '\n')

  COLOR.info(
    'H5P is a free and open-source content collaboration framework based on JavaScript that makes it easy to create, share and reuse interactive HTML5 content.'
  )
  console.log('\nLearn more: https://h5p.org/\n')

  COLOR.command(
    null,
    '--h5p-embed',
    '             embed the Markdown into the JS code'
  )
  COLOR.command(
    null,
    '--h5p-iframe',
    '            use an iframe for content display'
  )
  COLOR.command(
    null,
    '--h5p-zip',
    '               package the output as a .h5p file'
  )
}

export const format = 'h5p'

export async function exporter(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string
    style?: string

    // special cases for H5P
    'h5p-embed'?: string
    'h5p-iframe'?: boolean
    'h5p-zip'?: boolean
  },
  json: any
) {
  // make temp folder
  let tmp = await helper.tmpDir()
  const dirname = helper.dirname()

  // Create a standard H5P package structure - this MUST be at the root level, not in subdirectories
  let h5pRoot = path.join(tmp, 'h5p_package')
  await fs.ensureDir(h5pRoot)

  // Extract the markdown content
  const markdownContent =
    argument['h5p-embed'] ||
    (fs.existsSync(path.join(argument.path, argument.readme))
      ? fs.readFileSync(path.join(argument.path, argument.readme), 'utf8')
      : '# LiaScript Content\n\nThis content was exported from LiaScript.')

  // Save the markdown content directly to the root with .md extension (allowed in whitelist)
  await helper.writeFile(
    path.join(h5pRoot, 'liascript_content.md'),
    markdownContent
  )

  // Create h5p.json metadata file (required for all H5P packages)
  await helper.writeFile(
    path.join(h5pRoot, 'h5p.json'),
    JSON.stringify(
      {
        title: json.lia.str_title || 'LiaScript Course',
        language: json.lia.definition.language || 'en',
        mainLibrary: 'H5P.Text',
        embedTypes: ['iframe'],
        preloadedDependencies: [
          {
            machineName: 'H5P.Text',
            majorVersion: 1,
            minorVersion: 1,
          },
        ],
        author: json.lia.definition.author || '',
        license: 'CC BY-SA',
        licenseVersion: '4.0',
        description: json.lia.comment || '',
        contentType: 'Interactive Course',
      },
      null,
      2
    )
  )

  // Parse the markdown content to create HTML
  const htmlContent = convertMarkdownToHTML(markdownContent)

  // First, copy the LiaScript assets to the temp directory
  let liaAssetPath = path.join(tmp, 'lia_assets')
  await fs.copy(path.join(dirname, './assets/h5p'), liaAssetPath)
  // await fs.copy(path.join(dirname, './assets/common'), liaAssetPath)

  // Generate the self-contained HTML
  const indexPath = path.join(liaAssetPath, 'index.html')
  const selfContainedHtml = await createSelfContainedHtml(
    indexPath,
    liaAssetPath,
    markdownContent // Pass the markdown content as a parameter
  )

  // Create content.json with the self-contained HTML
  const contentJson = {
    text: selfContainedHtml,
    metadata: {
      contentType: 'Text',
      license: 'U',
      title: json.lia.str_title || 'LiaScript Course',
      authors: [
        {
          name: json.lia.definition.author || 'LiaScript Author',
          role: 'Author',
        },
      ],
    },
  }

  // Save content.json directly to the root
  await helper.writeFile(
    path.join(h5pRoot, 'content.json'),
    JSON.stringify(contentJson, null, 2)
  )

  // Now copy the H5P assets AFTER creating the basic structure
  try {
    // Copy the content files from the H5P templates - these should be pre-structured correctly
    await fs.copy(path.join(dirname, './assets/h5p'), h5pRoot, {
      overwrite: false, // Don't overwrite existing files (like content.json)
      filter: (src) => {
        const ext = path.extname(src).toLowerCase()
        // Only copy files with extensions, not directories alone
        if (fs.statSync(src).isDirectory()) {
          return true // Allow directories in copying
        }
        // Ensure the file has a valid extension from the whitelist
        return ext !== '' // Only copy files with extensions
      },
    })
    console.log('Copied H5P template/assets to package')
  } catch (error) {
    console.warn('Error copying H5P assets:', error)
  }

  // List of allowed extensions for H5P
  const allowedExtensions = [
    'json',
    'png',
    'jpg',
    'jpeg',
    'gif',
    'bmp',
    'tif',
    'tiff',
    'eot',
    'ttf',
    'woff',
    'woff2',
    'otf',
    'webm',
    'mp4',
    'ogg',
    'mp3',
    'm4a',
    'wav',
    'txt',
    'pdf',
    'rtf',
    'doc',
    'docx',
    'xls',
    'xlsx',
    'ppt',
    'pptx',
    'odt',
    'ods',
    'odp',
    'csv',
    'diff',
    'patch',
    'swf',
    'md',
    'textile',
    'vtt',
    'webvtt',
    'gltf',
    'glb',
    'js',
    'css',
    'svg',
    'xml',
  ]

  // Copy user's content files with allowed extensions
  if (fs.existsSync(argument.path)) {
    try {
      // Get all files to copy - only files, not directories
      const getAllFiles = function (
        dirPath: string,
        arrayOfFiles: { source: string; target: string }[] = []
      ) {
        const files = fs.readdirSync(dirPath)

        files.forEach(function (file) {
          const filePath = path.join(dirPath, file)
          const stats = fs.statSync(filePath)

          if (stats.isDirectory()) {
            // Recurse into subdirectories
            arrayOfFiles = getAllFiles(filePath, arrayOfFiles)
          } else {
            const ext = path.extname(file).toLowerCase().substring(1)
            if (allowedExtensions.includes(ext)) {
              // Use flat structure - put all files at root with prefixed names to avoid collisions
              // This avoids directory whitelist issues
              const flatFileName = path
                .relative(argument.path, filePath)
                .replace(/\//g, '_') // Replace slashes with underscores
                .replace(/\\/g, '_') // Handle Windows paths too

              arrayOfFiles.push({
                source: filePath,
                target: path.join(h5pRoot, flatFileName),
              })
            }
          }
        })

        return arrayOfFiles
      }

      const filesToCopy = getAllFiles(argument.path)

      // Copy each file to the root level (no directories)
      for (const file of filesToCopy) {
        await fs.copy(file.source, file.target)
      }

      console.log(`Copied ${filesToCopy.length} resource files to H5P package`)
    } catch (error) {
      console.warn('Error copying content files:', error)
    }
  }

  // Package as .h5p file
  if (argument['h5p-zip'] !== false) {
    // Default to creating .h5p file
    const output = fs.createWriteStream(argument.output + '.h5p')
    const archive = archiver('zip', {
      zlib: { level: 9 },
    })

    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes')
      console.log(
        'H5P package created successfully: ' + argument.output + '.h5p'
      )
    })

    archive.on('error', function (err) {
      throw err
    })

    archive.pipe(output)

    // Add all files from the h5pRoot directory to the archive
    archive.directory(h5pRoot, false)
    archive.finalize()
  } else {
    // Otherwise just copy the directory
    await fs.copy(h5pRoot, argument.output)
    console.log('H5P content created successfully at: ' + argument.output)
  }
}

// Helper function to convert markdown to HTML
function convertMarkdownToHTML(markdown) {
  // This is a very basic markdown to HTML converter
  // In a real implementation, you would use a proper markdown parser

  let html = markdown

  // Convert headers
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>')
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>')
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>')
  html = html.replace(/^#### (.*?)$/gm, '<h4>$1</h4>')
  html = html.replace(/^##### (.*?)$/gm, '<h5>$1</h5>')
  html = html.replace(/^###### (.*?)$/gm, '<h6>$1</h6>')

  // Convert bold and italic
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>')

  // Convert links
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')

  // Convert code blocks
  html = html.replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')

  // Convert inline code
  html = html.replace(/`(.*?)`/g, '<code>$1</code>')

  // Convert lists
  const lines = html.split('\n')
  let inList = false
  let listType = ''

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/^- /)) {
      if (!inList || listType !== 'ul') {
        lines[i] = inList
          ? '</ul><ul><li>' + lines[i].substring(2) + '</li>'
          : '<ul><li>' + lines[i].substring(2) + '</li>'
        inList = true
        listType = 'ul'
      } else {
        lines[i] = '<li>' + lines[i].substring(2) + '</li>'
      }
    } else if (lines[i].match(/^\d+\. /)) {
      if (!inList || listType !== 'ol') {
        lines[i] = inList
          ? '</ol><ol><li>' +
            lines[i].substring(lines[i].indexOf('. ') + 2) +
            '</li>'
          : '<ol><li>' +
            lines[i].substring(lines[i].indexOf('. ') + 2) +
            '</li>'
        inList = true
        listType = 'ol'
      } else {
        lines[i] =
          '<li>' + lines[i].substring(lines[i].indexOf('. ') + 2) + '</li>'
      }
    } else if (inList && lines[i].trim() === '') {
      lines[i] = listType === 'ul' ? '</ul>' : '</ol>'
      inList = false
    } else if (inList) {
      // This line is part of a list item
      lines[i] = lines[i]
    } else {
      // Regular paragraph
      if (lines[i].trim() !== '') {
        if (i === 0 || lines[i - 1].trim() === '') {
          lines[i] = '<p>' + lines[i] + '</p>'
        } else if (!lines[i - 1].endsWith('</p>')) {
          // Continue paragraph
          lines[i] = lines[i]
        } else {
          // New paragraph
          lines[i] = '<p>' + lines[i] + '</p>'
        }
      }
    }
  }

  if (inList) {
    lines.push(listType === 'ul' ? '</ul>' : '</ol>')
  }

  html = lines.join('\n')

  // Add CSS for styling
  html =
    `<style>
    .liascript-content {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .markdown-content {
      background-color: #f9f9f9;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 20px;
      margin-bottom: 20px;
    }
    .download-section {
      background-color: #e9f7fe;
      border: 1px solid #a8d7f3;
      border-radius: 5px;
      padding: 15px;
      margin-top: 30px;
    }
    code {
      background-color: #f0f0f0;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
    }
    pre {
      background-color: #f0f0f0;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    pre code {
      background-color: transparent;
      padding: 0;
    }
    a {
      color: #0066cc;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>` + html

  return html
}

// Update the function signature to accept markdownContent
async function createSelfContainedHtml(indexPath, basePath, markdownContent) {
  const cheerio = require('cheerio')
  const fs = require('fs-extra')
  const path = require('path')
  const mime = require('mime-types')

  // Read the index HTML file
  const htmlContent = await fs.readFile(indexPath, 'utf8')
  const $ = cheerio.load(htmlContent)

  // Process and inline JavaScript files
  $('script[src]').each(function () {
    const src = $(this).attr('src')
    if (
      src.startsWith('http:') ||
      src.startsWith('https:') ||
      src.startsWith('//')
    ) {
      // Skip external scripts
      return
    }

    try {
      const scriptPath = path.resolve(path.dirname(indexPath), src)
      const scriptContent = fs.readFileSync(scriptPath, 'utf8')
      $(this).removeAttr('src').text(scriptContent)
      console.log(`Inlined script: ${src}`)
    } catch (error) {
      console.warn(`Could not inline script ${src}:`, error.message)
    }
  })

  // Process and inline CSS files
  $('link[rel="stylesheet"]').each(function () {
    const href = $(this).attr('href')
    if (
      href.startsWith('http:') ||
      href.startsWith('https:') ||
      href.startsWith('//')
    ) {
      // Skip external stylesheets
      return
    }

    try {
      const cssPath = path.resolve(path.dirname(indexPath), href)
      const cssContent = fs.readFileSync(cssPath, 'utf8')
      $(this).replaceWith(`<style>${cssContent}</style>`)
      console.log(`Inlined CSS: ${href}`)
    } catch (error) {
      console.warn(`Could not inline CSS ${href}:`, error.message)
    }
  })

  // Process and inline images (convert to data URLs)
  $('img[src]').each(function () {
    const src = $(this).attr('src')
    if (
      src.startsWith('data:') ||
      src.startsWith('http:') ||
      src.startsWith('https:') ||
      src.startsWith('//')
    ) {
      // Skip already inlined or external images
      return
    }

    try {
      const imgPath = path.resolve(path.dirname(indexPath), src)
      const imgBuffer = fs.readFileSync(imgPath)
      const mimeType = mime.lookup(imgPath) || 'application/octet-stream'
      const dataUrl = `data:${mimeType};base64,${imgBuffer.toString('base64')}`
      $(this).attr('src', dataUrl)
      console.log(`Inlined image: ${src}`)
    } catch (error) {
      console.warn(`Could not inline image ${src}:`, error.message)
    }
  })

  // Inject the markdown content directly
  $('#container').append(`
    <div id="embedded-markdown" style="display:none;">
      ${markdownContent.replace(/</g, '&lt;').replace(/>/g, '&gt;')}
    </div>
  `)

  // Add a script to process the embedded markdown on page load
  $('body').append(`
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        if (window.LIA && typeof window.LIA.loadMarkdown === 'function') {
          const markdown = document.getElementById('embedded-markdown').innerHTML
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>');
          window.LIA.loadMarkdown(markdown);
        }
      });
    </script>
  `)

  return $.html()
}
