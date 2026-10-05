import { defineConfig } from '@playwright/test';
import base from './playwright.config';

/** Dedicated worktree server: never accidentally test another agent's develop checkout. */
export default defineConfig({
  ...base,
  outputDir: './tmp/test-results/rendering-v2',
  use: { ...base.use, baseURL: 'http://127.0.0.1:5194' },
  webServer: {
    command: 'npm run dev -- --host 127.0.0.1 --port 5194 --strictPort',
    url: 'http://127.0.0.1:5194',
    reuseExistingServer: false,
  },
});
