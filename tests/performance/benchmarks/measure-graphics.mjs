/** Opt-in one-option comparisons; reuses the production performance fixture. */
import { build, preview } from 'vite';
import { chromium } from '@playwright/test';
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { performancePlugin } from '../build-plugin.mjs';
import { configure, checkState } from '../scenarios.mjs';
import { stats } from '../report.mjs';

const output = process.argv[2];
const resume = process.argv[3];
const previous = resume
  ? JSON.parse(await readFile(path.join(resume, 'results.json'), 'utf8'))
  : undefined;
if (!output?.replaceAll('\\', '/').startsWith('tmp/')) throw Error('Output must be under tmp/');
await mkdir(output, { recursive: true });
const revision = execFileSync('git', ['rev-parse', 'HEAD'], {
  encoding: 'utf8',
  windowsHide: true,
}).trim();
if (
  previous &&
  (previous.revision !== revision ||
    execFileSync('git', ['diff', 'HEAD', '--name-only'], {
      encoding: 'utf8',
      windowsHide: true,
    }).trim())
)
  throw Error('Cannot resume after tracked source changes');
const base = {
  preset: 'custom',
  frameRate: 60,
  resolution: 100,
  lighting: 'full',
  antialias: true,
  particles: 'high',
  grass: 'high',
  weather: 'full',
  scenery: 'high',
  adaptive: false,
  preload: false,
  memory: 'high',
  fpsCounter: false,
};
const arms = [
  ['baseline', {}],
  ['frameRate', { frameRate: 30 }],
  ['resolution', { resolution: 50 }],
  ['lighting', { lighting: 'half' }],
  ['lighting-off', { lighting: 'off' }],
  ['antialias', { antialias: false }],
  ['particles', { particles: 'off' }],
  ['grass', { grass: 'medium' }],
  ['weather', { weather: 'reduced' }],
  ['scenery', { scenery: 'low' }],
  ['adaptive', { adaptive: true }],
  ['preload', { preload: true }],
  ['memory', { memory: 'low' }],
  ['fpsCounter', { fpsCounter: true }],
  [
    'low',
    {
      resolution: 60,
      lighting: 'half',
      antialias: false,
      particles: 'low',
      grass: 'low',
      weather: 'reduced',
      scenery: 'low',
      memory: 'low',
    },
  ],
  [
    'balanced',
    {
      resolution: 75,
      lighting: 'half',
      antialias: false,
      particles: 'medium',
      grass: 'medium',
      scenery: 'normal',
      memory: 'normal',
      preload: true,
    },
  ],
];
const fixture = {
  name: 'graphics-measurement-settings',
  transform(source, id) {
    if (!id.replaceAll('\\', '/').endsWith('/src/game.ts')) return;
    const anchor = 'window.__profile.schemaVersion = 1;';
    if (!source.includes(anchor)) throw Error('Graphics measurement anchor changed');
    return {
      code:
        "import { documentPixelMemory as graphicsPixelMemory } from './platform/pixel-memory.ts';\n" +
        source.replace(
          anchor,
          'window.__profile.graphicsMemory = () => graphicsPixelMemory(document).snapshot(); ' +
            anchor,
        ),
      map: null,
    };
  },
  transformIndexHtml: {
    order: 'post',
    handler(html) {
      return html.replace(
        '</head>',
        `<script>localStorage.setItem('issen.settings',JSON.stringify({version:2,reducedMotion:'off',reducedFlashes:'off',graphics:JSON.parse(new URLSearchParams(location.search).get('graphics'))}));</script></head>`,
      );
    },
  },
};
if (resume) await cp(path.join(resume, 'build'), path.join(output, 'build'), { recursive: true });
else {
  const checked = execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  await writeFile(path.join(output, 'typecheck.log'), checked);
  await build({
    mode: 'android',
    logLevel: 'warn',
    plugins: [performancePlugin(revision), fixture],
    define: {
      'import.meta.env.VITE_GAME_EDITION': '"free"',
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
}
const server = await preview({
  configFile: false,
  build: { outDir: path.resolve(output, 'build') },
  preview: { host: '127.0.0.1', port: 5297, strictPort: true },
});
let browser;
const report = {
  revision,
  status: 'running',
  scenario: 'drift-gust',
  seed: 424242,
  viewport: { width: 390, height: 844 },
  dpr: 2,
  warmup: 500,
  duration: 3000,
  repeats: 2,
  browser: '',
  rows: previous?.rows ?? [],
  resumedFrom: resume,
};
try {
  browser = await chromium.launch({ channel: 'msedge' });
  if (previous && previous.browser !== browser.version())
    throw Error('Browser changed since retained samples');
  report.browser = browser.version();
  // Reverse the second sweep to reduce a systematic arm-order bias.
  for (let repeat = 0; repeat < 2; repeat++)
    for (const [name, changes] of repeat ? [...arms].reverse() : arms) {
      if (report.rows.some((row) => row.name === name && row.repeat === repeat)) continue;
      console.log(`${name}: ${repeat + 1}/2`);
      const graphics = { ...base, ...changes };
      const context = await browser.newContext({
        viewport: report.viewport,
        deviceScaleFactor: report.dpr,
      });
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', (error) => errors.push(error.message));
      try {
        await page.goto(
          `http://127.0.0.1:5297/?scenario=drift-gust&seed=424242&graphics=${encodeURIComponent(JSON.stringify(graphics))}`,
          { waitUntil: 'domcontentloaded' },
        );
        await page.waitForFunction(
          () => window.__profile?.schemaVersion === 1,
          {},
          { timeout: 60000 },
        );
        await configure(page, 'drift-gust');
        await page.waitForTimeout(report.warmup);
        const initial = await page.evaluate(() => window.__profile.state());
        await page.evaluate(() => window.__probe.reset());
        await page.waitForTimeout(report.duration);
        const sample = await page.evaluate(async () => {
          const probe = window.__probe;
          probe.measure = false;
          return {
            renders: probe.renders,
            frames: probe.frames,
            updates: probe.updates,
            state: window.__profile.state(),
            saved: JSON.parse(localStorage.getItem('issen.settings')).graphics,
            applied: { ...document.documentElement.dataset },
            memory: window.__profile.graphicsMemory(),
            sceneLoads: performance
              .getEntriesByType('measure')
              .filter((entry) => entry.name.startsWith('issen:scene-load:'))
              .map((entry) => ({ name: entry.name, duration: entry.duration })),
          };
        });
        // Off deliberately removes leaves; retain combat integrity guards instead.
        checkState('combat', initial, sample.state);
        if (graphics.particles === 'off' && sample.state.driftLeaves !== 0)
          throw Error('Particles Off retained leaves');
        if (errors.length) throw Error(errors.join('\n'));
        if (!sample.renders.length || !sample.frames.length) throw Error('No measured frames');
        for (const [key, value] of Object.entries(graphics))
          if (sample.saved[key] !== value) throw Error(`Graphics override not applied: ${key}`);
        report.rows.push({
          name,
          repeat,
          graphics,
          initial,
          ...sample,
          render: stats(sample.renders),
          frame: stats(sample.frames),
          renderWorkMsPerSecond:
            sample.renders.reduce((sum, ms) => sum + ms, 0) / (report.duration / 1000),
        });
        await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
      } finally {
        await context.close();
      }
    }
  report.status = 'passed';
} catch (error) {
  report.status = 'failed';
  report.error = String(error);
  process.exitCode = 1;
} finally {
  await writeFile(path.join(output, 'results.json'), JSON.stringify(report, null, 2));
  await browser?.close();
  await new Promise((resolve) => server.httpServer.close(resolve));
}
console.log(`${report.status}: ${output}/results.json`);
