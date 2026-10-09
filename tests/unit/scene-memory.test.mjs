import test from 'node:test';
import assert from 'node:assert/strict';
import { documentPixelMemory } from '../../src/platform/pixel-memory.ts';
import { documentSceneMemory, registerSceneMemory } from '../../src/platform/scene-memory.ts';

test('scene admission includes peer workers, transient reservations and browser headroom', () => {
  const doc = { defaultView: { navigator: { deviceMemory: 2, userAgent: 'Android' } } };
  const pixels = documentPixelMemory(doc);
  const image = pixels.track({ width: 10, height: 20 }, 'decoded');
  const canvas = pixels.track({ width: 5, height: 20 }, 'canvas');
  const gpu = { memorySnapshot: { sources: 1, bytes: 1200, browserReserveBytes: 600 } };
  pixels.trackGpu(gpu);
  const live = {
    memorySnapshot: {
      decodedBytes: 100,
      canvasBytes: 200,
      transferredBytes: 300,
      reservedBytes: 400,
    },
  };
  const preview = {
    memorySnapshot: {
      decodedBytes: 500,
      canvasBytes: 600,
      transferredBytes: 700,
      reservedBytes: 800,
    },
  };
  registerSceneMemory(doc, live);
  registerSceneMemory(doc, live);
  registerSceneMemory(doc, preview);
  const snapshot = documentSceneMemory(doc);
  assert.equal(snapshot.accountedBytes, 4800);
  assert.equal(snapshot.reservedBytes, 1200);
  assert.equal(snapshot.overheadBytes, 64 * 1024 * 1024 + 600);
  assert.equal(snapshot.committedBytes, 6000 + snapshot.overheadBytes);
  assert.equal(snapshot.budget, 512 * 1024 * 1024);
  assert.equal(snapshot.gameplayHeadroomBytes, 32 * 1024 * 1024);
  assert.equal(snapshot.backgroundBudget, 480 * 1024 * 1024);
  image.width = canvas.width = 0;
  gpu.memorySnapshot = { sources: 0, bytes: 0 };
  live.memorySnapshot = preview.memorySnapshot = {
    decodedBytes: 0,
    canvasBytes: 0,
    transferredBytes: 0,
    reservedBytes: 0,
  };
  assert.equal(documentSceneMemory(doc).accountedBytes, 0);
  assert.equal(documentSceneMemory(doc).reservedBytes, 0);
});
