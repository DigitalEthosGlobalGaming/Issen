import { expect, test } from '@playwright/test';

test('absent emission creates no cached plane and covers emission behind it', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createCachedMaterials, drawCachedImage, getCachedMaterial } =
      await import('/src/rendering/cached-materials.ts');
    const pixel = document.createElement('canvas');
    pixel.width = pixel.height = 2;
    const g = pixel.getContext('2d')!;
    g.fillStyle = 'white';
    g.fillRect(0, 0, 2, 2);
    const image = new Image();
    image.src = pixel.toDataURL();
    await image.decode();
    const cached = createCachedMaterials();
    let emitting = false;
    cached.bind(image, (frame) => ({
      normal: { source: pixel, revision: 0, frame },
      surface: { source: pixel, revision: 0, frame },
      emissive: emitting ? { source: pixel, revision: 0, frame } : undefined,
      normalY: -1,
      lighting: 1,
      depth: 0,
      fog: 0,
      fogColor: [0, 0, 0],
    }));
    const target = document.createElement('canvas');
    target.width = target.height = 2;
    const targetContext = target.getContext('2d')!;
    drawCachedImage(targetContext, image, [0, 0, 2, 2], 0, 0, 2, 2);
    const absent = getCachedMaterial(target)!.emissive === undefined;
    emitting = true;
    drawCachedImage(targetContext, image, [0, 0, 2, 2], 0, 0, 2, 2);
    const plane = getCachedMaterial(target)!.emissive!.source as HTMLCanvasElement;
    const before = plane.getContext('2d')!.getImageData(0, 0, 1, 1).data[3];
    emitting = false;
    drawCachedImage(targetContext, image, [0, 0, 2, 2], 0, 0, 2, 2);
    const after = plane.getContext('2d')!.getImageData(0, 0, 1, 1).data[3];
    cached.dispose();
    return { absent, before, after };
  });
  expect(result).toEqual({ absent: true, before: 255, after: 0 });
});
