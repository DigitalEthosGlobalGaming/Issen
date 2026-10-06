import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('packed scenery windows preserve logical placement, mirroring and contact fades', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { packedScenery } = await import('/src/rendering/environment/packed-scenery.ts');
    const { default: manifest } = await import('/src/rendering/generated/scenery/manifest.json');
    const { drawAtlasSprite } = await import('/src/rendering/environment/scene-kit.ts');
    const { decodePackedBitmap } = await import('/src/rendering/packed-assets.ts');
    const lease = packedScenery(document).acquireGroup('material-preview');
    await lease.ready;
    const originals = new Map<string, ImageBitmap>();
    const samples = [];
    for (const [id, metadata] of Object.entries(manifest.sprites) as [string, any][]) {
      const family = id.split('.')[1]!;
      let image = originals.get(family);
      if (!image) {
        const source = new Image();
        source.src = `/src/rendering/environment/assets/${family}.png`;
        await source.decode();
        image = await decodePackedBitmap(document, source);
        originals.set(family, image);
      }
      const sprite = lease.sprite(id)!;
      const coldPixels = new Map<boolean, Uint8ClampedArray[]>();
      for (const effect of ['cold', 'texels', 'plain', 'atmosphere']) {
        for (const flip of [false, true]) {
          const canvases = [document.createElement('canvas'), document.createElement('canvas')];
          const [sw, sh] = metadata.logicalSize;
          const anchorX = metadata.pivot[0] / sw,
            anchorY = 0.94;
          const targetWidth = effect === 'texels' ? sw : 110;
          const canvasWidth = effect === 'texels' ? Math.ceil(sw) + 12 : 256;
          const canvasHeight = effect === 'texels' ? Math.ceil(sh) + 12 : 300;
          const targetX = effect === 'texels' ? sw * anchorX + 6 : 128;
          const targetY = effect === 'texels' ? sh * anchorY + 6 : 250;
          const contexts = canvases.map((canvas) => {
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            const ctx = canvas.getContext('2d')!;
            if (effect === 'texels') ctx.imageSmoothingEnabled = false;
            return ctx;
          });
          const placement = {
            anchorX,
            anchorY,
            flip,
            alpha: effect === 'atmosphere' ? 0.7 : 1,
            angle: effect === 'texels' ? 0 : 0.007,
            ...(effect === 'atmosphere'
              ? { fadeFrom: anchorY - 0.1, fadeTo: anchorY + 0.005 }
              : {}),
          };
          const [x, y, width, height] = metadata.sourceFrame;
          drawAtlasSprite(contexts[0]!, image, 0, targetX, targetY, targetWidth, {
            ...placement,
            frame: { x, y, width, height },
          });
          const [px, py, pw, ph] = sprite.metadata.frame;
          drawAtlasSprite(contexts[1]!, sprite.colour, 0, targetX, targetY, targetWidth, {
            ...placement,
            frame: { x: px, y: py, width: pw, height: ph },
            logicalSize: sprite.metadata.logicalSize,
            trim: sprite.metadata.trim,
          });
          const pixels = contexts.map(
            (ctx) => ctx.getImageData(0, 0, canvasWidth, canvasHeight).data,
          );
          if (effect === 'cold') coldPixels.set(flip, pixels);
          let difference = 0,
            coverage = 0;
          for (let i = 0; i < pixels[0]!.length; i += 4) {
            const a = pixels[0]![i + 3]!,
              b = pixels[1]![i + 3]!;
            if (a || b) coverage++;
            difference += Math.abs(a - b);
            for (let c = 0; c < 3; c++)
              difference += Math.abs(
                (pixels[0]![i + c]! * a) / 255 - (pixels[1]![i + c]! * b) / 255,
              );
          }
          samples.push({
            id,
            effect,
            flip,
            coverage,
            difference: difference / (Math.max(1, coverage) * 4 * 255),
            ...(effect === 'plain'
              ? {
                  coldToWarm: pixels.map((data, index) => {
                    const cold = coldPixels.get(flip)![index]!;
                    let change = 0;
                    for (let i = 0; i < data.length; i += 4) {
                      change += Math.abs(data[i + 3]! - cold[i + 3]!);
                      for (let c = 0; c < 3; c++)
                        change += Math.abs(
                          (data[i + c]! * data[i + 3]!) / 255 - (cold[i + c]! * cold[i + 3]!) / 255,
                        );
                    }
                    return change / (Math.max(1, coverage) * 4 * 255);
                  }),
                }
              : {}),
          });
        }
      }
    }
    lease.release();
    for (const image of originals.values()) image.close();
    return samples;
  });
  expect(result).toHaveLength(832);
  const report = testInfo.outputPath('scenery-numeric-comparison.json');
  await writeFile(report, JSON.stringify(result, null, 2));
  await testInfo.attach('scenery-numeric-comparison', {
    path: report,
    contentType: 'application/json',
  });
  for (const sample of result) {
    expect(sample.coverage, sample.id).toBeGreaterThan(0);
    if (sample.effect === 'texels') expect(sample.difference, `${sample.id} exact texels`).toBe(0);
    if (sample.effect === 'plain') {
      for (const change of sample.coldToWarm!)
        expect(change, `${sample.id} first-use versus warmed sampling`).toBeLessThan(0.003);
    }
    expect(sample.difference, `${sample.id} ${sample.effect} mirrored=${sample.flip}`).toBeLessThan(
      0.003,
    );
  }
});
