import test from 'node:test';
import assert from 'node:assert/strict';
import { bindStandoffFeedback } from '../../src/presentation/standoff-feedback.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { standoffPhaseFixture } from './helpers/runtime-standoff-phase.mjs';

test('actual challenger cuts retain outcomes and gameplay RNG with feedback enabled or disabled', () => {
  function drive(enabled) {
    const runtime = runStartSession(6512, { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false });
    const fixture = standoffPhaseFixture(runtime), visual = restorableRng(55), calls = [];
    const call = name => (...args) => { visual.next(); calls.push([name, ...args]); };
    const feedback = {
      W: 200, H: 400, S: 1, addSlash: call('slash'), killFx: call('kill'),
      scraps: call('scraps'), ring: call('ring'), stamp: call('stamp'),
      punch: call('punch'), flash: call('flash'),
      sfx: { perfect: call('perfect') }, combatHaptics: { play: call('haptic') },
    };
    const off = enabled ? bindStandoffFeedback(runtime.views.events, () => feedback) : () => {};
    let result;
    runtime.views.events.on('standoffResolved', event => { result = event; });
    fixture.phase.startStandoff(2, false);
    for (let tick = 0; tick < 1000 && !runtime.run.so.fired; tick++) fixture.phase.update(fixture.views, .01);
    assert.ok(runtime.run.so.fired, 'challenger must expose its real cut window');
    const enemy = runtime.run.so.e;
    fixture.phase.onSwipe(fixture.views, enemy.dir);
    assert.equal(enemy.state, 'dying');
    assert.equal(result.won, true);
    assert.ok(Object.isFrozen(result));
    if (enabled) {
      assert.equal(calls[0][0], 'slash');
      assert.equal(calls.find(c => c[0] === 'ring')[3], enemy.pos.h * .1);
      assert.ok(calls.some(c => c[0] === 'perfect'));
    }
    const count = calls.length;
    off();
    runtime.views.events.emit('standoffResolved', result);
    assert.equal(calls.length, count, 'disposal must remove cosmetic subscription');
    return { run: structuredClone(runtime.run), stats: structuredClone(runtime.views.ST), random: runtime.random.state(), visual: visual.state(), calls };
  }
  const on = drive(true), off = drive(false);
  assert.deepEqual(on.run, off.run);
  assert.deepEqual(on.stats, off.stats);
  assert.equal(on.random, off.random);
  assert.notEqual(on.visual, off.visual);
  assert.ok(on.calls.length > 0);
  assert.equal(off.calls.length, 0);
});
