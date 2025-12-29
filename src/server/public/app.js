// Global state
let selectedFiles = []
let currentSourceType = 'upload'
let currentExportTab = 'presets'

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
  initializeTabs()
  initializeExportTabs()
  initializeUpload()
  initializeAdvancedSettings()
  initializeForm()
  initializeExportSelection()
})

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
  const fileInput = document.getElementById('fileInput')

  // Click to select files
  uploadArea.addEventListener('click', (e) => {
    if (e.target !== fileInput) {
      fileInput.click()
    }
  })

  // File selection
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files)
  })

  // Drag and drop
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
  const presetRadios = document.querySelectorAll('input[name="preset"]')
  const formatRadios = document.querySelectorAll('input[name="format"]')

  // When preset is selected, deselect formats
  presetRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        formatRadios.forEach((formatRadio) => {
          formatRadio.checked = false
        })
      }
    })
  })

  // When format is selected, deselect presets
  formatRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        presetRadios.forEach((presetRadio) => {
          presetRadio.checked = false
        })
      }
    })
  })
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

      // Add options
      const masteryScore = document.getElementById('masteryScore').value
      const pageSize = document.getElementById('pageSize').value
      const organization = document.getElementById('organization').value

      if (masteryScore) formData.append('option_masteryScore', masteryScore)
      if (pageSize) formData.append('option_pageSize', pageSize)
      if (organization) formData.append('option_organization', organization)

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
