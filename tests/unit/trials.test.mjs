import test from 'node:test';
import assert from 'node:assert/strict';
import { TRIALS } from '../../src/game/content/trials.ts';
import { createItems } from '../../src/game/content/items.ts';
import {
  parseTrialProgress,
  trialsUnlocked,
  trialPassed,
  completeTrial,
  grantTrialRewards,
} from '../../src/game/progression/trials.ts';

test('Trials unlock at Ronin wave 10 and reject invalid progress', () => {
  for (const wave of [0, 9, NaN, Infinity]) assert.equal(trialsUnlocked(wave), false);
  assert.equal(trialsUnlocked(10), true);
  for (const value of [null, [], false, { completed: 'unbroken' }])
    assert.deepEqual(parseTrialProgress(value), { completed: [] });
  assert.deepEqual(parseTrialProgress({ completed: ['unknown', 'unbroken', 'unbroken', 42] }), {
    completed: ['unbroken'],
  });
});

test('All trial objectives require the full encounter, and failure overrides completion', () => {
  for (const trial of TRIALS) {
    const result = {
      kills: trial.wave?.total ?? 0,
      perfects: trial.wave?.perfects ?? 0,
      bossesSlain: trial.bosses?.length ?? 0,
      failed: false,
    };
    assert.equal(trialPassed(trial, result), true, trial.id);
    assert.equal(trialPassed(trial, { ...result, failed: true }), false, trial.id);
    assert.equal(trialPassed(trial, { ...result, kills: 0, bossesSlain: 0 }), false, trial.id);
    if (trial.wave?.perfects)
      assert.equal(trialPassed(trial, { ...result, perfects: result.perfects - 1 }), false);
  }
});

test('Rewards are exclusive cosmetics and completion reconciles interrupted writes idempotently', () => {
  const progress = parseTrialProgress(null);
  const unlocks = new Set(['steel']);
  const items = createItems(() => unlocks);
  assert.equal(completeTrial(progress, 'unknown'), false);
  for (const trial of TRIALS) {
    assert.equal(completeTrial(progress, trial.id), true);
    assert.equal(completeTrial(progress, trial.id), false);
    const item = items.find((entry) => entry.id === trial.reward.id);
    assert.ok(['fx', 'film', 'seal'].includes(item.type));
    assert.equal(item.ok({}), false);
    assert.equal(item.m, undefined);
  }
  const restored = parseTrialProgress(JSON.parse(JSON.stringify(progress)));
  grantTrialRewards(restored, unlocks);
  grantTrialRewards(restored, unlocks);
  assert.equal(unlocks.size, TRIALS.length + 1);
});
