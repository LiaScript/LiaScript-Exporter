/*
 * Appended to the web app's copy of the pdf render entry by
 * scripts/copy-webapp-pdf.js. Runs inside the render's own document, which is
 * what makes the injected `@page` rule apply. Options arrive in the URL hash
 * because the query already carries the course.
 */
;(function () {
  var PREFIX = '#autoprint='

  if (location.hash.indexOf(PREFIX) !== 0) return

  var options = {}

  try {
    options = JSON.parse(decodeURIComponent(location.hash.slice(PREFIX.length)))
  } catch (e) {
    console.error('autoprint: could not read options', e)
    return
  }

  /*
   * A course may call `alert`, `confirm` or `prompt` — and each freezes this document until a human dismisses
   * it, stalling the render before it can reach the print dialog. The CLI
   * answers the same problem with Puppeteer's `page.on('dialog', …)`.
   */
  window.alert = function () {}
  window.confirm = function () {
    return true
  }
  window.prompt = function (message, fallback) {
    return fallback === undefined ? '' : fallback
  }

  window.addEventListener(
    'puppeteer:ready',
    function () {
      if (options.css) {
        var style = document.createElement('style')
        style.textContent = options.css
        document.head.appendChild(style)
      }

      if (options.theme) {
        document.documentElement.classList.remove('lia-theme-default')
        document.documentElement.classList.add('lia-theme-' + options.theme)
      }

      /*
       * `puppeteer:ready` fires for LiaScript's error report too — what renders
       * when the course could not be fetched — and printing that would hand the
       * user a PDF of the wrong document. The title is the distinctive part
       * (Error/Report.elm); the body is just a "Get Help?" slide.
       */
      if (document.title.indexOf('Ups, something went wrong') >= 0) {
        document.body.insertAdjacentHTML(
          'afterbegin',
          '<p style="padding:1rem;font:14px system-ui">The course could not be' +
            ' loaded, so there is nothing to print. Please close this tab and' +
            ' export again.</p>',
        )
        return
      }

      // Two frames: the injected rules must be laid out before printing.
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          window.print()
        })
      })
    },
    { once: true },
  )
})()
