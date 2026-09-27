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
  await page.locator('#bTrials').click();
  await expect(page.locator('#trialsAccess')).toContainText('Reach wave 10 in Ronin Waves');
  await expect(page.locator('[data-trial]:disabled')).toHaveCount(6);
  await page.locator('#trials [data-back]').click();
  await page.locator('#bTutorial').click();
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
  await expect(page.locator('#testBadge')).toBeVisible();
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

test('built assets support startup, armory, a run, sharing, and landscape layout', async ({
  page,
}) => {
  const errors: string[] = [],
    requests: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('#title')).toHaveClass(/on/);
  await expect(page.locator('#app')).toHaveCount(1);
  await page.getByRole('button', { name: 'Armory', exact: true }).click();
  const rendered = await page.locator('#prevC').evaluate((canvas: HTMLCanvasElement) =>
    canvas
      .getContext('2d')!
      .getImageData(0, 0, canvas.width, canvas.height)
      .data.some((value) => value !== 0),
  );
  expect(rendered).toBe(true);
  await page.locator('#armory').getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Draw your blade' }).click();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.keyboard.press('p');
  await page.getByRole('button', { name: 'End run', exact: true }).click();
  await finishResults(page);
  await page.locator('#bShare').click();
  await expect
    .poll(() =>
      page
        .locator('#shareImg')
        .evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight]),
    )
    .toEqual([1080, 1350]);
  await page.setViewportSize({ width: 844, height: 390 });
  await expect(page.locator('#share')).toHaveClass(/on/);
  await page.locator('#share [data-back]').click();
  await page.locator('#bAgain').click();
  await expect(page.locator('#hud')).toHaveClass(/on/);
  expect(requests.some((url) => /\/assets\/.*\.js/.test(url))).toBe(true);
  expect(requests.some((url) => url.includes('/src/') || url.includes('/@vite/'))).toBe(false);
  expect(errors).toEqual([]);
});
