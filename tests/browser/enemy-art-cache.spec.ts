import { test, expect } from '@playwright/test';

test('new enemy families stay isolated from authored bosses and share bounded caches', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkEnemyRenderer } = await import('/src/rendering/figures/ink-enemy.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const { makeFig, EPOSE } = await import('/src/rendering/figures/model.ts');
    const renderer = createInkEnemyRenderer(document);
    const ready = await renderer.prepare();
    const g = document.createElement('canvas').getContext('2d')!;
    const p = createPalette();
    const env = {
      time: 0,
      wind: 0,
      width: 300,
      height: 150,
      palette: (fog: number) => p.fog(fog, [100, 110, 120]),
    };
    const draw = CanvasRenderingContext2D.prototype.drawImage;
    const read = CanvasRenderingContext2D.prototype.getImageData;
    let pixelReads = 0;
    CanvasRenderingContext2D.prototype.getImageData = function (...args) {
      pixelReads++;
      return read.apply(this, args);
    };
    const sources = new Set<string>();
    CanvasRenderingContext2D.prototype.drawImage = function (...args) {
      if (args[0] instanceof HTMLImageElement) sources.add(args[0].src.split('/').pop()!);
      return draw.apply(this, args);
    };
    try {
      const boss = { back: false, d: makeFig(1), pose: EPOSE.left, fog: 0, variant: 'kabuto' };
      renderer.drawPart(g, 'body', boss, env);
      renderer.drawPart(g, 'head', boss, env);
      const bossSources = [...sources];
      sources.clear();
      for (let seed = 0; seed < 80; seed++) {
        const f = {
          back: false,
          varied: true,
          d: makeFig(seed),
          pose: EPOSE.left,
          fog: (seed % 5) / 4,
        };
        for (const part of ['body', 'head', 'arms', 'hands'] as const)
          renderer.drawPart(g, part, f, env);
      }
      const variedSources = [...sources],
        snapshot = renderer.snapshot();
      // A simultaneous encounter-sized working set must stay warm across pose/fog changes.
      const workingSet = Array.from({ length: 6 }, (_, seed) => ({
        back: false,
        varied: true,
        d: makeFig(seed),
        pose: EPOSE.guard,
        fog: 0,
      }));
      const warm = () => {
        for (const f of workingSet)
          for (const part of ['body', 'head', 'arms', 'hands'] as const)
            renderer.drawPart(g, part, f, env);
      };
      warm();
      const readsAfterWarm = pixelReads;
      for (let pass = 0; pass < 5; pass++) {
        workingSet.forEach((f) => {
          f.fog = pass / 4;
          f.pose = EPOSE.up;
        });
        warm();
      }
      const repeatedReads = pixelReads - readsAfterWarm;
      renderer.dispose();
      return {
        ready,
        bossSources,
        variedSources,
        snapshot,
        repeatedReads,
        disposed: renderer.snapshot(),
      };
    } finally {
      CanvasRenderingContext2D.prototype.drawImage = draw;
      CanvasRenderingContext2D.prototype.getImageData = read;
      renderer.dispose();
    }
  });
  expect(result.ready).toBe(true);
  expect(result.repeatedReads).toBe(0);
  expect(result.snapshot.loaded.sort()).toEqual(['base', 'clothing', 'heads', 'variationHeads']);
  expect(result.bossSources.sort()).toEqual(['enemy-headwear-atlas.png', 'enemy-ronin-simple.png']);
  expect(result.variedSources).toContain('enemy-clothing-variants.png');
  expect(result.variedSources).toContain('enemy-headwear-variants.png');
  expect(result.variedSources).not.toContain('enemy-headwear-atlas.png');
  expect(result.snapshot.variantPixels + result.snapshot.tonePixels).toBeLessThanOrEqual(8_000_000);
  expect(result.snapshot.cachedParts).toBeLessThanOrEqual(192);
  expect(result.snapshot.toneParts).toBeLessThanOrEqual(48);
  expect(result.disposed.ready).toBe(false);
  expect(result.disposed.cachedParts + result.disposed.toneParts).toBe(0);
});

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
