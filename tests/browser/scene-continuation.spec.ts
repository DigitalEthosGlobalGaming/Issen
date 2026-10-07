import { expect, test } from '@playwright/test';

test('held cinematic leave does not replace a continued encounter with title enemies', async ({
  page,
}) => {
  test.setTimeout(90000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const hook = `const held = []; window.__sceneContinuation = { G, loading: () => sceneLoading, pending: () => held.length,
      hold: () => { const compose = environmentRenderer.compose; environmentRenderer.compose = frame => compose(frame).then(ready => new Promise(resolve => held.push(() => resolve(ready)))); },
      release: () => { for (const action of held.splice(0)) action(); } }; artworkReady = true;`;
    await route.fulfill({
      response,
      body: (await response.text()).replace('artworkReady = true;', hook),
    });
  });

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
  await page.evaluate(() => (window as any).__sceneContinuation.hold());
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await page.locator('#bContinue').click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__sceneContinuation.pending()))
    .toBeGreaterThan(0);
  await page.evaluate(() => (window as any).__sceneContinuation.release());
  await expect
    .poll(() => page.evaluate(() => (window as any).__sceneContinuation.loading()))
    .toBe(false);
  expect(await page.evaluate(() => (window as any).__sceneContinuation.G.cfg)).not.toBeNull();

  expect((await profile()).stats).toMatchObject({ konami: 1, cinematicVisits: 1 });
  expect((await profile()).unlocks).toContain('mystic-rock');
  await page.keyboard.press('p');
  await page.locator('#bEnd').click();
  expect((await profile()).unlocks).toContain('koken');
  expect(errors).toEqual([]);
});
