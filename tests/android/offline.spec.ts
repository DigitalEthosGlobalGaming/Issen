import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

const appVersion = JSON.parse(
  readFileSync(new URL('../../package.json', import.meta.url), 'utf8'),
).version;

test('Android assets cold-load with external networking blocked, including local fonts', async ({
  page,
}) => {
  const external: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/*', (route) => {
    if (new URL(route.request().url()).origin !== 'http://127.0.0.1:4175') {
      external.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('/');
  await expect(page.locator('#title')).toHaveClass(/on/);
  await expect(page.locator('.title-version').first()).toHaveText(`v${appVersion}`);
  expect(
    await page.evaluate(async () => {
      const loaded = await document.fonts.load('800 24px "Shippori Mincho B1"', 'Issen 一閃');
      return (
        loaded.length > 0 && document.fonts.check('800 24px "Shippori Mincho B1"', 'Issen 一閃')
      );
    }),
  ).toBe(true);
  await page.locator('#bArmory').tap();
  await expect(page.locator('#armory')).toHaveClass(/on/);
  await page.locator('#armory [data-back]').tap();
  await page.locator('#bPlay').tap();
  await page.locator('#bBegin').tap();
  await expect(page.locator('#hud')).toHaveClass(/on/);
  await page.locator('#pauseBtn').tap();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await page.setViewportSize({ width: 915, height: 412 });
  await expect(page.locator('#bResume')).toBeInViewport();
  const license = await page.request.get('/licenses/Shippori-Mincho-B1-OFL.txt');
  expect(license.ok()).toBe(true);
  expect(await license.text()).toContain('SIL OPEN FONT LICENSE');
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});

test('Android build retains validated encounter recovery after reload', async ({ page }) => {
  await page.goto('/');
  await page.locator('#bPlay').tap();
  await page.locator('#bBegin').tap();
  await page.locator('#pauseBtn').tap();
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await page.locator('#bResume').tap();
  await expect(page.locator('#hud')).toHaveClass(/on/);
});
