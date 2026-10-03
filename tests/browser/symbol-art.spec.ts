import { expect, test } from '@playwright/test';

test('Temple and Trials show isolated atlas emblems in portrait and landscape', async ({
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
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#bTemplate')).toBeVisible({ timeout: 60000 });
  for (const viewport of [
    { width: 390, height: 844 },
    { width: 844, height: 390 },
  ]) {
    await page.setViewportSize(viewport);
    await page.locator('#bTemplate').click();
    await expect(page.locator('#template')).toHaveCSS('opacity', '1');
    const upgrades = page.locator('.upgrade-tile .symbol-art');
    await expect(upgrades).toHaveCount(10);
    expect(
      await upgrades.evaluateAll(
        (nodes) =>
          new Set(
            nodes.map(
              (node) =>
                (node as HTMLElement).style.backgroundImage +
                (node as HTMLElement).style.backgroundPosition,
            ),
          ).size,
      ),
    ).toBe(10);
    for (const tile of await page.locator('.upgrade-tile').all()) {
      const id = await tile.getAttribute('data-upgrade');
      await tile.click();
      await expect(page.locator('.template-detail .symbol-art')).toHaveAttribute(
        'data-symbol',
        `temple:${id}`,
      );
    }
    await expect(page.locator('.template-detail .symbol-art')).toHaveAttribute(
      'aria-hidden',
      'true',
    );
    await page.locator('[data-upgrade="vitality"]').click();
    await page.locator('#template').evaluate((el) => {
      el.scrollTop = 0;
    });
    await page.screenshot({ path: info.outputPath(`temple-symbols-${viewport.width}.png`) });
    await page.locator('#template [data-back]').click();
    await page.locator('#bTrials').click();
    await expect(page.locator('#trials')).toHaveCSS('opacity', '1');
    const trials = page.locator('.trial-card .symbol-art');
    await expect(trials).toHaveCount(11);
    expect(
      await trials.evaluateAll(
        (nodes) =>
          new Set(nodes.map((node) => (node as HTMLElement).style.backgroundPosition)).size,
      ),
    ).toBe(11);
    const fits = await page
      .locator('.trial-card')
      .evaluateAll((nodes) => nodes.every((node) => node.scrollWidth <= node.clientWidth + 1));
    expect(fits).toBe(true);
    const atlasDimensions = await page
      .locator('[data-symbol="trial:quiet-blade"]')
      .evaluate(async (node) => {
        const url = getComputedStyle(node).backgroundImage.slice(5, -2);
        const img = new Image();
        img.src = url;
        await img.decode();
        return { width: img.naturalWidth, height: img.naturalHeight };
      });
    expect(atlasDimensions.width / atlasDimensions.height).toBeCloseTo(4 / 3, 2);
    await page.screenshot({ path: info.outputPath(`trial-symbols-${viewport.width}.png`) });
    await page.locator('#trials [data-back]').click();
  }
  await page.locator('#bTrials').click();
  await page.locator('[data-trial="unbroken"]').click();
  await expect(page.locator('#trialResult')).toContainText('Failed', { timeout: 15000 });
  await expect(page.locator('#trialResult .symbol-art')).toHaveAttribute(
    'data-symbol',
    'trial:unbroken',
  );
});
