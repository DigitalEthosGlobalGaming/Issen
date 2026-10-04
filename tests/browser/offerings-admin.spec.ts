import { expect, test } from '@playwright/test';

test('Offerings has three cumulative ranks and persists the rare guarantee', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 3, embers: 800 }));
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  await page.locator('#bTemplate').click();
  await page.locator('[data-upgrade="offerings"]').click();
  for (const price of [150, 250, 400]) {
    await page.getByRole('button', { name: `Donate ${price} Embers`, exact: true }).click();
    await page.getByRole('button', { name: `Yes -${price} Embers`, exact: true }).click();
  }
  await expect(page.locator('.template-detail')).toContainText('1 guaranteed rare');
  await expect(page.locator('.template-detail')).toContainText('Offerings · 3/3');
  await expect(page.getByRole('button', { name: 'Fully donated', exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#app')).toHaveCount(1);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).upgrades.offerings),
  ).toBe(3);
});

test('Unlock all grants Armoury and Endless access while preserving other ranks, equipment and player saves', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  const player = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('button', { name: 'Enter test profile', exact: true }).click();
  await expect(page.locator('#testBadge')).toBeVisible();
  await page.keyboard.press('Control+Shift+A');
  const before = await page.evaluate(() => ({
    meta: localStorage.getItem('issen.testing.meta'),
    equip: localStorage.getItem('issen.testing.equip'),
  }));
  await page.getByRole('button', { name: 'Unlock all', exact: true }).click();
  await page.getByRole('button', { name: 'Unlock all', exact: true }).click();
  const result = await page.evaluate(async () => {
    const itemsPath = '/src/game/content/items.ts',
      bladesPath = '/src/game/content/awakenings.ts',
      robesPath = '/src/game/content/robe-awakenings.ts';
    const { createItems } = await import(itemsPath),
      { SPECIAL } = await import(bladesPath),
      { ROBE_AWAKENINGS } = await import(robesPath);
    const owned: string[] = JSON.parse(localStorage.getItem('issen.testing.unlocks')!);
    const expected = [
      ...createItems(() => new Set(owned)).map((item: { id: string }) => item.id),
      ...Object.keys({ ...SPECIAL, ...ROBE_AWAKENINGS }).map((id) => id + '+'),
    ];
    return {
      complete: expected.every((id) => owned.includes(id)),
      unique: new Set(owned).size === owned.length,
      meta: localStorage.getItem('issen.testing.meta'),
      equip: localStorage.getItem('issen.testing.equip'),
      player: Object.fromEntries(
        Object.entries(localStorage).filter(([key]) => !key.startsWith('issen.testing.')),
      ),
    };
  });
  expect(result.complete).toBe(true);
  expect(result.unique).toBe(true);
  const originalMeta = JSON.parse(before.meta!);
  const updatedMeta = JSON.parse(result.meta!);
  expect(updatedMeta).toEqual({
    ...originalMeta,
    upgrades: { ...originalMeta.upgrades, vitality: Math.max(1, originalMeta.upgrades.vitality) },
  });
  expect(result.equip).toBe(before.equip);
  expect(result.player).toEqual(player);
  await page.reload();
  await expect(page.locator('#app')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('issen.testing.meta')!).upgrades.awakening,
    ),
  ).toBe(0);
  await page.locator('#bPlay').click();
  await expect(page.locator('[data-k="lives"] [data-v="zen"]')).toBeVisible();
});

test('admin unlocks Ronin only in the test profile and keeps it after reload', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, bossMilestone: 0 }));
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  const playerMeta = await page.evaluate(() => localStorage.getItem('issen.meta'));
  await page.keyboard.press('Control+Shift+A');
  await expect(page.getByRole('button', { name: 'Unlock Ronin mode' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Enter test profile', exact: true }).click();
  await expect(page.locator('#testBadge')).toBeVisible();
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('button', { name: 'Unlock Ronin mode', exact: true }).click();
  await expect(page.locator('.admin-status')).toContainText('mode milestone 2');
  const first = await page.evaluate(() => localStorage.getItem('issen.testing.meta'));
  expect(JSON.parse(first!).bossMilestone).toBe(2);
  await page.getByRole('button', { name: 'Unlock Ronin mode', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('issen.testing.meta'))).toBe(first);
  await page.locator('#admin [data-back]').click();
  await page.locator('#bPlay').click();
  await expect(page.locator('#setup [data-k="diff"] [data-v="ronin"]')).toBeVisible();
  await page.locator('#setup [data-k="diff"] [data-v="ronin"]').click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.setup')!).diff),
  ).toBe('ronin');
  await page.reload();
  await expect(page.locator('#app')).toHaveCount(1);
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('issen.testing.meta')!).bossMilestone,
    ),
  ).toBe(2);
  await page.evaluate(() => {
    const meta = JSON.parse(localStorage.getItem('issen.testing.meta')!);
    meta.bossMilestone = 3;
    localStorage.setItem('issen.testing.meta', JSON.stringify(meta));
  });
  await page.reload();
  await expect(page.locator('#app')).toHaveCount(1);
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('button', { name: 'Unlock Ronin mode', exact: true }).click();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('issen.testing.meta')!).bossMilestone,
    ),
  ).toBe(3);
  await page.getByRole('button', { name: 'Return to player profile', exact: true }).click();
  expect(await page.evaluate(() => localStorage.getItem('issen.meta'))).toBe(playerMeta);
  await page.locator('#bPlay').click();
  await expect(page.locator('#setup [data-k="diff"] [data-v="ronin"]')).toBeHidden();
});
