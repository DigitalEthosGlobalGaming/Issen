import { expect, test } from '@playwright/test';

test('scene surface shares initialization and keeps extracted disposal safe', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { SceneSurface } = await import('/src/rendering/scene-surface.ts');
    const canvas = document.createElement('canvas');
    const surface = new SceneSurface(canvas, true);
    const first = surface.initialize();
    const shared = first === surface.initialize();
    await first;
    const painter = surface.native!;
    const dispose = painter.dispose.bind(painter);
    let releases = 0;
    painter.dispose = () => {
      releases++;
      dispose();
    };
    const release = surface.dispose;
    release();
    release();
    canvas.dispatchEvent(new Event('webglcontextlost'));
    await surface.initialize();
    return { shared, releases, cleared: !surface.native && !surface.drawing };
  });
  expect(result).toEqual({ shared: true, releases: 1, cleared: true });
});

test('disposing a pending scene surface cannot publish a late context', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { SceneSurface } = await import('/src/rendering/scene-surface.ts');
    const canvas = document.createElement('canvas');
    const surface = new SceneSurface(canvas);
    const pending = surface.initialize();
    surface.dispose();
    await pending;
    return {
      drawing: !!surface.drawing,
      native: !!surface.native,
      backend: canvas.dataset.graphicsBackend,
    };
  });
  expect(result).toEqual({ drawing: false, native: false, backend: undefined });
});

test('a GPU context completing after disposal is released without becoming drawable', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { disposePendingSurface } = await import('/tests/browser/fixtures/pending-surface.ts');
    return disposePendingSurface();
  });
  expect(result).toEqual({ releases: 1, drawing: false, native: false });
});

test('restored auxiliary contexts cancel fallback and disposal cancels a later deadline', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  await page.clock.install();
  await page.evaluate(async () => {
    const { SceneSurface } = await import('/src/rendering/scene-surface.ts');
    const canvas = document.createElement('canvas');
    canvas.id = 'owned-preview';
    document.body.append(canvas);
    const surface = new SceneSurface(canvas, true);
    await surface.initialize();
    Object.assign(window, { ownedSurface: surface });
    Object.defineProperty(surface.native!, 'contextLost', { configurable: true, get: () => true });
    canvas.dispatchEvent(new Event('webglcontextlost'));
    canvas.dispatchEvent(new Event('webglcontextrestored'));
  });
  await page.clock.runFor(8100);
  await expect(page.locator('#owned-preview')).toHaveAttribute('data-graphics-backend', 'pixi');
  await page.evaluate(() => {
    const surface = (window as any).ownedSurface;
    surface.canvas.dispatchEvent(new Event('webglcontextlost'));
    surface.dispose();
  });
  await page.clock.runFor(8100);
  await expect(page.locator('#owned-preview')).not.toHaveAttribute(
    'data-renderer-fallback',
    'context-loss',
  );
});

for (const operation of ['dispose', 'retry'] as const) {
  test(`startup owns pending surfaces and handles ${operation} without a second root`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto('/privacy/index.html');
    await page.evaluate(async () => {
      const { MainGame } = await import('/src/main-game.ts');
      const { SceneSurface } = await import('/src/rendering/scene-surface.ts');
      let release!: () => void;
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      let entered = false;
      let fail = false;
      let calls = 0;
      const initialize = SceneSurface.prototype.initialize;
      SceneSurface.prototype.initialize = async function (pixi) {
        calls++;
        if (!entered) {
          entered = true;
          await gate;
          if (fail) throw new Error('Test initialization failure');
        }
        return initialize.call(this, pixi);
      };
      const app = new MainGame();
      const pending = app.begin();
      const shared = pending === app.begin();
      Object.assign(window, {
        startupCase: {
          app,
          pending,
          shared,
          entered: () => entered,
          calls: () => calls,
          release: (reject: boolean) => {
            fail = reject;
            release();
          },
        },
      });
    });
    await expect
      .poll(() => page.evaluate(() => (window as any).startupCase.entered()), { timeout: 30000 })
      .toBe(true);
    await expect(page.locator('#app')).toHaveCount(1);
    expect(await page.evaluate(() => (window as any).startupCase.shared)).toBe(true);
    if (operation === 'dispose') {
      await page.evaluate(async () => {
        const state = (window as any).startupCase;
        state.app.dispose();
        state.release(false);
        await state.pending;
        await state.app.begin();
      });
      await expect(page.locator('#app')).toHaveCount(0);
      await expect(page.locator('.startup-loading')).toHaveCount(0);
      expect(await page.evaluate(() => (window as any).startupCase.calls())).toBe(1);
    } else {
      await page.evaluate(async () => {
        const state = (window as any).startupCase;
        state.release(true);
        await state.pending;
      });
      await expect(page.locator('#app')).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Retry loading' })).toBeVisible();
      await page.getByRole('button', { name: 'Retry loading' }).click();
      await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
      await expect(page.locator('#app')).toHaveCount(1);
      await expect(page.locator('#title')).toHaveClass(/on/);
      await page.evaluate(() => (window as any).startupCase.app.dispose());
      await expect(page.locator('#app')).toHaveCount(0);
    }
  });
}
