import test from 'node:test';
import assert from 'node:assert/strict';
import {
  graphicsPreset,
  parseGraphics,
  resolveGraphics,
  recommendedGraphics,
  setGraphicsOption,
  graphicsParticleDensity,
} from '../../src/platform/graphics-settings.ts';
import { parseSettings } from '../../src/platform/settings.ts';

test('Auto chooses Balanced for touch/mobile and low-memory devices; High for desktop', () => {
  for (const device of [
    { mobile: true },
    { mobile: false, memory: 4 },
    { mobile: false, memory: 2 },
  ]) {
    assert.equal(recommendedGraphics(device), 'balanced');
    assert.equal(resolveGraphics(graphicsPreset(), device).resolution, 75);
    assert.equal(graphicsParticleDensity(graphicsPreset(), device), 0.6);
  }
  const desktop = { mobile: false, memory: 8 };
  assert.equal(recommendedGraphics(desktop), 'high');
  assert.equal(graphicsParticleDensity(graphicsPreset(), desktop), 1);
  assert.equal(resolveGraphics(graphicsPreset(), desktop).frameRate, 120);
});

test('legacy preferences migrate without losing accessibility, audio or bindings', () => {
  for (const quality of ['auto', 'low', 'high']) {
    const settings = parseSettings({
      version: 1,
      quality,
      reducedFlashes: 'on',
      effectsVolume: 0.25,
    });
    assert.equal(settings.version, 2);
    assert.equal(settings.graphics.preset, quality);
    assert.equal(settings.reducedFlashes, 'on');
    assert.equal(settings.effectsVolume, 0.25);
    assert.deepEqual(parseSettings(settings), settings);
  }
  const off = parseSettings({ version: 1, quality: 'high', debrisStyle: 'off' });
  assert.equal(off.graphics.particles, 'off');
  assert.equal(off.graphics.preset, 'custom');
});

test('manual choices become Custom and survive a version-2 reload; preset records are independent', () => {
  const settings = parseSettings(null);
  setGraphicsOption(settings.graphics, 'resolution', 55);
  setGraphicsOption(settings.graphics, 'lighting', 'off');
  setGraphicsOption(settings.graphics, 'preload', false);
  assert.equal(settings.graphics.preset, 'custom');
  assert.deepEqual(parseSettings(settings), settings);
  assert.equal(graphicsPreset().resolution, 75);
  const runtime = resolveGraphics(settings.graphics, { mobile: false });
  runtime.resolution = 50;
  assert.equal(settings.graphics.resolution, 55);
});

test('malformed graphics values cannot produce invalid resolutions, rates or memory policies', () => {
  const parsed = parseGraphics({
    preset: 'custom',
    resolution: Infinity,
    frameRate: 1000,
    lighting: 'invalid',
    particles: 'invalid',
    memory: 'unlimited',
    adaptive: 'false',
  });
  assert.equal(parsed.resolution, 75);
  assert.equal(parsed.frameRate, 60);
  assert.equal(parsed.lighting, 'half');
  assert.equal(parsed.memory, 'normal');
  assert.equal(parsed.adaptive, true);
  assert.equal(parseGraphics({ preset: 'custom', resolution: -50 }).resolution, 50);
  assert.equal(parseGraphics({ preset: 'custom', resolution: 300 }).resolution, 100);
  assert.deepEqual(parseGraphics({ preset: 'high', resolution: 0 }), graphicsPreset('high'));
});
