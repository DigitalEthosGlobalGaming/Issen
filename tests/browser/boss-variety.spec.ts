import { expect, test } from '@playwright/test';
test('varied boss name and appearance survive checkpoint reload', async ({ page }, info) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__bossVariety = {G: foundation.run.G,testJump: game.testJump}; artworkReady = true;',
      ),
    });
  });
  await page.addInitScript(() => {
    sessionStorage.setItem('issen.testing', '1');
    localStorage.setItem(
      'issen.testing.guidedLessons',
      JSON.stringify({ order: true, bossParry: true }),
    );
  });
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await page.evaluate(() => {
    (window as any).__bossVariety.testJump(0, 3, true);
  });
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.testing.runCheckpoint')!).run.boss,
  );
  await expect(page.locator('#bossN')).toHaveText(before.def.n);
  await page.screenshot({ path: info.outputPath('varied-boss.png') });
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  const after = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.testing.runCheckpoint')!).run.boss,
  );
  expect(after.def).toEqual(before.def);
  expect(after.d).toEqual(before.d);
});
