import { bindBossFeedback } from '../../src/presentation/boss-feedback.ts';
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
    W: 390,
    H: 844,
    addSlash: call('slash'),
    killFx: call('killFx'),
    scraps: call('scraps'),
    stamp: call('stamp'),
    punch: call('punch'),
    inkBurst: call('inkBurst'),
    bossStain: call('stain'),
    showBossBar: call('bossbar'),
    sparks: call('sparks'),
    ring: call('ring'),
    shake: call('shake'),
    flash: call('flash'),
    sfx: {
      clang: call('clang'),
      block: call('block'),
      slice: call('slice'),
      bossDie: call('bossDie'),
      caw: call('caw'),
    },
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
test('actual parry/block/cut/defeat outcomes and gameplay RNG match with cosmetic listeners enabled or disabled', () => {
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
    if (enabled) {
      bindDuelFeedback(runtime.views.events, () => feedback(calls, visual));
      bindBossFeedback(runtime.views.events, () => feedback(calls, visual));
    }
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

test('boss cut/victory listeners retain automatic cut geometry, grounded stain and disposal', () => {
  const events = createEventBus(),
    calls = [],
    visual = restorableRng(45);
  const off = bindBossFeedback(events, () => feedback(calls, visual));
  events.emit('bossCut', { direction: 'right', automatic: true, x: 10, y: 20, height: 100 });
  const slash = calls.find((c) => c[0] === 'slash');
  assert.ok(Math.abs(slash[1] - -17.5) < 1e-10);
  assert.ok(Math.abs(slash[3] - 37.5) < 1e-10);
  assert.equal(slash[2], 20);
  assert.equal(slash[4], 20);
  calls.length = 0;
  events.emit('bossDefeated', {
    direction: 'right',
    x: 10,
    y: 20,
    groundY: 75,
    height: 100,
    fog: 0.2,
    alpha: 0.8,
    crow: true,
  });
  assert.deepEqual(
    calls.find((c) => c[0] === 'stain'),
    ['stain', { x: 10, y: 75, h: 100, fog: 0.2, alpha: 0.8 }],
  );
  assert.ok(calls.some((c) => c[0] === 'caw'));
  assert.deepEqual(
    calls.find((c) => c[0] === 'bossbar'),
    ['bossbar', false],
  );
  off();
  calls.length = 0;
  events.emit('bossCut', {});
  events.emit('bossDefeated', {});
  assert.deepEqual(calls, []);
});
