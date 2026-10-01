import { expect, test } from '@playwright/test';
import type { Page } from '@playwright/test';

const displayOptions = async (page: Page, paused = false) => {
  await page.locator(paused ? '#bPauseOptions' : '#bOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Display/ })
    .click();
};

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
  });
});

test('scene artwork switches in a paused run without changing encounter or saved progress', async ({
  page,
}) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'frameLoop.start();',
        'window.__rendererHarness = { G, randomState: () => runRandom.state(), film: () => EQ.film }; frameLoop.start();',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.keyboard.press('p');
  await displayOptions(page, true);
  const snapshot = () =>
    page.evaluate(() => {
      const { G, randomState, film } = (window as any).__rendererHarness;
      return {
        state: G.state,
        score: G.score,
        stage: G.stage,
        times: G.enemies.map((e: any) => e.t),
        random: randomState(),
        film: film(),
        checkpoint: localStorage.getItem('issen.runCheckpoint'),
      };
    });
  const before = await snapshot();
  await page.getByLabel('Scene artwork', { exact: true }).selectOption('ink');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
  expect(await snapshot()).toEqual(before);
  await page.getByLabel('Scene artwork', { exact: true }).selectOption('classic');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'classic');
  expect(await snapshot()).toEqual(before);
  await page.keyboard.press('Escape');
  await page.locator('#options').getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await page.locator('#bResume').click();
  await expect.poll(async () => (await snapshot()).state).toBe('playing');
});

test('artwork preference survives reload, scales across tablet and desktop, and resets to classic', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await displayOptions(page);
  await page.getByLabel('Scene artwork', { exact: true }).selectOption('ink');
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
  for (const viewport of [
    { width: 1024, height: 768 },
    { width: 1440, height: 900 },
    { width: 768, height: 1024 },
  ]) {
    await page.setViewportSize(viewport);
    await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
    await expect
      .poll(() =>
        page.locator('#c').evaluate((canvas: HTMLCanvasElement) => canvas.width / canvas.height),
      )
      .toBeCloseTo(viewport.width / viewport.height, 1);
  }
  await displayOptions(page);
  await expect(page.getByLabel('Scene artwork', { exact: true })).toHaveValue('ink');
  await page
    .locator('#options')
    .getByRole('button', { name: 'Restore defaults', exact: true })
    .click();
  await expect(page.getByLabel('Scene artwork', { exact: true })).toHaveValue('classic');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'classic');
});

test('failed ink asset requests fall back to classic scenery and remain switchable', async ({
  page,
}) => {
  await page.route('**/environment/assets/**', (route) => route.abort());
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await displayOptions(page);
  await page.getByLabel('Scene artwork', { exact: true }).selectOption('ink');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'unavailable');
  await expect(page.locator('#c')).toBeVisible();
  await page.getByLabel('Scene artwork', { exact: true }).selectOption('classic');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'classic');
});
