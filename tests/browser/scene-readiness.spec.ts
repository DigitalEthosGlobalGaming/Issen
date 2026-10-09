import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test.beforeEach(async ({ page }) => {
  test.setTimeout(60000);
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        `
      { let releaseScene;
      const composeScene = foundation.browser.environmentRenderer.compose.bind(foundation.browser.environmentRenderer);
      window.__sceneReadiness = {
        G: foundation.run.G, startWave: game.startWave, startRushDuel: game.startRushDuel,
        snapshot() { return JSON.stringify({ G: foundation.run.G, P: foundation.run.P,
          random: foundation.run.activity.runRandom.state(), WX: foundation.run.WX,
          hitStop: foundation.run.sessionState.hitStop }); },
        holdTimers() { foundation.run.G.slowT = 5; foundation.run.sessionState.hitStop = 5; },
        time() { return foundation.view.presentationState.time; },
        hold() {
          const blocked = new Promise(resolve => { releaseScene = resolve; });
          foundation.browser.environmentRenderer.compose = async frame => { await blocked; return composeScene(frame); };
        },
        holdWeapons() {
          const blocked = new Promise(resolve => { releaseScene = resolve; });
          const prepareParts = foundation.browser.inkSword.prepareParts.bind(foundation.browser.inkSword);
          foundation.browser.inkSword.prepareParts = async ids => { await blocked; return prepareParts(ids); };
        },
        release() { releaseScene(); },
        freezeMenu() { ui.screenAnimation.demand = () => ({ update: false, render: false, afterRender: false }); }
      };
      artworkReady = true;
      }
    `,
      ),
    });
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => (window as any).__sceneReadiness, undefined, { timeout: 30000 });
});

test('loading veil waits 150ms and cancels when a short scene load finishes', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const states = await page.evaluate(() => {
    const canvas = document.querySelector('#c') as HTMLCanvasElement;
    const veil = document.querySelector('#sceneLoadingTreatment') as HTMLElement;
    const visibility = () => getComputedStyle(veil).visibility;
    canvas.dataset.sceneState = 'loading';
    const first = veil.getAnimations()[0];
    first.pause();
    first.currentTime = 149;
    const before = visibility();
    first.currentTime = 151;
    const after = visibility();
    canvas.dataset.sceneState = 'ready';
    const settled = visibility();
    canvas.dataset.sceneState = 'loading';
    const next = veil.getAnimations()[0];
    next.pause();
    next.currentTime = 50;
    const repeated = visibility();
    canvas.dataset.sceneState = 'ready';
    return { before, after, settled, repeated, short: visibility() };
  });
  expect(states).toEqual({
    before: 'hidden',
    after: 'visible',
    settled: 'hidden',
    repeated: 'hidden',
    short: 'hidden',
  });
});

for (const paused of [false, true]) {
  test(`held stage load keeps scene pixels moving without advancing gameplay or run RNG (paused=${paused})`, async ({
    page,
  }, testInfo) => {
    await page.locator('#bPlay').click();
    await page.locator('#bBegin').click();
    const canvas = page.locator('#c');
    await expect(canvas).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
    await page.evaluate((paused) => {
      const h = (window as any).__sceneReadiness;
      h.hold();
      h.G.bossCount = 1;
      h.startRushDuel();
      h.holdTimers();
      if (paused) {
        h.G.pausedFrom = h.G.state;
        h.G.state = 'paused';
      }
    }, paused);
    await expect(canvas).toHaveAttribute('data-scene-state', 'loading');
    await expect(page.getByRole('status').filter({ hasText: 'Preparing scenery' })).toBeVisible();
    const before = await page.evaluate(() => ({
      state: (window as any).__sceneReadiness.snapshot(),
      time: (window as any).__sceneReadiness.time(),
    }));
    const first = await canvas.screenshot({ path: testInfo.outputPath('held-load-before.png') });
    await page.waitForTimeout(400);
    const second = await canvas.screenshot({ path: testInfo.outputPath('held-load-after.png') });
    const after = await page.evaluate(() => ({
      state: (window as any).__sceneReadiness.snapshot(),
      time: (window as any).__sceneReadiness.time(),
    }));
    expect(after.state).toBe(before.state);
    expect(after.time).toBeGreaterThan(before.time);
    const changed = await page.evaluate(
      async ([a, b]) => {
        const pixels = async (encoded: string) => {
          const image = new Image();
          image.src = 'data:image/png;base64,' + encoded;
          await image.decode();
          const c = document.createElement('canvas');
          c.width = image.width;
          c.height = image.height;
          const ctx = c.getContext('2d', { willReadFrequently: true })!;
          ctx.drawImage(image, 0, 0);
          return ctx.getImageData(0, 0, c.width, c.height).data;
        };
        const [left, right] = await Promise.all([pixels(a), pixels(b)]);
        let count = 0;
        for (let i = 0; i < left.length; i += 4) {
          if (
            Math.abs(left[i] - right[i]) +
              Math.abs(left[i + 1] - right[i + 1]) +
              Math.abs(left[i + 2] - right[i + 2]) >
            6
          )
            count++;
        }
        return count;
      },
      [first.toString('base64'), second.toString('base64')],
    );
    expect(changed).toBeGreaterThan(100);
    const evidence = testInfo.outputPath('held-loading-motion.json');
    await writeFile(
      evidence,
      JSON.stringify({
        changedPixels: changed,
        presentationElapsed: after.time - before.time,
        gameplayAndHazardStateIdentical: after.state === before.state,
        paused,
      }),
    );
    await testInfo.attach('held-loading-motion', {
      path: evidence,
      contentType: 'application/json',
    });
    await page.screenshot({ path: testInfo.outputPath('held-load-veil.png') });
    await page.evaluate(() => (window as any).__sceneReadiness.release());
    await expect(canvas).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
    await expect(page.locator('#sceneLoadingTreatment')).toBeHidden();
    const warming = await page.evaluate(() => {
      const marks = performance.getEntriesByType('mark') as PerformanceMark[];
      const settled = marks
        .filter((mark) => mark.name.startsWith('issen:settle-presented-scene:false:'))
        .at(-1)!;
      const key = settled.name.slice('issen:settle-presented-scene:'.length);
      const warmed = marks.find((mark) => mark.name === 'issen:textures-warmed:' + key)!;
      return {
        prewarmed: warmed.detail.prewarmed,
        mode: warmed.detail.mode,
        before: warmed.startTime <= settled.startTime,
      };
    });
    expect(warming).toEqual({ prewarmed: true, mode: 'paced-source-init', before: true });
  });
}

