import test from 'node:test';
import assert from 'node:assert/strict';
import { createStateMachine } from '../../src/game/state-machine.ts';
import { createBehaviourRegistry } from '../../src/game/behaviour-registry.ts';

test('plain state transitions reset only the existing timer and order exit before entry', () => {
  const record = { state: 'idle', t: 2, hp: 3 },
    trace = [];
  const machine = createStateMachine({
    idle: { exit: (r) => trace.push(['exit', r.state, r.t]) },
    attack: { enter: (r) => trace.push(['enter', r.state, r.t]) },
  });
  machine.transition(record, 'attack', {});
  assert.deepEqual(trace, [
    ['exit', 'idle', 2],
    ['enter', 'attack', 0],
  ]);
  assert.deepEqual(record, { state: 'attack', t: 0, hp: 3 });
  assert.deepEqual(Object.keys(record), ['state', 't', 'hp']);
});
test('table dispatch validates restored states and cannot enter undefined states', () => {
  const record = { state: 'idle', t: 4 },
    machine = createStateMachine({ idle: {} });
  assert.throws(() => machine.transition(record, 'missing', {}), /Undefined character state/);
  assert.deepEqual(record, { state: 'idle', t: 4 });
  assert.throws(
    () => machine.update({ state: 'missing', t: 1 }, {}, 0.1),
    /Undefined character state/,
  );
});
test('one state update dispatches once and leaves custom timing to its owner', () => {
  const record = { state: 'windup', t: 0.7 },
    trace = [];
  const machine = createStateMachine({
    windup: { update: () => trace.push('windup'), next: (r) => (r.t >= 0.5 ? 'flash' : undefined) },
    flash: { enter: () => trace.push('enter-flash'), update: () => trace.push('flash') },
  });
  machine.update(record, {}, 0.2);
  assert.deepEqual(trace, ['windup', 'enter-flash']);
  assert.equal(record.t, 0);
  machine.update(record, {}, 0.2);
  assert.deepEqual(trace, ['windup', 'enter-flash', 'flash']);
  assert.equal(record.t, 0, 'freeze/raw clocks must not be advanced twice by the dispatcher');
});
test('a registry entry extends existing plain records without a central type branch', () => {
  const registry = createBehaviourRegistry();
  const spear = { table: { idle: {} }, reach: 2 },
    base = { table: { idle: {} }, reach: 1 };
  registry.register('spear', { matches: (record) => !!record.def.spear, behaviour: spear });
  registry.register('base', { matches: () => true, behaviour: base });
  const record = { state: 'idle', t: 0, def: { spear: 1 } },
    keys = Object.keys(record);
  assert.equal(registry.resolve(record).behaviour, spear);
  assert.equal(registry.resolve({ ...record, def: {} }).behaviour, base);
  assert.equal(registry.get('spear'), spear);
  assert.deepEqual(registry.types(), ['spear', 'base']);
  assert.deepEqual(Object.keys(record), keys);
  assert.throws(
    () => registry.register('spear', { matches: () => true, behaviour: base }),
    /Duplicate/,
  );
  assert.throws(() => registry.get('missing'), /Unknown/);
});
