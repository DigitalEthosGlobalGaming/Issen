import { defineConfig } from '@playwright/test';

const base = process.env.ISSEN_PAGES_BASE ?? '/Issen/develop/';
const outDir = process.env.ISSEN_PREVIEW_DIR ?? '.verification-build-pages';

export default defineConfig({
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
