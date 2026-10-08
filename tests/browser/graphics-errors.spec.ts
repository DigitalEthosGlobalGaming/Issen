import { expect, test } from '@playwright/test';

test('missing WebGL2 shows one graphics error with Retry and retains canvas identity', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type: string, ...args: any[]) {
      if (type === 'webgl2') return null;
      return Reflect.apply(get, this, [type, ...args]);
    } as typeof get;
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Graphics not supported' })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(page.locator('.startup-loading')).toHaveCount(1);
  await expect(page.locator('[data-graphics-backend="canvas"]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Graphics not supported' })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.locator('.startup-loading')).toHaveCount(1);
});

test('failed surface initialization never replaces the supplied canvas', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { SceneSurface } = await import('/src/rendering/scene-surface.ts');
    const canvas = document.createElement('canvas');
    document.body.append(canvas);
    canvas.getContext = (() => null) as typeof canvas.getContext;
    const surface = new SceneSurface(canvas);
    let error = '';
    try {
      await surface.initialize();
    } catch (caught) {
      error = (caught as Error).name;
    }
    const same = surface.canvas === canvas && canvas.isConnected;
    surface.dispose();
    return { error, same, backend: canvas.dataset.graphicsBackend };
  });
  expect(result).toEqual({ error: 'GraphicsUnsupportedError', same: true, backend: undefined });
});

test('auxiliary deadline reports unsupported graphics without replacing the canvas', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  await page.clock.install();
  await page.evaluate(async () => {
    const { SceneSurface } = await import('/src/rendering/scene-surface.ts');
    const canvas = document.createElement('canvas');
    canvas.id = 'deadline';
    document.body.append(canvas);
    const surface = new SceneSurface(canvas, true);
    await surface.initialize();
    Object.assign(window, { deadlineCanvas: canvas, surface, errors: 0 });
    document.addEventListener('issen-graphics-error', () => {
      (window as any).errors++;
    });
    canvas.dispatchEvent(new Event('webglcontextlost', { cancelable: true }));
  });
  await page.clock.runFor(8100);
  await expect(page.locator('#deadline')).toHaveAttribute('data-context-state', 'unsupported');
  await expect(page.locator('#deadline')).toHaveAttribute('data-graphics-backend', 'pixi');
  expect(
    await page.evaluate(() => {
      const state = window as any;
      state.surface.dispose();
      return {
        same: state.deadlineCanvas === document.querySelector('#deadline'),
        errors: state.errors,
      };
    }),
  ).toEqual({ same: true, errors: 1 });
});
