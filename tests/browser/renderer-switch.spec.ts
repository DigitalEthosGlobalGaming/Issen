import { expect, test } from '@playwright/test';

test('legacy classic preference loads Ink and exposes no artwork switch', async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'issen.settings',
      JSON.stringify({
        version: 1,
        renderer: 'classic',
        characterRenderer: 'classic',
        muted: true,
      }),
    ),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
  await page.locator('#bOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Display/ })
    .click();
  await expect(page.getByLabel('Artwork', { exact: true })).toHaveCount(0);
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
});
