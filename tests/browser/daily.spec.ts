import { expect, test } from '@playwright/test';

test('daily presets survive reload and keep player gear and progression unchanged', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-10-03T12:00:00Z'));
  await page.addInitScript(() => {
    localStorage.setItem('issen.unlocks', JSON.stringify(['beni', 'aka']));
    if (!localStorage.getItem('issen.equip'))
      localStorage.setItem(
        'issen.equip',
        JSON.stringify({
          blade: 'beni',
          robe: 'aka',
          charm: 'nocharm',
          fx: 'ink',
          film: 'mono',
          seal: 'verm',
          pet: 'nopet',
          crest: 'nocrest',
          bladeSp: false,
        }),
      );
  });
  await page.goto('/');
  await page.locator('#bPlay').click();
  await expect(page.locator('#dailyDate')).toHaveText('2026-10-03');
  await expect(page.locator('#dailyLoadout')).not.toBeEmpty();
  const before = await page.evaluate(() => ({
    equip: localStorage.getItem('issen.equip'),
    stats: localStorage.getItem('issen.stats'),
    meta: localStorage.getItem('issen.meta'),
  }));
  await page.locator('#bDaily').click();
  const checkpoint = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('issen.runCheckpoint')!),
  );
  expect(checkpoint.dailyDay).toBe('2026-10-03');
  expect(checkpoint.setup.upgrades).toBe(false);
  await page.clock.setFixedTime(new Date('2026-10-04T12:00:00Z'));
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await expect(page.locator('#pauseSeed')).toHaveText('Daily · 2026-10-03');
  await page.locator('#bEnd').click();
  await expect(page.locator('#over')).toHaveClass(/on/);
  await expect(page.locator('#overSeed')).toHaveText('Daily · 2026-10-03');
  await expect(page.locator('#bShare,#share')).toHaveCount(0);
  await page.locator('#bAgain').click();
  const retry = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.runCheckpoint')!));
  expect(retry.seed).toBe(checkpoint.seed);
  expect(retry.equipment).toEqual(checkpoint.equipment);
  expect(
    await page.evaluate(() => ({
      equip: localStorage.getItem('issen.equip'),
      stats: localStorage.getItem('issen.stats'),
      meta: localStorage.getItem('issen.meta'),
    })),
  ).toEqual(before);
  await page.keyboard.press('p');
  await page.locator('#bEnd').click();
  await page.locator('#bMenu').click();
  await page.locator('#bPlay').click();
  await expect(page.locator('#dailyDate')).toHaveText('2026-10-04');
  await page.locator('#bBegin').click();
  const ordinary = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('issen.runCheckpoint')!),
  );
  expect(ordinary.dailyDay).toBeUndefined();
  expect(ordinary.equipment.blade).toBe('beni');
  expect(ordinary.equipment.robe).toBe('aka');
});

test('AI disclosure is linked through privacy and absent from game menus', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('a[href*="ai-disclosure"]')).toHaveCount(0);
  await page.goto('/privacy/index.html');
  await page.getByRole('link', { name: 'AI disclosure' }).click();
  await expect(page).toHaveURL(/ai-disclosure/);
  await expect(page.locator('h1')).toContainText('AI');
});
