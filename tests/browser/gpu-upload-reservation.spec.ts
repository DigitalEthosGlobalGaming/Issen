import { test, expect } from '@playwright/test';

test('ordinary drawing reserves its upload and reclaims unused images before native allocation', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { documentSceneMemory, registerSceneMemory } =
      await import('/src/platform/scene-memory.ts');
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
    const owner = createMainImageOwner(document);
    const asset = runtimeAssets.find(
      (asset) => asset.width * asset.height > 50000 && asset.width * asset.height < 200000,
    )!;
    const lease = owner.acquire(asset.url);
    const cached = await lease.ready;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createTestDrawing(canvas);
    let pressureBytes = 0;
    const pressure = {
      get memorySnapshot() {
        return {
          decodedBytes: 0,
          canvasBytes: 0,
          transferredBytes: 0,
          reservedBytes: pressureBytes,
        };
      },
    };
    registerSceneMemory(document, pressure);
    try {
      painter.fillStyle = '#ffffff';
      painter.fillRect(0, 0, 32, 32);
      painter.flush();
      lease.release();
      const before = documentSceneMemory(document);
      pressureBytes = before.budget - before.committedBytes - 8192;
      const source = document.createElement('canvas');
      source.width = source.height = 64;
      source.getContext('2d')!.fillRect(0, 0, 64, 64);
      painter.begin();
      painter.drawImage(source, 0, 0, 32, 32);
      const pending = documentSceneMemory(document).reservedBytes - pressureBytes;
      const aliveBefore = cached.naturalWidth > 0;
      painter.flush();
      const after = documentSceneMemory(document);
      return {
        pending,
        aliveBefore,
        reclaimed: cached.naturalWidth === 0,
        settled: after.reservedBytes - pressureBytes,
        bounded: after.committedBytes <= after.budget,
      };
    } finally {
      pressureBytes = 0;
      lease.release();
      owner.dispose();
      painter.dispose();
    }
  });
  expect(result.pending).toBe(64 * 64 * 4);
  expect(result.aliveBefore).toBe(true);
  expect(result.reclaimed).toBe(true);
  expect(result.settled).toBe(0);
  expect(result.bounded).toBe(true);
});

test('concurrent painter warming shares upload reservations and clears them on cancellation/readiness', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { documentSceneMemory } = await import('/src/platform/scene-memory.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createTestDrawing(canvas);
    const source = document.createElement('canvas');
    source.width = source.height = 8;
    const uploads = [{ texture: { source, revision: 0 } }];
    const first = new AbortController(),
      second = new AbortController();
    try {
      const a = painter.warmScene(uploads, first.signal);
      const initial = documentSceneMemory(document).reservedBytes;
      const b = painter.warmScene(uploads, second.signal);
      const shared = documentSceneMemory(document).reservedBytes;
      second.abort();
      const canceled = await b;
      const ready = await a;
      const settled = documentSceneMemory(document).reservedBytes;
      painter.dispose();
      return {
        initial,
        shared,
        canceled,
        ready,
        settled,
        disposed: documentSceneMemory(document).reservedBytes,
      };
    } finally {
      first.abort();
      second.abort();
      painter.dispose();
    }
  });
  expect(result.initial).toBeGreaterThanOrEqual(8 * 8 * 4);
  expect(result.shared).toBe(result.initial);
  expect(result.canceled).toBe(false);
  expect(result.ready).toBe(true);
  expect(result.settled).toBe(0);
  expect(result.disposed).toBe(0);
});
