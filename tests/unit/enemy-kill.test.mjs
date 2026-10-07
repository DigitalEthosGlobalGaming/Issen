import { bindKillFeedback } from '../../src/presentation/kill.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { enemyKillFixture } from './helpers/runtime-enemy-kill.mjs';
import { spawnEnemy } from '../../src/game/combat/enemy-spawn.ts';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
function fixture() {
  const runtime = runStartSession(9191, setup),
    f = enemyKillFixture(runtime),
    G = runtime.run;
  const enemy = spawnEnemy(
    G,
    0,
    false,
    () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 }),
    runtime.random.next,
  );
  enemy.state = 'attack';
  enemy.dir = 'up';
  enemy.p = 0.9;
  G.attacker = enemy;
  return { ...f, runtime, enemy };
}
test('actual enemy kill records a perfect cut, combo, score, reward and plain death state', () => {
  const f = fixture(),
    G = f.views.G;
  f.rules.killEnemy(f.enemy, 'up');
  assert.equal(G.attacker, null);
  assert.equal(G.kills, 1);
  assert.equal(G.perfects, 1);
  assert.equal(G.combo, 1);
  assert.equal(G.maxCombo, 1);
  assert.equal(f.views.ST.kills, 1);
  assert.equal(f.views.ST.perfects, 1);
  assert.ok(G.score > 0);
  assert.equal(f.enemy.state, 'dying');
  assert.deepEqual(f.enemy.deathGround, f.enemy.pos);
  assert.ok(f.runtime.views.rewardLedger.pending > 0);
});
test('automatic kills cannot charge perfect-cut powers while ordinary cuts reset their progress', () => {
  const f = fixture(),
    G = f.views.G;
  G.bless.add('stormcall');
  G.blessingTriggers.stormProgress = 2;
  f.rules.killEnemy(f.enemy, 'up', true, true, true);
  assert.equal(G.perfects, 0);
  assert.equal(G.blessingTriggers.stormCharged, false);
  assert.equal(G.blessingTriggers.stormProgress, 2);
  const second = fixture();
  second.enemy.p = 0.2;
  second.views.G.blessingTriggers.stormProgress = 2;
  second.rules.killEnemy(second.enemy, 'up');
  assert.equal(second.views.G.blessingTriggers.stormProgress, 0);
});
test('serpent chained cuts use the real kill API and refill each vacated slot', () => {
  const f = fixture(),
    G = f.views.G;
  G.m.serpent = 1;
  G.cfg.ordered = false;
  G.cfg.refill = true;
  const second = spawnEnemy(
    G,
    1,
    false,
    () => ({ x: 150, y: 200, h: 150, fog: 0, alpha: 1 }),
    f.runtime.random.next,
  );
  second.state = 'idle';
  second.dir = 'up';
  G.toSpawn = 2;
  f.rules.killEnemy(f.enemy, 'up');
  assert.equal(G.kills, 2);
  assert.equal(G.perfects, 1);
  assert.equal(second.state, 'dying');
  assert.deepEqual(
    G.pendingSpawns.map((p) => p.slot),
    [0, 1],
  );
});

test('cut payloads are frozen value snapshots and profile listeners dispose independently', () => {
  const f = fixture(),
    snapshots = [],
    statsBefore = structuredClone(f.views.ST);
  f.dispose();
  f.events.on('kill', (event) => snapshots.push(event));
  f.rules.killEnemy(f.enemy, 'up');
  assert.deepEqual(f.views.ST, statsBefore, 'rules cannot write profile counters');
  assert.equal(snapshots.length, 1);
  const snapshot = snapshots[0];
  assert.ok(Object.isFrozen(snapshot));
  assert.ok(Object.values(snapshot).every((value) => value === null || typeof value !== 'object'));
  assert.equal(snapshot.runPerfects, 1);
  assert.equal(snapshot.x, f.enemy.pos.x);
  const saved = { ...snapshot };
  f.enemy.pos.x += 100;
  f.views.G.combo = 99;
  assert.deepEqual(snapshot, saved, 'snapshot cannot retain character/run references');
});

test('adding or removing cosmetic cut listeners cannot change run outcomes or combat RNG', () => {
  const a = fixture(),
    b = fixture();
  a.views.G.m.serpent = b.views.G.m.serpent = 1;
  for (const f of [a, b]) {
    const enemy = spawnEnemy(
      f.views.G,
      1,
      false,
      () => ({ x: 140, y: 200, h: 150, fog: 0, alpha: 1 }),
      f.runtime.random.next,
    );
    enemy.state = 'idle';
    enemy.dir = 'up';
  }
  const feedback = [],
    events = [];
  a.events.on('kill', (event) => events.push(event));
  const dispose = bindKillFeedback(a.events, () => ({
    ...a.views,
    killFx: (...args) => feedback.push(args),
  }));
  a.rules.killEnemy(a.enemy, 'up');
  b.rules.killEnemy(b.enemy, 'up');
  assert.deepEqual(a.views.G, b.views.G);
  assert.equal(a.runtime.random.state(), b.runtime.random.state());
  assert.equal(feedback.length, 2);
  dispose();
  a.events.emit('kill', events[0]);
  assert.equal(feedback.length, 2, 'disposed feedback is no longer invoked');
});
