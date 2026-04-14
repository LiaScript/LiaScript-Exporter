import * as helper from './helper'
import * as PDF from './pdf'
import * as IMS from './ims'
import * as SCORM12 from './scorm12'
import * as SCORM2004 from './scorm2004'
import * as ANDROID from './android'
import * as RDF from './rdf'
import * as COLOR from '../colorize'

const fs = require('fs-extra')
const path = require('path')
const { execSync } = require('child_process')

var Categories: Set<string> = new Set([])

export function getNext(collection: any): string | null {
  if (collection['collection']) {
    collection = collection['collection']
  }

  if (collection['url'] && collection['data'] === undefined) {
    return collection['url']
  } else {
    for (let i = 0; i < collection.length; i++) {
      let course = collection[i]

      if (course.collection) {
        let url = getNext(course)

        if (url) {
          return url
        }
      } else if (course.url && course.data === undefined) {
        return course.url
      }
    }
  }
  return null
}

export function storeNext(collection: any, data: any) {
  if (collection['collection']) {
    collection = collection['collection']
  }

  for (let i = 0; i < collection.length; i++) {
    if (collection[i].collection) {
      for (let j = 0; j < collection[i].collection.length; j++) {
        if (
          collection[i].collection[j].url &&
          collection[i].collection[j].data === undefined
        ) {
          collection[i].collection[j].data = data
          return
        }
      }
    } else if (collection[i].url && collection[i].data === undefined) {
      collection[i].data = data
      return
    }
  }

  return
}

export function help() {
  console.log('')
  console.log(COLOR.heading('Project settings:'), '\n')

  COLOR.info(
    'A project is a bundle for multiple LiaScript resource into a single project overview page, based on a provided yaml description.',
  )

  console.log(
    '\nLearn more: https://www.npmjs.com/package/@liascript/exporter#project \n',
  )
  console.log('Example:')
  console.log(
    '- Input:  https://github.com/LiaBooks/liabooks.github.com/blob/main/project.yaml',
  )
  console.log('- Output: https://liabooks.github.io')
  console.log('')

  COLOR.command(
    null,
    '--project-no-meta',
    '         Disable the generation of meta information for OpenGraph and Twitter-cards.',
  )
  COLOR.command(
    null,
    '--project-no-rdf',
    '          Disable the generation of json-ld.',
  )
  COLOR.command(
    null,
    '--project-no-categories',
    '   Disable the filter for categories/tags.',
  )
  COLOR.command(
    null,
    '--project-category-blur',
    '   Enable this and the categories will be blurred instead of deleted.',
  )
  COLOR.command(
    null,
    '--project-generate-scrom12',
    'SCORM12 and pass additional scrom settings.',
  )
  COLOR.command(
    null,
    '--project-generate-scrom2004',
    'SCORM2004 and pass additional scrom settings.',
  )
  COLOR.command(
    null,
    '--project-generate-ims',
    '    IMS resources with additional config settings.',
  )
  COLOR.command(
    null,
    '--project-generate-pdf',
    '    PDFs are automatically generated and added to every card.',
  )
  COLOR.command(
    null,
    '--project-generate-cache',
    '  Only generate new files, if they do not exist.',
  )
}

export interface ProjectExportArguments {
  input: string
  readme: string
  output: string
  format: string
  path: string
  key?: string
  style?: string
  'project-no-meta'?: boolean
  'project-no-rdf'?: boolean
  'project-no-categories'?: boolean
  'project-category-blur'?: number
  'project-generate-pdf'?: boolean
  'project-generate-ims'?: boolean
  'project-generate-scorm12'?: boolean
  'project-generate-scorm2004'?: boolean
  'project-generate-android'?: boolean
  'project-generate-cache'?: boolean
}

export const format = 'project'

