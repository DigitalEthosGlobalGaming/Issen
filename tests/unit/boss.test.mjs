import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceBoss as updateBoss } from '../../src/game/encounters/boss-simulation.ts';
import { bossPosition } from '../../src/rendering/figures/boss-position.ts';
import { createLayout } from '../../src/rendering/layout.ts';
import { EPOSE } from '../../src/shared/figure-model.ts';
import { createBoss } from '../../src/game/encounters/boss-create.ts';
import {
  bossShownDirection,
  parryOpening,
  chainLength,
} from '../../src/game/encounters/boss-openings.ts';
import { DIRS, OPP } from '../../src/shared/directions.ts';
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
test('Mirror never feints and consistently shows the opposite counter direction', () => {
  const boss = createBoss(6, 'normal', computeModifiers([], new Set()), (b) =>
    bossPosition(b, createLayout(390, 844)),
  );
  parryOpening(boss, { count: 6, mode: 'normal', chainModifier: 0, counter: false }, () => 0);
  assert.equal(boss.sdir, 'up');
  assert.equal(boss.bp.feint, 0);
  for (const dir of DIRS) {
    boss.sdir = dir;
    assert.equal(bossShownDirection(boss), OPP[dir]);
  }
  const regular = createBoss(3, 'normal', computeModifiers([], new Set()), (b) =>
    bossPosition(b, createLayout(390, 844)),
  );
  assert.ok(regular.bp.feint > 0);
  assert.equal(bossShownDirection(regular), regular.sdir);
  const ronin = createBoss(12, 'ronin', computeModifiers([], new Set()), (b) =>
    bossPosition(b, createLayout(390, 844)),
  );
  assert.equal(ronin.bp.feint, 0);
});
test('difficulty increases chain thresholds', () => {
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
    def: {},
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
    events: { emit: (name, event) => events.push([name, event]) },
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
  assert.deepEqual(events, [['bossCue', { kind: 'draw' }]]);
  updateBoss(state, 0.3, env);
  assert.equal(state.state, 'dead');
  updateBoss(state, 0.1, env);
  assert.deepEqual(events, [['bossCue', { kind: 'draw' }], 'death']);
  assert.ok(Object.values(boss.pos).every(Number.isFinite));
});
test('Mirror holds the opposite blade pose throughout each opening and recovers once', () => {
  const { boss, state, events, env } = fixture();
  boss.state = 'stagger';
  boss.def.mirror = 1;
  for (const dir of DIRS) {
    boss.sdir = dir;
    boss.t = 0;
    boss.pose = { ...EPOSE[OPP[dir]] };
    for (let step = 0; step < 9; step++) {
      updateBoss(state, 0.1, env);
      assert.deepEqual(boss.pose, EPOSE[OPP[dir]]);
      assert.equal(bossShownDirection(boss), OPP[dir]);
      assert.equal(boss.state, 'stagger');
    }
  }
  assert.deepEqual(events, []);
  updateBoss(state, 0.11, env);
  assert.equal(boss.state, 'recover');
  assert.equal(boss.failed, true);
  assert.deepEqual(events, ['recovered']);
  updateBoss(state, 0.35, env);
  assert.equal(boss.state, 'idle');
  assert.deepEqual(events, ['recovered']);
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
