import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { parseArgs } from 'node:util';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { convertBatch } from './cli.mjs';
import { loadPreset, validatePreset } from './preset.mjs';
import { createPbrForge } from './pbr-forge/index.mjs';

const root = fileURLToPath(new URL('../../', import.meta.url));
const catalog = JSON.parse(await readFile(new URL('./asset-packs.json', import.meta.url), 'utf8'));
const { values } = parseArgs({
  options: {
    force: { type: 'boolean', default: false },
    source: { type: 'string' },
  },
});
if (catalog.version !== 1) throw new Error('Unsupported asset pack catalog version.');
const output = path.join(root, 'tmp/pbr-inventory');
await mkdir(output, { recursive: true });
const jobs = catalog.assets.filter((job) => !values.source || job.source.includes(values.source));
if (!jobs.length) throw new Error('No asset packs match --source.');
const report = [];
let converter;
try {
  for (const [index, job] of jobs.entries()) {
    console.log(`[${index + 1}/${jobs.length}] ${job.source} (${job.preset}/${job.mode})`);
    try {
      const requested = new Set([
        job.preset,
        ...(job.compositions ?? []).map((part) => part.preset),
      ]);
      let failure;
      for (const name of requested) {
        const preset = validatePreset({ ...(await loadPreset(name)), mode: job.mode });
        const result = await convertBatch(
          {
            input: path.join(root, job.source),
            output: path.join(output, path.dirname(job.source)),
            preset,
            force: values.force,
          },
          {
            createConverter: async () => {
              converter ??= await createPbrForge();
              // Reuse a browser across jobs; each conversion still owns a fresh page.
              return { convert: (...args) => converter.convert(...args), close: async () => {} };
            },
          },
        );
        failure ??= result.files.find((file) => file.status === 'failed')?.error;
      }
      report.push({
        ...job,
        status: failure ? 'failed' : 'complete',
        error: failure,
      });
    } catch (error) {
      console.error(`FAIL ${job.source}: ${error.message}`);
      report.push({ ...job, status: 'failed', error: error.message });
    }
    await writeFile(
      path.join(output, 'generation-report.json'),
      JSON.stringify(report, null, 2) + '\n',
    );
  }
} finally {
  await converter?.close();
}
const failed = report.filter((job) => job.status === 'failed').length;
console.log(`${report.length - failed}/${report.length} packs complete; ${failed} failed.`);
process.exitCode = failed ? 1 : 0;
