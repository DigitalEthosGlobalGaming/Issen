import test from 'node:test';
import assert from 'node:assert/strict';
import { parseStatistics } from '../../src/platform/saves.ts';
import { parseMeta, purchaseUpgrade } from '../../src/game/progression/meta.ts';
import {
  parseCollectionProgress,
  initializeCollections,
  syncCollectionProgress,
  collectionItemStats,
} from '../../src/game/progression/collection-progress.ts';
import { createRunState } from '../../src/game/run-state.ts';
import { COLLECTIONS, collectionBlessings } from '../../src/game/content/collections.ts';
import { BLESS } from '../../src/game/content/blessings.ts';
import { applyBlessing, shrineOffers } from '../../src/game/shrine/blessings.ts';
test('pack access starts cumulative and best challenges at zero and preserves independent ranks', () => {
  const stats = parseStatistics({ perfects: 1000, bestScore: 90000, bestCombo: 100, duels: 100 });
  const meta = parseMeta({ embers: 1000 });
  const progress = parseCollectionProgress(null, stats);
  assert.equal(collectionItemStats(progress, meta, stats, 'kodachi'), null);
  purchaseUpgrade(meta, 'weapons');
  initializeCollections(progress, meta, stats);
  assert.equal(progress.records.weapons1.perfects, 0);
  const run = createRunState();
  Object.assign(run, {
    state: 'playing',
    score: 10000,
    maxCombo: 12,
    wave: 3,
    pStreak: 4,
    perfects: 5,
  });
  stats.perfects += 5;
  syncCollectionProgress(progress, meta, stats, run);
  assert.equal(progress.records.weapons1.perfects, 5);
  assert.equal(progress.records.weapons1.bestScore, 10000);
  assert.equal(progress.records.weapons1.bestCombo, 12);
  purchaseUpgrade(meta, 'weapons');
  initializeCollections(progress, meta, stats);
  stats.perfects += 2;
  syncCollectionProgress(progress, meta, stats, run);
  assert.equal(progress.records.weapons1.perfects, 7);
  assert.equal(progress.records.weapons2.perfects, 2);
  assert.deepEqual(
    parseCollectionProgress(JSON.parse(JSON.stringify(progress))).records,
    progress.records,
  );
});
test('every collection rank has five entries and locked Shrine content stays out of offers and Twin', () => {
  for (const packs of Object.values(COLLECTIONS))
    for (const pack of packs) assert.equal(pack.length, 5);
  const allowed = collectionBlessings(
    { weapons: 0, outfits: 0, blessings: 0, curses: 0 },
    BLESS.map((b) => b.id),
  );
  const state = {
    bless: new Set(),
    availableBlessings: allowed,
    zen: false,
    hard: false,
    lives: 2,
    maxLives: 2,
    runWards: 0,
    bossCount: 5,
    m: { noShrine: 0, shrineN: 10, rare: 0, rareShrine: 0 },
  };
  assert.ok(!allowed.includes('fox'));
  assert.ok(!allowed.includes('frenzy'));
  assert.ok(shrineOffers(state, () => 0.2).every((b) => allowed.includes(b.id)));
  assert.ok(applyBlessing(state, 'twin', () => 0.2).every((b) => allowed.includes(b.id)));
});
