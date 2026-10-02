import { expect, test } from '@playwright/test';

test('Temple panel frames load and keep selection separate from action buttons', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#bTemplate').click();
  const precision = page.locator('[data-upgrade="precision"]');
  const vitality = page.locator('[data-upgrade="vitality"]');
  await expect(precision).toHaveCSS('border-image-source', /panel-normal\.png/);
  await expect(vitality).toHaveCSS('border-image-source', /panel-highlighted\.png/);
  await precision.evaluate(async (element) => {
    const source = getComputedStyle(element).borderImageSource.slice(5, -2);
    const image = new Image();
    image.src = source;
    await image.decode();
    if (image.naturalWidth !== 192)
      throw new Error('Panel frame did not decode at its native size');
  });
  await precision.hover();
  await expect(precision).toHaveCSS('border-image-source', /panel-highlighted\.png/);
  await page.mouse.move(0, 0);
  await expect(precision).toHaveCSS('border-image-source', /panel-normal\.png/);
  await precision.click();
  await page.mouse.move(0, 0);
  await expect(precision).toHaveAttribute('aria-pressed', 'true');
  await expect(precision).toHaveCSS('border-image-source', /panel-highlighted\.png/);
  await expect(vitality).toHaveCSS('border-image-source', /panel-normal\.png/);
  await expect(page.locator('.upgrade-card')).toHaveCSS('border-image-source', /panel-normal\.png/);
  await expect(page.locator('.upgrade-card .btn')).toHaveCSS(
    'border-image-source',
    /button-normal\.png/,
  );
});

test('hover highlights menu buttons and previewable locked Armoury tiles', async ({ page }) => {
  await page.goto('/');
  const armory = page.locator('#bArmory');
  await expect(armory).toBeVisible();
  const normal = /button-normal\.png/;
  const highlighted = /button-highlighted\.png/;
  await expect(armory).toHaveCSS('border-image-source', normal);
  await armory.hover();
  await expect(armory).toHaveCSS('border-image-source', highlighted);
  await page.mouse.move(0, 0);
  await expect(armory).toHaveCSS('border-image-source', normal);

  await armory.click();
  const tile = page.locator('.tile.locked').first();
  await expect(tile).toBeEnabled();
  await expect(tile).toHaveCSS('border-image-source', normal);
  const opacity = await tile.evaluate((element) => getComputedStyle(element).opacity);
  await tile.hover();
  await expect(tile).toHaveCSS('border-image-source', highlighted);
  await expect(tile).toHaveCSS('opacity', opacity);
  await page.mouse.move(0, 0);
  await expect(tile).toHaveCSS('border-image-source', normal);

  await tile.click();
  await expect(tile).toHaveClass(/sel/);
  await page.mouse.move(0, 0);
  await expect(tile).toHaveCSS('border-image-source', highlighted);
});
