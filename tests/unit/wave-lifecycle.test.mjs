import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { waveLifecycleFixture } from './helpers/runtime-wave-lifecycle.mjs';
import { createGrunt as spawnEnemy } from '../../src/game/combat/grunt-spawn.ts';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
const fixture = () => waveLifecycleFixture(runStartSession(4132, setup));

test('wave entry defers encounter setup until scene readiness and uses current ports', () => {
  const f = fixture(),
    G = f.views.G;
  let begin;
  f.views.deferUntilSceneReady = (callback) => {
    begin = callback;
    return true;
  };
  f.lifecycle.startWave(4, true);
  assert.equal(G.wave, 4);
  assert.equal(G.stage, 1);
  assert.equal(f.trace.includes('drum'), false);
  assert.equal(G.pendingSpawns.length, 0);
  const current = [];
  f.views.setWaveLabel = (label) => current.push(label);
  begin();
  assert.equal(G.state, 'playing');
  assert.equal(G.toSpawn, G.cfg.total);
  assert.equal(G.pendingSpawns.length, G.cfg.pack);
  assert.ok(G.pendingSpawns.every((p) => p.t >= 0.9));
  assert.equal(current.length, 1);
  assert.equal(f.trace.at(-1), 'checkpoint');
});

test('wave clear rewards exactly once and paused waves do not advance pending spawns', () => {
  const f = fixture(),
    G = f.views.G;
  f.lifecycle.startWave(1, true);
  G.state = 'paused';
  const before = structuredClone(G.pendingSpawns);
  f.lifecycle.updateWave(2);
  assert.deepEqual(G.pendingSpawns, before);
  G.state = 'playing';
  G.toSpawn = 0;
  G.pendingSpawns = [];
  G.enemies = [];
  f.lifecycle.updateWave(0.1);
  f.lifecycle.updateWave(0.1);
  assert.equal(G.state, 'between');
  assert.equal(G.nextT, 1.2);
  assert.equal(f.trace.filter((x) => Array.isArray(x) && x[0] === 'earn').length, 1);
  assert.ok(G.score > 0);
});

test('wave attacker blessing invokes the same automatic kill boundary', () => {
  const f = fixture(),
    G = f.views.G;
  f.lifecycle.startWave(1, true);
  G.blessingTriggers.stormCharged = true;
  const enemy = spawnEnemy(
    G,
    0,
    false,
    () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 }),
    f.views.combatRandom,
  );
  enemy.state = 'idle';
  G.gapT = 0;
  G.pendingSpawns = [];
  f.lifecycle.updateWave(0.1);
  assert.equal(f.trace.includes('lightning'), true);
  assert.deepEqual(
    f.trace.find((x) => Array.isArray(x) && x[0] === 'kill'),
    ['kill', enemy, enemy.dir, true, true],
  );
});
