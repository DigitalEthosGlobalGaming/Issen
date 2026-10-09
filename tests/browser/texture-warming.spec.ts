import { expect, test } from '@playwright/test';

test('worker warming uses existing colour/data textures and preserves all-stage pixels before publication', async ({
  page,
}) => {
  test.setTimeout(90000);
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const create = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 180;
      canvas.height = 120;
      return createTestDrawing(canvas);
    };
    const warmed = await create(),
      baseline = await create();
    let firstDraw = false,
      uploads = 0,
      links = 0;
    let transferredBytes = 0;
    const gl = warmed.canvas.getContext('webgl2')!,
      texImage = gl.texImage2D.bind(gl);
    gl.texImage2D = ((...args: any[]) => {
      const source = args.at(-1);
      if (firstDraw && (source instanceof ImageBitmap || source instanceof HTMLImageElement))
        uploads++;
      return (texImage as any)(...args);
    }) as any;
    const link = gl.linkProgram.bind(gl);
    gl.linkProgram = (program) => {
      if (firstDraw) links++;
      link(program);
    };
    const owner = createEnvironmentRenderer(document, {
      warmWorkerScene: (sources, signal) => {
        const bitmaps = new Set(
          sources
            .map((source) => source.texture.source)
            .filter((source) => source instanceof ImageBitmap),
        );
        transferredBytes = [...bitmaps].reduce(
          (total, source) => total + source.width * source.height * 4,
          0,
        );
        return warmed.warmScene(sources, signal);
      },
    });
    const rows = [];
    for (let stage = 0; stage < 9; stage++) {
      const frame = {
        width: 180,
        height: 120,
        dpr: 1,
        time: 0,
        stage,
        stageSeed: 424242,
        lowQuality: true,
        reducedMotion: true,
        reducedFlashes: true,
      };
      await owner.compose(frame);
      const ready = owner.snapshot().texturesWarmed;
      firstDraw = true;
      uploads = 0;
      links = 0;
      warmed.begin();
      owner.draw(warmed, frame);
      owner.drawForeground(warmed, frame);
      const actual = warmed.getImageData(0, 0, 180, 120).data;
      firstDraw = false;
      baseline.begin();
      owner.draw(baseline, frame);
      owner.drawForeground(baseline, frame);
      const expected = baseline.getImageData(0, 0, 180, 120).data;
      let max = 0;
      for (let i = 0; i < actual.length; i++)
        max = Math.max(max, Math.abs(actual[i]! - expected[i]!));
      const memory = owner.snapshot();
      rows.push({
        stage,
        ready,
        uploads,
        links,
        max,
        transferredBytes,
        accountedTransferred: memory.transferredBytes,
        workerCanvasBytes: memory.canvasBytes,
        workerCanvases: memory.canvases,
        gpuBytes: warmed.sourceMemorySnapshot.bytes,
        rendererGpuBytes: warmed.memorySnapshot.bytes,
        workerDecodedBytes: memory.decodedLoader?.bytes,
      });
    }
    owner.dispose();
    warmed.dispose();
    baseline.dispose();
    return {
      rows,
      disposedGpuBytes: warmed.sourceMemorySnapshot.bytes + baseline.sourceMemorySnapshot.bytes,
      disposedTransferredBytes: owner.snapshot().transferredBytes,
    };
  });
  expect(result.disposedGpuBytes).toBe(0);
  expect(result.disposedTransferredBytes).toBe(0);
  expect(result.rows).toHaveLength(9);
  expect(
    result.rows.every((row) => row.ready && row.uploads === 0 && row.links === 0 && row.max === 0),
  ).toBe(true);
  for (const row of result.rows) {
    expect(row.accountedTransferred, `stage ${row.stage} transferred planes`).toBe(
      row.transferredBytes,
    );
    expect(row.workerCanvasBytes).toBeGreaterThanOrEqual(row.transferredBytes);
    expect(row.workerCanvases).toBeGreaterThan(0);
    expect(row.gpuBytes).toBeGreaterThanOrEqual(row.transferredBytes);
    expect(row.rendererGpuBytes).toBeGreaterThan(row.gpuBytes);
    expect(row.workerDecodedBytes).toBe(0);
  }
  expect(warnings).toEqual([]);
});

