import { expect, test } from '@playwright/test';

test('an actual kill clears both its shadow and dark ground mark during hit-stop', async ({
  page,
}) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__deathHarness = { G, g, fx, frameLoop, startRun, killEnemy, drawEnemy, drawStains, updateEnemies, updateFx }; artworkReady = true;',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(window as any).__deathHarness);
  await page.evaluate(() => (window as any).__deathHarness.startRun());
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await expect
    .poll(() => page.evaluate(() => (window as any).__deathHarness.G.enemies.length))
    .toBeGreaterThan(0);
  const result = await page.evaluate(() => {
    const {
      G,
      fx,
      frameLoop,
      startRun,
      killEnemy,
      drawEnemy,
      drawStains,
      updateEnemies,
      updateFx,
    } = (window as any).__deathHarness;
    frameLoop.stop();
    const e = G.enemies[0];
    G.enemies = [e];
    killEnemy(e, e.dir, true);
    const ctx = (window as any).__deathHarness.g,
      fill = ctx.fill;
    let groundFills = 0;
    ctx.fill = function (...args: any[]) {
      if (
        /^rgba\(0,\s*0,\s*0,\s*0?\.25\)$/.test(this.fillStyle as string) ||
        /^rgba\(8,\s*8,\s*7,/.test(this.fillStyle as string)
      )
        groundFills++;
      return (fill as any).apply(this, args);
    };
    try {
      drawEnemy(e);
      drawStains();
      const initial = groundFills;
      for (let i = 0; i < 9; i++) {
        updateEnemies(0.001, 0.05);
        updateFx(0.001, 0.05);
      }
      groundFills = 0;
      drawEnemy(e);
      drawStains();
      return {
        initial,
        remaining: groundFills,
        marks: fx.stains.length,
        bodyRetained: G.enemies.includes(e),
      };
    } finally {
      ctx.fill = fill;
    }
  });
  expect(result.initial).toBe(2);
  expect(result.remaining).toBe(0);
  expect(result.marks).toBe(0);
  expect(result.bodyRetained).toBe(true);
});

test('every enemy death shadow stays grounded and disappears in raw time under slow motion', async ({
  page,
}) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__deathHarness = { G, g, frameLoop, drawEnemy, updateEnemies }; artworkReady = true;',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => !!(window as any).__deathHarness);
  const results = await page.evaluate(async () => {
    const { registerMaterialSink } = await import('/src/rendering/scene-material.ts');
    const { G, frameLoop, drawEnemy, updateEnemies } = (window as any).__deathHarness;
    frameLoop.stop();
    const source = G.enemies[0];
    const ctx = (window as any).__deathHarness.g,
      fill = ctx.fill;
    let shadows: { alpha: number; transform: number[] }[] = [],
      bodyFills = 0;
    registerMaterialSink(ctx, {
      draw: () => {
        bodyFills++;
      },
      lights: () => {},
    });
    ctx.fill = function (...args: any[]) {
      if (this.fillStyle === 'rgba(0, 0, 0, 0.25)' || this.fillStyle === 'rgba(0,0,0,.25)') {
        const m = this.getTransform();
        shadows.push({ alpha: this.globalAlpha, transform: [m.a, m.b, m.c, m.d, m.e, m.f] });
      } else bodyFills++;
      return (fill as any).apply(this, args);
    };
    const drawImage = ctx.drawImage;
    ctx.drawImage = function (...args: any[]) {
      bodyFills++;
      return (drawImage as any).apply(this, args);
    };
    const results = [];
    try {
      for (const style of ['split', 'kneel', 'stagger', 'disarm', 'fall', 'crumple']) {
        const e = {
          ...source,
          state: 'dying',
          deathType: style,
          t: 0.1,
          shadowTime: 0,
          fallDir: -1,
          pos: { ...source.pos },
          deathGround: { ...source.pos },
        };
        G.enemies = [e];
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        shadows = [];
        drawEnemy(e);
        const initial = shadows.slice();
        for (let i = 0; i < 8; i++) updateEnemies(0.005, 0.05);
        shadows = [];
        bodyFills = 0;
        drawEnemy(e);
        results.push({
          style,
          initial,
          remaining: shadows.length,
          bodyFills,
          retained: G.enemies.length,
          expected: [e.deathGround.h, 0, 0, e.deathGround.h, e.deathGround.x, e.deathGround.y],
        });
      }
    } finally {
      ctx.fill = fill;
    }
    ctx.drawImage = drawImage;
    return results;
  });
  for (const result of results) {
    expect(result.initial, result.style).toHaveLength(1);
    result.initial[0]!.transform.forEach((value, index) =>
      expect(value).toBeCloseTo(result.expected[index]!, 4),
    );
    expect(result.remaining).toBe(0);
    expect(result.bodyFills).toBeGreaterThan(0);
    expect(result.retained).toBe(1);
  }
});
