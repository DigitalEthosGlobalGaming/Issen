import { expect, test } from '@playwright/test';

test('native startup error page remains readable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  try {
    const page = await context.newPage();
    await page.goto('/startup-error.html');
    await expect(page.getByRole('heading', { name: 'Issen could not start' })).toBeVisible();
    await expect(page.getByText(/update Android System WebView/)).toBeVisible();
    expect(await page.locator('script').count()).toBe(0);
  } finally {
    await context.close();
  }
});

test('startup worker failure offers one reload retry and preserves saved values', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem('issen.best') === null) localStorage.setItem('issen.best', '123');
    if (sessionStorage.getItem('worker-fixture-recovered')) return;
    window.Worker = class {
      constructor() {
        throw Error('fixture startup worker failure');
      }
    } as any;
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Scene unavailable' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(1);
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'unavailable');
  await page.evaluate(() => sessionStorage.setItem('worker-fixture-recovered', '1'));
  await page.getByRole('button', { name: 'Retry', exact: true }).click();
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
  expect(await page.evaluate(() => localStorage.getItem('issen.best'))).toBe('123');
});

for (const failure of ['transition', 'presented'] as const)
  test(`${failure} scene worker retry holds combat and adopts the same stage seed without reload`, async ({
    page,
  }) => {
    await page.addInitScript(() => {
      const NativeWorker = window.Worker;
      window.Worker = class extends NativeWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          if (options?.name === 'issen-scenery') (window as any).fixtureSceneryWorker = this;
        }
        postMessage(message: any, ...rest: any[]) {
          if ((window as any).failNextScenery && message.kind === 'compose') {
            (window as any).failNextScenery = false;
            this.dispatchEvent(
              new ErrorEvent('error', { message: 'fixture stage worker failure' }),
            );
            return;
          }
          return Reflect.apply(NativeWorker.prototype.postMessage, this, [message, ...rest]);
        }
      };
    });
    await page.route('**/src/game.ts*', async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replace(
          'artworkReady = true;',
          'window.__workerRecovery = { foundation, game }; artworkReady = true;',
        ),
      });
    });
    await page.goto('/');
    await page.waitForFunction(() => !!(window as any).__workerRecovery);
    await page.locator('#bPlay').click();
    await page.locator('#bBegin').click();
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
      timeout: 30000,
    });
    const snapshot = () =>
      page.evaluate(() => {
        const { foundation: f } = (window as any).__workerRecovery;
        return {
          state: f.run.G.state,
          runTime: f.run.G.runTime,
          seed: f.view.stageState.stageSeed,
          random: f.run.activity.runRandom.state(),
          saved: localStorage.getItem('issen.runCheckpoint'),
        };
      });
    await page.evaluate((failure) => {
      if (failure === 'presented')
        (window as any).fixtureSceneryWorker.dispatchEvent(
          new ErrorEvent('error', { message: 'fixture active worker failure' }),
        );
      else {
        (window as any).failNextScenery = true;
        (window as any).__workerRecovery.game.setStage(1, false);
      }
    }, failure);
    await expect(page.getByRole('heading', { name: 'Scene unavailable' })).toBeVisible();
    const held = await snapshot();
    await page.waitForTimeout(300);
    expect(await snapshot()).toEqual(held);
    await page.getByRole('button', { name: 'Retry', exact: true }).click();
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
      timeout: 30000,
    });
    await expect(page.locator('.startup-loading')).toHaveCount(0);
    const recovered = await snapshot();
    expect(recovered.seed).toBe(held.seed);
    expect(recovered.saved).toBe(held.saved);
    expect(
      await page.evaluate(
        () =>
          (window as any).__workerRecovery.foundation.browser.environmentRenderer.snapshot().worker,
      ),
    ).toBe(true);
  });

test('missing worker, offscreen canvas or bitmap capability cannot activate local scenery', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const rows = await page.evaluate(async () => {
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const rows = [];
    for (const key of ['Worker', 'OffscreenCanvas', 'createImageBitmap'] as const) {
      const original = window[key];
      try {
        Reflect.set(window, key, undefined);
        const owner = createEnvironmentRenderer(document);
        const ready = await owner.compose({
          width: 160,
          height: 100,
          dpr: 1,
          time: 0,
          stage: 1,
          stageSeed: 7,
          reducedMotion: true,
          reducedFlashes: true,
          lowQuality: true,
        });
        rows.push({ ready, ...owner.snapshot() });
        owner.dispose();
      } finally {
        Reflect.set(window, key, original);
      }
    }
    return rows;
  });
  for (const row of rows) {
    expect(row.ready).toBe(false);
    expect(row.backend).toBe('unavailable');
    expect(row.worker).toBe(false);
    expect(row.workerFailure).toContain('does not support worker scenery');
  }
});
