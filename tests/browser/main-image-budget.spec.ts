import { expect, test } from '@playwright/test';
import type { Route } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('combined pressure reclaims unpinned main cache before the next decode allocation', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { documentSceneMemory, registerSceneMemory } =
      await import('/src/platform/scene-memory.ts');
    const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
    const assets = runtimeAssets
      .filter((asset) => asset.width * asset.height < 200000)
      .sort((a, b) => b.width * b.height - a.width * a.height)
      .slice(0, 2);
    const owner = createMainImageOwner(document);
    const pressure = {
      memorySnapshot: { decodedBytes: 0, canvasBytes: 0, transferredBytes: 0, reservedBytes: 0 },
    };
    registerSceneMemory(document, pressure);
    const decode = HTMLImageElement.prototype.decode;
    try {
      const first = owner.acquire(assets[0].url);
      const image = await first.ready;
      first.release();
      const retained = image.naturalWidth > 0;
      const before = documentSceneMemory(document);
      const expected = assets[1].width * assets[1].height * 4;
      pressure.memorySnapshot.reservedBytes = before.budget - before.committedBytes - expected / 2;
      let closedBeforeAllocation = false,
        withinBudget = false;
      HTMLImageElement.prototype.decode = async function () {
        closedBeforeAllocation = image.naturalWidth === 0;
        const pending = documentSceneMemory(document);
        withinBudget = pending.committedBytes <= pending.budget;
        return decode.call(this);
      };
      const second = owner.acquire(assets[1].url);
      const ready = (await second.ready).naturalWidth > 0;
      return {
        retained,
        closedBeforeAllocation,
        withinBudget,
        ready,
      };
    } finally {
      HTMLImageElement.prototype.decode = decode;
      pressure.memorySnapshot.reservedBytes = 0;
      owner.dispose();
    }
  });
  expect(result).toEqual({
    retained: true,
    closedBeforeAllocation: true,
    withinBudget: true,
    ready: true,
  });
});

test('shared main decode queue waits for visible quiet frames while required images bypass pacing', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { documentSceneMemory } = await import('/src/platform/scene-memory.ts');
    const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const urls = runtimeAssets
      .filter((asset: any) => asset.width * asset.height < 200000)
      .slice(0, 4)
      .map((asset: any) => asset.url);
    const a = createMainImageOwner(document),
      b = createMainImageOwner(document);
    const settle = () => new Promise((resolve) => setTimeout(resolve, 50));
    const first = a.acquire(urls[0], 'idle');
    const rejected = first.ready.then(
      () => 'attached',
      (error) => error.name,
    );
    const peer = b.acquire(urls[0], 'soon');
    a.dispose();
    const required = b.acquire(urls[1]);
    const duringRequired = documentSceneMemory(document);
    const asset = runtimeAssets.find((asset) => asset.url === urls[1])!;
    const expectedReservation = asset.width * asset.height * 4;
    await required.ready;
    const settledReservation = documentSceneMemory(document).reservedBytes;
    const initially = b.snapshot();
    sampleAssetBackground(0, true, 9, 10);
    await settle();
    const expensive = b.snapshot();
    sampleAssetBackground(0, true, 0, 10);
    await peer.ready;
    const peerResult = await rejected;
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const idle = b.acquire(urls[2], 'idle');
    sampleAssetBackground(0, true, 0, 10);
    await settle();
    const hidden = b.snapshot();
    await b.acquire(urls[3]).ready;
    const hiddenRequired = b.snapshot();
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    await settle();
    const revealed = b.snapshot();
    sampleAssetBackground(0, false, 0, 10);
    await settle();
    const busy = b.snapshot();
    sampleAssetBackground(0, true, 0, 10);
    await idle.ready;
    const final = b.snapshot();
    b.dispose();
    const disposed = b.snapshot();
    const fresh = createMainImageOwner(document);
    const future = fresh.acquire(urls[0], 'soon');
    const cancelled = future.ready.catch((error) => error.message);
    await settle();
    const restarted = fresh.snapshot();
    fresh.dispose();
    await cancelled;
    delete (document as any).hidden;
    return {
      initially,
      expensive,
      peerResult,
      hidden,
      hiddenRequired,
      revealed,
      busy,
      final,
      disposed,
      restarted,
      duringRequired,
      expectedReservation,
      settledReservation,
    };
  });
  for (const snapshot of [result.initially, result.expensive]) {
    expect(snapshot.queued).toBe(1);
    expect(snapshot.decoded).toBe(1);
  }
  expect(result.peerResult).toBe('AbortError');
  expect(result.duringRequired.reservedBytes).toBe(result.expectedReservation);
  expect(result.settledReservation).toBe(0);
  expect(result.hidden).toMatchObject({ queued: 1, decoded: 2 });
  for (const snapshot of [result.hiddenRequired, result.revealed, result.busy])
    expect(snapshot).toMatchObject({ queued: 1, decoded: 3 });
  expect(result.final).toMatchObject({ queued: 0, decoded: 4, pinned: 4 });
  expect(result.disposed).toMatchObject({ queued: 0, decoded: 0, bytes: 0 });
  expect(result.restarted).toMatchObject({ queued: 1, decoded: 0, bytes: 0 });
});

