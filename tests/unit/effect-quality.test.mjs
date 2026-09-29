import test from 'node:test';
import assert from 'node:assert/strict';
import { createEffectQuality } from '../../src/rendering/effects/quality.ts';
import { createAmbient } from '../../src/rendering/scene/ambient.ts';
import { createWeatherParticles } from '../../src/rendering/scene/weather-particles.ts';
import { createEffects } from '../../src/rendering/effects/state.ts';
import { createEffectSpawner } from '../../src/rendering/effects/spawn.ts';
import { rng } from '../../src/shared/random.ts';

test('sustained slow frames reduce cosmetic density and fast frames restore it', () => {
  const quality = createEffectQuality();
  for (let i = 0; i < 120; i++) quality.sample(24, 18);
  assert.ok(quality.density < 1);
  assert.ok(quality.density >= 0.3);
  for (let i = 0; i < 300; i++) quality.sample(16, 7);
  assert.equal(quality.density, 1);
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
