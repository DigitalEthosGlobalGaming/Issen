import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';

for (const phase of ['playing', 'boss', 'standoff', 'shrine']) {
  const fixture = JSON.parse(
    readFileSync(new URL(`../fixtures/runtime-refactor/${phase}.json`, import.meta.url), 'utf8'),
  );
  test(`pre-extraction ${phase} checkpoint resumes through the real runtime`, async ({ page }) => {
    test.setTimeout(60000);
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.addInitScript((checkpoint) => {
      localStorage.setItem('issen.runCheckpoint', JSON.stringify(checkpoint));
      localStorage.setItem('issen.meta', JSON.stringify(checkpoint.meta));
    }, fixture);
    await page.goto('/');
    await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
    await expect(page.locator('#paused')).toHaveClass(/on/);
    await expect(page.locator('#pauseSeed')).toHaveText(`Seed ${fixture.seed}`);
    await page.locator('#bResume').click();
    await expect(page.locator('#paused')).not.toHaveClass(/on/);
    if (phase === 'shrine') {
      await expect(page.locator('#shrine')).toHaveClass(/on/);
      await expect(page.locator('#blessList button')).toHaveCount(fixture.offers.length);
    } else await expect(page.locator('#hud')).toHaveClass(/on/);
    expect(errors).toEqual([]);
  });
}
