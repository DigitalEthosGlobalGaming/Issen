import { expect, test } from '@playwright/test';

for (const mode of ['waves', 'rush'] as const) {
  for (const diff of ['normal', 'ronin'] as const) {
    for (const lives of ['3', '0', 'zen'] as const) {
      test(`${mode}/${diff}/${lives} starts the intended encounter and records an ended run`, async ({
        page,
      }) => {
        const errors: string[] = [];
        page.on('pageerror', (error) => errors.push(error.message));
        await page.addInitScript(
          (setup) => localStorage.setItem('issen.setup', JSON.stringify(setup)),
          { mode, diff, lives, arrows: true },
        );
        await page.goto('/');
        await page.getByRole('button', { name: 'Draw your blade' }).click();
        await page.getByRole('button', { name: 'Begin', exact: true }).click();
        await expect(page.locator('#hud')).toHaveClass(/on/);
        await expect(page.locator('#lives i')).toHaveCount(lives === '3' ? 3 : 0);
        if (mode === 'rush') await expect(page.locator('#bossbar')).toHaveClass(/on/);
        else await expect(page.locator('#bossbar')).not.toHaveClass(/on/);
        if (diff === 'ronin') await expect(page.locator('#badges')).toContainText('浪人');
        if (lives === 'zen') await expect(page.locator('#score')).toHaveText('0 連');
        await page.keyboard.press('p');
        await page.getByRole('button', { name: 'End run', exact: true }).click();
        await expect(page.locator('#oReason')).toHaveText('You sheathed your blade.');
        const key =
          diff +
          (lives === 'zen' ? '-zen' : lives === '0' ? '-hard' : '') +
          (mode === 'rush' ? '-rush' : '');
        const records = await page.evaluate(
          () => JSON.parse(localStorage.getItem('issen.stats')!).rec,
        );
        expect(records[key].wave).toBe(1);
        expect(errors).toEqual([]);
      });
    }
  }
}

test('a missed attack in no-lives mode reaches death and restart', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() =>
    localStorage.setItem(
      'issen.setup',
      JSON.stringify({
        mode: 'waves',
        diff: 'normal',
        lives: '0',
        arrows: true,
      }),
    ),
  );
  await page.goto('/');
  await page.getByRole('button', { name: 'Draw your blade' }).click();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await expect(page.locator('#over')).toHaveClass(/on/, { timeout: 12000 });
  await expect(page.locator('#oReason')).toHaveText('Too slow. His blade found you first.');
  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!));
  expect(stats.deaths.late).toBe(1);
  await page.locator('#bAgain').click();
  await expect(page.locator('#hud')).toHaveClass(/on/);
  expect(errors).toEqual([]);
});
