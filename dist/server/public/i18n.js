/**
 * i18n.js - Internationalization system
 * Supports JSON translation files with dot notation keys
 */

class I18n {
  constructor() {
    this.currentLanguage = 'en'
    this.translations = {}
    this.fallbackLanguage = 'en'
  }

  async loadLanguage(lang) {
    try {
      const response = await fetch(`/locales/${lang}.json`)
      if (!response.ok) {
        throw new Error(`Failed to load language file: ${lang}`)
      }
      this.translations[lang] = await response.json()
      return true
    } catch (error) {
      console.error(`Error loading language ${lang}:`, error)
      return false
    }
  }

  async setLanguage(lang) {
    // Load language if not already loaded
    if (!this.translations[lang]) {
      const success = await this.loadLanguage(lang)
      if (!success && lang !== this.fallbackLanguage) {
        // Try fallback
        await this.loadLanguage(this.fallbackLanguage)
        lang = this.fallbackLanguage
      }
    }

    this.currentLanguage = lang
    localStorage.setItem('language', lang)
    this.updatePageTranslations()
    this.updateLanguageSelector()
  }

  t(key, fallback = '') {
    const translation = this.translations[this.currentLanguage]?.[key] ||
                       this.translations[this.fallbackLanguage]?.[key] ||
                       fallback ||
                       key
    return translation
  }

  updatePageTranslations() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
      const key = element.getAttribute('data-i18n')
      const translation = this.t(key)
      
      if (translation.includes('<') && translation.includes('>')) {
        element.innerHTML = translation
      } else {
        element.textContent = translation
      }
    })

    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
      const key = element.getAttribute('data-i18n-placeholder')
      element.placeholder = this.t(key)
    })

    document.querySelectorAll('[data-i18n-title]').forEach(element => {
      const key = element.getAttribute('data-i18n-title')
      element.title = this.t(key)
    })

    document.querySelectorAll('[data-i18n-html]').forEach(element => {
      const key = element.getAttribute('data-i18n-html')
      element.innerHTML = this.t(key)
    })

    document.querySelectorAll('[data-i18n-description]').forEach(element => {
      const key = element.getAttribute('data-i18n-description')
      const translation = this.t(key)
      element.setAttribute('data-description', translation)
    })
  }

  updateLanguageSelector() {
    const selector = document.getElementById('language-selector')
    if (selector) {
      selector.value = this.currentLanguage
    }
  }

  async init() {
    const savedLang = localStorage.getItem('language')
    
    let initialLang = savedLang || navigator.language.split('-')[0] || 'en'
    
    const supportedLanguages = ['en', 'de']
    if (!supportedLanguages.includes(initialLang)) {
      initialLang = 'en'
    }

    await this.loadLanguage(this.fallbackLanguage)
    
    if (initialLang !== this.fallbackLanguage) {
      await this.loadLanguage(initialLang)
    }

    this.currentLanguage = initialLang
    this.updatePageTranslations()
    this.updateLanguageSelector()

    const selector = document.getElementById('language-selector')
    if (selector) {
      selector.addEventListener('change', (e) => {
        this.setLanguage(e.target.value)
      })
    }
  }
}

const i18n = new I18n()

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => i18n.init())
} else {
  i18n.init()
}

window.i18n = i18n