test('cinematic arrows, keys and swipes display their selected scene even with a settled menu', async ({
  page,
}) => {
  await page.evaluate(() => (window as any).__sceneReadiness.freezeMenu());
  await page.locator('#title .t-k').click({ clickCount: 3 });
  const canvas = page.locator('#c');
  const scene = async (value: string) => {
    await expect(canvas).toHaveAttribute('data-scene', value, { timeout: 15000 });
    await expect(canvas).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  };
  await scene('0');
  await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  await scene('1');
  await page.keyboard.press('ArrowLeft');
  await scene('0');
  await page.mouse.move(280, 260);
  await page.mouse.down();
  await page.mouse.move(100, 260, { steps: 4 });
  await page.mouse.up();
  await scene('1');
  await page.getByRole('button', { name: 'Previous scene', exact: true }).click();
  await page.getByRole('button', { name: 'Previous scene', exact: true }).click();
  await scene('9');
  await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  await scene('0');
});

test('a run waits for scenery and a presented background before spawning or advancing combat', async ({
  page,
}) => {
  await page.evaluate(() => (window as any).__sceneReadiness.hold());
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'loading');
  await page.waitForTimeout(300);
  expect(
    await page.evaluate(() => {
      const { G } = (window as any).__sceneReadiness;
      return { enemies: G.enemies.length, pending: G.pendingSpawns.length, runTime: G.runTime };
    }),
  ).toEqual({ enemies: 0, pending: 0, runTime: 0 });
  await page.setViewportSize({ width: 844, height: 390 });
  await expect
    .poll(() =>
      page.locator('#c').evaluate((canvas: HTMLCanvasElement) => canvas.width > canvas.height),
    )
    .toBe(true);
  await page.evaluate(() => (window as any).__sceneReadiness.release());
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await expect
    .poll(() => page.evaluate(() => (window as any).__sceneReadiness.G.enemies.length))
    .toBeGreaterThan(0);
});

for (const held of ['scenery', 'weapons'])
  test(`a boss waits for ${held} and remains paused when loading finishes`, async ({ page }) => {
    await page.locator('#bPlay').click();
    await page.locator('#bBegin').click();
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
      timeout: 15000,
    });
    await page.evaluate((held) => {
      const h = (window as any).__sceneReadiness;
      if (held === 'weapons') h.holdWeapons();
      else h.hold();
      h.G.bossCount = 1;
      h.startRushDuel();
    }, held);
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'loading');
    expect(await page.evaluate(() => (window as any).__sceneReadiness.G.boss)).toBeNull();
    await page.keyboard.press('p');
    await page.evaluate(() => (window as any).__sceneReadiness.release());
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
      timeout: 15000,
    });
    expect(
      await page.evaluate(() => {
        const { G } = (window as any).__sceneReadiness;
        return {
          stage: G.stage,
          bossCount: G.bossCount,
          boss: !!G.boss,
          state: G.state,
          pausedFrom: G.pausedFrom,
        };
      }),
    ).toEqual({ stage: 1, bossCount: 2, boss: true, state: 'paused', pausedFrom: 'boss' });
  });
