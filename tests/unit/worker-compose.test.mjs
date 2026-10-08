import test from 'node:test';
import assert from 'node:assert/strict';
import { setImmediate as nextTurn } from 'node:timers/promises';
import { createWorkerContextProxy } from '../../src/rendering/environment/worker-canvas.ts';
import { copyComposedLayers } from '../../src/rendering/environment/layer-transfer.ts';

test('worker context retains bound native methods and unwraps only image consumers', () => {
  const calls = [];
  const source = { bitmap: {} };
  const native = { globalAlpha: 1 };
  for (const name of ['drawImage', 'createPattern', 'clearRect', 'setTransform', 'getImageData']) {
    native[name] = function (...args) {
      assert.equal(this, native);
      calls.push({ name, args });
      return name;
    };
  }
  let unwraps = 0;
  const ctx = createWorkerContextProxy(native, (value) => {
    unwraps++;
    return value === source ? source.bitmap : value;
  });
  const clear = ctx.clearRect;
  assert.equal(clear, ctx.clearRect);
  assert.equal(ctx.drawImage, ctx.drawImage);
  assert.equal(ctx.createPattern, ctx.createPattern);
  assert.equal(ctx.getImageData, ctx.getImageData);
  ctx.globalAlpha = 0.25;
  assert.equal(native.globalAlpha, 0.25);
  assert.equal(clear(1, 2, 3, 4), 'clearRect');
  ctx.setTransform(source);
  ctx.getImageData(0, 0, 1, 1);
  ctx.drawImage(source, 1, 2, 3, 4);
  ctx.createPattern(source, 'repeat');
  assert.equal(unwraps, 2);
  assert.equal(calls[1].args[0], source);
  assert.equal(calls[3].args[0], source.bitmap);
  assert.deepEqual(calls[3].args.slice(1), [1, 2, 3, 4]);
  assert.deepEqual(calls[4].args, [source.bitmap, 'repeat']);
});

function fixture() {
  const source = (name) => ({ name });
  const entries = [
    {
      colour: source('rear'),
      material: {
        normal: { source: source('normal') },
        surface: { source: source('surface') },
        emissive: { source: source('emissive') },
      },
    },
    { colour: source('front'), material: null },
  ];
  const pending = [];
  const copy = (source, colour) =>
    new Promise((resolve, reject) => {
      const bitmap = {
        source,
        colour,
        closed: 0,
        close() {
          this.closed++;
        },
      };
      pending.push({ source, colour, bitmap, resolve: () => resolve(bitmap), reject });
    });
  return { entries, pending, copy };
}

test('all layer/foreground planes copy concurrently and preserve order and optional maps', async () => {
  const f = fixture();
  const completed = copyComposedLayers(f.entries, f.copy);
  await nextTurn();
  assert.equal(f.pending.length, 5, 'every copy starts before any settles');
  assert.deepEqual(
    f.pending.map((p) => p.colour),
    [true, false, false, false, true],
  );
  for (const p of [...f.pending].reverse()) p.resolve();
  const layers = await completed;
  assert.deepEqual(Object.keys(layers[0]), ['colour', 'normal', 'surface', 'emissive']);
  assert.deepEqual(Object.keys(layers[1]), ['colour']);
  assert.deepEqual(
    layers.map((layer) => layer.colour.source.name),
    ['rear', 'front'],
  );
  assert.equal(layers[0].normal.source.name, 'normal');
  assert.ok(f.pending.every((p) => p.bitmap.closed === 0));
});

test('failed copies wait for late sibling planes and close every acquired bitmap exactly once', async () => {
  const f = fixture();
  const failure = Error('copy failed');
  let settled = false;
  const completed = copyComposedLayers(f.entries, f.copy);
  const rejected = assert
    .rejects(completed, (error) => error === failure)
    .then(() => {
      settled = true;
    });
  await nextTurn();
  f.pending[0].resolve();
  f.pending[1].reject(failure);
  await nextTurn();
  assert.equal(settled, false, 'cleanup waits for pending siblings and other layers');
  for (const p of f.pending.slice(2)) p.resolve();
  await rejected;
  assert.deepEqual(
    f.pending.map((p) => p.bitmap.closed),
    [1, 0, 1, 1, 1],
  );
});

test('synchronous copy failure still closes asynchronous copies in other planes', async () => {
  const f = fixture();
  const completed = copyComposedLayers(f.entries, (source, colour) => {
    if (source.name === 'normal') throw Error('synchronous copy failure');
    return f.copy(source, colour);
  });
  const rejected = assert.rejects(completed, /synchronous copy failure/);
  await nextTurn();
  assert.equal(f.pending.length, 4);
  for (const p of f.pending) p.resolve();
  await rejected;
  assert.ok(f.pending.every((p) => p.bitmap.closed === 1));
});
