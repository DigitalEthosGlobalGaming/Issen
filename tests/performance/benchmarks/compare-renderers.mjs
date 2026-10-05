import { build, preview } from 'vite';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { cpus, platform } from 'node:os';
import path from 'node:path';
import { performancePlugin } from '../build-plugin.mjs';
import { options } from '../config.mjs';
import { openTarget } from '../targets.mjs';
import { measure } from '../collect.mjs';
import { stats } from '../report.mjs';
import MagicString from 'magic-string';

// One frozen build, identical fixtures, alternating renderer order in fresh contexts.
const root = fileURLToPath(new URL('../../../', import.meta.url));
process.chdir(root);
const compareStrokes = process.argv.includes('--compare-strokes');
const baselineArgument = process.argv.find((arg) => arg.startsWith('--adapter-baseline='));
if (compareStrokes && baselineArgument) throw Error('Choose one legacy comparison mode');
const compareLegacy = compareStrokes || !!baselineArgument;
const renderers = compareLegacy ? ['canvas', 'pixi-legacy', 'pixi'] : ['canvas', 'pixi'];
const baselineSources = new Map();
const baselineHash = createHash('sha256');
if (baselineArgument)
  for (const name of ['scene-painter.ts', 'texture-store.ts']) {
    const source = await readFile(
      path.resolve(baselineArgument.split('=').slice(1).join('='), name),
      'utf8',
    );
    baselineSources.set(name, source);
    baselineHash.update(name + '\0').update(source);
  }
