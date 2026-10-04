import { chromium } from '@playwright/test';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { stripTypeScriptTypes } from 'node:module';
const origin = process.argv[2] || 'http://127.0.0.1:5197';
const original = process.argv[3] || 'tests/fixtures/film-glitch-reference.ts';
const output = process.argv[4] || 'tmp/performance/legacy/film-pixels.json';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const page = await browser.newPage();
  await page.route('**/__film-original.js', async (route) =>
    route.fulfill({
      contentType: 'text/javascript',
      body: stripTypeScriptTypes(await readFile(original, 'utf8')),
    }),
  );
  await page.goto(`${origin}/privacy/index.html`);
  const results = await page.evaluate(async () => {
    const [{ applyFilm: before }, { applyFilm: after }] = await Promise.all([
      import('/__film-original.js'),
      import('/src/rendering/effects/film.ts'),
    ]);
    const results = [];
    for (const [w, h] of [
      [390, 844],
      [844, 390],
      [333, 197],
    ])
      for (const dpr of [1, 1.25, 2])
        for (const shifted of [false, true])
          for (const transparent of [false, true])
            for (const preference of [{}, { reducedMotion: true }, { reducedFlashes: true }]) {
              const canvases = [document.createElement('canvas'), document.createElement('canvas')];
              for (const [i, c] of canvases.entries()) {
                c.width = Math.round(w * dpr);
                c.height = Math.round(h * dpr);
                const g = c.getContext('2d');
                g.scale(dpr, dpr);
                g.fillStyle = transparent ? 'rgba(40,100,190,.45)' : 'rgb(40,100,190)';
                g.fillRect(0, 0, w, h);
                for (let j = 0; j < 90; j++) {
                  g.fillStyle = `rgba(${(j * 47) % 255},${(j * 91) % 255},${(j * 13) % 255},.7)`;
                  g.fillRect((j * 41) % w, (j * 53) % h, 43, 67);
                }
                g.globalAlpha = transparent ? 0.7 : 1;
                if (shifted) g.translate(0.3, 0.5);
                (i ? after : before)(g, w, h, c, 'trial-glitch', 1.23, preference);
              }
              const [a, b] = canvases.map(
                (c) => c.getContext('2d').getImageData(0, 0, c.width, c.height).data,
              );
              let different = 0,
                max = 0,
                total = 0;
              for (let i = 0; i < a.length; i++) {
                const d = Math.abs(a[i] - b[i]);
                if (d) different++;
                max = Math.max(max, d);
                total += d;
              }
              results.push({
                w,
                h,
                dpr,
                shifted,
                transparent,
                preference,
                differentChannels: different,
                maxDifference: max,
                meanDifference: total / a.length,
              });
            }
    return results;
  });
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify(results, null, 2));
  console.log(
    JSON.stringify(
      {
        cases: results.length,
        exact: results.filter((r) => !r.differentChannels).length,
        worst: results.sort((a, b) => b.meanDifference - a.meanDifference).slice(0, 5),
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
