import { expect, test } from '@playwright/test';

test('Graphics shows delivered cadence at the selected cap and persists the gameplay counter', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    if (!localStorage.getItem('issen.meta'))
      localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' }));
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Graphics/ })
    .click();
  await page.getByLabel('Frame rate', { exact: true }).selectOption('30');
  await page.getByLabel('Show FPS counter', { exact: true }).check();
  await expect(page.locator('html')).toHaveAttribute('data-graphics-open', 'true');
  await expect
    .poll(async () => {
      const text = await page.locator('#graphicsFrameMetrics').textContent();
      const match = text?.match(/^(\d+) FPS · ([\d.]+) ms$/);
      return !!match && Number(match[1]) > 0 && Number(match[1]) <= 35 && Number(match[2]) >= 28;
    })
    .toBe(true);
  await expect(page.locator('#fpsCounter')).toBeHidden();
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.locator('#bOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Graphics/ })
    .click();
  await expect(page.getByLabel('Show FPS counter', { exact: true })).toBeChecked();
  await expect(page.getByLabel('Frame rate', { exact: true })).toHaveValue('30');
  await page.locator('#options').getByRole('button', { name: 'Back', exact: true }).click();
  await page.locator('#options').getByRole('button', { name: 'Done', exact: true }).click();
  await expect(page.locator('html')).toHaveAttribute('data-graphics-open', 'false');
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  await expect(page.locator('#fpsCounter')).toBeVisible();
  await expect(page.locator('#fpsCounter')).toHaveText(/^\d+ FPS · [\d.]+ ms$/);
  await page.screenshot({ path: testInfo.outputPath('gameplay-fps-counter.png') });
  await page.locator('#pauseBtn').click();
  await page.locator('#bPauseOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Graphics/ })
    .click();
  await page.getByLabel('Show FPS counter', { exact: true }).uncheck();
  await expect(page.locator('#fpsCounter')).toBeHidden();
  const selected = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.settings')!).graphics,
  );
  expect(selected).toMatchObject({ preset: 'custom', fpsCounter: false, frameRate: 30 });
});
