import { defineConfig } from '@playwright/test'

/*
 * End-to-end tests. The `cli` project spawns `dist/index.js` (run `npm run
 * build` first); only its render checks open a browser.
 *
 *   npm run test:cli             PR tier
 *   DEEP=1 npm run test:cli      nightly tier: + xmllint and epubcheck
 *
 * The `server` project starts `dist/index.js serve` and exports through its
 * HTTP API (NETWORK=1 adds the git import).
 *
 * The `webapp` project serves `dist/webapp/build` (run `npm run webapp:build`
 * first) and exports through its UI (NETWORK=1 adds the GitHub import).
 */
export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  // SCORM, epub, docx and pdf exports each launch their own Chrome
  workers: 2,
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  // An export plus a full slide walk of the player
  timeout: 5 * 60_000,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    browserName: 'chromium',
    headless: true,
  },
  projects: [
    {
      name: 'cli',
      testMatch: 'cli.spec.ts',
    },
    {
      name: 'server',
      testMatch: 'server.spec.ts',
    },
    {
      name: 'webapp',
      testMatch: 'webapp.spec.ts',
    },
  ],
})