test('hidden stale warming preserves the old scene and closes partially uploaded incoming bitmaps', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    const painter = await createTestDrawing(canvas);
    let calls = 0,
      incoming: ImageBitmap | undefined,
      entered = false;
    const owner = createEnvironmentRenderer(document, {
      warmWorkerScene: async (sources, signal) => {
        if (++calls === 2) {
          incoming = sources[0]!.texture.source as ImageBitmap;
          await painter.warmTextures(sources.slice(0, 2), signal);
          Object.defineProperty(document, 'hidden', { value: true, configurable: true });
          entered = true;
        }
        return painter.warmTextures(sources, signal);
      },
    });
    const frame = {
      width: 180,
      height: 120,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 7,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    };
    await owner.compose(frame);
    painter.begin();
    owner.draw(painter, frame);
    const before = Array.from(painter.getImageData(0, 0, 180, 120).data);
    const stale = owner.compose({ ...frame, stage: 2 });
    const deadline = performance.now() + 10000;
    while (!entered) {
      if (performance.now() > deadline) throw Error('warm gate timed out');
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    painter.begin();
    owner.draw(painter, { ...frame, stage: 2 });
    const held = Array.from(painter.getImageData(0, 0, 180, 120).data);
    const stageWhileWarming = owner.snapshot().stage;
    const latest = owner.compose({ ...frame, stage: 3 });
    const cancelled = await stale;
    // Queue cancellation settles the caller before the aborted upload unwinds.
    while (incoming!.width !== 0) {
      if (performance.now() > deadline) throw Error('cancelled bitmap cleanup timed out');
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    const width = incoming!.width;
    const retainedSources = painter.sourceTextureCount;
    delete (document as any).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    const accepted = await latest;
    const stage = owner.snapshot().stage;
    owner.dispose();
    painter.dispose();
    return {
      cancelled,
      width,
      retainedSources,
      accepted,
      stage,
      stageWhileWarming,
      same: before.every((v, i) => v === held[i]),
    };
  });
  expect(result).toEqual({
    cancelled: false,
    width: 0,
    retainedSources: 12,
    accepted: true,
    stage: 3,
    stageWhileWarming: 1,
    same: true,
  });
});

test('failed texture warming closes the worker response and reports unavailable scenery', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    let incoming: ImageBitmap | undefined;
    const owner = createEnvironmentRenderer(document, {
      warmWorkerScene: async (sources) => {
        incoming = sources[0]!.texture.source as ImageBitmap;
        throw Error('fixture warm failure');
      },
    });
    const ready = await owner.compose({
      width: 180,
      height: 120,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 7,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    });
    const snapshot = owner.snapshot();
    const width = incoming!.width;
    owner.dispose();
    return { ready, worker: snapshot.worker, failure: snapshot.workerFailure, width };
  });
  expect(result).toEqual({
    ready: false,
    worker: false,
    failure: 'Error: fixture warm failure',
    width: 0,
  });
});

