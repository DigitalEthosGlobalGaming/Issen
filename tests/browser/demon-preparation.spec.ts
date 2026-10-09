import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('Demon preparation warms the real material sources and release permits clean re-entry', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createDemonRealmRenderer } = await import('/src/rendering/environment/demon-realm.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const painters = await Promise.all(
      [0, 1].map(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 320;
        return createTestDrawing(canvas);
      }),
    );
    const sources = new Set<any>();
    const legacy = createDemonRealmRenderer(document);
    const warm = createDemonRealmRenderer(document, {
      warmScene: (uploads, signal) => {
        for (const { texture } of uploads) sources.add(texture.source);
        return painters[1].warmScene(uploads, signal, { sceneryFilters: true });
      },
      retainSources: (sources) => painters[1].retainTextureSources(sources),
    });
    const frame = {
      width: 240,
      height: 320,
      dpr: 1,
      time: 0,
      reducedMotion: true,
      reducedFlashes: true,
      lowQuality: false,
      stage: 0,
      stageSeed: 123,
    };
    const draw = (owner: typeof warm, g: (typeof painters)[number]) => {
      g.begin();
      owner.draw(g, 240, 320, 0, true, 123);
      return g.getImageData(0, 0, 240, 320).data;
    };
    try {
      await legacy.prepare();
      const before = draw(legacy, painters[0]);
      const prepared = await warm.prepare(frame, new AbortController().signal);
      const captureMs = (
        performance
          .getEntriesByName(
            'issen:demon-artwork-built:true:' + JSON.stringify([240, 320, 1, 0, 123, false]),
          )
          .at(-1) as PerformanceMark
      ).detail.duration;
      for (let i = 0; i < 160; i++) {
        painters[1].begin();
        painters[1].flush();
      }
      const gl = painters[1].canvas.getContext('webgl2')!;
      const upload = gl.texImage2D,
        link = gl.linkProgram;
      let uploads = 0,
        links = 0;
      gl.texImage2D = (...args: any[]) => {
        if (sources.has(args.at(-1))) uploads++;
        return Reflect.apply(upload, gl, args);
      };
      gl.linkProgram = (program) => {
        links++;
        return link.call(gl, program);
      };
      const after = draw(warm, painters[1]);
      gl.texImage2D = upload;
      gl.linkProgram = link;
      const maximum = before.reduce((n, value, i) => Math.max(n, Math.abs(value - after[i])), 0);
      legacy.dispose();
      const memoryBefore = documentPixelMemory(document).snapshot();
      const gpuBefore = painters[1].sourceTextureCount;
      warm.release();
      const memoryAfter = documentPixelMemory(document).snapshot();
      const gpuAfter = painters[1].sourceTextureCount;
      const reentered = await warm.prepare(frame, new AbortController().signal);
      const replay = draw(warm, painters[1]);
      const replayMaximum = after.reduce(
        (n, value, i) => Math.max(n, Math.abs(value - replay[i])),
        0,
      );
      const extension = gl.getExtension('WEBGL_lose_context')!;
      const lost = new Promise<void>((resolve) =>
        painters[1].canvas.addEventListener('webglcontextlost', () => resolve(), { once: true }),
      );
      extension.loseContext();
      await lost;
      await new Promise((resolve) => setTimeout(resolve, 0));
      const restored = new Promise<void>((resolve) =>
        painters[1].canvas.addEventListener('webglcontextrestored', () => resolve(), {
          once: true,
        }),
      );
      extension.restoreContext();
      await restored;
      const contextReady = await warm.prepare(frame);
      uploads = links = 0;
      gl.texImage2D = (...args: any[]) => {
        if (sources.has(args.at(-1))) uploads++;
        return Reflect.apply(upload, gl, args);
      };
      gl.linkProgram = (program) => {
        links++;
        return link.call(gl, program);
      };
      const contextPixels = draw(warm, painters[1]);
      gl.texImage2D = upload;
      gl.linkProgram = link;
      const contextMaximum = replay.reduce(
        (n, value, i) => Math.max(n, Math.abs(value - contextPixels[i])),
        0,
      );
      return {
        prepared,
        maximum,
        uploads,
        links,
        captureMs,
        gpuBefore,
        gpuAfter,
        memoryBefore,
        memoryAfter,
        reentered,
        replayMaximum,
        contextReady,
        contextMaximum,
        restoredUploads: uploads,
        restoredLinks: links,
      };
    } finally {
      legacy.dispose();
      warm.dispose();
      painters.forEach((g) => g.dispose());
    }
  });
  await writeFile(testInfo.outputPath('demon-preparation.json'), JSON.stringify(result, null, 2));
  expect(result.prepared).toBe(true);
  expect(result.maximum).toBeLessThanOrEqual(1);
  expect(result.uploads).toBe(0);
  expect(result.links).toBe(0);
  expect(result.gpuBefore).toBeGreaterThan(0);
  expect(result.gpuAfter).toBe(0);
  expect(result.memoryAfter.decodedBytes).toBe(0);
  expect(result.memoryAfter.canvasBytes).toBeLessThan(result.memoryBefore.canvasBytes);
  expect(result.reentered).toBe(true);
  expect(result.replayMaximum).toBeLessThanOrEqual(1);
  expect(result.contextReady).toBe(true);
  expect(result.contextMaximum).toBeLessThanOrEqual(1);
  expect(result.restoredUploads).toBe(0);
  expect(result.restoredLinks).toBe(0);
});

test('released Demon preparation cannot publish after re-entry or disposal', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createDemonRealmRenderer } = await import('/src/rendering/environment/demon-realm.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 320;
    const painter = await createTestDrawing(canvas);
    let entered!: () => void, finish!: (ready: boolean) => void;
    let reached = new Promise<void>((resolve) => (entered = resolve));
    let gate = new Promise<boolean>((resolve) => (finish = resolve));
    let hold = true;
    const owner = createDemonRealmRenderer(document, {
      warmScene: (uploads, signal) => {
        if (hold) {
          entered();
          return gate;
        }
        return painter.warmScene(uploads, signal, { sceneryFilters: true });
      },
      retainSources: (sources) => painter.retainTextureSources(sources),
    });
    const frame = {
      width: 240,
      height: 320,
      dpr: 1,
      time: 0,
      stage: 0,
      stageSeed: 123,
      reducedMotion: true,
      reducedFlashes: true,
      lowQuality: false,
    };
    try {
      const obsolete = owner.prepare(frame);
      await reached;
      owner.release();
      const released = owner.snapshot().texturesWarmed;
      hold = false;
      const reentered = await owner.prepare({ ...frame, stageSeed: 456 });
      finish(true);
      const stale = await obsolete;
      const readyAfterStale = owner.snapshot().texturesWarmed;
      owner.release();
      hold = true;
      reached = new Promise<void>((resolve) => (entered = resolve));
      gate = new Promise<boolean>((resolve) => (finish = resolve));
      const disposing = owner.prepare(frame);
      await reached;
      owner.dispose();
      finish(true);
      return {
        released,
        reentered,
        stale,
        readyAfterStale,
        disposedResult: await disposing,
        gpu: painter.sourceTextureCount,
        decoded: documentPixelMemory(document).snapshot().decodedBytes,
        afterDispose: await owner.prepare(frame),
      };
    } finally {
      owner.dispose();
      painter.dispose();
    }
  });
  expect(result).toEqual({
    released: false,
    reentered: true,
    stale: false,
    readyAfterStale: true,
    disposedResult: false,
    gpu: 0,
    decoded: 0,
    afterDispose: false,
  });
});
