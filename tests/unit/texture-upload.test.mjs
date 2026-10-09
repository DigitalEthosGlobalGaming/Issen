import test from 'node:test';
import assert from 'node:assert/strict';
import { paceTextureUploads, nextVisibleFrame } from '../../src/rendering/texture-upload.ts';

test('uploads yield in bounded batches without changing order or repeating sources', async () => {
  let time = 0,
    frames = 0,
    admissions = 0;
  const order = [],
    controller = new AbortController();
  const ready = await paceTextureUploads([1, 2, 3, 4, 5], controller.signal, {
    nextFrame: async () => {
      frames++;
      return true;
    },
    ready: () => true,
    generation: () => 0,
    now: () => time,
    beforeBatch: () => admissions++,
    upload: (value) => {
      order.push(value);
      time += 3;
    },
  });
  assert.equal(ready, true);
  assert.equal(frames, 3);
  assert.equal(admissions, 3);
  assert.deepEqual(order, [1, 2, 3, 4, 5]);
});

test('hidden/lost contexts wait and a new context restarts previously uploaded sources', async () => {
  let frames = 0,
    generation = 0,
    available = true,
    time = 0;
  const order = [];
  const ready = await paceTextureUploads([1, 2, 3], new AbortController().signal, {
    nextFrame: async () => {
      frames++;
      if (frames === 2) {
        available = false;
        generation++;
      }
      if (frames === 3) available = true;
      return true;
    },
    ready: () => available,
    generation: () => generation,
    now: () => time,
    upload: (value) => {
      order.push(value);
      time += 5;
    },
  });
  assert.equal(ready, true);
  assert.deepEqual(order, [1, 1, 2, 3]);
  assert.equal(frames, 5);
});

test('cancellation stops after the current native upload and never publishes readiness', async () => {
  const controller = new AbortController(),
    order = [];
  assert.equal(
    await paceTextureUploads([1, 2], controller.signal, {
      nextFrame: async () => true,
      ready: () => true,
      generation: () => 0,
      now: () => 0,
      upload: (value) => {
        order.push(value);
        controller.abort();
      },
    }),
    false,
  );
  assert.deepEqual(order, [1]);
});

test('batch admission can cancel before native allocation and its work consumes the budget', async () => {
  const controller = new AbortController();
  let allocations = 0;
  assert.equal(
    await paceTextureUploads([1], controller.signal, {
      nextFrame: async () => true,
      ready: () => true,
      generation: () => 0,
      now: () => 0,
      beforeBatch: () => controller.abort(),
      upload: () => allocations++,
    }),
    false,
  );
  assert.equal(allocations, 0);

  let time = 0,
    frames = 0,
    admittedGeneration = -1;
  const order = [];
  assert.equal(
    await paceTextureUploads([1, 2], new AbortController().signal, {
      nextFrame: async () => {
        frames++;
        return true;
      },
      ready: () => true,
      generation: () => (frames >= 2 ? 1 : 0),
      now: () => time,
      beforeBatch: () => {
        admittedGeneration = frames;
        time += 4;
      },
      upload: (value) => {
        assert.equal(admittedGeneration, frames);
        order.push(value);
      },
    }),
    true,
  );
  assert.deepEqual(order, [1, 1, 2]);
  assert.equal(frames, 3);
});

test('visibility waits retain no frame while hidden and cancel listeners on abort', async () => {
  const doc = new EventTarget(),
    callbacks = new Map();
  let next = 0;
  doc.hidden = true;
  doc.defaultView = {
    requestAnimationFrame(callback) {
      callbacks.set(++next, callback);
      return next;
    },
    cancelAnimationFrame(id) {
      callbacks.delete(id);
    },
  };
  const controller = new AbortController(),
    pending = nextVisibleFrame(doc, controller.signal);
  assert.equal(callbacks.size, 0);
  doc.hidden = false;
  doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(callbacks.size, 1);
  doc.hidden = true;
  doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(callbacks.size, 0);
  controller.abort();
  assert.equal(await pending, false);
  doc.hidden = false;
  doc.dispatchEvent(new Event('visibilitychange'));
  assert.equal(callbacks.size, 0);
});
