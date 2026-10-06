import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../../', import.meta.url));
const outputs = ['landmarks', 'scenery', 'drift', 'figures', 'ui', 'reference'];
export async function validatePackedAssets() {
  for (const name of outputs) {
    const output = `src/rendering/generated/${name}`;
    const manifest = JSON.parse(await readFile(path.join(root, output, 'manifest.json'), 'utf8'));
    if (manifest.version !== 1 || !manifest.pageHashes)
      throw Error('Invalid packed asset manifest; run npm run assets:build.');
    const expected = {
      ...manifest.sources,
      ...Object.fromEntries(
        Object.entries(manifest.pageHashes).map(([name, hash]) => [`${output}/${name}`, hash]),
      ),
    };
    for (const [filename, hash] of Object.entries(expected)) {
      const resolved = path.resolve(root, filename);
      if (!resolved.startsWith(root)) throw Error('Packed asset path escapes repository');
      const actual = createHash('sha256')
        .update(await readFile(resolved))
        .digest('hex');
      if (actual !== hash)
        throw Error(`Packed assets are stale or corrupt: ${filename}. Run npm run assets:build.`);
    }
  }
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!process.argv.includes('--check')) {
    for (const name of outputs) {
      const output = `src/rendering/generated/${name}`;
      execFileSync(
        process.execPath,
        [`scripts/assets/${name === 'landmarks' ? 'landmark' : name}-spec.mjs`],
        {
          cwd: root,
          stdio: 'inherit',
          windowsHide: true,
        },
      );
      execFileSync(
        process.env.PBR_PYTHON ?? 'python',
        [
          'scripts/assets/pack.py',
          '--input',
          `tmp/asset-pipeline/${name}.json`,
          '--output',
          output,
          '--size',
          '2048',
        ],
        { cwd: root, stdio: 'inherit', windowsHide: true },
      );
    }
  }
  await validatePackedAssets();
  console.log('Packed asset source and page hashes verified.');
}
