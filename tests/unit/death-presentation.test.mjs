import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDeathPose,
  chooseDeathStyle,
  deathDuration,
  deathShadowOpacity,
  DEATH_STYLES,
} from '../../src/rendering/figures/death.ts';
import { rng } from '../../src/shared/random.ts';
import { makeFig, EPOSE } from '../../src/rendering/figures/model.ts';

test('perfect kills vary, Bonk never cuts or disarms, and all styles are reachable', () => {
  const perfect = new Set(),
    normal = new Set(),
    bonk = new Set();
  const random = rng(42);
  for (let i = 0; i < 1000; i++) {
    perfect.add(chooseDeathStyle(true, false, random));
    normal.add(chooseDeathStyle(false, false, random));
    bonk.add(chooseDeathStyle(true, true, random));
  }
  assert.deepEqual([...perfect].sort(), ['crumple', 'fall', 'split']);
  assert.deepEqual(
    [...normal].sort(),
    Object.keys(DEATH_STYLES)
      .filter((s) => s !== 'dissolve')
      .sort(),
  );
  assert.ok(!bonk.has('split') && !bonk.has('disarm'));
});
test('new poses have distinct silhouettes and expire; reduced motion keeps a restrained body pose', () => {
  const fig = () => ({
    x: 100,
    y: 200,
    h: 100,
    fog: 0,
    d: makeFig(3),
    pose: EPOSE.guard,
    alpha: 0.8,
  });
  const fall = fig(),
    crumple = fig();
  applyDeathPose(fall, 'fall', 0.6, -1);
  applyDeathPose(crumple, 'crumple', 0.6, -1);
  assert.ok(Math.abs(fall.rot) > 1);
  assert.ok(crumple.sy < 0.4);
  assert.ok(fall.noShadow && crumple.noShadow);
  for (const style of Object.keys(DEATH_STYLES)) {
    const expired = fig();
    applyDeathPose(expired, style, deathDuration(style), 1);
    assert.equal(expired.alpha, 0);
    const restrained = fig();
    applyDeathPose(restrained, style, 0.6, 1, true);
    assert.equal(restrained.rot, undefined);
    assert.ok(restrained.sy >= 0.85);
  }
});
test('shadows vanish before bodies and raw-time fading is independent of simulation duration', () => {
  assert.equal(deathShadowOpacity(0), 1);
  assert.ok(deathShadowOpacity(0.2) < 0.5);
  assert.equal(deathShadowOpacity(0.4), 0);
  assert.equal(deathShadowOpacity(0.7, 0.7), 0);
  assert.ok(deathDuration('fall') > 0.4);
});
