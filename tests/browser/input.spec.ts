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
  });
});

test('pointer adapter emits one swipe, ignores cancelled taps and disposes listeners', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const modulePath = '/src/input/pointer.ts';
    const { bindPointer } = await import(modulePath);
    const canvas = document.createElement('canvas');
    document.body.appendChild(canvas);
    const events: string[] = [];
    const dispose = bindPointer(canvas, {
      activate: () => {},
      threshold: () => 20,
      swipe: (direction: string) => events.push(direction),
      tapDown: () => false,
      tap: () => events.push('tap'),
    });
    const send = (type: string, x = 0, y = 0) =>
      canvas.dispatchEvent(
        new PointerEvent(type, {
          pointerId: 1,
          clientX: x,
          clientY: y,
        }),
      );
    send('pointerdown');
    send('pointermove', 30);
    send('pointermove', 50);
    send('pointerup', 50);
    send('pointerdown');
    send('pointercancel');
    send('pointerdown');
    send('pointerup', 0, 15);
    send('pointerdown');
    send('pointerup');
    dispose();
    send('pointerdown');
    send('pointerup');
    canvas.remove();
    return events;
  });
  expect(result).toEqual(['right', 'down', 'tap']);
});