test('shared scenery sources retain independent material layers and survive peer disposal', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createLocalEnvironmentRenderer } =
      await import('/src/rendering/environment/local-renderer.ts');
    const a = createLocalEnvironmentRenderer(document),
      b = createLocalEnvironmentRenderer(document);
    const frame = {
      width: 220,
      height: 140,
      dpr: 1,
      time: 0,
      stage: 0,
      stageSeed: 424242,
      reducedMotion: true,
      reducedFlashes: true,
      lowQuality: true,
    };
    const ready = await Promise.all([a.compose(frame), b.compose(frame)]);
    const first = a.exportLayers().layers,
      second = b.exportLayers().layers;
    const pixels = (canvas: HTMLCanvasElement) =>
      canvas
        .getContext('2d', { willReadFrequently: true })!
        .getImageData(0, 0, canvas.width, canvas.height).data;
    let max = 0;
    for (let index = 0; index < first.length; index++) {
      const planes = (layer: any) => [
        layer.colour,
        ...['normal', 'surface', 'emissive'].map((kind) => layer.material[kind].source),
      ];
      const before = planes(first[index]),
        after = planes(second[index]);
      for (let plane = 0; plane < before.length; plane++) {
        const expected = pixels(before[plane]),
          actual = pixels(after[plane]);
        for (let pixel = 0; pixel < expected.length; pixel++)
          max = Math.max(max, Math.abs(expected[pixel]! - actual[pixel]!));
      }
    }
    const snapshot = b.snapshot();
    const normal = second[0]!.material!.normal!.source as HTMLCanvasElement;
    const width = normal.width;
    a.dispose();
    const peer = { width: normal.width, snapshot: b.snapshot() };
    const rebuilt = await b.compose({ ...frame, stageSeed: 424243 });
    b.dispose();
    return { ready, max, snapshot, width, peer, rebuilt, disposed: b.snapshot() };
  });
  expect(result.ready).toEqual([true, true]);
  expect(result.max).toBe(0);
  expect(result.width).toBeGreaterThan(0);
  expect(result.peer.width).toBe(result.width);
  expect(result.peer.snapshot.decodedLoader!.bytes).toBe(result.snapshot.decodedLoader!.bytes);
  expect(result.peer.snapshot.decodedLoader!.pinned).toBe(4);
  expect(result.peer.snapshot.decodedLoader!.pinnedBytes).toBe(25176608);
  expect(result.peer.snapshot.decodedLoader!.pinned).toBe(result.snapshot.decodedLoader!.pinned);
  expect(result.rebuilt).toBe(true);
  expect(result.disposed.decodedLoader!.bytes).toBe(0);
});

test('disposing a pending owner cancels its lease without cancelling the shared peer', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  let pending: Route | undefined;
  await page.route(/pine-atlas_normal\.webp/, (route) => {
    pending = route;
  });
  await page.evaluate(async () => {
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const pack = assetMaterialCatalog.find((pack: any) =>
      pack.sourcePath.endsWith('/pine-atlas.png'),
    )!;
    const a = createMainImageOwner(document),
      b = createMainImageOwner(document);
    const first = a.acquire(pack.maps.normal),
      second = b.acquire(pack.maps.normal);
    const scope = window as any;
    scope.firstLeaseResult = first.ready.then(
      () => 'attached',
      (error) => error.name,
    );
    scope.secondLease = second;
    scope.firstOwner = a;
    scope.secondOwner = b;
  });
  await expect.poll(() => !!pending).toBe(true);
  await page.evaluate(() => (window as any).firstOwner.dispose());
  await pending!.continue();
  const result = await page.evaluate(async () => {
    const scope = window as any;
    const first = await scope.firstLeaseResult;
    const image = await scope.secondLease.ready;
    const width = image.naturalWidth;
    scope.secondOwner.dispose();
    return { first, width, snapshot: scope.secondOwner.snapshot() };
  });
  expect(result.first).toBe('AbortError');
  expect(result.width).toBeGreaterThan(0);
  expect(result.snapshot.bytes).toBe(0);
});

