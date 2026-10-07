import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Pillow is also used by scripts/pbr/install-packs.py. Set ISSEN_PYTHON when
// the Python installation with Pillow is not the default python executable.
export function compact({ root = path.resolve(import.meta.dirname, '../..'), apply = false } = {}) {
  const result = spawnSync(process.env.ISSEN_PYTHON ?? 'python', [
    fileURLToPath(new URL('./compact.py', import.meta.url)), '--root', root,
    ...(apply ? ['--apply'] : []),
  ], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`Asset compaction failed (${result.status}).`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  if (args.some((arg) => arg !== '--apply')) throw new Error('Usage: node scripts/assets/compact.mjs [--apply]');
  compact({ apply: args.includes('--apply') });
}
