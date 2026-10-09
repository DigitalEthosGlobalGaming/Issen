import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

for (const fallback of [false, true])
  test(`startup leaves future environment images to their owners (${fallback ? 'local fallback' : 'worker'})`, async ({
    page,
  }, info) => {
    test.setTimeout(60000);
    const errors: string[] = [],
      blocked: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((fallback) => {
      performance.setResourceTimingBufferSize(4000);
      if (fallback)
        (window as any).Worker = class {
          constructor() {
            throw Error('fixture worker construction failure');
          }
        };
    }, fallback);
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    await page.route(
      /\/rendering\/environment\/assets\/(?:bamboo|temple|snow|cherry|sea-stacks).*\.webp/,
      (route) => {
        if (route.request().resourceType() === 'image') {
          blocked.push(route.request().url());
          return route.abort();
        }
        return route.continue();
      },
    );
    await page.route('**/src/game.ts*', async (route) => {
      const response = await route.fetch();
      const body = (await response.text()).replace(
        'artworkReady = true;',
        'window.__sceneStartup = { foundation, presentation, frames }; artworkReady = true;',
      );
      await route.fulfill({ response, body });
    });
    await page.goto('/');
    await page.waitForFunction(() => !!(window as any).__sceneStartup);
    const result = await page.evaluate(async () => {
      const { foundation: f, frames, presentation: p } = (window as any).__sceneStartup;
      frames.frameLoop.stop();
      await f.browser.demonRealmRenderer.prepare();
      await p.driftRenderer.prepare();
      const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
      const imageUrls = new Set(
        performance
          .getEntriesByType('resource')
          .filter((entry) => (entry as PerformanceResourceTiming).initiatorType === 'img')
          .map((entry) => entry.name),
      );
      const direct = runtimeAssets
        .filter((asset) => asset.group === 'environment' && imageUrls.has(asset.url))
        .map((asset) => ({
          url: new URL(asset.url).pathname,
          bytes: asset.width * asset.height * 4,
        }));
      return {
        backend: f.browser.environmentRenderer.backend,
        scene: f.browser.environmentRenderer.snapshot(),
        driftReady: p.driftRenderer.ready,
        direct,
        bytes: direct.reduce((s, a) => s + a.bytes, 0),
      };
    });
    await writeFile(
      info.outputPath('startup-environment.json'),
      JSON.stringify({ ...result, blocked, errors }, null, 2),
    );
    expect(result.backend).toBe('layered');
    expect(result.scene.stage).toBe(0);
    expect(result.scene.worker ?? false).toBe(!fallback);
    expect(result.driftReady).toBe(true);
    expect(
      result.direct.every((a) => /(?:demon-|mountain-atlas|drift-|fog-wisps-atlas)/.test(a.url)),
    ).toBe(true);
    expect(result.direct.length).toBeLessThan(54);
    expect(blocked).toEqual([]);
    expect(errors).toEqual([]);
  });