export async function exporter(argument: ProjectExportArguments, json: any) {
  // make temp folder

  let cards = ''
  const output = argument.output
  const itemList: any[] = []
  const searchIndex: any[] = []

  for (let i = 0; i < json.collection.length; i++) {
    let course = json.collection[i]

    if (course.collection) {
      let subCards = ''
      let subItemList: any[] = []

      for (let j = 0; j < course.collection.length; j++) {
        if (course.collection[j].link) {
          subCards += `<div class='col-sm-6 col-md-4 col-lg-3 ${
            course.grid ? 'mb-3' : ''
          }'>
          ${toLinkCard(argument, course.collection[j], true)}
          </div>`
        } else {
          let { html, json, searchEntry } = await toCard(
            argument,
            course.collection[j],
            true,
          )

          if (searchEntry) searchIndex.push(searchEntry)
          subCards += `<div class='col-sm-6 col-md-4 col-lg-3 ${
            course.grid ? 'mb-3' : ''
          }'>
          ${html}
          </div>`

          subItemList.push(json)
        }
      }

      const itemListElement = {
        '@type': 'ItemList',
        itemListElement: subItemList,
      }

      if (course.title) {
        itemListElement['name'] = course.title
      }
      if (course.comment) {
        itemListElement['description'] = course.comment
      }

      itemList.push(itemListElement)

      cards += `
        <div class="col-12">
            <div class="card">
                <div class="card-header">
                    ${course.title}
                </div>
                <div class="card-body">
                    <p class="card-text">${course.comment}</p>
                    <div ${
                      course.grid
                        ? 'class="row"'
                        : 'style="display: flex; scroll-snap-type: x mandatory; overflow-x: auto; overflow-y: hidden; padding-bottom: 10px"'
                    }>
                        ${subCards}
                    </div>
                </div>
            </div>
        </div>`
    } else if (course.html) {
      cards += "<div class='col-12'>" + course.html + '</div>'
    } else if (course.link) {
      cards += "<div class='col'>" + toLinkCard(argument, course) + '</div>'
    } else {
      let { html, json, searchEntry } = await toCard(argument, course)

      cards += "<div class='col'>" + html + '</div>'
      if (searchEntry) searchIndex.push(searchEntry)
      itemList.push(json)
    }
  }

  const background = json.logo
    ? `style="background-size: cover; background-image: url('${json.logo}'); background-position: center center; background-repeat: no-repeat;"`
    : ''

  let options = ''

  if (Categories.size > 0 && !argument['project-no-categories']) {
    const opt = [...Categories].sort()

    for (let i = 0; i < opt.length; i++) {
      options += `<option value="${opt[i]}">${opt[i]}</option>`
    }

    options =
      `<select id="categorySelect"
                class="form-select"
                aria-label="Default select example"
                onchange="addCategoryChip(this.value)">
          <option value="" selected>All categories</option>` +
      options +
      '</select>'
  }

  const jsonLD = {
    '@context': 'http://schema.org/',
    '@type': 'ItemList',
    itemListElement: removeContext(itemList),
  }

  let title = json.title || 'LiaScript Course Index'

  if (json.title) {
    title = cleanHTML(title).replace(/\s+/g, ' ').trim()
    jsonLD['name'] = title
  }

  if (json.comment) {
    jsonLD['description'] = cleanHTML(json.comment).replace(/\s+/g, ' ').trim()
  }

  const html = `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>

    <script type="application/ld+json">
    ${JSON.stringify(jsonLD, null, 2)}
    </script>
  
    ${argument['project-no-meta'] ? '' : meta(json)}

    ${
      json.icon
        ? '<link rel="icon" type="image/x-icon" href="' + json.icon + '">'
        : ''
    }

    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-EVSTQN3/azprG1Anm3QDgpJLIm9Nao0Yz1ztcQTwFspd3yD65VohhpuuCOmLASjC" crossorigin="anonymous">

    <script>
      // Globale Variable zum Speichern der ausgewählten Kategorien
      window.selectedCategories = []

      // Fügt einen Chip hinzu, wenn eine Kategorie gewählt wurde
      function addCategoryChip(category) {
        if (!category) return // falls "All categories" gewählt wurde, nichts tun
        if (window.selectedCategories.indexOf(category) === -1) {
          window.selectedCategories.push(category)
          // Option im Select-Menü deaktivieren
          document.querySelector('#categorySelect option[value="' + category + '"]').disabled = true
          updateChipsDisplay()
          filterCards()
        }
        // Setze das Select-Element zurück
        document.getElementById('categorySelect').value = ''
      }

      // Entfernt einen Chip
      function removeCategoryChip(category) {
        const index = window.selectedCategories.indexOf(category)
        if (index > -1) {
          window.selectedCategories.splice(index, 1)
          // Option im Select-Menü wieder aktivieren
          document.querySelector('#categorySelect option[value="' + category + '"]').disabled = false
          updateChipsDisplay()
          filterCards()
        }
      }

      // Aktualisiert die Anzeige der Chips
      function updateChipsDisplay() {
        const chipsContainer = document.getElementById('chipsContainer')
        chipsContainer.innerHTML = ''
        window.selectedCategories.forEach(function (cat) {
          const chip = document.createElement('span')
          chip.className = 'badge rounded-pill bg-primary me-2'
          chip.style.cursor = 'pointer'
          chip.style.fontSize = '1rem'
          chip.textContent = cat + ' ×'
          chip.onclick = function () {
            removeCategoryChip(cat)
          }
          chipsContainer.appendChild(chip)
        })
      }

      function filterCards() {
        const cards = document.querySelectorAll('div[data-category]')
        cards.forEach(function (card) {
          // Falls keine Filterkategorien ausgewählt wurden, zeige alle Karten
          if (window.selectedCategories.length === 0) {
            ${
              argument['project-category-blur']
                ? 'card.style.filter = "";'
                : 'card.parentNode.style.display = "block";'
            }
            return
          }
          // Zerlege die im data-Attribut hinterlegten Kategorien
          const cardCategories = card.dataset.category.split('|')
          // Prüfe, ob alle ausgewählten Kategorien in der Karte vorhanden sind
          const show = window.selectedCategories.every(function (cat) {
            return cardCategories.indexOf(cat) !== -1
          })
          if (show) {
            ${
              argument['project-category-blur']
                ? 'card.style.filter = "";'
                : 'card.parentNode.style.display = "block";'
            }
          } else {
            ${
              argument['project-category-blur']
                ? 'card.style.filter = "blur(1px) opacity(35%)";'
                : 'card.parentNode.style.display = "none";'
            }
          }
        })
      }
    </script>
</head>
<body>
    
    ${generateNavbar(json.navbar, !!searchIndex.length)}
    <!-- Search Modal -->
    <div class="modal fade" id="searchModal" tabindex="-1" aria-labelledby="searchModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
          <div class="modal-header border-0 pb-0">
            <div class="input-group">
              <span class="input-group-text bg-white border-end-0" style="border-radius: 8px 0 0 8px;">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/></svg>
              </span>
              <input type="text" id="searchInput" class="form-control border-start-0 ps-0" placeholder="Search courses and sections… (Ctrl+K)" autocomplete="off" style="border-radius: 0 8px 8px 0; box-shadow: none;">
            </div>
            <button type="button" class="btn-close ms-2" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-2 px-0">
            <div id="searchResults"><p class="text-muted px-3">Start typing to search…</p></div>
          </div>
        </div>
      </div>
    </div>
    <style>
      .search-highlight { background-color: rgba(255, 193, 7, 0.4); padding: 0 1px; border-radius: 2px; font-weight: 600; }
      .text-truncate-multiline { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    </style>
    <main>
        <div class="container-fluid" ${background} >
            <section class="py-5 text-center container">
                <div class="row py-lg-5">
                    <div class="col-lg-6 col-md-8 mx-auto">
                        <h1 class="fw-light">${
                          json.title || 'LiaScript Course Index'
                        }</h1>
                        <p class="lead text-muted">${json.comment || ''}</p>

                        ${options}
                        <div id="chipsContainer" class="mt-3"></div>
                    </div>
                </div>
            </section>
        </div>

        <div class="album py-5 bg-light">
            <div class="container">
                <div class="row row-cols-1 row-cols-sm-1 row-cols-md-2 row-cols-xl-3 g-3">
                    ${cards}
                </div>
            </div>
        </div>

    </main>
    

    <footer class="text-muted py-3">
        <div class="container">
            <p class="float-end">
                <a href="#">Back to top</a>
            </p>
            <p>${
              json.footer ||
              '<a href="https://liascript.github.io" target="_blank">LiaScript</a> is a Markdown dialect made for education. For more information checkout out <a href="https://www.youtube.com/channel/UCyiTe2GkW_u05HSdvUblGYg" target="_blank">YouTube-Channel</a> or follow us on <a href="https://twitter.com/LiaScript" target="_blank">Twitter</a>.'
            }</p>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-MrcW6ZMFYlzcLA8Nl+NtUVF0sA7MsXsP1UyJoMp4YLEuNSfAP+JcXn/tWtIaxVXM" crossorigin="anonymous"></script>
    <script src="https://cdn.jsdelivr.net/npm/fuse.js@7.0.0/dist/fuse.min.js"></script>
    <script>
      // Compact index: [{t, g, i, u, s: [[sectionTitle, sectionContent, indentation], ...]}]
      // Denormalize into flat records for Fuse
      var SEARCH_INDEX = ${JSON.stringify(searchIndex)};
      var FLAT_INDEX = [];
      SEARCH_INDEX.forEach(function(course) {
        for (var n = 0; n < course.s.length; n++) {
          var sec = course.s[n];
          FLAT_INDEX.push({
            courseTitle:    course.t,
            sectionTitle:   sec[0],
            sectionContent: sec[1],
            tags:           course.g,
            image:          course.i,
            url:            course.u + '#' + (n + 1),
            indentation:    sec[2],
          });
        }
      });

      var fuse = new Fuse(FLAT_INDEX, {
        keys: [
          { name: 'courseTitle',    weight: 0.35 },
          { name: 'sectionTitle',   weight: 0.30 },
          { name: 'sectionContent', weight: 0.20 },
          { name: 'tags',           weight: 0.15 },
        ],
        includeScore: true,
        includeMatches: true,
        threshold: 0.4,
        minMatchCharLength: 2,
      });

      function highlight(text, matches, key) {
        if (!text || !matches) return escapeHtml(text || '');
        var match = matches.find(function(m) { return m.key === key; });
        if (!match || !match.indices || !match.indices.length) return escapeHtml(text);
        var result = '';
        var last = 0;
        var indices = match.indices.slice().sort(function(a,b){ return a[0]-b[0]; });
        indices.forEach(function(pair) {
          result += escapeHtml(text.slice(last, pair[0]));
          result += '<mark class="search-highlight">' + escapeHtml(text.slice(pair[0], pair[1]+1)) + '</mark>';
          last = pair[1] + 1;
        });
        result += escapeHtml(text.slice(last));
        return result;
      }

      function escapeHtml(str) {
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');
      }

      function excerpt(text, maxLen) {
        if (!text) return '';
        if (text.length <= maxLen) return text;
        return text.slice(0, maxLen) + '…';
      }

      function renderResults(query) {
        var container = document.getElementById('searchResults');
        if (!query || query.length < 2) {
          container.innerHTML = '<p class="text-muted px-3">Start typing to search…</p>';
          return;
        }
        var results = fuse.search(query, { limit: 20 });
        if (!results.length) {
          container.innerHTML = '<p class="text-muted px-3">No results found.</p>';
          return;
        }

        var html = '';
        var seenUrls = {};
        results.forEach(function(r) {
          var item = r.item;
          var matches = r.matches;
          var baseUrl = item.url.split('#')[0];
          var isFirstFromCourse = !seenUrls[baseUrl];
          seenUrls[baseUrl] = true;

          var imgHtml = item.image
            ? '<div class="flex-shrink-0 me-3" style="width:64px;height:48px;background-image:url(&quot;' + escapeHtml(item.image) + '&quot;);background-size:cover;background-position:center;border-radius:4px;"></div>'
            : '';

          var tagHtml = '';
          if (item.tags && item.tags.length) {
            tagHtml = '<div class="mt-1">' + item.tags.map(function(t) {
              return '<span class="badge rounded-pill bg-light text-dark me-1" style="font-size:0.7rem;">' + escapeHtml(t) + '</span>';
            }).join('') + '</div>';
          }

          var indent = item.indentation > 1 ? ' style="padding-left:' + ((item.indentation - 1) * 12) + 'px"' : '';
          var prefix = item.indentation > 1 ? '<span class="text-muted me-1">' + '·'.repeat(item.indentation - 1) + '</span>' : '';

          html += '<a href="' + escapeHtml(item.url) + '" target="_blank" class="list-group-item list-group-item-action py-2 px-3">' +
            '<div class="d-flex align-items-start"' + indent + '>' +
            imgHtml +
            '<div class="flex-grow-1 overflow-hidden">' +
            (isFirstFromCourse && item.sectionTitle !== item.courseTitle
              ? '<div class="text-muted small mb-1">' + highlight(item.courseTitle, matches, 'courseTitle') + '</div>'
              : '') +
            '<div class="fw-semibold">' + prefix + highlight(item.sectionTitle, matches, 'sectionTitle') + '</div>' +
            (item.sectionContent
              ? '<div class="text-muted small text-truncate-multiline">' + highlight(excerpt(item.sectionContent, 160), matches, 'sectionContent') + '</div>'
              : '') +
            tagHtml +
            '</div>' +
            '</div>' +
            '</a>';
        });
        container.innerHTML = '<div class="list-group list-group-flush">' + html + '</div>';
      }

      document.addEventListener('DOMContentLoaded', function() {
        var input = document.getElementById('searchInput');
        var modal = document.getElementById('searchModal');

        input.addEventListener('input', function() {
          renderResults(this.value.trim());
        });

        // Ctrl+K / Cmd+K shortcut
        document.addEventListener('keydown', function(e) {
          if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            var bsModal = bootstrap.Modal.getOrCreateInstance(modal);
            bsModal.show();
          }
          if (e.key === 'Escape') {
            var bsModal = bootstrap.Modal.getInstance(modal);
            if (bsModal) bsModal.hide();
          }
        });

        modal.addEventListener('shown.bs.modal', function() {
          input.focus();
          input.select();
        });

        modal.addEventListener('hidden.bs.modal', function() {
          input.value = '';
          document.getElementById('searchResults').innerHTML = '<p class="text-muted px-3">Start typing to search…</p>';
        });
      });
    </script>
</body>
</html> 
`

  helper.writeFile(output + '.html', helper.prettify(helper.prettify(html)))
}

