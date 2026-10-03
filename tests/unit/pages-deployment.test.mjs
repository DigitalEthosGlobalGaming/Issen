import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pagesPath, previewDirectory } from '../../scripts/pages-path.mjs';
import { assemblePages } from '../../scripts/assemble-pages.mjs';

test('Pages paths preserve repository case and separate arbitrary branch names', () => {
  assert.equal(pagesPath('main'), '/Issen/');
  assert.equal(pagesPath('develop'), '/Issen/develop/');
  assert.equal(pagesPath('combat-test'), '/Issen/combat-test/');
  assert.notEqual(previewDirectory('feature/combat'), previewDirectory('feature-combat'));
  assert.notEqual(previewDirectory('Feature/combat'), previewDirectory('feature/combat'));
  assert.notEqual(previewDirectory('assets'), 'assets');
  assert.match(previewDirectory('../../combat'), /^[a-z0-9-]+$/);
  assert.throws(() => pagesPath(''));
  assert.throws(() => pagesPath('gh-pages'));
});

test('Updating any build retains other branches and removes its stale assets', () => {
  const root = mkdtempSync(join(tmpdir(), 'issen-pages-'));
  try {
    const build = join(root, 'build'),
      site = join(root, 'site');
    mkdirSync(build);
    writeFileSync(join(build, 'index.html'), 'production');
    writeFileSync(join(build, 'old.js'), 'old asset');
    assemblePages(build, site, 'main');
    writeFileSync(join(build, 'index.html'), 'develop');
    assemblePages(build, site, 'develop');
    writeFileSync(join(build, 'index.html'), 'experiment');
    assemblePages(build, site, 'feature/combat');
    assert.equal(readFileSync(join(site, 'index.html'), 'utf8'), 'production');
    assert.equal(readFileSync(join(site, 'develop/index.html'), 'utf8'), 'develop');
    rmSync(join(build, 'old.js'));
    writeFileSync(join(build, 'index.html'), 'new production');
    assemblePages(build, site, 'main');
    assert.equal(existsSync(join(site, 'old.js')), false);
    assert.equal(readFileSync(join(site, 'develop/index.html'), 'utf8'), 'develop');
    writeFileSync(join(build, 'index.html'), 'new develop');
    assemblePages(build, site, 'develop');
    assert.equal(existsSync(join(site, 'develop/old.js')), false);
    assert.equal(
      readFileSync(join(site, previewDirectory('feature/combat'), 'index.html'), 'utf8'),
      'experiment',
    );
    assert.equal(readFileSync(join(site, 'index.html'), 'utf8'), 'new production');
    assert.equal(existsSync(join(site, '.nojekyll')), true);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('Assembly rejects an unseeded preview and production directory collisions', () => {
  const root = mkdtempSync(join(tmpdir(), 'issen-pages-'));
  try {
    const build = join(root, 'build'),
      site = join(root, 'site');
    mkdirSync(build);
    writeFileSync(join(build, 'index.html'), 'production');
    assert.throws(() => assemblePages(build, site, 'develop'), /Seed production/);
    assemblePages(build, site, 'main');
    mkdirSync(join(site, 'combat'));
    writeFileSync(join(site, 'combat/index.html'), 'production content');
    assert.throws(() => assemblePages(build, site, 'combat'), /overwrite production/);
    assemblePages(build, site, 'develop');
    mkdirSync(join(build, 'develop'));
    assert.throws(() => assemblePages(build, site, 'main'), /collide/);
    assert.throws(() => assemblePages(site, site, 'main'), /separate/);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});
