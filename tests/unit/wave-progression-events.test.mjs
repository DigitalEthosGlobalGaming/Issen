import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { waveLifecycleFixture } from './helpers/runtime-wave-lifecycle.mjs';
import { createEventBus } from '../../src/game/events.ts';
import { bindWaveProgression } from '../../src/game/progression/encounter-listeners.ts';

test('actual wave entry records current profile milestones at its original deferred boundary and disposes progression', () => {
  const runtime = runStartSession(4132, { mode: 'waves', diff: 'ronin', arrows: true, lives: '3', upgrades: false });
  const f = waveLifecycleFixture(runtime, false), G = runtime.run, events = createEventBus();
  f.views.events = events;
  const calls = [], blade = { w: 0, rw: 0 };
  const off = bindWaveProgression(events, () => ({ ST: runtime.views.ST, bst: () => blade,
    challenge: (...args) => calls.push(['challenge', ...args]),
    saveStats: () => calls.push('save'), checkUnlocks: () => calls.push('unlocks') }));
  let snapshot, begin;
  events.on('waveReached', event => { snapshot = event; });
  f.views.deferUntilSceneReady = action => { begin = action; return true; };
  G.blade = true; G.lostLife = false;
  const rng = runtime.random.state();
  f.lifecycle.startWave(12, true);
  assert.equal(runtime.views.ST.flawless, 1);
  assert.equal(calls.length, 0);
  assert.equal(snapshot, undefined);
  assert.equal(runtime.random.state(), rng);
  begin();
  assert.deepEqual(snapshot, { wave: 12, mode: 'ronin', zen: false, blade: true, lostLife: false });
  assert.ok(Object.isFrozen(snapshot));
  assert.equal(runtime.views.ST.bestWave, 12);
  assert.equal(runtime.views.ST.roninWave, 12);
  assert.equal(runtime.views.ST.bladeWave, 12);
  assert.equal(runtime.views.ST.flawlessWave, 12);
  assert.equal(runtime.views.ST.furthestStage, 3);
  assert.deepEqual(blade, { w: 12, rw: 12 });
  assert.deepEqual(calls, [['challenge', 'w', 12], ['challenge', 'rw', 12], 'save', 'unlocks']);
  off();
  const profile = structuredClone(runtime.views.ST), count = calls.length;
  G.wave = 99;
  events.emit('waveReached', snapshot);
  events.emit('wavePrepared', { wave: 99, zen: false, lostLife: false });
  assert.deepEqual(runtime.views.ST, profile);
  assert.equal(calls.length, count);
  assert.equal(snapshot.wave, 12);
});