function generateNavbar(navbar: any, hasSearch: boolean = false): string {
  if (!navbar && !hasSearch) return ''

  const bg = navbar?.background || '#0B6E75'
  const theme = navbar?.theme === 'light' ? 'navbar-light' : 'navbar-dark'
  const brand = navbar?.brand || ''
  const links: any[] = navbar?.links || []

  let linkItems = ''
  for (let i = 0; i < links.length; i++) {
    const link = links[i]
    const active = i === 0 ? ' active' : ''
    linkItems += `
                <li class="nav-item">
                    <a class="nav-link${active}" href="${link.url || '#'}">${link.label || ''}</a>
                </li>`
  }

  const searchButton = hasSearch
    ? `<button class="btn btn-link nav-link ms-2" type="button" data-bs-toggle="modal" data-bs-target="#searchModal" title="Search (Ctrl+K)" style="opacity:0.85;">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16"><path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.415l-3.85-3.85zm-5.242 1.656a5.5 5.5 0 1 1 0-11 5.5 5.5 0 0 1 0 11z"/></svg>
            </button>`
    : ''

  return `
    <nav class="navbar navbar-expand-lg ${theme} sticky-top" style="background-color: ${bg};">
        <div class="container">
            <a class="navbar-brand" href="#">${brand}</a>
            <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
                <span class="navbar-toggler-icon"></span>
            </button>
            <div class="collapse navbar-collapse" id="navbarNav">
                <ul class="navbar-nav ms-auto">
                    ${linkItems}
                </ul>
                ${searchButton}
            </div>
        </div>
    </nav>`
}

