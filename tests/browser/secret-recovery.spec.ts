import { expect, test } from '@playwright/test';

test('title discoveries and the immediate cinematic companion survive continuing an older run', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
  });
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect
    .poll(() => page.evaluate(() => !!localStorage.getItem('issen.runCheckpoint')))
    .toBe(true);
  // A saved cinematic session returns to the title viewer while retaining the run.
  await page.evaluate(() =>
    sessionStorage.setItem(
      'issen.cinematic',
      JSON.stringify({ active: true, scene: 0, film: 'mono' }),
    ),
  );
  await page.reload();
  await expect(page.locator('#cinematic')).toBeVisible({ timeout: 60000 });
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await expect(page.locator('#title')).toHaveClass(/on/);
  for (const key of [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
  ])
    await page.keyboard.press(key);
  await page.locator('#title .t-k').click({ clickCount: 3 });
  await expect(page.locator('#cinematic')).toBeVisible();
  const profile = () =>
    page.evaluate(() => ({
      stats: JSON.parse(localStorage.getItem('issen.stats')!),
      unlocks: JSON.parse(localStorage.getItem('issen.unlocks')!),
    }));
  expect((await profile()).unlocks).toContain('mystic-rock');
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await page.locator('#bContinue').click();
  expect((await profile()).stats).toMatchObject({ konami: 1, cinematicVisits: 1 });
  expect((await profile()).unlocks).toContain('mystic-rock');
  await page.keyboard.press('p');
  await page.locator('#bEnd').click();
  expect((await profile()).unlocks).toContain('koken');
});

test('every actual duel entry refills the run capacity before writing its checkpoint', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.addInitScript(() =>
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, tutorial: 'skipped', upgrades: { knife: 3 } }),
    ),
  );
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'frameLoop.start();',
        'window.__duelAudit = { G, startBoss }; frameLoop.start();',
      ),
    });
  });
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  const result = await page.evaluate(() => {
    const { G, startBoss } = (window as any).__duelAudit;
    G.maxKnives = 3;
    G.knives = 0;
    startBoss();
    const first = G.knives;
    G.knives = 1;
    startBoss();
    return {
      first,
      second: G.knives,
      saved: JSON.parse(localStorage.getItem('issen.runCheckpoint')!).run.knives,
    };
  });
  expect(result).toEqual({ first: 3, second: 3, saved: 3 });
});
