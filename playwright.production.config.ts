import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/production',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    channel: 'msedge',
    viewport: { width: 390, height: 844 },
  },
  webServer: {
    command:
      'npm run preview -- --host 127.0.0.1 --port 4173 --strictPort' +
      (process.env.ISSEN_PREVIEW_DIR ? ` --outDir "${process.env.ISSEN_PREVIEW_DIR}"` : ''),
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: false,
  },
});
