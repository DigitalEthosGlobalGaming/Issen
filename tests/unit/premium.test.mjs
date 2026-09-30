import test from 'node:test';
import assert from 'node:assert/strict';
import { createPremium, hasPremium } from '../../src/platform/premium.ts';
import { SUPPORTER_FILM_ITEM } from '../../src/game/content/items.ts';
import { STAT0 } from '../../src/game/progression/statistics.ts';
const info = (owned, verification = 'VERIFIED') => ({
  entitlements: {
    verification,
    active: owned ? { premium: { isActive: true, verification } } : {},
  },
});
function fixture() {
  let customer = info(false),
    purchases = 0,
    error = null;
  const premium = createPremium({
    customer: async () => {
      if (error) throw error;
      return customer;
    },
    price: async () => 'A$4.99',
    purchase: async () => {
      purchases++;
      if (error) throw error;
      return customer;
    },
    restore: async () => {
      if (error) throw error;
      return customer;
    },
  });
  return {
    premium,
    set: (value) => (customer = value),
    fail: (value) => (error = value),
    purchases: () => purchases,
  };
}
test('Premium is a verified entitlement, never an earned gameplay unlock', () => {
  assert.equal(hasPremium(info(true)), true);
  assert.equal(hasPremium(info(true, 'FAILED')), false);
  assert.equal(hasPremium(info(false)), false);
  assert.equal(SUPPORTER_FILM_ITEM.ok(STAT0), false);
});
test('purchase, pending state, restore and revocation reconcile ownership', async () => {
  const f = fixture();
  await f.premium.refresh();
  assert.equal(f.premium.state.price, 'A$4.99');
  await f.premium.purchase(); // Pending/unconfirmed customer info does not grant.
  assert.equal(f.premium.state.owned, false);
  f.set(info(true));
  await f.premium.restore();
  assert.equal(f.premium.state.owned, true);
  f.set(info(false));
  await f.premium.refresh();
  assert.equal(f.premium.state.owned, false);
});
test('network failure retains verified ownership; cancellation grants nothing', async () => {
  const f = fixture();
  await f.premium.refresh();
  f.fail({ userCancelled: true });
  await f.premium.purchase();
  assert.equal(f.premium.state.owned, false);
  assert.match(f.premium.state.message, /cancelled/);
  f.fail(null);
  f.set(info(true));
  await f.premium.restore();
  f.fail(new Error('offline'));
  await f.premium.refresh();
  assert.equal(f.premium.state.owned, true);
});
test('rapid duplicate taps do not start duplicate checkout', async () => {
  const f = fixture();
  await f.premium.refresh();
  await Promise.all([f.premium.purchase(), f.premium.purchase()]);
  assert.equal(f.purchases(), 1);
});
test('web/unconfigured billing is unavailable and cannot grant purchases', async () => {
  const p = createPremium(null);
  await p.purchase();
  await p.restore();
  await p.refresh();
  assert.equal(p.available, false);
  assert.equal(p.state.owned, false);
});
