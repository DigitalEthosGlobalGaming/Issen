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

test('low-memory raster admission matches bounded scenery and foreground backing', async () => {
  const { environmentRasterScale, foregroundRasterDensity } =
    await import('../../src/rendering/environment/raster-policy.ts');
  const compact = 256 * 1024 * 1024,
    full = 512 * 1024 * 1024;
  const frame = { width: 390, height: 844, dpr: 3, lowQuality: false, stage: 4 };
  assert.equal(environmentRasterScale(frame, compact), 1);
  assert.equal(environmentRasterScale(frame, full), 1.5);
  assert.equal(foregroundRasterDensity(390, 844, false, compact), 1);
  assert.equal(foregroundRasterDensity(390, 844, false, full), 1.5);
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [1600, 1200],
  ]) {
    const scale = environmentRasterScale({ ...frame, width, height }, compact);
    assert.ok(width * height * scale * scale <= 600_000 + 1);
    const edge = width * (height >= width * 0.9 ? 0.2 : 0.24);
    const density = foregroundRasterDensity(width, height, false, compact);
    assert.ok(2 * edge * height * density * density <= 240_000 + 1);
  }
});
