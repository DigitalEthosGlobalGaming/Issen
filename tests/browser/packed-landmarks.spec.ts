import { expect, test } from '@playwright/test';

test('packed landmark windows preserve logical placement, mirroring and contact fades', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { packedLandmarks } = await import('/src/rendering/environment/packed-landmarks.ts');
    const { default: manifest } = await import('/src/rendering/generated/landmarks/manifest.json');
    const { drawAtlasSprite } = await import('/src/rendering/environment/scene-kit.ts');
    const lease = packedLandmarks(document).acquireGroup('material-preview');
    await lease.ready;
    const stems: Record<string, string> = {
      woodland: 'woodland-landmarks-atlas',
      snowWoodland: 'snow-woodland-landmarks-atlas',
      stones: 'landmark-stones-atlas',
      bambooLandmarks: 'bamboo-landmarks-atlas',
      cherryLandmarks: 'cherry-landmarks-atlas',
    };
    const originals = new Map<string, HTMLImageElement>();
    const samples = [];
    for (const [id, metadata] of Object.entries(manifest.sprites) as [string, any][]) {
      const family = id.split('.')[1]!;
      let image = originals.get(family);
      if (!image) {
        image = new Image();
        image.src = `/src/rendering/environment/assets/${stems[family]}.png`;
        await image.decode();
        originals.set(family, image);
      }
      const sprite = lease.sprite(id)!;
      for (const flip of [false, true]) {
        const canvases = [document.createElement('canvas'), document.createElement('canvas')];
        const [sw, sh] = metadata.logicalSize;
        const anchorX = metadata.pivot[0] / sw,
          anchorY = metadata.pivot[1] / sh;
        const contexts = canvases.map((canvas) => {
          canvas.width = 256;
          canvas.height = 300;
          return canvas.getContext('2d')!;
        });
        const placement = {
          anchorX,
          anchorY,
          flip,
          alpha: 0.7,
          angle: 0.007,
          fadeFrom: anchorY - 0.1,
          fadeTo: anchorY + 0.005,
        };
        const [x, y, width, height] = metadata.sourceFrame;
        drawAtlasSprite(contexts[0]!, image, 0, 128, 250, 110, {
          ...placement,
          frame: { x, y, width, height },
        });
        const [px, py, pw, ph] = sprite.metadata.frame;
        drawAtlasSprite(contexts[1]!, sprite.colour, 0, 128, 250, 110, {
          ...placement,
          frame: { x: px, y: py, width: pw, height: ph },
          logicalSize: sprite.metadata.logicalSize,
          trim: sprite.metadata.trim,
        });
        const pixels = contexts.map((ctx) => ctx.getImageData(0, 0, 256, 300).data);
        let difference = 0,
          coverage = 0;
        for (let i = 0; i < pixels[0]!.length; i += 4) {
          const a = pixels[0]![i + 3]!,
            b = pixels[1]![i + 3]!;
          if (a || b) coverage++;
          difference += Math.abs(a - b);
          for (let c = 0; c < 3; c++)
            difference += Math.abs((pixels[0]![i + c]! * a) / 255 - (pixels[1]![i + c]! * b) / 255);
        }
        samples.push({
          id,
          flip,
          coverage,
          difference: difference / (Math.max(1, coverage) * 4 * 255),
        });
      }
    }
    lease.release();
    return samples;
  });
  expect(result).toHaveLength(40);
  for (const sample of result) {
    expect(sample.coverage, sample.id).toBeGreaterThan(0);
    expect(sample.difference, `${sample.id} mirrored=${sample.flip}`).toBeLessThan(0.003);
  }
});

test('local scene and preview share packed pages without requesting authoring landmark sheets', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createLocalEnvironmentRenderer } =
      await import('/src/rendering/environment/local-renderer.ts');
    const { packedLandmarks } = await import('/src/rendering/environment/packed-landmarks.ts');
    const scene = createLocalEnvironmentRenderer(document),
      preview = createLocalEnvironmentRenderer(document);
    await scene.prepare(0);
    await preview.prepare(4);
    const overlapping = packedLandmarks(document).snapshot();
    scene.dispose();
    const retained = packedLandmarks(document).snapshot();
    const drawn = await preview.compose({
      width: 180,
      height: 120,
      dpr: 1,
      stage: 4,
      time: 0,
      stageSeed: 424242,
      reducedMotion: true,
      reducedFlashes: true,
      lowQuality: true,
    });
    preview.dispose();
    return { overlapping, retained, drawn, released: packedLandmarks(document).snapshot() };
  });
  expect(result.drawn).toBe(true);
  expect(result.overlapping.references).toBeGreaterThan(result.retained.references);
  expect(result.retained.pages).toBeGreaterThan(0);
  expect(result.released.pages).toBe(0);
  expect(
    requests.filter((url) =>
      /\/assets\/(?:[^/]*landmarks-atlas|landmark-stones-atlas)\.png/.test(url),
    ),
  ).toEqual([]);
});
