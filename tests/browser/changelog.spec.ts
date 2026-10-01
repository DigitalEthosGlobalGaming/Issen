import { test, expect } from '@playwright/test';

test('updates highlight the changelog until the release notes are opened', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.releaseNotice')) {
      localStorage.setItem(
        'issen.releaseNotice',
        JSON.stringify({ opened: 'v1.0.0', unread: false }),
      );
    }
  });
  await page.goto('/');
  const link = page.locator('#changelogLink');
  await expect(link).toBeVisible({ timeout: 30000 });
  await expect(link).toHaveClass('has-update');
  await page.reload();
  await expect(link).toHaveClass('has-update', { timeout: 30000 });
  const popupPromise = page.waitForEvent('popup');
  await link.click();
  const popup = await popupPromise;
  await expect(popup.getByRole('heading', { name: 'Changelog', exact: true })).toBeVisible();
  await expect(link).not.toHaveClass('has-update');
  await page.reload();
  await expect(link).toBeVisible({ timeout: 30000 });
  await expect(link).not.toHaveClass('has-update');
});
