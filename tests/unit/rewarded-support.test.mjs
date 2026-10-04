import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardedSupport } from '../../src/platform/rewarded-support.ts';
import { createRunRewardLedger, settleRunReward } from '../../src/game/progression/run-rewards.ts';
import { parseMeta } from '../../src/game/progression/meta.ts';
test('provider completion, cancellation, exceptions and concurrent claims', async () => {
  let finish;
  let calls = 0;
  const rewards = createRewardedSupport({
    claim: () => {
      calls++;
      return new Promise((r) => (finish = r));
    },
  });
  const pending = rewards.claim('revive', false);
  assert.equal(await rewards.claim('revive', false), false);
  finish(true);
  assert.equal(await pending, true);
  assert.equal(calls, 1);
  assert.equal(
    await createRewardedSupport({ claim: async () => false }).claim('embers', false),
    false,
  );
  assert.equal(
    await createRewardedSupport({
      claim: async () => {
        throw Error();
      },
    }).claim('embers', false),
    false,
  );
  assert.equal(await rewards.claim('revive', true), true);
  assert.equal(calls, 1);
});
test('doubling applies to this run only and settles once with fractional carry', () => {
  const meta = parseMeta({ embers: 20, earned: 20, emberRemainder: 50 });
  const ledger = createRunRewardLedger();
  ledger.pending = 150;
  ledger.supportMultiplier = 2;
  assert.deepEqual(settleRunReward(meta, ledger), { before: 20, gained: 3, after: 23 });
  assert.equal(meta.emberRemainder, 50);
  assert.equal(settleRunReward(meta, ledger).after, 23);
  assert.equal(meta.embers, 23);
});
