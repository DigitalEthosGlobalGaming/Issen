import { expect, test } from '@playwright/test';

test('Jinbaori starts above five lives and retains its gear bonus with Temple upgrades off', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, tutorial: 'skipped', upgrades: { vitality: 3 } }),
    );
    localStorage.setItem('issen.unlocks', JSON.stringify(['steel', 'sumi', 'jinbaori']));
    localStorage.setItem('issen.equip', JSON.stringify({ robe: 'jinbaori' }));
  });
  await page.goto('/');
  await page.locator('#bPlay').click();
  await expect(page.locator('#setupLoadout')).toContainText('Normal lives: 7');
  await page.locator('#bBegin').click();
  await expect(page.locator('#lives i')).toHaveCount(7);
  await page.reload();
  await page.locator('#bPlay').click();
  await page.locator('[data-k="upgrades"] [data-v="0"]').click();
  await expect(page.locator('#setupLoadout')).toContainText('Normal lives: 4');
  await page.locator('#bBegin').click();
  await expect(page.locator('#lives i')).toHaveCount(4);
});

test('Yoroi shows its currency identity and no longer grants extra starting lives', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
    localStorage.setItem('issen.unlocks', JSON.stringify(['steel', 'sumi', 'yoroi', 'monk']));
    localStorage.setItem('issen.equip', JSON.stringify({ robe: 'yoroi' }));
  });
  await page.goto('/');
  await page.locator('#bArmory').click();
  await page.getByRole('tab', { name: /^Outfits/ }).click();
  await expect(page.locator('#armInfo')).toContainText('+10% Embers earned');
  await page.locator('#armory [data-back]').click();
  await page.locator('#bPlay').click();
  await expect(page.locator('#setupLoadout')).toContainText('Normal lives: 2');
  await page.locator('#bBegin').click();
  await expect(page.locator('#lives i')).toHaveCount(2);
});
