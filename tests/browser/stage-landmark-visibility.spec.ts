import { expect, test } from '@playwright/test';

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 768, height: 1024 },
]) {
  test(`repeat visits visibly change all nine backgrounds ${viewport.width}`, async ({ page }) => {
    test.setTimeout(90000);
    await page.setViewportSize(viewport);
    // Static same-origin page isolates scenery from weather, figures and film grain.
    await page.goto('/privacy/index.html');
    const changes = await page.evaluate(async ({ width, height }) => {
      // @ts-expect-error Browser imports Vite's source module directly.
      const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
      const renderer = createEnvironmentRenderer(document);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const context = canvas.getContext('2d')!;
      const results: number[] = [];
      try {
        for (let stage = 0; stage < 9; stage++) {
          await renderer.prepare(stage);
          const pixels: Uint8ClampedArray[] = [];
          for (const stageSeed of [0, 1]) {
            context.clearRect(0, 0, width, height);
            if (
              !renderer.draw(context, {
                width,
                height,
                dpr: 1,
                time: 0,
                stage,
                stageSeed,
                reducedMotion: true,
                reducedFlashes: true,
                lowQuality: false,
              })
            )
              throw new Error(`Scene ${stage} did not load`);
            pixels.push(context.getImageData(0, 0, width, height).data);
          }
          let changed = 0;
          for (let i = 0; i < pixels[0]!.length; i += 4) {
            if (
              Math.max(
                Math.abs(pixels[0]![i]! - pixels[1]![i]!),
                Math.abs(pixels[0]![i + 1]! - pixels[1]![i + 1]!),
                Math.abs(pixels[0]![i + 2]! - pixels[1]![i + 2]!),
              ) > 24
            )
              changed++;
          }
          results.push(changed / (width * height));
        }
      } finally {
        renderer.dispose();
      }
      return results;
    }, viewport);
    expect(changes).toHaveLength(9);
    for (const [stage, fraction] of changes.entries()) {
      // Courtyard architecture deliberately occludes part of its distant landmarks.
      expect(fraction, `Scene ${stage} should change a visible area`).toBeGreaterThan(
        stage === 6 ? 0.015 : 0.02,
      );
    }
  });
}
