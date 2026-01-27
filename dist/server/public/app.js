<<<<<<< HEAD
// Global state
let selectedFiles = []
let currentSourceType = 'upload'
let currentExportTab = 'presets'
let presetsConfig = null

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
  await loadPresets()
  initializeTabs()
  initializeExportTabs()
  initializeUpload()
  initializeAdvancedSettings()
  initializeForm()
  initializeExportSelection()
  initializeFormatDescription()
  initializePresetDescription()
})

// Load presets from server
async function loadPresets() {
  try {
    const response = await fetch('/api/presets')
    const data = await response.json()
    presetsConfig = data.presets

    const presetsGrid = document.getElementById('presets-grid')
    presetsGrid.innerHTML = ''

    presetsConfig.forEach((preset, index) => {
      const label = document.createElement('label')
      label.className = 'preset-tile'

      const input = document.createElement('input')
      input.type = 'radio'
      input.name = 'preset'
      input.value = preset.id
      input.dataset.description = preset.description
      input.dataset.presetOptions = JSON.stringify(preset.options)
      if (index === 0) input.checked = true

      const content = document.createElement('div')
      content.className = 'preset-content'

      const logo = document.createElement('div')
      logo.style.fontSize = '2rem'
      logo.style.marginBottom = '0.5rem'
      logo.textContent = preset.logo

      const title = document.createElement('h3')
      title.textContent = preset.name

      const subtitle = document.createElement('p')
      subtitle.textContent = preset.subtitle

      content.appendChild(logo)
      content.appendChild(title)
      content.appendChild(subtitle)

      label.appendChild(input)
      label.appendChild(content)

      presetsGrid.appendChild(label)
    })
  } catch (error) {
    console.error('Failed to load presets:', error)
  }
}

// Tab switching
function initializeTabs() {
  const tabs = document.querySelectorAll('.tab-button')
  const panels = document.querySelectorAll('.tab-panel')

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.tab
      currentSourceType = targetTab

      // Update active states
      tabs.forEach((t) => t.classList.remove('active'))
      panels.forEach((p) => p.classList.remove('active'))

      tab.classList.add('active')
      document.getElementById(`${targetTab}-panel`).classList.add('active')

      // Clear validation states
      if (targetTab === 'upload') {
        document.getElementById('gitUrl').removeAttribute('required')
      } else {
        document.getElementById('gitUrl').setAttribute('required', 'required')
        selectedFiles = []
        updateFileList()
      }
    })
  })
}

// Export target tabs
function initializeExportTabs() {
  const exportTabs = document.querySelectorAll('.export-tab-button')
  const exportPanels = document.querySelectorAll('.export-tab-panel')

  exportTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const targetTab = tab.dataset.exportTab
      currentExportTab = targetTab

      // Update active states
      exportTabs.forEach((t) => t.classList.remove('active'))
      exportPanels.forEach((p) => p.classList.remove('active'))

      tab.classList.add('active')
      document.getElementById(`${targetTab}-panel`).classList.add('active')

      // Clear selections from other tab
      if (targetTab === 'presets') {
        document.querySelectorAll('input[name="format"]').forEach((radio) => {
          radio.checked = false
        })
      } else {
        document.querySelectorAll('input[name="preset"]').forEach((radio) => {
          radio.checked = false
        })
      }
    })
  })
}

// File upload handling
function initializeUpload() {
  const uploadArea = document.getElementById('uploadArea')

  // Check if running in Electron
  const isElectron = window.electronAPI !== undefined

  // Click to select files
  uploadArea.addEventListener('click', async (e) => {
    if (isElectron) {
      // Use Electron's native file dialog
      try {
        const result = await window.electronAPI.openFileDialog()
        if (!result.canceled && result.files && result.files.length > 0) {
          // Convert base64 content back to File objects
          const files = result.files.map(fileData => {
            // Decode base64 to binary
            const binaryString = atob(fileData.content)
            const bytes = new Uint8Array(binaryString.length)
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i)
            }
            // Create File object
            return new File([bytes], fileData.name, {
              type: fileData.type,
              lastModified: fileData.lastModified
            })
          })
          handleFiles(files)
        }
      } catch (error) {
        console.error('Error opening file dialog:', error)
        alert('Fehler beim Öffnen des Dateiauswahl-Dialogs')
      }
    } else {
      // Fallback: create temporary file input for browser mode
      const fileInput = document.createElement('input')
      fileInput.type = 'file'
      fileInput.multiple = true
      fileInput.style.display = 'none'
      fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files)
        document.body.removeChild(fileInput)
      })
      document.body.appendChild(fileInput)
      fileInput.click()
    }
  })

  // Drag and drop (works in both Electron and browser)
  uploadArea.addEventListener('dragover', (e) => {
    e.preventDefault()
    uploadArea.classList.add('drag-over')
  })

  uploadArea.addEventListener('dragleave', () => {
    uploadArea.classList.remove('drag-over')
  })

  uploadArea.addEventListener('drop', (e) => {
    e.preventDefault()
    uploadArea.classList.remove('drag-over')
    handleFiles(e.dataTransfer.files)
  })
}

