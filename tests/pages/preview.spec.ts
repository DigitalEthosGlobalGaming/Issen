import { expect, test } from '@playwright/test';

test('branch build loads artwork, menus and standalone pages below its base path', async ({
  page,
}) => {
  const errors: string[] = [];
  const failed: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('response', (response) => {
    if (response.url().startsWith('http://127.0.0.1:4175') && !response.ok())
      failed.push(response.url());
  });
  await page.goto('./');
  await expect(page.locator('#title')).toHaveClass(/on/);
  await page.locator('#bArmory').click();
  await expect(page.locator('#armory')).toHaveClass(/on/);
  await page.locator('#armory [data-back]').click();
  for (const path of ['favicon.svg', 'privacy/', 'changelog/']) {
    expect((await page.request.get(path)).ok()).toBe(true);
  }
  const base = new URL(page.url()).pathname;
  const artwork = await page.evaluate(() =>
    performance
      .getEntriesByType('resource')
      .map((entry) => entry.name)
      .filter((name) => /atlas.*\.png/.test(name)),
  );
  expect(artwork.length).toBeGreaterThan(0);
  expect(artwork.every((url) => new URL(url).pathname.startsWith(base))).toBe(true);
  expect(errors).toEqual([]);
  expect(failed).toEqual([]);
});
