import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { standoffPhaseFixture } from './helpers/runtime-standoff-phase.mjs';
import { OPP } from '../../src/shared/directions.ts';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
const fixture = () => standoffPhaseFixture(runStartSession(6413, setup));

test('actual standoff controller creates a challenger and resolves one valid cut into the next wave', () => {
  const f = fixture(),
    G = f.views.G;
  f.phase.startStandoff(4, true);
  assert.equal(G.state, 'standoff');
  assert.equal(G.pendingSpawns.length, 0);
  const enemy = G.so.e;
  for (let i = 0; i < 1000 && !G.so.fired; i++) f.phase.update(f.views, 0.01);
  assert.equal(G.so.fired, true);
  f.phase.onSwipe(f.views, enemy.dir);
  f.phase.onSwipe(f.views, enemy.dir);
  assert.equal(enemy.state, 'dying');
  assert.equal(G.kills, 1);
  assert.equal(G.combo, 1);
  assert.equal(f.views.ST.standoffs, 1);
  assert.ok(G.score > 0);
  f.phase.update(f.views, 1.5);
  assert.equal(G.so, null);
  assert.deepEqual(f.trace.at(-1), ['wave', 4, true]);
  assert.equal(f.trace.filter((x) => Array.isArray(x) && x[0] === 'earn').length, 1);
});

test('actual standoff controller rejects early swipe/tap, wrong direction and late input', () => {
  for (const kind of ['swipe', 'tap', 'wrong', 'late']) {
    const f = fixture(),
      G = f.views.G;
    f.phase.startStandoff(4, false);
    const enemy = G.so.e;
    if (kind === 'swipe') f.phase.onSwipe(f.views, enemy.dir);
    if (kind === 'tap') f.phase.onTap(f.views);
    if (kind === 'wrong' || kind === 'late') {
      f.phase.update(f.views, G.so.fireAt);
      if (kind === 'wrong') f.phase.onSwipe(f.views, OPP[enemy.dir]);
      else f.phase.update(f.views, G.so.win + 0.01);
    }
    assert.deepEqual(
      f.trace.find((x) => Array.isArray(x) && x[0] === 'die'),
      ['die', enemy, kind === 'wrong' ? 'wrong' : kind === 'late' ? 'late' : 'early'],
    );
    assert.equal(G.kills, 0);
  }
});

test('standoff setup waits for readiness before consuming encounter RNG', () => {
  const f = fixture();
  let begin;
  f.views.deferUntilSceneReady = (callback) => {
    begin = callback;
    return true;
  };
  const before = f.views.combatRandom.state;
  f.phase.startStandoff(4, false);
  assert.equal(f.views.G.so, null);
  assert.equal(f.trace.length, 0);
  f.views.deferUntilSceneReady = () => false;
  begin();
  assert.ok(f.views.G.so);
  assert.equal(f.trace.includes('checkpoint'), true);
});