function handleFiles(files) {
  const filesArray = Array.from(files)

  // Add new files to selection
  filesArray.forEach((file) => {
    // Avoid duplicates
    if (
      !selectedFiles.some((f) => f.name === file.name && f.size === file.size)
    ) {
      selectedFiles.push(file)
    }
  })

  updateFileList()
}

function updateFileList() {
  const fileList = document.getElementById('fileList')

  if (selectedFiles.length === 0) {
    fileList.innerHTML = ''
    return
  }

  fileList.innerHTML = selectedFiles
    .map(
      (file, index) => `
    <div class="file-item">
      <span class="file-name">${escapeHtml(file.name)}</span>
      <span class="file-size">${formatFileSize(file.size)}</span>
      <button type="button" class="remove-file" data-index="${index}" title="Entfernen">×</button>
    </div>
  `
    )
    .join('')

  // Add remove handlers
  fileList.querySelectorAll('.remove-file').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.target.dataset.index)
      selectedFiles.splice(index, 1)
      updateFileList()
    })
  })
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Export selection handling
function initializeExportSelection() {
  // Use event delegation for dynamically loaded presets
  document.getElementById('presets-grid').addEventListener('change', (e) => {
    if (e.target.name === 'preset' && e.target.checked) {
      // Deselect all formats
      const formatRadios = document.querySelectorAll('input[name="format"]')
      formatRadios.forEach((radio) => {
        radio.checked = false
      })

      // Apply preset options to the form
      applyPresetOptions(e.target)

      // Get the preset configuration to determine the format
      const presetOptions = JSON.parse(e.target.dataset.presetOptions || '{}')
      const format = presetOptions.format || e.target.value

      updateAdvancedSettings(format)
    }
  })

  const formatRadios = document.querySelectorAll('input[name="format"]')

  // When format is selected, deselect presets and update settings
  formatRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        const presetRadios = document.querySelectorAll('input[name="preset"]')
        presetRadios.forEach((presetRadio) => {
          presetRadio.checked = false
        })
        updateAdvancedSettings(radio.value)
      }
    })
  })

  // Initialize with default selection
  setTimeout(() => {
    const checkedPreset = document.querySelector('input[name="preset"]:checked')
    if (checkedPreset) {
      const presetOptions = JSON.parse(
        checkedPreset.dataset.presetOptions || '{}'
      )
      const format = presetOptions.format || checkedPreset.value
      applyPresetOptions(checkedPreset)
      updateAdvancedSettings(format)
    }
  }, 100)

  // PDF-specific: Toggle header/footer template fields
  initializePdfHeaderFooter()
}

// Apply preset options to form fields
function applyPresetOptions(presetInput) {
  try {
    const options = JSON.parse(presetInput.dataset.presetOptions || '{}')

    // Apply each option to the corresponding form field
    Object.keys(options).forEach((key) => {
      const value = options[key]
      const fieldName = `option_${key}`

      // Try to find the field by name
      const field = document.querySelector(`[name="${fieldName}"]`)

      if (field) {
        if (field.type === 'checkbox') {
          field.checked = Boolean(value)
        } else if (field.type === 'number') {
          field.value = value
        } else {
          field.value = value || ''
        }
      }
    })
  } catch (error) {
    console.error('Failed to apply preset options:', error)
  }
}

