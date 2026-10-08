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

test('direct PBR source final disposal releases every GPU consumer', async ({ page }, testInfo) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPbrAtlas } = await import('/src/rendering/pbr-atlas.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { SceneTextureStore } = await import('/src/rendering/pixi/texture-store.ts');
    const { drawMaterialStamp } = await import('/src/rendering/scene-material.ts');
    const { observeSceneTextureRetirement } = await import('/src/rendering/texture-revision.ts');
    const pack = assetMaterialCatalog.find((p: any) => p.maps.emissive)!;
    const atlas = createPbrAtlas(document, pack.maps, ...pack.dimensions);
    if (!(await atlas.prepare())) throw Error('PBR preparation failed');
    const material = atlas.material([0, 0, ...pack.dimensions])!;
    const sources = [
      atlas.diffuse!,
      material.normal.source,
      material.surface.source,
      material.emissive!.source,
    ] as HTMLImageElement[];
    const stores = [new SceneTextureStore(), new SceneTextureStore()];
    const textures = sources.flatMap((source) => [
      stores[0].get({ source, revision: 0 }),
      stores[0].getData({ source, revision: 0 }),
      stores[1].getFrame(source, 0, 0, 0, 8, 8),
    ]);
    const painters = await Promise.all(
      [0, 1].map(async () => {
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = 32;
        return createPixiScenePainter(canvas);
      }),
    );
    for (const painter of painters) {
      painter.begin();
      drawMaterialStamp(painter, {
        texture: { source: atlas.diffuse!, revision: 0 },
        material,
        x: 0,
        y: 0,
        width: 32,
        height: 32,
      });
      painter.flush();
    }
    const before = {
      stores: stores.map((s) => s.size),
      native: painters.map((p) => p.sourceTextureCount),
    };
    const widthsAtRetirement: number[] = [];
    for (const source of sources)
      observeSceneTextureRetirement(source, () => widthsAtRetirement.push(source.naturalWidth));
    atlas.dispose();
    const after = {
      stores: stores.map((s) => s.size),
      native: painters.map((p) => p.sourceTextureCount),
      destroyed: textures.map((t) => t.destroyed),
      widths: sources.map((s) => s.naturalWidth),
      widthsAtRetirement: [...widthsAtRetirement],
      ready: atlas.ready,
    };

    painters.forEach((p) => p.dispose());
    stores.forEach((s) => s.dispose());
    return { before, after };
  });
  await writeFile(testInfo.outputPath('pbr-retirement.json'), JSON.stringify(result, null, 2));
  expect(warnings).toEqual([]);
  expect(result.before.stores).toEqual([8, 4]);
  expect(result.before.native).toEqual([4, 4]);
  expect(result.after.stores).toEqual([0, 0]);
  expect(result.after.native).toEqual([0, 0]);
  expect(result.after.destroyed.every(Boolean)).toBe(true);
  expect(result.after.widthsAtRetirement.every((width) => width > 0)).toBe(true);
  expect(result.after.widthsAtRetirement).toHaveLength(4);
  expect(result.after.widths).toEqual([0, 0, 0, 0]);
  expect(result.after.ready).toBe(false);
});

test('disposing a leased PBR atlas preserves shared native peer pixels until final ownership ends', async ({
  page,
}, testInfo) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPbrAtlas } = await import('/src/rendering/pbr-atlas.ts');
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp } = await import('/src/rendering/scene-material.ts');
    const pack = assetMaterialCatalog.find((p: any) => p.maps.emissive)!;
    const owners = [createMainImageOwner(document), createMainImageOwner(document)];
    // Material-only packs exclude their unused diffuse sibling from the runtime
    // manifest. Use the authored runtime colour for this shared-lifetime fixture.
    const atlases = owners.map((images) =>
      createPbrAtlas(document, { ...pack.maps, diffuse: pack.source }, ...pack.dimensions, {
        images,
      }),
    );
    if (!(await Promise.all(atlases.map((a) => a.prepare()))).every(Boolean))
      throw Error('Shared preparation failed');
    const sources = [
      atlases[0].diffuse!,
      ...['normal', 'surface', 'emissive'].map(
        (kind) => (atlases[0].material([0, 0, ...pack.dimensions]) as any)[kind].source,
      ),
    ];
    const identity = atlases[0].diffuse === atlases[1].diffuse;
    const canvases = [0, 1].map(() => {
      const c = document.createElement('canvas');
      c.width = c.height = 32;
      return c;
    });
    const painters = await Promise.all(canvases.map((c) => createPixiScenePainter(c)));
    const draw = () =>
      painters.forEach((p) => {
        p.begin();
        drawMaterialStamp(p, {
          texture: { source: atlases[1].diffuse!, revision: 0 },
          material: atlases[1].material([0, 0, ...pack.dimensions])!,
          x: 0,
          y: 0,
          width: 32,
          height: 32,
        });
        p.flush();
      });
    const pixels = () =>
      canvases.map((c) => {
        const gl = c.getContext('webgl2')!;
        const bytes = new Uint8Array(32 * 32 * 4);
        gl.readPixels(0, 0, 32, 32, gl.RGBA, gl.UNSIGNED_BYTE, bytes);
        return bytes;
      });
    draw();
    const before = {
      counts: painters.map((p) => p.sourceTextureCount),
      pins: owners[0].snapshot().pinned,
    };
    const baseline = pixels();
    atlases[0].dispose();
    owners[0].dispose();
    draw();
    const peerPixels = pixels();
    const peer = {
      counts: painters.map((p) => p.sourceTextureCount),
      pins: owners[1].snapshot().pinned,
      widths: sources.map((s) => s.naturalWidth),
      ready: atlases[1].ready,
    };
    const max = peerPixels.reduce(
      (n, data, index) =>
        data.reduce((n, value, i) => Math.max(n, Math.abs(value - baseline[index][i])), n),
      0,
    );
    atlases[1].dispose();
    const unpinned = {
      counts: painters.map((p) => p.sourceTextureCount),
      pins: owners[1].snapshot().pinned,
      widths: sources.map((s) => s.naturalWidth),
    };
    owners[1].dispose();
    const final = {
      counts: painters.map((p) => p.sourceTextureCount),
      widths: sources.map((s) => s.naturalWidth),
      bytes: owners[1].snapshot().bytes,
    };
    painters.forEach((p) => {
      p.begin();
      p.fillRect(0, 0, 32, 32);
      p.flush();
      p.dispose();
    });
    return { identity, before, peer, unpinned, final, max };
  });
  await writeFile(
    testInfo.outputPath('pbr-shared-retirement.json'),
    JSON.stringify(result, null, 2),
  );
  expect(result.identity).toBe(true);
  expect(result.before).toEqual({ counts: [4, 4], pins: 4 });
  expect(result.peer.counts).toEqual([4, 4]);
  expect(result.peer.pins).toBe(4);
  expect(result.peer.ready).toBe(true);
  expect(result.peer.widths.every((width) => width > 0)).toBe(true);
  expect(result.max).toBe(0);
  expect(result.unpinned.counts).toEqual([4, 4]);
  expect(result.unpinned.pins).toBe(0);
  expect(result.unpinned.widths.every((width) => width > 0)).toBe(true);
  expect(result.final).toEqual({ counts: [0, 0], widths: [0, 0, 0, 0], bytes: 0 });
  expect(warnings).toEqual([]);
});
