import { expect, test } from '@playwright/test';

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
        }),
      );
    }
    localStorage.setItem('issen.guidedLessons', JSON.stringify({ order: true, bossParry: true }));
  });
});

test('runtime disposal stops animation and detached controls before remounting', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const mainPath = document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src;
    const mountPath = '/src/ui/mount.ts',
      gamePath = '/src/game.ts';
    const main = await import(mainPath);
    const oldRoot = document.querySelector('#app')!;
    const canvas = oldRoot.querySelector<HTMLCanvasElement>('#c')!;
    main.dispose();
    main.dispose();
    const before = canvas.toDataURL();
    oldRoot.querySelector<HTMLButtonElement>('#bPlay')!.click();
    window.dispatchEvent(new Event('resize'));
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));
    await new Promise((resolve) => setTimeout(resolve, 120));
    const stopped = before === canvas.toDataURL();
    const inactive = !oldRoot.querySelector('#setup')!.classList.contains('on');
    const { mount } = await import(mountPath),
      { startGame } = await import(gamePath);
    const root = mount(),
      stop = startGame();
    root.querySelector<HTMLButtonElement>('#bPlay')!.click();
    const restarted = root.querySelector('#setup')!.classList.contains('on');
    stop();
    root.remove();
    return { stopped, inactive, restarted, roots: document.querySelectorAll('#app').length };
  });
  expect(result).toEqual({ stopped: true, inactive: true, restarted: true, roots: 0 });
  expect(errors).toEqual([]);
});

test('ending a paused run renders records and allows a fresh run', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Draw your blade' }).click();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.keyboard.press('p');
  await page.getByRole('button', { name: 'End run', exact: true }).click();
  for (let i = 0; i < 3 && (await page.locator('#runResultSequence').isVisible()); i++)
    await page.locator('#runResultSequence').click();
  await expect(page.locator('#over')).toHaveClass(/on/);
  await expect(page.locator('#oSub')).toHaveText('You left the field');
  await expect(page.locator('#oReason')).toHaveText('You sheathed your blade.');
  await expect(page.locator('#oStats')).toContainText('Normal. Wave 1');
  await expect(page.locator('#bAgain')).toBeEnabled();
  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!));
  expect(stats.runs).toBe(1);
  expect(stats.deaths).toEqual({});
  expect(stats.rec.normal.wave).toBe(1);
  await page.locator('#bShare').click();
  await expect(page.locator('#share')).toHaveClass(/on/);
  await expect
    .poll(() =>
      page
        .locator('#shareImg')
        .evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight]),
    )
    .toEqual([1080, 1350]);
  await page.locator('#share [data-back]').click();
  await expect(page.locator('#over')).toHaveClass(/on/);
  await page.locator('#bAgain').click();
  await expect(page.locator('#over')).not.toHaveClass(/on/);
  await expect(page.locator('#hud')).toHaveClass(/on/);
  expect(errors).toEqual([]);
});

test('malformed saves fall back safely and mute persists across reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => {
    if (!localStorage.getItem('test.seeded')) {
      localStorage.setItem('issen.stats', JSON.stringify({ kills: 'bad', bl: null }));
      localStorage.setItem('issen.unlocks', '{}');
      localStorage.setItem('issen.setup', 'null');
      localStorage.setItem('issen.equip', JSON.stringify({ blade: 'missing' }));
      localStorage.setItem('test.seeded', 'true');
    }
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Draw your blade' }).click();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.locator('#mute').click();
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('#mute')).toHaveAttribute('aria-pressed', 'true');
  expect(errors).toEqual([]);
});

test('title renders, a run starts, and keyboard pause/resume works', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await expect(page.locator('#title')).toHaveClass(/on/);
  await page.getByRole('button', { name: 'Draw your blade' }).click();
  await expect(page.locator('#setup')).toHaveClass(/on/);
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await expect(page.locator('#hud')).toHaveClass(/on/);
  await page.keyboard.press('p');
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await page.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(page.locator('#paused')).not.toHaveClass(/on/);
  await page.keyboard.press('ArrowRight');
  expect(errors).toEqual([]);
});

test('armory preview draws without errors in portrait and landscape', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.getByRole('button', { name: 'Armory', exact: true }).click();
  await expect(page.locator('#armory')).toHaveClass(/on/);
  await expect(page.locator('#armTiles button').first()).toBeVisible();
  const pixels = await page.locator('#prevC').evaluate((canvas: HTMLCanvasElement) => {
    const context = canvas.getContext('2d');
    return context
      ?.getImageData(0, 0, canvas.width, canvas.height)
      .data.some((value) => value !== 0);
  });
  expect(pixels).toBe(true);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(
    page.locator('#armory').getByRole('button', { name: 'Done', exact: true }),
  ).toBeVisible();
  await page.locator('#armory').getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('#title')).toHaveClass(/on/);
  expect(errors).toEqual([]);
});
