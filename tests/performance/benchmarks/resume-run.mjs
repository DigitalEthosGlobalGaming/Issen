import { cp, readFile, writeFile } from 'node:fs/promises';
import { createHash, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpus, platform, release } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { options } from '../config.mjs';
import { openTarget } from '../targets.mjs';
import { measure } from '../collect.mjs';
import { writeReport } from '../report.mjs';

const root = fileURLToPath(new URL('../../../', import.meta.url));
process.chdir(root);

const input = path.resolve(process.argv[2]);
const original = JSON.parse(await readFile(path.join(input, 'results.json'), 'utf8'));
if (original.status !== 'failed' || original.manifest.target !== 'web')
  throw Error('Expected a failed web run');
const manifest = original.manifest;
if (
  manifest.platform !== `${platform()} ${release()}` ||
  manifest.cpu !== cpus()[0].model ||
  manifest.node !== process.version
)
  throw Error('Host identity changed');
const files = execFileSync(
  'git',
  [
    '-c',
    `safe.directory=${root.replaceAll('\\', '/').replace(/\/$/, '')}`,
    'ls-files',
    '--cached',
    '--others',
    '--exclude-standard',
    '-z',
  ],
  { encoding: 'utf8', windowsHide: true },
)
  .split('\0')
  .filter(Boolean)
  .sort();
const hash = createHash('sha256');
for (const name of [...new Set(files)])
  if (
    name.startsWith('tests/performance/') &&
    /\.(mjs|txt)$/.test(name) &&
    !name.endsWith('.test.mjs') &&
    !name.includes('/legacy/') &&
    !name.includes('/benchmarks/')
  )
    hash.update(name + '\0').update(await readFile(name));
if (hash.digest('hex') !== manifest.instrumentation) throw Error('Instrumentation changed');
const config = options([
  `--mode=full`,
  `--viewport=${manifest.viewport.width}x${manifest.viewport.height}`,
  `--dpr=${manifest.dpr}`,
  `--seed=${manifest.seed}`,
  `--warmup=${manifest.warmup}`,
  `--duration=${manifest.duration}`,
  `--repeats=${manifest.repeats}`,
]);
config.scenarios = manifest.scenarios;
const out = path.resolve(
  'tmp/performance',
  new Date().toISOString().replaceAll(':', '-') + '-resumed-' + randomUUID().slice(0, 8),
);
await cp(input, out, { recursive: true, errorOnExist: true, force: false });
await writeFile(path.join(out, 'original-failure.json'), JSON.stringify(original, null, 2));
const results = {
  ...original,
  status: 'running',
  errors: [],
  recovery: {
    originalRun: path.relative(process.cwd(), input).replaceAll('\\', '/'),
    originalErrors: original.errors,
    resumedAt: new Date().toISOString(),
    completed: [],
  },
};
let target, server;
try {
  target = await openTarget(config);
  if (
    target.version !== manifest.browser ||
    JSON.stringify(target.graphics) !== JSON.stringify(manifest.graphics) ||
    target.deviceIdentity !== manifest.deviceIdentity
  )
    throw Error('Browser/device/graphics identity changed');
  server = await preview({
    configFile: false,
    build: { outDir: path.join(out, 'build') },
    preview: { host: '127.0.0.1', port: config.port, strictPort: true },
  });
  const origin = `http://127.0.0.1:${config.port}/`;
  for (const scenario of config.scenarios) {
    for (let i = 0; i < config.repeats; i++) {
      const existing = results.samples.filter((s) => s.scenario === scenario && s.repetition === i);
      if (existing.length > 1) throw Error('Duplicate sample');
      if (existing.length) continue;
      console.log(`${scenario}: resumed timing ${i + 1}/${config.repeats}`);
      results.samples.push(await measure(target, origin, config, scenario, i, out));
      results.recovery.completed.push({ scenario, repetition: i });
      await writeReport(out, results);
    }
    if (!results.diagnostics.some((d) => d.scenario === scenario)) {
      console.log(`${scenario}: resumed diagnostic`);
      results.diagnostics.push(await measure(target, origin, config, scenario, 0, out, true));
      results.recovery.completed.push({ scenario, diagnostic: true });
      await writeReport(out, results);
    }
  }
  if (
    results.samples.length !== config.scenarios.length * config.repeats ||
    results.diagnostics.length !== config.scenarios.length
  )
    throw Error('Incomplete result coverage');
  results.status = 'passed';
} catch (error) {
  results.status = 'failed';
  results.errors.push(error.stack || String(error));
  process.exitCode = 1;
} finally {
  await target?.close();
  if (server) await new Promise((resolve) => server.httpServer.close(resolve));
  await writeReport(out, results);
  await writeFile(path.join(out, 'recovery.json'), JSON.stringify(results.recovery, null, 2));
  console.log(`Recovered run ${results.status}: ${out}`);
}
