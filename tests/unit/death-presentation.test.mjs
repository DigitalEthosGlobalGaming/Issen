import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDeathPose,
  chooseDeathStyle,
  deathDuration,
  deathShadowOpacity,
  DEATH_STYLES,
  scatteredPartMotion,
} from '../../src/rendering/figures/death.ts';
import { createItems } from '../../src/game/content/items.ts';
import { STAT0 } from '../../src/game/progression/statistics.ts';
import { rng } from '../../src/shared/random.ts';
import { makeFig, EPOSE } from '../../src/shared/figure-model.ts';

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
      .filter((s) => !['dissolve', 'scatter'].includes(s))
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

test('scattered parts begin assembled, separate independently, and expire with stable cosmetic randomness', () => {
  const motions = [];
  for (let i = 0; i < 12; i++) {
    const initial = scatteredPartMotion(i, 0, Math.PI / 2, 42);
    assert.equal(Math.abs(initial.x), 0);
    assert.equal(Math.abs(initial.y), 0);
    assert.equal(Math.abs(initial.rotation), 0);
    assert.equal(initial.alpha, 1);
    const airborne = scatteredPartMotion(i, 0.35, Math.PI / 2, 42);
    assert.ok(Number.isFinite(airborne.y) && airborne.y !== 0);
    assert.ok(airborne.alpha > 0);
    assert.deepEqual(airborne, scatteredPartMotion(i, 0.35, Math.PI / 2, 42));
    assert.equal(scatteredPartMotion(i, deathDuration('scatter'), 0, 42).alpha, 0);
    motions.push(airborne);
  }
  assert.equal(new Set(motions.map((m) => m.rotation)).size, 12);
  assert.ok(motions.some((m) => m.x < 0) && motions.some((m) => m.x > 0));
});

test('Scattered Armour is a selectable cosmetic earned at 500 lifetime kills', () => {
  const item = createItems(() => new Set()).find((item) => item.id === 'scattered-armour');
  assert.equal(item.type, 'fx');
  assert.equal(item.ok({ ...STAT0, kills: 499 }), false);
  assert.equal(item.ok({ ...STAT0, kills: 500 }), true);
  assert.equal(item.m, undefined);
});

test('scattered parts launch in all directions and vary between enemies', () => {
  const motions = Array.from({ length: 30 }, (_, i) => scatteredPartMotion(i, 0.05, 0, 42));
  const quadrants = new Set(motions.map(({ x, y }) => `${Math.sign(x)},${Math.sign(y)}`));
  assert.equal(quadrants.size, 4);
  assert.notDeepEqual(scatteredPartMotion(0, 0.3, 0, 42), scatteredPartMotion(0, 0.3, 0, 43));
});
