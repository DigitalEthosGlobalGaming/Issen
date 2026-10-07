import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlayerAnimation,
  startSwing,
  updatePlayerAnimation,
  REST_POSE,
} from '../../src/game/player/player.ts';
import { comboMultiplier, scoreGain } from '../../src/game/progression/scoring.ts';

test('player swings begin opposite the cut and instances do not share pose state', () => {
  const a = createPlayerAnimation(),
    b = createPlayerAnimation();
  startSwing(a, 'left');
  assert.equal(a.pose.gx, 0.27);
  updatePlayerAnimation(a, 0.1, false);
  assert.ok(a.pose.gx < 0.27);
  assert.ok(a.lean < 0);
  assert.deepEqual(b.pose, REST_POSE);
  assert.notEqual(a.d, b.d);
});

test('block pose recovers and fallen animation takes precedence', () => {
  const p = createPlayerAnimation();
  startSwing(p, 'block');
  updatePlayerAnimation(p, 0.1, false);
  assert.ok(p.pose.gy < -0.7);
  for (let i = 0; i < 50; i++) updatePlayerAnimation(p, 0.05, false);
  assert.ok(Math.abs(p.pose.gy - REST_POSE.gy) < 0.001);
  startSwing(p, 'up');
  for (let i = 0; i < 50; i++) updatePlayerAnimation(p, 0.05, true);
  assert.ok(Math.abs(p.pose.gy + 0.4) < 0.001);
});

test('combo thresholds and score bonuses preserve multiplication and final rounding', () => {
  const mods = { comboCap: 4, comboStep: 5 };
  assert.equal(comboMultiplier(4, mods), 1);
  assert.equal(comboMultiplier(5, mods), 1.5);
  assert.equal(comboMultiplier(100, mods), 4);
  assert.equal(comboMultiplier(6, { comboCap: 6, comboStep: 3 }), 2);
  const run = {
    mode: 'ronin',
    blade: true,
    hard: true,
    event: 'blood',
    scars: 2,
    m: { score: 1.25, bladeScore: 1.2, scarScore: 0.1 },
  };
  assert.equal(scoreGain(13, run), Math.round(13 * 2 * 1.5 * 1.25 * 2 * 1.5 * 1.2 * 1.2));
  assert.equal(
    scoreGain(13, { ...run, mode: 'normal', blade: false, hard: false, event: null, scars: 0 }),
    16,
  );
});
