import { expect, test } from '@playwright/test';

async function openViewer(page: import('@playwright/test').Page) {
  await expect(page.locator('#c')).toHaveAttribute('data-renderer', 'ink', { timeout: 30000 });
  await page.locator('#title .t-k').click({ clickCount: 3 });
  await expect(page.locator('#cinematic')).toBeVisible();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
}

test('cinematic scenes isolate gameplay, support remapped keys and swipes, and exit at top right', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.settings',
      JSON.stringify({
        version: 1,
        bindings: { up: ['w'], down: ['s'], left: ['j'], right: ['l'], tap: [' '], pause: ['p'] },
      }),
    );
  });
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__cinematicHarness = { G: foundation.run.G, WX: foundation.run.WX, random: () => foundation.run.activity.runRandom.state() }; artworkReady = true;',
      ),
    });
  });
  await page.goto('/');
  await openViewer(page);
  const snapshot = () =>
    page.evaluate(() => {
      const { G, WX, random } = (window as any).__cinematicHarness;
      return {
        state: G.state,
        runTime: G.runTime,
        enemies: G.enemies.map((e: any) => ({ t: e.t, state: e.state })),
        random: random(),
        weather: JSON.stringify(WX),
        checkpoint: localStorage.getItem('issen.runCheckpoint'),
        equip: localStorage.getItem('issen.equip'),
      };
    });
  const before = await snapshot();
  await expect(page.locator('#title')).toBeHidden();
  await page.keyboard.press('l');
  await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', '1');
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', '1');
  await page.keyboard.press('j');
  await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', '0');
  await page.mouse.move(280, 240);
  await page.mouse.down();
  await page.mouse.move(100, 240, { steps: 4 });
  await page.mouse.up();
  await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', '1');
  await expect(page.getByLabel('Preview artwork')).toHaveCount(0);
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
  await page.waitForTimeout(250);
  expect(await snapshot()).toEqual(before);
  const exit = page.getByRole('button', { name: 'Exit', exact: true });
  const box = await exit.boundingBox();
  expect(box!.y).toBeLessThan(30);
  expect(box!.x).toBeGreaterThan(250);
  await exit.click();
  await expect(page.locator('#cinematic')).toBeHidden();
  await expect(page.locator('#title')).toBeVisible();
  expect(await page.evaluate(() => sessionStorage.getItem('issen.cinematic'))).toBeNull();
});

test('cinematic session restores scene on refresh; exit clears restoration', async ({ page }) => {
  await page.goto('/');
  await openViewer(page);
  await page.getByRole('button', { name: 'Next scene' }).click();
  await page.getByRole('button', { name: 'Next scene' }).click();
  await expect(page.getByLabel('Preview artwork')).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#cinematic')).toBeVisible();
  await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', '2');
  await expect(page.getByLabel('Preview artwork')).toHaveCount(0);
  await expect(page.locator('#c')).toHaveAttribute('data-renderer', 'ink');
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('#cinematic')).toBeHidden();
  await expect(page.locator('#title')).toBeVisible();
});

test('viewer remains usable with unavailable session storage and keyboard logo activation', async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'sessionStorage', {
      get() {
        throw new Error('blocked');
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer', 'ink', { timeout: 30000 });
  await page.locator('#title .t-k').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#cinematic')).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('#cinematic')).not.toHaveAttribute('data-scene', '0');
  await page.keyboard.press('Escape');
  await expect(page.locator('#title')).toBeVisible();
});

test('session preview preserves a saved run across refresh and exit', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
  });
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.keyboard.press('p');
  const checkpoint = await page.evaluate(() => localStorage.getItem('issen.runCheckpoint'));
  expect(checkpoint).toBeTruthy();
  await page.evaluate(() =>
    sessionStorage.setItem(
      'issen.cinematic',
      JSON.stringify({ active: true, scene: 4, renderer: 'ink' }),
    ),
  );
  await page.reload();
  await expect(page.locator('#cinematic')).toBeVisible();
  await page.getByRole('button', { name: 'Next scene' }).click();
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => localStorage.getItem('issen.runCheckpoint'))).toBe(checkpoint);
  await expect(page.locator('#bContinue')).toBeVisible();
  await page.locator('#bContinue').click();
  await expect(page.locator('#title')).not.toHaveClass(/on/);
  await expect(page.locator('#hud')).toHaveClass(/on/);
});

test('cinematic desktop and tablet visual captures', async ({ page }, testInfo) => {
  await page.goto('/');
  await openViewer(page);
  await expect(page.getByLabel('Preview artwork')).toHaveCount(0);
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: testInfo.outputPath('cinematic-desktop.png') });
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.waitForTimeout(150);
  await page.screenshot({ path: testInfo.outputPath('cinematic-tablet.png') });
});
