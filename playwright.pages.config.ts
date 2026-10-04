import { defineConfig } from '@playwright/test';

process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ??= 'tmp/playwright-report/pages';
process.env.PLAYWRIGHT_BLOB_OUTPUT_DIR ??= 'tmp/blob-report/pages';

const base = process.env.ISSEN_PAGES_BASE ?? '/Issen/develop/';
const outDir = process.env.ISSEN_PREVIEW_DIR ?? 'tmp/.verification-build-pages';

export default defineConfig({
  outputDir: './tmp/test-results/pages',
  testDir: './tests/pages',
  workers: 2,
  use: {
    baseURL: `http://127.0.0.1:4175${base}`,
    channel: 'msedge',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: `npm run preview -- --host 127.0.0.1 --port 4175 --strictPort --base "${base}" --outDir "${outDir}"`,
    url: `http://127.0.0.1:4175${base}`,
    reuseExistingServer: false,
  },
});
