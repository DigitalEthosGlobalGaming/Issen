import test from 'node:test';
import assert from 'node:assert/strict';
import { createWeatherState } from '../../src/rendering/scene/weather-state.ts';
import { createWeatherParticles } from '../../src/rendering/scene/weather-particles.ts';
import { updateWeather } from '../../src/rendering/scene/weather-update.ts';
import { rng } from '../../src/shared/random.ts';

function environment(weather, events) {
  return {
    weather,
    phase: 'playing',
    width: 390,
    height: 844,
    scale: 1,
    wind: 1,
    time: 1,
    hazard: 0.5,
    layout: { eH: 160, groundY: 700 },
    random: rng(42),
    flash: () => events.push('flash'),
    sounds: { thunder: () => events.push('thunder'), gust: () => events.push('gust') },
    gustLeaves: (count) => events.push(count),
    onShake: (amount) => events.push(amount),
  };
}
test('every weather builds deterministic independent particles and remains finite during simulation', () => {
  for (const weather of [
    null,
    'gust',
    'sakura',
    'rain',
    'bamboo',
    'snow',
    'smoke',
    'storm',
    'night',
  ]) {
    const a = createWeatherParticles(weather, 390, 844, 1, rng(4));
    const b = createWeatherParticles(weather, 390, 844, 1, rng(4));
    assert.deepEqual(a, b);
    assert.notEqual(a.particles, b.particles);
    const state = createWeatherState(rng(7));
    const env = environment(weather, []);
    for (let i = 0; i < 400; i++) updateWeather(state, a.particles, 0.05, env);
    for (const particle of a.particles) assert.ok(Object.values(particle).every(Number.isFinite));
    assert.equal(a.bamboo.length, weather === 'bamboo' ? 3 : 0);
  }
});
test('storm hazards trigger only in active play and scale camera shake', () => {
  const state = createWeatherState(rng(7)),
    events = [],
    env = environment('storm', events);
  state.ltT = state.surgeT = 0;
  updateWeather(state, [], 0.05, { ...env, phase: 'title' });
  assert.deepEqual(events, []);
  updateWeather(state, [], 0.05, env);
  assert.deepEqual(events, ['flash', 'thunder', 'gust', 1.25]);
  assert.ok(state.surge > 2);
});
test('gust and smoke hazards honor their timers; leaving play clears whiteout', () => {
  const state = createWeatherState(rng(7)),
    events = [];
  state.gustT = 0;
  updateWeather(state, [], 0.05, environment('gust', events));
  assert.deepEqual(events, [35, 'gust']);
  state.smokeT = 0;
  updateWeather(state, [], 0.05, environment('smoke', events));
  assert.equal(state.banks.length, 1);
  assert.equal(state.banks[0].puffs.length, 9);
  state.woPhase = 1;
  state.wo = 0.7;
  updateWeather(state, [], 0.05, { ...environment('snow', events), phase: 'title' });
  assert.equal(state.woPhase, 0);
  assert.ok(state.wo < 0.7);
});
