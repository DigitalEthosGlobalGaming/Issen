import assert from 'node:assert/strict';
import { test } from 'node:test';
import { packedSourceRegion } from '../../src/rendering/packed-source.ts';

const source = {};
const sprite = {
  metadata: {
    sourceFrame: [100, 200, 40, 50],
    trim: [3, 4],
    frame: [20, 30, 32, 38],
    empty: false,
  },
  colour: source,
  material: {
    normal: { source, revision: 0, frame: [20, 30, 32, 38] },
    surface: { source, revision: 0, frame: [20, 30, 32, 38] },
  },
};
test('logical windows retain trim offsets and crop aligned planes together', () => {
  const full = packedSourceRegion(sprite, [100, 200, 40, 50]);
  assert.deepEqual([full.x, full.y, full.width, full.height], [3, 4, 32, 38]);
  const crop = packedSourceRegion(sprite, [110, 210, 30, 30]);
  assert.deepEqual([crop.x, crop.y, crop.width, crop.height], [0, 0, 25, 30]);
  assert.deepEqual(crop.texture.frame, [27, 36, 25, 30]);
  assert.deepEqual(crop.material.normal.frame, crop.texture.frame);
  assert.deepEqual(crop.material.surface.frame, crop.texture.frame);
  assert.equal(packedSourceRegion(sprite, [100, 200, 2, 2]), null);
  assert.equal(
    packedSourceRegion(
      { ...sprite, metadata: { ...sprite.metadata, empty: true } },
      [100, 200, 40, 50],
    ),
    null,
  );
});
