import { defineConfig } from '@playwright/test';

process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ??= 'tmp/playwright-report/browser';
process.env.PLAYWRIGHT_BLOB_OUTPUT_DIR ??= 'tmp/blob-report/browser';

export default defineConfig({
  outputDir: './tmp/test-results/browser',
  testDir: './tests/browser',
  // Keep local feedback quick without overloading the timing-sensitive game tests.
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:5173',
    channel: 'msedge',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:5173',
    reuseExistingServer: true,
  },
});
