import { expect, test } from '@playwright/test';

for (const memory of [2, 8])
  test(`responsive player inspection preserves canvas and selection at deviceMemory ${memory}`, async ({
    page,
  }, info) => {
    await page.addInitScript(
      (memory) =>
        Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: memory }),
      memory,
    );
    await page.route('https://fonts.googleapis.com/**', (route) =>
      route.fulfill({ body: '', contentType: 'text/css' }),
    );
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('#bArmory').click();
    await page.locator('#armInfo summary').click();
    await expect(page.locator('#armInfo details')).toHaveAttribute('open', '');
    const before = await page.locator('#prevC').boundingBox();
    expect(before!.height).toBeGreaterThan(200);
    await page.locator('#prevC').click();
    const dialog = page.getByRole('dialog', { name: 'Equipment inspection' });
    await expect(dialog).toBeVisible();
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'occluded');
    await expect(page.locator('#c')).toHaveJSProperty('width', 1);
    expect(await page.locator('#prevC').evaluate((c) => c.parentElement!.className)).toBe(
      'arm-inspection',
    );
    const expanded = await page.locator('#prevC').boundingBox();
    expect(expanded!.width).toBe(390);
    expect(expanded!.height).toBe(844);
    await page.waitForTimeout(150);
    await page.screenshot({ path: info.outputPath('inspection-portrait.png') });
    await page.setViewportSize({ width: 844, height: 390 });
    await expect.poll(async () => (await page.locator('#prevC').boundingBox())!.height).toBe(390);
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'occluded');
    await page.screenshot({ path: info.outputPath('inspection-landscape.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible();
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
      timeout: 30000,
    });
    await expect(page.locator('#armory')).toHaveClass(/on/);
    await expect(page.locator('#armInfo details')).toHaveAttribute('open', '');
    await expect(page.locator('#prevC')).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(dialog).toBeVisible();
    await page.goBack();
    await expect(dialog).not.toBeVisible();
    await page.setViewportSize({ width: 1440, height: 900 });
    await expect(page.locator('#prevC')).toHaveJSProperty(
      'width',
      Math.round((await page.locator('#prevC').boundingBox())!.width),
    );
    await page.screenshot({ path: info.outputPath('armoury-desktop.png') });
    await page.locator('#prevC').click();
    await expect(dialog).toBeVisible();
    await page.screenshot({ path: info.outputPath('inspection-desktop.png') });
    await page.getByRole('button', { name: 'Close inspection' }).click();
    await expect(page.locator('.prev #prevC')).toBeVisible();
    await page.locator('#armory [data-back]').click();
    await expect(page.locator('#prevC')).toHaveJSProperty('width', 1);
    await page.locator('#bArmory').click();
    await expect
      .poll(() =>
        page.locator('#prevC').evaluate((canvas) => (canvas as HTMLCanvasElement).width > 1),
      )
      .toBe(true);
    await expect(page.locator('#armory')).toHaveClass(/on/);
  });
