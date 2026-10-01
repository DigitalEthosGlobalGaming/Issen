import { test, expect } from '@playwright/test';

test('enemy tint cache survives fog variants and stays bounded through arbitrary palettes', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkEnemyRenderer } = await import('/src/rendering/figures/ink-enemy.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const { makeFig, EPOSE } = await import('/src/rendering/figures/model.ts');
    const renderer = createInkEnemyRenderer(document);
    await renderer.prepare();
    const canvas = document.createElement('canvas');
    const g = canvas.getContext('2d')!;
    const palette = createPalette();
    const env = {
      time: 0,
      wind: 0,
      width: 300,
      height: 150,
      palette: (fog: number) => palette.fog(fog, [100, 110, 120]),
    };
    const f = { back: false, d: makeFig(1), pose: EPOSE.left, fog: 0, pal: palette.robe('hai') };
    const read = CanvasRenderingContext2D.prototype.getImageData;
    let reads = 0;
    CanvasRenderingContext2D.prototype.getImageData = function (...args) {
      reads++;
      return read.apply(this, args);
    };
    try {
      for (let pass = 0; pass < 2; pass++)
        for (let i = 0; i < 5; i++) {
          f.fog = i / 4;
          renderer.drawPart(g, 'body', f, env);
        }
      const fogReads = reads;
      for (let i = 0; i < 120; i++) {
        f.pal = { ...palette.robe('hai'), robeD: `rgb(${i},20,30)`, robeL: `rgb(200,${i},180)` };
        renderer.drawPart(g, 'body', f, env);
      }
      const bounded = renderer.snapshot();
      renderer.dispose();
      return { fogReads, bounded, disposed: renderer.snapshot() };
    } finally {
      CanvasRenderingContext2D.prototype.getImageData = read;
      renderer.dispose();
    }
  });
  expect(result.fogReads).toBe(3); // Three cloth body parts, recolored once across five fog levels.
  expect(result.bounded.variantPixels + result.bounded.tonePixels).toBeLessThanOrEqual(8_000_000);
  expect(result.bounded.cachedParts).toBeLessThanOrEqual(192);
  expect(result.bounded.toneParts).toBeLessThanOrEqual(48);
  expect(result.disposed.variantPixels + result.disposed.tonePixels).toBe(0);
  expect(result.disposed.cachedParts + result.disposed.toneParts).toBe(0);
});
