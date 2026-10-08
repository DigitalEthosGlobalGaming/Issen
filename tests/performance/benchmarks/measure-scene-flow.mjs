/** Explicitly opt-in production scene transitions, post-presentation tasks and frame budgets. */
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import MagicString from 'magic-string';
import { performancePlugin } from '../build-plugin.mjs';
import { configure } from '../scenarios.mjs';
import { frameStats, tasksAfterPresentation } from './scene-metrics.mjs';

const output = process.argv[2];
if (!output?.replaceAll('\\', '/').startsWith('tmp/')) throw Error('Output must be under tmp/');
await mkdir(output, { recursive: true });
const extra = {
  name: 'scene-measurement-ports',
  transform(source, id) {
    if (!id.replaceAll('\\', '/').endsWith('/src/game.ts')) return;
    const anchor = 'window.__profile.schemaVersion = 1;';
    if (!source.includes(anchor)) throw Error('Scene measurement port anchor changed');
    const edited = new MagicString(source);
    edited.appendLeft(
      source.indexOf(anchor),
      'window.__sceneProfile = { previewStage, cinematic, environmentRenderer }; ',
    );
    return {
      code: edited.toString(),
      map: edited.generateMap({ source: id, includeContent: true, hires: true }),
    };
  },
};
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
  windowsHide: true,
}).trim();
const files = execFileSync(
  'git',
  ['ls-files', '--cached', '--others', '--exclude-standard', '-z'],
  { encoding: 'utf8', windowsHide: true },
)
  .split('\0')
  .filter(Boolean)
  .sort();
