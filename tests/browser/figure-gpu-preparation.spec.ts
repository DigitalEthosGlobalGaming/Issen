import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('prepared enemy wardrobe and selected weapons draw without readbacks, uploads or program creation', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkEnemyRenderer } = await import('/src/rendering/figures/ink-enemy.ts');
    const { createInkSwordRenderer } = await import('/src/rendering/figures/ink-sword.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { BLADE_RECIPES } = await import('/src/rendering/figures/blade-recipes.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
    const painters = await Promise.all(
      [0, 1].map(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 200;
        return createTestDrawing(canvas);
      }),
    );
    const enemies = [createInkEnemyRenderer(document), createInkEnemyRenderer(document)];
    const swords = [createInkSwordRenderer(document), createInkSwordRenderer(document)];
    const palette = createPalette().robe('sumi');
    const ids = Object.keys(BLADE_RECIPES);
    const signal = new AbortController().signal;
    let release: (() => void) | undefined;
    try {
      await Promise.all([enemies[0].prepare(), swords[0].prepare()]);
      const bossPalettes = ['helm', 'yoroi', 'hai'].map((tone) => createPalette().robe(tone));
      const enemy = await enemies[1].prepareUploads(bossPalettes, signal);
      const weapons = await swords[1].prepareUploads(ids, signal);
      if (!enemy || !weapons) throw Error('Preparation failed');
      const reused = enemy === (await enemies[1].prepareUploads(bossPalettes, signal));
      const sources = [...enemy, ...weapons];
      release = painters[1].retainTextureSources(sources.map(({ texture }) => texture.source));
      if (!(await painters[1].warmScene(sources, signal))) throw Error('GPU preparation failed');
      for (let i = 0; i < 160; i++) {
        painters[1].begin();
        painters[1].flush();
      }
      const env = {
        time: 0,
        wind: 0,
        width: 240,
        height: 200,
        petActive: false,
        palette: () => palette,
        random: () => {
          throw Error('Preparation consumed RNG');
        },
      };
      const read = CanvasRenderingContext2D.prototype.getImageData;
      let reads = 0,
        uploads = 0,
        programs = 0,
        maximum = 0;
      const uploadDetails: any[] = [];
      const gl = painters[1].canvas.getContext('webgl2')!;
      const upload = gl.texImage2D,
        program = gl.createProgram;
      gl.texImage2D = (...args: any[]) => {
        uploads++;
        const source = args.at(-1);
        uploadDetails.push({
          width: source?.width ?? args[3],
          height: source?.height ?? args[4],
          stack: new Error().stack,
        });
        return Reflect.apply(upload, gl, args);
      };
      gl.createProgram = () => {
        programs++;
        return program.call(gl);
      };
      CanvasRenderingContext2D.prototype.getImageData = function (...args) {
        reads++;
        return read.apply(this, args);
      };
      const warmReads: number[] = [];
      try {
        for (let seed = 0; seed < 38; seed++) {
          const pixels: Uint8ClampedArray[] = [];
          for (let index = 0; index < 2; index++) {
            const g = painters[index];
            g.begin();
            g.save();
            g.translate(120, 185);
            g.scale(140, 140);
            const before = reads;
            const figure = {
              x: 0,
              y: 0,
              h: 1,
              varied: true,
              d: makeFig(seed),
              pose: EPOSE.left,
              fog: (seed % 5) / 4,
              ...(seed >= 32 ? { pal: bossPalettes[seed % 3], variant: 'kabuto' } : {}),
            };
            for (const part of ['body', 'head', 'arms', 'hands'] as const)
              if (!enemies[index].drawPart(g, part, figure, env)) throw Error('Missing enemy');
            if (
              !swords[index].draw(
                g,
                0,
                -0.4,
                0.2,
                palette,
                { len: 0.52, gold: 1 },
                ids[seed % ids.length],
              )
            )
              throw Error('Missing weapon');
            if (index === 1) warmReads.push(reads - before);
            g.restore();
            pixels.push(g.getImageData(0, 0, 240, 200).data);
          }
          maximum = pixels[0].reduce(
            (value, pixel, i) => Math.max(value, Math.abs(pixel - pixels[1][i])),
            maximum,
          );
        }
      } finally {
        CanvasRenderingContext2D.prototype.getImageData = read;
        gl.texImage2D = upload;
        gl.createProgram = program;
      }
      return {
        reused,
        maximum,
        warmReads,
        uploads,
        programs,
        uploadDetails,
        cache: enemies[1].snapshot(),
      };
    } finally {
      release?.();
      enemies.forEach((owner) => owner.dispose());
      swords.forEach((owner) => owner.dispose());
      painters.forEach((g) => g.dispose());
    }
  });
  await writeFile(testInfo.outputPath('figure-preparation.json'), JSON.stringify(result, null, 2));
  expect(result.maximum).toBeLessThanOrEqual(1);
  expect(result.reused).toBe(true);
  expect(result.warmReads).toEqual(Array(38).fill(0));
  expect(result.uploads).toBe(0);
  expect(result.programs).toBe(0);
  expect(result.cache.variantPixels + result.cache.tonePixels).toBeLessThanOrEqual(
    result.cache.maxCachePixels,
  );
});

