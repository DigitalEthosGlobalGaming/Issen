import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlayerAnimation,
  startSwing,
  updatePlayerAnimation,
  playerAnimationState,
  playerAnimationTable,
  REST_POSE,
} from '../../src/game/player/player.ts';
test('player states derive from original fields and cover strict swing/block deadlines', () => {
  const p = createPlayerAnimation(),
    keys = Object.keys(p);
  assert.deepEqual(Object.keys(playerAnimationTable), ['idle', 'swing', 'block', 'death']);
  assert.equal(playerAnimationState(p, false), 'idle');
  startSwing(p, 'right');
  assert.equal(playerAnimationState(p, false), 'swing');
  p.swingT = 0.22;
  assert.equal(playerAnimationState(p, false), 'idle');
  startSwing(p, 'block');
  p.swingT = 0.449;
  assert.equal(playerAnimationState(p, false), 'block');
  p.swingT = 0.45;
  assert.equal(playerAnimationState(p, false), 'idle');
  assert.equal(playerAnimationState(p, true), 'death');
  updatePlayerAnimation(p, 0.1, true);
  assert.deepEqual(Object.keys(p), keys);
});
test('animation advances its clock before selecting the deadline-frame pose', () => {
  const p = createPlayerAnimation();
  startSwing(p, 'block');
  p.swingT = 0.4;
  const before = { ...p.pose };
  updatePlayerAnimation(p, 0.05, false);
  assert.equal(p.swingT, 0.45);
  for (const k of Object.keys(before))
    assert.ok(
      Math.abs(p.pose[k] - (before[k] + (REST_POSE[k] - before[k]) * (1 - Math.exp(-0.4)))) < 1e-12,
    );
});
test('fallen pose takes priority while the original swing lean still decays on its own clock', () => {
  const p = createPlayerAnimation();
  startSwing(p, 'left');
  const before = { ...p.pose };
  updatePlayerAnimation(p, 0.1, true);
  const target = { gx: 0.12, gy: -0.4, ang: 1.5 };
  for (const k of Object.keys(before))
    assert.ok(
      Math.abs(p.pose[k] - (before[k] + (target[k] - before[k]) * (1 - Math.exp(-0.4)))) < 1e-12,
    );
  assert.ok(p.lean < 0);
  updatePlayerAnimation(p, 0.1, true);
  assert.ok(p.lean < 0);
});
