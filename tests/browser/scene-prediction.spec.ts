import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

for (const daily of [false, true])
  test(`runtime forecasts the exact visit later entered (daily=${daily})`, async ({
    page,
  }, testInfo) => {
    test.setTimeout(120000);
    await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
    await page.addInitScript(() =>
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
    );
    await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
      const response = await route.fetch(),
        source = await response.text();
      expect(source).toContain('artworkReady = true;');
      await route.fulfill({
        response,
        body: source.replace(
          'artworkReady = true;',
          `
      window.__scenePrediction = { foundation, game, ui, frames }; artworkReady = true;`,
        ),
      });
    });
    await page.goto('/');
    await page.waitForFunction(() => (window as any).__scenePrediction, undefined, {
      timeout: 60000,
    });
    await page.locator('#bPlay').click();
    await page.locator(daily ? '#bDaily' : '#bBegin').click();
    await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
      timeout: 30000,
    });
    const rows = [];
    for (const wave of [1, 4, 7, 10]) {
      const before = await page.evaluate((wave) => {
        const { foundation: f, game, ui } = (window as any).__scenePrediction;
        game.startWave(wave, true);
        f.run.G.state = 'paused';
        f.run.G.pausedFrom = 'playing';
        ui.screenAnimation.invalidate();
        return {
          stage: f.run.G.stage,
          seed: f.view.stageState.stageSeed,
          visits: f.view.stageVisits.visits,
          random: f.run.activity.runRandom.state(),
          expected: f.view.stageVisits.peek((f.run.G.stage + 1) % 9),
        };
      }, wave);
      await expect
        .poll(() =>
          page.evaluate(() => document.querySelector('#c')!.getAttribute('data-scene-state')),
        )
        .toBe('ready');
      const settledRandom = await page.evaluate(() =>
        (window as any).__scenePrediction.foundation.run.activity.runRandom.state(),
      );
      await page.waitForFunction((stage) => {
        const value = document.body.dataset.assetNextScene;
        return value && JSON.parse(value).stage === (stage + 1) % 9;
      }, before.stage);
      const after = await page.evaluate(() => {
        const { foundation: f } = (window as any).__scenePrediction;
        return {
          forecast: JSON.parse(document.body.dataset.assetNextScene!),
          visits: f.view.stageVisits.visits,
          seed: f.view.stageState.stageSeed,
          random: f.run.activity.runRandom.state(),
        };
      });
      expect(after.forecast.stageSeed).toBe(before.expected);
      expect(after.visits).toBe(before.visits);
      expect(after.seed).toBe(before.seed);
      expect(after.random).toBe(settledRandom);
      if (rows.length) expect(before.seed).toBe(rows.at(-1)!.after.forecast.stageSeed);
      rows.push({ before, settledRandom, after });
    }
    await writeFile(
      testInfo.outputPath('next-scene-identities.json'),
      JSON.stringify(rows, null, 2),
    );
  });
