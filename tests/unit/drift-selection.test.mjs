import test from 'node:test';
import assert from 'node:assert/strict';
import {
  driftAtlasIds,
  DRIFT_MIXTURES,
  DRIFT_BY_ID,
} from '../../src/rendering/scene/drift-catalog.ts';

test('drift selection covers every scene sprite with only its required families', () => {
  assert.deepEqual(driftAtlasIds(0), ['leaves', 'petals']);
  assert.deepEqual(driftAtlasIds(4), ['leaves', 'debris']);
  assert.deepEqual(driftAtlasIds(6), ['debris', 'fire']);
  assert.deepEqual(driftAtlasIds(9), ['fire']);
  for (let stage = 0; stage < DRIFT_MIXTURES.length; stage++) {
    const ids = driftAtlasIds(stage);
    assert.ok(ids.length <= 3);
    for (const [sprite] of DRIFT_MIXTURES[stage])
      assert.ok(ids.includes(DRIFT_BY_ID.get(sprite).atlas));
  }
  assert.deepEqual(driftAtlasIds(), ['leaves', 'petals', 'debris', 'fire']);
  assert.deepEqual(driftAtlasIds(-1), driftAtlasIds(0));
});
