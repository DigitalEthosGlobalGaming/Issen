import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('player base owners share all four required planes and preserve peers after pending disposal', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkPlayerRenderer } = await import('/src/rendering/figures/ink-player.ts');
    const a = createInkPlayerRenderer(document),
      b = createInkPlayerRenderer(document);
    a.select('sumi');
    b.select('sumi');
    const pending = a.prepare(),
      peer = b.prepare();
    a.dispose();
    a.dispose();
    const cancelled = await pending,
      ready = await peer;
    const alive = b.snapshot();
    b.dispose();
    b.dispose();
    const disposed = b.snapshot();
    const afterDispose = await b.prepare();
    return { cancelled, ready, alive, disposed, afterDispose };
  });
  expect(result.cancelled).toBe(false);
  expect(result.ready).toBe(true);
  expect(result.alive).toMatchObject({
    ready: true,
    pbrReady: true,
    outfits: { loaded: [] },
    decodedLoader: { decoded: 4, pinned: 4, bytes: 25160256, pinnedBytes: 25160256 },
  });
  expect(result.disposed).toMatchObject({
    status: 'disposed',
    decodedLoader: { decoded: 0, pinned: 0, bytes: 0 },
  });
  expect(result.afterDispose).toBe(false);
});

test('shared player, charm and world UI sources have no second startup image owner', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  await page.addInitScript(() => performance.setResourceTimingBufferSize(4000));
  const direct: string[] = [],
    errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.route(/(?:player-ronin-simple|charm-atlas|world-ui-atlas).*\.webp/, (route) => {
    if (route.request().resourceType() === 'image') {
      direct.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.route('**/src/game.ts*', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'artworkReady = true;',
      'window.__playerImages = { foundation, frames }; artworkReady = true;',
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__playerImages);
  const snapshot = await page.evaluate(async () => {
    const { foundation, frames } = (window as any).__playerImages;
    frames.frameLoop.stop();
    const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
    const imageUrls = new Set(
      performance
        .getEntriesByType('resource')
        .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === 'img')
        .map((entry) => entry.name),
    );
    const environmentStartup = runtimeAssets
      .filter((asset) => asset.group === 'environment' && imageUrls.has(asset.url))
      .map((asset) => ({
        url: new URL(asset.url).pathname,
        bytes: asset.width * asset.height * 4,
      }));
    return {
      player: foundation.browser.inkPlayer.snapshot(),
      charm: foundation.browser.inkCharm.snapshot(),
      environmentStartup,
    };
  });
  await writeFile(
    testInfo.outputPath('shared-artwork-startup.json'),
    JSON.stringify(snapshot, null, 2),
  );
  expect(snapshot.player.ready).toBe(true);
  expect(snapshot.player.outfits.loaded).toEqual([]);
  expect(snapshot.charm.state).toBe('ready');
  expect(snapshot.player.decodedLoader.pinnedBytes).toBeGreaterThanOrEqual(25160256);
  expect(direct).toEqual([]);
  expect(errors).toEqual([]);
});