function removeContext(obj) {
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (key === '@context') {
        delete obj[key]
      } else if (typeof obj[key] === 'object') {
        removeContext(obj[key])
      }
    }
  }
  return obj
}
async function moveFile(oldPath, newPath) {
  // 1. Create the destination directory if it does not exist
  // Set the `recursive` option to `true` to create all the subdirectories

  await fs.mkdir(path.dirname(newPath), { recursive: true })
  // 2. Rename the file (move it to the new directory)
  // Return the promise
  return fs.rename(oldPath, newPath)
}

function cleanHTML(html: string) {
  return html.replace(/<[^>]+>/g, '')
}

/**
 * Recursively extracts plain text from the Elm inline-encoded JSON structure.
 * Each section title is an array of inline nodes like {"Chars": "..."}, {"Bold": [...]}, etc.
 */
function inlineToText(node: any): string {
  if (!node) return ''
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(inlineToText).join('')
  if (node.Chars) return node.Chars
  if (node.Symbol) return node.Symbol
  if (node.Verbatim) return node.Verbatim
  if (node.Bold) return inlineToText(node.Bold)
  if (node.Italic) return inlineToText(node.Italic)
  if (node.Strike) return inlineToText(node.Strike)
  if (node.Underline) return inlineToText(node.Underline)
  if (node.Superscript) return inlineToText(node.Superscript)
  if (node.Ref) return ''
  return ''
}