const hash = createHash('sha256');
for (const file of [...new Set(files)]) {
  try {
    hash.update(file + '\0').update(await readFile(file));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    hash.update(file + '\0<deleted>');
  }
}
const sourceFingerprint = hash.digest('hex');
await build({
  mode: 'android',
  logLevel: 'warn',
  plugins: [performancePlugin(sourceFingerprint), extra],
  define: {
    'import.meta.env.VITE_GAME_EDITION': JSON.stringify('free'),
    'import.meta.env.VITE_PREMIUM_ENABLED': 'false',
    'import.meta.env.VITE_REVENUECAT_ANDROID_KEY': '""',
  },
  build: {
    outDir: path.resolve(output, 'build'),
    emptyOutDir: false,
    sourcemap: true,
    reportCompressedSize: false,
  },
});
const server = await preview({
  configFile: false,
  build: { outDir: path.resolve(output, 'build') },
  preview: { host: '127.0.0.1', port: 5298, strictPort: true },
});
const browser = await chromium.launch({ channel: 'msedge' });
const report = {
  status: 'running',
  revision,
  sourceFingerprint,
  browser: browser.version(),
  viewport: { width: 900, height: 600 },
  dpr: 1,
  seed: 424242,
  limits: [
    'Desktop browser results do not prove mobile or 120 Hz frame delivery.',
    'Decoded bytes are nominal RGBA storage, not resident GPU or process memory.',
    'Cold cycle clears HTTP cache after startup; already-decoded shared startup images remain available.',
    'Warm cycle retains HTTP cache, but revisits recompose under the baseline single-slot renderer.',
  ],
  scenes: [],
  gameplay: null,
};
let page;
try {
  page = await browser.newPage({ viewport: report.viewport, deviceScaleFactor: 1 });
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Performance.enable');
  await cdp.send('Network.enable');
  await cdp.send('Network.clearBrowserCache');
  await page.goto('http://127.0.0.1:5298/?seed=424242', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(
    () =>
      window.__sceneProfile && document.querySelector('#c').dataset.rendererBackend === 'layered',
    {},
    { timeout: 60000 },
  );
  report.titleReadyMs = await page.evaluate(() => window.__profile.readyMs);
  await page.evaluate(() => window.__sceneProfile.cinematic.open(0));
  await page.waitForFunction(
    () => document.querySelector('#c').dataset.sceneState === 'ready',
    {},
    { timeout: 60000 },
  );
  for (const cache of ['cold', 'warm']) {
    if (cache === 'cold') await cdp.send('Network.clearBrowserCache');
    for (const stage of [1, 2, 3, 4, 5, 6, 7, 8, 0]) {
      const requests = [];
      const network = (request) => {
        if (/\.(webp|png)(?:\?|$)/.test(request.url())) requests.push(request.url());
      };
      page.on('request', network);
      await cdp.send('Tracing.start', {
        categories: 'toplevel,devtools.timeline,blink.user_timing',
        transferMode: 'ReturnAsStream',
      });
      const before = await cdp.send('Performance.getMetrics');
      await page.evaluate((stage) => {
        performance.clearMarks();
        performance.clearMeasures();
        window.__sceneProfile.previewStage(stage, false);
      }, stage);
      await page.waitForFunction(
        (stage) =>
          document.querySelector('#c').dataset.sceneState === 'ready' &&
          window.__sceneProfile.environmentRenderer.snapshot().stage === stage,
        stage,
        { timeout: 60000 },
      );
      // The game's settle mark anchors the two seconds, including the presenting task.
      const settled = await page.evaluate(
        () =>
          performance
            .getEntriesByType('mark')
            .find((entry) => entry.name.startsWith('issen:settle-presented-scene:'))?.name,
      );
      if (!settled) throw Error('No presentation mark for stage ' + stage);
      await page.waitForTimeout(2100);
      const after = await cdp.send('Performance.getMetrics');
      const data = await page.evaluate(() => ({
        marks: performance.getEntriesByType('mark').map((entry) => entry.toJSON()),
        measures: performance.getEntriesByType('measure').map((entry) => entry.toJSON()),
        snapshot: window.__sceneProfile.environmentRenderer.snapshot(),
        memory: window.__probe.memory(),
      }));
      const finished = new Promise((resolve) => cdp.once('Tracing.tracingComplete', resolve));
      await cdp.send('Tracing.end');
      const { stream } = await finished;
      let trace = '';
      for (;;) {
        const part = await cdp.send('IO.read', { handle: stream });
        trace += part.base64Encoded ? Buffer.from(part.data, 'base64').toString() : part.data;
        if (part.eof) break;
      }
      await cdp.send('IO.close', { handle: stream });
      page.off('request', network);
      await writeFile(output + '/' + cache + '-' + stage + '.trace.json', trace);
      const heap = (metrics) =>
        metrics.metrics.find((entry) => entry.name === 'JSHeapUsedSize').value;
      const row = {
        cache,
        stage,
        ...data,
        requests,
        tasks: tasksAfterPresentation(JSON.parse(trace).traceEvents, settled),
        sampledHeapPeakBytes: Math.max(heap(before), heap(after)),
      };
      report.scenes.push(row);
      console.log(
        JSON.stringify({
          cache,
          stage,
          loadMs: data.measures.find((entry) => entry.name.startsWith('issen:scene-load:'))
            ?.duration,
          timings: data.snapshot.timings,
          decodedBytes: data.snapshot.decodedBytes,
          tasks: row.tasks,
        }),
      );
      await writeFile(output + '/results.json', JSON.stringify(report, null, 2));
    }
  }
  await page.close();
  page = await browser.newPage({ viewport: report.viewport, deviceScaleFactor: 1 });
  const gameplayCdp = await page.context().newCDPSession(page);
  await gameplayCdp.send('Network.clearBrowserCache');
  await page.goto('http://127.0.0.1:5298/?seed=424242', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => window.__sceneProfile, {}, { timeout: 60000 });
  const start = await page.evaluate(() => performance.now());
  await configure(page, 'combat');
  await page.waitForFunction(
    () => document.querySelector('#c').dataset.sceneState === 'ready',
    {},
    { timeout: 60000 },
  );
  report.gameplaySceneReadyMs = await page.evaluate((start) => performance.now() - start, start);
  await page.waitForFunction(
    () =>
      performance
        .getEntriesByType('mark')
        .some((entry) => entry.name.startsWith('issen:first-gameplay-frame:')),
    {},
    { timeout: 60000 },
  );
  report.startupToFirstGameplayMs = await page.evaluate(
    () =>
      performance
        .getEntriesByType('mark')
        .find((entry) => entry.name.startsWith('issen:first-gameplay-frame:')).startTime,
  );
  await page.waitForTimeout(3000);
  await page.evaluate(() => window.__probe.reset());
  await page.waitForTimeout(10000);
  const raw = await page.evaluate(() => {
    window.__probe.measure = false;
    return {
      frames: window.__probe.frames,
      updates: window.__probe.updates,
      renders: window.__probe.renders,
    };
  });
  report.gameplay = {
    raw,
    intervals: frameStats(raw.frames),
    updates: frameStats(raw.updates),
    renders: frameStats(raw.renders),
  };
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = String(error);
  throw error;
} finally {
  await writeFile(output + '/results.json', JSON.stringify(report, null, 2));
  await browser.close();
  await server.close();
}
