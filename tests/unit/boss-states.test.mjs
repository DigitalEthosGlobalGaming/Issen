import test from 'node:test';
import assert from 'node:assert/strict';
import { bossStateTable } from '../../src/game/encounters/boss-states.ts';
import { advanceBoss } from '../../src/game/encounters/boss-simulation.ts';
import { bossBehaviours } from '../../src/game/encounters/boss-behaviours.ts';
import { createBoss } from '../../src/game/encounters/boss-create.ts';
import { computeModifiers } from '../../src/game/equipment/modifiers.ts';
import { EPOSE } from '../../src/shared/figure-model.ts';
function fixture(count = 1) {
  const pos = { x: 20, y: 30, h: 40, fog: 0, alpha: 1 };
  const b = createBoss(count, 'normal', computeModifiers([], new Set()), () => ({ ...pos }));
  const G = { boss: b, state: 'boss' },
    calls = [];
  const env = {
    random: () => {
      calls.push('random');
      return 0.5;
    },
    sounds: { glint: () => calls.push('glint'), feint: () => calls.push('feint') },
    flash: (amount) => calls.push(['flash', amount]),
    playerDie: () => {
      G.state = 'dead';
      calls.push('death');
    },
    recovered: () => calls.push('recovered'),
    position: () => ({ ...pos }),
  };
  return { b, G, env, calls };
}
test('boss table covers all existing states and rejects an unknown restored state', () => {
  assert.deepEqual(Object.keys(bossStateTable), [
    'enter',
    'idle',
    'windup',
    'flash',
    'feint',
    'stagger',
    'recover',
    'hurt',
    'strike',
    'dying',
  ]);
  const { b, G, env } = fixture();
  b.state = 'unknown';
  assert.throws(() => advanceBoss(G, 0, env), /Undefined character state/);
});
test('boss windup transition retains the raised pose and flash until the next dispatch', () => {
  const { b, G, env, calls } = fixture();
  b.state = 'windup';
  b.t = 0;
  b.dur = 0.1;
  advanceBoss(G, 0.1, env);
  assert.equal(b.state, 'flash');
  assert.equal(b.t, 0);
  assert.equal(b.glint, 1);
  assert.deepEqual(calls, ['glint', ['flash', 0.14]]);
  for (const k of Object.keys(b.pose))
    assert.ok(
      Math.abs(
        b.pose[k] - (EPOSE.guard[k] + (EPOSE.raise[k] - EPOSE.guard[k]) * (1 - Math.exp(-3))),
      ) < 1e-12,
    );
});
test('paused boss attack clocks advance but do not attack or recover', () => {
  const { b, G, env, calls } = fixture();
  G.state = 'paused';
  b.state = 'idle';
  b.idleT = 0;
  advanceBoss(G, 0.2, env);
  assert.equal(b.state, 'idle');
  b.state = 'stagger';
  b.window = 0;
  b.blockT = 0.1;
  advanceBoss(G, 0.2, env);
  assert.equal(b.state, 'stagger');
  assert.equal(b.blockT, -0.1);
  assert.deepEqual(calls, []);
});
test('hurt and Zen strike recovery keep their distinct timers and flags', () => {
  const { b, G, env, calls } = fixture();
  b.state = 'hurt';
  b.t = 0;
  advanceBoss(G, 0.5, env);
  assert.equal(b.state, 'idle');
  assert.equal(b.t, 0);
  assert.equal(b.idleT, b.bp.idleMin * 0.8 + 0.5 * (b.bp.idleMax - b.bp.idleMin));
  b.state = 'strike';
  b.t = 0;
  b.zenBack = true;
  advanceBoss(G, 0.4, env);
  assert.equal(b.state, 'strike');
  advanceBoss(G, 0.001, env);
  assert.equal(b.state, 'recover');
  assert.equal(b.t, 0);
  assert.equal(b.fromStrike, true);
  assert.equal(b.zenBack, false);
  advanceBoss(G, 0.35, env);
  assert.equal(b.fromStrike, false);
  assert.equal(b.twinDone, false);
  assert.deepEqual(calls, ['random', 'random']);
});
test('boss dying uses raw shadow time and expires without another pose or position update', () => {
  const { b, G, env } = fixture();
  b.state = 'dying';
  b.t = 1.7;
  let positions = 0;
  env.position = () => {
    positions++;
    return b.pos;
  };
  env.rawDelta = 0.4;
  advanceBoss(G, 0.1, env);
  assert.equal(b.shadowTime, 0.4);
  assert.equal(G.boss, null);
  assert.equal(positions, 0);
});
test('registry selects existing boss definitions without adding serialized discriminants', () => {
  assert.deepEqual(bossBehaviours.types(), ['mirror', 'twin', 'spear', 'base']);
  for (const [count, type] of [
    [1, 'base'],
    [4, 'twin'],
    [5, 'spear'],
    [6, 'mirror'],
  ]) {
    const { b } = fixture(count);
    assert.equal(bossBehaviours.resolve(b).type, type);
    assert.equal(Object.hasOwn(b, 'type'), false);
  }
  const { b, G, env, calls } = fixture(6);
  b.state = 'idle';
  b.idleT = 0;
  advanceBoss(G, 0.1, env);
  assert.equal(b.state, 'windup');
  assert.deepEqual(calls, ['random']);
});
