import { expect, test } from '@playwright/test';

test('changing next-stage prediction at the same stage reprioritizes compressed requests', async ({
  page,
}) => {
  await page.route('**/src/platform/runtime-assets.ts', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `export const runtimeAssets = [
      {url:'/current.webp',group:'environment',stages:[0]},
      {url:'/one.webp',group:'environment',stages:[1]},
      {url:'/eight.webp',group:'environment',stages:[8]},
      {url:'/figure.webp',group:'figure',stages:[]}
    ];`,
    }),
  );
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const calls: string[] = [];
    window.fetch = async (url) => {
      calls.push(String(url));
      return new Promise<Response>(() => {});
    };
    const { startBackgroundAssets } = await import('/src/platform/background-assets.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const stop = startBackgroundAssets(document);
    const first = Object.freeze({
      stage: 1,
      stageSeed: 42,
      width: 390,
      height: 844,
      dpr: 2,
      lowQuality: false,
    });
    const next = Object.freeze({ ...first, stage: 8, stageSeed: 43 });
    sampleAssetBackground(0, false, 0, 8.3, 1, first);
    sampleAssetBackground(0, false, 0, 8.3, 8, next);
    sampleAssetBackground(0, true, 0, 8.3, 8, next);
    const predicted = JSON.parse(document.body.dataset.assetNextScene!);
    const deadline = performance.now() + 2000;
    while (calls.length < 2) {
      if (performance.now() > deadline) throw Error('prefetch dispatch timed out');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    sampleAssetBackground(0, false, 0, 8.3);
    const invalidated = !document.body.dataset.assetNextScene;
    stop();
    return { calls, predicted, invalidated, disposed: !document.body.dataset.assetNextScene };
  });
  expect(result.calls).toEqual(['/current.webp', '/eight.webp']);
  expect(result.predicted).toEqual({
    stage: 8,
    stageSeed: 43,
    width: 390,
    height: 844,
    dpr: 2,
    lowQuality: false,
  });
  expect(result.invalidated && result.disposed).toBe(true);
});

test('prefetched runtime files let fresh workers prepare every stage without atlas network access', async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.goto('/privacy/index.html');
  await page.evaluate(async () => {
    const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
    const { createAssetPrefetch, createCompressedAssetStore } =
      await import('/src/platform/compressed-assets.ts');
    const store = createCompressedAssetStore();
    const urls = runtimeAssets.map((asset: any) => asset.url);
    const prefetch = createAssetPrefetch({ urls, read: store.read });
    prefetch.pause(false);
    const deadline = performance.now() + 15_000;
    while (prefetch.snapshot().queued || prefetch.snapshot().active) {
      if (performance.now() > deadline) throw Error('compressed prefetch timed out');
      await new Promise((resolve) => setTimeout(resolve, 20));
    }
    if (prefetch.snapshot().failed) throw Error('compressed prefetch failed');
    prefetch.dispose();
  });
  const atlasRequests: string[] = [];
  await page.route(/\.(?:webp|png)(?:\?|$)/, (route) => {
    atlasRequests.push(route.request().url());
    return route.abort();
  });
  const result = await page.evaluate(async () => {
    const snapshots = [];
    for (let stage = 0; stage < 9; stage++) {
      const worker = new Worker(
        '/src/rendering/environment/compose.worker.ts?worker_file&type=module',
        { type: 'module' },
      );
      try {
        snapshots.push(
          await new Promise<any>((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(Error('cache-only worker prepare timed out')),
              15_000,
            );
            worker.onmessage = ({ data }) => {
              if (data.phase) return;
              clearTimeout(timeout);
              data.ok ? resolve(data.snapshot) : reject(Error(data.error));
            };
            worker.onerror = (error) => {
              clearTimeout(timeout);
              reject(Error(error.message));
            };
            worker.postMessage({ id: 1, kind: 'prepare', stage });
          }),
        );
      } finally {
        worker.terminate();
      }
    }
    return snapshots;
  });
  expect(result).toHaveLength(9);
  expect(result.every((snapshot) => snapshot.backend === 'layered')).toBe(true);
  expect(result[5].decodedLoader.bytes).toBe(113257944);
  expect(atlasRequests).toEqual([]);
});

for (const mode of ['native', 'saveData'])
  test(`background prefetch skips ${mode} and leaves compressed storage untouched`, async ({
    page,
  }) => {
    await page.goto('/privacy/index.html');
    const requests: string[] = [];
    page.on('request', (request) => {
      if (/\.(?:webp|png)(?:\?|$)/.test(request.url())) requests.push(request.url());
    });
    const result = await page.evaluate(async (mode) => {
      if (mode === 'saveData')
        Object.defineProperty(navigator, 'connection', {
          value: Object.assign(new EventTarget(), { saveData: true }),
          configurable: true,
        });
      const { startBackgroundAssets } = await import('/src/platform/background-assets.ts');
      const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
      const stop = startBackgroundAssets(document, mode === 'native');
      sampleAssetBackground(0, true, 0, 8.3);
      await new Promise((resolve) => setTimeout(resolve, 60));
      const snapshot = JSON.parse(document.body.dataset.assetPrefetch!);
      const cachesBefore = await caches.keys();
      stop();
      return { snapshot, cachesBefore, disposed: !document.body.dataset.assetPrefetch };
    }, mode);
    expect(requests).toEqual([]);
    expect(result.snapshot.active).toBe(0);
    expect(result.snapshot.completed).toBe(0);
    expect(result.cachesBefore).toEqual([]);
    expect(result.disposed).toBe(true);
  });

test('frame budget, loading/combat policy and visibility pause background dispatch until quiet again', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  await page.evaluate(async () => {
    const scope = window as any;
    scope.assetCalls = [];
    scope.assetFinishes = [];
    window.fetch = async (url: any) => {
      scope.assetCalls.push(String(url));
      return new Promise<Response>((resolve) =>
        scope.assetFinishes.push(() => resolve(new Response('compressed fixture'))),
      );
    };
    const { startBackgroundAssets } = await import('/src/platform/background-assets.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    scope.assetSample = sampleAssetBackground;
    scope.assetStop = startBackgroundAssets(document);
    sampleAssetBackground(0, true, 0, 8.3);
  });
  await expect.poll(() => page.evaluate(() => (window as any).assetCalls.length)).toBe(2);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    (window as any).assetFinishes.splice(0).forEach((finish: () => void) => finish());
  });
  await expect
    .poll(() => page.evaluate(() => JSON.parse(document.body.dataset.assetPrefetch!).active))
    .toBe(0);
  await page.evaluate(() => {
    const scope = window as any;
    scope.assetSample(0, false, 0, 8.3);
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
    scope.assetSample(0, true, 10, 8.3);
  });
  await page.waitForTimeout(60);
  expect(await page.evaluate(() => (window as any).assetCalls.length)).toBe(2);
  await page.evaluate(() => (window as any).assetSample(0, true, 0, 8.3));
  await expect.poll(() => page.evaluate(() => (window as any).assetCalls.length)).toBe(4);
  await page.evaluate(() => (window as any).assetStop());
});
