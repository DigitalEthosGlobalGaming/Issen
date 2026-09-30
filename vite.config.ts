import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';

export default defineConfig(({ mode }) => ({
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
                  new URL('./node_modules/@fontsource/shippori-mincho-b1/LICENSE', import.meta.url),
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
}));
