import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { waveLifecycleFixture } from './helpers/runtime-wave-lifecycle.mjs';
import { enemyKillFixture } from './helpers/runtime-enemy-kill.mjs';
import { createGrunt } from '../../src/game/combat/grunt-spawn.ts';
import { restorableRng } from '../../src/shared/random.ts';

const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
test('actual deferred wave, regeneration, lightning kill and recovery retain run/profile/RNG without cosmetic listeners', () => {
  function drive(enabled) {
    const runtime = runStartSession(4132, setup), f = waveLifecycleFixture(runtime, enabled);
    const kill = enemyKillFixture(runtime), G = runtime.run;
    const visual = restorableRng(59), calls = [], snapshots = [];
    const call = name => (...args) => { visual.next(); calls.push([name, ...args]); };
    for (const name of ['renderLives', 'pop', 'banner', 'setWaveLabel', 'hint', 'lightningFx', 'dust']) f.views[name] = call(name);
    f.views.sfx = { drum: call('drum'), step: call('step') };
    f.views.killEnemy = kill.rules.killEnemy;
    for (const name of ['waveStarted', 'waveAttack', 'livesChanged', 'stageHint']) runtime.views.events.on(name, event => {
      assert.ok(Object.isFrozen(event)); snapshots.push([name, event]);
    });
    G.m.regen = 1; G.lives = 1; G.maxLives = 3; G.recoveryEvery = 1;
    let begin;
    f.views.deferUntilSceneReady = action => { begin = action; return true; };
    f.lifecycle.startWave(4, true);
    assert.equal(G.lives, 2);
    assert.equal(snapshots.filter(([name]) => name === 'waveStarted').length, 0);
    begin();
    assert.equal(G.stage, 1);
    assert.equal(G.cfg.pack, G.pendingSpawns.length);
    const enemy = createGrunt(G, 0, false, () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 }), runtime.random.next);
    enemy.state = 'idle';
    G.pendingSpawns = []; G.toSpawn = 0; G.gapT = 0;
    G.blessingTriggers.stormCharged = true;
    f.lifecycle.updateWave(.1);
    assert.equal(enemy.state, 'dying');
    f.lifecycle.updateWave(.1);
    assert.equal(G.state, 'between');
    assert.equal(G.lives, 3);
    assert.equal(G.wavesCleared, 1);
    assert.equal(G.kills, 1);
    assert.equal(runtime.views.ST.kills, 1);
    const attack = snapshots.find(([name, event]) => name === 'waveAttack' && event.kind === 'lightning')[1];
    assert.deepEqual(attack, { kind: 'lightning', x: 100, y: 200, height: 150 });
    const lives = snapshots.filter(([name]) => name === 'livesChanged').map(([,event]) => event.cause);
    assert.deepEqual(lives, ['refresh', 'regen', 'recovery']);
    if (enabled) {
      assert.ok(calls.some(([name]) => name === 'drum'));
      assert.equal(calls.filter(([name]) => name === 'renderLives').length, 3);
      assert.equal(calls.filter(([name]) => name === 'lightningFx').length, 1);
      assert.ok(calls.some(([name, , , label]) => name === 'pop' && label === 'Recovery +1 life'));
    } else assert.equal(calls.length, 0);
    const result = { run: structuredClone(G), stats: structuredClone(runtime.views.ST), random: runtime.random.state() };
    f.disposeFeedback();
    const count = calls.length;
    for (const [name, event] of [...snapshots]) runtime.views.events.emit(name, event);
    assert.equal(calls.length, count);
    enemy.pos.x = 999;
    assert.equal(attack.x, 100);
    return { result, visual: visual.state() };
  }
  const on = drive(true), off = drive(false);
  assert.deepEqual(on.result, off.result);
  assert.notEqual(on.visual, off.visual);
});
