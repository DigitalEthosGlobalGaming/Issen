import { expect, test } from '@playwright/test';

// Remote web-font availability is covered separately from these UI checks.
test.beforeEach(async ({ page }) => {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
});

test('Free mobile keeps Support available without billing and shows Premium catalog requirements', async ({
  page,
}) => {
  await page.addInitScript(() => {
    (window as unknown as { androidBridge: object }).androidBridge = {};
  });
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /const edition = [^;]+;/,
      'const edition = "free";',
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await expect(page.locator('#bSupport')).toBeVisible();
  await expect(page.locator('#support')).not.toHaveClass(/on/);
  await expect(page.locator('#premiumBadge')).toBeHidden();
  await page.locator('#bArmory').click();
  await page.getByRole('tab', { name: /^Film looks/ }).click();
  await page.locator('#armTiles button').filter({ hasText: 'Supporter Print' }).click();
  await expect(page.locator('#armInfo')).toContainText('Requires Premium');
});
