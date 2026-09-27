import { expect, test } from '@playwright/test';

test('guided prompts keep reading separate from the action and fit portrait view', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.evaluate(async () => {
    const mainPath = document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src;
    (await import(mainPath)).dispose();
    const { createGuidedLessons } = await import('/src/game/onboarding/guided-lessons.ts');
    const state = window as typeof window & {
      guided?: ReturnType<typeof createGuidedLessons>;
      guidedSaved?: unknown;
      guidedFrozen?: boolean;
    };
    state.guided = createGuidedLessons(
      document.body,
      null,
      (value: unknown) => {
        state.guidedSaved = value;
      },
      (frozen: boolean) => {
        state.guidedFrozen = frozen;
      },
    );
    state.guided.startOrder();
  });
  const overlay = page.locator('.guided-overlay');
  await expect(overlay).toBeVisible();
  await expect(page.locator('.guided-continue')).toHaveCSS('min-height', '44px');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
  await page.keyboard.press('Space');
  await expect(page.getByRole('heading', { name: 'Cut the front enemy' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).guidedFrozen)).toBe(true);
  expect(await page.evaluate(() => (window as any).guided.swipe('up', 'left'))).toBe(true);
  expect(await page.evaluate(() => (window as any).guidedSaved)).toBeUndefined();
  await page.evaluate(() => {
    const guided = (window as any).guided;
    if (!guided.swipe('left', 'left')) guided.orderSucceeded();
  });
  await expect(overlay).toBeHidden();
  expect(await page.evaluate(() => (window as any).guidedSaved)).toEqual({
    order: true,
    bossParry: false,
  });
  await page.evaluate(() => (window as any).guided.dispose());
});
