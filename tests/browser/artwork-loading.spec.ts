import { test, expect } from '@playwright/test';

test.setTimeout(60000);

test('startup remains blocked until delayed artwork loads and decodes', async ({ page }) => {
  let blocked = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/player-ronin-atlas.webp', async (route) => {
    if (route.request().resourceType() === 'script') return route.continue();
    blocked++;
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => blocked).toBeGreaterThan(0);
  await expect(page.getByRole('heading', { name: 'Preparing Issen' })).toBeVisible();
  await expect(page.locator('#app')).toHaveCount(0);
  await expect(page.locator('.startup-logo')).toBeVisible();
  expect(
    await page.locator('.startup-logo').evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBe(600);
  await expect(page.getByRole('status')).toContainText('artwork images ready');
  release();
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('#app')).toHaveCount(1);
});

test('disposing while artwork is pending prevents a late game mount', async ({ page }) => {
  let blocked = 0;
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route('**/player-ronin-atlas.webp', async (route) => {
    if (route.request().resourceType() === 'script') return route.continue();
    blocked++;
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => blocked).toBeGreaterThan(0);
  await expect(page.locator('.startup-loading')).toBeVisible();
  await page.evaluate(async () => {
    const script = document.querySelector<HTMLScriptElement>(
      'script[type=module][src*="main.ts"]',
    )!;
    const entry = await import(/* @vite-ignore */ script.src);
    entry.dispose();
  });
  release();
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#app')).toHaveCount(0);
});

test('failed artwork offers retry and never starts missing assets', async ({ page }) => {
  let fail = true;
  let blocked = 0;
  await page.route('**/player-ronin-atlas.webp', (route) => {
    if (route.request().resourceType() === 'script') return route.continue();
    if (fail) {
      blocked++;
      return route.abort();
    }
    return route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect.poll(() => blocked).toBeGreaterThan(0);
  await expect(page.getByRole('button', { name: 'Retry loading' })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('#app')).toHaveCount(0);
  fail = false;
  await page.getByRole('button', { name: 'Retry loading' }).click();
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('#app')).toHaveCount(1);
});
