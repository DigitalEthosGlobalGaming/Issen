import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfileFoundation, createProfileProgress } from '../../src/game/progression/profile-state.ts';
import { parseStatistics, parseSetup } from '../../src/platform/saves.ts';

test('profile persistence follows replaced disposable statistics without changing original profile identity', () => {
  const original = parseStatistics({ kills: 9 });
  const writes = [];
  const services = {
    store: {
      get: (_key, fallback) => fallback,
      set: (key, value) => { writes.push([key, structuredClone(value)]); return key !== 'issen.meta'; },
    },
    loadStatistics: () => original,
    loadSetup: () => parseSetup({}),
    loadUnlocks: () => new Set(['steel', 'sumi']),
    premiumAccess: () => false,
  };
  const foundation = createProfileFoundation(services);
  assert.equal(foundation.ST, original);
  assert.equal(foundation.playerStats, original);
  let current = original;
  const profile = createProfileProgress(services, () => current, foundation.SETUP, foundation.UNL);
  current = parseStatistics({ kills: 31 });
  writes.length = 0;
  assert.equal(profile.saveMeta(), false);
  assert.equal(profile.COLLECTION_PROGRESS.lastStats.kills, 31);
  assert.equal(original.kills, 9);
  assert.deepEqual(writes.map(([key]) => key), ['issen.collections', 'issen.meta']);
  assert.equal(writes[0][1].lastStats.kills, 31);
  assert.notEqual(profile.COLLECTION_PROGRESS.lastStats, current);
});
