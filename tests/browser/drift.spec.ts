import { test, expect } from '@playwright/test';

test('drift options, shortcut and all stage mixtures render and persist', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/');
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites');
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: 'Display and Accessibility', exact: false }).click();
  await page.getByLabel('Drifting leaves', { exact: true }).selectOption('original');
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'original');
  await page.keyboard.press('Backquote');
  await expect(page.getByLabel('Drifting leaves', { exact: true })).toHaveValue('sprites');
  await page.keyboard.press('Shift+Backquote');
  await expect(page.getByLabel('Drifting leaves', { exact: true })).toHaveValue('original');
  await page.reload();
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'original');
  await page.locator('#title .t-k').click({ clickCount: 3 });
  await expect(page.locator('#cinematic')).toBeVisible();
  await page.keyboard.press('Backquote');
  await expect(page.getByLabel('Preview debris')).toHaveValue('sprites');
  for (let stage = 0; stage < 9; stage++) {
    await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', String(stage));
    for (const mode of ['original', 'shape', 'sprites']) {
      await page.getByLabel('Preview debris').selectOption(mode);
      await expect(page.locator('#c')).toHaveAttribute('data-debris', mode);
    }
    if (stage < 8) await page.getByRole('button', { name: 'Next scene' }).click();
  }
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites');
  expect(errors).toEqual([]);
});

test('all 24 atlas frames paint and reusable geometry matches the original', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites');
  const result = await page.evaluate(async () => {
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { DRIFT_SPRITES } = await import('/src/rendering/scene/drift-catalog.ts');
    const renderer = createDriftRenderer();
    await renderer.prepare();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const g = canvas.getContext('2d', { willReadFrequently: true })!;
    const leaf = {
      x: 48,
      y: 48,
      z: 1,
      s: 20,
      rot: 0.7,
      vr: 1,
      fl: 0.3,
      vf: 1,
      vy: 1,
      ph: 1,
      col: '#242321',
    };
    function paint(mode: 'original' | 'shape' | 'sprites', sprite?: string) {
      g.clearRect(0, 0, 96, 96);
      g.save();
      g.translate(48, 48);
      g.rotate(leaf.rot);
      g.scale(1, Math.cos(leaf.fl));
      g.fillStyle = leaf.col;
      renderer.mode = mode;
      renderer.draw(g, { ...leaf, sprite });
      g.restore();
      return g.getImageData(0, 0, 96, 96).data;
    }
    const coverage = DRIFT_SPRITES.map(
      (sprite) => paint('sprites', sprite.id).filter((v, i) => i % 4 === 3 && v > 16).length,
    );
    const original = paint('original'),
      shape = paint('shape');
    let alphaError = 0,
      totalAlpha = 0;
    for (let i = 3; i < original.length; i += 4) {
      alphaError += Math.abs(original[i] - shape[i]);
      totalAlpha += original[i];
    }
    renderer.dispose();
    return { coverage, relativeError: alphaError / totalAlpha };
  });
  expect(result.coverage).toHaveLength(24);
  expect(Math.min(...result.coverage)).toBeGreaterThan(50);
  expect(result.relativeError).toBeLessThan(0.03);
});
