import test from 'node:test';
import assert from 'node:assert/strict';
import { bindDamageFeedback } from '../../src/presentation/damage-feedback.ts';
import { saveWithFoxfire } from '../../src/game/player/companions.ts';
import { createGrunt } from '../../src/game/combat/grunt-spawn.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { deathPhaseFixture } from './helpers/runtime-death-phase.mjs';

const setup = { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false };
function feedbackCalls() {
  const calls = [], random = restorableRng(52);
  const call = name => (...args) => { calls.push([name, ...args]); random.next(); };
  const views = { W: 200, H: 400, S: 1 };
  for (const name of ['addSlash', 'inkBurst', 'scraps', 'flash', 'shake', 'pop', 'renderLives',
    'setScore', 'hud', 'inkPulse', 'letterbox', 'clearLetterbox', 'resetPlayer', 'clearHints',
    'hideBossBar', 'banner', 'stamp']) views[name] = call(name);
  views.sfx = { hurt: call('hurt'), death: call('death'), glint: call('glint') };
  views.combatHaptics = { play: call('haptic') };
  return { views, calls, random };
}

test('actual ward, life loss, death and each revival preserve rules/profile/RNG without cosmetic listeners', () => {
  function drive(enabled, revival) {
    const runtime = runStartSession(3441, setup), f = deathPhaseFixture(runtime), G = runtime.run;
    const feedback = feedbackCalls(), events = [];
    const off = enabled ? bindDamageFeedback(runtime.views.events, () => feedback.views) : () => {};
    runtime.views.events.on('struck', e => { assert.ok(Object.isFrozen(e)); events.push(e); });
    G.lives = 2; G.runWards = 1; G.combo = 9;
    f.phase.playerDie(null, 'wrong');
    assert.equal(G.lives, 2);
    f.phase.playerDie(null, 'wrong');
    assert.equal(G.lives, 1);
    f.phase.playerDie(null, 'late');
    f.phase.playerDie(null, 'late');
    assert.equal(G.state, 'dead');
    assert.equal(events.length, 3);
    assert.deepEqual(events.map(e => [e.fatal, e.lifeLost]), [[false, false], [false, true], [true, true]]);
    assert.deepEqual(events.map(e => [e.x, e.y, e.height]), [[100, 200, 150], [100, 200, 150], [100, 200, 150]]);
    if (revival === 'phoenix') { G.bless.add('phoenix'); f.phase.updateDeath(2); }
    else if (revival === 'daruma') { G.m.daruma = 1; f.phase.updateDeath(2); }
    else f.phase.reviveDaruma(false, true);
    assert.equal(G.state, 'playing');
    assert.equal(G.lives, revival === 'phoenix' ? G.maxLives : revival === 'support' ? Math.ceil(G.maxLives / 2) : 1);
    if (enabled) {
      assert.equal(feedback.calls.filter(c => c[0] === 'death').length, 1);
      assert.equal(feedback.calls.filter(c => c[0] === 'hurt').length, 2);
      assert.ok(feedback.calls.some(c => c[0] === 'addSlash' && c[1] === 160 && c[2] === 53));
      assert.deepEqual(feedback.calls.filter(c => c[0] === 'inkPulse').map(c => c[1]), [1, 0]);
      assert.equal(feedback.calls.filter(c => c[0] === 'resetPlayer').length, 1);
    }
    const count = feedback.calls.length;
    off();
    runtime.views.events.emit('struck', events.at(-1));
    runtime.views.events.emit('revived', { kind: revival, lives: G.lives });
    assert.equal(feedback.calls.length, count);
    return { run: structuredClone(G), stats: structuredClone(runtime.views.ST),
      rng: runtime.random.state(), visual: feedback.random.state(), count };
  }
  for (const revival of ['phoenix', 'daruma', 'support']) {
    const on = drive(true, revival), off = drive(false, revival);
    assert.deepEqual(on.run, off.run);
    assert.deepEqual(on.stats, off.stats);
    assert.equal(on.rng, off.rng);
    assert.notEqual(on.visual, off.visual);
    assert.ok(on.count > 0);
    assert.equal(off.count, 0);
  }
});

test('actual tanto and foxfire saves emit frozen geometry and feedback disposal removes all subscriptions', () => {
  const runtime = runStartSession(3441, setup), f = deathPhaseFixture(runtime), G = runtime.run;
  const feedback = feedbackCalls(), saved = [];
  const off = bindDamageFeedback(runtime.views.events, () => feedback.views);
  runtime.views.events.on('companionSaved', e => { assert.ok(Object.isFrozen(e)); saved.push(e); });
  const enemy = () => createGrunt(G, 0, false, () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 }), () => .5);
  G.tanto = 1;
  const attacker = enemy();
  attacker.state = 'attack';
  f.phase.playerDie(attacker, 'late');
  saveWithFoxfire(enemy(), { events: runtime.views.events, killEnemy: f.views.killEnemy });
  assert.deepEqual(saved, [{ kind: 'tanto', x: 100, y: 27.5 }, { kind: 'foxfire', x: 0, y: 0 }]);
  assert.deepEqual(feedback.calls.filter(c => c[0] === 'pop'), [['pop', 100, 27.5, 'Tanto'], ['pop', 0, 0, '狐火']]);
  const count = feedback.calls.length;
  off(); off();
  for (const event of [...saved]) runtime.views.events.emit('companionSaved', event);
  assert.equal(feedback.calls.length, count);
});
