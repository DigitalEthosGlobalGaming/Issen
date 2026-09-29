import { expect, test } from '@playwright/test';

test('first play starts a run directly and the menu tutorial remains optional', async ({
  page,
}) => {
  await page.goto('/');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  const tutorial = page.locator('.tutorial-overlay');
  await expect(tutorial).toBeHidden();
  await page.keyboard.press('p');
  await expect(page.locator('#bResume')).toBeVisible();
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!).runs)).toBe(1);
  await page.reload();
  await expect(page.locator('#paused')).toHaveClass(/on/);
  await page.locator('#bEnd').click();
  await page.locator('#bMenu').evaluate((button: HTMLButtonElement) => button.click());
  await page.locator('#bTutorial').click();
  await expect(tutorial).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: 'test-results/tutorial-portrait.png' });
  await page.setViewportSize({ width: 1000, height: 650 });
  await page.screenshot({ path: 'test-results/tutorial-landscape.png' });
  await page.keyboard.press('ArrowRight');
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const overlay = document.querySelector<HTMLElement>('.tutorial-overlay')!;
          if (overlay.dataset.step === '1' && overlay.dataset.ready === 'true')
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
          return overlay.dataset.step;
        }),
      { timeout: 15000 },
    )
    .toBe('2');
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const overlay = document.querySelector<HTMLElement>('.tutorial-overlay')!;
          if (overlay.dataset.step === '2' && overlay.dataset.ready === 'true') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
            if (overlay.dataset.step === '3')
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
          }
          return overlay.dataset.step;
        }),
      { timeout: 15000 },
    )
    .toBe('4');
  await page.getByRole('button', { name: 'Continue to the journey' }).click();
  await expect(tutorial).toBeHidden();
  await expect(page.locator('#bPlay')).toBeVisible();
  const before = await page.evaluate(() => ({
    meta: JSON.parse(localStorage.getItem('issen.meta')!),
    stats: JSON.parse(localStorage.getItem('issen.stats')!),
  }));
  expect(before.meta.tutorial).toBe('completed');
  expect(before.meta.embers).toBe(0);
  expect(before.meta.bossMilestone).toBe(0);
  expect(before.stats.runs).toBe(1);
  await page.reload();
  await page.locator('#bTutorial').click();
  await expect(tutorial).toBeVisible();
  await page.getByRole('button', { name: 'Skip tutorial' }).click();
  await expect(tutorial).toBeHidden();
  const after = await page.evaluate(() => ({
    meta: JSON.parse(localStorage.getItem('issen.meta')!),
    stats: JSON.parse(localStorage.getItem('issen.stats')!),
  }));
  expect(after.meta.tutorial).toBe('skipped');
  expect(after.meta.embers).toBe(0);
  expect(after.meta.bossMilestone).toBe(0);
  expect(after.stats.runs).toBe(1);
});

test('isolated tutorial teaches cuts, timing and a boss opening without save writes', async ({
  page,
}) => {
  await page.goto('/');
  await page.evaluate(async () => {
    const mainPath = document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src;
    (await import(mainPath)).dispose();
    const path = '/src/ui/screens/tutorial.ts';
    const { createTutorial } = await import(path);
    const root = document.createElement('div');
    document.body.append(root);
    const state = window as typeof window & {
      tutorial: ReturnType<typeof createTutorial>;
      result?: string;
      saveBefore?: string;
    };
    state.saveBefore = JSON.stringify(localStorage);
    state.tutorial = createTutorial(root, (result: string) => {
      state.result = result;
    });
    state.tutorial.start();
  });
  const tutorial = page.locator('.tutorial-overlay');
  await page.keyboard.press('ArrowLeft');
  await expect(tutorial).toHaveAttribute('data-step', '0');
  await page.keyboard.press('ArrowRight');
  await expect(tutorial).toHaveAttribute('data-step', '1');
  // Observe the live cue and dispatch in the same browser task: cross-process
  // scheduling under parallel workers must not consume the practice window.
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const overlay = document.querySelector<HTMLElement>('.tutorial-overlay')!;
          if (overlay.dataset.step === '1' && overlay.dataset.ready === 'true')
            window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowUp' }));
          return overlay.dataset.step;
        }),
      { timeout: 15000 },
    )
    .toBe('2');
  await expect
    .poll(
      async () =>
        page.evaluate(() => {
          const overlay = document.querySelector<HTMLElement>('.tutorial-overlay')!;
          if (overlay.dataset.step === '2' && overlay.dataset.ready === 'true') {
            window.dispatchEvent(new KeyboardEvent('keydown', { key: ' ' }));
            if (overlay.dataset.step === '3')
              window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft' }));
          }
          return overlay.dataset.step;
        }),
      { timeout: 15000 },
    )
    .toBe('4');
  await expect(tutorial).toHaveAttribute('data-step', '4');
  await page.getByRole('button', { name: 'Continue to the journey' }).click();
  await expect(tutorial).toBeHidden();
  expect(
    await page.evaluate(() => {
      const state = window as typeof window & { result?: string; saveBefore?: string };
      return { result: state.result, unchanged: state.saveBefore === JSON.stringify(localStorage) };
    }),
  ).toEqual({ result: 'completed', unchanged: true });
  await page.evaluate(() => (window as any).tutorial.start());
  await page.keyboard.press('Escape');
  expect(await page.evaluate(() => (window as any).result)).toBe('skipped');
  await page.evaluate(() => (window as any).tutorial.dispose());
  await expect(tutorial).toHaveCount(0);
});