test('figure preparation cancellation preserves the current lease and disposal releases GPU sources', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createNativeServices } = await import('/src/presentation/native-services.ts');
    const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const drawing = await createTestDrawing(canvas);
    const cleanup: (() => void)[] = [];
    const services = createNativeServices(
      document,
      { add: (fn) => cleanup.push(fn) },
      undefined,
      drawing,
    );
    const palette = createPalette().robe('sumi');
    const selection = { robe: 'monk', charm: 'omikuji', charmColor: '#c9bda1' };
    try {
      const prepared = await services.prepareFigureArtwork(
        ['steel'],
        [palette],
        new AbortController().signal,
        selection,
      );
      const before = drawing.sourceTextureCount;
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      const controller = new AbortController();
      const pending = services.prepareFigureArtwork(
        ['steel'],
        [palette],
        controller.signal,
        selection,
      );
      await new Promise((resolve) => setTimeout(resolve, 30));
      controller.abort();
      const cancelled = await pending;
      const retained = drawing.sourceTextureCount;
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
      const recovered = await services.prepareFigureArtwork(
        ['steel'],
        [palette],
        new AbortController().signal,
        selection,
      );
      const gl = canvas.getContext('webgl2')!;
      const extension = gl.getExtension('WEBGL_lose_context')!;
      const lost = new Promise<void>((resolve) =>
        canvas.addEventListener('webglcontextlost', () => resolve(), { once: true }),
      );
      extension.loseContext();
      await lost;
      await new Promise((resolve) => setTimeout(resolve, 0));
      const restored = new Promise<void>((resolve) =>
        canvas.addEventListener('webglcontextrestored', () => resolve(), { once: true }),
      );
      extension.restoreContext();
      await restored;
      const contextReady = await services.prepareFigureArtwork(
        ['steel'],
        [palette],
        new AbortController().signal,
        selection,
      );
      let restoredUploads = 0;
      const restoredDetails: any[] = [];
      const upload = gl.texImage2D;
      gl.texImage2D = (...args: any[]) => {
        restoredUploads++;
        restoredDetails.push({
          width: args.at(-1)?.width ?? args[3],
          height: args.at(-1)?.height ?? args[4],
          stack: new Error().stack,
        });
        return Reflect.apply(upload, gl, args);
      };
      try {
        drawing.begin();
        drawing.save();
        drawing.translate(80, 90);
        drawing.scale(80, 80);
        services.inkEnemy.drawPart(
          drawing,
          'body',
          { x: 0, y: 0, h: 1, fog: 0, varied: true, d: makeFig(1), pose: EPOSE.left },
          {
            time: 0,
            wind: 0,
            width: 160,
            height: 100,
            petActive: false,
            random: () => 0,
            palette: () => palette,
          },
        );
        services.inkSword.draw(drawing, 0, -0.5, 0, palette, undefined, 'steel');
        services.inkPlayer.draw(
          drawing,
          {
            x: 0,
            y: 0,
            h: 1,
            fog: 0,
            back: true,
            robeId: selection.robe,
            d: makeFig(1),
            pose: EPOSE.left,
          },
          {
            time: 0,
            wind: 0,
            width: 160,
            height: 100,
            petActive: false,
            random: () => 0,
            palette: () => palette,
          },
        );
        services.inkCharm.draw(drawing, selection.charm, 0, -0.5, 0.1, selection.charmColor);

        drawing.restore();
        drawing.flush();
      } finally {
        gl.texImage2D = upload;
      }
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      const disposing = services.prepareFigureArtwork(
        ['steel'],
        [palette],
        new AbortController().signal,
        selection,
      );
      await new Promise((resolve) => setTimeout(resolve, 30));
      for (const dispose of cleanup.splice(0).reverse()) dispose();
      const disposed = await disposing;
      return {
        prepared,
        before,
        cancelled,
        retained,
        recovered,
        contextReady,
        restoredUploads,
        restoredDetails,
        disposed,
        remaining: drawing.sourceTextureCount,
      };
    } finally {
      for (const dispose of cleanup.reverse()) dispose();
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      drawing.dispose();
    }
  });
  await writeFile('tmp/probes/figure-restoration-details.json', JSON.stringify(result, null, 2));
  expect(result.prepared).toBe(true);
  expect(result.before).toBeGreaterThan(0);
  expect(result.cancelled).toBe(false);
  expect(result.retained).toBe(result.before);
  expect(result.recovered).toBe(true);
  expect(result.contextReady).toBe(true);
  expect(result.restoredUploads).toBe(0);
  expect(result.disposed).toBe(false);
  expect(result.remaining).toBe(0);
});

