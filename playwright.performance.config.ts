import { defineConfig } from '@playwright/test';
import base from './playwright.config';
const production = process.env.ISSEN_PROFILE_PRODUCTION === '1';
const port = production ? 4197 : 5198;

// Dedicated server/output: never reuse another checkout's running application.
export default defineConfig(base, {
  testDir: production ? './tests/production' : './tests/browser',
  outputDir: `tmp/performance/regression/${production ? 'production' : 'browser'}-tests`,
  use: { ...base.use, baseURL: `http://127.0.0.1:${port}` },
  webServer: {
    command: production
      ? `npm run preview -- --host 127.0.0.1 --port ${port} --strictPort --outDir tmp/.verification-build-performance-production`
      : `npm run dev -- --host 127.0.0.1 --port ${port} --strictPort`,
    url: `http://127.0.0.1:${port}`,
    reuseExistingServer: false,
  },
});
