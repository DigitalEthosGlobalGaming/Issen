import { expect, test } from '@playwright/test';

test('bundled sprite atlases load and classic/ink switching works offline', async ({
  page,
  context,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.locator('#bOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Display/ })
    .click();
  await page.getByLabel('Artwork', { exact: true }).selectOption('ink');
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
  expect(images).toHaveLength(10);
  expect(images.every((name) => name.includes('/assets/'))).toBe(true);
  await context.setOffline(true);
  await page.getByLabel('Artwork', { exact: true }).selectOption('classic');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'classic');
  await page.setViewportSize({ width: 1536, height: 864 });
  await page.getByLabel('Artwork', { exact: true }).selectOption('ink');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
  expect(errors).toEqual([]);
});
