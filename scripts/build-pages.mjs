import { execFileSync, spawnSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pagesPath } from './pages-path.mjs';

const args = process.argv.slice(2);
const branchOption = args.indexOf('--branch');
let branch = branchOption >= 0 ? args[branchOption + 1] : process.env.GITHUB_REF_NAME;
if (branchOption >= 0 && !branch) throw new Error('--branch requires a branch name.');
if (!branch)
  branch = execFileSync(
    'git',
    ['-c', 'safe.directory=' + process.cwd().replaceAll('\\', '/'), 'branch', '--show-current'],
    { encoding: 'utf8' },
  ).trim();
if (!branch) throw new Error('Detached HEAD: supply --branch explicitly.');
const repository = process.env.GITHUB_REPOSITORY?.split('/')[1] || 'Issen';
const base = pagesPath(branch, repository);
console.log(`Pages build: ${branch} → ${base}`);
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `base=${base}\n`);
for (const command of [
  ['node_modules/typescript/bin/tsc', '--noEmit'],
  [
    'node_modules/vite/bin/vite.js',
    'build',
    '--base',
    base,
    ...args.filter((_, i) => branchOption < 0 || (i !== branchOption && i !== branchOption + 1)),
  ],
]) {
  const result = spawnSync(process.execPath, command, { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
