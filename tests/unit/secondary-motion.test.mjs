import test from 'node:test';
import assert from 'node:assert/strict';
import { createSecondaryMotion } from '../../src/rendering/figures/secondary-motion.ts';

test('attacks apply directional motion, settle and remain bounded under repeated cuts', () => {
  const left = createSecondaryMotion(),
    right = createSecondaryMotion();
  left.kick('left');
  right.kick('right');
  for (let i = 0; i < 6; i++) {
    left.update(1 / 120);
    right.update(1 / 120);
  }
  assert.ok(right.sample().cloth > 0 && right.sample().charm > 0);
  assert.equal(left.sample().cloth, -right.sample().cloth);
  assert.equal(left.sample().charm, -right.sample().charm);
  for (let i = 0; i < 360; i++) right.update(1 / 120);
  assert.ok(Math.abs(right.sample().cloth) < 0.00001);
  assert.ok(Math.abs(right.sample().charm) < 0.00001);
  for (const direction of ['left', 'right', 'up', 'down', 'block'])
    for (let i = 0; i < 100; i++) {
      right.kick(direction);
      right.update(1 / 60);
      assert.ok(Math.abs(right.sample().cloth) <= 0.085);
      assert.ok(Math.abs(right.sample().charm) <= 0.48);
    }
  const before = right.sample();
  right.update(0);
  assert.deepEqual(right.sample(), before);
  right.update(0.02, true);
  assert.deepEqual(right.sample(), { cloth: 0, charm: 0 });
  right.kick('right', true);
  right.update(0.02);
  assert.deepEqual(right.sample(), { cloth: 0, charm: 0 });
});

test('perfect cuts have stronger cloth and charm recoil but settle, clamp and respect reduced motion', () => {
  const ordinary = createSecondaryMotion(),
    perfect = createSecondaryMotion();
  ordinary.kick('right');
  perfect.kick('right', false, true);
  const peaks = { ordinary: { cloth: 0, charm: 0 }, perfect: { cloth: 0, charm: 0 } };
  for (let i = 0; i < 120; i++) {
    for (const [key, motion] of [
      ['ordinary', ordinary],
      ['perfect', perfect],
    ]) {
      motion.update(1 / 120);
      const sample = motion.sample();
      for (const part of ['cloth', 'charm'])
        peaks[key][part] = Math.max(peaks[key][part], Math.abs(sample[part]));
    }
  }
  assert.ok(peaks.perfect.cloth > peaks.ordinary.cloth * 2);
  assert.ok(peaks.perfect.charm > peaks.ordinary.charm * 2);
  for (let i = 0; i < 360; i++) perfect.update(1 / 120);
  assert.ok(Math.abs(perfect.sample().cloth) < 0.00001);
  assert.ok(Math.abs(perfect.sample().charm) < 0.00001);
  for (let i = 0; i < 100; i++) {
    perfect.kick('right', false, true);
    perfect.update(1 / 60);
    assert.ok(Math.abs(perfect.sample().cloth) <= 0.085);
    assert.ok(Math.abs(perfect.sample().charm) <= 0.48);
  }
  perfect.kick('right', true, true);
  assert.deepEqual(perfect.sample(), { cloth: 0, charm: 0 });
  const chained = createSecondaryMotion(),
    solo = createSecondaryMotion();
  chained.kick('right', false, true);
  chained.kick('right');
  solo.kick('right', false, true);
  chained.update(0.02);
  solo.update(0.02);
  assert.deepEqual(chained.sample(), solo.sample());
});

test('presentation springs keep the same response at 60 and 120 fps and own their state', () => {
  const a = createSecondaryMotion(),
    b = createSecondaryMotion(),
    untouched = createSecondaryMotion();
  a.kick('up');
  b.kick('up');
  for (let i = 0; i < 12; i++) a.update(1 / 60);
  for (let i = 0; i < 24; i++) b.update(1 / 120);
  assert.ok(Math.abs(a.sample().cloth - b.sample().cloth) < 0.00001);
  assert.ok(Math.abs(a.sample().charm - b.sample().charm) < 0.00001);
  assert.deepEqual(untouched.sample(), { cloth: 0, charm: 0 });
});
