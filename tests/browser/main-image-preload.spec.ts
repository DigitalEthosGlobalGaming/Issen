import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('admitted image sets reuse native decodes within the budget and preserve peer leases', async ({
  page,
}, testInfo) => {
  test.setTimeout(120000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 2 });
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const { sceneImageUrls, environmentAssetUrls } =
      await import('/src/rendering/environment/asset-sources.ts');
    const owner = createMainImageOwner(document),
      peer = createMainImageOwner(document);
    const pinned = peer.acquire(environmentAssetUrls[9]!);
    const image = await pinned.ready;
    const nativeDecode = HTMLImageElement.prototype.decode;
    let decodes = 0;
    HTMLImageElement.prototype.decode = function () {
      decodes++;
      return nativeDecode.call(this);
    };
    const rows = [];
    try {
      for (let stage = 0; stage < 9; stage++) {
        sampleAssetBackground(stage, true, 1, 8.3);
        const urls = sceneImageUrls(stage);
        if (urls.some((url) => /_diffuse\./.test(url))) throw Error('Redundant diffuse selection');
        const preload = owner.prefetch(urls);
        if (!preload || !(await preload.ready)) throw Error('Measured image set not admitted');
        const warm = owner.snapshot(),
          before = decodes;
        const leases = urls.map((url) => owner.acquire(url));
        const sources = await Promise.all(leases.map((lease) => lease.ready));
        const enteredDecodes = decodes - before;
        const ready = sources.every(
          (source) => source.naturalWidth > 0 && source.naturalHeight > 0,
        );
        for (const lease of leases) lease.release();
        preload.release();
        rows.push({
          stage,
          warm,
          enteredDecodes,
          ready,
          live: image.naturalWidth > 0,
          released: owner.snapshot(),
        });
      }
      sampleAssetBackground(0, false, 1, 8.3);
      const busyDenied = owner.prefetch(sceneImageUrls(0)) === undefined;
      owner.dispose();
      const peerSurvives = image.naturalWidth > 0 && peer.snapshot().pinned === 1;
      pinned.release();
      peer.dispose();
      return { rows, busyDenied, peerSurvives, disposed: peer.snapshot() };
    } finally {
      owner.dispose();
      peer.dispose();
      HTMLImageElement.prototype.decode = nativeDecode;
    }
  });
  await writeFile(testInfo.outputPath('main-image-preload.json'), JSON.stringify(result, null, 2));
  expect(result.rows).toHaveLength(9);
  for (const row of result.rows) {
    expect(row.enteredDecodes).toBe(0);
    expect(row.ready && row.live).toBe(true);
    expect(row.warm.peakBytes).toBeLessThanOrEqual(256 * 1024 * 1024);
    expect(row.released.pinned).toBe(1);
    expect(row.released.queued).toBe(0);
  }
  expect(result.busyDenied && result.peerSurvives).toBe(true);
  expect(result.disposed.bytes).toBe(0);
});
