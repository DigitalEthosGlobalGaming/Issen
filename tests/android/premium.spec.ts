import { expect, test } from '@playwright/test';

test('web cannot unlock Premium through forged profile data', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.unlocks', JSON.stringify(['supporter-print']));
    localStorage.setItem('issen.equip', JSON.stringify({ film: 'supporter-print' }));
  });
  await page.goto('/');
  await expect(page.locator('#bSupport')).toBeHidden();
  await expect(page.locator('#premiumBadge')).toBeHidden();
  await page.locator('#bArmory').tap();
  await page.getByRole('tab', { name: /Film looks/ }).tap();
  await expect(page.getByRole('button', { name: /Supporter Print/ })).toHaveCount(0);
});

test('native closed-testing build hides all Premium UI and paid film', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { androidBridge: object }).androidBridge = {};
    localStorage.setItem('issen.unlocks', JSON.stringify(['supporter-print']));
    localStorage.setItem('issen.equip', JSON.stringify({ film: 'supporter-print' }));
  });
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().includes('revenuecat')) requests.push(request.url());
  });
  await page.goto('/');
  await expect(page.locator('#bSupport')).toBeHidden();
  await expect(page.locator('#support')).toBeHidden();
  await expect(page.locator('#premiumBadge')).toBeHidden();
  await page.locator('#bArmory').tap();
  await page.getByRole('tab', { name: /Film looks/ }).tap();
  await expect(page.getByRole('button', { name: /Supporter Print/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Monochrome', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  expect(requests).toEqual([]);
});
