import test from 'node:test';
import assert from 'node:assert/strict';
import { STAT0 } from '../../src/game/progression/statistics.ts';
import {
  recordSecretEvent,
  preserveSecretDiscoveries,
  reconcileCinematicCompanion,
} from '../../src/game/progression/secret-events.ts';
import { recordRun } from '../../src/game/progression/run-records.ts';
import { createItems } from '../../src/game/content/items.ts';
import { unlockEligibleItems } from '../../src/game/progression/unlocks.ts';

test('every secret trigger sequence records once and grants only at settlement', () => {
  const stats = structuredClone(STAT0);
  const unlocked = new Set();
  const hidden = createItems(() => unlocked).filter((item) => item.hidden);
  const granted = [];
  const settle = () => unlockEligibleItems(stats, unlocked, hidden, (id) => granted.push(id));

  assert.equal(recordSecretEvent(stats, { kind: 'midnight', hour: 22 }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'midnight', hour: 23 }), true);
  assert.equal(recordSecretEvent(stats, { kind: 'midnight', hour: 0 }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'titleTaps', count: 19 }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'titleTaps', count: 20 }), true);
  assert.equal(recordSecretEvent(stats, { kind: 'titleTaps', count: 20 }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'konami' }), true);
  assert.equal(recordSecretEvent(stats, { kind: 'konami' }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'shrineKnocks', count: 2 }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'shrineKnocks', count: 3 }), true);
  assert.equal(recordSecretEvent(stats, { kind: 'scoreClaps', count: 4 }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'scoreClaps', count: 5 }), true);
  assert.equal(recordSecretEvent(stats, { kind: 'pauses', count: 9 }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'pauses', count: 10 }), true);
  assert.equal(recordSecretEvent(stats, { kind: 'feintMistake' }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'feintMistake' }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'feintMistake' }), true);
  assert.equal(recordSecretEvent(stats, { kind: 'mirrorVictory', clean: false }), false);
  assert.equal(recordSecretEvent(stats, { kind: 'mirrorVictory', clean: true }), true);
  assert.equal(stats.mirrorWins, 2);
  assert.equal(recordSecretEvent(stats, { kind: 'cinematic' }), true);
  assert.equal(recordSecretEvent(stats, { kind: 'cinematic' }), false);
  const earlyRun = {
    mode: 'normal',
    blade: false,
    zen: false,
    hard: false,
    rush: false,
    score: 0,
    maxCombo: 0,
    wave: 1,
    runTime: 0,
    reason: 'early',
  };
  for (let i = 0; i < 5; i++) recordRun(stats, earlyRun);
  assert.equal(stats.deaths.early, 5);
  assert.deepEqual(granted, []);
  settle();
  assert.deepEqual(
    granted,
    hidden.map((item) => item.id),
  );
  settle();
  assert.deepEqual(
    granted,
    hidden.map((item) => item.id),
  );
});

test('restoring an older encounter retains discoveries without restoring later run score', () => {
  const current = structuredClone(STAT0),
    old = structuredClone(STAT0);
  current.konami = current.scarecrow = current.cinematicVisits = 1;
  current.feinted = 3;
  current.deaths.early = 5;
  current.bestScore = 9000;
  old.bestScore = 100;
  old.mirrorClean = 1;
  const restored = preserveSecretDiscoveries(old, current);
  assert.equal(restored.konami, 1);
  assert.equal(restored.scarecrow, 1);
  assert.equal(restored.feinted, 3);
  assert.equal(restored.deaths.early, 5);
  assert.equal(restored.mirrorClean, 1);
  assert.equal(restored.bestScore, 100);
  const unlocked = new Set();
  assert.equal(reconcileCinematicCompanion(restored, unlocked), true);
  assert.equal(reconcileCinematicCompanion(restored, unlocked), false);
  assert.deepEqual([...unlocked], ['mystic-rock']);
});
