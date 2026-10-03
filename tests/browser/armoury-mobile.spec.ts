import { expect, test, type Page } from '@playwright/test';

test.setTimeout(60_000);

async function openCollection(page: Page, menuStyle = 'classic', textSize = 'normal') {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bArmory')).toBeVisible({ timeout: 30_000 });
  await page.evaluate(
    async ({ menuStyle, textSize }) => {
      const { createItems } = await import('/src/game/content/items.ts');
      const { SPECIAL } = await import('/src/game/content/awakenings.ts');
      const { ROBE_AWAKENINGS } = await import('/src/game/content/robe-awakenings.ts');
      const { defaultSettings } = await import('/src/platform/settings.ts');
      sessionStorage.setItem('issen.testing', '1');
      const unlocks = [
        ...createItems(() => new Set()).map((item: { id: string }) => item.id),
        ...Object.keys(SPECIAL).map((id) => id + '+'),
        ...Object.keys(ROBE_AWAKENINGS).map((id) => id + '+'),
        'steel++',
      ];
      localStorage.setItem('issen.testing.unlocks', JSON.stringify(unlocks));
      localStorage.setItem(
        'issen.testing.meta',
        JSON.stringify({
          schemaVersion: 4,
          tutorial: 'skipped',
          upgrades: { awakening: 2 },
        }),
      );
      localStorage.setItem(
        'issen.testing.equip',
        JSON.stringify({ blade: 'steel', bladeThird: true, pet: 'shiba' }),
      );
      localStorage.setItem(
        'issen.testing.settings',
        JSON.stringify({ ...defaultSettings(), menuStyle, textSize, reducedMotion: 'on' }),
      );
    },
    { menuStyle, textSize },
  );
  await page.reload();
  await page.locator('#bArmory').click();
  await expect(page.locator('#armory')).toHaveCSS('opacity', '1');
}

for (const menuStyle of ['classic', 'scroll']) {
  test(`full collection stays browsable on mobile with ${menuStyle} menus`, async ({
    page,
  }, info) => {
    await openCollection(page, menuStyle);
    for (const [name, viewport] of [
      ['portrait', { width: 390, height: 844 }],
      ['short', { width: 360, height: 640 }],
      ['landscape', { width: 844, height: 390 }],
    ] as const) {
      await page.setViewportSize(viewport);
      await expect(page.locator('[data-form="third"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#armInfo')).not.toContainText(
        /Tap again|Awakening: Active|Selected\./,
      );
      await expect(page.locator('#armInfo .fl')).toBeHidden();
      const geometry = await page.evaluate(() => {
        const tiles = document.querySelector('#armTiles')!;
        const bounds = tiles.getBoundingClientRect();
        const detailBounds = document.querySelector('.armTop')!.getBoundingClientRect();
        const tradeoff = document.querySelector('#armInfo .tr')!.getBoundingClientRect();
        return {
          visibleTiles: [...tiles.children].filter((tile) => {
            const box = tile.getBoundingClientRect();
            return box.top >= bounds.top && box.bottom <= bounds.bottom;
          }).length,
          fits: document.documentElement.scrollWidth <= innerWidth,
          tileHeight: bounds.height,
          effectVisible: tradeoff.top >= detailBounds.top && tradeoff.bottom <= detailBounds.bottom,
        };
      });
      await page.screenshot({ path: info.outputPath(`armoury-${menuStyle}-${name}.png`) });
      expect(geometry.fits).toBe(true);
      expect(geometry.effectVisible, name).toBe(true);
      expect(geometry.visibleTiles, `${name}: ${JSON.stringify(geometry)}`).toBeGreaterThanOrEqual(
        6,
      );
      expect(geometry.tileHeight).toBeGreaterThan(190);
    }
    // Details can grow without displacing the category bar or collection.
    await page.setViewportSize({ width: 360, height: 640 });
    await page.locator('#armInfo summary').click();
    await expect(page.locator('#armInfo .fl')).toBeVisible();
    await expect(page.locator('#armInfo .fl')).toBeInViewport();
    expect(await page.locator('#armTiles').evaluate((el) => el.clientHeight)).toBeGreaterThan(190);
    await page.locator('#armInfo summary').click();
    // Native scrolling exposes later categories without extra arrow controls.
    await expect(page.locator('[data-categories]')).toHaveCount(0);
    await page.locator('#armTabs').evaluate((el) => {
      el.scrollLeft = el.scrollWidth;
    });
    await page.getByRole('tab', { name: /^Seals/ }).click();
    await expect(page.getByRole('tab', { name: /^Seals/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const bar = await page.locator('.armCategories').boundingBox();
    await page.locator('#armTiles').evaluate((el) => {
      el.scrollTop = el.scrollHeight;
    });
    expect(await page.locator('.armCategories').boundingBox()).toEqual(bar);
    await page.locator('#armTabs').evaluate((el) => {
      el.scrollLeft = 0;
    });
  });
}

test('large text, keyboard form selection and collection scroll survive equipment updates', async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 360, height: 640 });
  await openCollection(page, 'scroll', 'large');
  await expect(page.locator('#armory [data-back]')).toBeVisible();
  await page.locator('[data-form="awakened"]').focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-form="awakened"]')).toBeFocused();
  await expect(page.locator('[data-form="awakened"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('Tab');
  await expect(page.locator('[data-form="third"]')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('[data-form="third"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#armTiles').evaluate((el) => {
    el.scrollTop = el.scrollHeight;
  });
  const finalTile = page.locator('#armTiles .tile').last();
  await finalTile.click();
  await expect(finalTile).toHaveAttribute('aria-pressed', 'true');
  expect(await page.locator('#armTiles').evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
  await page.locator('#armInfo summary').click();
  await expect(page.locator('#armInfo .fl')).toBeInViewport();
  expect(await page.locator('#armTiles').evaluate((el) => el.clientHeight)).toBeGreaterThan(140);
  await page.screenshot({ path: info.outputPath('armoury-large-text.png') });
});

test('unearned forms remain disabled and show their progress', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, upgrades: { awakening: 1 } }),
    );
  });
  await page.goto('/');
  await page.locator('#bArmory').click();
  await expect(page.locator('[data-form="awakened"]')).toBeDisabled();
  await expect(page.locator('.arm-challenge')).toContainText('Cut down 200 foes');
  await expect(page.locator('[data-form="third"]')).toHaveCount(0);
  await page.locator('#armTiles [data-item="steel"]').click();
  await page.locator('#armTiles [data-item="steel"]').click();
  await expect(page.locator('.awakening-active')).toHaveCount(0);
  await page.getByRole('tab', { name: /^Outfits/ }).click();
  await expect(page.locator('.arm-forms')).toHaveCount(0);
});

test('Details stays open across equipment and category changes', async ({ page }) => {
  await openCollection(page, 'scroll');
  await page.locator('#armInfo summary').click();
  await page.locator('[data-item="kuro"]').click();
  await expect(page.locator('.arm-details')).toHaveAttribute('open', '');
  await page.getByRole('tab', { name: /^Outfits/ }).click();
  await expect(page.locator('.arm-details')).toHaveAttribute('open', '');
  await page.locator('#armInfo summary').click();
  await page.locator('[data-item="hai"]').click();
  await expect(page.locator('.arm-details')).not.toHaveAttribute('open', '');
});
