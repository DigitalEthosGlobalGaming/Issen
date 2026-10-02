import test from 'node:test';
import assert from 'node:assert/strict';
import { playerPresence } from '../../src/rendering/figures/player-presence.ts';

test('player breathing keeps ground, equipment and simulation pose fixed and stops during actions', () => {
  const f = {
    x: 100,
    y: 300,
    h: 120,
    fog: 0,
    d: { seed: 7 },
    pose: { gx: 0.19, gy: -0.5, ang: 0.8 },
    back: true,
    waiting: true,
    bladeId: 'steel',
  };
  const before = structuredClone(f);
  const a = playerPresence(f, 0),
    b = playerPresence(f, 0.9);
  assert.notEqual(a.sy, b.sy);
  assert.notEqual(a.pose.gy, b.pose.gy);
  for (const key of ['x', 'y', 'h', 'bladeId']) assert.equal(b[key], f[key]);
  assert.deepEqual(f, before);
  assert.equal(playerPresence(f, 99, true), f);
  assert.equal(playerPresence({ ...f, waiting: false }, 99).sy, undefined);
  assert.equal(playerPresence({ ...f, back: false }, 99).sy, undefined);
});
