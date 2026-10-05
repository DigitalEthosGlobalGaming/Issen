import { expect, test } from '@playwright/test';

async function finishResults(page: import('@playwright/test').Page) {
  for (let i = 0; i < 4 && (await page.locator('#runResultSequence').isVisible()); i++)
    await page.locator('#runResultSequence').click();
}

test('built assets include fresh onboarding, Template and isolated testing tools', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.addInitScript(() => localStorage.removeItem('issen.meta'));
  await page.goto('/');
  await expect(page.locator('#bTrials')).toBeHidden();
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: 'Tutorial', exact: true }).click();
  await expect(page.locator('.tutorial-overlay')).toBeVisible();
  await page.getByRole('button', { name: 'Skip tutorial' }).click();
  await expect(page.locator('#title')).toHaveClass(/on/);
  await page.locator('#bPlay').click();
  await expect(page.locator('[data-v="rush"]')).toBeHidden();
  await page.locator('#bBegin').click();
  await expect(page.locator('.tutorial-overlay')).toBeHidden();
  await page.keyboard.press('p');
  await page.locator('#bEnd').click();
  await finishResults(page);
  await page.locator('#bMenu').click();
  await page.locator('#bTemplate').click();
  await expect(page.locator('#templateContent')).toContainText('0 Embers');
  await expect(page.getByRole('button', { name: 'Donate 100 Embers' })).toBeDisabled();
  await page.locator('#template [data-back]').click();
  await page.keyboard.press('Control+Shift+A');
  await page.getByRole('button', { name: 'Enter test profile', exact: true }).click();
  await expect(page.locator('#testBadge')).toBeVisible({ timeout: 30000 });
  expect(errors).toEqual([]);
});

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

test('built assets support startup, armory, a run, and landscape layout', async ({ page }) => {
  const errors: string[] = [],
    requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('#title')).toHaveClass(/on/);
  await expect(page.locator('#app')).toHaveCount(1);
  await page.getByRole('button', { name: 'Armory', exact: true }).click();
  await expect(page.locator('#prevC')).toHaveAttribute('data-graphics-backend', 'pixi');
  // Capture the browser's composited surface: WebGL cannot acquire a 2D context,
  // and its drawing buffer need not be preserved between animation frames.
  const capture = await page.locator('#prevC').screenshot();
  const colors = await page.evaluate(async (data) => {
    const image = new Image();
    image.src = `data:image/png;base64,${data}`;
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = image.width;
    canvas.height = image.height;
    const context = canvas.getContext('2d')!;
    context.drawImage(image, 0, 0);
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
    const colors = new Set<number>();
    for (let i = 0; i < pixels.length; i += 4)
      colors.add((pixels[i]! << 16) | (pixels[i + 1]! << 8) | pixels[i + 2]!);
    return colors.size;
  }, capture.toString('base64'));
  expect(colors).toBeGreaterThan(100);
  await page.locator('#armory').getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Draw your blade' }).click();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.keyboard.press('p');
  await page.getByRole('button', { name: 'End run', exact: true }).click();
  await finishResults(page);
  await expect(page.locator('#bShare, #share')).toHaveCount(0);
  await page.setViewportSize({ width: 844, height: 390 });
  await page.locator('#bAgain').click();
  await expect(page.locator('#hud')).toHaveClass(/on/);
  expect(requests.some((url) => /\/assets\/.*\.js/.test(url))).toBe(true);
  expect(requests.some((url) => url.includes('/src/') || url.includes('/@vite/'))).toBe(false);
  expect(errors).toEqual([]);
});
