import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('final main-image disposal retires native GPU consumers while a peer keeps pixels alive', async ({
  page,
}, testInfo) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const url = runtimeAssets.find((asset: any) => asset.width * asset.height < 200000)!.url;
    const a = createMainImageOwner(document),
      b = createMainImageOwner(document);
    const first = a.acquire(url),
      second = b.acquire(url);
    const [image, peerImage] = await Promise.all([first.ready, second.ready]);
    const canvases = [0, 1].map(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      return canvas;
    });
    const painters = await Promise.all(canvases.map((canvas) => createPixiScenePainter(canvas)));
    const pixels = () =>
      canvases.map((canvas) => {
        const gl = canvas.getContext('webgl2')!;
        const data = new Uint8Array(32 * 32 * 4);
        gl.readPixels(0, 0, 32, 32, gl.RGBA, gl.UNSIGNED_BYTE, data);
        return data;
      });
    const draw = () =>
      painters.map((painter) => {
        painter.begin();
        painter.drawImage(image, 0, 0, 32, 32);
        painter.flush();
        return painter.sourceTextureCount;
      });
    const before = draw();
    const original = pixels();
    a.dispose();
    const peer = { counts: draw(), width: image.naturalWidth, identity: image === peerImage };
    const surviving = pixels();
    let maxPixelDifference = 0;
    for (let painter = 0; painter < original.length; painter++)
      for (let pixel = 0; pixel < original[painter]!.length; pixel++)
        maxPixelDifference = Math.max(
          maxPixelDifference,
          Math.abs(original[painter]![pixel]! - surviving[painter]![pixel]!),
        );
    b.dispose();
    const disposed = {
      counts: painters.map((painter) => painter.sourceTextureCount),
      width: image.naturalWidth,
    };
    // Reusing pooled slots after retirement must not leave stale native BindGroups.
    for (const painter of painters) {
      painter.begin();
      painter.fillStyle = '#fff';
      painter.fillRect(0, 0, 32, 32);
      painter.flush();
      painter.dispose();
    }
    return { before, peer, disposed, maxPixelDifference };
  });
  expect(result.before).toEqual([1, 1]);
  expect(result.peer.counts).toEqual([1, 1]);
  expect(result.peer.identity).toBe(true);
  expect(result.peer.width).toBeGreaterThan(0);
  expect(result.disposed).toEqual({ counts: [0, 0], width: 0 });
  expect(result.maxPixelDifference).toBe(0);
  expect(warnings).toEqual([]);
  const path = testInfo.outputPath('main-image-final-retirement.json');
  await writeFile(path, JSON.stringify(result, null, 2));
  await testInfo.attach('main-image-final-retirement', { path, contentType: 'application/json' });
});

test('main-image LRU eviction retires colour, data and crop textures before clearing pixels', async ({
  page,
}, testInfo) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
    const { SceneTextureStore } = await import('/src/rendering/pixi/texture-store.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { observeSceneTextureRetirement } = await import('/src/rendering/texture-revision.ts');
    const owner = createMainImageOwner(document);
    const first = owner.acquire(
      runtimeAssets.find((asset: any) => asset.width * asset.height < 200000)!.url,
    );
    const image = await first.ready;
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createPixiScenePainter(canvas);
    painter.begin();
    painter.drawImage(image, 0, 0, 32, 32);
    painter.flush();
    const a = new SceneTextureStore(),
      b = new SceneTextureStore();
    const textures = [
      a.get({ source: image, revision: 0 }),
      a.getData({ source: image, revision: 0 }),
      b.getFrame(image, 0, 0, 0, 8, 8),
    ];
    let widthAtRetirement = 0,
      retirements = 0;
    observeSceneTextureRetirement(image, () => {
      widthAtRetirement = image.naturalWidth;
      retirements++;
    });
    first.release();
    const unpinned = {
      counts: [a.size, b.size],
      native: painter.sourceTextureCount,
      width: image.naturalWidth,
    };
    const assets = runtimeAssets
      .filter((asset: any) => asset.width * asset.height >= 200000)
      .sort((a: any, b: any) => b.width * b.height - a.width * a.height);
    for (const asset of assets) {
      const lease = owner.acquire(asset.url);
      await lease.ready;
      lease.release();
      if (owner.snapshot().evictions > 0) break;
    }
    const evicted = {
      snapshot: owner.snapshot(),
      counts: [a.size, b.size],
      native: painter.sourceTextureCount,
      destroyed: textures.map((texture) => texture.destroyed),
      width: image.naturalWidth,
      widthAtRetirement,
      retirements,
    };
    owner.dispose();
    painter.begin();
    painter.fillStyle = '#fff';
    painter.fillRect(0, 0, 32, 32);
    painter.flush();
    painter.dispose();
    a.dispose();
    b.dispose();
    delete (navigator as any).deviceMemory;
    return { unpinned, evicted, retirements };
  });
  expect(result.unpinned.counts).toEqual([2, 1]);
  expect(result.unpinned.native).toBe(1);
  expect(result.unpinned.width).toBeGreaterThan(0);
  expect(result.evicted.snapshot.evictions).toBeGreaterThan(0);
  expect(result.evicted.snapshot.peakBytes).toBeLessThanOrEqual(256 * 1024 * 1024);
  expect(result.evicted.counts).toEqual([0, 0]);
  expect(result.evicted.native).toBe(0);
  expect(result.evicted.destroyed).toEqual([true, true, true]);
  expect(result.evicted.width).toBe(0);
  expect(result.evicted.widthAtRetirement).toBeGreaterThan(0);
  expect(result.retirements).toBe(1);
  expect(warnings).toEqual([]);
  const path = testInfo.outputPath('main-image-eviction-retirement.json');
  await writeFile(path, JSON.stringify(result, null, 2));
  await testInfo.attach('main-image-eviction-retirement', {
    path,
    contentType: 'application/json',
  });
});

