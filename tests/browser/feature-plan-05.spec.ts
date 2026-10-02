import { expect, test } from '@playwright/test';

test('Temple rank copy and owned Armoury conditions stay concise', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, tutorial: 'skipped', embers: 1000 }),
    );
    localStorage.setItem('issen.unlocks', JSON.stringify(['kuro', 'scarecrow']));
  });
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await page.locator('#bTemplate').click();
  const detail = page.locator('.template-detail');
  await expect(detail).toContainText('Next: 3 starting lives');
  await expect(detail).not.toContainText('Current:');
  await expect(detail).not.toContainText('equipment bonuses');
  await page.getByRole('button', { name: 'Donate 100 Embers' }).click();
  await expect(detail).toContainText('Current: 3 starting lives');
  await expect(detail).toContainText('Next: 4 starting lives');
  await page.getByRole('button', { name: 'Donate 200 Embers' }).click();
  await page.getByRole('button', { name: 'Donate 350 Embers' }).click();
  await expect(detail).toContainText('Current: 5 starting lives');
  await expect(detail).not.toContainText('Next:');
  await page.locator('#template [data-back]').click();
  await page.locator('#bArmory').click();
  await page.locator('#armTiles').getByRole('button', { name: 'Kurogane', exact: true }).click();
  await expect(page.locator('#armInfo')).toContainText('Unlocked: Win your first duel.');
  await expect(page.locator('#armInfo')).toContainText('+ Parry window 15% longer');
  await expect(page.locator('#armInfo')).toContainText('− Perfect arc 20% smaller');
  await page.getByRole('tab', { name: /^Outfits/ }).click();
  await page.locator('#armTiles').getByRole('button', { name: 'Scarecrow', exact: true }).click();
  await expect(page.locator('#armInfo')).toContainText(
    'Unlocked: Tap the title screen twenty times.',
  );
});

test('pause lists current blessings and keeps actions visible in short landscape', async ({
  page,
}) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'frameLoop.start();',
      'window.__pauseHarness = { G }; frameLoop.start();',
    );
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.setViewportSize({ width: 844, height: 390 });
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.keyboard.press('p');
  await expect(page.locator('#pauseBlessings')).toHaveText('No blessings yet');
  await page.locator('#bResume').click();
  await page.evaluate(() => {
    const ids = [
      'wind',
      'eye',
      'ward',
      'focus',
      'fortune',
      'edge',
      'calm',
      'momentum',
      'breath',
      'zanshin',
    ];
    for (const id of ids) (window as any).__pauseHarness.G.bless.add(id);
  });
  await page.keyboard.press('p');
  await expect(page.locator('.pause-blessing')).toHaveCount(10);
  await expect(page.locator('#pauseBlessings')).toContainText('Tailwind');
  await expect(page.locator('#pauseBlessings')).toContainText('Enemies strike 12% slower.');
  expect(
    await page.locator('#pauseBlessings').evaluate((el) => el.scrollHeight > el.clientHeight),
  ).toBe(true);
  await page.locator('#pauseBlessings').focus();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await expect(page.locator('#bResume')).toBeInViewport();
  await expect(page.locator('#bEnd')).toBeInViewport();
  await expect(page.locator('#paused')).toHaveCSS('opacity', '1');
  await page.screenshot({ path: test.info().outputPath('pause-panels-landscape.png') });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('#bResume')).toBeInViewport();
  await expect(page.locator('#bEnd')).toBeInViewport();
  await page.screenshot({ path: test.info().outputPath('pause-panels-portrait.png') });
});

test('item reveals match Armoury copy and cue once when each card appears', async ({ page }) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'frameLoop.start();',
      'window.__revealHarness = { runResults, ITEM_BY, itemPresentation, sfx }; frameLoop.start();',
    );
    await route.fulfill({ response, body });
  });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await page.evaluate(() => {
    const h = (window as any).__revealHarness;
    (window as any).__revealCues = 0;
    h.sfx.reveal = () => (window as any).__revealCues++;
    const reveal = (id: string) => {
      const item = h.ITEM_BY[id];
      const copy = h.itemPresentation(item);
      return {
        key: item.k,
        name: item.n,
        kind: item.type,
        description: copy.flavor,
        benefit: copy.benefit,
        tradeoff: copy.tradeoff,
        item: true,
      };
    };
    document.querySelector('#over')!.classList.add('on');
    h.runResults.startUnlocks([reveal('kuro'), reveal('beni')], () => {});
  });
  await expect(page.locator('#resultLabel')).toHaveText('Kurogane');
  await expect(page.locator('#resultDescription')).toHaveText('Black iron, bright edge.');
  await expect(page.locator('#resultBenefit')).toHaveText('+ Parry window 15% longer');
  await expect(page.locator('#resultTradeoff')).toHaveText('− Perfect arc 20% smaller');
  expect(await page.evaluate(() => (window as any).__revealCues)).toBe(1);
  await page.locator('#runResultSequence').click();
  await expect(page.locator('#resultLabel')).toHaveText('Beni');
  expect(await page.evaluate(() => (window as any).__revealCues)).toBe(2);
  await page.locator('#runResultSequence').click();
  expect(await page.evaluate(() => (window as any).__revealCues)).toBe(2);
});
