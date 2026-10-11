import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';

test.beforeEach(async ({ page }) => {
  test.setTimeout(60000);
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__autoplay = { G: foundation.run.G, diagnostic: () => ({ G: foundation.run.G, guided: foundation.browser.guided.phase, sceneLoading: foundation.run.sceneState.sceneLoading, hitStop: foundation.run.sessionState.hitStop }) }; artworkReady = true;',
      ),
    });
  });
});

test('setup autoplay fights, stays paused, and can be switched off', async ({ page }, testInfo) => {
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/');
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await page.locator('#bPlay').click();
  const checkbox = page.getByRole('checkbox', { name: 'Autoplay' });
  await expect(checkbox).not.toBeChecked();
  await checkbox.check();
  await page.screenshot({ path: testInfo.outputPath('autoplay-setup.png') });
  await page.locator('#bBegin').click();
  await expect
    .poll(() => page.evaluate(() => (window as any).__autoplay.G.kills))
    .toBeGreaterThan(2);
  await page.locator('#pauseBtn').click();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  const before = await page.evaluate(() => JSON.stringify((window as any).__autoplay.G));
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => JSON.stringify((window as any).__autoplay.G))).toBe(before);
  await page.locator('#bResume').click();
  const kills = await page.evaluate(() => (window as any).__autoplay.G.kills);
  try {
    await expect
      .poll(() => page.evaluate(() => (window as any).__autoplay.G.kills), { timeout: 15000 })
      .toBeGreaterThan(kills);
  } catch (error) {
    await testInfo.attach('autoplay-state.json', {
      body: await page.evaluate(() => JSON.stringify((window as any).__autoplay.diagnostic())),
      contentType: 'application/json',
    });
    throw error;
  }
  await page.locator('#pauseBtn').click();
  await page.locator('#setupAutoplay').evaluate((input: HTMLInputElement) => {
    input.checked = false;
    input.dispatchEvent(new Event('change'));
  });
  expect(await page.evaluate(() => sessionStorage.getItem('issen.dev.autoplay'))).toBe('false');
});

for (const phase of ['boss', 'standoff', 'shrine']) {
  const fixture = JSON.parse(
    readFileSync(new URL(`../fixtures/runtime-refactor/${phase}.json`, import.meta.url), 'utf8'),
  );
  test(`autoplay completes restored ${phase} through normal inputs`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((checkpoint) => {
      localStorage.setItem('issen.runCheckpoint', JSON.stringify(checkpoint));
      localStorage.setItem('issen.meta', JSON.stringify(checkpoint.meta));
      sessionStorage.setItem('issen.dev.autoplay', 'true');
    }, fixture);
    await page.goto('/');
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
      timeout: 30000,
    });
    await expect(page.locator('#paused')).toHaveClass(/on/);
    await page.waitForTimeout(100);
    await expect(page.locator('#paused')).toHaveClass(/on/);
    const before = await page.evaluate(() => ({
      lives: (window as any).__autoplay.G.lives,
      parries: (window as any).__autoplay.G.parries,
      blessings: (window as any).__autoplay.G.bless.size,
    }));
    await page.locator('#bResume').click();
    if (phase === 'boss')
      await expect
        .poll(() => page.evaluate(() => (window as any).__autoplay.G.parries), { timeout: 15000 })
        .toBeGreaterThan(before.parries);
    else if (phase === 'shrine')
      await expect
        .poll(() => page.evaluate(() => (window as any).__autoplay.G.bless.size))
        .toBe(before.blessings + 1);
    else
      await expect
        .poll(() => page.evaluate(() => (window as any).__autoplay.G.so?.done), { timeout: 15000 })
        .toBe(true);
    expect(await page.evaluate(() => (window as any).__autoplay.G.lives)).toBe(before.lives);
    expect(errors).toEqual([]);
  });
}