// Initialize PDF header/footer toggle
function initializePdfHeaderFooter() {
  const displayHeaderFooter = document.getElementById('pdfDisplayHeaderFooter')
  const headerGroup = document.getElementById('pdfHeaderGroup')
  const footerGroup = document.getElementById('pdfFooterGroup')

  if (displayHeaderFooter && headerGroup && footerGroup) {
    displayHeaderFooter.addEventListener('change', () => {
      if (displayHeaderFooter.checked) {
        headerGroup.style.display = 'block'
        footerGroup.style.display = 'block'
      } else {
        headerGroup.style.display = 'none'
        footerGroup.style.display = 'none'
      }
    })
  }
}

// Update advanced settings based on selected format
function updateAdvancedSettings(selectedValue) {
  const settingsGroups = document.querySelectorAll('.settings-group')
  const noSettings = document.querySelector('.settings-group.no-settings')
  let hasVisibleSettings = false

  settingsGroups.forEach((group) => {
    if (group.classList.contains('no-settings')) return

    const formats = group.dataset.formats
    if (formats && formats.split(',').includes(selectedValue)) {
      group.style.display = 'block'
      hasVisibleSettings = true
    } else {
      group.style.display = 'none'
    }
  })

  // Show "no settings" message if no specific settings available
  if (noSettings) {
    noSettings.style.display = hasVisibleSettings ? 'none' : 'block'
  }
}

// Advanced settings
function initializeAdvancedSettings() {
  const toggleBtn = document.getElementById('toggleAdvanced')
  const content = document.getElementById('advancedSettings')
  const icon = toggleBtn.querySelector('.toggle-icon')

  toggleBtn.addEventListener('click', () => {
    content.classList.toggle('hidden')
    icon.textContent = content.classList.contains('hidden') ? '▶' : '▼'
  })
}

