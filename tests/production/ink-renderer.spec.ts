import { expect, test } from '@playwright/test';

test('bundled sprite atlases remain available on offline resize', async ({ page, context }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#bOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Display/ })
    .click();
  await expect(page.getByLabel('Artwork', { exact: true })).toHaveCount(0);
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
  const images = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) =>
        /bamboo-atlas|rocks-atlas|pine-atlas|mountain-atlas|field-banks-atlas|shrubs-atlas|grass-edges-atlas|meadow-patches-atlas|fog-wisps-atlas/.test(
          name,
        ),
      ),
  );
  expect(images.length).toBeGreaterThanOrEqual(10);
  expect(images.every((name) => name.includes('/assets/'))).toBe(true);
  await context.setOffline(true);
  await page.setViewportSize({ width: 1536, height: 864 });
  await expect(page.getByLabel('Artwork', { exact: true })).toHaveCount(0);
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
  expect(errors).toEqual([]);
});