/**
 * Strips common Markdown syntax from a raw section code string to produce
 * cleaner plain text for the search index.
 */
function markdownToText(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, '') // fenced code blocks
    .replace(/`[^`]+`/g, '') // inline code
    .replace(/--\{\{[\d\s\-]+\}\}--/g, '') // LiaScript block animations --{{n}}--
    .replace(/\{\{[\d\s\-]+\}\}/g, '') // LiaScript inline animations {{n}} / {{n-m}}
    .replace(/@[\w.]+(\([^)]*\))?/g, '') // LiaScript macros @Macro or @Macro(...)
    .replace(/<[^>]+>/g, '') // HTML tags
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // links → label
    .replace(/^#+\s+/gm, '') // headings
    .replace(/[*_]{1,3}([^*_]+)[*_]{1,3}/g, '$1') // bold/italic markers
    .replace(/^\s*[-*+>]\s+/gm, '') // list markers / blockquotes
    .replace(/[|\-]{2,}/g, ' ') // table separators
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Builds a compact course object for the search index.
 * Shared fields (courseTitle, tags, image, baseUrl) are stored once per course.
 * Per-section data is stored as a minimal array: [sectionTitle, sectionContent, indentation].
 * The browser denormalizes this into flat records before passing to Fuse.
 */
function buildCourseSearchEntry(course: any): any | null {
  const lia = course.data?.lia
  if (!lia) return null

  const courseTitle = overwrite(course.title, lia.str_title) || ''
  const readmeUrl = lia.readme as string
  const baseUrl = 'https://LiaScript.github.io/course/?' + readmeUrl
  let image: string = overwrite(course.logo, lia.definition?.logo) || ''
  if (image && !image.startsWith('http:') && !image.startsWith('https:')) {
    try {
      image = new URL(image, readmeUrl).toString()
    } catch (_) {}
  }

  let tags: string[] = []
  try {
    tags =
      (course.tags ||
        lia.definition?.macro?.tags?.split(',').map((t: string) => t.trim())) ??
      []
  } catch (_) {
    tags = []
  }

  const sections: any[] = lia.sections ? Array.from(lia.sections) : []
  const s = sections.map((sec: any) => [
    inlineToText(sec.title).trim(),
    markdownToText(sec.code || ''),
    sec.indentation ?? 1,
  ])

  return { t: courseTitle, g: tags, i: image, u: baseUrl, s }
}

function meta(json: any) {
  const title = (
    json.meta?.title ||
    cleanHTML(json.title) ||
    'LiaScript Course Index'
  ).trim()

  let metaData = `<meta property="og:type" content="website">
