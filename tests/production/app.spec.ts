import { expect, test } from '@playwright/test';

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
  await page.getByRole('button', { name: 'Done', exact: true }).click();
  await page.getByRole('button', { name: 'Draw your blade' }).click();
  await page.getByRole('button', { name: 'Begin', exact: true }).click();
  await page.keyboard.press('p');
  await page.getByRole('button', { name: 'End run', exact: true }).click();
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
