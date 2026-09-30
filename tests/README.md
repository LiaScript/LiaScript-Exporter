# Tests

The exporter is tested by exporting one test course in every format, with every
method (CLI, server, web app), and checking the **output**. The desktop app gets
a smaller smoke test (see below). A successful exit
code is not enough on its own: earlier bugs produced SCORM packages without the
course, docx files with orphaned media and epubs with empty chapters, and the
exporter still exited 0.

## Running

```sh
npm run test:all          # build CLI + web app, type check, unit tests, all e2e suites (Chromium)
npm run test:all:deep     # the same, plus epubcheck and the SCORM/IMS XSDs
```

A normal run takes the two builds plus about 5 minutes of e2e tests. The deep run also downloads epubcheck on
its first run. It needs Java, and `xmllint` (`libxml2-utils` on Debian/Ubuntu).

Single suites (build first, see below):

| Command | What it runs | Needs |
|---|---|---|
| `npm run test:unit` | Vitest: checkers and form options → CLI flags | – |
| `npm run test:types` | `tsc` over `tests/` | – |
| `npm run test:cli[:deep]` | every format through `dist/index.js` | `npm run build` |
| `npm run test:server` | every format through `serve` + `POST /api/export` | `npm run build` |
| `npm run test:webapp[:deep]` | every format through the browser web app UI | `npm run webapp:build` |
| `npm run test:webapp:browsers` | the web app suite in Firefox and WebKit | `npm run webapp:build`, `npx playwright install firefox webkit` |
| `npm run test:desktop` | the Electron app: startup, update banner, json + docx through its window | `npm run build`, a display (or `xvfb-run -a`) |

The e2e suites test the built output, so rebuild after changing `src/`
(`npm run test:build` rebuilds both). A stale `dist/` gives misleading results.

Pick single tests with `-g`, for example `npm run test:cli -- -g "docx|epub"`.
The ` › ` separator in the test titles does not match with `-g`, so filter on
single words.

### Other browsers

The web app runs its exporters in the user's browser, so its suite also runs
in Firefox and WebKit (`test:webapp:browsers`, not part of `test:all`). Only
Chromium can save a PDF from a test, so there the pdf case checks the print
view's text instead of a PDF.

### Desktop app

The desktop app is the export server and its UI in an Electron window, so the
server suite already covers every format. `desktop.spec.ts` (not part of
`test:all`) tests only what the app does differently: the native file dialog,
the Electron-only paths to the CLI and presets, the CLI run by the Electron
binary starting Chrome, Electron's downloads and the update banner. The file
dialog, `shell.openExternal` and the update check are stubbed in the main
process.

By default it runs `electron/main.js` from the sources. To test the packaged
app, which is where path bugs show up, build it first:

```sh
npm run electron:pack
DESKTOP_APP=release/linux-unpacked/liascript-exporter xvfb-run -a npm run test:desktop
```

### Environment variables

| Variable | Effect |
|---|---|
| `DEEP=1` | deep checks: epubcheck and XSD validation (CLI and web app) |
| `NETWORK=1` | adds the network course and the tests that import a course from GitHub |
| `GIT_URL`, `GIT_BRANCH`, `GIT_SUBDIR` | a different repository for those tests (default: `LiaPlayground/Quiz-Demo`) |
| `DESKTOP_APP` | the packaged executable for `test:desktop` instead of `electron/main.js` |
| `EPUBCHECK_JAR` | use this epubcheck jar instead of the one in `tests/.cache` |

## Layout

```
tests/
├── fixtures/
│   ├── course/        the test course (README.md + local images, media, a hidden file)
│   ├── course.ts      what each format must keep of it: markers, counts, known gaps
│   ├── network/       a second course with remote content
│   └── network.ts     its expected sections and known gaps
├── checkers/          one checker per format, shared by every suite
├── e2e/               Playwright: cli.spec.ts, server.spec.ts, webapp.spec.ts, desktop.spec.ts
├── unit/              Vitest
└── scripts/           setup.ts (epubcheck download), check-output.ts
```

### The test course

Every element in `fixtures/course/README.md` carries a unique marker word such
as `MKQuizSingle`. The main check is whether each marker appears in the output.
New markers are picked up automatically, because they are read from the README.
`fixtures/course.ts` lists only the exceptions:

- `NEVER_RENDERED`: markers that must not appear, such as a comment or an `alert()`.
- `RENDERED_AS`: markers whose output differs from the source, for example `MKScriptResult` becomes `MKScriptResult42`.
- `KNOWN_GAPS`: markers a format cannot keep, each with a reason and usually a `fallback` text that must appear in its place.

The course also contains the cases behind earlier bugs: formulas, charts, ASCII
figures, an SVG with `--` in a comment, quotes, local audio/video, and a
`.hidden/secret.txt` that must never be shipped.

### The network course

`fixtures/network/README.md` holds content that needs the internet: remote
images, a YouTube video, an embedded page, an imported template and a Chartist
chart. The CLI and web app suites export it as epub, docx, pdf, web and json, only
with `NETWORK=1`. Its markers start with `MKNet`.

### Checkers

`checkOutput(format, path, { method, deep })` in `checkers/index.ts` returns the
problems it found. Examples of what each checker covers:

- **scorm1.2 / scorm2004 / ims**: the manifest, the course inside the package, no hidden files, and the XSDs (deep).
- **web / xapi**: `render.ts` opens the player and clicks through every slide.
- **epub**: markers, no empty chapters, no `file:`/`blob:`/base64 leaks, and epubcheck (deep).
- **docx**: markers, no orphaned media, the document title.
- **pdf**: page text through pdfjs.
- **json / fullJson / rdf**: structure and course content.

The server suite runs the checkers without `deep`: the server runs the same CLI,
so the deep checks would only repeat those.

To check a file by hand, for example a download from the web app:

```sh
npm run test:check -- epub path/to/course.epub --deep --method webapp
npm run test:check -- web path/to/web-dir --render
npm run test:check -- pdf path/to/course.pdf --network   # against the network course
```

## When a test fails

- **A marker is missing in one format:** fix the exporter if you can. If the format really cannot keep it, add a `KNOWN_GAPS` entry with a reason and a `fallback`. The list only shrinks by fixing exporters. Never add a gap to get a test to pass.
- **A known exporter bug you can't fix yet:** give the case in `cli.spec.ts` or `webapp.spec.ts` a `bug` (or `deepBug` for the deep tier only). The test is then expected to fail. When the fix lands it turns red ("expected to fail, but passed"); delete the `bug` then.
- **Leftover temp folders:** each CLI export runs with its own `TMPDIR` and fails if anything is left in it. The server suite starts its servers with their own `TMPDIR`, and its `cleanup` tests check for leftovers there.

## Gotchas

- Keep `TMPDIR` paths short. Chrome creates a unix socket there, and a path over 108 characters makes Chrome fail to start with "Target closed".
- Exports that launch Chrome (docx, epub, pdf, SCORM) run the CLI `detached`, and the tests kill the whole process group. Otherwise a timed-out run leaves Chrome running.
- The web app allows one export at a time (IndexedDB), so every web app test uses a fresh browser context.
