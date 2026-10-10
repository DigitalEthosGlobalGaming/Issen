import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraphicsShowcase } from '../../src/presentation/graphics-showcase.ts';

test('showcase gusts are cosmetic, bounded and restart after leaving; reduced motion suppresses gusts', () => {
  const gusts = [];
  const views = {
    active: () => true,
    width: 400,
    ground: 700,
    figureHeight: 100,
    time: 2,
    reducedMotion: () => false,
    particleDensity: () => 1,
    gustLeaves: (count) => gusts.push(count),
  };
  const preview = createGraphicsShowcase(() => views);
  preview.update(2.01);
  assert.deepEqual(gusts, [36]);
  preview.update(6);
  assert.deepEqual(gusts, [36, 36]);
  views.active = () => false;
  preview.update(0.1);
  assert.deepEqual(preview.lights({ width: 400, height: 800, time: 2 }), []);
  views.active = () => true;
  views.reducedMotion = () => true;
  preview.update(2.1);
  assert.equal(gusts.length, 2);
  const light = preview.lights({ width: 400, height: 800, time: 2 })[0].light;
  assert.equal(light.intensity, 1.8);
  assert.equal(light.radius, 200);
});
