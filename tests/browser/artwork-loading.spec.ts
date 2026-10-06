import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';

const figures = JSON.parse(
  await readFile(
    new URL('../../src/rendering/generated/figures/manifest.json', import.meta.url),
    'utf8',
  ),
);
const companionPage = figures.pages[figures.sprites['companion.parts.0'].page].maps.colour;
const companionRoute = `**/rendering/generated/figures/${companionPage}`;

test.setTimeout(60000);

test('startup remains blocked until delayed artwork loads and decodes', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(companionRoute, async (route) => {
    await gate;
    await route.continue();
  });
  const requested = page.waitForRequest((request) =>
    request.url().includes(`/generated/figures/${companionPage}`),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: 'Preparing Issen' })).toBeVisible();
  await expect(page.locator('#app')).toHaveCount(1);
  await expect(page.locator('.startup-logo')).toBeVisible();
  expect(
    await page.locator('.startup-logo').evaluate((image: HTMLImageElement) => image.naturalWidth),
  ).toBe(600);
  await requested;
  await expect(page.locator('.startup-loading').getByRole('status')).toContainText(
    'Loading artwork',
  );
  release();
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('#app')).toHaveCount(1);
});

test('disposing while artwork is pending prevents a late game mount', async ({ page }) => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route(companionRoute, async (route) => {
    await gate;
    await route.continue();
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
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
  await page.route(companionRoute, (route) => (fail ? route.abort() : route.continue()));
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('button', { name: 'Retry loading' })).toBeVisible({ timeout: 30000 });
  await expect(page.locator('.startup-loading')).toBeVisible();
  await expect(page.locator('#c')).not.toHaveAttribute('data-scene-state', 'ready');
  fail = false;
  await page.getByRole('button', { name: 'Retry loading' }).click();
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('#app')).toHaveCount(1);
});
