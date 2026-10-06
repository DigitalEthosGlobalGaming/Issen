import { expect, test } from '@playwright/test';

test('PBR sword atlas responds to a moving light and keeps transparent coverage', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkSwordRenderer } = await import('/src/rendering/figures/ink-sword.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { setSceneLighting } = await import('/src/rendering/scene-material.ts');
    const { BLADE_RECIPES } = await import('/src/rendering/figures/blade-recipes.ts');
    const sword = createInkSwordRenderer(document);
    await sword.prepare();
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 200;
    canvas.id = 'sword-lighting-test';
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas);
    const copy = document.createElement('canvas');
    copy.width = 800;
    copy.height = 200;
    const read = copy.getContext('2d')!;
    function render(x: number, y: number, enabled = true, id = 'steel', angle = 0) {
      painter.begin();
      setSceneLighting(painter, {
        materialLighting: enabled ? 1 : 0,
        ambient: [0.08, 0.08, 0.08],
        directional: [0, 0, 0],
        direction: [0, 0, 1],
        points: [{ x, y, z: 100, radius: 1300, intensity: 4, color: [1, 0.85, 0.6] }],
      });
      painter.translate(150, 100);
      painter.scale(900, 900);
      const drawn = sword.draw(painter, 0, 0, angle, {} as any, { len: 0.65 }, id);
      painter.flush();
      read.clearRect(0, 0, 800, 200);
      read.drawImage(canvas, 0, 0);
      return { drawn, pixels: [...read.getImageData(0, 0, 800, 200).data] };
    }
    const left = render(250, 0),
      right = render(750, 180),
      unlit = render(250, 0, false);
    let changed = 0,
      coverageMismatch = 0,
      comparisonChanged = 0;
    for (let i = 0; i < left.pixels.length; i += 4) {
      if (left.pixels[i + 3] !== right.pixels[i + 3] || left.pixels[i + 3] !== unlit.pixels[i + 3])
        coverageMismatch++;
      if (left.pixels[i + 3]! > 240) {
        if (Math.abs(left.pixels[i]! - right.pixels[i]!) > 8) changed++;
        if (Math.abs(left.pixels[i]! - unlit.pixels[i]!) > 8) comparisonChanged++;
      }
    }
    const allDrawn = Object.keys(BLADE_RECIPES).every((id) => render(400, 0, true, id, -0.1).drawn);
    render(400, 0);
    const snapshot = sword.snapshot();
    painter.dispose();
    sword.dispose();
    return { changed, coverageMismatch, comparisonChanged, allDrawn, snapshot };
  });
  expect(errors).toEqual([]);
  expect(result.snapshot.pbrReady).toBe(true);
  expect(result.allDrawn).toBe(true);
  expect(result.coverageMismatch).toBe(0);
  expect(result.changed).toBeGreaterThan(100);
  expect(result.comparisonChanged).toBeGreaterThan(100);
});

test('tilde opens lighting controls and edits remain session-only', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.goto('/');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer', 'ink', { timeout: 30000 });
  const saved = await page.evaluate(() => localStorage.getItem('issen.settings'));
  await page.keyboard.press('Backquote');
  const panel = page.getByRole('complementary', { name: 'Lighting debug' });
  await expect(panel).toBeVisible();
  await page.getByLabel('Light X', { exact: true }).fill('0.25');
  await page.getByLabel('Light Y', { exact: true }).fill('0.6');
  await page.getByLabel('Light intensity', { exact: true }).fill('5');
  const marker = page.getByRole('button', { name: 'Drag light position' });
  const bounds = await page.locator('#c').boundingBox();
  const lightBounds = await marker.boundingBox();
  expect(lightBounds!.x + lightBounds!.width / 2).toBeCloseTo(bounds!.x + bounds!.width * 0.25, 0);
  await page.mouse.move(
    lightBounds!.x + lightBounds!.width / 2,
    lightBounds!.y + lightBounds!.height / 2,
  );
  await page.mouse.down();
  await page.mouse.move(bounds!.x + bounds!.width * 0.12, bounds!.y + bounds!.height * 0.7);
  await page.mouse.up();
  await expect(page.getByLabel('Light X', { exact: true })).toHaveValue('0.12');
  await page.getByLabel('Lighting enabled', { exact: true }).uncheck();
  expect(await page.evaluate(() => localStorage.getItem('issen.settings'))).toBe(saved);
  await page.screenshot({ path: testInfo.outputPath('lighting-debug.png') });
  await page.keyboard.press('Escape');
  await expect(panel).toBeHidden();
  await page.keyboard.press('Control+Backquote');
  await expect(panel).toBeHidden();
  await page.keyboard.press('Shift+Backquote');
  await expect(panel).toBeVisible();
  await page.getByRole('button', { name: 'Reset light', exact: true }).click();
  await expect(page.getByLabel('Light X', { exact: true })).toHaveValue('0.5');
  await page.keyboard.press('Backquote');
  await expect(panel).toBeHidden();
  await page.reload();
  await expect(page.locator('#c')).toHaveAttribute('data-renderer', 'ink', { timeout: 30000 });
  await page.keyboard.press('Backquote');
  await expect(page.getByLabel('Light intensity', { exact: true })).toHaveValue('2');
});
