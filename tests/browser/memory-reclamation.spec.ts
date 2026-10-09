import { test, expect } from '@playwright/test';

test('combined pressure reclaims unpinned images and preserves a native peer lease', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { reclaimSceneMemory } = await import('/src/platform/scene-memory.ts');
    const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const assets = runtimeAssets.filter((asset) => asset.width * asset.height < 200000).slice(0, 2);
    const a = createMainImageOwner(document),
      b = createMainImageOwner(document);
    const warm = a.acquire(assets[0].url),
      live = b.acquire(assets[1].url);
    const [cached, pinned] = await Promise.all([warm.ready, live.ready]);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const drawing = await createTestDrawing(canvas);
    const draw = () => {
      drawing.begin();
      drawing.drawImage(pinned, 0, 0, 64, 64);
      return drawing.getImageData(0, 0, 64, 64).data;
    };
    try {
      const before = draw();
      warm.release();
      const pressure = reclaimSceneMemory(document, 2 * 1024 * 1024 * 1024);
      const after = draw();
      const maximum = before.reduce((n, value, i) => Math.max(n, Math.abs(value - after[i])), 0);
      const cachedClosed = cached.naturalWidth === 0;
      const pinnedAlive = pinned.naturalWidth > 0;
      const recovered = await a.acquire(assets[0].url).ready;
      return {
        cachedClosed,
        pinnedAlive,
        maximum,
        recovered: recovered !== cached && recovered.naturalWidth > 0,
        pressureDecoded: pressure.decodedBytes,
        pinnedBytes: assets[1].width * assets[1].height * 4,
      };
    } finally {
      a.dispose();
      b.dispose();
      drawing.dispose();
    }
  });
  expect(result.cachedClosed).toBe(true);
  expect(result.pinnedAlive).toBe(true);
  expect(result.maximum).toBe(0);
  expect(result.recovered).toBe(true);
  expect(result.pressureDecoded).toBe(result.pinnedBytes);
});

test('ordinary stage replacement releases fog inputs and reacquires them on return', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createWorkerEnvironmentRenderer } =
      await import('/src/rendering/environment/worker-renderer.ts');
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const drawing = await createTestDrawing(canvas);
    const owner = createWorkerEnvironmentRenderer(document, (items, signal) =>
      drawing.warmScene(items, signal),
    );
    const frame = {
      width: 160,
      height: 100,
      dpr: 1,
      stage: 0,
      stageSeed: 123,
      time: 0,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    };
    const draw = () => {
      drawing.begin();
      owner.draw(drawing, frame);
      return drawing.getImageData(0, 0, 160, 100).data;
    };
    try {
      if (!(await owner.compose(frame))) throw Error('Initial scene failed');
      const before = draw();
      const decodedBefore = documentPixelMemory(document).snapshot().decodedBytes;
      const away = await owner.compose({ ...frame, stage: 1 });
      const decodedAway = documentPixelMemory(document).snapshot().decodedBytes;
      const returned = await owner.compose(frame);
      const after = draw();
      return {
        decodedBefore,
        decodedAway,
        away,
        returned,
        maximum: before.reduce((n, value, i) => Math.max(n, Math.abs(value - after[i])), 0),
      };
    } finally {
      owner.dispose();
      drawing.dispose();
    }
  });
  expect(result.decodedBefore).toBeGreaterThan(0);
  expect(result.decodedAway).toBe(0);
  expect(result.away).toBe(true);
  expect(result.returned).toBe(true);
  expect(result.maximum).toBeLessThanOrEqual(1);
});
