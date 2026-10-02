import { expect, test } from '@playwright/test';

test('Temple identifies affordable donations and refreshes the title after purchase', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, tutorial: 'skipped', embers: 100 }),
    ),
  );
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await expect(page.locator('#bTemplate')).toHaveText('Temple · 2 ready');
  await page.locator('#bTemplate').click();
  await expect(page.locator('.temple-status')).toHaveText('2 upgrades ready to donate.');
  await expect(page.locator('[data-upgrade="focus"]')).toContainText('Ready · 75 Embers');
  await page.locator('[data-upgrade="focus"]').click();
  await page.getByRole('button', { name: 'Donate 75 Embers', exact: true }).click();
  await expect(page.locator('.temple-status')).toHaveText(
    'Save more Embers for your next upgrade.',
  );
  await page.locator('#template [data-back]').click();
  await expect(page.locator('#bTemplate')).toHaveText('Temple');
});

test('fully donated Temple and room preview remain readable without selection shifts', async ({
  page,
}, info) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({
        schemaVersion: 4,
        tutorial: 'skipped',
        upgrades: {
          precision: 3,
          discernment: 1,
          vitality: 3,
          focus: 3,
          offerings: 3,
          awakening: 2,
          knife: 3,
          composure: 2,
          recovery: 2,
        },
      }),
    ),
  );
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await expect(page.locator('#bTemplate')).toHaveText('Temple · Complete');
  await page.locator('#bTemplate').click();
  await expect(page.locator('.temple-status')).toHaveText('All available upgrades fully donated.');
  await expect(page.locator('[data-state="max"].upgrade-tile')).toHaveCount(9);
  await page.locator('#template [data-back]').click();
  await page.locator('#bArmory').click();
  const tabs = page.getByRole('tab');
  const before = await tabs.evaluateAll((nodes) =>
    nodes.map((n) => n.getBoundingClientRect().width),
  );
  await page.getByRole('tab', { name: /^Outfits/ }).click();
  const after = await tabs.evaluateAll((nodes) =>
    nodes.map((n) => n.getBoundingClientRect().width),
  );
  expect(after).toEqual(before);
  expect(
    await tabs.evaluateAll((nodes) => nodes.map((n) => getComputedStyle(n).fontWeight)),
  ).toEqual(before.map(() => '400'));
  await expect(page.locator('#armory')).toHaveCSS('opacity', '1');
  for (const [name, viewport] of [
    ['portrait', { width: 390, height: 844 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await expect(page.locator('#prevC')).toBeVisible();
    await page.screenshot({ path: info.outputPath(`armoury-${name}.png`) });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
  }
});
