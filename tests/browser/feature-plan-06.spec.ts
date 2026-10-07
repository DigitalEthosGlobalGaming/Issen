import { expect, test } from '@playwright/test';

test('an ordinary wave resumes from its saved seed and End run closes the checkpoint', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  const first = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.runCheckpoint')!));
  expect(first.status).toBe('active');
  expect(first.run.state).toBe('playing');
  expect(first.run.wave).toBe(1);
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await expect(page.locator('#title')).not.toHaveClass(/on/);
  await expect(page.locator('#pauseSeed')).toContainText(String(first.seed));
  await expect(page.locator('#waveLbl')).toHaveText('第一陣');
  await page.locator('#bResume').click();
  await expect(page.locator('#c')).toBeVisible();
  await page.keyboard.press('p');
  await expect(page.locator('#pauseSeed')).toContainText(String(first.seed));
  await page.locator('#bEnd').click();
  await expect(page.locator('#overSeed')).toContainText(String(first.seed));
  expect(await page.evaluate(() => localStorage.getItem('issen.runCheckpoint'))).toBeNull();
  await page.reload();
  await expect(page.locator('#bContinue')).toBeHidden();
});

test('Steel explicitly selects base, first and third forms and preserves selection on reload', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, tutorial: 'skipped', upgrades: { awakening: 1 } }),
    );
    localStorage.setItem('issen.unlocks', JSON.stringify(['steel+', 'steel++']));
  });
  await page.goto('/');
  await page.locator('#bArmory').click();
  const steel = page.locator('#armTiles').getByRole('button', { name: 'Tamahagane', exact: true });
  await steel.click();
  await page.locator('[data-form="awakened"]').click();
  await expect(page.locator('[data-form="awakened"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#armInfo .awakening-active')).toContainText('Score ×1.15');
  await page.locator('[data-form="third"]').click();
  await expect(page.locator('[data-form="third"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#armInfo .awakening-active .pk')).toHaveCount(2);
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.equip')!).bladeThird),
  ).toBe(true);
  await page.reload();
  await page.locator('#bArmory').click();
  await expect(page.locator('[data-form="third"]')).toHaveAttribute('aria-pressed', 'true');
  await steel.click();
  await expect(page.locator('[data-form="third"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-form="normal"]').click();
  await expect(page.locator('.awakening-active')).toHaveCount(0);
  expect(
    await page.evaluate(() => {
      const equipment = JSON.parse(localStorage.getItem('issen.equip')!);
      return { bladeSp: equipment.bladeSp, bladeThird: equipment.bladeThird };
    }),
  ).toEqual({ bladeSp: false, bladeThird: false });
});

test('a fatal loss is terminal before its animation and settles once after reload', async ({
  page,
}) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'artworkReady = true;',
      'window.__runHarness = { G, playerDie, openShrine }; artworkReady = true;',
    );
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.evaluate(() => {
    const { G, playerDie } = (window as any).__runHarness;
    G.lives = 1;
    playerDie(null, 'wrong');
  });
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).status),
  ).toBe('lost');
  await page.reload();
  await page.getByRole('button', { name: 'No thanks', exact: true }).click();
  await expect(page.locator('#over')).toHaveClass(/on/);
  await expect(page.locator('#bContinue')).toBeHidden();
  const deaths = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.stats')!).deaths.wrong,
  );
  expect(deaths).toBe(1);
  await page.reload();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!).deaths.wrong),
  ).toBe(1);
});

test('Shrine offers survive reload without a new roll', async ({ page }) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'artworkReady = true;',
      'window.__runHarness = { G, openShrine }; artworkReady = true;',
    );
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.evaluate(() => (window as any).__runHarness.openShrine());
  const before = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).offers,
  );
  expect(before.length).toBeGreaterThan(0);
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await page.locator('#bResume').click();
  await expect(page.locator('#shrine')).toHaveClass(/on/);
  const after = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).offers,
  );
  expect(after).toEqual(before);
});

test('boss and standoff checkpoints restore their encounter phases', async ({ page }) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'artworkReady = true;',
      'window.__runHarness = { G, startBoss, startStandoff }; artworkReady = true;',
    );
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.evaluate(() => (window as any).__runHarness.startBoss());
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).run.state),
  ).toBe('boss');
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await page.locator('#bResume').click();
  await expect(page.locator('#bossbar')).toHaveClass(/on/);
  await page.evaluate(() => {
    const { G, startStandoff } = (window as any).__runHarness;
    G.boss = null;
    startStandoff(4, false);
  });
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.runCheckpoint')!).run.state),
  ).toBe('standoff');
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await page.locator('#bResume').click();
  await expect(page.locator('#waveLbl')).toHaveText('挑');
});
