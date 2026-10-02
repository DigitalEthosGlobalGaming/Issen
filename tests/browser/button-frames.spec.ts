import { expect, test } from '@playwright/test';

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
