import { expect, test } from '@playwright/test';
import { defeatCurrentBoss } from './drive-boss.ts';

// These regressions exercise established gameplay; onboarding has dedicated coverage.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta')) {
      localStorage.setItem(
        'issen.meta',
        JSON.stringify({
          tutorial: 'skipped',
          bossMilestone: 3,
          revealSeen: 3,
          upgrades: { vitality: 1 },
        }),
      );
    }
    localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true }));
  });
});

test('boss rush victory opens a shrine and its choice starts the next duel', async ({ page }) => {
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'artworkReady = true;',
      'window.__bossState = () => G.boss; artworkReady = true;',
    );
    await route.fulfill({ response, body });
  });
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.setup',
      JSON.stringify({ mode: 'rush', diff: 'normal', lives: '0', arrows: true }),
    );
    Math.random = () => 0.5;
    let next = 0,
      time = performance.now();
    Object.defineProperty(performance, 'now', { value: () => time });
    const pending = new Map<number, FrameRequestCallback>();
    window.requestAnimationFrame = (callback) => {
      pending.set(++next, callback);
      return next;
    };
    window.cancelAnimationFrame = (handle) => {
      pending.delete(handle);
    };
    Object.defineProperty(window, 'advanceGameFrames', {
      value: (count: number) => {
        if (!time) time = performance.now();
        for (let i = 0; i < count; i++) {
          time += 50;
          const callbacks = [...pending.values()];
          pending.clear();
          for (const callback of callbacks) callback(time);
        }
      },
    });
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('#bPlay')!.click();
    document.querySelector<HTMLButtonElement>('#bBegin')!.click();
  });
  const advance = (count: number) =>
    page.evaluate((count) => {
      (window as unknown as { advanceGameFrames(count: number): void }).advanceGameFrames(count);
    }, count);
  await defeatCurrentBoss(page);
  await expect(page.locator('#bossHp .gone')).toHaveCount(3);
  await expect(page.locator('#bossbar')).not.toHaveClass(/on/);
  await advance(52);
  await expect(page.locator('#shrine')).toHaveClass(/on/);
  await expect(page.locator('#blessList button')).toHaveCount(3);
  await page
    .locator('#blessList button')
    .filter({ hasNotText: 'Twin blessing' })
    .first()
    .evaluate((button: HTMLButtonElement) => button.click());
  await expect(page.locator('#shrine')).not.toHaveClass(/on/);
  await expect
    .poll(
      async () => {
        await advance(1);
        return page.locator('#c').getAttribute('data-scene-state');
      },
      { timeout: 15000 },
    )
    .toBe('ready');
  await expect(page.locator('#bossbar')).toHaveClass(/on/);
  await expect(page.locator('#waveLbl')).toHaveText('決闘 二');
  await expect(page.locator('#badges .chip')).toHaveCount(1);
  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!));
  expect(stats.duels).toBe(1);
  expect(stats.shrines).toBe(1);
  expect(errors).toEqual([]);
});

test('Daruma revives a fallen player once before a later death ends the run', async ({ page }) => {
  test.setTimeout(30000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    localStorage.setItem(
      'issen.setup',
      JSON.stringify({ mode: 'waves', diff: 'normal', lives: '0', arrows: true }),
    );
    localStorage.setItem('issen.unlocks', JSON.stringify(['daruma']));
    localStorage.setItem('issen.equip', JSON.stringify({ charm: 'daruma' }));
  });
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await page.getByRole('button', { name: 'Draw your blade' }).click();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await expect(page.locator('#banner .l')).toHaveText('Seven times down, eight times up', {
    timeout: 12000,
  });
  await expect(page.locator('#over')).not.toHaveClass(/on/);
  await expect(page.locator('#over')).toHaveClass(/on/, { timeout: 12000 });
  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!));
  expect(stats.runs).toBe(1);
  expect(stats.deaths.late).toBe(1);
  expect(errors).toEqual([]);
});