// Form submission
function initializeForm() {
  const form = document.getElementById('exportForm')
  const submitBtn = document.getElementById('submitBtn')

  form.addEventListener('submit', async (e) => {
    e.preventDefault()

    // Validation
    if (currentSourceType === 'upload' && selectedFiles.length === 0) {
      alert('Bitte laden Sie mindestens eine Datei hoch.')
      return
    }

    if (currentSourceType === 'git') {
      const gitUrl = document.getElementById('gitUrl').value.trim()
      if (!gitUrl) {
        alert('Bitte geben Sie eine Git-Repository-URL ein.')
        return
      }
    }

    // Disable submit button
    submitBtn.disabled = true
    submitBtn.textContent = 'Export wird gestartet...'

    try {
      const formData = new FormData()

      // Add files if upload mode
      if (currentSourceType === 'upload') {
        selectedFiles.forEach((file) => {
          formData.append('files', file)
        })
      } else {
        // Add git info
        formData.append('gitUrl', document.getElementById('gitUrl').value)
        const gitBranch = document.getElementById('gitBranch').value
        const gitSubdir = document.getElementById('gitSubdir').value
        if (gitBranch) formData.append('gitBranch', gitBranch)
        if (gitSubdir) formData.append('gitSubdir', gitSubdir)
      }

      // Add export target
      const selectedPreset = document.querySelector(
        'input[name="preset"]:checked'
      )
      const selectedFormat = document.querySelector(
        'input[name="format"]:checked'
      )

      if (selectedPreset) {
        formData.append('preset', selectedPreset.value)
      } else if (selectedFormat) {
        formData.append('format', selectedFormat.value)
      } else {
        alert('Bitte wählen Sie ein Export-Ziel aus.')
        return
      }

      // Add all options from form elements with name starting with 'option_'
      const formElements = form.elements
      for (let i = 0; i < formElements.length; i++) {
        const element = formElements[i]
        if (element.name && element.name.startsWith('option_')) {
          if (element.type === 'checkbox') {
            if (element.checked) {
              formData.append(element.name, 'true')
            }
          } else if (element.value) {
            formData.append(element.name, element.value)
          }
        }
      }

      // Submit to API
      const response = await fetch('/api/export', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Export fehlgeschlagen')
      }

      const result = await response.json()
      showConfirmation(result)

      // Reset form
      form.reset()
      selectedFiles = []
      updateFileList()
    } catch (error) {
      alert('Fehler beim Erstellen des Exports: ' + error.message)
    } finally {
      submitBtn.disabled = false
      submitBtn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Export starten
      `
    }
  })
}

// Show confirmation modal
function showConfirmation(result) {
  const modal = document.getElementById('confirmationModal')
  const details = document.getElementById('confirmationDetails')
  const statusLink = document.getElementById('statusLink')
  const closeBtn = document.getElementById('closeModal')

  details.innerHTML = `
    <p><strong>Job-ID:</strong> ${result.jobId}</p>
    <p><strong>Position in Warteschlange:</strong> ${result.queuePosition}</p>
    <p class="success-message">Ihr Export wurde erfolgreich zur Warteschlange hinzugefügt.</p>
  `

  statusLink.href = `/status.html?jobId=${result.jobId}`

  modal.classList.remove('hidden')

  closeBtn.addEventListener('click', () => {
    modal.classList.add('hidden')
  })

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.add('hidden')
    }
  })
}

// Format description display
function initializeFormatDescription() {
  const formatRadios = document.querySelectorAll('input[name="format"]')
  const descriptionBox = document.getElementById('format-description')
  const descriptionText = descriptionBox.querySelector('p')

  formatRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      const description = radio.dataset.description
      if (description) {
        descriptionText.innerHTML = description
        descriptionBox.style.display = 'block'
      } else {
        descriptionBox.style.display = 'none'
      }
    })
  })
}
// Preset description display
function initializePresetDescription() {
  // Use event delegation since presets are loaded dynamically
  document.getElementById('presets-grid').addEventListener('change', (e) => {
    if (e.target.name === 'preset') {
      const descriptionBox = document.getElementById('preset-description')
      const descriptionText = descriptionBox.querySelector('p')
      const description = e.target.dataset.description

      if (description) {
        descriptionText.innerHTML = description
        descriptionBox.style.display = 'block'
      } else {
        descriptionBox.style.display = 'none'
      }
    }
  })

  // Show description for initially checked preset
  setTimeout(() => {
    const checkedPreset = document.querySelector('input[name="preset"]:checked')
    if (checkedPreset && checkedPreset.dataset.description) {
      const descriptionBox = document.getElementById('preset-description')
      const descriptionText = descriptionBox.querySelector('p')
      descriptionText.innerHTML = checkedPreset.dataset.description
      descriptionBox.style.display = 'block'
    }
  }, 100)
}
=======
let selectedFiles=[],currentSourceType="upload",currentExportTab="presets",presetsConfig=null;async function loadPresets(){try{const e=await fetch("/api/presets"),t=await e.json();presetsConfig=t.presets;const n=document.getElementById("presets-grid");n.innerHTML="",presetsConfig.forEach(((e,t)=>{const i=document.createElement("label");i.className="preset-tile";const a=document.createElement("input");a.type="radio",a.name="preset",a.value=e.id,a.dataset.description=e.description,a.dataset.presetOptions=JSON.stringify(e.options),0===t&&(a.checked=!0);const s=document.createElement("div");s.className="preset-content";const o=document.createElement("div");o.style.fontSize="2rem",o.style.marginBottom="0.5rem",o.textContent=e.logo;const r=document.createElement("h3");r.textContent=e.name;const c=document.createElement("p");c.textContent=e.subtitle,s.appendChild(o),s.appendChild(r),s.appendChild(c),i.appendChild(a),i.appendChild(s),n.appendChild(i)}))}catch(e){console.error("Failed to load presets:",e)}}function initializeTabs(){const e=document.querySelectorAll(".tab-button"),t=document.querySelectorAll(".tab-panel");e.forEach((n=>{n.addEventListener("click",(()=>{const i=n.dataset.tab;currentSourceType=i,e.forEach((e=>e.classList.remove("active"))),t.forEach((e=>e.classList.remove("active"))),n.classList.add("active"),document.getElementById(`${i}-panel`).classList.add("active"),"upload"===i?document.getElementById("gitUrl").removeAttribute("required"):(document.getElementById("gitUrl").setAttribute("required","required"),selectedFiles=[],updateFileList())}))}))}function initializeExportTabs(){const e=document.querySelectorAll(".export-tab-button"),t=document.querySelectorAll(".export-tab-panel");e.forEach((n=>{n.addEventListener("click",(()=>{const i=n.dataset.exportTab;currentExportTab=i,e.forEach((e=>e.classList.remove("active"))),t.forEach((e=>e.classList.remove("active"))),n.classList.add("active"),document.getElementById(`${i}-panel`).classList.add("active"),"presets"===i?document.querySelectorAll('input[name="format"]').forEach((e=>{e.checked=!1})):document.querySelectorAll('input[name="preset"]').forEach((e=>{e.checked=!1}))}))}))}function initializeUpload(){const e=document.getElementById("uploadArea"),t=document.getElementById("fileInput");e.addEventListener("click",(e=>{e.target!==t&&t.click()})),t.addEventListener("change",(e=>{handleFiles(e.target.files)})),e.addEventListener("dragover",(t=>{t.preventDefault(),e.classList.add("drag-over")})),e.addEventListener("dragleave",(()=>{e.classList.remove("drag-over")})),e.addEventListener("drop",(t=>{t.preventDefault(),e.classList.remove("drag-over"),handleFiles(t.dataTransfer.files)}))}function handleFiles(e){Array.from(e).forEach((e=>{selectedFiles.some((t=>t.name===e.name&&t.size===e.size))||selectedFiles.push(e)})),updateFileList()}function updateFileList(){const e=document.getElementById("fileList");0!==selectedFiles.length?(e.innerHTML=selectedFiles.map(((e,t)=>`\n    <div class="file-item">\n      <span class="file-name">${escapeHtml(e.name)}</span>\n      <span class="file-size">${formatFileSize(e.size)}</span>\n      <button type="button" class="remove-file" data-index="${t}" title="Entfernen">×</button>\n    </div>\n  `)).join(""),e.querySelectorAll(".remove-file").forEach((e=>{e.addEventListener("click",(e=>{const t=parseInt(e.target.dataset.index);selectedFiles.splice(t,1),updateFileList()}))}))):e.innerHTML=""}function formatFileSize(e){return e<1024?e+" B":e<1048576?(e/1024).toFixed(1)+" KB":(e/1048576).toFixed(1)+" MB"}function escapeHtml(e){const t=document.createElement("div");return t.textContent=e,t.innerHTML}function initializeExportSelection(){document.getElementById("presets-grid").addEventListener("change",(e=>{if("preset"===e.target.name&&e.target.checked){document.querySelectorAll('input[name="format"]').forEach((e=>{e.checked=!1})),applyPresetOptions(e.target);updateAdvancedSettings(JSON.parse(e.target.dataset.presetOptions||"{}").format||e.target.value)}}));document.querySelectorAll('input[name="format"]').forEach((e=>{e.addEventListener("change",(()=>{if(e.checked){document.querySelectorAll('input[name="preset"]').forEach((e=>{e.checked=!1})),updateAdvancedSettings(e.value)}}))})),setTimeout((()=>{const e=document.querySelector('input[name="preset"]:checked');if(e){const t=JSON.parse(e.dataset.presetOptions||"{}").format||e.value;applyPresetOptions(e),updateAdvancedSettings(t)}}),100),initializePdfHeaderFooter()}function applyPresetOptions(e){try{const t=JSON.parse(e.dataset.presetOptions||"{}");Object.keys(t).forEach((e=>{const n=t[e],i=`option_${e}`,a=document.querySelector(`[name="${i}"]`);a&&("checkbox"===a.type?a.checked=Boolean(n):"number"===a.type?a.value=n:a.value=n||"")}))}catch(e){console.error("Failed to apply preset options:",e)}}function initializePdfHeaderFooter(){const e=document.getElementById("pdfDisplayHeaderFooter"),t=document.getElementById("pdfHeaderGroup"),n=document.getElementById("pdfFooterGroup");e&&t&&n&&e.addEventListener("change",(()=>{e.checked?(t.style.display="block",n.style.display="block"):(t.style.display="none",n.style.display="none")}))}function updateAdvancedSettings(e){const t=document.querySelectorAll(".settings-group"),n=document.querySelector(".settings-group.no-settings");let i=!1;t.forEach((t=>{if(t.classList.contains("no-settings"))return;const n=t.dataset.formats;n&&n.split(",").includes(e)?(t.style.display="block",i=!0):t.style.display="none"})),n&&(n.style.display=i?"none":"block")}function initializeAdvancedSettings(){const e=document.getElementById("toggleAdvanced"),t=document.getElementById("advancedSettings"),n=e.querySelector(".toggle-icon");e.addEventListener("click",(()=>{t.classList.toggle("hidden"),n.textContent=t.classList.contains("hidden")?"▶":"▼"}))}function initializeForm(){const e=document.getElementById("exportForm"),t=document.getElementById("submitBtn");e.addEventListener("submit",(async n=>{if(n.preventDefault(),"upload"!==currentSourceType||0!==selectedFiles.length){if("git"===currentSourceType){if(!document.getElementById("gitUrl").value.trim())return void alert("Bitte geben Sie eine Git-Repository-URL ein.")}t.disabled=!0,t.textContent="Export wird gestartet...";try{const n=new FormData;if("upload"===currentSourceType)selectedFiles.forEach((e=>{n.append("files",e)}));else{n.append("gitUrl",document.getElementById("gitUrl").value);const e=document.getElementById("gitBranch").value,t=document.getElementById("gitSubdir").value;e&&n.append("gitBranch",e),t&&n.append("gitSubdir",t)}const i=document.querySelector('input[name="preset"]:checked'),a=document.querySelector('input[name="format"]:checked');if(i)n.append("preset",i.value);else{if(!a)return void alert("Bitte wählen Sie ein Export-Ziel aus.");n.append("format",a.value)}const s=e.elements;for(let e=0;e<s.length;e++){const t=s[e];t.name&&t.name.startsWith("option_")&&("checkbox"===t.type?t.checked&&n.append(t.name,"true"):t.value&&n.append(t.name,t.value))}const o=await fetch("/api/export",{method:"POST",body:n});if(!o.ok){const e=await o.json();throw new Error(e.error||"Export fehlgeschlagen")}showConfirmation(await o.json()),e.reset(),selectedFiles=[],updateFileList()}catch(e){alert("Fehler beim Erstellen des Exports: "+e.message)}finally{t.disabled=!1,t.innerHTML='\n        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">\n          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>\n          <polyline points="7 10 12 15 17 10"></polyline>\n          <line x1="12" y1="15" x2="12" y2="3"></line>\n        </svg>\n        Export starten\n      '}}else alert("Bitte laden Sie mindestens eine Datei hoch.")}))}function showConfirmation(e){const t=document.getElementById("confirmationModal"),n=document.getElementById("confirmationDetails"),i=document.getElementById("statusLink"),a=document.getElementById("closeModal");n.innerHTML=`\n    <p><strong>Job-ID:</strong> ${e.jobId}</p>\n    <p><strong>Position in Warteschlange:</strong> ${e.queuePosition}</p>\n    <p class="success-message">Ihr Export wurde erfolgreich zur Warteschlange hinzugefügt.</p>\n  `,i.href=`/status.html?jobId=${e.jobId}`,t.classList.remove("hidden"),a.addEventListener("click",(()=>{t.classList.add("hidden")})),t.addEventListener("click",(e=>{e.target===t&&t.classList.add("hidden")}))}function initializeFormatDescription(){const e=document.querySelectorAll('input[name="format"]'),t=document.getElementById("format-description"),n=t.querySelector("p");e.forEach((e=>{e.addEventListener("change",(()=>{const i=e.dataset.description;i?(n.innerHTML=i,t.style.display="block"):t.style.display="none"}))}))}function initializePresetDescription(){document.getElementById("presets-grid").addEventListener("change",(e=>{if("preset"===e.target.name){const t=document.getElementById("preset-description"),n=t.querySelector("p"),i=e.target.dataset.description;i?(n.innerHTML=i,t.style.display="block"):t.style.display="none"}})),setTimeout((()=>{const e=document.querySelector('input[name="preset"]:checked');if(e&&e.dataset.description){const t=document.getElementById("preset-description");t.querySelector("p").innerHTML=e.dataset.description,t.style.display="block"}}),100)}document.addEventListener("DOMContentLoaded",(async()=>{await loadPresets(),initializeTabs(),initializeExportTabs(),initializeUpload(),initializeAdvancedSettings(),initializeForm(),initializeExportSelection(),initializeFormatDescription(),initializePresetDescription()}));
>>>>>>> 410a3fbc3126727b4b27258c6fbfbd848b1989a6
