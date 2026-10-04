import { expect, test } from '@playwright/test';
test('Temple opens slots; Armoury saves, renames, equips, updates and deletes presets', async ({
  page,
}, info) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta')) {
      localStorage.setItem(
        'issen.meta',
        JSON.stringify({ schemaVersion: 4, embers: 1000, tutorial: 'skipped' }),
      );
      localStorage.setItem('issen.unlocks', JSON.stringify(['steel', 'sumi', 'hai']));
    }
  });
  await page.goto('/');
  await page.locator('#bArmory').click();
  await page.locator('#armPresets').click();
  await expect(page.getByRole('button', { name: 'Save current loadout' })).not.toBeVisible();
  await page.getByRole('button', { name: 'Unlock in Temple' }).click();
  await expect(page.locator('.template-detail')).toContainText('Preset Slots');
  await page.getByRole('button', { name: 'Donate 100 Embers', exact: true }).click();
  await page.getByRole('button', { name: 'Yes -100 Embers', exact: true }).click();
  await page.locator('#template [data-back]').click();
  await page.locator('#armPresets').click();
  await page.getByRole('button', { name: 'Save current loadout' }).click();
  await expect(page.getByRole('button', { name: 'Save current loadout' })).toBeDisabled();
  await page.getByRole('textbox', { name: 'Name for preset 1' }).fill('My blade');
  await page.getByRole('textbox', { name: 'Name for preset 1' }).press('Tab');
  await page.locator('.preset-dialog').getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('tab', { name: /^Outfits/ }).click();
  await page.locator('[data-item="hai"]').click();
  await page.locator('#armPresets').click();
  await page.getByRole('button', { name: 'Equip', exact: true }).click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.equip')!).robe)).toBe(
    'sumi',
  );
  await page.locator('[data-item="hai"]').click();
  await page.locator('#armPresets').click();
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await page.locator('.confirm-action').getByRole('button', { name: 'Cancel' }).click();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.presets')!)[0].equipment.robe),
  ).toBe('sumi');
  await page.getByRole('button', { name: 'Update', exact: true }).click();
  await page.getByRole('button', { name: 'Replace', exact: true }).click();
  await page.screenshot({ path: info.outputPath('armoury-presets.png') });
  await page.reload();
  await page.locator('#bArmory').click();
  await page.locator('#armPresets').click();
  await expect(page.getByRole('textbox', { name: 'Name for preset 1' })).toHaveValue('My blade');
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.presets')!)[0].equipment.robe),
  ).toBe('hai');
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page.locator('.confirm-action').getByRole('button', { name: 'Cancel' }).click();
  await expect(page.getByRole('textbox', { name: 'Name for preset 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete', exact: true }).click();
  await page
    .locator('.confirm-action')
    .getByRole('button', { name: 'Delete', exact: true })
    .click();
  await expect(page.getByRole('button', { name: 'Save current loadout' })).toBeEnabled();
});