test('pending sources survive frame collection and reupload after actual context restoration', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createTestDrawing(canvas);
    const sources = ['#f00', '#0f0'].map((colour) => {
      const source = document.createElement('canvas');
      source.width = source.height = 16;
      const drawing = source.getContext('2d')!;
      drawing.fillStyle = colour;
      drawing.fillRect(0, 0, 16, 16);
      return { texture: { source, revision: 0 } };
    });
    const controller = new AbortController();
    await painter.warmTextures(sources.slice(0, 1), controller.signal);
    await painter.warmSceneShaders(controller.signal);
    let entered = false;
    const warmShaders = painter.warmSceneShaders.bind(painter);
    painter.warmSceneShaders = async (signal) => {
      if (!entered) {
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        entered = true;
      }
      return warmShaders(signal);
    };
    const pending = painter.warmScene(sources, controller.signal);
    const deadline = performance.now() + 10000;
    while (!entered) {
      if (performance.now() > deadline) throw Error('shader warming gate timed out');
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
    for (let i = 0; i < 125; i++) {
      painter.begin();
      painter.flush();
    }
    const retained = painter.sourceTextureCount;
    const gl = canvas.getContext('webgl2')!;
    const extension = gl.getExtension('WEBGL_lose_context')!;
    const lost = new Promise<void>((resolve) =>
      canvas.addEventListener('webglcontextlost', () => resolve(), { once: true }),
    );
    extension.loseContext();
    await lost;
    // Chromium accepts restoration after the loss event has finished dispatching.
    await new Promise((resolve) => setTimeout(resolve, 0));
    const restored = new Promise<void>((resolve) =>
      canvas.addEventListener('webglcontextrestored', () => resolve(), { once: true }),
    );
    extension.restoreContext();
    await restored;
    delete (document as any).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    const ready = await pending;
    let links = 0;
    const nativeLink = gl.linkProgram.bind(gl);
    gl.linkProgram = (program) => {
      links++;
      nativeLink(program);
    };
    let uploads = 0;
    const nativeUpload = gl.texImage2D.bind(gl);
    gl.texImage2D = ((...args: any[]) => {
      if (sources.some(({ texture }) => texture.source === args.at(-1))) uploads++;
      return (nativeUpload as any)(...args);
    }) as any;
    painter.begin();
    painter.drawImage(sources[0]!.texture.source, 0, 0);
    painter.drawImage(sources[1]!.texture.source, 16, 0);
    const pixels = painter.getImageData(0, 0, 32, 32).data;
    const left = Array.from(pixels.slice(0, 4));
    const right = Array.from(pixels.slice(16 * 4, 17 * 4));
    painter.dispose();
    return { retained, ready, links, uploads, left, right };
  });
  expect(result).toEqual({
    retained: 2,
    ready: true,
    links: 0,
    uploads: 0,
    left: [255, 0, 0, 255],
    right: [0, 255, 0, 255],
  });
});

test('resize during shader preparation warms the replacement targets before readiness', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createTestDrawing(canvas);
    const source = document.createElement('canvas');
    source.width = source.height = 16;
    const ink = source.getContext('2d')!;
    ink.fillStyle = '#f00';
    ink.fillRect(0, 0, 16, 16);
    const shaders = painter.warmSceneShaders.bind(painter);
    let resized = false;
    painter.warmSceneShaders = async (signal) => {
      if (!resized) {
        resized = true;
        canvas.width = 64;
        canvas.height = 48;
        painter.begin();
      }
      return shaders(signal);
    };
    try {
      const ready = await painter.warmScene(
        [{ texture: { source, revision: 0 } }],
        new AbortController().signal,
      );
      const gl = canvas.getContext('webgl2')!;
      let uploads = 0;
      const upload = gl.texImage2D;
      gl.texImage2D = (...args: any[]) => {
        uploads++;
        return Reflect.apply(upload, gl, args);
      };
      painter.begin();
      painter.drawImage(source, 0, 0);
      painter.flush();
      gl.texImage2D = upload;
      return { ready, resized, uploads, pixel: Array.from(painter.getImageData(0, 0, 1, 1).data) };
    } finally {
      painter.dispose();
    }
  });
  expect(result).toEqual({ ready: true, resized: true, uploads: 0, pixel: [255, 0, 0, 255] });
});

test('painter disposal aborts a hidden upload wait without any later upload', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 16;
    const painter = await createTestDrawing(canvas),
      source = document.createElement('canvas');
    source.width = source.height = 8;
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    const pending = painter.warmScene(
      [{ texture: { source, revision: 0 } }],
      new AbortController().signal,
    );
    const shaders = painter.warmSceneShaders(new AbortController().signal);
    painter.dispose();
    const ready = await pending;
    const shaderReady = await shaders;
    delete (document as any).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    return { ready, shaderReady, sources: painter.sourceTextureCount };
  });
  expect(result).toEqual({ ready: false, shaderReady: false, sources: 0 });
});
