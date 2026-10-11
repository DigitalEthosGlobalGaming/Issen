import test from 'node:test';
import assert from 'node:assert/strict';
import { autoplayAction } from '../../src/input/autoplay.ts';
import { createRunState } from '../../src/game/run-state.ts';

test('autoplay reads true feint directions and respects ordered entry', () => {
  const G = createRunState();
  G.state = 'playing';
  G.enemies = [
    { state: 'idle', dir: 'left', fake: 'right', order: 2 },
    { state: 'enter', dir: 'up', order: 1 },
  ];
  assert.equal(autoplayAction(G, true), null);
  G.enemies[1].state = 'dying';
  assert.deepEqual(autoplayAction(G, true), { kind: 'swipe', direction: 'left' });
  assert.deepEqual(autoplayAction(G, false, true), { kind: 'swipe', direction: 'right' });
});

test('autoplay waits for boss flash, then follows true chain directions', () => {
  const G = createRunState();
  G.state = 'boss';
  G.boss = { state: 'windup', sdir: 'down', def: { mirror: true } };
  for (const state of ['enter', 'idle', 'windup', 'feint', 'recover', 'hurt', 'dying']) {
    G.boss.state = state;
    assert.equal(autoplayAction(G, false), null);
  }
  G.boss.state = 'flash';
  assert.deepEqual(autoplayAction(G, false), { kind: 'parry' });
  G.boss.state = 'stagger';
  assert.deepEqual(autoplayAction(G, false), { kind: 'swipe', direction: 'down' });
  G.boss.sdir = 'up';
  assert.deepEqual(autoplayAction(G, false), { kind: 'swipe', direction: 'up' });
});

test('autoplay never cuts early in standoff or acts while paused', () => {
  const G = createRunState();
  G.state = 'standoff';
  G.so = { fired: false, done: false, e: { dir: 'right' } };
  assert.equal(autoplayAction(G, false), null);
  G.so.fired = true;
  assert.deepEqual(autoplayAction(G, false), { kind: 'swipe', direction: 'right' });
  G.so.done = true;
  assert.equal(autoplayAction(G, false), null);
  for (const state of ['paused', 'title', 'over', 'dead', 'shrine', 'between']) {
    G.state = state;
    assert.equal(autoplayAction(G, false), null);
  }
});
