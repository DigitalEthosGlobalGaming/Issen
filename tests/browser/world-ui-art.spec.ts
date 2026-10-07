import { expect, test } from '@playwright/test';

test('nine-slice seals preserve texture, tint and transparent corners at multiple shapes', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#app')).toHaveCount(1);
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const path = '/src/rendering/ui-art.ts';
    const { setSealTextures, drawSeal, drawCrestSprite } = await import(path);
    await setSealTextures(document.querySelector('#app')!, '#a3271d');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 100;
    const g = await createTestDrawing(canvas);
    const frames = [];
    for (const material of ['paper', 'wood', 'metal', 'silk', 'stone']) {
      g.clearRect(0, 0, 100, 100);
      drawSeal(g, material, '#a3271d', 0, 0, 100, 64);
      const pixels = g.getImageData(0, 0, 100, 64).data;
      const center = [...g.getImageData(50, 32, 1, 1).data];
      frames.push({
        corner: pixels[3],
        center,
        texture: new Set(Array.from(pixels).filter((_, i) => i % 4 === 0)).size,
      });
    }
    g.clearRect(0, 0, 100, 100);
    drawCrestSprite(g, 'tomoe', 50, 50, 28);
    const crest = g.getImageData(0, 0, 100, 100).data.some((value, i) => i % 4 === 3 && value > 0);
    return {
      frames,
      crest,
      transform: g.getTransform().isIdentity,
      source: document.querySelector('#app')!.style.getPropertyValue('--seal-paper'),
    };
  });
  for (const frame of result.frames) {
    expect(frame.corner).toBe(0);
    expect(frame.center[3]).toBe(255);
    expect(frame.center[0]).toBeGreaterThan(frame.center[1]);
    expect(frame.texture).toBeGreaterThan(5);
  }
  expect(result.crest).toBe(true);
  expect(result.transform).toBe(true);
  expect(result.source).toContain('data:image/png');
});
