import { build, preview } from 'vite';
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash, randomUUID } from 'node:crypto';
import { cpus, platform, release, totalmem } from 'node:os';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { options, help } from './config.mjs';
import { performancePlugin } from './build-plugin.mjs';
import { openTarget, localDoctor } from './targets.mjs';
import { measure, captureTextureCounters } from './collect.mjs';
import { comparison, writeReport } from './report.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
process.chdir(root);
const config = options(process.argv.slice(2));
if (config.help) {
  console.log(help);
  process.exit(0);
}
if (config.doctor) {
  console.log(JSON.stringify(localDoctor(config), null, 2));
  process.exit(0);
}
const git = (...args) =>
  execFileSync(
    'git',
    ['-c', `safe.directory=${root.replaceAll('\\', '/').replace(/\/$/, '')}`, ...args],
    { encoding: 'utf8', windowsHide: true },
  ).trim();
const files = git('ls-files', '--cached', '--others', '--exclude-standard', '-z')
  .split('\0')
  .filter(Boolean)
  .sort();
const hash = createHash('sha256');
const toolHash = createHash('sha256');
for (const name of [...new Set(files)]) {
  hash.update(name + '\0');
  try {
    const content = await readFile(name);
    hash.update(content);
    if (
      name.startsWith('tests/performance/') &&
      /\.(mjs|txt)$/.test(name) &&
      !name.endsWith('.test.mjs') &&
      !name.includes('/legacy/') &&
      !name.includes('/benchmarks/')
    )
      toolHash.update(name + '\0').update(content);
  } catch (e) {
    if (e.code !== 'ENOENT') throw e;
    hash.update('<deleted>');
  }
}
config.buildId = hash.digest('hex');
const out = path.resolve(
  'tmp/performance',
  new Date().toISOString().replaceAll(':', '-') + '-' + randomUUID().slice(0, 8),
);
for (const dir of ['', 'profiles', 'traces', 'screenshots', 'logs'])
  await mkdir(path.join(out, dir), { recursive: true });
console.log(`Performance output: ${out}`);
const manifest = {
  schemaVersion: 1,
  date: new Date().toISOString(),
  revision: git('rev-parse', 'HEAD'),
  sourceFingerprint: config.buildId,
  dirty: git('status', '--porcelain'),
  target: config.target,
  buildMode: 'production instrumented; offline fonts; free edition',
  instrumentation: toolHash.digest('hex'),
  quality: 'high',
  seed: config.seed,
  warmup: config.warmup,
  duration: config.duration,
  repeats: config.repeats,
  viewport: config.viewport,
  dpr: config.dpr,
  headed: config.headed,
  httpCache: config.httpCache,
  platform: `${platform()} ${release()}`,
  cpu: cpus()[0]?.model,
  logicalCpus: cpus().length,
  memoryBytes: totalmem(),
  node: process.version,
  scenarios: config.scenarios,
  browser: null,
  graphics: null,
  deviceIdentity: null,
};
const results = { manifest, status: 'running', samples: [], diagnostics: [], errors: [] };
let server, target;
// Graceful cancellation still writes partial results and executes the ownership-based cleanup below.
let cancelled = false;
process.on('SIGINT', () => {
  cancelled = true;
});
process.on('SIGTERM', () => {
  cancelled = true;
});
try {
  if (config.target !== 'web' && config.mode !== 'build') localDoctor(config);
  const typecheck = spawnSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  await writeFile(`${out}/logs/typecheck.log`, (typecheck.stdout || '') + (typecheck.stderr || ''));
  if (typecheck.error) throw typecheck.error;
  if (typecheck.status !== 0) throw Error(`TypeScript check failed; see ${out}/logs/typecheck.log`);
  // Android mode supplies bundled local fonts and relative asset URLs. This builds
  // only web assets; it does not invoke Capacitor, Gradle, signing, or installation.
  await build({
    root,
    logLevel: 'warn',
    mode: 'android',
    plugins: [performancePlugin(config.buildId)],
    worker: { plugins: () => [performancePlugin(config.buildId)] },
    define: {
      'import.meta.env.VITE_GAME_EDITION': JSON.stringify('free'),
      'import.meta.env.VITE_PREMIUM_ENABLED': JSON.stringify('false'),
      'import.meta.env.VITE_REVENUECAT_ANDROID_KEY': JSON.stringify(''),
    },
    build: {
      outDir: path.join(out, 'build'),
      emptyOutDir: false,
      sourcemap: true,
      reportCompressedSize: false,
    },
  });
  await writeFile(`${out}/manifest.json`, JSON.stringify(manifest, null, 2));
  if (config.mode === 'build') {
    results.status = 'built';
    console.log('Instrumented web assets built. No Android APK was built.');
  } else {
    target = await openTarget(config);
    manifest.browser = target.version;
    manifest.deviceIdentity = target.deviceIdentity;
    manifest.graphics = target.graphics ?? null;
    let origin = target.base;
    if (config.target === 'web') {
      server = await preview({
        root,
        configFile: false,
        build: { outDir: path.join(out, 'build') },
        preview: { host: '127.0.0.1', port: config.port, strictPort: true },
      });
      origin = `http://127.0.0.1:${config.port}/`;
    }
    for (const scenario of config.scenarios) {
      if (cancelled) throw Error('Run cancelled; partial results retained');
      if (config.mode !== 'diagnostic')
        for (let i = 0; i < config.repeats; i++) {
          if (cancelled) throw Error('Run cancelled; partial results retained');
          console.log(`${scenario}: timing ${i + 1}/${config.repeats}`);
          const sample = await measure(target, origin, config, scenario, i, out);
          results.samples.push(sample);
          // Record actual device geometry rather than desktop defaults on Android.
          if (config.target !== 'web') {
            manifest.viewport = sample.actual.viewport;
            manifest.dpr = sample.actual.dpr;
          }
          await writeReport(out, results);
        }
      if (config.mode !== 'timing') {
        console.log(`${scenario}: separate diagnostic capture`);
        const diagnostic = await measure(target, origin, config, scenario, 0, out, true);
        console.log(`${scenario}: separate texture-counter context`);
        diagnostic.textures = await captureTextureCounters(target, origin, config, scenario, out);
        results.diagnostics.push(diagnostic);
        await writeReport(out, results);
      }
    }
    if (config.compare)
      results.comparison = comparison(
        results,
        JSON.parse(await readFile(path.resolve(config.compare, 'results.json'), 'utf8')),
      );
    results.status = 'passed';
  }
} catch (error) {
  results.status = 'failed';
  results.errors.push(error.stack || String(error));
  process.exitCode = 1;
  console.error(error);
} finally {
  try {
    await target?.close();
  } catch (e) {
    results.errors.push(`Cleanup: ${e}`);
    results.status = 'failed';
    process.exitCode = 1;
  }
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
  await writeFile(`${out}/manifest.json`, JSON.stringify(manifest, null, 2));
  await writeReport(out, results);
  console.log(`Performance run ${results.status}: ${path.join(out, 'report.html')}`);
}