const adapterBaselinePlugin = {
  name: 'performance-adapter-baseline',
  enforce: 'pre',
  resolveId(id) {
    if (id.startsWith('virtual:adapter-baseline/')) return '\0' + id;
  },
  load(id) {
    if (!id.startsWith('\0virtual:adapter-baseline/')) return;
    const name = id.split('/').pop();
    const source = baselineSources.get(name);
    if (!source) throw Error(`Unknown adapter baseline module ${name}`);
    return source.replace(
      /(from\s*['"]|import\s*['"])(\.[^'"]+)(['"])/g,
      (_all, before, specifier, after) => {
        const resolved = path.resolve(root, 'src/rendering/pixi', specifier).replaceAll('\\', '/');
        const sibling = path.basename(resolved);
        return (
          before +
          (baselineSources.has(sibling) ? 'virtual:adapter-baseline/' + sibling : resolved) +
          after
        );
      },
    );
  },
  transform(code, id) {
    if (
      id.replaceAll('\\', '/') !==
      path.join(root, 'src/rendering/pixi/scene-painter.ts').replaceAll('\\', '/')
    )
      return;
    const anchor = 'return new PixiScenePainter(canvas, renderer);';
    if (!code.includes(anchor)) throw Error('Adapter factory benchmark seam no longer matches');
    const edited = new MagicString(code);
    edited.prepend(
      'import { PixiScenePainter as BaselinePainter } from "virtual:adapter-baseline/scene-painter.ts";\n',
    );
    edited.overwrite(
      code.indexOf(anchor),
      code.indexOf(anchor) + anchor.length,
      'return new URLSearchParams(location.search).has("legacyAdapter") ? new BaselinePainter(canvas, renderer) : new PixiScenePainter(canvas, renderer);',
    );
    return {
      code: edited.toString(),
      map: edited.generateMap({ hires: true, source: id, includeContent: true }),
    };
  },
};
// Benchmark-only control: same build, reverting just the two stroke fast paths.
const legacyStrokePlugin = {
  name: 'performance-legacy-strokes',
  enforce: 'pre',
  transform(code, id) {
    if (!id.replaceAll('\\', '/').endsWith('/src/rendering/pixi/scene-painter.ts')) return;
    const ring = 'registerBrushRingSink(this, (radius, colour) => {';
    const stroke = "this.lineCap === 'round' &&";
    if (!code.includes(ring) || !code.includes(stroke))
      throw Error('Legacy stroke benchmark transform no longer matches the painter');
    const edited = new MagicString(code);
    edited.prepend(
      'const legacyStrokes = new URLSearchParams(location.search).has("legacyStrokes");\n',
    );
    edited.appendLeft(code.indexOf(ring) + ring.length, '\nif (legacyStrokes) return false;');
    edited.appendLeft(code.indexOf(stroke), '!legacyStrokes && ');
    return {
      code: edited.toString(),
      map: edited.generateMap({ hires: true, source: id, includeContent: true }),
    };
  },
};
const git = (...args) =>
  execFileSync(
    'git',
    ['-c', `safe.directory=${root.replaceAll('\\', '/').replace(/\/$/, '')}`, ...args],
    { encoding: 'utf8', windowsHide: true },
  ).trim();
const out = path.resolve(
  'tmp/performance',
  new Date().toISOString().replaceAll(':', '-') + '-renderers',
);
await mkdir(out, { recursive: true });
for (const dir of ['profiles', 'traces', 'screenshots']) await mkdir(path.join(out, dir));
if (baselineArgument) {
  await mkdir(path.join(out, 'baseline'));
  for (const [name, source] of baselineSources)
    await writeFile(path.join(out, 'baseline', name), source);
}
const config = options([
  '--scenario=title,combat,demon,film-glitch,film-inferno,stress-100',
  '--mode=timing',
  ...process.argv
    .slice(2)
    .filter((arg) => arg !== '--compare-strokes' && !arg.startsWith('--adapter-baseline=')),
]);
if (config.target !== 'web' || config.mode !== 'timing')
  throw Error('Renderer comparison requires web timing mode');
const hash = createHash('sha256');
for (const file of [
  ...new Set(
    git('ls-files', '--cached', '--others', '--exclude-standard', '-z').split('\0').filter(Boolean),
  ),
].sort())
  hash.update(file + '\0').update(await readFile(file));
config.buildId = hash.digest('hex');
const instrumentation = createHash('sha256');
for (const file of [
  'build-plugin.mjs',
  'probe.mjs',
  'runtime-hook.txt',
  'collect.mjs',
  'scenarios.mjs',
  'targets.mjs',
])
  instrumentation.update(file).update(await readFile(new URL('../' + file, import.meta.url)));
if (compareStrokes) instrumentation.update(legacyStrokePlugin.transform.toString());
if (baselineArgument)
  instrumentation
    .update(adapterBaselinePlugin.transform.toString())
    .update(adapterBaselinePlugin.load.toString());
const results = {
  status: 'running',
  manifest: {
    revision: git('rev-parse', 'HEAD'),
    dirty: git('status', '--porcelain'),
    fingerprint: config.buildId,
    instrumentation: instrumentation.digest('hex'),
    platform: platform(),
    cpu: cpus()[0]?.model,
    viewport: config.viewport,
    dpr: config.dpr,
    seed: config.seed,
    quality: 'High',
    edition: 'Free',
    warmup: config.warmup,
    duration: config.duration,
    repeats: config.repeats,
    headed: config.headed,
    scenarios: config.scenarios,
    renderers,
    compareStrokes,
    adapterBaseline: baselineArgument ? baselineHash.digest('hex') : null,
    notes:
      'Same production build and shipped sprite density. Alternating Canvas/Pixi order. Whole rendering callback CPU submission, including native flush; asynchronous GPU execution is excluded. Pixi includes its shipped selective material lighting.',
  },
  samples: [],
  errors: [],
};
const save = () => writeFile(path.join(out, 'results.json'), JSON.stringify(results, null, 2));
let server, target;
console.log('Output: ' + out);
try {
  execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'], {
    stdio: 'inherit',
    windowsHide: true,
  });
  await build({
    root,
    logLevel: 'warn',
    mode: 'android',
    plugins: [
      performancePlugin(config.buildId),
      ...(compareStrokes ? [legacyStrokePlugin] : []),
      ...(baselineArgument ? [adapterBaselinePlugin] : []),
    ],
    define: {
      'import.meta.env.VITE_GAME_EDITION': '"free"',
      'import.meta.env.VITE_PREMIUM_ENABLED': '"false"',
      'import.meta.env.VITE_REVENUECAT_ANDROID_KEY': '""',
    },
    build: {
      outDir: path.join(out, 'build'),
      emptyOutDir: false,
      sourcemap: true,
      reportCompressedSize: false,
    },
  });
  server = await preview({
    root,
    configFile: false,
    build: { outDir: path.join(out, 'build') },
    preview: { host: '127.0.0.1', port: config.port, strictPort: true },
  });
  target = await openTarget(config);
  results.manifest.browser = target.version;
  results.manifest.graphics = target.graphics;
  await save();
  for (const scenario of config.scenarios) {
    for (let repetition = 0; repetition < config.repeats; repetition++) {
      const offset = repetition % renderers.length;
      for (const renderer of [...renderers.slice(offset), ...renderers.slice(0, offset)]) {
        console.log(`${scenario} ${renderer} ${repetition + 1}/${config.repeats}`);
        let observed;
        const wrapped = {
          ...target,
          async sample() {
            const handle = await target.sample();
            const go = handle.page.goto.bind(handle.page);
            handle.page.goto = (url, settings) => {
              const next = new URL(url);
              next.searchParams.set('renderer', renderer === 'pixi-legacy' ? 'pixi' : renderer);
              if (renderer === 'pixi-legacy') next.searchParams.set('legacyStrokes', '1');
              if (renderer === 'pixi-legacy' && baselineArgument)
                next.searchParams.set('legacyAdapter', '1');
              return go(next.href, settings);
            };
            return {
              ...handle,
              close: async () => {
                try {
                  observed = await handle.page.locator('#c').getAttribute('data-graphics-backend');
                } finally {
                  await handle.close();
                }
              },
            };
          },
        };
        const row = await measure(
          wrapped,
          `http://127.0.0.1:${config.port}/`,
          config,
          scenario,
          repetition,
          out,
        );
        const backend = renderer === 'pixi-legacy' ? 'pixi' : renderer;
        if (observed !== backend) throw Error(`Expected ${backend}, observed ${observed}`);
        results.samples.push({ ...row, renderer, observed });
        await save();
      }
    }
  }
  results.status = 'passed';
} catch (error) {
  results.status = 'failed';
  results.errors.push(error.stack || String(error));
  process.exitCode = 1;
  console.error(error);
} finally {
  await target?.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
  results.summary = config.scenarios.map((scenario) => ({
    scenario,
    ...(compareLegacy
      ? {
          pairedStrokeReductionPct: stats(
            results.samples
              .filter((row) => row.scenario === scenario && row.renderer === 'pixi')
              .map((row) => {
                const legacy = results.samples.find(
                  (sample) =>
                    sample.scenario === scenario &&
                    sample.renderer === 'pixi-legacy' &&
                    sample.repetition === row.repetition,
                );
                return legacy?.renders.median > 0
                  ? 100 * (1 - row.renders.median / legacy.renders.median)
                  : NaN;
              })
              .filter(Number.isFinite),
          ),
          pairedSavedMs: stats(
            results.samples
              .filter((row) => row.scenario === scenario && row.renderer === 'pixi')
              .map((row) => {
                const legacy = results.samples.find(
                  (sample) =>
                    sample.scenario === scenario &&
                    sample.renderer === 'pixi-legacy' &&
                    sample.repetition === row.repetition,
                );
                return legacy ? legacy.renders.median - row.renders.median : NaN;
              })
              .filter(Number.isFinite),
          ),
        }
      : {}),
    ...Object.fromEntries(
      renderers.map((renderer) => {
        const rows = results.samples.filter(
          (row) => row.scenario === scenario && row.renderer === renderer,
        );
        return [
          renderer,
          {
            runs: rows.length,
            renderMs: stats(rows.map((row) => row.renders.median)),
            renderP95Ms: stats(rows.map((row) => row.renders.p95)),
            frameP95Ms: stats(rows.map((row) => row.frames.p95)),
            taskMs: stats(rows.map((row) => row.taskMs)),
            startupMs: stats(rows.map((row) => row.startupMs)),
          },
        ];
      }),
    ),
  }));
  await save();
  const lines = [
    '# Canvas / Pixi renderer comparison',
    '',
    `Status: ${results.status}. ${results.manifest.browser}; ${config.viewport.width}×${config.viewport.height}, DPR ${config.dpr}. ${config.repeats} fresh contexts per renderer and scenario; ${config.warmup} ms warmup, ${config.duration} ms measurement.`,
    '',
    'CPU rendering command submission only; deferred GPU work is excluded.',
    '',
    compareLegacy
      ? '| Scenario | Canvas median ms | Legacy Pixi median ms | Pixi median ms | Median paired reduction | Pixi p95 ms |'
      : '| Scenario | Canvas median ms | Pixi median ms | Change | Canvas p95 ms | Pixi p95 ms |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ];
  if (compareStrokes)
    lines.splice(
      6,
      0,
      'Legacy Pixi disables only cached outer brush rings and textured straight round strokes in this same build.',
    );
  if (baselineArgument)
    lines.splice(
      6,
      0,
      'Legacy Pixi uses the preserved renderer and texture-store snapshots in baseline/; other runtime and artwork are shared.',
      '',
    );
  const milliseconds = (value) => (value == null ? 'N/A' : value.toFixed(2));
  for (const row of results.summary) {
    const c = row.canvas.renderMs.median,
      p = row.pixi.renderMs.median;
    const baseline = compareLegacy ? row['pixi-legacy'].renderMs.median : c;
    const change = baseline > 0 && p !== null ? ((p / baseline - 1) * 100).toFixed(1) + '%' : 'N/A';
    lines.push(
      compareLegacy
        ? `| ${row.scenario} | ${milliseconds(c)} | ${milliseconds(baseline)} | ${milliseconds(p)} | ${row.pairedStrokeReductionPct.median?.toFixed(1) ?? 'N/A'}% | ${milliseconds(row.pixi.renderP95Ms.median)} |`
        : `| ${row.scenario} | ${milliseconds(c)} | ${milliseconds(p)} | ${change} | ${milliseconds(row.canvas.renderP95Ms.median)} | ${milliseconds(row.pixi.renderP95Ms.median)} |`,
    );
  }
  await writeFile(path.join(out, 'report.md'), lines.join('\n') + '\n');
  console.log(`${results.status}: ${out}`);
}
