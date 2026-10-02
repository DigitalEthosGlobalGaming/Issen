import { expect, test } from '@playwright/test';

test('Demon cinematic scene has varied scenery and directional swipe transitions', async ({
  page,
}, info) => {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  await page.locator('#title .t-k').click({ clickCount: 3 });
  await page.getByRole('button', { name: 'Previous scene', exact: true }).click();
  await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', '9');
  await expect(page.locator('#cinematic [role="status"]')).toContainText('Demon');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'demon-realm');
  expect(await page.locator('.cinematic-wipe').evaluate((el) => el.getAnimations().length)).toBe(1);
  await expect(page.locator('.cinematic-wipe')).toBeHidden();
  for (const [name, viewport] of [
    ['portrait', { width: 390, height: 844 }],
    ['landscape', { width: 844, height: 390 }],
  ] as const) {
    await page.setViewportSize(viewport);
    await expect
      .poll(() => page.locator('#c').evaluate((c: HTMLCanvasElement) => c.width / c.height > 1))
      .toBe(name === 'landscape');
    await page.screenshot({ path: info.outputPath(`demon-${name}.png`) });
  }
  const hashes = await page.evaluate(async () => {
    const { createDemonRealmRenderer } = await import('/src/rendering/environment/demon-realm.ts');
    const renderer = createDemonRealmRenderer(document);
    const canvas = document.createElement('canvas');
    canvas.width = 844;
    canvas.height = 390;
    const g = canvas.getContext('2d')!;
    await new Promise((resolve) => setTimeout(resolve, 100));
    const draw = (seed: number) => {
      renderer.draw(g, 844, 390, 0, true, seed);
      return canvas.toDataURL();
    };
    const values = [draw(123), draw(123), draw(456)];
    renderer.dispose();
    return values;
  });
  expect(hashes[0]).toBe(hashes[1]);
  expect(hashes[0]).not.toBe(hashes[2]);
  await page.reload();
  await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', '9');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'demon-realm');
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await expect(page.locator('#c')).toHaveAttribute('data-renderer-backend', 'layered');
});

test('reduced motion changes cinematic scenes immediately without the swipe overlay', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('issen.settings', JSON.stringify({ version: 1, reducedMotion: 'on' })),
  );
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  await page.locator('#title .t-k').click({ clickCount: 3 });
  await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', '1');
  await expect(page.locator('.cinematic-wipe')).toBeHidden();
});