for (const kind of ['mesh', 'pattern'])
  test(`expiry detaches Pixi cached ${kind} source and sampler before destruction`, async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
        warnings.push(message.text());
    });
    await page.goto('/privacy/index.html');
    const counts = await page.evaluate(async (kind) => {
      const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      const source = document.createElement('canvas');
      source.width = source.height = 16;
      source.getContext('2d')!.fillRect(0, 0, 16, 16);
      const painter = await createPixiScenePainter(canvas);
      painter.begin();
      if (kind === 'mesh') {
        painter.drawImage(source, 0, 0);
        // Exercise Pixi's native default mesh adaptor, separate from the custom lookup shader.
        Reflect.set(painter.root.children[0]!, 'shader', null);
        Reflect.set(Reflect.get(painter.root.children[0]!, 'geometry'), 'batchMode', 'no-batch');
      } else {
        painter.fillStyle = painter.createPattern(source, 'repeat')!;
        painter.fillRect(0, 0, 32, 32);
      }
      painter.flush();
      const before = painter.sourceTextureCount;
      for (let frame = 0; frame < 121; frame++) {
        painter.begin();
        painter.fillStyle = '#fff';
        painter.fillRect(0, 0, 32, 32);
        painter.flush();
      }
      const expired = painter.sourceTextureCount;
      painter.begin();
      painter.drawImage(source, 0, 0);
      painter.flush();
      const reused = painter.sourceTextureCount;
      painter.dispose();
      return { before, expired, reused, disposed: painter.sourceTextureCount };
    }, kind);
    expect(counts).toEqual({ before: 1, expired: 0, reused: 1, disposed: 0 });
    expect(warnings).toEqual([]);
  });

test('closing composed pixels immediately releases colour/data/crop GPU consumers independently', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { SceneTextureStore } = await import('/src/rendering/pixi/texture-store.ts');
    const { closeLayers } = await import('/src/rendering/environment/worker-types.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 12;
    canvas.getContext('2d')!.fillRect(0, 0, 12, 12);
    const bitmap = await createImageBitmap(canvas);
    const a = new SceneTextureStore(),
      b = new SceneTextureStore();
    const colour = a.get({ source: bitmap, revision: 0 });
    const data = a.getData({ source: bitmap, revision: 0 });
    const crop = b.getFrame(bitmap, 0, 0, 0, 6, 6);
    const sources = [colour.source, data.source, crop.source];
    a.get({ source: canvas, revision: 0 });
    b.get({ source: canvas, revision: 0 });
    const before = [a.size, b.size];
    closeLayers([{ colour: bitmap }]);
    const retired = {
      counts: [a.size, b.size],
      textures: [colour.destroyed, data.destroyed, crop.destroyed],
      sources: sources.map((source) => source.destroyed),
      width: bitmap.width,
    };
    a.dispose();
    const peer = b.get({ source: canvas, revision: 0 });
    const peerReady = !peer.destroyed && !peer.source.destroyed;
    b.dispose();
    return { before, retired, peerReady, disposed: [a.size, b.size] };
  });
  expect(result.before).toEqual([3, 2]);
  expect(result.retired).toEqual({
    counts: [1, 1],
    textures: [true, true, true],
    sources: [true, true, true],
    width: 0,
  });
  expect(result.peerReady).toBe(true);
  expect(result.disposed).toEqual([0, 0]);
});

test('worker scene replacement retires uploaded completed maps before the next draw', async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    const painter = await createPixiScenePainter(canvas);
    const owner = createEnvironmentRenderer(document);
    const frame = {
      width: 180,
      height: 120,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 424242,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    };
    await owner.compose(frame);
    painter.begin();
    owner.draw(painter, frame);
    painter.flush();
    const before = painter.sourceTextureCount;
    await owner.compose({ ...frame, stage: 2 });
    const replaced = painter.sourceTextureCount;
    painter.begin();
    owner.draw(painter, { ...frame, stage: 2 });
    painter.flush();
    const after = painter.sourceTextureCount;
    owner.dispose();
    const disposed = painter.sourceTextureCount;
    painter.dispose();
    return { before, replaced, after, disposed, worker: owner.snapshot().worker };
  });
  expect(result.before).toBe(12);
  expect(result.replaced).toBe(0);
  expect(result.after).toBe(12);
  expect(result.disposed).toBe(0);
  expect(warnings).toEqual([]);
});
