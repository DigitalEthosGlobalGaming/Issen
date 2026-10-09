import { expect, test } from '@playwright/test';

test('world UI pins shared planes and retires owned tints without clearing a peer', async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/feedback loop|GL_INVALID_OPERATION|destroyed while still bound/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { prepareUiArt, drawSeal, drawCrestSprite, disposeUiArt, uiArtSnapshot } =
      await import('/src/rendering/ui-art.ts');
    const empty = uiArtSnapshot(document);
    const peer = createMainImageOwner(document);
    const pack = assetMaterialCatalog.find((p) => p.sourcePath.endsWith('/world-ui-atlas.png'))!;
    const lease = peer.acquire(pack.source);
    const [image, ready] = await Promise.all([lease.ready, prepareUiArt(document)]);
    const prepared = uiArtSnapshot(document);
    const canvas = document.createElement('canvas');
    canvas.width = 220;
    canvas.height = 140;
    const g = await createTestDrawing(canvas);
    for (const material of ['paper', 'wood', 'metal', 'silk', 'stone'] as const) {
      g.begin();
      drawSeal(g, material, '#806040', 5, 7, 170, 90);
      g.getImageData(0, 0, 220, 140);
    }
    g.begin();
    drawCrestSprite(g, 'tomoe', 100, 65, 37);
    g.getImageData(0, 0, 220, 140);
    const cached = uiArtSnapshot(document);
    const before = g.sourceTextureCount;
    disposeUiArt(document);
    disposeUiArt(document);
    const disposed = {
      art: uiArtSnapshot(document),
      pool: peer.snapshot(),
      native: g.sourceTextureCount,
    };
    g.begin();
    g.drawImage(image, 0, 0, 200, 120);
    const peerPixels = g.getImageData(0, 0, 220, 140).data;
    const surviving = image.naturalWidth;
    peer.dispose();
    const final = { pool: peer.snapshot(), native: g.sourceTextureCount };
    g.dispose();
    const restarted = await prepareUiArt(document);
    const fresh = uiArtSnapshot(document);
    disposeUiArt(document);
    return {
      empty,
      ready,
      prepared,
      cached,
      before,
      disposed,
      surviving,
      visible: peerPixels.some((v, i) => i % 4 === 3 && v > 0),
      final,
      restarted,
      fresh,
    };
  });
  expect(result.empty).toBeNull();
  expect(result.ready).toBe(true);
  expect(result.prepared).toMatchObject({
    ready: true,
    cached: 0,
    decodedLoader: { decoded: 3, pinned: 3, bytes: 5898240, pinnedBytes: 5898240 },
  });
  expect(result.cached?.cached).toBe(5);
  expect(result.disposed.art).toBeNull();
  expect(result.disposed.pool).toMatchObject({ decoded: 3, pinned: 1, pinnedBytes: 1966080 });
  expect(result.before - result.disposed.native).toBe(5);
  expect(result.surviving).toBe(768);
  expect(result.visible).toBe(true);
  expect(result.final.pool).toMatchObject({ bytes: 0, decoded: 0, pinned: 0 });
  expect(result.final.native).toBe(0);
  expect(result.restarted).toBe(true);
  expect(result.fresh?.decodedLoader.bytes).toBe(5898240);
  expect(warnings).toEqual([]);
});

test('world UI disposal cancels pending leases and permits a fresh owner', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { prepareUiArt, disposeUiArt, uiArtSnapshot } = await import('/src/rendering/ui-art.ts');
    const pending = prepareUiArt(document);
    disposeUiArt(document);
    disposeUiArt(document);
    const cancelled = await pending;
    const disposed = uiArtSnapshot(document);
    const restarted = await prepareUiArt(document);
    const fresh = uiArtSnapshot(document);
    disposeUiArt(document);
    return { cancelled, disposed, restarted, fresh };
  });
  expect(result.cancelled).toBe(false);
  expect(result.disposed).toBeNull();
  expect(result.restarted).toBe(true);
  expect(result.fresh).toMatchObject({
    ready: true,
    decodedLoader: { queued: 0, decoded: 3, pinned: 3, bytes: 5898240 },
  });
});

test('world UI tint eviction preserves queued pixels and releases them at the frame boundary', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { prepareUiArt, drawSeal, disposeUiArt, uiArtSnapshot } =
      await import('/src/rendering/ui-art.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    await prepareUiArt(document);
    const canvas = document.createElement('canvas');
    canvas.width = 140;
    canvas.height = 80;
    const g = await createTestDrawing(canvas);
    drawSeal(g, 'paper', '#806040', 0, 0, 40, 40);
    g.getImageData(0, 0, 40, 40);
    g.begin();
    drawSeal(g, 'paper', '#806040', 0, 0, 40, 40);
    const original = g.getImageData(0, 0, 40, 40).data;
    g.begin();
    drawSeal(g, 'paper', '#806040', 0, 0, 40, 40);
    for (let i = 0; i < 45; i++) drawSeal(g, 'paper', `rgb(${i},20,30)`, 70, 0, 40, 40);
    const current = g.getImageData(0, 0, 40, 40).data;
    const repeat = g.getImageData(0, 0, 40, 40).data;
    const difference = (a: Uint8ClampedArray, b: Uint8ClampedArray) =>
      a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i]!)), 0);
    const queued = {
      art: uiArtSnapshot(document),
      native: g.sourceTextureCount,
      pending: g.sourceRetirementSnapshot,
    };
    g.begin();
    const boundary = { native: g.sourceTextureCount, pending: g.sourceRetirementSnapshot };
    disposeUiArt(document);
    const final = g.sourceTextureCount;
    g.dispose();
    return {
      warmMax: difference(original, current),
      replayMax: difference(current, repeat),
      queued,
      boundary,
      final,
    };
  });
  expect(result.warmMax).toBe(0);
  expect(result.replayMax).toBe(0);
  expect(result.queued.art?.cached).toBe(40);
  expect(result.queued.pending.sources).toBe(6);
  expect(result.boundary.pending).toEqual({ sources: 0, bytes: 0 });
  expect(result.boundary.native).toBeLessThan(result.queued.native);
  expect(result.final).toBe(0);
});
