import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  test.setTimeout(60000);
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        `
      { let releaseScene;
      const composeScene = foundation.browser.environmentRenderer.compose.bind(foundation.browser.environmentRenderer);
      window.__sceneReadiness = {
        G: foundation.run.G, startWave: game.startWave, startRushDuel: game.startRushDuel,
        hold() {
          const blocked = new Promise(resolve => { releaseScene = resolve; });
          foundation.browser.environmentRenderer.compose = async frame => { await blocked; return composeScene(frame); };
        },
        release() { releaseScene(); },
        freezeMenu() { ui.screenAnimation.demand = () => ({ update: false, render: false, afterRender: false }); }
      };
      artworkReady = true;
      }
    `,
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).__sceneReadiness, undefined, { timeout: 30000 });
});

test('cinematic arrows, keys and swipes display their selected scene even with a settled menu', async ({
  page,
}) => {
  await page.evaluate(() => (window as any).__sceneReadiness.freezeMenu());
  await page.locator('#title .t-k').click({ clickCount: 3 });
  const canvas = page.locator('#c');
  const scene = async (value: string) => {
    await expect(canvas).toHaveAttribute('data-scene', value, { timeout: 15000 });
    await expect(canvas).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  };
  await scene('0');
  await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  await scene('1');
  await page.keyboard.press('ArrowLeft');
  await scene('0');
  await page.mouse.move(280, 260);
  await page.mouse.down();
  await page.mouse.move(100, 260, { steps: 4 });
  await page.mouse.up();
  await scene('1');
  await page.getByRole('button', { name: 'Previous scene', exact: true }).click();
  await page.getByRole('button', { name: 'Previous scene', exact: true }).click();
  await scene('9');
  await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  await scene('0');
});

test('a run waits for scenery and a presented background before spawning or advancing combat', async ({
  page,
}) => {
  await page.evaluate(() => (window as any).__sceneReadiness.hold());
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'loading');
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => {
      const { G } = (window as any).__sceneReadiness;
      return { enemies: G.enemies.length, pending: G.pendingSpawns.length, runTime: G.runTime };
    }),
  ).toEqual({ enemies: 0, pending: 0, runTime: 0 });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(() =>
      page.locator('#c').evaluate((canvas: HTMLCanvasElement) => canvas.width > canvas.height),
    )
    .toBe(true);
  await page.evaluate(() => (window as any).__sceneReadiness.release());
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await expect
    .poll(() => page.evaluate(() => (window as any).__sceneReadiness.G.enemies.length))
    .toBeGreaterThan(0);
});

test('a boss waits for its new scene and remains paused when loading finishes', async ({
  page,
}) => {
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.evaluate(() => {
    const h = (window as any).__sceneReadiness;
    h.hold();
    h.G.bossCount = 1;
    h.startRushDuel();
  });
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'loading');
  expect(await page.evaluate(() => (window as any).__sceneReadiness.G.boss)).toBeNull();
  await page.keyboard.press('p');
  await page.evaluate(() => (window as any).__sceneReadiness.release());
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  expect(
    await page.evaluate(() => {
      const { G } = (window as any).__sceneReadiness;
      return {
        stage: G.stage,
        bossCount: G.bossCount,
        boss: !!G.boss,
        state: G.state,
        pausedFrom: G.pausedFrom,
      };
    }),
  ).toEqual({ stage: 1, bossCount: 2, boss: true, state: 'paused', pausedFrom: 'boss' });
});
