import { test } from 'node:test';
import assert from 'node:assert/strict';
import { compositionKey } from '../../src/rendering/environment/worker-types.ts';
import { sceneryCount, sceneryLowQuality } from '../../src/rendering/environment/scenery-detail.ts';

test('detail is an independent composition input and legacy identities remain stable', () => {
  const frame = { width: 390, height: 844, dpr: 2, stage: 3, stageSeed: 123, lowQuality: false };
  assert.equal(compositionKey(frame), '[390,844,2,3,123,false]');
  const keys = ['low', 'normal', 'high'].map((sceneryDetail) =>
    compositionKey({ ...frame, sceneryDetail }),
  );
  assert.equal(new Set(keys).size, 3);
  for (const key of keys) assert.notEqual(key, compositionKey(frame));
  assert.equal(sceneryLowQuality('high', true), false);
  assert.equal(sceneryLowQuality('normal', true), false);
  assert.equal(sceneryLowQuality('low', false), true);
  assert.equal(sceneryLowQuality(undefined, true), true);
});

test('three-tier decorations preserve authored High and unspecified legacy Low', () => {
  assert.deepEqual(
    ['low', 'normal', 'high'].map((detail) => sceneryCount(false, detail, 1, 2, 3, 2)),
    [1, 2, 3],
  );
  assert.equal(sceneryCount(true, undefined, 1, 2, 3, 2), 2);
  assert.equal(sceneryCount(false, undefined, 1, 2, 3, 2), 3);
});
