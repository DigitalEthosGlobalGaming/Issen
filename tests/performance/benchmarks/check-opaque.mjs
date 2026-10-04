// Experimental alpha:false comparison; does not alter production source.
import { chromium } from '@playwright/test';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
const origin = process.argv[2] || 'http://127.0.0.1:5197';
const output = process.argv[3] || 'tmp/performance/legacy/opaque-pixels.json';
const browser = await chromium.launch({ channel: 'msedge', headless: true });
try {
  const rows = [];
  for (const opaque of [false, true]) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    const page = await context.newPage();
    await page.route('https://fonts.googleapis.com/**', (r) =>
      r.fulfill({ body: '', contentType: 'text/css' }),
    );
    await page.addInitScript(() => {
      let seed = 42;
      Math.random = () => {
        seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
        return seed / 4294967296;
      };
    });
    await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
      const response = await route.fetch();
      let body = await response.text();
      if (opaque)
        body = body.replace(
          'canvas.getContext("2d")',
          "canvas.getContext('2d',canvas.id==='c'?{alpha:false}:undefined)",
        );
      body = body.replace(
        'if (pageActive()) frameLoop.start();',
        `window.__opaque={async draw(name){
    time=3; shake=name==='shake'?25:0; zoom=name==='zoom'?1.12:1; zoomX=W/2; zoomY=H/2;
    flashA=name==='flash'?.2:0; EQ.film=name==='glitch'?'trial-glitch':name==='inferno'?'trial-inferno':'mono';
    if(name==='transition'){setStage(2);await environmentRenderer.prepare(G.stage);stageFade=.5;}
    render(1/60);
   }};`,
      );
      await route.fulfill({ response, body });
    });
    await page.goto(origin);
    await page.waitForFunction(() => !!window.__opaque);
    for (const name of ['normal', 'shake', 'zoom', 'flash', 'glitch', 'inferno', 'transition']) {
      await page.evaluate((n) => window.__opaque.draw(n), name);
      rows.push(
        await page.evaluate(
          async ({ name, opaque }) => {
            const c = document.querySelector('#c'),
              g = c.getContext('2d'),
              data = g.getImageData(0, 0, c.width, c.height).data;
            let transparentPixels = 0;
            for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) transparentPixels++;
            const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', data)))
              .map((v) => v.toString(16).padStart(2, '0'))
              .join('');
            return { name, opaque, alpha: g.getContextAttributes().alpha, transparentPixels, hash };
          },
          { name, opaque },
        ),
      );
    }
    await context.close();
  }
  const comparisons = rows.slice(0, 7).map((row, i) => ({
    name: row.name,
    equalPixels: row.hash === rows[i + 7].hash,
    transparentPixels: row.transparentPixels,
  }));
  await mkdir(dirname(output), { recursive: true });
  await writeFile(output, JSON.stringify({ rows, comparisons }, null, 2));
  console.log(comparisons);
} finally {
  await browser.close();
}
