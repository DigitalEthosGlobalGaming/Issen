import { expect, test } from '@playwright/test';

test.use({ hasTouch: true });

test('real mobile swipes find the title secret and explain its run-end reward', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.locator('#title').waitFor({ state: 'visible', timeout: 60000 });
  const touch = await page.context().newCDPSession(page);
  for (const [dx, dy] of [
    [0, -1],
    [0, -1],
    [0, 1],
    [0, 1],
    [-1, 0],
    [1, 0],
    [-1, 0],
    [1, 0],
  ]) {
    await touch.send('Input.dispatchTouchEvent', {
      type: 'touchStart',
      touchPoints: [{ x: 195, y: 180 }],
    });
    for (let distance = 6; distance <= 60; distance += 6) {
      await touch.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: [{ x: 195 + dx! * distance, y: 180 + dy! * distance }],
      });
    }
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  }
  await touch.detach();
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.stats') || '{}').konami),
  ).toBe(1);
  await expect(page.locator('#toast')).toContainText('End a run to claim Kōken');
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('issen.unlocks') || '[]').includes('koken'),
    ),
  ).toBe(false);
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await page.keyboard.press('p');
  await page.locator('#bEnd').click();
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('issen.unlocks') || '[]').includes('koken'),
    ),
  ).toBe(true);
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('issen.meta', JSON.stringify({ tutorial: 'skipped' }));
  });
});

test('twenty title taps record the Scarecrow secret through pointer input', async ({ page }) => {
  await page.goto('/');
  await page.locator('#title').waitFor({ state: 'visible', timeout: 60000 });
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
  await page.locator('#title').waitFor({ state: 'visible', timeout: 60000 });
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

test('repeating a found secret reports pending ownership until the reward is claimed', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('issen.stats', JSON.stringify({ konami: 1 })),
  );
  await page.goto('/');
  await page.locator('#title').waitFor({ state: 'visible', timeout: 60000 });
  for (const key of [
    'ArrowUp',
    'ArrowUp',
    'ArrowDown',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight',
    'ArrowLeft',
    'ArrowRight',
  ])
    await page.keyboard.press(key);
  await expect(page.locator('#toast')).toContainText('End a run to claim Kōken');
  await expect(page.locator('#toast')).not.toContainText('already yours');
});
