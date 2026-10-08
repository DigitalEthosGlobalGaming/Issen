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
  expect(result.covered).toEqual([0, 0, 0, 255]);
  expect(result.uncovered).toEqual([200, 80, 40, 255]);
});

test('zero-emission blade prepares without requesting an absent map', async ({ page }) => {
  const emissiveRequests: string[] = [];
  page.on('request', request => {
    if (request.url().includes('blade-profile-atlas_emissive')) emissiveRequests.push(request.url());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkSwordRenderer } = await import('/src/rendering/figures/ink-sword.ts');
    const renderer = createInkSwordRenderer(document);
    await renderer.prepare();
    const snapshot = { ready: renderer.ready, ...renderer.snapshot() };
    renderer.dispose();
    return snapshot;
  });
  expect(result.ready).toBe(true);
  expect(result.pbrReady).toBe(true);
  expect(result.loaded).not.toContain('emissive');
  expect(emissiveRequests).toEqual([]);
});
