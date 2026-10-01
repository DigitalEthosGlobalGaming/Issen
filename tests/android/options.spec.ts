import { expect, test } from '@playwright/test';

test('offline touch Options saves preferences and returns a paused run without resuming', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').tap();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Audio/ })
    .tap();
  await page.getByLabel('Master mute').tap();
  await page.locator('#options').getByRole('button', { name: 'Back', exact: true }).tap();
  await page.locator('#options').getByRole('button', { name: 'Done', exact: true }).tap();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#bPlay').tap();
  await page.locator('#bBegin').tap();
  await page.locator('#pauseBtn').tap();
  await page.locator('#bPauseOptions').tap();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Display/ })
    .tap();
  await page.getByLabel('Interface text', { exact: true }).selectOption('large');
  await page.getByLabel('Effects quality', { exact: true }).selectOption('low');
  await page.setViewportSize({ width: 915, height: 412 });
  await page.evaluate(() => window.dispatchEvent(new Event('issen:back')));
  await expect(
    page.locator('#options').getByRole('heading', { name: 'Options', exact: true }),
  ).toBeVisible();
  await page.evaluate(() => window.dispatchEvent(new Event('issen:back')));
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await expect(page.locator('#bResume')).toBeInViewport();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.settings')!).quality),
  ).toBe('low');
  expect(errors).toEqual([]);
});
