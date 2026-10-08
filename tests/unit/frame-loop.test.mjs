import test from 'node:test';
import assert from 'node:assert/strict';
import { createFrameLoop, frameDelta } from '../../src/platform/frame-loop.ts';

test('high refresh displays retain real time at declared 60 and 30 fps caps', () => {
  let now = 0,
    callback,
    fps = 60,
    updates = [];
  const loop = createFrameLoop(
    { hitStop: 0, slowT: 0, timeScale: 1 },
    {
      maxFps: () => fps,
      paused: () => false,
      update: (delta) => updates.push(delta),
      render() {},
      afterRender() {},
    },
    {
      now: () => now,
      request: (cb) => {
        callback = cb;
        return 1;
      },
      cancel() {},
    },
  );
  loop.start();
  for (let i = 1; i <= 120; i++) {
    now = (i * 1000) / 120;
    callback(now);
  }
  assert.ok(updates.length >= 60 && updates.length <= 61);
  assert.ok(Math.abs(updates.reduce((a, b) => a + b, 0) - 1) < 0.01);
  fps = 30;
  updates = [];
  for (let i = 121; i <= 240; i++) {
    now = (i * 1000) / 120;
    callback(now);
  }
  assert.ok(updates.length >= 30 && updates.length <= 31);
  assert.ok(Math.abs(updates.reduce((a, b) => a + b, 0) - 1) < 0.04);
  loop.stop();
});

test('settled surfaces suppress work without consuming combat timing or catching up', () => {
  let now = 0,
    callback,
    active = false;
  const calls = [];
  const timing = { hitStop: 1, slowT: 1, timeScale: 1 };
  const loop = createFrameLoop(
    timing,
    {
      demand: () => ({ update: active, render: active, afterRender: true }),
      paused: () => false,
      update: (delta, raw) => calls.push(['update', raw]),
      render: () => calls.push(['render']),
      afterRender: () => calls.push(['preview']),
    },
    {
      now: () => now,
      request: (cb) => {
        callback = cb;
        return 1;
      },
      cancel() {},
    },
  );
  loop.start();
  for (let i = 1; i <= 100; i++) {
    now = i * 16;
    callback(now);
  }
  assert.equal(calls.length, 100);
  assert.ok(calls.every((call) => call[0] === 'preview'));
  assert.equal(timing.hitStop, 1);
  assert.equal(timing.slowT, 1);
  active = true;
  now += 16;
  callback(now);
  assert.deepEqual(calls.slice(-3), [['update', 0.016], ['render'], ['preview']]);
  loop.stop();
});

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

test('120 Hz renders preserve the legacy 60 Hz update deltas and hit-stop consumption', () => {
  function drive(renderFps, updateFps) {
    let now = 0,
      callback,
      renders = 0;
    const updates = [],
      timing = { hitStop: 0.12, slowT: 0.2, timeScale: 0.8 };
    const loop = createFrameLoop(
      timing,
      {
        maxFps: () => renderFps,
        ...(updateFps ? { maxUpdateFps: () => updateFps } : {}),
        paused: () => false,
        update: (dt, raw) => updates.push([dt, raw]),
        render: () => renders++,
        afterRender() {},
      },
      {
        now: () => now,
        request(cb) {
          callback = cb;
          return 1;
        },
        cancel() {},
      },
    );
    loop.start();
    for (let tick = 1; tick <= 240; tick++) {
      now = (tick * 1000) / 120;
      callback(now);
    }
    loop.stop();
    return { updates, timing, renders };
  }
  const legacy = drive(60),
    high = drive(120, 60);
  assert.deepEqual(high.updates, legacy.updates);
  assert.deepEqual(high.timing, legacy.timing);
  assert.equal(high.renders, 240);
  assert.ok(legacy.renders >= 120 && legacy.renders <= 121);
});

test('independent updates do not accumulate idle time and reset with the render clock', () => {
  let now = 0,
    callback,
    active = false;
  const updates = [],
    timing = { hitStop: 1, slowT: 1, timeScale: 1 };
  const loop = createFrameLoop(
    timing,
    {
      maxFps: () => 120,
      maxUpdateFps: () => 60,
      demand: () => ({ update: active, render: true, afterRender: false }),
      paused: () => false,
      update: (dt, raw) => updates.push(raw),
      render() {},
      afterRender() {},
    },
    {
      now: () => now,
      request(cb) {
        callback = cb;
        return 1;
      },
      cancel() {},
    },
  );
  loop.start();
  for (let tick = 1; tick <= 120; tick++) {
    now = (tick * 1000) / 120;
    callback(now);
  }
  assert.equal(timing.hitStop, 1);
  active = true;
  now += 1000 / 120;
  callback(now);
  now += 1000 / 120;
  callback(now);
  assert.ok(updates[0] < 0.017);
  now = 9000;
  loop.resetClock();
  now += 10;
  callback(now);
  assert.ok(Math.abs(updates.at(-1) - 0.01) < 1e-9);
  loop.stop();
});

test('switching between menu and gameplay render caps preserves simulation scheduling', () => {
  function drive(independent) {
    let now = 0,
      callback,
      tick = 0;
    const updates = [];
    const loop = createFrameLoop(
      { hitStop: 0, slowT: 0, timeScale: 1 },
      {
        maxFps: () => (independent && tick >= 30 && tick < 153 ? 120 : 60),
        ...(independent ? { maxUpdateFps: () => 60 } : {}),
        paused: () => false,
        update: (dt, raw) => updates.push([now, dt, raw]),
        render() {},
        afterRender() {},
      },
      {
        now: () => now,
        request(cb) {
          callback = cb;
          return 1;
        },
        cancel() {},
      },
    );
    loop.start();
    for (tick = 1; tick <= 240; tick++) {
      now = (tick * 1000) / 120;
      callback(now);
    }
    loop.stop();
    return updates;
  }
  assert.deepEqual(drive(true), drive(false));
});
