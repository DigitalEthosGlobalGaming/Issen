import { expect, test } from '@playwright/test';

test('Scattered Armour reuses the enemy silhouette and expires as separate sprite pieces', async ({
  page,
}) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#app')).toHaveCount(1);
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createInkEnemyRenderer } = await import('/src/rendering/figures/ink-enemy.ts');
    const { createInkSwordRenderer } = await import('/src/rendering/figures/ink-sword.ts');
    const { createFigureRenderer } = await import('/src/rendering/figures/figure.ts');
    const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const enemy = createInkEnemyRenderer(document),
      sword = createInkSwordRenderer(document);
    await Promise.all([enemy.prepare(), sword.prepare()]);
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 320;
    const g = await createTestDrawing(canvas);
    const palette = createPalette();
    const renderer = createFigureRenderer(g, {
      inkEnemy: enemy,
      inkSword: sword,
      time: 0,
      wind: 0,
      width: 320,
      height: 320,
      palette: (fog) => palette.fog(fog, [180, 170, 160]),
      random: () => {
        throw new Error('Scatter must not consume random numbers');
      },
      petActive: false,
    });
    const alpha = () =>
      g
        .getImageData(0, 0, 320, 320)
        .data.reduce((n, v, i) => n + (i % 4 === 3 && v > 0 ? 1 : 0), 0);
    const results = [];
    try {
      for (const [seed, variant] of [
        [2, 'kabuto'],
        [31, ''],
        [92, 'mask'],
      ] as const) {
        const figure = {
          x: 160,
          y: 270,
          h: 150,
          fog: 0.2,
          d: makeFig(seed),
          pose: EPOSE.guard,
          noShadow: true,
          varied: true,
          variant,
        };
        g.clearRect(0, 0, 320, 320);
        renderer.drawFigure(figure);
        const assembled = g.getImageData(0, 0, 320, 320).data.slice(),
          coverage = alpha();
        g.clearRect(0, 0, 320, 320);
        renderer.drawScattered(figure, Math.PI / 2, 0);
        const start = g.getImageData(0, 0, 320, 320).data;
        const difference = start.reduce((n, v, i) => n + Math.abs(v - assembled[i]!), 0);
        g.clearRect(0, 0, 320, 320);
        renderer.drawScattered(figure, Math.PI / 2, 0.35);
        const airborne = g.getImageData(0, 0, 320, 320).data;
        const moved = airborne.some((v, i) => v !== assembled[i]);
        const airborneCoverage = alpha();
        g.clearRect(0, 0, 320, 320);
        renderer.drawScattered(figure, Math.PI / 2, 1.1);
        results.push({
          difference,
          coverage,
          airborneCoverage,
          moved,
          expired: alpha(),
          transform: g.getTransform().isIdentity,
        });
      }
      return results;
    } finally {
      enemy.dispose();
      sword.dispose();
    }
  });
  for (const item of result) {
    expect(item.coverage).toBeGreaterThan(1000);
    // Separate sprite passes can differ slightly at antialiased overlaps.
    expect(item.difference / (item.coverage * 4 * 255)).toBeLessThan(0.01);
    expect(item.airborneCoverage).toBeGreaterThan(1000);
    expect(item.moved).toBe(true);
    expect(item.expired).toBe(0);
    expect(item.transform).toBe(true);
  }
});

test('selected Scattered Armour reaches the live kill renderer without duplicate particles', async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.unlocks', JSON.stringify(['scattered-armour']));
    localStorage.setItem('issen.equip', JSON.stringify({ fx: 'scattered-armour' }));
  });
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__scatterHarness={G,frameLoop,startRun,killEnemy,drawEnemy,updateEnemies}; artworkReady = true;',
      ),
    });
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await page.evaluate(() => (window as any).__scatterHarness.startRun());
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await expect
    .poll(() => page.evaluate(() => (window as any).__scatterHarness.G.enemies.length))
    .toBeGreaterThan(0);
  const result = await page.evaluate(() => {
    const { G, frameLoop, startRun, killEnemy, drawEnemy, updateEnemies } = (window as any)
      .__scatterHarness;
    frameLoop.stop();
    const enemy = G.enemies[0];
    G.enemies = [enemy];
    killEnemy(enemy, enemy.dir, true);
    const style = enemy.deathType;
    drawEnemy(enemy);
    updateEnemies(1.11, 1.11);
    return { style, remaining: G.enemies.length };
  });
  expect(result).toEqual({ style: 'scatter', remaining: 0 });
});
