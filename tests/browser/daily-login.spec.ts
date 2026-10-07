import { expect, test } from '@playwright/test';

test('Armoury shows streak progress and seventh-day crest survives saved-run recovery', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.clock.setFixedTime(new Date('2026-10-04T12:00:00Z'));
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.dailyLogin')) {
      localStorage.setItem(
        'issen.dailyLogin',
        JSON.stringify({ lastDay: '2026-10-03', streak: 5, earned: false }),
      );
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
    }
  });
  await page.goto('/');
  await page.locator('#bArmory').click();
  await page.getByRole('tab', { name: /^Crests/ }).click();
  await page.locator('[data-item="seven-dawns"]').click();
  await expect(page.locator('#armInfo')).toContainText('Consecutive days: 6/7');
  await page.locator('#armory [data-back]').click();
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.locator('#pauseBtn').click();
  await page.clock.setFixedTime(new Date('2026-10-05T12:00:00Z'));
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/, { timeout: 30000 });
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('issen.unlocks')!).includes('seven-dawns'),
    ),
  ).toBe(true);
  await page.locator('#bEnd').click();
  await page.locator('#runResultSequence').click();
  // Advancing any normal result unlocks leaves the login grant untouched.
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('issen.dailyLogin')!).streak))
    .toBe(7);
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.dailyLogin')!).streak),
  ).toBe(7);
  await page.locator('#bArmory').click();
  await page.getByRole('tab', { name: /^Crests/ }).click();
  await page.locator('[data-item="seven-dawns"]').click();
  await expect(page.locator('#armInfo')).not.toContainText('Locked');
  await page.screenshot({ path: info.outputPath('seven-dawns-crest.png') });
});
