import { expect, test } from '@playwright/test';

test('Temple browsing never spends and Throwing Knife upgrades its own capacity', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 2, tutorial: 'skipped', embers: 1000 }),
    ),
  );
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  await page.locator('#bTemplate').click();
  const balance = () => page.evaluate(() => JSON.parse(localStorage.getItem('issen.meta')!).embers);
  await expect(page.locator('.upgrade-tile')).toHaveCount(9);
  await expect(page.locator('[data-upgrade="pouch"]')).toHaveCount(0);
  for (const id of ['focus', 'recovery', 'knife'])
    await page.locator(`[data-upgrade="${id}"]`).click();
  expect(await balance()).toBe(1000);
  await page.locator('[data-upgrade="knife"]').click();
  await page.getByRole('button', { name: 'Donate 125 Embers', exact: true }).click();
  expect(await balance()).toBe(875);
  await expect(page.locator('.temple-status')).toHaveCount(0);
  await expect(page.locator('.temple-header h2')).toHaveText('Temple');
  await page.getByRole('button', { name: 'Donate 150 Embers', exact: true }).click();
  expect(await balance()).toBe(725);
  await expect(page.locator('.template-detail')).toContainText('Throwing Knife · 2/3');
  await page.getByRole('button', { name: 'Donate 250 Embers', exact: true }).click();
  expect(await balance()).toBe(475);
  await expect(page.locator('.template-detail')).toContainText(
    '3 throwing knives · refill every duel',
  );
  await expect(page.getByRole('button', { name: 'Fully donated', exact: true })).toHaveCount(0);
  await expect(page.locator('[data-upgrade="knife"]')).toHaveAttribute('aria-pressed', 'true');
});

test('Normal starts with two lives and upgrades Off retains purchases while separating records', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem(
        'issen.meta',
        JSON.stringify({
          schemaVersion: 2,
          tutorial: 'skipped',
          upgrades: { vitality: 3, knife: 1, pouch: 2, composure: 2 },
        }),
      );
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  await page.locator('#bPlay').click();
  await expect(page.locator('#setupLoadout')).not.toContainText('Normal lives:');
  await expect(page.locator('#setupLoadout')).toContainText('3 knives');
  await page.locator('[data-k="upgrades"] [data-v="0"]').click();
  await expect(page.locator('#setupLoadout')).toBeEmpty();
  await page.locator('#bBegin').click();
  await expect(page.locator('#lives i')).toHaveCount(2);
  await expect(page.locator('#badges')).toContainText('Upgrades off');
  await expect(page.locator('.badge.knives')).toHaveCount(0);
  await page.keyboard.press('p');
  await page.getByRole('button', { name: 'End run', exact: true }).click();
  await expect(page.locator('#oModifier')).toHaveText('Temple upgrades off');
  const saved = await page.evaluate(() => ({
    ranks: JSON.parse(localStorage.getItem('issen.meta')!).upgrades,
    records: Object.keys(JSON.parse(localStorage.getItem('issen.stats')!).rec),
  }));
  expect(saved.ranks).toMatchObject({ vitality: 3, knife: 3, composure: 2 });
  expect(saved.ranks.pouch).toBeUndefined();
  expect(saved.records).toEqual(['normal-base']);
  await page.reload();
  await page.locator('#bPlay').click();
  await expect(page.locator('[data-k="upgrades"] [data-v="0"]')).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await page.locator('[data-k="upgrades"] [data-v="1"]').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#lives i')).toHaveCount(5);
  await expect(page.locator('.badge.knives')).toHaveText('Knife ×3');
});

test('wave taps consume a knife only with a target and boss taps never consume one', async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('issen.testing', '1');
    localStorage.setItem(
      'issen.testing.meta',
      JSON.stringify({ schemaVersion: 2, tutorial: 'skipped', upgrades: { knife: 1, pouch: 2 } }),
    );
    Math.random = () => 0.5;
    let clock = 0,
      id = 0;
    const frames = new Map<number, FrameRequestCallback>();
    window.requestAnimationFrame = (callback) => {
      frames.set(++id, callback);
      return id;
    };
    window.cancelAnimationFrame = (key) => {
      frames.delete(key);
    };
    (window as any).advanceSet02 = (count: number) => {
      if (!clock) clock = performance.now();
      for (let i = 0; i < count; i++) {
        clock += 50;
        const callbacks = [...frames.values()];
        frames.clear();
        for (const callback of callbacks) callback(clock);
      }
    };
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  const tap = () =>
    page.evaluate(() => window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' })));
  const advance = (count: number) => page.evaluate((n) => (window as any).advanceSet02(n), count);
  await page.keyboard.press('Control+Shift+A');
  await page
    .getByRole('button', { name: 'Jump to wave', exact: true })
    .evaluate((el: HTMLElement) => el.click());
  await tap();
  await expect(page.locator('.badge.knives')).toHaveText('Knife ×3');
  // Initial spawn delay (0.3s) plus the 0.9s entry animation must finish first.
  await advance(32);
  await tap();
  await expect(page.locator('.badge.knives')).toHaveText('Knife ×2');
  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.testing.stats')!));
  expect(stats.kills).toBe(1);
  expect(stats.perfects).toBe(0);
  await page.keyboard.press('Control+Shift+A');
  await tap();
  await expect(page.locator('.badge.knives')).toHaveText('Knife ×2');
  await page
    .getByRole('button', { name: 'Jump to boss', exact: true })
    .evaluate((el: HTMLElement) => el.click());
  await expect(page.locator('#bossbar')).toHaveClass(/on/);
  await tap();
  await expect(page.locator('.badge.knives')).toHaveText('Knife ×3');
  await advance(77);
  await tap();
  await expect(page.locator('.badge.knives')).toHaveText('Knife ×3');
  await expect(page.locator('#bossHp .gone')).toHaveCount(0);
});
