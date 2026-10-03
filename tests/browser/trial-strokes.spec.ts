import { expect, test } from '@playwright/test';

test('completed Trials have a stable decorative stroke behind Replay, including after reload', async ({
  page,
}) => {
  await page.route('https://fonts.googleapis.com/**', (route) =>
    route.fulfill({ body: '', contentType: 'text/css' }),
  );
  await page.addInitScript(() => {
    localStorage.setItem('issen.stats', JSON.stringify({ roninWave: 10 }));
    localStorage.setItem(
      'issen.trials',
      JSON.stringify({ completed: ['demon-mirror', 'true-edge'] }),
    );
  });
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  for (let pass = 0; pass < 2; pass++) {
    await page.locator('#bTrials').click();
    const complete = page.locator('[data-trial="demon-mirror"]');
    const card = complete.locator('..');
    await expect(card).toHaveClass(/trial-completed/);
    await expect(complete).toHaveAttribute('aria-description', 'Trial completed');
    await expect(complete).toHaveText('Replay');
    await expect(page.locator('[data-trial="unbroken"]').locator('..')).not.toHaveClass(
      /trial-completed/,
    );
    const paint = await card.evaluate((el) => ({
      image: getComputedStyle(el, '::before').backgroundImage,
      opacity: getComputedStyle(el, '::before').opacity,
    }));
    expect(paint.image).toContain('ui-strokes-atlas');
    expect(paint.opacity).toBe('0.28');
    if (!pass) await page.reload({ waitUntil: 'domcontentloaded' });
  }
});
