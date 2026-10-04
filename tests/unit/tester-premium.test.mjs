import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseTesterPremium,
  testerPremiumActive,
  TESTER_PREMIUM_CAMPAIGN,
} from '../../src/platform/tester-premium.ts';
test('complimentary campaign validates separately from purchase ownership', () => {
  assert.equal(testerPremiumActive({ campaign: TESTER_PREMIUM_CAMPAIGN }), true);
  for (const raw of [
    null,
    true,
    { owned: true },
    { campaign: -1 },
    { campaign: '1' },
    { campaign: 99 },
  ]) {
    assert.equal(testerPremiumActive(raw), false);
    assert.deepEqual(parseTesterPremium(raw), { campaign: 0 });
  }
});
