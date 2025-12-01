import * as helper from './helper'
import * as RDF from './rdf'

const path = require('path')
const fs = require('fs-extra')

/**
 * Help function for xAPI export
 */
export function help() {
  console.log('\nxAPI Options:')
  console.log(
    '--xapi-endpoint        URL of the Learning Record Store (LRS) endpoint'
  )
  console.log(
    '--xapi-auth            Authentication string for the LRS (e.g., "Basic dXNlcm5hbWU6cGFzc3dvcmQ=")'
  )
  console.log(
    '--xapi-actor           JSON string representing the xAPI actor (default: anonymous)'
  )
  console.log(
    '--xapi-course-id       Custom identifier for the course (default: course URL)'
  )
  console.log(
    '--xapi-course-title    Custom title for the course (default: from document)'
  )
  console.log('--xapi-debug           Enable debug logging for xAPI statements')
  console.log('--xapi-zip             Package the output as a zip file')
}

/**
 * Generate tincan.xml file for xAPI package
 * @param courseTitle The title of the course
 * @param courseDescription The description of the course
 * @param launchFile The HTML file to launch (usually index.html)
 * @param courseId The unique identifier for the course
 * @param resources Array of resource files to include in the package
 * @returns XML string for tincan.xml
 */
function generateTincanXml(
  courseTitle: string,
  courseDescription: string,
  launchFile: string,
  courseId: string,
  resources: string[] = []
) {
  // Create resource elements for all files
  const resourceElements = resources
    .map((resource) => {
      return `      <resource lang="en-us">${resource}</resource>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="utf-8" ?>
<tincan xmlns="http://projecttincan.com/tincan.xsd">
  <activities>
    <activity id="${courseId}" type="course">
      <name>${courseTitle}</name>
      <description lang="en-US">${courseDescription}</description>
      <launch lang="en-us">${launchFile}</launch>
${resourceElements}
    </activity>
  </activities>
</tincan>`
}

export async function exporter(
  argument: {
    input: string
    readme: string
    output: string
    format: string
    path: string
    key?: string
    style?: string
    'xapi-endpoint'?: string
    'xapi-auth'?: string
    'xapi-actor'?: string
    'xapi-course-id'?: string
    'xapi-course-title'?: string
    'xapi-debug'?: boolean
    'xapi-zip'?: boolean
  },
  json: any
) {
  // make temp folder
  let tmp = await helper.tmpDir()
  const dirname = helper.dirname()
  let tmpPath = path.join(tmp, 'pro')

  // copy assets to temp
  await fs.copy(path.join(dirname, './assets/xapi'), tmpPath)
  await fs.copy(path.join(dirname, './assets/common'), tmpPath)

  // copy base path or readme-directory into temp
  await fs.copy(argument.path, tmpPath)

  // Read and modify index.html
  let index = fs.readFileSync(path.join(tmpPath, 'index.html'), 'utf8')

  // Change responsive key
  if (argument.key) {
    index = helper.injectResponsivevoice(argument.key, index)
  }

  // Add default course
  index = helper.inject(
    `<script>
  if (!window.LIA) {
    window.LIA = {}
  }
   window.LIA.defaultCourseURL = "${path.basename(argument.readme)}"
  </script>`,
    index
  )

  // Add xAPI configuration
  const xapiConfig = {
    endpoint: argument['xapi-endpoint'] || '',
    auth: argument['xapi-auth'] || '',
    actor: argument['xapi-actor']
      ? JSON.parse(argument['xapi-actor'])
      : {
          objectType: 'Agent',
          name: 'Anonymous',
          mbox: 'mailto:anonymous@example.com',
        },
    courseId: argument['xapi-course-id'] || '',
    courseTitle:
      argument['xapi-course-title'] || json.lia.str_title || 'LiaScript Course',
    debug: argument['xapi-debug'] || false,
  }

  // Add config UI if endpoint wasn't provided
  if (!argument['xapi-endpoint']) {
    index = helper.inject(
      `<script>
      // Store xAPI config in localStorage
      function saveXAPIConfig() {
        const endpoint = document.getElementById('xapi-endpoint').value;
        const auth = document.getElementById('xapi-auth').value;
        const actor = document.getElementById('xapi-actor').value;
        
        try {
          // Validate actor as JSON
          JSON.parse(actor);
          
          // Save to localStorage
          localStorage.setItem('xapi-config', JSON.stringify({
            endpoint,
            auth,
            actor: JSON.parse(actor)
          }));
          
          // Reload to apply settings
          window.location.reload();
        } catch (e) {
          alert('Invalid Actor JSON format. Please check your input.');
        }
      }
      
      // Load xAPI config from localStorage on page load
      document.addEventListener('DOMContentLoaded', function() {
        const storedConfig = localStorage.getItem('xapi-config');
        if (storedConfig) {
          const config = JSON.parse(storedConfig);
          window.xAPIConfig = config;
        }
        
        // Show/hide config panel
        const configPanel = document.getElementById('xapi-config-panel');
        if (configPanel) {
          document.getElementById('toggle-xapi-config').addEventListener('click', function() {
            configPanel.style.display = configPanel.style.display === 'none' ? 'block' : 'none';
          });
          
          // Populate fields if stored config exists
          if (storedConfig) {
            const config = JSON.parse(storedConfig);
            document.getElementById('xapi-endpoint').value = config.endpoint || '';
            document.getElementById('xapi-auth').value = config.auth || '';
            document.getElementById('xapi-actor').value = JSON.stringify(config.actor || {}, null, 2);
          }
        }
      });
      </script>
      <style>
      #xapi-config-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: 400px;
        background: white;
        border: 1px solid #ccc;
        padding: 15px;
        box-shadow: 0 0 10px rgba(0,0,0,0.2);
        z-index: 9999;
        display: none;
      }
      #toggle-xapi-config {
        position: fixed;
        top: 10px;
        right: 10px;
        z-index: 9998;
        background: #f5f5f5;
        border: 1px solid #ccc;
        padding: 5px 10px;
        cursor: pointer;
      }
      </style>
      <div id="toggle-xapi-config">xAPI Settings</div>
      <div id="xapi-config-panel">
        <h3>xAPI LRS Configuration</h3>
        <div>
          <label for="xapi-endpoint">LRS Endpoint URL</label><br>
          <input type="text" id="xapi-endpoint" style="width: 100%" placeholder="https://your-lrs.com/data/xAPI/" value="">
        </div>
        <div style="margin-top: 10px">
          <label for="xapi-auth">Authentication (e.g., Basic dXNlcm5hbWU6cGFzc3dvcmQ=)</label><br>
          <input type="text" id="xapi-auth" style="width: 100%" placeholder="Basic dXNlcm5hbWU6cGFzc3dvcmQ=" value="">
        </div>
        <div style="margin-top: 10px">
          <label for="xapi-actor">Actor (JSON format)</label><br>
          <textarea id="xapi-actor" style="width: 100%; height: 100px">{"objectType":"Agent","name":"Anonymous","mbox":"mailto:anonymous@example.com"}</textarea>
        </div>
        <div style="margin-top: 10px">
          <button onclick="saveXAPIConfig()">Save Configuration</button>
        </div>
      </div>`,
      index
    )
  }

  // Set the window.xAPIConfig object with the base configuration
  index = helper.inject(
    `<script>
    window.xAPIConfig = ${JSON.stringify(xapiConfig, null, 2)};
    </script>`,
    index
  )

  // Update title
  try {
    index = index.replace(
      '<title>Lia</title>',
      `<title>${json.lia.str_title}</title><meta property="og:title" content="${json.lia.str_title}"> <meta name="twitter:title" content="${json.lia.str_title}">`
    )
    console.log('updating title ...')
  } catch (e) {
    console.warn('could not add title')
  }

  // Add description
  try {
    let description = json.lia.definition.macro.comment
    index = index.replace(
      '<meta name="description" content="LiaScript is a service for running free and interactive online courses, build with its own Markup-language. So check out the following course ;-)">',
      `<meta name="description" content="${description}"><meta property="og:description" content="${description}"><meta name="twitter:description" content="${description}">`
    )
    console.log('updating description ...')
  } catch (e) {
    console.warn('could not add description')
  }

  // Add logo
  try {
    let logo = json.lia.definition.logo
    index = helper.inject(
      `<meta property="og:image" content="${logo}"><meta name="twitter:image" content="${logo}">`,
      index
    )
    console.log('updating logo ...')
  } catch (e) {
    console.warn('could not add image')
  }

  // Add JSON-LD
  const jsonLD = await RDF.script(argument, json)

  try {
    index = helper.inject(jsonLD, index)
    index = helper.prettify(index)
    await helper.writeFile(path.join(tmpPath, 'index.html'), index)
  } catch (e) {
    console.warn(e)
    return
  }

  // Find all resources in the package
  const getAllFiles = function (dirPath: string, arrayOfFiles: string[] = []) {
    const files = fs.readdirSync(dirPath)

    files.forEach(function (file) {
      if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
        arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles)
      } else {
        // Get path relative to tmpPath
        const relativePath = path.relative(tmpPath, path.join(dirPath, file))
        // Only include files, not directories, and exclude tincan.xml itself
        if (relativePath && relativePath !== 'tincan.xml') {
          arrayOfFiles.push(relativePath)
        }
      }
    })

    return arrayOfFiles
  }

  const resources = getAllFiles(tmpPath)

  // Generate tincan.xml file
  const courseTitle = json.lia.str_title || 'LiaScript Course'
  const courseDescription =
    json.lia.definition?.macro?.comment || 'A LiaScript course'
  const courseId =
    argument['xapi-course-id'] ||
    `https://liascript.github.io/course/${helper.random(12)}`
  const tincanXml = generateTincanXml(
    courseTitle,
    courseDescription,
    'index.html',
    courseId,
    resources
  )

  // Write tincan.xml to the root of the package
  await helper.writeFile(path.join(tmpPath, 'tincan.xml'), tincanXml)

  // Create zip or move to output
  if (argument['xapi-zip']) {
    // Always create a zip for xAPI packages
    // Ensure output directory's parent exists
    const outputParent = path.dirname(argument.output)
    await fs.ensureDir(outputParent)

    // Create zip file
    helper.zip(tmpPath, argument.output)
  } else {
    // Ensure output directory's parent exists
    const outputParent = path.dirname(argument.output)
    await fs.ensureDir(outputParent)

    // Move files from temp to output
    await fs.move(tmpPath, argument.output, {
      filter: helper.filterHidden(argument.path),
      overwrite: true,
    })
  }
}
