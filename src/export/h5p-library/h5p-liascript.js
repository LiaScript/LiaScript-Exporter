/*
 * H5P.LiaScript: runs a LiaScript course as H5P content.
 *
 * Written by the LiaScript-Exporter (src/export/h5p.ts), which replaces the
 * placeholder string of RUNTIME (a string, so minifiers keep it) with
 * { head: … }, the <head> of the bundled LiaScript runtime, every local
 * src/href starting with %BASE%.
 *
 * The runtime gets an iframe of its own, written with document.open/write
 * like H5P writes its own frame: H5P accepts no .html files, and LiaScript
 * needs a document of its own with a real URL (its Elm app reads
 * location.href, and resolves fonts, editor modes and chunks against it).
 * history.replaceState moves that document to the library folder, so
 * relative URLs resolve as in a plain web export.
 *
 * The course reaches its state and results through `window.h5pBridge`, see
 * LiaScript/src/typescript/connectors/H5P.
 */
var H5P = H5P || {}

H5P.LiaScript = (function () {
  'use strict'

  var RUNTIME = '__LIASCRIPT_RUNTIME__'

  /** content settings of packages that do not carry them as parameters */
  var CONFIG_FILE = 'liascript.json'

  /** the content folder in the `base:` of an embedded course, see h5p.ts */
  var CONTENT_SENTINEL = '%H5P_CONTENT%'

  function absolute(url) {
    return new URL(url, window.location.href).href
  }

  /** a base64 parameter of the exporter, as text */
  function decode(text) {
    var binary = atob(text)
    var bytes = new Uint8Array(binary.length)
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new TextDecoder().decode(bytes)
  }

  /** JSON that is safe inside a <script> element */
  function inline(value) {
    return JSON.stringify(value === undefined ? null : value)
      .replace(/</g, '\\u003c')
      .replace(/\u2028/g, '\\u2028')
      .replace(/\u2029/g, '\\u2029')
  }

  function LiaScript(params, contentId, extras) {
    H5P.EventDispatcher.call(this)
    this.params = params || {}
    this.contentId = contentId
    this.extras = extras || {}
    this.state = this.extras.previousState || null
    this.xAPIData = null
    this.bridge = null
    this.frame = null
  }

  LiaScript.prototype = Object.create(H5P.EventDispatcher.prototype)
  LiaScript.prototype.constructor = LiaScript

  /** the bridges of all instances on this page, read from inside the frames */
  LiaScript.bridges = {}

  LiaScript.prototype.attach = function ($container) {
    var self = this
    var container = $container.get(0)
    container.classList.add('h5p-liascript')
    container.innerHTML = ''

    var frame = document.createElement('iframe')
    frame.className = 'h5p-liascript-frame'
    frame.title = (this.extras.metadata && this.extras.metadata.title) || 'LiaScript'
    frame.setAttribute('allow', 'fullscreen; autoplay; clipboard-write; microphone; camera; speaker-selection')
    frame.style.height = (parseInt(this.params.height, 10) || 600) + 'px'
    container.appendChild(frame)
    this.frame = frame

    // Going back in the browser history past the course's first page reloads
    // its URL, which does not exist: write the course again.
    frame.addEventListener('load', function () {
      var win = frame.contentWindow
      var ours = false
      try {
        ours = !!(win && win.h5pBridge)
      } catch (e) {}
      if (self.written && !ours) self.write()
    })

    this.load(function (config) {
      self.config = config
      self.write()
    })
  }

  /** reads the course settings, from the parameters or from older packages' file */
  LiaScript.prototype.load = function (done) {
    if (this.params.config) {
      try {
        return done(JSON.parse(decode(this.params.config)) || {})
      } catch (e) {
        console.warn('H5P.LiaScript: unreadable settings', e)
      }
    }

    var url = absolute(H5P.getPath(CONFIG_FILE, this.contentId))
    var request = new XMLHttpRequest()
    request.open('GET', url)
    request.onload = function () {
      var config = {}
      try {
        if (request.status >= 200 && request.status < 300) config = JSON.parse(request.responseText) || {}
      } catch (e) {
        console.warn('H5P.LiaScript: unreadable', CONFIG_FILE, e)
      }
      done(config)
    }
    request.onerror = function () {
      console.warn('H5P.LiaScript: could not load', url)
      done({})
    }
    request.send()
  }

  LiaScript.prototype.write = function () {
    var self = this
    var config = this.config || {}

    var library = this.libraryInfo
      ? this.libraryInfo.machineName + '-' + this.libraryInfo.majorVersion + '.' + this.libraryInfo.minorVersion
      : 'H5P.LiaScript'
    var base = absolute(H5P.getLibraryPath(library) + '/runtime/')
    var course = absolute(H5P.getPath(this.params.course || 'README.md', this.contentId))
    // the embedded course needs no content file, its relative links still point there
    var script = this.params.markdown
      ? decode(this.params.markdown)
          .split(CONTENT_SENTINEL)
          .join(absolute(H5P.getPath('', this.contentId)).replace(/\/$/, ''))
      : null

    var key = String(this.contentId) + '-' + Math.random().toString(36).slice(2)
    this.bridge = {
      previousState: this.state,
      mastery: typeof config.mastery === 'number' ? config.mastery : null,
      save: function (state) {
        self.state = state
      },
      report: function (result) {
        self.report(result)
      },
    }
    LiaScript.bridges[key] = this.bridge

    var boot =
      'history.replaceState(null, "", ' + inline(base + 'index.html') + ');' +
      'window.LIA = { defaultCourseURL: ' + inline(course) + ' };' +
      'window.liascript_course = ' + inline(script) + ';' +
      'window.config_ = ' + inline(config.config || {}) + ';' +
      'window.h5pBridge = parent.H5P.LiaScript.bridges[' + inline(key) + '];'

    var doc = this.frame.contentWindow.document
    doc.open()
    doc.write(
      '<!DOCTYPE html><html><head><meta charset="utf-8">' +
        // Firefox keeps resolving relative URLs (editor modes, icons) against
        // the H5P page that wrote this document, despite history.replaceState
        '<base href="' + base.replace(/&/g, '&amp;').replace(/"/g, '&quot;') + 'index.html">' +
        '<script>' +
        boot +
        '<\/script>' +
        RUNTIME.head.split('%BASE%').join(base) +
        '<\/head><body><\/body><\/html>'
    )
    doc.close()
    this.written = true
    this.trigger('resize')
  }

  /** H5P stores this for the learner, and passes it back as previousState */
  LiaScript.prototype.getCurrentState = function () {
    if (this.bridge && this.bridge.flush) {
      try {
        this.bridge.flush()
      } catch (e) {
        console.warn('H5P.LiaScript: saving failed', e)
      }
    }
    return this.state
  }

  /** the last result with one statement per quiz and survey, for Moodle */
  LiaScript.prototype.getXAPIData = function () {
    return this.xAPIData || { statement: this.createXAPIEventTemplate('answered').data.statement }
  }

  LiaScript.prototype.getTitle = function () {
    return H5P.createTitle((this.extras.metadata && this.extras.metadata.title) || 'LiaScript')
  }

  /** a completed course: one "completed" statement, the answers as children */
  LiaScript.prototype.report = function (result) {
    var event = this.createXAPIEventTemplate('completed')
    var success = result.success === null ? undefined : result.success

    if (typeof result.max === 'number' && result.max > 0) {
      event.setScoredResult(result.raw, result.max, this, true, success)
    } else {
      event.data.statement.result = { completion: true }
      if (success !== undefined) event.data.statement.result.success = success
    }

    var self = this
    this.xAPIData = {
      statement: event.data.statement,
      children: (result.interactions || []).map(function (item) {
        return { statement: self.answered(item) }
      }),
    }

    this.trigger(event)
  }

  /** one interaction as a statement of its own, shown in Moodle's attempt report */
  LiaScript.prototype.answered = function (item) {
    var child = {
      contentId: this.contentId,
      subContentId: item.id,
      parent: this,
      getTitle: function () {
        return item.description || item.id
      },
    }

    var event = new H5P.XAPIEvent()
    event.setActor()
    event.setVerb('answered')
    event.setObject(child)
    event.setContext(child)

    var statement = event.data.statement
    statement.object.definition.interactionType = 'long-fill-in'
    statement.object.definition.type = 'http://adlnet.gov/expapi/activities/cmi.interaction'
    statement.object.definition.description = { 'en-US': item.description || item.id }

    var result = { response: item.response || '' }
    var weight = parseFloat(item.weighting)
    if (item.result === 'correct' || item.result === 'incorrect') {
      var max = weight > 0 ? weight : 1
      result.success = item.result === 'correct'
      result.score = { min: 0, max: max, raw: result.success ? max : 0, scaled: result.success ? 1 : 0 }
    }
    statement.result = result
    return statement
  }

  return LiaScript
})()
