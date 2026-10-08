import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'text/css' }),
  );
});

test('Profile Management downloads, previews, cancels and imports progression with a previous backup', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.stats'))
      localStorage.setItem('issen.stats', JSON.stringify({ kills: 25, bestScore: 100 }));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: /^Profile Management/ }).click();
  const download = page.waitForEvent('download');
  await page.locator('#bDownloadSave').click();
  expect((await download).suggestedFilename()).toMatch(/^issen-save.*\.json$/);
  const file = {
    name: 'save.json',
    mimeType: 'application/json',
    buffer: Buffer.from(
      JSON.stringify({
        format: 'issen-save',
        version: 1,
        data: { stats: { kills: 40, bestScore: 800 }, unlocks: ['beni'] },
      }),
    ),
  };
  await page.locator('#saveFile').setInputFiles(file);
  await expect(page.locator('#importSaveDialog')).toBeVisible();
  await expect(page.locator('#importSaveSummary')).toContainText('800');
  await page.locator('#bCancelImportSave').click();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!).kills)).toBe(
    25,
  );
  await page.locator('#saveFile').setInputFiles(file);
  await page.locator('#bConfirmImportSave').click();
  await expect(page.locator('#title')).toHaveClass(/on/, { timeout: 30000 });
  await expect
    .poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!).kills))
    .toBe(40);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.importBackup')!).stats.kills),
  ).toBe(25);
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: /^Profile Management/ }).click();
  await page
    .locator('#saveFile')
    .setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from('{bad') });
  await expect(page.locator('#saveTransferMessage')).toContainText('not readable JSON');
});

test('named profile creation, switching, rename and deletion preserve the original save', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.stats'))
      localStorage.setItem('issen.stats', JSON.stringify({ kills: 25 }));
  });
  const open = async () => {
    await page.locator('#bOptions').click();
    await page.getByRole('button', { name: /^Profile Management/ }).click();
  };
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await open();
  await page.locator('#profileName').fill('Wanderer');
  await page.locator('#bCreateProfile').click();
  await expect(page.locator('#title')).toHaveClass(/on/, { timeout: 30000 });
  await open();
  await expect(page.locator('#profileName')).toHaveValue('Wanderer');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!).kills)).toBe(
    25,
  );
  await page.locator('#profileName').fill('Ronin');
  await page.locator('#bRenameProfile').click();
  await expect(page.locator('#playerProfile option:checked')).toHaveText('Ronin');
  await page.locator('#bResetProfile').click();
  await page.locator('#bConfirmResetProfile').click();
  await expect(page.locator('#title')).toHaveClass(/on/, { timeout: 30000 });
  await open();
  await expect(page.locator('#playerProfile')).toHaveValue('default');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!).kills)).toBe(
    25,
  );
});