test('main image leases share native decode and retain a peer atlas after disposal', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { createPbrAtlas } = await import('/src/rendering/pbr-atlas.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const pack = assetMaterialCatalog.find((pack: any) =>
      pack.sourcePath.endsWith('/pine-atlas.png'),
    )!;
    const a = createMainImageOwner(document),
      b = createMainImageOwner(document);
    const first = createPbrAtlas(document, pack.maps, ...pack.dimensions, {
      colour: false,
      images: a,
    });
    const second = createPbrAtlas(document, pack.maps, ...pack.dimensions, {
      colour: false,
      images: b,
    });
    const ready = await Promise.all([first.prepare(), second.prepare()]);
    const frame = [0, 0, ...pack.dimensions] as const;
    const source = second.material(frame)!.normal!.source as HTMLImageElement;
    const identity = first.material(frame)!.normal!.source === source;
    const pixels = (image: HTMLImageElement) => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const g = canvas.getContext('2d', { willReadFrequently: true })!;
      g.drawImage(image, 0, 0);
      return g.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    let max = 0;
    const colourLease = b.acquire(pack.source);
    const colour = await colourLease.ready;
    const material = second.material(frame)!;
    for (const [url, decoded] of [
      [pack.source, colour],
      [pack.maps.normal, source],
      [pack.maps.surface, material.surface!.source],
      ...(pack.maps.emissive ? [[pack.maps.emissive, material.emissive!.source]] : []),
    ] as Array<[string, HTMLImageElement]>) {
      const original = document.createElement('img');
      original.src = url;
      await original.decode();
      const actual = pixels(decoded),
        expected = pixels(original);
      for (let index = 0; index < actual.length; index++)
        max = Math.max(max, Math.abs(actual[index]! - expected[index]!));
      original.removeAttribute('src');
    }
    const before = a.snapshot();
    first.dispose();
    a.dispose();
    const peer = { snapshot: b.snapshot(), width: source.naturalWidth, ready: second.ready };
    second.dispose();
    colourLease.release();
    const unpinned = b.snapshot();
    b.dispose();
    return {
      ready,
      identity,
      max,
      before,
      peer,
      unpinned,
      disposed: b.snapshot(),
      finalWidth: source.naturalWidth,
    };
  });
  expect(result.ready).toEqual([true, true]);
  expect(result.identity).toBe(true);
  expect(result.max).toBe(0);
  expect(result.peer.ready).toBe(true);
  expect(result.peer.width).toBeGreaterThan(0);
  expect(result.peer.snapshot.bytes).toBe(result.before.bytes);
  expect(result.peer.snapshot.pinned).toBe(result.before.decoded);
  expect(result.unpinned.pinned).toBe(0);
  expect(result.unpinned.bytes).toBe(result.before.bytes);
  expect(result.disposed.bytes).toBe(0);
  expect(result.finalWidth).toBe(0);
});

test('local fallback cycles all stage maps within the low-memory main pool', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createLocalEnvironmentRenderer } =
      await import('/src/rendering/environment/local-renderer.ts');
    const renderer = createLocalEnvironmentRenderer(document);
    const snapshots = [];
    for (let cycle = 0; cycle < 3; cycle++) {
      for (let stage = 0; stage < 9; stage++) {
        await renderer.prepare(stage);
        snapshots.push({ cycle, stage, ...renderer.snapshot() });
      }
    }
    renderer.dispose();
    return { snapshots, disposed: renderer.snapshot() };
  });
  expect(result.snapshots).toHaveLength(27);
  for (const snapshot of result.snapshots) {
    expect(snapshot.backend).toBe('layered');
    expect(snapshot.decodedLoader!.budget).toBe(256 * 1024 * 1024);
    expect(snapshot.decodedLoader!.bytes).toBeLessThanOrEqual(snapshot.decodedLoader!.budget);
    expect(snapshot.decodedLoader!.peakBytes).toBeLessThanOrEqual(snapshot.decodedLoader!.budget);
    expect(snapshot.decodedLoader!.pinned).toBeGreaterThan(0);
  }
  expect(result.snapshots.at(-1)!.decodedLoader!.evictions).toBeGreaterThan(0);
  expect(result.disposed.decodedLoader!.bytes).toBe(0);
  const path = testInfo.outputPath('main-map-budget-cycle.json');
  await writeFile(path, JSON.stringify(result, null, 2));
  await testInfo.attach('main-map-budget-cycle', { path, contentType: 'application/json' });
});
