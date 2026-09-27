import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameLoop, frameDelta } from '../../src/platform/frame-loop.ts';

test('frame timing composes hit stop, slow motion and time scale', () => {
  const timing = { hitStop: 0.01, slowT: 1, timeScale: 0.3 };
  assert.equal(frameDelta(0.02, timing), 0.02 * 0.06 * 0.5 * 0.3);
  assert.equal(timing.hitStop, -0.01);
  assert.equal(timing.slowT, 0.98);
  assert.equal(frameDelta(0.02, timing), 0.02 * 0.5 * 0.3);
});

test('loop caps elapsed time, renders while paused, and cancels without duplicate scheduling', () => {
  let now = 0,
    id = 0,
    paused = false;
  const pending = new Map(),
    calls = [];
  const scheduler = {
    now: () => now,
    request(callback) {
      pending.set(++id, callback);
      return id;
    },
    cancel(handle) {
      pending.delete(handle);
    },
  };
  const timing = { hitStop: 0, slowT: 0, timeScale: 1 };
  const loop = createFrameLoop(
    timing,
    {
      paused: () => paused,
      update: (delta, raw) => calls.push(['update', delta, raw]),
      render: (raw) => calls.push(['render', raw]),
      afterRender: () => calls.push(['preview']),
    },
    scheduler,
  );
  function step(at) {
    now = at;
    const [handle, callback] = pending.entries().next().value;
    pending.delete(handle);
    callback(at);
  }
  loop.start();
  loop.start();
  assert.equal(pending.size, 1);
  step(500);
  assert.deepEqual(calls, [['update', 0.05, 0.05], ['render', 0.05], ['preview']]);
  calls.length = 0;
  paused = true;
  timing.hitStop = 1;
  step(510);
  assert.deepEqual(calls, [['render', 0.01], ['preview']]);
  assert.equal(timing.hitStop, 0.99);
  now = 9000;
  loop.resetClock();
  calls.length = 0;
  step(9010);
  assert.deepEqual(calls, [['render', 0.01], ['preview']]);
  loop.stop();
  loop.stop();
  assert.equal(pending.size, 0);
  now = 10000;
  loop.start();
  paused = false;
  timing.hitStop = 0;
  calls.length = 0;
  step(10010);
  assert.deepEqual(calls[0], ['update', 0.01, 0.01]);
  loop.stop();
});

test('stopping inside a frame does not schedule a replacement', () => {
  let callback,
    requests = 0;
  const loop = createFrameLoop(
    { hitStop: 0, slowT: 0, timeScale: 1 },
    {
      paused: () => false,
      update: () => {},
      render: () => {},
      afterRender: () => loop.stop(),
    },
    {
      now: () => 0,
      request: (cb) => {
        callback = cb;
        return ++requests;
      },
      cancel: () => {},
    },
  );
  loop.start();
  callback(16);
  assert.equal(requests, 1);
});
