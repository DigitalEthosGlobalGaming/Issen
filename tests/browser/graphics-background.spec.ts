import { expect, test } from '@playwright/test';

test('resolution swaps preserve combat and incremental memory matches exact native accounting', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
    localStorage.setItem(
      'issen.settings',
      JSON.stringify({
        graphics: {
          preset: 'custom',
          resolution: 100,
          adaptive: false,
          memory: 'high',
          preload: true,
        },
      }),
    );
  });
  await page.route(/\/src\/runtime\/scene\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'function prepareScene() {',
        'window.__background = { G: foundation.run.G, geometry: foundation.view.geometry, painter: foundation.browser.nativeScene }; function prepareScene() {',
      ),
    });
  });
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 30000 });
  const start = await page.evaluate(() => {
    const state = (window as any).__background;
    state.G.lives = 100; // Keep ordinary inputs enabled while the worker runs.
    const canvas = document.querySelector<HTMLCanvasElement>('#c')!;
    (window as any).__loadingStates = [];
    new MutationObserver(() =>
      (window as any).__loadingStates.push(canvas.dataset.sceneState),
    ).observe(canvas, { attributes: true, attributeFilter: ['data-scene-state'] });
    document.documentElement.dataset.graphicsResolution = '80';
    window.dispatchEvent(new Event('issen:graphics-resolution'));
    return { runTime: state.G.runTime, width: canvas.width };
  });
  await expect
    .poll(() => page.locator('#c').evaluate((canvas: HTMLCanvasElement) => canvas.width), {
      timeout: 30000,
    })
    .toBe(Math.round(start.width * 0.8));
  const result = await page.evaluate(async () => {
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const memory = documentPixelMemory(document);
    const owned = memory.track(document.createElement('canvas'), 'canvas');
    owned.width = 20;
    owned.height = 30;
    const incremental = memory.snapshot(true),
      exact = memory.snapshot();
    const painter = (window as any).__background.painter;
    return {
      incremental,
      exact,
      states: (window as any).__loadingStates,
      runTime: (window as any).__background.G.runTime,
      gpu: painter.admissionMemorySnapshot,
      exactGpu: painter.memorySnapshot,
    };
  });
  expect(result.states).not.toContain('loading');
  expect(result.runTime).toBeGreaterThan(start.runTime);
  expect(result.incremental.gpuBytes).toBe(result.exact.gpuBytes);
  expect(result.incremental.canvasBytes).toBe(result.exact.canvasBytes);
  expect(result.incremental.canvasBytes).toBeGreaterThanOrEqual(2400);
  expect(result.gpu.bytes).toBeGreaterThan(0);
  expect(result.gpu).toEqual(result.exactGpu);
  await page.locator('#pauseBtn').click();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  expect(errors).toEqual([]);
});
