import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('low-memory enemies use bounded prepared planes with lighting, palettes and ownership intact', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkEnemyRenderer } = await import('/src/rendering/figures/ink-enemy.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const { setSceneLighting } = await import('/src/rendering/scene-material.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
    const previous = Object.getOwnPropertyDescriptor(navigator, 'deviceMemory');
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 8 });
    const full = createInkEnemyRenderer(document);
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 2 });
    const compact = createInkEnemyRenderer(document);
    if (previous) Object.defineProperty(navigator, 'deviceMemory', previous);
    else delete (navigator as any).deviceMemory;
    const painters = await Promise.all(
      [0, 1].map(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 180;
        return createTestDrawing(canvas);
      }),
    );
    const montages = [0, 1].map((index) => {
      const canvas = document.createElement('canvas');
      canvas.id = 'enemy-' + index;
      canvas.width = 1080;
      canvas.height = 1080;
      document.body.append(canvas);
      return canvas.getContext('2d')!;
    });
    const palette = createPalette().robe('sumi');
    const env = {
      time: 0,
      wind: 0,
      width: 180,
      height: 180,
      palette: () => palette,
      random: () => {
        throw Error('Artwork consumed RNG');
      },
    };
    try {
      const ready = await Promise.all([full.prepare(), compact.prepare()]);
      const inputsBefore = documentPixelMemory(document).snapshot().decodedBytes;
      const uploads = await compact.prepareUploads(
        [createPalette().robe('helm')],
        new AbortController().signal,
      );
      if (!uploads) throw Error('Compact preparation failed');
      const largestPlane = Math.max(
        ...uploads.map(({ texture }) => Math.max(texture.source.width, texture.source.height)),
      );
      const release = painters[1].retainTextureSources(
        uploads.map(({ texture }) => texture.source),
      );
      if (!(await painters[1].warmScene(uploads, new AbortController().signal)))
        throw Error('Warming failed');
      let totalDifference = 0,
        changed = 0;
      for (let seed = 0; seed < 36; seed++) {
        const pixels = [];
        for (const [index, owner] of [full, compact].entries()) {
          const g = painters[index];
          g.begin();
          g.fillStyle = '#17151a';
          g.fillRect(0, 0, 180, 180);
          setSceneLighting(g, {
            ambient: seed % 2 ? [0.1, 0.08, 0.12] : [0.45, 0.43, 0.4],
            directional: [0.5, 0.4, 0.3],
            direction: [0.4, -0.3, 1],
            points: [],
            materialLighting: 1,
          });
          g.save();
          g.translate(90, 170);
          g.scale(seed % 3 ? 130 : -130, 130);
          const figure = {
            x: 0,
            y: 0,
            h: 1,
            varied: seed < 32,
            d: makeFig(seed),
            pose: EPOSE.left,
            fog: (seed % 5) / 4,
            ...(seed >= 32 ? { variant: 'kabuto', pal: createPalette().robe('helm') } : {}),
          };
          for (const part of ['body', 'head', 'arms', 'hands'] as const)
            if (!owner.drawPart(g, part, figure, env)) throw Error('Missing enemy');
          g.restore();
          pixels.push(g.getImageData(0, 0, 180, 180).data);
          montages[index].drawImage(g.canvas, (seed % 6) * 180, Math.floor(seed / 6) * 180);
        }
        pixels[0].forEach((value, i) => {
          const difference = Math.abs(value - pixels[1][i]);
          totalDifference += difference;
          if (difference) changed++;
        });
      }
      const g = painters[1];
      const held = g.getImageData(0, 0, 180, 180).data;
      const gl = g.canvas.getContext('webgl2')!;
      const extension = gl.getExtension('WEBGL_lose_context')!;
      const lost = new Promise<void>((resolve) =>
        g.canvas.addEventListener('webglcontextlost', () => resolve(), { once: true }),
      );
      extension.loseContext();
      await lost;
      await new Promise((resolve) => setTimeout(resolve, 0));
      const restored = new Promise<void>((resolve) =>
        g.canvas.addEventListener('webglcontextrestored', () => resolve(), { once: true }),
      );
      extension.restoreContext();
      await restored;
      const contextReady = await g.warmScene(uploads, new AbortController().signal);
      g.begin();
      g.fillStyle = '#17151a';
      g.fillRect(0, 0, 180, 180);
      setSceneLighting(g, {
        ambient: [0.1, 0.08, 0.12],
        directional: [0.5, 0.4, 0.3],
        direction: [0.4, -0.3, 1],
        points: [],
        materialLighting: 1,
      });
      g.save();
      g.translate(90, 170);
      g.scale(130, 130);
      for (const part of ['body', 'head', 'arms', 'hands'] as const)
        if (
          !compact.drawPart(
            g,
            part,
            {
              x: 0,
              y: 0,
              h: 1,
              varied: false,
              d: makeFig(35),
              pose: EPOSE.left,
              fog: 0,
              variant: 'kabuto',
              pal: createPalette().robe('helm'),
            },
            env,
          )
        )
          throw Error('Missing restored enemy');
      g.restore();
      const recovery = g.getImageData(0, 0, 180, 180).data;
      const restoreMaximum = held.reduce(
        (maximum, value, i) => Math.max(maximum, Math.abs(value - recovery[i])),
        0,
      );
      full.dispose();
      const decodedAfterFullDisposal = documentPixelMemory(document).snapshot().decodedBytes;
      release();
      compact.dispose();
      return {
        ready,
        compactMode: compact.snapshot().compact,
        largestPlane,
        inputsBefore,
        decodedAfterFullDisposal,
        decodedFinal: documentPixelMemory(document).snapshot().decodedBytes,
        meanDifference: totalDifference / (36 * 180 * 180 * 4),
        changed,
        contextReady,
        restoreMaximum,
        finalGpu: painters[1].sourceTextureCount,
      };
    } finally {
      full.dispose();
      compact.dispose();
      painters.forEach((painter) => painter.dispose());
    }
  });
  await writeFile(testInfo.outputPath('compact-enemy.json'), JSON.stringify(result, null, 2));
  await page.locator('#enemy-0').screenshot({ path: testInfo.outputPath('enemy-original.png') });
  await page.locator('#enemy-1').screenshot({ path: testInfo.outputPath('enemy-compact.png') });
  expect(result.ready).toEqual([true, true]);
  expect(result.compactMode).toBe(true);
  expect(result.largestPlane).toBeLessThanOrEqual(256);
  expect(result.inputsBefore).toBeGreaterThan(0);
  expect(result.decodedAfterFullDisposal).toBe(0);
  expect(result.decodedFinal).toBe(0);
  expect(result.finalGpu).toBe(0);
  expect(result.contextReady).toBe(true);
  expect(result.restoreMaximum).toBeLessThanOrEqual(1);
});

test('disposing hidden compact preparation releases raw inputs and settles its caller', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkEnemyRenderer } = await import('/src/rendering/figures/ink-enemy.ts');
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    Object.defineProperty(navigator, 'deviceMemory', { configurable: true, value: 2 });
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    const owner = createInkEnemyRenderer(document);
    const pending = owner.prepare();
    await new Promise((resolve) => setTimeout(resolve, 50));
    owner.dispose();
    const ready = await pending;
    return {
      ready,
      compact: owner.snapshot().compact,
      decoded: documentPixelMemory(document).snapshot().decodedBytes,
      canvas: documentPixelMemory(document).snapshot().canvasBytes,
    };
  });
  expect(result).toEqual({ ready: false, compact: true, decoded: 0, canvas: 0 });
});
