import test from 'node:test';
import assert from 'node:assert/strict';
import { drawingPixelRatio } from '../../src/presentation/viewport.ts';

test('low-memory drawing bounds backing pixels without changing logical size or other tiers', () => {
  const doc = (memory) => ({
    defaultView: { navigator: { deviceMemory: memory, userAgent: 'Android' } },
  });
  assert.equal(drawingPixelRatio(doc(8), 390, 844, 3), 2);
  assert.equal(drawingPixelRatio(doc(2), 200, 300, 3), 1.5);
  for (const [width, height] of [
    [390, 844],
    [844, 390],
    [1920, 1080],
    [200, 300],
  ]) {
    const ratio = drawingPixelRatio(doc(2), width, height, 3);
    assert.ok(width * height * ratio * ratio <= 600000 + 0.001);
    assert.ok(ratio <= 1.5);
  }
  assert.equal(drawingPixelRatio(doc(2), 200, 300, 1), 1);
});
