import { expect, test } from '@playwright/test';
test('support activation persists and tutorial lives in Options', async ({ page }) => {
  await page.goto('/');
  await page.locator('#bSupport').click();
  await expect(page.locator('#support')).toContainText('Premium is coming soon');
  await page.getByRole('button', { name: 'Activate tester Premium', exact: true }).click();
  await expect(page.locator('#supportMessage')).toContainText('complimentary');
  await page.reload();
  await page.locator('#bSupport').click();
  await expect(
    page.getByRole('button', { name: 'Tester Premium active', exact: true }),
  ).toBeDisabled();
  await page.locator('#support [data-back]').click();
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
  await expect(page.locator('.tutorial-overlay')).toBeVisible();
});
