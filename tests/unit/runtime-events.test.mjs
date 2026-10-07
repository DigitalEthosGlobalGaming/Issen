import test from 'node:test';
import assert from 'node:assert/strict';
import { createEventBus } from '../../src/game/events.ts';

test('delivery is synchronous in registration order and preserves rule RNG/state', () => {
  const events = createEventBus(),
    calls = [],
    state = { score: 12, random: 123 };
  events.on('kill', (event) => calls.push(['first', event.score]));
  events.on('kill', (event) => calls.push(['second', event.combo]));
  const payload = { score: state.score, combo: 3 };
  events.emit('kill', payload);
  assert.deepEqual(calls, [
    ['first', 12],
    ['second', 3],
  ]);
  assert.deepEqual(state, { score: 12, random: 123 });
  assert.equal(Object.isFrozen(payload), true);
});

test('nested emissions complete before the outer delivery continues', () => {
  const events = createEventBus(),
    calls = [];
  events.on('outer', () => {
    calls.push('outer-a');
    events.emit('inner', {});
  });
  events.on('inner', () => calls.push('inner'));
  events.on('outer', () => calls.push('outer-b'));
  events.emit('outer', {});
  assert.deepEqual(calls, ['outer-a', 'inner', 'outer-b']);
});

test('subscription changes during delivery apply to the following emission', () => {
  const events = createEventBus(),
    calls = [];
  let remove;
  events.on('tick', () => {
    calls.push('a');
    remove();
    events.on('tick', () => calls.push('c'));
  });
  remove = events.on('tick', () => calls.push('b'));
  events.emit('tick', {});
  assert.deepEqual(calls, ['a', 'b']);
  events.emit('tick', {});
  assert.deepEqual(calls, ['a', 'b', 'a', 'c']);
});

test('duplicate callbacks unsubscribe independently and removal is idempotent', () => {
  const events = createEventBus(),
    calls = [];
  const first = () => calls.push('a');
  events.on('tick', first);
  events.on('tick', () => calls.push('b'));
  const remove = events.on('tick', first);
  remove();
  remove();
  events.emit('tick', {});
  assert.deepEqual(calls, ['a', 'b']);
  events.clear();
  events.emit('tick', {});
  assert.deepEqual(calls, ['a', 'b']);
});

test('listener exceptions propagate synchronously without deferred effects', () => {
  const events = createEventBus();
  events.on('tick', () => {
    throw new Error('listener failed');
  });
  assert.throws(() => events.emit('tick', {}), /listener failed/);
});
