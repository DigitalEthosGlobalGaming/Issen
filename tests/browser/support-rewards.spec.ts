import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'frameLoop.start();',
      'window.__supportHarness = { G, playerDie, earn, showOver }; frameLoop.start();',
    );
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
    localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true }));
  });
});
test('one Second Wind per run restarts with half lives, then tally offers one Ember doubling', async ({
  page,
}, info) => {
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.evaluate(() => {
    const { G, playerDie, earn } = (window as any).__supportHarness;
    earn('boss');
    G.maxLives = 5;
    G.lives = 1;
    playerDie(null, 'wrong');
  });
  await expect(page.locator('.support-reward-dialog')).toContainText('Second Wind');
  await expect(page.locator('.support-reward-dialog')).toContainText(
    'Watch an ad to revive at half health.',
  );
  await page.screenshot({ path: info.outputPath('second-wind-scroll.png') });
  expect(
    await page
      .locator('.support-reward-dialog')
      .evaluate((el) => el.scrollWidth <= el.clientWidth && el.scrollHeight <= el.clientHeight),
  ).toBe(true);
  await page.getByRole('button', { name: 'Watch ad · Revive', exact: true }).click();
  await expect(page.locator('.support-reward-dialog')).toContainText('on the house');
  await expect(page.locator('.support-reward-dialog button')).toHaveCount(1);
  await page
    .locator('.support-reward-dialog')
    .getByRole('button', { name: 'Thanks', exact: true })
    .click();
  const restored = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).run,
  );
  expect(restored.lives).toBe(3);
  expect(restored.wave).toBe(1);
  expect(restored.reviveOfferResolved).toBe(true);
  expect(restored.secondWindUsed).toBe(true);
  await page.evaluate(() => {
    const { G, playerDie } = (window as any).__supportHarness;
    G.lives = 1;
    playerDie(null, 'wrong');
  });
  await expect(page.locator('#over')).toHaveClass(/on/);
  await expect(page.locator('.support-reward-dialog')).not.toBeVisible();
  await page.getByRole('button', { name: '2× Watch Ad', exact: true }).click();
  await page
    .locator('.support-reward-dialog')
    .getByRole('button', { name: 'Thanks', exact: true })
    .click();
  await expect(page.locator('#over')).toHaveClass(/on/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).embers)).toBe(
    25,
  );
  await page.reload();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).embers)).toBe(
    25,
  );
});
test('tester Premium doubles by default and acknowledges a revive', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem('issen.testerPremium', JSON.stringify({ campaign: 1 })),
  );
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.evaluate(() => {
    const { G, playerDie, earn } = (window as any).__supportHarness;
    earn('boss');
    G.lives = 1;
    playerDie(null, 'wrong');
  });
  await page.getByRole('button', { name: 'Revive', exact: true }).click();
  await expect(page.locator('.support-reward-dialog')).toContainText('complimentary');
  await page.getByRole('button', { name: 'Thanks', exact: true }).click();
  await page.evaluate(() => {
    const { G, playerDie } = (window as any).__supportHarness;
    G.lives = 1;
    playerDie(null, 'wrong');
  });
  await expect(page.locator('#over')).toHaveClass(/on/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).embers)).toBe(
    25,
  );
  await expect(page.locator('.support-reward-dialog')).not.toBeVisible();
});
