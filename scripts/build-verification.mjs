import { spawnSync } from 'node:child_process';

const outDir = process.env.ISSEN_PREVIEW_DIR ?? 'tmp/.verification-build-production';
for (const command of [
  ['node_modules/typescript/bin/tsc', '--noEmit'],
  ['node_modules/vite/bin/vite.js', 'build', '--outDir', outDir, ...process.argv.slice(2)],
]) {
  const result = spawnSync(process.execPath, command, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