test('background figures reserve memory, preserve current sources and promote without uploads', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createNativeServices } = await import('/src/presentation/native-services.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const { registerSceneMemory } = await import('/src/platform/scene-memory.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const drawing = await createTestDrawing(canvas);
    const cleanup: (() => void)[] = [];
    const services = createNativeServices(
      document,
      { add: (fn) => cleanup.push(fn) },
      undefined,
      drawing,
    );
    const palette = createPalette();
    const current = [palette.robe('sumi')];
    const next = [palette.robe('helm'), palette.robe('yoroi'), palette.robe('hai')];
    const selection = { robe: 'monk', charm: 'omikuji', charmColor: '#c9bda1' };
    let final = -1;
    try {
      const prepared = await services.prepareFigureArtwork(
        ['steel'],
        current,
        new AbortController().signal,
        selection,
      );
      const before = drawing.sourceTextureCount;
      Object.defineProperty(document, 'hidden', { configurable: true, value: true });
      const controller = new AbortController();
      const pending = services.prepareFigureArtwork(['steel'], next, controller.signal, selection, {
        background: true,
      });
      const reserved = services.memorySnapshot().reservedBytes;
      controller.abort();
      const cancelled = await pending;
      const afterCancel = services.memorySnapshot().reservedBytes;
      const retained = drawing.sourceTextureCount;
      Object.defineProperty(document, 'hidden', { configurable: true, value: false });
      document.dispatchEvent(new Event('visibilitychange'));
      const incoming = await services.prepareFigureArtwork(
        ['steel'],
        next,
        new AbortController().signal,
        selection,
        { background: true },
      );
      const gl = canvas.getContext('webgl2')!;
      const upload = gl.texImage2D;
      let uploads = 0;
      gl.texImage2D = (...args: any[]) => {
        uploads++;
        return Reflect.apply(upload, gl, args);
      };
      let promoted: boolean;
      try {
        promoted = await services.prepareFigureArtwork(
          ['steel'],
          next,
          new AbortController().signal,
          selection,
        );
      } finally {
        gl.texImage2D = upload;
      }
      // Mandatory external allocations deny optional preparation before it starts.
      const pressure = {
        memorySnapshot: {
          decodedBytes: 0,
          canvasBytes: 0,
          transferredBytes: 0,
          reservedBytes: services.memorySnapshot().budget,
        },
      };
      registerSceneMemory(document, pressure);
      const denied = await services.prepareFigureArtwork(
        ['steel'],
        current,
        new AbortController().signal,
        selection,
        { background: true },
      );
      pressure.memorySnapshot.reservedBytes = 0;
      return {
        prepared,
        before,
        reserved,
        cancelled,
        afterCancel,
        retained,
        incoming,
        promoted,
        uploads,
        denied,
      };
    } finally {
      for (const dispose of cleanup.reverse()) dispose();
      final = drawing.sourceTextureCount;
      drawing.dispose();
      if (final !== 0) throw Error('Figure disposal retained native sources');
    }
  });
  expect(result.prepared).toBe(true);
  expect(result.reserved).toBe(64 * 1024 * 1024);
  expect(result.cancelled).toBe(false);
  expect(result.afterCancel).toBe(0);
  expect(result.retained).toBe(result.before);
  expect(result.incoming).toBe(true);
  expect(result.promoted).toBe(true);
  expect(result.uploads).toBe(0);
  expect(result.denied).toBe(false);
});
