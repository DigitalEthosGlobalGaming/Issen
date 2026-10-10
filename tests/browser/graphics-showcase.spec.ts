import { expect, test } from '@playwright/test';

test('title Graphics showcases an independent scene and restores title identity without save or RNG changes', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => localStorage.setItem('issen.muted', 'false'));
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__showcase = { G: foundation.run.G, random: () => foundation.run.activity.runRandom.state(), stage: foundation.view.stageState, environment: presentation.environmentState, time: foundation.view.presentationState }; artworkReady = true;',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered', {
    timeout: 30_000,
  });
  await page.locator('#bOptions').click();
  const snapshot = () =>
    page.evaluate(() => {
      const owner = (window as any).__showcase;
      const saves = Object.fromEntries(
        Object.keys(localStorage)
          .filter((key) => key.startsWith('issen.') && key !== 'issen.settings')
          .map((key) => [key, localStorage.getItem(key)]),
      );
      return {
        stage: owner.G.stage,
        seed: owner.stage.stageSeed,
        random: owner.random(),
        saves,
        time: owner.time.time,
        gusts: owner.environment.leaves.filter((leaf: any) => leaf.gust).length,
      };
    });
  const before = await snapshot();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Graphics/ })
    .click();
  await expect(page.locator('html')).toHaveAttribute('data-graphics-showcase', 'true');
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  await expect(page.locator('#c')).toHaveAttribute('data-scene', '3');
  await expect.poll(async () => (await snapshot()).gusts).toBeGreaterThan(0);
  const shown = await snapshot();
  expect(shown.stage).toBe(3);
  expect(shown.seed).toBe(0x49535345);
  expect(shown.random).toBe(before.random);
  expect(shown.saves).toEqual(before.saves);
  expect(shown.time).toBeGreaterThan(before.time);
  await page.screenshot({ path: testInfo.outputPath('title-graphics-showcase.png') });
  await page.getByLabel('Ambient particles', { exact: true }).selectOption('off');
  await expect.poll(async () => (await snapshot()).gusts).toBe(0);
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-showcase', 'false');
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  const restored = await snapshot();
  expect(restored.stage).toBe(before.stage);
  expect(restored.seed).toBe(before.seed);
  expect(restored.random).toBe(before.random);
  expect(restored.saves).toEqual(before.saves);
});
