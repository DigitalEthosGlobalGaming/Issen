import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { shrinePhaseFixture } from './helpers/runtime-shrine-phase.mjs';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
const fixture = () => shrinePhaseFixture(runStartSession(9361, setup));

test('actual shrine offers checkpoint before display and one choice advances exactly once', () => {
  const f = fixture(),
    G = f.views.G;
  G.bossCount = 2;
  f.phase.openShrine();
  assert.equal(G.state, 'shrine');
  assert.ok(f.offers.length > 0);
  assert.equal(new Set(f.offers.map((b) => b.id)).size, f.offers.length);
  assert.deepEqual(f.trace[0], ['checkpoint', f.offers.map((b) => b.id)]);
  const chosen = f.offers[0];
  f.phase.pick(chosen);
  f.phase.pick(chosen);
  assert.equal(G.bless.has(chosen.id), true);
  assert.equal(f.views.ST.shrines, 1);
  assert.equal(f.views.shrineOfferIds, null);
  assert.equal(f.trace.filter((x) => x === 'next').length, 1);
});

test('shrine reroll requires access and consumes one available charge with saved replacement offers', () => {
  const f = fixture();
  f.phase.openShrine();
  f.views.G.shrineRerolls = 1;
  const before = structuredClone(f.views.shrineOfferIds);
  f.views.premiumAccess = () => false;
  f.phase.reroll();
  assert.equal(f.views.G.shrineRerolls, 1);
  assert.deepEqual(f.views.shrineOfferIds, before);
  f.views.premiumAccess = () => true;
  f.phase.reroll();
  f.phase.reroll();
  assert.equal(f.views.G.shrineRerolls, 0);
  assert.deepEqual(
    f.views.shrineOfferIds,
    f.offers.map((b) => b.id),
  );
  assert.equal(f.trace.filter((x) => Array.isArray(x) && x[0] === 'checkpoint').length, 2);
});

test('no-shrine modifier advances without generating or displaying choices', () => {
  const f = fixture();
  f.views.G.m.noShrine = true;
  f.phase.openShrine();
  assert.deepEqual(f.trace, ['next']);
  assert.equal(f.offers.length, 0);
});
