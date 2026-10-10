import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameSimulation } from '../../src/runtime/frame-simulation.ts';
import { updateCosmeticWeather } from '../../src/rendering/scene/weather-update.ts';
import { createWeatherState } from '../../src/rendering/scene/weather-state.ts';

test('cosmetic loading weather preserves live hazard fields and never consumes the hazard RNG', () => {
  for (const weather of ['rain', 'storm', 'snow', 'sakura', 'smoke', 'gust']) {
    const state = createWeatherState(() => 0.5);
    state.veilT = state.ltT = state.gustT = state.woT = state.smokeT = state.surgeT = 0;
    state.banks.push({ x: 10, y: 10, v: 5, puffs: [] });
    const before = structuredClone(state);
    const particles = [{ x: 10, y: 10, z: 1, l: 1, ph: 0, rot: 0, vr: 1, fl: 0 }];
    updateCosmeticWeather(state, particles, 0.02, {
      weather,
      phase: 'playing',
      width: 390,
      height: 844,
      scale: 1,
      wind: 1,
      time: 1,
      hazard: 1,
      layout: { eH: 100, groundY: 500 },
      random: () => 0.5,
      hazardRandom: () => assert.fail('run hazard randomness consumed'),
      flash: () => assert.fail('loading lightning'),
      sounds: { thunder: () => assert.fail('thunder'), gust: () => assert.fail('gust hazard') },
      gustLeaves: () => assert.fail('hazard leaves'),
      onShake: () => {},
    });
    assert.deepEqual(state, before, weather);
    if (weather !== 'gust') assert.notEqual(particles[0].y, 10, weather);
  }
});

for (const preview of [false, true])
  test(`${preview ? 'Graphics preview' : 'loading'} updates only cosmetic ports and preserves run timers and gameplay dispatch`, () => {
    const G = { state: 'playing', stage: 0, runTime: 99, freezeT: 10, petT: 12 };
    const before = structuredClone(G),
      calls = [];
    const record =
      (name) =>
      (...args) =>
        calls.push([name, ...args]);
    const views = {
      sceneLoading: !preview,
      graphicsPreview: preview,
      G,
      activeTrial: {},
      trialFailure: 'failure',
      advanceClock: record('clock'),
      updateAmbient: record('ambient'),
      updateTransition: record('transition'),
      updateWeather: record('weather'),
      advanceCamera: record('camera'),
      apparelMotion: { update: record('apparel') },
      reducedMotion: () => false,
      finishTrial: () => assert.fail('trial advanced'),
      updatePlayer: () => assert.fail('player advanced'),
      updateEnemies: () => assert.fail('enemies advanced'),
      phaseRouter: { updateFrame: () => assert.fail('phase advanced') },
    };
    createFrameSimulation(() => views).update(0, 0.02);
    assert.deepEqual(G, before);
    assert.deepEqual(calls, [
      ['clock', 0.02],
      ['ambient', 0.02],
      ['transition', 0.02],
      ['weather', 0.02, true],
      ['camera', 0.02],
      ['apparel', 0.02, false],
    ]);
    calls.length = 0;
    views.reducedMotion = () => true;
    createFrameSimulation(() => views).update(0, 0.02);
    assert.deepEqual(
      calls.find(([name]) => name === 'weather'),
      ['weather', 0, true],
    );
    assert.deepEqual(G, before);
  });
