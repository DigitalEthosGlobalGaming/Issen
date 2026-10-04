import fs from 'node:fs/promises';
import path from 'node:path';
import { preview } from 'vite';
import { chromium } from 'playwright';

const [folder, output] = process.argv.slice(2);
const manifest = JSON.parse(await fs.readFile(path.join(folder, 'manifest.json'), 'utf8'));
const server = await preview({
  configFile: false,
  build: { outDir: path.resolve(folder, 'build') },
  preview: { host: '127.0.0.1', port: 5299, strictPort: true },
});
let browser;
const samples = [];
try {
  browser = await chromium.launch({ channel: 'msedge', headless: true });
  for (let repetition = 1; repetition <= 5; repetition++) {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
    });
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto('http://127.0.0.1:5299/?scenario=stats&seed=424242');
      await page.waitForFunction(() => window.__profile?.schemaVersion === 1);
      if ((await page.evaluate(() => window.__profile.buildId)) !== manifest.sourceFingerprint)
        throw Error('Saved build does not match its manifest');
      await page.evaluate(() => window.__profile.openPanel('stats'));
      await page.waitForTimeout(1000);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Performance.enable');
      const before = await page.evaluate(() => ({
        canvases: window.__probe.canvases.length,
        scene: window.__profile.state(),
      }));
      const a = await cdp.send('Performance.getMetrics');
      for (let event = 0; event < 5; event++) {
        await page.evaluate(() => window.dispatchEvent(new Event('resize')));
        await page.waitForTimeout(650);
      }
      const b = await cdp.send('Performance.getMetrics');
      const after = await page.evaluate(() => ({
        canvases: window.__probe.canvases.length,
        scene: window.__profile.state(),
      }));
      if (errors.length) throw Error(errors.join('\n'));
      const metric = (data, name) => data.metrics.find((m) => m.name === name).value;
      samples.push({
        repetition,
        events: 5,
        before,
        after,
        taskMs: (metric(b, 'TaskDuration') - metric(a, 'TaskDuration')) * 1000,
        createdCanvases: after.canvases - before.canvases,
      });
    } finally {
      await context.close();
    }
  }
  await fs.writeFile(
    output,
    JSON.stringify(
      {
        status: 'passed',
        manifest,
        browser: browser.version(),
        viewport: '390x844 DPR2',
        seed: 424242,
        samples,
      },
      null,
      2,
    ),
  );
  console.log(
    samples.map((s) => ({
      repetition: s.repetition,
      taskMs: s.taskMs,
      createdCanvases: s.createdCanvases,
    })),
  );
} finally {
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
