import { expect, test } from '@playwright/test';

test('backtick toggles artwork, preserves a paused encounter, and ignores typing and repeats', async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
  });
  await page.route(/\/src\/game\.ts(?:\?|$)/, async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'frameLoop.start();',
        'window.__shortcutHarness = { G, randomState: () => runRandom.state() }; frameLoop.start();',
      ),
    });
  });
  await page.goto('/');
  const canvas = page.locator('#c');
  await expect(canvas).toHaveAttribute('data-renderer', 'classic');
  await page.keyboard.press('Backquote');
  await expect(canvas).toHaveAttribute('data-renderer-backend', 'layered');
  await page.keyboard.down('Backquote');
  await expect(canvas).toHaveAttribute('data-renderer', 'classic');
  await page.keyboard.down('Backquote');
  await expect(canvas).toHaveAttribute('data-renderer', 'classic');
  await page.keyboard.up('Backquote');
  await page.keyboard.press('Control+Backquote');
  await page.keyboard.press('Shift+Backquote');
  await expect(canvas).toHaveAttribute('data-renderer', 'classic');
  await page.evaluate(() => {
    const input = document.createElement('input');
    input.id = 'shortcut-test-input';
    document.body.append(input);
    input.focus();
  });
  await page.keyboard.press('Backquote');
  await expect(canvas).toHaveAttribute('data-renderer', 'classic');
  await page.locator('#shortcut-test-input').evaluate((el) => el.remove());
  await page.keyboard.press('Backquote');
  await expect(canvas).toHaveAttribute('data-renderer', 'ink');
  await page.reload();
  await expect(canvas).toHaveAttribute('data-renderer-backend', 'layered');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.keyboard.press('p');
  const snapshot = () =>
    page.evaluate(() => {
      const { G, randomState } = (window as any).__shortcutHarness;
      return {
        state: G.state,
        score: G.score,
        stage: G.stage,
        enemies: G.enemies.map((enemy: any) => enemy.t),
        random: randomState(),
        checkpoint: localStorage.getItem('issen.runCheckpoint'),
      };
    });
  const before = await snapshot();
  expect(before.state).toBe('paused');
  await page.keyboard.press('Backquote');
  await expect(canvas).toHaveAttribute('data-renderer', 'classic');
  expect(await snapshot()).toEqual(before);
  await page.locator('#bPauseOptions').click();
  await page.keyboard.press('Backquote');
  await expect(canvas).toHaveAttribute('data-renderer', 'classic');
});
