/**
 * Internationalization (i18n) module for LiaScript Export Server
 * Provides client-side translation functionality
 */

// Global state
let currentLanguage = 'de'
let translations = {}
let availableLanguages = []

/**
 * Initialize i18n system
 * Loads available languages and applies user's preferred language
 */
async function initI18n() {
  // Get saved language preference or detect from browser
  const savedLang = localStorage.getItem('liaex-language')
  const browserLang = navigator.language.split('-')[0]
  
  // Load available languages
  try {
    const response = await fetch('/api/i18n/languages')
    const data = await response.json()
    availableLanguages = data.languages || []
    
    // Build language selector if it exists
    buildLanguageSelector()
  } catch (error) {
    console.error('Failed to load available languages:', error)
    availableLanguages = [
      { code: 'de', name: 'Deutsch' },
      { code: 'en', name: 'English' }
    ]
  }
  
  // Determine which language to use
  if (savedLang && availableLanguages.some(l => l.code === savedLang)) {
    currentLanguage = savedLang
  } else if (availableLanguages.some(l => l.code === browserLang)) {
    currentLanguage = browserLang
  } else {
    currentLanguage = 'de' // Default fallback
  }
  
  // Load and apply translations
  await loadTranslations(currentLanguage)
  applyTranslations()
  
  return translations
}

/**
 * Load translations for a specific language
 */
async function loadTranslations(lang) {
  try {
    const response = await fetch(`/api/i18n/${lang}`)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    translations = await response.json()
    currentLanguage = lang
    localStorage.setItem('liaex-language', lang)
    
    // Update HTML lang attribute
    document.documentElement.lang = lang
    
    return translations
  } catch (error) {
    console.error(`Failed to load translations for '${lang}':`, error)
    // Try fallback to German
    if (lang !== 'de') {
      return loadTranslations('de')
    }
    return {}
  }
}

/**
 * Get a translation by key path (e.g., 'header.title')
 * Supports placeholder replacement: t('status.files_count', { count: 5 })
 */
function t(key, params = {}) {
  const keys = key.split('.')
  let value = translations
  
  for (const k of keys) {
    if (value && typeof value === 'object' && k in value) {
      value = value[k]
    } else {
      // Key not found, return the key itself
      console.warn(`Translation missing: ${key}`)
      return key
    }
  }
  
  // If the value is not a string, return as is
  if (typeof value !== 'string') {
    return value
  }
  
  // Replace placeholders like {count}
  return value.replace(/\{(\w+)\}/g, (match, paramName) => {
    return params.hasOwnProperty(paramName) ? params[paramName] : match
  })
}

/**
 * Apply translations to all elements with data-i18n attribute
 */
function applyTranslations() {
  // Translate elements with data-i18n attribute (text content)
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n')
    const translation = t(key)
    if (translation && translation !== key) {
      el.textContent = translation
    }
  })
  
  // Translate elements with data-i18n-html attribute (HTML content)
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    const key = el.getAttribute('data-i18n-html')
    const translation = t(key)
    if (translation && translation !== key) {
      el.innerHTML = translation
    }
  })
  
  // Translate placeholder attributes
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder')
    const translation = t(key)
    if (translation && translation !== key) {
      el.placeholder = translation
    }
  })
  
  // Translate title attributes
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title')
    const translation = t(key)
    if (translation && translation !== key) {
      el.title = translation
    }
  })
  
  // Update document title if translation exists
  const pageTitle = document.querySelector('title[data-i18n]')
  if (pageTitle) {
    const key = pageTitle.getAttribute('data-i18n')
    const translation = t(key)
    if (translation && translation !== key) {
      document.title = translation
    }
  }
}

/**
 * Build language selector dropdown
 */
function buildLanguageSelector() {
  const selector = document.getElementById('language-selector')
  if (!selector) return
  
  selector.innerHTML = ''
  
  availableLanguages.forEach(lang => {
    const option = document.createElement('option')
    option.value = lang.code
    option.textContent = lang.name
    if (lang.code === currentLanguage) {
      option.selected = true
    }
    selector.appendChild(option)
  })
  
  // Add change event listener
  selector.addEventListener('change', async (e) => {
    const newLang = e.target.value
    await switchLanguage(newLang)
  })
}

/**
 * Switch to a different language
 */
async function switchLanguage(lang) {
  if (lang === currentLanguage) return
  
  await loadTranslations(lang)
  applyTranslations()
  
  // Dispatch event for other scripts to react
  window.dispatchEvent(new CustomEvent('languageChanged', { 
    detail: { language: lang, translations } 
  }))
}

/**
 * Get current language code
 */
function getCurrentLanguage() {
  return currentLanguage
}

/**
 * Get all available languages
 */
function getAvailableLanguages() {
  return availableLanguages
}

/**
 * Get the full translations object
 */
function getTranslations() {
  return translations
}

// Export functions for use in other scripts
window.i18n = {
  init: initI18n,
  t,
  apply: applyTranslations,
  switch: switchLanguage,
  getCurrentLanguage,
  getAvailableLanguages,
  getTranslations
}
