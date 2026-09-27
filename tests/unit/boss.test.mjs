import test from 'node:test';
import assert from 'node:assert/strict';
import { updateBoss } from '../../src/game/encounters/boss-update.ts';
import { bossPosition } from '../../src/rendering/figures/boss-position.ts';
import { createLayout } from '../../src/rendering/layout.ts';
import { EPOSE } from '../../src/rendering/figures/model.ts';
import { createBoss } from '../../src/game/encounters/boss-create.ts';
import { parryOpening, chainLength } from '../../src/game/encounters/boss-openings.ts';
import { computeModifiers } from '../../src/game/equipment/modifiers.ts';
import { bossParameters } from '../../src/game/encounters/configuration.ts';

test('boss factory cycles definitions and applies spear timings without sharing state', () => {
  const modifiers = computeModifiers([], new Set()),
    position = (b) => bossPosition(b, createLayout(390, 844));
  const first = createBoss(1, 'normal', modifiers, position),
    again = createBoss(7, 'normal', modifiers, position);
  assert.equal(first.def, again.def);
  assert.equal(again.lap, 1);
  assert.equal(again.hp, 6);
  assert.notEqual(first.pose, again.pose);
  assert.notEqual(first.bp, again.bp);
  const spear = createBoss(5, 'ronin', modifiers, position),
    base = bossParameters(5, 'ronin', modifiers);
  assert.equal(spear.hp, 6);
  assert.equal(spear.bp.flash, base.flash * 0.8);
  assert.equal(spear.bp.wind, base.wind * 1.2);
});
test('Twin requires two parries and counter damage cannot finish the boss', () => {
  const modifiers = computeModifiers([], new Set());
  const boss = createBoss(4, 'normal', modifiers, (b) => bossPosition(b, createLayout(390, 844)));
  const input = { count: 4, mode: 'normal', chainModifier: -20, counter: true },
    hp = boss.hp;
  assert.deepEqual(
    parryOpening(boss, input, () => 0.5),
    { second: true, counterDamage: false },
  );
  assert.equal(boss.state, 'windup');
  assert.equal(boss.hp, hp);
  assert.deepEqual(
    parryOpening(boss, input, () => 0.5),
    { second: false, counterDamage: true },
  );
  assert.equal(boss.state, 'stagger');
  assert.equal(boss.hp, hp - 1);
  assert.equal(boss.chainLen, 1);
  boss.hp = 1;
  boss.twinDone = true;
  assert.equal(parryOpening(boss, input, () => 0.5).counterDamage, false);
  assert.equal(boss.hp, 1);
});
test('Mirror openings use opposite direction and difficulty increases chain thresholds', () => {
  const boss = createBoss(6, 'normal', computeModifiers([], new Set()), (b) =>
    bossPosition(b, createLayout(390, 844)),
  );
  parryOpening(boss, { count: 6, mode: 'normal', chainModifier: 0, counter: false }, () => 0);
  assert.equal(boss.sdir, 'up');
  assert.equal(boss.sfake, 'down');
  assert.equal(boss.sflip, boss.window * 0.42);
  assert.equal(
    chainLength(1, 'normal', () => 0),
    1,
  );
  assert.equal(
    chainLength(1, 'ronin', () => 0),
    2,
  );
  assert.equal(
    chainLength(3, 'normal', () => 0),
    3,
  );
  assert.equal(
    chainLength(5, 'normal', () => 0.9),
    3,
  );
});
function fixture() {
  const boss = {
    state: 'enter',
    t: 0,
    life: 0,
    pose: { ...EPOSE.guard },
    lean: 0,
    glint: 0,
    idleT: 1,
    dur: 1,
    lastFeint: false,
    twinDone: false,
    sdir: 'up',
    sfake: null,
    sflip: 0.42,
    flipped: false,
    blockT: 0,
    window: 1,
    bp: { idleMin: 0.3, idleMax: 0.7, feint: 0, wind: 1, flash: 0.3 },
    pos: { x: 100, y: 200, h: 150, fog: 0, alpha: 1 },
  };
  const state = { boss, state: 'boss' },
    events = [],
    layout = createLayout(390, 844);
  const env = {
    random: () => 0.5,
    sounds: { glint: () => events.push('glint'), feint: () => events.push('feint') },
    flash: () => events.push('flash'),
    playerDie: () => {
      events.push('death');
      state.state = 'dead';
    },
    recovered: () => events.push('recovered'),
    position: (b) => bossPosition(b, layout),
  };
  return { boss, state, events, env };
}
test('boss progresses through entry, windup and glint with one missed-parry outcome', () => {
  const { boss, state, events, env } = fixture();
  updateBoss(state, 1.4, env);
  assert.equal(boss.state, 'idle');
  updateBoss(state, boss.idleT, env);
  assert.equal(boss.state, 'windup');
  updateBoss(state, boss.dur, env);
  assert.equal(boss.state, 'flash');
  assert.deepEqual(events, ['glint', 'flash']);
  updateBoss(state, 0.3, env);
  assert.equal(state.state, 'dead');
  updateBoss(state, 0.1, env);
  assert.deepEqual(events, ['glint', 'flash', 'death']);
  assert.ok(Object.values(boss.pos).every(Number.isFinite));
});
test('mirror flips once and expired stagger recovers once', () => {
  const { boss, state, events, env } = fixture();
  boss.state = 'stagger';
  boss.sfake = 'down';
  updateBoss(state, 0.5, env);
  assert.equal(boss.flipped, true);
  assert.deepEqual(events, ['feint']);
  updateBoss(state, 0.5, env);
  assert.equal(boss.state, 'recover');
  assert.equal(boss.failed, true);
  assert.deepEqual(events, ['feint', 'recovered']);
  updateBoss(state, 0.35, env);
  assert.equal(boss.state, 'idle');
  assert.deepEqual(events, ['feint', 'recovered']);
});
test('feints recover without a glint and dying bosses are removed at the lifetime boundary', () => {
  const { boss, state, events, env } = fixture();
  boss.state = 'idle';
  env.random = () => 0;
  boss.bp.feint = 1;
  updateBoss(state, 1, env);
  assert.equal(boss.state, 'feint');
  updateBoss(state, boss.dur, env);
  assert.equal(boss.state, 'idle');
  assert.deepEqual(events, []);
  updateBoss(state, boss.idleT, env);
  assert.equal(boss.state, 'windup');
  boss.state = 'dying';
  boss.t = 0;
  updateBoss(state, 1.79, env);
  assert.equal(state.boss, boss);
  updateBoss(state, 0.02, env);
  assert.equal(state.boss, null);
});
