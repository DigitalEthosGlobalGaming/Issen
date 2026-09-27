import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseAwakeningProgress,
  recordChallenge,
} from '../../src/game/progression/awakening-progress.ts';
import { throwKnife } from '../../src/game/combat/knife.ts';
import { normalLives } from '../../src/game/equipment/lives.ts';
import { parseMeta, templateModifiers } from '../../src/game/progression/meta.ts';
import { unlockEligibleItems } from '../../src/game/progression/unlocks.ts';
import { createItems } from '../../src/game/content/items.ts';
import { parseStatistics } from '../../src/platform/saves.ts';

test('first awakening rank cannot track or unlock outfits even with saved progress', () => {
  const progress = parseAwakeningProgress(null);
  recordChallenge(progress, 1, 'steel', 'sumi', 'k', 999);
  assert.equal(progress.blades.steel.k, 999);
  assert.deepEqual(progress.robes, {});
  recordChallenge(progress, 2, 'steel', 'sumi', 'k', 999);
  const unlocked = new Set(['steel', 'sumi']);
  const items = createItems(() => unlocked);
  const stats = parseStatistics({});
  unlockEligibleItems(stats, unlocked, items, () => {}, { access: 1, progress });
  assert.equal(unlocked.has('steel+'), true);
  assert.equal(unlocked.has('sumi+'), false);
  unlockEligibleItems(stats, unlocked, items, () => {}, { access: 2, progress });
  assert.equal(unlocked.has('sumi+'), true);
});

test('awakening access gates new progress independently of ordinary lifetime statistics', () => {
  const progress = parseAwakeningProgress(null);
  recordChallenge(progress, false, 'steel', 'sumi', 'k', 99);
  assert.deepEqual(progress.blades, {});
  assert.deepEqual(progress.robes, {});
  recordChallenge(progress, true, 'steel', 'sumi', 'k');
  assert.equal(progress.blades.steel.k, 1);
  assert.equal(progress.robes.sumi.k, 1);
  recordChallenge(progress, false, 'steel', 'sumi', 'k');
  assert.equal(progress.blades.steel.k, 1);
});

test('blade legacy progress migrates once while robe challenges start independently', () => {
  const legacy = { steel: { k: 12, p: 4, w: 6, d: -1, sc: Infinity } };
  const migrated = parseAwakeningProgress(null, legacy);
  assert.deepEqual(migrated.blades.steel, { k: 12, p: 4, w: 6, d: 0, rw: 0, c: 0, sc: 0 });
  assert.deepEqual(migrated.robes, {});
  const reloaded = parseAwakeningProgress(JSON.parse(JSON.stringify(migrated)), {
    steel: { k: 999 },
  });
  assert.equal(reloaded.blades.steel.k, 12);
  recordChallenge(reloaded, true, 'steel', 'sumi', 'k');
  assert.equal(reloaded.blades.steel.k, 13);
  assert.equal(reloaded.robes.sumi.k, 1);
  assert.equal(legacy.steel.k, 12);
});

test('equipped blade and robe counters are independent and personal bests never sum', () => {
  const progress = parseAwakeningProgress(null);
  recordChallenge(progress, true, 'steel', 'sumi', 'k', 2);
  recordChallenge(progress, true, 'kuro', 'sumi', 'k', 3);
  recordChallenge(progress, true, 'kuro', 'shiro', 'p', 2);
  assert.equal(progress.blades.steel.k, 2);
  assert.equal(progress.blades.kuro.k, 3);
  assert.equal(progress.robes.sumi.k, 5);
  assert.equal(progress.robes.shiro.k, 0);
  for (const metric of ['w', 'rw', 'c', 'sc']) {
    recordChallenge(progress, true, 'steel', 'sumi', metric, 10);
    recordChallenge(progress, true, 'steel', 'sumi', metric, 5);
    assert.equal(progress.blades.steel[metric], 10);
    assert.equal(progress.robes.sumi[metric], 10);
  }
  recordChallenge(progress, true, 'steel', 'sumi', 'k', -1);
  recordChallenge(progress, true, 'steel', 'sumi', 'k', Infinity);
  assert.equal(progress.blades.steel.k, 2);
});

test('knife selects a living ordinary target and spends exactly one charge', () => {
  const idle = { state: 'idle' },
    attack = { state: 'attack' },
    dying = { state: 'dying' };
  const run = { state: 'playing', panel: null, knives: 3, enemies: [dying, idle, attack] };
  assert.equal(
    throwKnife(run, () => 0),
    idle,
  );
  assert.equal(run.knives, 2);
  assert.equal(
    throwKnife(run, () => 0.99),
    attack,
  );
  assert.equal(run.knives, 1);
  // The rules helper selects only; authoritative kill effects and rewards belong
  // to runtime and must not be implied by this focused unit test.
  assert.equal(idle.state, 'idle');
});

test('knife never spends on bosses, standoffs, UI, pause, death, no targets or no charges', () => {
  const enemy = { state: 'idle' };
  for (const state of [
    'boss',
    'standoff',
    'paused',
    'title',
    'between',
    'shrine',
    'dead',
    'over',
  ]) {
    const run = { state, knives: 2, enemies: [enemy] };
    assert.equal(throwKnife(run), null, state);
    assert.equal(run.knives, 2, state);
  }
  for (const panel of ['admin', 'setup', 'template']) {
    const run = { state: 'playing', panel, knives: 2, enemies: [enemy] };
    assert.equal(throwKnife(run), null);
    assert.equal(run.knives, 2);
  }
  for (const enemies of [[], [{ state: 'dying' }], [{ state: 'enter' }]]) {
    const run = { state: 'playing', knives: 2, enemies };
    assert.equal(throwKnife(run), null);
    assert.equal(run.knives, 2);
  }
  const empty = { state: 'playing', knives: 0, enemies: [enemy] };
  assert.equal(throwKnife(empty), null);
  assert.equal(empty.knives, 0);
});

test('Normal lives uses two baseline, uncapped bonuses and safe minimum', () => {
  for (const [bonus, lives] of [
    [0, 2],
    [1, 3],
    [2, 4],
    [3, 5],
    [9, 11],
    [-1, 1],
    [-100, 1],
    [Infinity, 2],
    [NaN, 2],
  ]) {
    assert.equal(normalLives(bonus), lives);
  }
  const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3' };
  const meta = parseMeta({ schemaVersion: 2, upgrades: { vitality: 3 } });
  assert.equal(normalLives(templateModifiers(meta, setup).lives), 5);
  assert.equal(normalLives(templateModifiers(meta, { ...setup, upgrades: false }).lives), 2);
  const migrated = parseMeta({ upgrades: { vitality: 1 } });
  assert.equal(normalLives(templateModifiers(migrated, setup).lives), 4);
});
