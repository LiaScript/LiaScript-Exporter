# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A generic exporter that converts LiaScript courses (Markdown, parsed via an
embedded Elm worker) into other formats/packages: SCORM 1.2, SCORM 2004, IMS,
xAPI, H5P, Web, PDF, ePub, DOCX, Android (APK), RDF/JSON-LD, and multi-course
"project" bundles. Usable as a CLI (`liaex`/`liascript-exporter`), a local web
UI (`liaex serve`), an Electron desktop app, or a GitHub Action (`action.yml`).

## Build commands

- `npm run build` — the fast, everyday build: Parcel-bundles `src/index.ts` to
  `dist/index.js`, adds the shebang, copies `src/server/public` and
  `presets.yaml` into `dist`. Use this after editing TypeScript source.
- `npm run build:all` — full asset pipeline: rebuilds the bundled LiaScript
  runtime for every target (scorm1.2, scorm2004, xapi, web, indexeddb, pdf,
  capacitor) from the `LiaScript` submodule, deduplicates them, then runs
  `build` and minifies. Slow (checks out different branches inside
  `LiaScript/`, reinstalls its deps repeatedly). Only needed when the embedded
  LiaScript runtime assets themselves need refreshing, not for changes to this
  repo's own `src/`.
- `npm run watch` — Parcel serve/watch mode for iterative development.
- `npm run build:debug` — unminified debug build with verbose Parcel logging.
- There is no lint script. Tests: `npm run test:unit` (vitest, `tests/unit`),
  `npm run test:types`, and Playwright e2e suites (`npm run test:cli`,
  `test:server`, `test:webapp`, which run every format against
  `tests/fixtures/course` and its checker in `tests/checkers`). Real LMS
  instances for manual/e2e checks live in `docker/lms` (`lms.sh`). Also verify
  changes by building and running the CLI against a real course, e.g.:
  `node dist/index.js -i path/to/README.md -f pdf --pdf-preview` (or `-f epub`,
  `-f scorm2004`, etc.) — compare against `liaex --help` / the README's format
  reference for the right flags. `-f project --project-search` exercises the
  multi-course path.

## Submodule

`LiaScript/` is a git submodule (the LiaScript Elm/JS runtime itself). The
exporter's core parsing (`src/exporter.ts`) loads
`LiaScript/src/elm/Worker.elm` directly via Parcel's Elm transformer — this
repo does not work correctly if the submodule isn't checked out
(`git submodule update --init`). The `asset:*` build scripts `cd LiaScript`,
switch it to specific branches (`feat/fullPage` for PDF, `feat/capacitor8` for
Capacitor/Android), rebuild, copy `dist` out, then switch back to
`development` — this is why those scripts are slow and mutate submodule state;
don't run them casually.

## Architecture

**Pipeline: Elm parses, TypeScript exports.** `src/exporter.ts`'s `Exporter`
class boots the Elm `Worker` and wires it up via three ports:
- `helper` (Elm → JS): the worker asks JS to read files (e.g. `!?[]()`
  includes) relative to the input's directory.
- `input` (JS → Elm): feeds raw Markdown/YAML in, tagged with the desired
  internal format.
- `output` (Elm → JS): receives parsed course JSON, which is then routed to
  the matching exporter module in `src/export/` by `argument.format`.

Every module in `src/export/*.ts` (except `helper.ts`, `presets.ts`) follows
the same shape: `export const format = '<name>'` and
`export async function exporter(argument, json)`. `handleExportOutput` in
`exporter.ts` is the dispatch table — adding a new export target means adding
a module with this shape and wiring it into that switch plus
`determineInternalFormat`.

**Project (multi-course) exports** (`src/export/project.ts`) are the odd one
out: instead of one parse pass, `Exporter.handleProjectInput` reads a
`project.yaml`/collection file, then feeds each referenced course's Markdown
through the *same* Elm worker one at a time (`PROJECT.getNext` /
`PROJECT.storeNext` track progress), only calling `PROJECT.exporter` once
every sub-course has been parsed. Each sub-course is then hand fed back into
`handleExportOutput`-style export code inside `project.ts` for whichever
formats were requested (`--project-generate-pdf`, `--project-generate-epub`,
`--project-generate-scorm12`, etc.), writing results under `assets/<format>/`.
Relative asset paths embedded in a course's `lia.definition` (e.g. `logo`)
need to be resolved against that course's own base URL/README location before
being handed to format-specific tooling — see `rdf.ts`'s `new URL(logo,
baseURL)` pattern; don't assume they're already absolute.

**PDF and ePub** (`src/export/pdf.ts`, `src/export/epub.ts`) don't reuse the
Elm-parsed JSON for rendering — they launch Puppeteer, navigate it to the
bundled LiaScript web runtime (`dist/assets/pdf/index.html`) pointed at the
course, wait for the app's own render-complete signal, then either print to
PDF or scrape the rendered DOM (images, code blocks, SVGs, ABC notation,
embeds, math, charts) to assemble an EPUB via `@lesjoursfr/html-to-epub`. This
is why relative URLs generally resolve fine inside these two (the browser
handles them against the page's base URL) except where a raw path is pulled
out of `json.lia.definition` and handed directly to non-browser tooling (e.g.
epub cover images) — those need explicit URL resolution.

**`src/gitExport.ts`** clones a git/GitHub repo to a temp dir (`--git-url`)
and resolves it back into a normal local-file `argument.input`/`--path` so
the rest of the pipeline doesn't need to know the input came from git; the
clone is removed via a `process.on('exit', cleanup)` hook.

**`src/server/`** is the Fastify-based web UI/API (`liaex serve` /
`npm run electron:dev`): `server.ts` sets up routes/static file serving,
`routes/export.ts` accepts uploads or git URLs and enqueues jobs,
`queue/jobQueue.ts` runs exports one at a time in the background, and
`public/` is the plain JS/HTML/CSS frontend (no framework/bundler for the
frontend itself — it's copied to `dist/server/public` verbatim by
`scripts/copy-files.js`).

**`electron/`** wraps the same server (`server-wrapper.js` boots
`src/server`) in an Electron shell (`main.js`/`preload.js`) for the desktop
app builds (`electron-builder.json`, `npm run electron:build*`).

**H5P** (`src/export/h5p.ts`) ships the LiaScript runtime
(`dist/assets/h5p`, built from `LiaScript/src/entry/h5p` by `asset:h5p`) as
an H5P library `H5P.LiaScript`, whose wrapper (`src/export/h5p-library`,
copied to `dist/assets/h5p-library` by `npm run build`) writes the runtime
into an iframe via `document.write` + `history.replaceState` (H5P allows no
.html files). State and results go through the suspend engine of
`LiaScript/src/typescript/connectors/SCORMSuspend` with a virtual LMS
(`connectors/H5P/adapter.ts`). Raise `WRAPPER_REVISION` in `h5p.ts` with
every wrapper change: platforms only replace a library with a higher patch
version (max. five digits).

**Presets** (`src/export/presets.ts`, `src/presets.yaml`) bundle a format plus
recommended flags for specific LMS targets (Moodle, ILIAS, OPAL, SCORM Cloud,
OpenOlat, Open edX, LearnWorlds) so users don't need to hand-tune
`--scorm-*`/etc. flags per platform.

**`action.yml`** exposes this exporter as a GitHub Action, mapping its inputs
onto the same CLI flags used elsewhere in the repo.
