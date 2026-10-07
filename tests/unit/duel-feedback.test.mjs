import test from 'node:test';
import assert from 'node:assert/strict';
import { bindDuelFeedback } from '../../src/presentation/duel-feedback.ts';
import { createEventBus } from '../../src/game/events.ts';
import { restorableRng } from '../../src/shared/random.ts';
import { runStartSession } from './helpers/runtime-run-start-session.mjs';
import { bossPhaseFixture } from './helpers/runtime-boss-phase.mjs';
function feedback(calls, visual) {
  const call =
    (name) =>
    (...args) => {
      visual.next();
      calls.push([name, ...args]);
    };
  return {
    S: 1,
    sparks: call('sparks'),
    ring: call('ring'),
    shake: call('shake'),
    flash: call('flash'),
    sfx: { clang: call('clang'), block: call('block') },
    combatHaptics: { play: call('haptic') },
    letterbox: call('letterbox'),
    buzz: call('buzz'),
  };
}
test('duel reactions preserve the original sword-tip effects and dispose both subscriptions', () => {
  const events = createEventBus(),
    calls = [],
    visual = restorableRng(54);
  const off = bindDuelFeedback(events, () => feedback(calls, visual));
  events.emit('parry', { x: 10, y: 20 });
  assert.deepEqual(calls[0], ['sparks', 10, 20, 24]);
  assert.ok(calls.some((c) => c[0] === 'clang'));
  calls.length = 0;
  events.emit('block', { x: 30, y: 40 });
  assert.deepEqual(calls[0], ['sparks', 30, 40, 16]);
  assert.ok(calls.some((c) => c[0] === 'block'));
  off();
  calls.length = 0;
  events.emit('parry', {});
  events.emit('block', {});
  assert.deepEqual(calls, []);
});
test('actual parry/block/defeat outcomes and gameplay RNG match with cosmetic listeners enabled or disabled', () => {
  function drive(enabled) {
    const runtime = runStartSession(5477, {
      mode: 'waves',
      diff: 'normal',
      arrows: true,
      lives: '3',
      upgrades: false,
    });
    const f = bossPhaseFixture(runtime),
      calls = [],
      visual = restorableRng(765);
    if (enabled) bindDuelFeedback(runtime.views.events, () => feedback(calls, visual));
    f.phase.startBoss();
    const b = runtime.run.boss;
    b.state = 'flash';
    f.phase.onTapDown(f.views);
    b.chainLeft = 2;
    f.phase.onSwipe(f.views, b.sdir);
    b.hp = 1;
    b.chainLeft = 1;
    f.phase.onSwipe(f.views, b.sdir);
    return {
      run: structuredClone(runtime.run),
      profile: structuredClone(runtime.views.ST),
      random: runtime.random.state(),
      visual: visual.state(),
      calls,
    };
  }
  const enabled = drive(true),
    disabled = drive(false);
  assert.deepEqual(enabled.run, disabled.run);
  assert.deepEqual(enabled.profile, disabled.profile);
  assert.equal(enabled.random, disabled.random);
  assert.notEqual(enabled.visual, disabled.visual);
  assert.ok(enabled.calls.length > 0);
  assert.equal(disabled.calls.length, 0);
});
