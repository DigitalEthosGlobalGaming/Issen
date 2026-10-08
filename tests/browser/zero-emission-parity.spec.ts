import { test, expect } from '@playwright/test';

test('omitted emission matches an explicit zero map across coverage and blend modes', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const results = await page.evaluate(async () => {
    const { createCachedMaterials, cachedMaterialContext, drawCachedImage, getCachedMaterial } =
      await import('/src/rendering/cached-materials.ts');
    const canvas = (colour: string) => {
      const result = document.createElement('canvas');
      result.width = result.height = 4;
      const g = result.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 4, 4);
      return result;
    };
    const image = async (source: HTMLCanvasElement) => {
      const result = new Image();
      result.src = source.toDataURL();
      await result.decode();
      return result;
    };
    const foreground = canvas('rgba(255,255,255,0.5)');
    const g = foreground.getContext('2d')!;
    g.clearRect(2, 0, 2, 4);
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 1, 4);
    const rear = await image(canvas('#fff')),
      front = await image(foreground);
    const base = {
      normal: { source: canvas('rgb(128,128,255)'), revision: 0 },
      surface: { source: canvas('rgb(200,0,255)'), revision: 0 },
      normalY: -1,
      lighting: 1,
      depth: 0,
      fog: 0,
      fogColor: [0, 0, 0] as const,
    };
    const emission = canvas('rgb(200,80,40)'),
      zero = canvas('#000');
    const render = (mode: GlobalCompositeOperation, omitted: boolean) => {
      const owner = createCachedMaterials();
      owner.bind(rear, () => ({ ...base, emissive: { source: emission, revision: 0 } }));
      owner.bind(front, () => ({
        ...base,
        ...(omitted ? {} : { emissive: { source: zero, revision: 0 } }),
      }));
      const target = canvas('#000'),
        g = cachedMaterialContext(target.getContext('2d')!);
      drawCachedImage(g, rear, [0, 0, 4, 4], 0, 0, 4, 4);
      g.globalCompositeOperation = mode;
      drawCachedImage(g, front, [0, 0, 4, 4], 0, 0, 4, 4);
      const result = [
        ...(getCachedMaterial(target)!.emissive!.source as HTMLCanvasElement)
          .getContext('2d')!
          .getImageData(0, 0, 4, 4).data,
      ];
      owner.dispose();
      return result;
    };
    return (
      [
        'source-over',
        'lighter',
        'multiply',
        'overlay',
        'destination-over',
        'source-in',
        'copy',
      ] as GlobalCompositeOperation[]
    ).map((mode) => ({ mode, explicit: render(mode, false), omitted: render(mode, true) }));
  });
  for (const result of results) expect(result.omitted, result.mode).toEqual(result.explicit);
  const additive = results.find((result) => result.mode === 'lighter')!;
  expect(additive.omitted.slice(0, 4)).toEqual([200, 80, 40, 255]);
});
