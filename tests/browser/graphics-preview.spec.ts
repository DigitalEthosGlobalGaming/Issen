import { expect, test } from '@playwright/test';

test('Graphics exposes the scene in portrait and landscape while cosmetics animate a frozen run', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__graphicsPreview = { G: foundation.run.G, random: () => foundation.run.activity.runRandom.state(), presentation: foundation.view.presentationState, environment: presentation.environmentState }; artworkReady = true;',
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  await expect
    .poll(() => page.evaluate(() => !!(window as any).__graphicsPreview.G.cfg))
    .toBe(true);
  await page.locator('#pauseBtn').click();
  await page.locator('#bPauseOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Graphics/ })
    .click();
  const state = () =>
    page.evaluate(async () => {
      const { leafMotionPose } = await import('/src/rendering/scene/leaf-motion.ts');
      const { G, random, presentation, environment } = (window as any).__graphicsPreview;
      return {
        run: {
          state: G.state,
          runTime: G.runTime,
          freezeT: G.freezeT,
          petT: G.petT,
          score: G.score,
          enemyTimes: G.enemies.map((e: any) => e.t),
          random: random(),
          checkpoint: localStorage.getItem('issen.runCheckpoint'),
        },
        time: presentation.time,
        leaf: environment.leaves[0]
          ? leafMotionPose(
              environment.leaves[0],
              environment.leafMotion.birth(environment.leaves[0]),
              environment.leafMotion.clock,
              1,
              true,
            )
          : null,
      };
    });
  const before = await state();
  await expect.poll(async () => (await state()).time).toBeGreaterThan(before.time + 0.25);
  const after = await state();
  expect(after.run).toEqual(before.run);
  expect(before.leaf).not.toBeNull();
  expect(after.leaf).not.toEqual(before.leaf);
  for (const [name, width, height] of [
    ['portrait', 390, 844],
    ['landscape', 844, 390],
    ['desktop', 1280, 800],
  ] as const) {
    await page.setViewportSize({ width, height });
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
      timeout: 30_000,
    });
    const layout = await page.evaluate(() => {
      const app = document.querySelector('#app')!.getBoundingClientRect();
      const panel = document.querySelector('#options > .options-box')!.getBoundingClientRect();
      const style = getComputedStyle(document.querySelector('#options')!);
      return {
        app: { width: app.width, height: app.height, right: app.right, bottom: app.bottom },
        panel: {
          width: panel.width,
          height: panel.height,
          right: panel.right,
          bottom: panel.bottom,
        },
        background: style.backgroundColor,
        backgroundImage: style.backgroundImage,
      };
    });
    expect(layout.background).toBe('rgba(0, 0, 0, 0)');
    expect(layout.backgroundImage).toBe('none');
    if (name === 'portrait') {
      expect(layout.panel.width).toBeCloseTo(layout.app.width, 0);
      expect(layout.panel.height).toBeLessThan(layout.app.height * 0.6);
      expect(layout.panel.bottom).toBeCloseTo(layout.app.bottom, 0);
    } else {
      expect(layout.panel.width).toBeLessThan(layout.app.width * 0.5);
      expect(layout.panel.height).toBeCloseTo(layout.app.height, 0);
      expect(layout.panel.right).toBeCloseTo(layout.app.right, 0);
    }
    expect((await state()).run).toEqual(before.run);
    await page.screenshot({ path: testInfo.outputPath(`graphics-preview-${name}.png`) });
  }
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-open', 'false');
  await page.locator('#options').getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  expect((await state()).run).toEqual(before.run);
});
