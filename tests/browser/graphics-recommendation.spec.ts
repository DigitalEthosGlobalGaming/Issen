import { expect, test } from '@playwright/test';

test('repeated mid-run preparation shows a nonblocking graphics recommendation', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.route(/\/src\/runtime\/scene\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'function prepareScene() {',
        'window.__preparation = { sceneFlow, G: foundation.run.G, geometry: foundation.view.geometry }; function prepareScene() {',
      ),
    });
  });
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 30000 });
  const choices = await page.evaluate(() => localStorage.getItem('issen.settings'));
  const prepare = () =>
    page.evaluate(() => {
      const views = (window as any).__preparation;
      views.G.state = 'playing';
      views.G.panel = null;
      views.geometry.DPR *= 0.95;
      views.sceneFlow.prepareScene();
    });
  await prepare();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 30000 });
  await expect(page.locator('#hint')).not.toContainText('Scenery keeps interrupting');
  await prepare();
  await expect(page.locator('#hint')).toHaveText(
    'Scenery keeps interrupting your run. Try lower Graphics in Options.',
    { timeout: 30000 },
  );
  await expect(page.locator('#hint')).toHaveClass('on');
  expect(await page.evaluate(() => localStorage.getItem('issen.settings'))).toBe(choices);
  await page.locator('#pauseBtn').click();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await page.screenshot({ path: info.outputPath('graphics-recommendation.png') });
  expect(errors).toEqual([]);
});

test('unchanged pending upload reservations do not rescan document memory every frame', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createPixiScenePainter(canvas);
    const memory = documentPixelMemory(document),
      snapshot = memory.snapshot;
    let scans = 0;
    memory.snapshot = () => {
      scans++;
      return snapshot();
    };
    // Model a reserved source not uploaded by the current drawing pass.
    const source = {
      pixelWidth: 20,
      pixelHeight: 20,
      autoGenerateMipmaps: false,
      format: 'rgba8unorm',
      _gpuData: {},
    };
    (painter as any).drawingTextureSources = function* () {
      yield source;
    };
    const draw = () => {
      painter.begin();
      painter.fillStyle = '#987';
      painter.fillRect(0, 0, 32, 32);
      painter.flush();
    };
    try {
      for (let i = 0; i < 60; i++) draw();
      const repeated = scans;
      source.pixelWidth++;
      draw();
      const changed = scans;
      await new Promise((resolve) => setTimeout(resolve, 1050));
      draw();
      return { repeated, changed, reconciled: scans };
    } finally {
      memory.snapshot = snapshot;
      painter.dispose();
    }
  });
  expect(result.repeated).toBeLessThan(5);
  expect(result.changed).toBeGreaterThan(result.repeated);
  expect(result.reconciled).toBeGreaterThan(result.changed);
});
