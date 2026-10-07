import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { bossPhaseFixture } from './helpers/runtime-boss-phase.mjs';
import { OPP } from '../../src/shared/directions.ts';
const setup = { mode: 'rush', diff: 'normal', arrows: true, lives: '3', upgrades: false };
function fixture() {
  const f = bossPhaseFixture(runStartSession(9123, setup));
  f.phase.startBoss();
  return f;
}

test('boss finger-down parries once, while release after the opening does not repeat it', () => {
  const f = fixture(),
    b = f.views.G.boss;
  b.state = 'flash';
  b.t = 0;
  assert.equal(f.phase.onTapDown(f.views), true);
  f.phase.onTap(f.views);
  assert.equal(f.views.G.parries, 1);
  assert.equal(f.views.ST.parries, 1);
  assert.equal(b.state, 'stagger');
  assert.equal(f.phase.onTapDown(f.views), false);
});

test('wrong boss counter closes the opening, while early tap invokes damage', () => {
  const f = fixture(),
    b = f.views.G.boss;
  b.state = 'stagger';
  b.sdir = 'up';
  b.chainLeft = 1;
  f.views.G.combo = 8;
  f.phase.onSwipe(f.views, OPP[b.sdir]);
  assert.equal(b.state, 'recover');
  assert.equal(b.failed, true);
  assert.equal(f.views.G.combo, 0);
  b.state = 'windup';
  f.phase.onTap(f.views);
  assert.deepEqual(f.trace.at(-1), ['die', b, 'early']);
});

test('boss defeat accrues one victory and preserves the between/shrine boundary', () => {
  const f = fixture(),
    G = f.views.G,
    b = G.boss;
  b.state = 'stagger';
  b.sdir = 'left';
  b.chainLeft = 1;
  b.hp = 1;
  f.phase.onSwipe(f.views, 'left');
  f.phase.onSwipe(f.views, 'left');
  assert.equal(b.state, 'dying');
  assert.equal(G.state, 'between');
  assert.equal(G.afterBoss, true);
  assert.equal(G.nextT, 2.2);
  assert.equal(G.bossesSlain, 1);
  assert.equal(f.views.ST.duels, 1);
  assert.equal(f.views.runBossMilestone, G.bossCount);
  assert.equal(
    f.trace.filter((x) => Array.isArray(x) && x[0] === 'earn' && x[1] === 'boss').length,
    1,
  );
});
