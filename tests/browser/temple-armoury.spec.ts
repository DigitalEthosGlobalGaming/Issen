import { expect, test } from '@playwright/test';

test('Temple keeps catalog order within unfinished and completed upgrades after a final donation', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({
        schemaVersion: 4,
        tutorial: 'skipped',
        embers: 1000,
        upgrades: { precision: 2, discernment: 1, vitality: 3 },
      }),
    ),
  );
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await page.locator('#bTemplate').click();
  const order = () =>
    page
      .locator('.upgrade-tile')
      .evaluateAll((tiles) => tiles.map((tile) => (tile as HTMLElement).dataset.upgrade));
  const remaining = ['focus', 'offerings', 'awakening', 'knife', 'composure', 'recovery'];
  expect(await order()).toEqual(['precision', ...remaining, 'discernment', 'vitality']);
  await page.locator('[data-upgrade="precision"]').click();
  await page.getByRole('button', { name: 'Donate 400 Embers', exact: true }).click();
  expect(await order()).toEqual([...remaining, 'precision', 'discernment', 'vitality']);
  await expect(page.locator('[data-upgrade="precision"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-upgrade="precision"]')).toHaveAttribute('data-state', 'max');
});

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
  await expect(page.locator('#bTemplate')).toHaveText('Temple');
  await page.locator('#bTemplate').click();
  await expect(page.locator('.temple-status')).toHaveCount(0);
  await expect(page.locator('[data-upgrade="focus"]')).toHaveAttribute('data-state', 'affordable');
  await expect(page.locator('[data-upgrade="awakening"]')).toHaveAttribute(
    'data-state',
    'unaffordable',
  );
  await expect(page.locator('[data-upgrade="focus"]')).toContainText('75 Embers');
  const colours = await page
    .locator('[data-upgrade="focus"], [data-upgrade="awakening"]')
    .evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).color));
  expect(new Set(colours).size).toBe(2);
  await page.locator('[data-upgrade="focus"]').click();
  await page.getByRole('button', { name: 'Donate 75 Embers', exact: true }).click();
  await expect(page.locator('[data-upgrade="focus"]')).toHaveAttribute(
    'data-state',
    'unaffordable',
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
  await expect(page.locator('#bTemplate')).toHaveText('Temple');
  await page.locator('#bTemplate').click();
  await expect(page.locator('.temple-status')).toHaveCount(0);
  await expect(page.locator('#templateContent')).not.toContainText('Fully donated');
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
