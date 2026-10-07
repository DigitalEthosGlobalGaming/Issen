import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { deathPhaseFixture } from './helpers/runtime-death-phase.mjs';
import { spawnEnemy } from '../../src/game/combat/enemy-spawn.ts';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
const fixture = () => deathPhaseFixture(runStartSession(3441, setup));

test('death marks a lost checkpoint once, advances on raw time and waits during reward offers', () => {
  const f = fixture(),
    G = f.views.G;
  G.lives = 1;
  G.runWards = 0;
  f.phase.playerDie(null, 'wrong');
  f.phase.playerDie(null, 'wrong');
  assert.equal(G.state, 'dead');
  assert.equal(G.lives, 0);
  assert.equal(f.trace.filter((x) => Array.isArray(x) && x[0] === 'checkpoint').length, 1);
  assert.deepEqual(f.trace[0], ['checkpoint', 'lost']);
  f.views.rewardFlowBusy = true;
  f.phase.updateDeath(2);
  assert.equal(G.deathT, 0);
  f.views.rewardFlowBusy = false;
  f.phase.updateDeath(0.9);
  assert.equal(G.deathT, 0.9);
  assert.ok(f.views.timeScale > 0.3);
  f.phase.updateDeath(1);
  f.phase.updateDeath(1);
  assert.equal(G.state, 'over');
  assert.equal(f.trace.filter((x) => x === 'over').length, 1);
});

test('a ward absorbs damage before life, then the next hit loses life and combo', () => {
  const f = fixture(),
    G = f.views.G;
  G.lives = 3;
  G.runWards = 1;
  G.combo = 9;
  f.phase.playerDie(null, 'wrong');
  assert.equal(G.state, 'playing');
  assert.equal(G.lives, 3);
  assert.equal(G.runWards, 0);
  G.combo = 9;
  f.phase.playerDie(null, 'wrong');
  assert.equal(G.lives, 2);
  assert.equal(G.combo, 0);
  assert.equal(G.lostLife, true);
});

test('trial damage records failure without mutating persistent lives or death state', () => {
  const f = fixture(),
    G = f.views.G;
  f.views.activeTrial = { id: 'quiet-blade' };
  const lives = G.lives;
  f.phase.playerDie(null, 'wrong');
  assert.equal(f.views.trialFailure, 'A mistake');
  assert.equal(G.lives, lives);
  assert.equal(G.state, 'playing');
  assert.equal(f.trace.length, 0);
});

test('phoenix revival re-enters the same boss once and restores lives', () => {
  const f = fixture(),
    G = f.views.G;
  G.state = 'dead';
  G.bless.add('phoenix');
  G.lives = 0;
  G.diedInBoss = true;
  G.bossCount = 3;
  f.phase.updateDeath(2);
  assert.equal(G.phoenixUsed, true);
  assert.equal(G.lives, G.maxLives);
  assert.equal(G.bossCount, 3);
  assert.equal(G.state, 'boss');
  assert.equal(f.trace.filter((x) => x === 'boss').length, 1);
});

test('tanto intercepts a living attacker through the automatic kill API before losing life', () => {
  const f = fixture(),
    G = f.views.G;
  const enemy = spawnEnemy(
    G,
    0,
    false,
    () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 }),
    () => 0.5,
  );
  enemy.state = 'attack';
  G.tanto = 1;
  const lives = G.lives;
  f.phase.playerDie(enemy, 'late');
  assert.equal(G.tanto, 0);
  assert.equal(G.lives, lives);
  assert.equal(enemy.state, 'dying');
  assert.equal(
    f.trace.some((x) => Array.isArray(x) && x[0] === 'kill'),
    true,
  );
});
