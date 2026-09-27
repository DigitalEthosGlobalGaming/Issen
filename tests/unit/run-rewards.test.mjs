import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMeta } from '../../src/game/progression/meta.ts';
import {
  createRunRewardLedger,
  accrueRunReward,
  settleRunReward,
} from '../../src/game/progression/run-rewards.ts';

test('combat accrues no persistent Embers until a run is settled once', () => {
  const meta = parseMeta({ embers: 40, earned: 90 });
  const ledger = createRunRewardLedger();
  accrueRunReward(ledger, 'kill');
  accrueRunReward(ledger, 'wave');
  accrueRunReward(ledger, 'boss');
  assert.equal(meta.embers, 40);
  assert.equal(meta.earned, 90);
  assert.deepEqual(settleRunReward(meta, ledger), { before: 40, gained: 15, after: 55 });
  assert.equal(meta.emberRemainder, 50);
  assert.deepEqual(settleRunReward(meta, ledger), { before: 40, gained: 15, after: 55 });
  assert.equal(meta.earned, 105);
});

test('half-rate one-Ember events accumulate and equipment fractions survive reload', () => {
  const meta = parseMeta(null);
  const first = createRunRewardLedger();
  accrueRunReward(first, 'kill', { emberBonus: 0.1 });
  assert.equal(settleRunReward(meta, first).gained, 0);
  assert.equal(meta.emberRemainder, 55);
  const reloaded = parseMeta(JSON.parse(JSON.stringify(meta)));
  const second = createRunRewardLedger();
  accrueRunReward(second, 'kill', { emberBonus: 0.1 });
  assert.equal(settleRunReward(reloaded, second).gained, 1);
  assert.equal(reloaded.emberRemainder, 10);
});

test('Zen, tutorial and testing events cannot add to the run ledger', () => {
  const meta = parseMeta(null);
  const ledger = createRunRewardLedger();
  for (const context of [{ zen: true }, { tutorial: true }, { testing: true }])
    accrueRunReward(ledger, 'boss', context);
  assert.equal(settleRunReward(meta, ledger).gained, 0);
});
