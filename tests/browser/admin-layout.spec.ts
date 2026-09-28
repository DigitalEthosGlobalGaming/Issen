import { expect, test } from '@playwright/test';

async function enterTestTools(page: import('@playwright/test').Page) {
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('button', { name: 'Enter test profile', exact: true }).click();
  await expect(page.locator('#testBadge')).toBeVisible();
  await page.keyboard.press('Control+Shift+A');
  await expect(page.locator('#admin')).toHaveClass(/on/);
}

test('Trials access is editable in the isolated profile and controls the title entry', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, bossMilestone: 0 }));
  });
  await page.goto('/');
  const playerMeta = await page.evaluate(() => localStorage.getItem('issen.meta'));
  await enterTestTools(page);
  const trials = page.getByRole('checkbox', { name: 'Trials unlocked' });
  await expect(trials).not.toBeChecked();
  await trials.check();
  expect(
    await page.evaluate(() => ({
      wave: JSON.parse(localStorage.getItem('issen.testing.stats')!).roninWave,
      milestone: JSON.parse(localStorage.getItem('issen.testing.meta')!).bossMilestone,
    })),
  ).toEqual({ wave: 10, milestone: 2 });
  await page.locator('#admin [data-back]').click();
  await expect(page.locator('#bTrials')).toBeVisible();
  await page.locator('#bTrials').click();
  await expect(page.locator('[data-trial]')).toHaveCount(6);
  await page.locator('#trials [data-back]').click();
  await page.reload();
  await expect(page.locator('#bTrials')).toBeVisible();
  await page.keyboard.press('Control+Shift+A');
  await expect(trials).toBeChecked();
  await trials.uncheck();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.stats')!).roninWave),
  ).toBe(0);
  await page.locator('#admin [data-back]').click();
  await expect(page.locator('#bTrials')).toBeHidden();
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('button', { name: 'Return to player profile', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('issen.meta'))).toBe(playerMeta);
});

test('grouped controls remain reachable and reflect saved values', async ({ page }) => {
  await page.goto('/');
  await enterTestTools(page);
  for (const title of [
    'Profile',
    'Modes & Trials',
    'Encounter',
    'Armoury & Awakenings',
    'Temple',
    'Onboarding',
  ])
    await expect(page.locator('.admin-group h3', { hasText: title })).toBeVisible();
  await page.getByLabel('Mode access').selectOption('2');
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('issen.testing.meta')!).bossMilestone,
    ),
  ).toBe(2);
  const enabled = page.getByRole('checkbox', { name: 'Permanent upgrades next run' });
  await enabled.uncheck();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.setup')!).upgrades),
  ).toBe(false);
  await page.getByLabel('Permanent upgrade', { exact: true }).selectOption('awakening');
  await page.getByLabel('Upgrade rank').fill('2');
  await page.getByRole('button', { name: 'Set upgrade rank' }).click();
  await page.getByLabel('Permanent upgrade', { exact: true }).selectOption('vitality');
  await page.getByLabel('Permanent upgrade', { exact: true }).selectOption('awakening');
  await expect(page.getByLabel('Upgrade rank')).toHaveValue('2');
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await page.locator('#admin [data-back]').scrollIntoViewIfNeeded();
    await expect(page.locator('#admin [data-back]')).toBeInViewport();
  }
});
