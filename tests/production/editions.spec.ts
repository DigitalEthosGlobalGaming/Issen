import { expect, test } from '@playwright/test';

test('compiled edition gates, mastery selection and favicon match build configuration', async ({
  page,
}) => {
  const edition = process.env.ISSEN_TEST_EDITION ?? 'web';
  const access = edition !== 'free';
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({
        schemaVersion: 4,
        embers: 2000,
        bossMilestone: 3,
        revealSeen: 3,
        tutorial: 'completed',
      }),
    );
    localStorage.setItem('issen.stats', JSON.stringify({ roninWave: 10, kills: 1000 }));
    localStorage.setItem('issen.unlocks', JSON.stringify(['falling-leaves']));
  });
  await page.goto('/');
  const badge = page.locator('#premiumBadge');
  if (access) await expect(badge).toHaveText(edition === 'web' ? 'Web' : 'Premium');
  else await expect(badge).toBeHidden();
  await page.locator('#bTemplate').click();
  await page.locator('[data-upgrade="precision"]').click();
  const purchase = page.locator('.template-detail button');
  if (access) {
    await expect(purchase).toHaveText('Donate 150 Embers');
    await expect(purchase).toBeEnabled();
  } else {
    await expect(purchase).toHaveText('Requires Premium');
    await expect(purchase).toBeDisabled();
  }
  await page.locator('#template [data-back]').click();
  await page.locator('#bArmory').click();
  await page.getByRole('tab', { name: /^Kill effects/ }).click();
  await page.locator('#armTiles button').filter({ hasText: 'Falling Leaves' }).click();
  await expect(page.locator('#armInfo')).toContainText(access ? 'Equipped' : 'Requires Premium');
  await page.locator('#armory [data-back]').click();
  await page.locator('#bTrials').click();
  await expect(page.locator('[data-trial="duel-master"]')).toBeEnabled({ enabled: access });
  const icon = await page.locator('link[rel="icon"]').getAttribute('href');
  expect(icon).toContain('favicon.svg');
  const response = await page.request.get(icon!, { maxRetries: 2 });
  expect(response.ok()).toBe(true);
  expect(await response.text()).toContain('<svg');
  expect(errors).toEqual([]);
});
