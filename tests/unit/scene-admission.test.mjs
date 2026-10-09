import test from 'node:test';
import assert from 'node:assert/strict';
import { scenePreparationBytes } from '../../src/rendering/environment/scene-admission.ts';

test('all stage kits reserve decoded inputs, output copies and upload headroom', () => {
  const frame = { width: 390, height: 844, dpr: 3, lowQuality: false, stage: 0, stageSeed: 1 };
  for (let stage = 0; stage < 9; stage++) {
    const normal = scenePreparationBytes({ ...frame, stage });
    const low = scenePreparationBytes({ ...frame, stage, lowQuality: true });
    assert.ok(Number.isFinite(normal) && normal > 20 * 1024 * 1024, `stage ${stage}`);
    assert.ok(low <= normal, `lower density must not reserve more for stage ${stage}`);
    const compact = scenePreparationBytes({ ...frame, stage }, 256 * 1024 * 1024);
    assert.ok(compact < normal, `compact decoded kit reduces reservation for stage ${stage}`);
  }
  for (const invalid of [{ width: Infinity }, { height: NaN }, { dpr: 0 }, { width: -1 }])
    assert.equal(scenePreparationBytes({ ...frame, ...invalid }), undefined);
});
