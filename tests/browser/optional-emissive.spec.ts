import { test, expect } from '@playwright/test';

test('an opaque non-emitting sprite occludes cached emission while transparent pixels retain it', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createCachedMaterials, cachedMaterialContext, drawCachedImage, getCachedMaterial } =
      await import('/src/rendering/cached-materials.ts');
    const make = (colour: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 4;
      const g = canvas.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 4, 4);
      return canvas;
    };
    const image = async (canvas: HTMLCanvasElement) => {
      const img = new Image();
      img.src = canvas.toDataURL();
      await img.decode();
      return img;
    };
    const colour = make('#ffffff');
    const rear = await image(colour);
    colour.getContext('2d')!.clearRect(2, 0, 2, 4);
    const front = await image(colour);
    const normal = make('rgb(128,128,255)'),
      surface = make('rgb(200,0,255)'),
      emission = make('rgb(200,80,40)');
    const controller = createCachedMaterials();
    const base = {
      normal: { source: normal, revision: 0 },
      surface: { source: surface, revision: 0 },
      normalY: -1,
      lighting: 1,
      depth: 0,
      fog: 0,
      fogColor: [0, 0, 0] as const,
    };
    controller.bind(rear, () => ({ ...base, emissive: { source: emission, revision: 0 } }));
    controller.bind(front, () => base);
    const target = make('#000000');
    const g = cachedMaterialContext(target.getContext('2d')!);
    drawCachedImage(g, rear, [0, 0, 4, 4], 0, 0, 4, 4);
    drawCachedImage(g, front, [0, 0, 4, 4], 0, 0, 4, 4);
    const material = getCachedMaterial(target)!;
    const pixels = (material.emissive!.source as HTMLCanvasElement)
      .getContext('2d')!
      .getImageData(0, 0, 4, 4).data;
    const result = { covered: [...pixels.slice(0, 4)], uncovered: [...pixels.slice(12, 16)] };
    controller.dispose();
    return result;
  });
  expect(result.covered).toEqual([0, 0, 0, 0]);
  expect(result.uncovered).toEqual([200, 80, 40, 255]);
});
