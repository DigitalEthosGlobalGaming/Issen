import { expect, test } from '@playwright/test';

test('Offerings has three cumulative ranks and persists the rare guarantee', async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 3, embers: 800 }));
  });
  await page.goto('/');
  await page.locator('#bTemplate').click();
  await page.locator('[data-upgrade="offerings"]').click();
  for (const price of [150, 250, 400])
    await page.getByRole('button', { name: `Donate ${price} Embers`, exact: true }).click();
  await expect(page.locator('.template-detail')).toContainText('1 guaranteed rare');
  await expect(page.locator('.template-detail')).toContainText('Offerings · 3/3');
  await expect(page.getByRole('button', { name: 'Fully donated' })).toBeDisabled();
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).upgrades.offerings),
  ).toBe(3);
});

test('Unlock all grants only Armoury ownership and preserves Temple, equipment and player saves', async ({
  page,
}) => {
  await page.goto('/');
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
  expect(result.meta).toBe(before.meta);
  expect(result.equip).toBe(before.equip);
  expect(result.player).toEqual(player);
  await page.reload();
  expect(
    await page.evaluate(
      () => JSON.parse(localStorage.getItem('issen.testing.meta')!).upgrades.awakening,
    ),
  ).toBe(0);
});
