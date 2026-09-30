import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const key = env.VITE_REVENUECAT_ANDROID_KEY ?? '';
  const testStore = env.VITE_PREMIUM_TEST_STORE === 'true';
  const premiumEnabled = mode === 'android' && env.VITE_PREMIUM_ENABLED === 'true';
  if (
    premiumEnabled &&
    key &&
    !(key.startsWith('goog_') || (testStore && key.startsWith('test_')))
  ) {
    throw new Error(
      'Use a RevenueCat public Android SDK key; Test Store requires explicit local debug opt-in.',
    );
  }
  return {
    define: {
      'import.meta.env.VITE_PREMIUM_ENABLED': JSON.stringify(premiumEnabled ? 'true' : 'false'),
      'import.meta.env.VITE_REVENUECAT_ANDROID_KEY': JSON.stringify(premiumEnabled ? key : ''),
      'import.meta.env.VITE_PREMIUM_TEST_STORE': JSON.stringify(
        premiumEnabled && testStore ? 'true' : 'false',
      ),
    },
    base: mode === 'android' ? './' : '/',
    build: mode === 'android' ? { outDir: '.mobile-build', reportCompressedSize: false } : {},
    plugins:
      mode === 'android'
        ? [
            {
              name: 'issen-offline-fonts',
              generateBundle() {
                this.emitFile({
                  type: 'asset',
                  fileName: 'licenses/Shippori-Mincho-B1-OFL.txt',
                  source: readFileSync(
                    new URL(
                      './node_modules/@fontsource/shippori-mincho-b1/LICENSE',
                      import.meta.url,
                    ),
                    'utf8',
                  ),
                });
              },
              transformIndexHtml: {
                order: 'pre',
                handler(html) {
                  return html
                    .replace(/\s*<link\b[^>]*href="https:\/\/fonts\.[^"]*"[^>]*\/>/g, '')
                    .replace(
                      '</head>',
                      '  <link rel="stylesheet" href="/src/styles/mobile-fonts.css" />\n  </head>',
                    );
                },
              },
            },
          ]
        : [],
  };
});
