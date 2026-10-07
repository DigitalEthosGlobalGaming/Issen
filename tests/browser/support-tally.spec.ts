import { expect, test } from '@playwright/test';

test('a run with no Ember reward has no watch-ad offer', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-10-06T12:00:00+10:00'));
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.locator('#pauseBtn').click();
  await page.locator('#bEnd').click();
  await expect(page.locator('#resultEmbers')).toHaveText('0');
  await expect(page.getByRole('button', { name: /Watch Ad/ })).not.toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('issen.supportReward'))).toBeNull();
  await page.locator('#runResultSequence').click();
  await expect(page.locator('#overSummary')).toBeVisible();
});
test('Ember tally offers a separate Continue, and pending doubling survives reload', async ({
  page,
}, info) => {
  test.setTimeout(60000);
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__tally = {G,earn}; artworkReady = true;',
      ),
    });
  });
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.evaluate(() => {
    (window as any).__tally.earn('boss');
  });
  await page.locator('#pauseBtn').click();
  await page.locator('#bEnd').click();
  await expect(page.locator('#resultEmbers')).toHaveText('12');
  await expect(
    page.getByRole('button', { name: 'Watch Ad · 2x embers (+13)', exact: true }),
  ).toBeVisible();
  await expect(
    page.locator('.result-reward-actions').getByRole('button', { name: 'Continue', exact: true }),
  ).toBeVisible();
  await page.screenshot({ path: info.outputPath('ember-ad-choice.png') });
  await page.reload();
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(
    page.getByRole('button', { name: 'Watch Ad · 2x embers (+13)', exact: true }),
  ).toBeVisible();
  await page
    .locator('.result-reward-actions')
    .getByRole('button', { name: 'Continue', exact: true })
    .click();
  await expect(page.locator('#overSummary')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).embers)).toBe(
    12,
  );
  expect(await page.evaluate(() => localStorage.getItem('issen.supportReward'))).toBeNull();
});
