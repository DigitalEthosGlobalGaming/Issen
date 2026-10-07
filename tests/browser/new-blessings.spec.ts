import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'artworkReady = true;',
      'window.__blessingHarness = { G, ST, BLESS_BY, showShrineOffers, captureCheckpoint, playerDie, renderLives, updateWave, fx: presentationState.fx, frameLoop }; artworkReady = true;',
    );
    await route.fulfill({ response, body });
  });
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
});

test('an Oath ward outlines lives, survives reload and is spent before life', async ({ page }) => {
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.evaluate(() => {
    const { G, captureCheckpoint, renderLives } = (window as any).__blessingHarness;
    G.bless.add('oath');
    G.blessingTriggers.precisionWard = true;
    renderLives();
    captureCheckpoint();
  });
  await expect(page.locator('#lives')).toHaveClass(/warded/);
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await expect(page.locator('#lives')).toHaveClass(/warded/);
  await page.locator('#bResume').click();
  const before = await page.evaluate(() => (window as any).__blessingHarness.G.lives);
  await page.evaluate(() => (window as any).__blessingHarness.playerDie(null, 'wrong'));
  await expect(page.locator('#lives')).not.toHaveClass(/warded/);
  expect(await page.evaluate(() => (window as any).__blessingHarness.G.lives)).toBe(before);
});

test('Crossroads immediately adds a curse and expands the next Shrine', async ({ page }) => {
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.evaluate(() => {
    const { G, BLESS_BY, showShrineOffers, frameLoop } = (window as any).__blessingHarness;
    frameLoop.stop();
    G.state = 'shrine';
    showShrineOffers([BLESS_BY.crossroads]);
  });
  await page.locator('#blessList button').click();
  const result = await page.evaluate(() => {
    const { G, ST, BLESS_BY } = (window as any).__blessingHarness;
    return {
      crossroads: G.bless.has('crossroads'),
      curses: [...G.bless].filter((id) => BLESS_BY[id]?.t === 2),
      offerCount: G.m.shrineN,
      recorded: ST.curses,
    };
  });
  expect(result.crossroads).toBe(true);
  expect(result.curses).toHaveLength(1);
  expect(result.offerCount).toBe(5);
  expect(result.recorded).toBe(1);
});

test('Stormcall kills the next attacker with lightning and cannot charge itself', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await expect
    .poll(() => page.evaluate(() => (window as any).__blessingHarness.G.enemies.length))
    .toBeGreaterThan(0);
  const result = await page.evaluate(() => {
    const { G, updateWave, fx, frameLoop } = (window as any).__blessingHarness;
    frameLoop.stop();
    G.bless.add('stormcall');
    G.blessingTriggers.stormCharged = true;
    G.gapT = 0;
    G.pendingSpawns = [];
    G.toSpawn = 0;
    G.attacker = null;
    for (const enemy of G.enemies) enemy.state = 'idle';
    const before = G.kills;
    updateWave(0.016);
    return {
      kills: G.kills - before,
      charged: G.blessingTriggers.stormCharged,
      bolts: fx.bolts.length,
    };
  });
  expect(result).toEqual({ kills: 1, charged: false, bolts: 1 });
});
