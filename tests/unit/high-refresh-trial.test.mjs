import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameLoop } from '../../src/platform/frame-loop.ts';
import { createWavesPhase } from '../../src/game/phases/waves.ts';
import { createGrunt } from '../../src/game/combat/grunt-spawn.ts';
import { advanceGrunts } from '../../src/game/combat/grunt.ts';
import { trialSessionFixture } from './helpers/runtime-trial-session.mjs';
import { waveLifecycleFixture } from './helpers/runtime-wave-lifecycle.mjs';
import { enemyKillFixture } from './helpers/runtime-enemy-kill.mjs';

test('additional render callbacks preserve actual seeded trial combat, spawns and RNG', () => {
  function drive(highRefresh) {
    const f = trialSessionFixture(false);
    f.start('quiet-blade');
    const G = f.runtime.run,
      trial = f.views.activeTrial,
      random = f.views.combatRandom;
    const lifecycle = waveLifecycleFixture(
      { run: G, random: { next: random }, views: { events: f.views.events, ST: f.views.ST } },
      false,
    );
    const kill = enemyKillFixture({ run: G, random: { next: random }, views: f.runtime.views });
    kill.views.activeTrial = trial;
    const position = () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 });
    lifecycle.views.spawnEnemy = (slot) => {
      const enemy = createGrunt(G, slot, false, position, random);
      spawns.push(structuredClone(enemy));
      return enemy;
    };
    const input = createWavesPhase((ctx) => ctx, lifecycle.lifecycle);
    const inputViews = {
      events: f.views.events,
      G,
      W: 200,
      activeTrial: trial,
      waveConfiguration: () => G.cfg,
      killEnemy: kill.rules.killEnemy,
      orderSucceeded() {},
      swingPlayer() {},
      playerDie() {
        assert.fail('valid trial cuts must not miss');
      },
    };
    let now = 0,
      callback,
      time = 0,
      renders = 0;
    const updates = [],
      spawns = [];
    const loop = createFrameLoop(
      { hitStop: 0, slowT: 0, timeScale: 1 },
      {
        maxFps: () => (highRefresh ? 120 : 60),
        ...(highRefresh ? { maxUpdateFps: () => 60 } : {}),
        paused: () => false,
        update(dt, raw) {
          updates.push([dt, raw]);
          time += dt;
          advanceGrunts(G, dt, {
            events: f.views.events,
            surge: 0,
            time,
            perfectZone: () => 0.78,
            pet: 'none',
            foxSave() {},
            position,
            playerDie() {
              assert.fail('perfect trial inputs must avoid late strikes');
            },
          });
          lifecycle.lifecycle.updateWave(dt);
          if (G.attacker && G.attacker.p >= 0.8) input.onSwipe(inputViews, G.attacker.dir);
        },
        render() {
          renders++;
        },
        afterRender() {},
      },
      {
        now: () => now,
        request(cb) {
          callback = cb;
          return 1;
        },
        cancel() {},
      },
    );
    loop.start();
    for (let tick = 1; tick <= 30000 && G.state === 'playing'; tick++) {
      now = (tick * 1000) / 120;
      callback(now);
    }
    loop.stop();
    assert.equal(G.state, 'between');
    assert.equal(G.kills, trial.wave.total);
    const state = JSON.stringify(G),
      rng = f.runtime.views.runRandom.state();
    f.dispose();
    return { state, rng, updates, spawns, renders };
  }
  const legacy = drive(false),
    high = drive(true);
  assert.deepEqual(high.updates, legacy.updates);
  assert.equal(high.state, legacy.state);
  assert.equal(high.rng, legacy.rng);
  assert.deepEqual(high.spawns, legacy.spawns);
  assert.ok(legacy.spawns.length > 0);
  assert.ok(high.renders > legacy.renders * 1.9);
});
