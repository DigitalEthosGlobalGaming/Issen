import test from 'node:test';
import assert from 'node:assert/strict';
import { createRewardedSupport } from '../../src/platform/rewarded-support.ts';
import {
  createRunRewardLedger,
  settleRunReward,
  grantSupportEmberBonus,
  supportEmberBonusAmount,
} from '../../src/game/progression/run-rewards.ts';
import { parseMeta } from '../../src/game/progression/meta.ts';

test('advertised extra Embers match fractional carry and currency cap', () => {
  const meta = parseMeta({ embers: 12, emberRemainder: 50 });
  assert.equal(supportEmberBonusAmount(meta, 1250), 13);
  assert.equal(supportEmberBonusAmount(meta, 0), 0);
  assert.equal(supportEmberBonusAmount(meta, 20), 0);
  assert.equal(supportEmberBonusAmount(meta, NaN), 0);
  assert.equal(supportEmberBonusAmount(parseMeta({ embers: 1_000_000_000 }), 1250), 0);
  const capped = parseMeta({ embers: 999_999_999 });
  assert.equal(supportEmberBonusAmount(capped, 1250), 1);
  assert.equal(grantSupportEmberBonus(capped, 'cap', 1250).gained, 1);
  assert.equal(grantSupportEmberBonus(meta, 'fraction', 1250).gained, 13);
});
test('post-tally bonus claim is idempotent across reload', () => {
  const meta = parseMeta({ embers: 12, emberRemainder: 50 });
  assert.deepEqual(grantSupportEmberBonus(meta, 'bonus1', 1250), {
    before: 12,
    gained: 13,
    after: 25,
  });
  const restored = parseMeta(JSON.parse(JSON.stringify(meta)));
  assert.equal(grantSupportEmberBonus(restored, 'bonus1', 1250), null);
  assert.equal(restored.embers, 25);
});
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
