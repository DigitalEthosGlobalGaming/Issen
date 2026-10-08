import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cutoutNormalTransform,
  materialCutoutKey,
  createMaterialCutouts,
} from '../../src/rendering/material-cutouts.ts';

const rotation = (degrees, mirror = false) => {
  const r = (degrees * Math.PI) / 180,
    c = Math.cos(r),
    s = Math.sin(r);
  return [c * (mirror ? -1 : 1), s * (mirror ? -1 : 1), -s, c];
};
test('two-degree normal bins preserve reflection, anisotropy and shear', () => {
  assert.deepEqual(cutoutNormalTransform(rotation(8.1)), cutoutNormalTransform(rotation(8.9)));
  assert.notDeepEqual(cutoutNormalTransform(rotation(9.1)), cutoutNormalTransform(rotation(8.9)));
  for (const mirror of [false, true]) {
    const input = rotation(8.8, mirror);
    input[0] *= 2;
    input[1] *= 2;
    input[2] += input[0] * 0.2;
    input[3] += input[1] * 0.2;
    const output = cutoutNormalTransform(input);
    const det = (m) => m[0] * m[3] - m[1] * m[2];
    assert.ok(Math.abs(det(input) - det(output)) < 1e-5);
    assert.ok(
      Math.abs(Math.hypot(...input.slice(0, 2)) - Math.hypot(...output.slice(0, 2))) < 1e-5,
    );
    const dot = (m) => m[0] * m[2] + m[1] * m[3];
    assert.ok(Math.abs(dot(input) - dot(output)) < 1e-5);
    assert.deepEqual(cutoutNormalTransform(input, 0), new Float32Array(input));
  }
});

function request() {
  return {
    kind: 'normal',
    map: { source: {}, revision: 0 },
    frame: [0, 0, 4, 4],
    mask: {},
    maskRevision: 0,
    maskFrame: [0, 0, 4, 4],
    width: 4,
    height: 4,
    normalY: -1,
    normalMatrix: cutoutNormalTransform(rotation(8.1)),
  };
}
test('cache keys separate every pixel-affecting source, revision, crop, size and normal selection', () => {
  const ids = new WeakMap();
  let sequence = 0;
  const identity = (source) => {
    if (!ids.has(source)) ids.set(source, ++sequence);
    return ids.get(source);
  };
  const base = request(),
    key = materialCutoutKey(base, identity);
  const variants = [
    { map: { ...base.map, source: {} } },
    { map: { ...base.map, revision: 1 } },
    { map: { ...base.map, frame: [1, 0, 4, 4] } },
    { frame: [1, 0, 4, 4] },
    { kind: 'surface' },
    { kind: 'emissive', map: undefined },
    { mask: {} },
    { maskRevision: 1 },
    { maskFrame: [1, 0, 4, 4] },
    { width: 5 },
    { height: 5 },
    { normalY: 1 },
    { normalMatrix: cutoutNormalTransform(rotation(8.1, true)) },
    { normalMatrix: cutoutNormalTransform(rotation(10.1)) },
  ];
  for (const change of variants)
    assert.notEqual(materialCutoutKey({ ...base, ...change }, identity), key);
  assert.equal(
    materialCutoutKey({ ...base, normalMatrix: cutoutNormalTransform(rotation(8.9)) }, identity),
    key,
  );
});

test('cutout LRU stays under pixel budget, bypasses oversized items and releases sources/scratch', () => {
  const canvases = [],
    contexts = [];
  const doc = {
    createElement() {
      const canvas = {
        width: 1,
        height: 1,
        getContext(type, options) {
          if (!this.context) {
            this.context = { setTransform() {}, clearRect() {}, drawImage() {} };
            contexts.push({ options, canvas });
          }
          return this.context;
        },
      };
      canvases.push(canvas);
      return canvas;
    },
  };
  const cache = createMaterialCutouts(doc, 32),
    base = request();
  let bakes = 0;
  const bake = () => {
    bakes++;
  };
  const a = cache.get(base, bake);
  const bReq = { ...base, mask: {} },
    cReq = { ...base, mask: {} };
  const b = cache.get(bReq, bake);
  assert.equal(cache.get(base, bake), a);
  const c = cache.get(cReq, bake);
  assert.equal(c, b, 'least recently used canvas is reused for the new entry');
  assert.equal(canvases.length, 2, 'eviction avoids allocating another canvas');
  assert.equal(a.width, 4);
  assert.equal(cache.snapshot().pixels, 32);
  assert.equal(cache.snapshot().evictions, 1);
  assert.equal(bakes, 3);
  const oversized = cache.get({ ...base, width: 9, height: 9 }, bake);
  assert.equal(oversized.width, 9);
  assert.equal(cache.snapshot().pixels, 32);
  assert.equal(cache.snapshot().entries, 2);
  assert.equal(
    cache.get({ ...base, width: 9, height: 9 }, bake),
    oversized,
    'oversized scratch is reused',
  );
  assert.equal(
    contexts.filter((row) => row.canvas === b).length,
    1,
    'recycled canvas keeps its context',
  );
  assert.ok(contexts.every((row) => row.options?.willReadFrequently));
  assert.equal(contexts.filter((row) => row.options?.willReadFrequently === false).length, 0);
  cache.invalidate(base.mask);
  assert.equal(a.width, 0);
  assert.equal(c.width, 4);
  cache.clear();
  assert.equal(cache.snapshot().pixels, 0);
  assert.equal(cache.snapshot().scratchPixels, 0);
  assert.ok(canvases.every((canvas) => canvas.width === 0 && canvas.height === 0));
});
