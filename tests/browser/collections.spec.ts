import { expect, test } from '@playwright/test';
test('mobile Temple exposes four collections and purchase opens zero-progress challenges', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, embers: 1000, tutorial: 'skipped' }),
    );
    localStorage.setItem(
      'issen.stats',
      JSON.stringify({ perfects: 1000, duels: 100, bestCombo: 100 }),
    );
  });
  await page.goto('/');
  await page.locator('#bTemplate').click();
  for (const id of ['weapons', 'outfits', 'blessings', 'curses']) {
    await expect(page.locator(`[data-upgrade="${id}"]`)).toBeVisible();
    await page.locator(`[data-upgrade="${id}"]`).click();
    await expect(page.locator('.template-detail')).not.toContainText('Next:');
    await expect(page.locator('.template-detail')).not.toContainText('Progress starts');
  }
  await page.locator('[data-upgrade="weapons"]').click();
  await expect(page.locator('.template-detail')).not.toContainText(
    'Sakura, Kodachi, Kage, Bokken, Yuki',
  );
  await page.getByRole('button', { name: 'Donate 100 Embers', exact: true }).click();
  await page.getByRole('button', { name: 'Yes -100 Embers', exact: true }).click();
  await expect(page.locator('[data-upgrade="weapons"]')).toContainText('Rank 1/3');
  await page.screenshot({ path: info.outputPath('temple-collections.png') });
  await page.locator('#template [data-back]').click();
  await page.locator('#bArmory').click();
  await page.locator('[data-item="kodachi"]').click();
  await expect(page.locator('#armInfo')).toContainText('Perfect cuts: 0/50');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('issen.collections')!).records.weapons1.perfects,
    ),
  ).toBe(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
