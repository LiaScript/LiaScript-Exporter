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
  `,
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
        checkedPreset.dataset.presetOptions || '{}',
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
    const isVisible = formats && formats.split(',').includes(selectedValue)

    if (isVisible) {
      group.style.display = 'block'
      hasVisibleSettings = true
      // Enable required fields in visible groups
      group
        .querySelectorAll('input[data-required], select[data-required]')
        .forEach((field) => {
          field.required = true
        })
    } else {
      group.style.display = 'none'
      // Disable required fields in hidden groups to prevent validation errors
      group
        .querySelectorAll('input[required], select[required]')
        .forEach((field) => {
          field.required = false
        })
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
        'input[name="preset"]:checked',
      )
      const selectedFormat = document.querySelector(
        'input[name="format"]:checked',
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