<meta property="og:title" content="${title}">
<meta name="twitter:title" content="${title}">
`

  const description = (
    json.meta?.description ||
    cleanHTML(json.comment) ||
    ''
  ).trim()

  if (description) {
    metaData += `<meta name="description" content="${description}">
<meta property="og:description" content="${description}">
<meta name="twitter:description" content="${description}">
`
  }

  const image = (json.meta?.image || json.logo || '').trim()

  if (image) {
    metaData += `<meta property="og:image" content="${image}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${image}">
`
  }

  return metaData
}

function overwrite(check, defaultsTo) {
  return check === null ? null : check || defaultsTo
}

function hash(url: string) {
  const value = url
    .split('')
    .map((v) => v.charCodeAt(0))
    .reduce((a, v) => (a + ((a << 7) + (a << 3))) ^ v)
    .toString(16)

  return value.startsWith('-') ? '0' + value.slice(1) : value
}

function toLinkCard(
  argument: any,
  course: any,
  small: boolean = false,
): string {
  if (course.arguments) {
    argument = course.arguments.reduce((a, b) => {
      return { ...a, ...b }
    }, argument)
  }

  let tags = []

  const tagList = course.tags || tags
  for (let i = 0; i < tagList.length; i++) {
    Categories.add(tagList[i].toLowerCase())
  }

  let comment = course.title ? course.comment : course.comment || course.link

  return card(
    small,
    '',
    course.title || '',
    comment || '',
    tagList,
    {},
    course.logo,
    course.link,
  )
}

async function toCard(
  argument: any,
  course: any,
  small: boolean = false,
): Promise<{ html: string; json: any; searchEntry: any | null }> {
  // if other parameters are defined for a specific course
  // then they are treated

  if (course.arguments) {
    argument = course.arguments.reduce((a, b) => {
      return { ...a, ...b }
    }, argument)
  }

  let tags
  try {
    tags = course.data.lia.definition.macro.tags
      .split(',')
      .map((e: string) => e.trim())
  } catch (e) {
    tags = []
  }

  const backupOutput = hash(course.data.lia.readme)

  const tagList = course.tags || tags
  for (let i = 0; i < tagList.length; i++) {
    Categories.add(tagList[i].toLowerCase())
  }

  let downloads = {}

  if (argument['project-generate-pdf'])
    downloads['pdf'] = 'assets/pdf/' + backupOutput + '.pdf'
  if (argument['project-generate-ims'])
    downloads['ims'] = 'assets/ims/' + backupOutput + '.zip'
  if (argument['project-generate-scorm12'])
    downloads['scorm12'] = 'assets/scorm12/' + backupOutput + '.zip'
  if (argument['project-generate-scorm2004'])
    downloads['scorm2004'] = 'assets/scorm2004/' + backupOutput + '.zip'

  if (argument['project-generate-pdf']) {
    argument.input = course.data.lia.readme
    argument.output = backupOutput

    const file = argument.output + '.pdf'

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), 'assets/pdf/' + file))
    ) {
      console.log('using cached file of ', argument.input, ' -> ', file)
    } else {
      console.log('generate pdf of', argument.input, ' -> ', file)

      await PDF.exporter(argument, {})

      if (fs.existsSync(file)) {
        await moveFile(file, 'assets/pdf/' + file)
      }
    }
  }

  let repo
  if (
    argument['project-generate-ims'] ||
    argument['project-generate-scorm12'] ||
    argument['project-generate-scorm2004'] ||
    argument['project-generate-android']
  ) {
    repo = helper.getRepository(course.url)

    if (repo) {
      execSync(repo.cmd)
      argument.input = path.join('tmp', repo.path)
      argument.path = 'tmp'
      argument.readme = path.join('./', repo.path)

      argument.output = backupOutput

      execSync('rm -rf tmp/.git')
      execSync('rm -rf tmp/.github')
      execSync('rm -rf tmp/.gitignore')
    }
  }

  // IMS
  if (repo && argument['project-generate-ims']) {
    argument.output = 'assets/ims/' + backupOutput
    const file = argument.output + '.zip'

    try {
      execSync('mkdir assets/ims')
    } catch (e) {}

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), file))
    ) {
      console.log('using cached file of ', argument.input, ' -> ', file)
    } else {
      await IMS.exporter(argument, course.data)
    }
  }

  // SCORM12
  if (repo && argument['project-generate-scorm12']) {
    argument.output = 'assets/scrom12/' + backupOutput
    const asset = argument.output + '.zip'

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), asset))
    ) {
      console.log('using cached file of ', argument.input, ' -> ', asset)
    } else {
      await SCORM12.exporter(argument, course.data)
    }
  }

  // SCORM2004
  if (repo && argument['project-generate-scorm2004']) {
    argument.output = 'assets/scorm2004/' + backupOutput

    const asset = argument.output + '.zip'

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), asset))
    ) {
      console.log('using cached file of ', argument.input, ' -> ', asset)
    } else {
      await SCORM2004.exporter(argument, course.data)
    }
  }

  // Android
  if (repo && argument['project-generate-android']) {
    argument.output = backupOutput
    const file = argument.output + '.apk'

    const asset = 'assets/android/' + file

    if (
      argument['project-generate-cache'] &&
      fs.existsSync(path.join(process.cwd(), asset))
    ) {
      downloads['apk'] = asset
    } else {
      await ANDROID.exporter(argument, course.data)

      if (fs.existsSync(file)) {
        await moveFile(file, asset)
        downloads['apk'] = asset
      }
    }
  }

  // clean up
  if (repo) {
    execSync('rm -rf tmp')
  }

  argument['rdf-url'] = course.data.lia.readme

  const rslt = {
    html: card(
      small,
      course.data.lia.readme,
      overwrite(course.title, course.data.lia.str_title),
      overwrite(course.comment, course.data.lia.comment),
      tagList,
      downloads,
      overwrite(course.logo, course.data.lia.definition.logo),
    ),
    json: await RDF.parse(argument, course.data),
    searchEntry: buildCourseSearchEntry(course),
  }

  return rslt
}

function card(
  small: boolean,
  url: string,
  title: string,
  comment: string,
  tags: string[],
  download: {
    pdf?: string
    scorm12?: string
    scorm2004?: string
    ims?: string
    apk?: string
  },
  img_url?: string,
  link?: string,
): string {
  let image = ''
  if (img_url) {
    if (!(img_url.startsWith('http:') || img_url.startsWith('https:'))) {
      const fullImageUrl = new URL(img_url, url)

      img_url = fullImageUrl.toString()
    }

    image =
      //`<img src="${img_url}" class="card-img-top" alt="">`
      `<div class="card-img-top" style="background-size: cover; height: 175px; background-image: url('${img_url}'); background-position: center center; background-repeat: no-repeat;"></div>`
  }
  /*
  else {
    image = `<svg class="bd-placeholder-img card-img-top" width="100%" height="175" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Placeholder: Thumbnail" preserveAspectRatio="xMidYMid slice" focusable="false"><title>Placeholder</title><rect width="100%" height="100%" fill="${stringToColor(
  title
  )}"></rect></svg>`
  }
  */

  let tag_list = ''

  if (tags.length > 0) {
    for (let i = 0; i < tags.length; i++) {
      tag_list += `<span style="display: inline; white-space: break-spaces;" class="badge rounded-pill bg-light text-dark">${tags[i]}</span>`
    }

    tag_list = `<p>${tag_list}</p>`
  }

  if (small && comment) {
    comment = '<small>' + comment + '</small>'
  }

  let footer = ''

  if (Object.keys(download).length > 0) {
    footer = `<div class="card-footer">
    <div class="dropdown">
    <a class="btn btn-secondary btn-sm dropdown-toggle" href="#" role="button" id="dropdownMenuLink" data-bs-toggle="dropdown" aria-expanded="false">
      Download as ...
    </a>
  
    <ul class="dropdown-menu" aria-labelledby="dropdownMenuLink" style="">
      ${
        download.pdf
          ? '<li><a class="dropdown-item btn-sm" target="_blank" href="' +
            download.pdf +
            '">PDF</a></li>'
          : ''
      }
        ${
          download.scorm12
            ? '<li><a class="dropdown-item btn-sm" href="' +
              download.scorm12 +
              '">SCORM 1.2</a></li>'
            : ''
        }
          ${
            download.scorm2004
              ? '<li><a class="dropdown-item btn-sm" href="' +
                download.scorm2004 +
                '">SCORM 2004</a></li>'
              : ''
          }
      ${
        download.ims
          ? '<li><a class="dropdown-item btn-sm" href="' +
            download.ims +
            '">IMS Content Packaging</a></li>'
          : ''
      }
          ${
            download.apk
              ? '<li><a class="dropdown-item btn-sm" href="' +
                download.apk +
                '">Android APK</a></li>'
              : ''
          }
      </ul>
      </div>
      </div>
      `
  }

  return `<div class="card shadow-sm m-1" style="height: 100%" data-category="${tags
    .map((e) => e.toLowerCase())
    .join('|')}">
      ${image}
      <div class="card-body" style="transform: rotate(0);">
      <a href="${link ? '' : 'https://liascript.github.io/course/?'}${
        link || url
      }" target="${
        link && !link.startsWith('http') ? '_self' : '_blank'
      }" class="link-dark stretched-link">
            <h${small ? 6 : 5} class="card-title">${title}</h${small ? 6 : 5}>
        </a>
        <p class="card-text">${comment}</p>
        ${tag_list}
    </div>
    ${footer}
    </div>`
}

function stringToColor(str: string) {
  var hash = 0
  for (var i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  var color = '#'
  for (var i = 0; i < 3; i++) {
    var value = (hash >> (i * 8)) & 0xff
    color += ('00' + value.toString(16)).substr(-2)
  }
  return color
}
