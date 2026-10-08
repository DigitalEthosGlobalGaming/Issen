import { test, expect } from '@playwright/test';

test('only stage sprites remain, including legacy saves and every cinematic stage', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem('issen.settings', JSON.stringify({ version: 1, debrisStyle: 'original' })),
  );
  await page.goto('/');
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites');
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: 'Display and Accessibility', exact: false }).click();
  await expect(page.getByLabel('Drifting leaves', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites');
  await page.locator('#title .t-k').click({ clickCount: 3 });
  await expect(page.locator('#cinematic')).toBeVisible();
  await expect(page.getByLabel('Preview debris')).toHaveCount(0);
  for (let stage = 0; stage < 10; stage++) {
    await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', String(stage));
    await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites');
    if (stage < 9) await page.getByRole('button', { name: 'Next scene' }).click();
  }
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  expect(errors).toEqual([]);
});

test('all 32 stage sprite atlas frames paint', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { DRIFT_SPRITES } = await import('/src/rendering/scene/drift-catalog.ts');
    const { createLeafMotion } = await import('/src/rendering/scene/leaf-motion.ts');
    const motion = createLeafMotion();
    const renderer = createDriftRenderer();
    await renderer.prepare();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const g = await createTestDrawing(canvas);
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
      col: '#322321',
    };
    function paint(sprite?: string) {
      g.begin();
      const item = { ...leaf, sprite };
      motion.register(item);
      renderer.drawLeaves(g, {
        leaves: [item],
        front: false,
        motion,
        spriteMotion: true,
        scale: 1,
        width: 96,
        height: 96,
      });
      return g.getImageData(0, 0, 96, 96).data;
    }
    const coverage = DRIFT_SPRITES.map(
      (sprite) => paint(sprite.id).filter((v, i) => i % 4 === 3 && v > 16).length,
    );
    g.dispose();
    renderer.dispose();
    return { coverage };
  });
  expect(result.coverage).toHaveLength(32);
  expect(Math.min(...result.coverage)).toBeGreaterThan(50);
});
