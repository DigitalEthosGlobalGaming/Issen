import test from 'node:test';
import assert from 'node:assert/strict';
import { createActivityScheduler } from '../../src/platform/activity.ts';

test('inactive time freezes frames and timers, including work queued while hidden', () => {
  let clock = 0,
    id = 0;
  const frames = new Map(),
    timers = new Map(),
    calls = [];
  const activity = createActivityScheduler({
    now: () => clock,
    request: (callback) => {
      frames.set(++id, callback);
      return id;
    },
    cancel: (id) => frames.delete(id),
    timeout: (callback, delay) => {
      timers.set(++id, { callback, due: clock + delay });
      return id;
    },
    clearTimeout: (id) => timers.delete(id),
  });
  activity.request((time) => calls.push(time));
  activity.timeout(() => calls.push('timer'), 1000);
  clock = 400;
  activity.setActive(false);
  assert.equal(frames.size, 0);
  assert.equal(timers.size, 0);
  clock = 10400;
  assert.equal(activity.now(), 400);
  activity.request((time) => calls.push(time));
  const cancelled = activity.timeout(() => calls.push('cancelled'), 5);
  activity.clearTimeout(cancelled);
  activity.setActive(true);
  assert.equal(activity.now(), 400);
  assert.equal(frames.size, 2);
  assert.equal(timers.size, 1);
  assert.equal([...timers.values()][0].due, 11000);
  for (const callback of frames.values()) callback(clock);
  assert.deepEqual(calls, [400, 400]);
  clock = 11000;
  [...timers.values()][0].callback();
  assert.deepEqual(calls, [400, 400, 'timer']);
});
