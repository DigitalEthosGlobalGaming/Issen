import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceGrunts, gruntBehaviours, gruntTable } from '../../src/game/combat/grunt.ts';
import { createGrunt as spawnEnemy } from '../../src/game/combat/grunt-spawn.ts';
import { EPOSE } from '../../src/shared/figure-model.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { deathPhaseFixture } from './helpers/runtime-death-phase.mjs';
import { enemyKillFixture } from './helpers/runtime-enemy-kill.mjs';
const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
const position = () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 });
function fixture() {
  const runtime = runStartSession(2017, setup),
    G = runtime.run,
    trace = [];
  const enemy = spawnEnemy(G, 0, false, position, runtime.random.next);
  enemy.fake = null;
  enemy.dir = 'up';
  enemy.T = 1;
  const death = deathPhaseFixture(runtime);
  const env = {
    surge: 0,
    time: 1,
    perfectZone: () => 0.78,
    pet: 'none',
    events: { emit(name, event) {
      assert.equal(name, 'gruntCue');
      assert.ok(['bell', 'feint', 'bark'].includes(event.kind));
      trace.push(event.kind);
    } },
    foxSave: () => trace.push('fox'),
    playerDie: death.phase.playerDie,
    position,
  };
  return { runtime, G, enemy, env, trace };
}
test('grunt table covers all saved states and enter transitions use the existing timer', () => {
  const f = fixture();
  assert.deepEqual(Object.keys(gruntTable).sort(), [
    'attack',
    'dying',
    'enter',
    'fade',
    'idle',
    'strike',
  ]);
  f.enemy.t = 0.89;
  advanceGrunts(f.G, 0.02, f.env);
  assert.equal(f.enemy.state, 'idle');
  assert.equal(f.enemy.t, 0);
  advanceGrunts(f.G, 0.1, f.env);
  assert.equal(f.enemy.state, 'idle');
  assert.equal(f.enemy.t, 0.1);
  assert.ok(Object.values(f.enemy.pose).every(Number.isFinite));
});
test('attack freeze leaves its clock unchanged while dying shadows use raw delta', () => {
  const f = fixture(),
    e = f.enemy;
  e.state = 'attack';
  e.t = 0.2;
  f.G.attacker = e;
  f.G.freezeT = 1;
  const lifetime = e.life;
  advanceGrunts(f.G, 0.1, { ...f.env, rawDelta: 0.4 });
  assert.equal(e.t, 0.2);
  assert.equal(e.p, 0.2);
  assert.equal(e.life, lifetime + 0.1);
  e.state = 'dying';
  e.t = 0.7;
  e.deathType = 'split';
  e.shadowTime = 0;
  advanceGrunts(f.G, 0.05, { ...f.env, rawDelta: 0.4 });
  assert.equal(e.shadowTime, 0.4);
  assert.equal(e.t, 0.75);
  assert.equal(f.G.enemies.length, 1);
  advanceGrunts(f.G, 0.2, f.env);
  assert.equal(f.G.enemies.length, 0);
});
test('Zen strike enters fade and removes the same plain record at its existing deadline', () => {
  const f = fixture(),
    e = f.enemy;
  e.state = 'strike';
  e.zen = true;
  e.t = 0.39;
  advanceGrunts(f.G, 0.02, f.env);
  assert.equal(e.state, 'fade');
  assert.equal(e.t, 0);
  advanceGrunts(f.G, 0.51, f.env);
  assert.equal(f.G.enemies.length, 0);
});
test('feint warning precedes its switch and the switch frame retains the previous shown pose', () => {
  const f = fixture(),
    e = f.enemy;
  e.state = 'attack';
  e.fake = 'left';
  e.feintAt = 0.4;
  e.t = 0.29;
  e.pose = { ...EPOSE.left };
  f.G.m.suzu = 1;
  f.G.attacker = e;
  advanceGrunts(f.G, 0.02, f.env);
  assert.deepEqual(f.trace, ['bell']);
  assert.equal(e.switched, false);
  advanceGrunts(f.G, 0.12, f.env);
  assert.deepEqual(f.trace, ['bell', 'feint']);
  assert.equal(e.switched, true);
  assert.deepEqual(e.pose, EPOSE.left);
  advanceGrunts(f.G, 0.01, f.env);
  assert.notDeepEqual(e.pose, EPOSE.left);
});
test('Still applies once and a missed deadline calls the actual fatal damage API', () => {
  const f = fixture(),
    e = f.enemy;
  e.state = 'attack';
  e.t = 0.79;
  f.G.attacker = e;
  f.G.bless.add('still');
  advanceGrunts(f.G, 0.01, f.env);
  assert.equal(e.still, true);
  assert.equal(f.G.slowT, 0.45);
  f.G.slowT = 0.2;
  advanceGrunts(f.G, 0.01, f.env);
  assert.equal(f.G.slowT, 0.2);
  f.G.hard = true;
  advanceGrunts(f.G, 0.3, f.env);
  assert.equal(f.G.state, 'dead');
  assert.equal(f.G.reason, 'late');
  assert.equal(e.state, 'strike');
});
test('behaviour resolution derives variants without adding serialized type fields', () => {
  const f = fixture(),
    e = f.enemy,
    keys = Object.keys(e);
  assert.equal(gruntBehaviours.resolve(e).type, 'grunt');
  e.still = true;
  assert.equal(gruntBehaviours.resolve(e).type, 'still');
  e.zen = true;
  assert.equal(gruntBehaviours.resolve(e).type, 'zen');
  e.fake = 'left';
  assert.equal(gruntBehaviours.resolve(e).type, 'feint');
  assert.equal('type' in e, false);
  assert.ok(keys.every((key) => key in e));
  e.state = 'unknown';
  assert.throws(() => advanceGrunts(f.G, 0.01, f.env), /Undefined character state/);
});
test('a foxfire kill during attack update applies its non-split dying pose in that same frame', () => {
  const f = fixture(),
    e = f.enemy,
    kill = enemyKillFixture(f.runtime);
  kill.views.deathAppearance = () => ({ deathType: 'kneel', fallDir: 1 });
  e.state = 'attack';
  e.T = 0.2;
  e.t = 0;
  e.pose = { ...EPOSE.up };
  f.G.attacker = e;
  f.G.m.foxfire = 1;
  advanceGrunts(f.G, 0.21, {
    ...f.env,
    foxSave: (enemy) => kill.rules.killEnemy(enemy, enemy.dir, true),
  });
  assert.equal(e.state, 'dying');
  assert.equal(e.deathType, 'kneel');
  assert.equal(f.G.foxUsed, true);
  assert.equal(f.G.kills, 1);
  assert.ok(e.pose.gy > EPOSE.up.gy, 'dying pose must begin in the kill frame');
});
