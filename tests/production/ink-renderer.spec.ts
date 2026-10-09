import { expect, test } from '@playwright/test';

test('bundled sprite atlases remain available on offline resize', async ({ page, context }) => {
  const errors: string[] = [],
    requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  // Context requests include the scene worker, unlike window resource timing.
  context.on('request', (request) => requests.push(request.url()));
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/');
  await page.locator('#bOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Display/ })
    .click();
  const canvas = page.locator('#c');
  await expect(page.getByLabel('Artwork', { exact: true })).toHaveCount(0);
  await expect(canvas).toHaveAttribute('data-renderer-backend', 'layered');
  await page.locator('#options').getByRole('button', { name: 'Back', exact: true }).click();
  await page.locator('#options').getByRole('button', { name: 'Done', exact: true }).click();
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(canvas).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  for (const name of [
    'pine-atlas',
    'mountain-atlas',
    'field-banks-atlas',
    'shrubs-atlas',
    'field-rocks-atlas',
    'grass-edges-atlas',
    'meadow-patches-atlas',
    'fog-wisps-atlas',
    'foreground-boulders-atlas',
    'woodland-landmarks-atlas',
    'landmark-stones-atlas',
  ])
    expect(
      requests.some((url) => new URL(url).pathname.includes(`/assets/${name}-`)),
      name,
    ).toBe(true);
  const preparations = () =>
    page.evaluate(
      () =>
        performance
          .getEntriesByType('mark')
          .filter((entry) => entry.name.startsWith('issen:prepare-scene:')).length,
    );
  const before = await preparations();
  await context.setOffline(true);
  await page.setViewportSize({ width: 1536, height: 864 });
  await expect.poll(preparations).toBeGreaterThan(before);
  await expect(canvas).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await expect(page.getByLabel('Artwork', { exact: true })).toHaveCount(0);
  await expect(canvas).toHaveAttribute('data-renderer-backend', 'layered');
  expect(errors).toEqual([]);
});
