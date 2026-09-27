import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ tutorial: 'skipped' }));
  });
});

test('twenty title taps record the Scarecrow secret through pointer input', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const title = document.querySelector('#title')!;
    for (let tap = 0; tap < 20; tap++) {
      title.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        }),
      );
      title.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: 100, clientY: 100 }),
      );
    }
  });
  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!));
  expect(stats.scarecrow).toBe(1);
});

test('the title swipe sequence records Kōken through pointer input', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => {
    const title = document.querySelector('#title')!;
    for (const direction of ['up', 'up', 'down', 'down', 'left', 'right', 'left', 'right']) {
      const x = direction === 'left' ? 60 : direction === 'right' ? 140 : 100;
      const y = direction === 'up' ? 60 : direction === 'down' ? 140 : 100;
      title.dispatchEvent(
        new PointerEvent('pointerdown', {
          bubbles: true,
          pointerId: 1,
          clientX: 100,
          clientY: 100,
        }),
      );
      title.dispatchEvent(
        new PointerEvent('pointermove', { bubbles: true, pointerId: 1, clientX: x, clientY: y }),
      );
      title.dispatchEvent(
        new PointerEvent('pointerup', { bubbles: true, pointerId: 1, clientX: x, clientY: y }),
      );
    }
  });
  const stats = await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats')!));
  expect(stats.konami).toBe(1);
});
