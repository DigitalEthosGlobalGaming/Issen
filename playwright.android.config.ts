import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/android',
  workers: 2,
  use: {
    baseURL: 'http://127.0.0.1:4175',
    channel: 'msedge',
    viewport: { width: 412, height: 915 },
    hasTouch: true,
  },
  webServer: {
    command: 'vite preview --outDir .mobile-build --host 127.0.0.1 --port 4175 --strictPort',
    url: 'http://127.0.0.1:4175',
    reuseExistingServer: false,
  },
});
