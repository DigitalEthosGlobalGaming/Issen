import { expect, test } from '@playwright/test';

test('Demon Mirror plays thirteen four-enemy waves with reversed cuts and unlocks Inferno', async ({
  page,
}, info) => {
  test.setTimeout(90000);
  await page.addInitScript(() => {
    localStorage.setItem('issen.stats', JSON.stringify({ roninWave: 10, runs: 8 }));
    localStorage.setItem(
      'issen.meta',
      JSON.stringify({ schemaVersion: 4, bossMilestone: 3, revealSeen: 3, tutorial: 'completed' }),
    );
    localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true }));
  });
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__demon = { G, sceneSeeds: [], step: update, swipe: onSwipe, render, settleScene: async () => { while (sceneLoading) { render(0); await new Promise(resolve => setTimeout(resolve, 10)); } }, stop: () => frameLoop.stop() }; const drawRealm = demonRealmRenderer.draw; demonRealmRenderer.draw = (...args) => { window.__demon.sceneSeeds.push(args[5]); return drawRealm(...args); }; artworkReady = true;',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bTrials')).toBeVisible({ timeout: 60000 });
  await page.waitForFunction(() => !!(window as any).__demon);
  await page.evaluate(() => (window as any).__demon.stop());
  await page.locator('#bTrials').click();
  await page.locator('[data-trial="demon-mirror"]').click();
  await page.evaluate(() => (window as any).__demon.settleScene());
  await expect(page.locator('#title')).toHaveCSS('opacity', '0');
  await expect(page.locator('#trials')).toHaveCSS('opacity', '0');
  await page.evaluate(() => {
    const h = (window as any).__demon;
    for (let i = 0; i < 55; i++) h.step(0.02, 0.02);
    h.render(0.016);
  });
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'demon-realm');
  await expect(page.locator('#trialObjective')).toContainText('Wave 1/13');
  const stableScene = await page.evaluate(() => {
    const h = (window as any).__demon;
    h.render(0);
    const before = h.sceneSeeds.at(-1);
    h.G.wave = 7;
    h.render(0);
    const after = h.sceneSeeds.at(-1);
    h.G.wave = 1;
    return before === after;
  });
  expect(stableScene).toBe(true);
  await page.screenshot({ path: info.outputPath('demon-realm-portrait.png') });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(() =>
      page.locator('#c').evaluate((canvas: HTMLCanvasElement) => canvas.width / canvas.height),
    )
    .toBeGreaterThan(2);
  await page.evaluate(() => (window as any).__demon.settleScene());
  await page.evaluate(() => (window as any).__demon.render(0.016));
  await page.screenshot({ path: info.outputPath('demon-realm-landscape.png') });
  const result = await page.evaluate(() => {
    const h = (window as any).__demon;
    const waves: Record<number, number> = {};
    const opposite: Record<string, string> = {
      up: 'down',
      down: 'up',
      left: 'right',
      right: 'left',
    };
    for (let i = 0; i < 15000 && h.G.state !== 'title'; i++) {
      h.step(0.02, 0.02);
      if (h.G.state === 'playing') {
        if (h.G.cfg.pack !== 4 || h.G.cfg.total !== 4 || h.G.cfg.refill)
          throw new Error('Wrong wave size');
        if (h.G.attacker?.p >= 0.84) {
          waves[h.G.wave] = (waves[h.G.wave] ?? 0) + 1;
          h.swipe(opposite[h.G.attacker.dir]);
        }
      }
    }
    return {
      waves,
      completed: JSON.parse(localStorage.getItem('issen.trials') || '{}').completed,
      unlocks: JSON.parse(localStorage.getItem('issen.unlocks') || '[]'),
    };
  });
  expect(Object.keys(result.waves)).toHaveLength(13);
  expect(Object.values(result.waves)).toEqual(Array(13).fill(4));
  expect(result.completed).toContain('demon-mirror');
  expect(result.unlocks).toContain('trial-inferno');
  await expect(page.locator('#trialResult')).toContainText('Complete');
  await page.locator('[data-trial="demon-mirror"]').click();
  await page.evaluate(() => (window as any).__demon.settleScene());
  await page.evaluate(() => {
    const h = (window as any).__demon;
    for (let i = 0; i < 300 && !h.G.attacker; i++) h.step(0.02, 0.02);
    h.swipe(h.G.attacker.dir);
    for (let i = 0; i < 150; i++) h.step(0.02, 0.02);
  });
  await expect(page.locator('#trialResult')).toContainText('Failed');
});

test('Inferno grades the world and animates flames while accessibility freezes motion', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  const result = await page.evaluate(async () => {
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const render = async (time: number, reducedMotion = false, film = 'trial-inferno') => {
      const canvas = document.createElement('canvas');
      canvas.width = 390;
      canvas.height = 240;
      const g = await createTestDrawing(canvas);
      g.fillStyle = '#777';
      g.fillRect(0, 0, 390, 240);
      applyFilm(g, 390, 240, canvas, film, time, { reducedMotion });
      if (g.globalAlpha !== 1 || g.globalCompositeOperation !== 'source-over')
        throw new Error('Film leaked state');
      const result = canvas.toDataURL();
      g.dispose();
      return result;
    };
    return {
      graded: (await render(0)) !== (await render(0, false, 'mono')),
      animated: (await render(0)) !== (await render(2)),
      frozen: (await render(0, true)) === (await render(2, true)),
    };
  });
  expect(result).toEqual({ graded: true, animated: true, frozen: true });
});
