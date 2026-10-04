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
test('one revive per death restarts with half lives, then one Ember doubling settles', async ({
  page,
}) => {
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
  await page.getByRole('button', { name: 'Watch ad · Revive', exact: true }).click();
  await expect(page.locator('.support-reward-dialog')).toContainText('on the house');
  await page
    .locator('.support-reward-dialog')
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  const restored = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).run,
  );
  expect(restored.lives).toBe(3);
  expect(restored.wave).toBe(1);
  expect(restored.reviveOfferResolved).toBe(true);
  await page.locator('#pauseBtn').click();
  await page.locator('#bEnd').click();
  await page.getByRole('button', { name: 'Watch ad · Double Embers', exact: true }).click();
  await page
    .locator('.support-reward-dialog')
    .getByRole('button', { name: 'Continue', exact: true })
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
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  await expect(page.locator('#over')).toHaveClass(/on/);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).embers)).toBe(
    25,
  );
  await expect(page.locator('.support-reward-dialog')).not.toBeVisible();
});
