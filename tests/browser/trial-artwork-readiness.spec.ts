import { expect, test } from '@playwright/test';

for (const warm of [false, true])
  test(`same-stage trial bosses wait for their artwork (warm=${warm})`, async ({ page }) => {
    test.setTimeout(60000);
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
      localStorage.setItem('issen.stats', JSON.stringify({ roninWave: 10 }));
      localStorage.setItem(
        'issen.meta',
        JSON.stringify({ schemaVersion: 4, tutorial: 'completed' }),
      );
    });
    await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replace(
          'artworkReady = true;',
          `
      window.__trialArtwork = { foundation, game, frames }; artworkReady = true;
    `,
        ),
      });
    });
    await page.goto('/');
    await page.waitForFunction(() => !!(window as any).__trialArtwork);
    await page.evaluate(() => (window as any).__trialArtwork.game.startTrial('three-masters'));
    await page.waitForFunction(() => {
      const h = (window as any).__trialArtwork;
      return !h.foundation.run.sceneState.sceneLoading && h.foundation.run.G.bossCount === 1;
    });
    const seed = await page.evaluate(() => {
      const h = (window as any).__trialArtwork;
      h.foundation.run.G.pausedFrom = 'boss';
      h.foundation.run.G.state = 'paused';
      return h.foundation.view.stageState.stageSeed;
    });
    if (warm)
      await page.waitForFunction(
        () => (window as any).__trialArtwork.game.figurePreload.snapshot().status === 'ready',
      );
    const held = await page.evaluate((warm) => {
      const h = (window as any).__trialArtwork;
      const G = h.foundation.run.G;
      if (!warm) {
        const prepare = h.foundation.browser.prepareFigureArtwork;
        let release: () => void;
        const blocked = new Promise<void>((resolve) => {
          release = resolve;
        });
        h.release = release!;
        h.foundation.browser.prepareFigureArtwork = async (...args: any[]) => {
          await blocked;
          return prepare(...args);
        };
      }
      G.bossesSlain = 1;
      G.state = 'between';
      G.nextT = 100;
      h.game.startTrialEncounter();
      return {
        loading: h.foundation.run.sceneState.sceneLoading,
        count: G.bossCount,
        stage: G.stage,
      };
    }, warm);
    expect(held).toEqual({ loading: true, count: 1, stage: 0 });
    if (!warm) {
      await page.waitForTimeout(100);
      expect(
        await page.evaluate(() => (window as any).__trialArtwork.foundation.run.G.bossCount),
      ).toBe(1);
      await page.evaluate(() => (window as any).__trialArtwork.release());
    }
    await page.waitForFunction(() => {
      const h = (window as any).__trialArtwork;
      return !h.foundation.run.sceneState.sceneLoading && h.foundation.run.G.bossCount === 4;
    });
    const entered = await page.evaluate(() => {
      const h = (window as any).__trialArtwork;
      h.frames.frameLoop.stop();
      return {
        count: h.foundation.run.G.bossCount,
        boss: h.foundation.run.G.boss.def.v,
        stage: h.foundation.run.G.stage,
        seed: h.foundation.view.stageState.stageSeed,
      };
    });
    expect(entered).toEqual({ count: 4, boss: 'mask', stage: 0, seed });
  });
