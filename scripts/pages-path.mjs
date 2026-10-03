import { createHash } from 'node:crypto';

// Keep simple branch names readable; normalize other names with a collision-safe suffix.
export function previewDirectory(branch) {
  if (!branch || branch === 'gh-pages') throw new Error('Select a source branch.');
  const reserved = new Set(['main', 'assets', 'changelog', 'privacy', 'licenses', 'ai-disclosure']);
  if (/^[a-z][a-z0-9-]{0,63}$/.test(branch) && !reserved.has(branch)) return branch;
  const label =
    branch
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'branch';
  return `${label}-${createHash('sha256').update(branch).digest('hex').slice(0, 12)}`;
}

export function pagesPath(branch, repository = 'Issen') {
  if (!/^[a-zA-Z0-9_.-]+$/.test(repository)) throw new Error('Invalid repository name.');
  return `/${repository}/${branch === 'main' ? '' : `${previewDirectory(branch)}/`}`;
}
