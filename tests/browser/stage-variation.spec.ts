import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
]) {
  test(`cinematic visits vary scenery and standing enemies without touching a saved run ${viewport.width}`, async ({
    page,
  }, info) => {
    test.setTimeout(90000);
    const graphicsWarnings: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('PixiJS'))
        graphicsWarnings.push(message.text());
    });
    await page.setViewportSize(viewport);
    await page.addInitScript(() => {
      if (!localStorage.getItem('issen.meta'))
        localStorage.setItem(
          'issen.meta',
          JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }),
        );
    });
    await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
      const response = await route.fetch();
      await route.fulfill({
        response,
        body: (await response.text()).replace(
          'artworkReady = true;',
          'window.__visitAudit = () => ({ seed: foundation.view.stageState.stageSeed, originalSeed: cinematicWiring.savedStageSeed, stage: foundation.run.G.stage, enemies: foundation.run.G.enemies.map(e => e.d.seed), random: foundation.run.activity.runRandom.state(), cache: foundation.browser.environmentRenderer.snapshot() }); artworkReady = true;',
        ),
      });
    });
    await page.goto('/');
    await page.locator('#bPlay').click();
    await page.locator('#bBegin').click();
    await expect
      .poll(() => page.evaluate(() => !!localStorage.getItem('issen.runCheckpoint')))
      .toBe(true);
    await page.evaluate(() =>
      sessionStorage.setItem(
        'issen.cinematic',
        JSON.stringify({ active: true, scene: 0, film: 'mono' }),
      ),
    );
    await page.reload();
    await expect(page.locator('#cinematic')).toBeVisible();
    const read = () =>
      page.evaluate(() => ({
        ...(window as any).__visitAudit(),
        checkpoint: localStorage.getItem('issen.runCheckpoint'),
      }));
    await expect
      .poll(() => page.evaluate(() => typeof (window as any).__visitAudit))
      .toBe('function');
    const before = await read();
    for (let i = 1; i <= 10; i++) {
      const previousBuilds = (await read()).cache.builds;
      await page.getByRole('button', { name: 'Next scene', exact: true }).click();
      await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', String(i % 10));
      await expect.poll(async () => (await read()).stage).toBe(i < 9 ? i : 0);
      if (i === 9) {
        await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'demon-realm');
        continue;
      }
      await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
      await expect.poll(async () => (await read()).cache.builds).toBeGreaterThan(previousBuilds);
    }
    const returned = await read();
    expect(returned.seed).not.toBe(before.seed);
    expect(returned.enemies).not.toEqual(before.enemies);
    expect(returned.random).toBe(before.random);
    expect(returned.checkpoint).toBe(before.checkpoint);
    const oldBuilds = returned.cache.builds;
    await page.setViewportSize({ width: viewport.width - 20, height: viewport.height - 10 });
    await expect.poll(async () => (await read()).cache.builds).toBeGreaterThan(oldBuilds);
    const resized = await read();
    expect(resized.seed).toBe(returned.seed);
    expect(resized.enemies).toEqual(returned.enemies);
    expect(resized.random).toBe(before.random);
    expect(resized.checkpoint).toBe(before.checkpoint);
    await page.screenshot({ path: info.outputPath(`stage-variation-${viewport.width}.png`) });
    await page.getByRole('button', { name: 'Exit', exact: true }).click();
    const exited = await read();
    expect(exited.stage).toBe(0);
    expect(exited.seed).toBe(before.originalSeed);
    expect(exited.checkpoint).toBe(before.checkpoint);
    expect(graphicsWarnings).toEqual([]);
  });
}
