import test from 'node:test';
import assert from 'node:assert/strict';
import { createGraphicsQuality } from '../../src/platform/graphics-quality.ts';
import { graphicsPreset } from '../../src/platform/graphics-settings.ts';
import { drawingPixelRatio } from '../../src/presentation/viewport.ts';

test('resolution scales the capped drawing ratio without bypassing low-memory bounds', () => {
  const doc = {
    documentElement: { dataset: { graphicsResolution: '50' } },
    defaultView: { navigator: { deviceMemory: 2 } },
  };
  const full = Math.sqrt(600_000 / (800 * 600));
  assert.equal(drawingPixelRatio(doc, 800, 600, 3), full / 2);
  doc.documentElement.dataset.graphicsResolution = '100';
  assert.equal(drawingPixelRatio(doc, 800, 600, 3), full);
  doc.documentElement.dataset.graphicsResolution = 'invalid';
  assert.equal(drawingPixelRatio(doc, 800, 600, 3), full);
});

function reduceOnce(quality) {
  for (let i = 0; i < 1000; i++) if (quality.sample(50)) return;
  assert.fail('No reduction after sustained slow delivery');
}
test('ordered reductions cover rate, lighting, resolution, particles and grass without modifying saves', () => {
  const settings = graphicsPreset('high'),
    original = structuredClone(settings);
  const quality = createGraphicsQuality(
    () => settings,
    { mobile: false },
    () => true,
  );
  const keys = [];
  for (let i = 0; i < 11; i++) {
    reduceOnce(quality);
    keys.push(quality.reductions.at(-1).key);
  }
  assert.deepEqual(keys, [
    'frameRate',
    'lighting',
    ...Array(5).fill('resolution'),
    'particles',
    'particles',
    'grass',
    'grass',
  ]);
  assert.equal(quality.effective.resolution, 50);
  assert.equal(quality.effective.particles, 'low');
  assert.equal(quality.effective.grass, 'low');
  assert.deepEqual(settings, original);
  for (let i = 0; i < 500; i++) quality.sample(50);
  assert.equal(quality.reductions.length, 11);
});
test('stable recovery restores exact custom ceilings, including a non-round resolution', () => {
  const settings = {
    ...graphicsPreset('balanced'),
    preset: 'custom',
    resolution: 55,
    lighting: 'off',
    particles: 'low',
    grass: 'low',
  };
  const quality = createGraphicsQuality(
    () => settings,
    { mobile: true },
    () => false,
  );
  reduceOnce(quality);
  assert.equal(quality.effective.resolution, 50);
  for (let i = 0; i < 700; i++) quality.sample(1000 / 60);
  assert.equal(quality.effective.resolution, 55);
  assert.equal(quality.effective.lighting, 'off');
  assert.equal(quality.effective.frameRate, 60);
  assert.equal(quality.reductions.length, 0);
});
test('suspension discards slow history; disabled adaptation and malformed samples cannot reduce', () => {
  const settings = graphicsPreset('high');
  const quality = createGraphicsQuality(
    () => settings,
    { mobile: false },
    () => true,
  );
  for (let i = 0; i < 35; i++) quality.sample(50);
  quality.suspend();
  for (let i = 0; i < 35; i++) quality.sample(50);
  assert.equal(quality.effective.frameRate, 120);
  settings.adaptive = false;
  for (let i = 0; i < 500; i++) quality.sample(50);
  assert.equal(quality.effective.frameRate, 120);
  for (const sample of [NaN, Infinity, -1, 0, 5000]) assert.equal(quality.sample(sample), false);
});
test('choice changes clear obsolete reductions; effective getters reuse their record between changes', () => {
  let settings = graphicsPreset('high');
  const quality = createGraphicsQuality(
    () => settings,
    { mobile: false },
    () => true,
  );
  let notifications = 0;
  const unsubscribe = quality.subscribe(() => notifications++);
  reduceOnce(quality);
  assert.equal(notifications, 1);
  const effective = quality.effective;
  assert.equal(quality.effective, effective);
  settings = graphicsPreset('low');
  assert.equal(quality.effective.resolution, 60);
  assert.equal(quality.reductions.length, 0);
  unsubscribe();
  reduceOnce(quality);
  assert.equal(notifications, 1);
});
