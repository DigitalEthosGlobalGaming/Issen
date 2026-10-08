import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Pillow is also used by scripts/pbr/install-packs.py. Set ISSEN_PYTHON when
// the Python installation with Pillow is not the default python executable.
export function compact({
  root = path.resolve(import.meta.dirname, '../..'),
  apply = false,
  retainGeneratedPng = false,
  workers = Number(process.env.ISSEN_ASSET_WORKERS ?? 4),
} = {}) {
  if (!Number.isInteger(workers) || workers < 1 || workers > 8)
    throw new RangeError('Encoding workers must be between 1 and 8');
  const result = spawnSync(
    process.env.ISSEN_PYTHON ?? 'python',
    [
      fileURLToPath(new URL('./compact.py', import.meta.url)),
      '--root',
      root,
      '--workers',
      String(workers),
      ...(apply ? ['--apply'] : []),
      ...(retainGeneratedPng ? ['--retain-generated-png'] : []),
    ],
    { stdio: 'inherit' },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Asset compaction failed (${result.status}).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => !['--apply', '--retain-generated-png'].includes(arg)))
    throw new Error('Usage: node scripts/assets/compact.mjs [--apply] [--retain-generated-png]');
  compact({
    apply: args.includes('--apply'),
    retainGeneratedPng: args.includes('--retain-generated-png'),
  });
}
