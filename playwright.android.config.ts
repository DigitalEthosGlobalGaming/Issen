import { defineConfig } from '@playwright/test';

process.env.PLAYWRIGHT_HTML_OUTPUT_DIR ??= 'tmp/playwright-report/android';
process.env.PLAYWRIGHT_BLOB_OUTPUT_DIR ??= 'tmp/blob-report/android';

export default defineConfig({
  outputDir: './tmp/test-results/android',
  testDir: './tests/android',
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    channel: 'msedge',
    viewport: { width: 412, height: 915 },
    hasTouch: true,
  },
  webServer: {
    command: `vite preview --outDir ${JSON.stringify(process.env.ISSEN_ANDROID_BUILD_DIR ?? '.mobile-build')} --host 127.0.0.1 --port 4175 --strictPort`,
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
});
