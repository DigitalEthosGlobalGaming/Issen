import { expect, test } from '@playwright/test';

// Remote web-font availability is covered separately from these UI checks.
test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('Premium stays hidden when its build toggle is off, even in a native shell', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { androidBridge: object }).androidBridge = {};
  });
  await page.goto('/');
  await expect(page.locator('#bSupport')).toBeHidden();
  await expect(page.locator('#support')).toBeHidden();
  await expect(page.locator('#premiumBadge')).toBeHidden();
});
