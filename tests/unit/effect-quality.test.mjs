import test from 'node:test';
import assert from 'node:assert/strict';
import { preferredLightResolution } from '../../src/rendering/effects/quality.ts';
import { createAmbient } from '../../src/rendering/scene/ambient.ts';
import { createWeatherParticles } from '../../src/rendering/scene/weather-particles.ts';
import { createEffects } from '../../src/rendering/effects/state.ts';
import { createEffectSpawner } from '../../src/rendering/effects/spawn.ts';
import { rng } from '../../src/shared/random.ts';
import { createGraphicsQuality } from '../../src/platform/graphics-quality.ts';
import { graphicsPreset } from '../../src/platform/graphics-settings.ts';

test('sustained slow delivery reduces quality even with negligible JavaScript work', () => {
  const settings = graphicsPreset('high');
  const quality = createGraphicsQuality(
    () => settings,
    { mobile: false },
    () => true,
  );
  for (let i = 0; i < 120; i++) quality.sample(24, 1);
  assert.equal(quality.effective.frameRate, 60);
  assert.equal(settings.frameRate, 120);
  for (let i = 0; i < 900 && quality.effective.frameRate !== 120; i++) quality.sample(1000 / 60, 1);
  assert.equal(quality.effective.frameRate, 120);
  for (let i = 0; i < 120; i++) quality.sample(24, 1);
  assert.equal(quality.effective.frameRate, 60);
});

test('Off removes ambient leaves and gusts without disabling combat cues', () => {
  const ambient = createAmbient({
    width: 800,
    height: 600,
    scale: 1,
    layout: { groundY: 400, eH: 100 },
    random: rng(2),
    density: 0,
  });
  const leaves = ambient.buildLeaves();
  assert.equal(leaves.length, 0);
  ambient.gustLeaves(leaves, 20);
  assert.equal(leaves.length, 0);
  leaves.push({ gust: true });
  ambient.balanceLeaves(leaves);
  assert.equal(leaves.length, 0);
});

test('density scales weather, ambient leaves and combat particles', () => {
  const fullWeather = createWeatherParticles('storm', 800, 600, 1, rng(2), 1);
  const lightWeather = createWeatherParticles('storm', 800, 600, 1, rng(2), 0.3);
  assert.ok(lightWeather.particles.length < fullWeather.particles.length);
  const ambient = (density) =>
    createAmbient({
      width: 800,
      height: 600,
      scale: 1,
      layout: { groundY: 400, eH: 100 },
      random: rng(2),
      density,
    });
  const leaves = ambient(1).buildLeaves();
  ambient(0.3).balanceLeaves(leaves);
  assert.equal(leaves.length, ambient(0.3).buildLeaves().length);
  const sounds = Object.fromEntries(
    ['zap', 'shatter', 'poof', 'crackle', 'popper', 'squeak'].map((key) => [key, () => {}]),
  );
  const effects = (density) => {
    const fx = createEffects();
    createEffectSpawner(fx, { scale: 1, density, random: rng(2), flash() {}, sounds }).sparks(
      10,
      10,
      20,
    );
    return fx;
  };
  assert.ok(effects(0.3).sparks.length < effects(1).sparks.length);
});

test('light resolution is an explicit cosmetic choice with a preserved caller default', () => {
  assert.equal(preferredLightResolution('half'), 0.5);
  assert.equal(preferredLightResolution('full', 0.5), 1);
  assert.equal(preferredLightResolution(undefined, 0.5), 0.5);
  assert.equal(preferredLightResolution('invalid'), 1);
  assert.equal(preferredLightResolution('invalid', 0.5), 0.5);
});
