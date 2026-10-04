import { expect, test } from '@playwright/test';
test('Temple cancel leaves Embers intact and completed Awakening requires confirmed purchase', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({
        schemaVersion: 4,
        embers: 1000,
        upgrades: { awakening: 1 },
        tutorial: 'skipped',
      }),
    );
    localStorage.setItem(
      'issen.awakening',
      JSON.stringify({ version: 1, blades: { steel: { k: 10000 } }, robes: {} }),
    );
  });
  await page.goto('/');
  await page.locator('#bTemplate').click();
  await page.locator('[data-upgrade="focus"]').click();
  await page.getByRole('button', { name: 'Donate 75 Embers', exact: true }).click();
  await expect(page.locator('.confirm-action')).toContainText('925 Embers will remain');
  await page
    .locator('.confirm-action')
    .getByRole('button', { name: 'Cancel', exact: true })
    .click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).embers)).toBe(
    1000,
  );
  await page.locator('#template [data-back]').click();
  await page.locator('#bArmory').click();
  await page.locator('[data-form="awakened"]').click();
  await expect(page.locator('.confirm-action')).toContainText('850 Embers will remain');
  await page.getByRole('button', { name: 'Spend 150 Embers', exact: true }).click();
  await expect(page.locator('[data-form="awakened"]')).toHaveAttribute('aria-pressed', 'true');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).embers)).toBe(
    850,
  );
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('issen.unlocks')!).includes('steel+'),
    ),
  ).toBe(true);
});
