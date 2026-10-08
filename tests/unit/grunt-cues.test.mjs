import test from 'node:test';
import assert from 'node:assert/strict';
import { bindGruntCues } from '../../src/presentation/grunt-cues.ts';
import { advanceGrunts } from '../../src/game/combat/grunt.ts';
import { createGrunt } from '../../src/game/combat/grunt-spawn.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { deathPhaseFixture } from './helpers/runtime-death-phase.mjs';

test('actual seeded feint warning, Shiba response, Still and late damage remain independent of warning listeners', () => {
  function drive(enabled) {
    const runtime = runStartSession(2017, { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false });
    const G = runtime.run, values = [], calls = [], visual = restorableRng(86);
    const death = deathPhaseFixture(runtime), position = () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 });
    G.cfg.feint = 1; G.m.suzu = 1; G.bless.add('still');
    const e = createGrunt(G, 0, false, position, runtime.random.next);
    assert.ok(e.fake && e.fake !== e.dir);
    const sfx = Object.fromEntries(['bell', 'feint', 'bark'].map(kind => [kind, () => { calls.push(kind); visual.next(); }]));
    const off = enabled ? bindGruntCues(runtime.views.events, () => ({ sfx })) : () => {};
    runtime.views.events.on('gruntCue', event => {
      assert.ok(Object.isFrozen(event)); assert.deepEqual(Object.keys(event), ['kind']); values.push(event);
    });
    const env = { events: runtime.views.events, surge: 0, time: 1, perfectZone: () => .78,
      pet: 'shiba', foxSave() { assert.fail('no foxfire equipped'); }, playerDie: death.phase.playerDie, position };
    advanceGrunts(G, .91, env);
    assert.equal(e.state, 'idle');
    e.state = 'attack'; e.t = 0; e.T = 1; G.attacker = e;
    advanceGrunts(G, e.feintAt - .1, env);
    assert.deepEqual(values.map(e => e.kind), ['bell']);
    assert.equal(e.switched, false);
    advanceGrunts(G, .11, env);
    assert.equal(e.switched, true);
    assert.equal(G.petT, .6);
    assert.deepEqual(values.map(e => e.kind), ['bell', 'feint', 'bark']);
    advanceGrunts(G, .8 - e.t, env);
    assert.equal(G.slowT, .45);
    assert.equal(e.still, true);
    const lives = G.lives;
    advanceGrunts(G, .21, env);
    assert.equal(G.lives, lives - 1);
    assert.equal(G.hits, 1);
    assert.equal(e.state, 'strike');
    assert.equal(values.length, 3, 'warning and response occur only once');
    assert.deepEqual(calls, enabled ? ['bell', 'feint', 'bark'] : []);
    const length = calls.length;
    off(); runtime.views.events.emit('gruntCue', { kind: 'bell' });
    assert.equal(calls.length, length);
    return { run: structuredClone(G), stats: structuredClone(runtime.views.ST), random: runtime.random.state(), visual: visual.state() };
  }
  const on = drive(true), off = drive(false);
  assert.deepEqual(on.run, off.run); assert.deepEqual(on.stats, off.stats);
  assert.equal(on.random, off.random); assert.notEqual(on.visual, off.visual);
});
