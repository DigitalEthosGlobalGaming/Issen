import { defineConfig } from '@playwright/test';

process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ??= 'tmp/playwright-report/production';
process.env.PLAYWRIGHT_BLOB_OUTPUT_DIR ??= 'tmp/blob-report/production';

const outDir = process.env.ISSEN_PREVIEW_DIR ?? 'tmp/.verification-build-production';

export default defineConfig({
  outputDir: './tmp/test-results/production',
  testDir: './tests/production',
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'msedge',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command:
      'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort' + ` --outDir "${outDir}"`,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
