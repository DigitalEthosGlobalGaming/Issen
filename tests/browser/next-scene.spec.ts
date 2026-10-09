import { test, expect } from '@playwright/test';

for (const nextStage of [2, 0])
  test(`a warmed next scene ${nextStage} survives current draws and promotes without recomposition`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto('/privacy/index.html');
    const result = await page.evaluate(async (nextStage) => {
      const { createWorkerEnvironmentRenderer } =
        await import('/src/rendering/environment/worker-renderer.ts');
      const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
      const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
      const NativeWorker = window.Worker;
      const compositions: string[] = [];
      window.Worker = class extends NativeWorker {
        postMessage(message: any, transfer?: any) {
          if (message.kind === 'compose')
            compositions.push(`${message.frame.stage}:${message.frame.stageSeed}`);
          super.postMessage(message, transfer);
        }
      };
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 100;
      document.body.append(canvas);
      const drawing = await createTestDrawing(canvas);
      const owner = createWorkerEnvironmentRenderer(
        document,
        (items, options) => drawing.warmScene(items, options),
        {
          ownsUploadReservation: true,
          retainWorkerSources: (sources) => drawing.retainTextureSources(sources),
        },
      );
      const frame = {
        width: 160,
        height: 100,
        dpr: 1,
        time: 0,
        stage: nextStage === 0 ? 8 : 1,
        stageSeed: 10,
        lowQuality: false,
        reducedMotion: true,
        reducedFlashes: true,
      };
      const next = { ...frame, stage: nextStage, stageSeed: 11 };
      const draw = () => {
        drawing.begin();
        owner.draw(drawing, frame);
        drawing.flush();
        return canvas.toDataURL();
      };
      try {
        if (!(await owner.compose(frame))) throw Error('Current scene failed');
        const before = draw();
        sampleAssetBackground(frame.stage, true, 1, 8.3, nextStage, next);
        const deadline = performance.now() + 30000;
        while (owner.snapshot().imagePreload?.status === 'pending' && performance.now() < deadline)
          await new Promise((resolve) => setTimeout(resolve, 10));
        const prepared = owner.snapshot();
        for (let i = 0; i < 160; i++) draw();
        sampleAssetBackground(frame.stage, false, 7, 8.3, nextStage, next);
        const busy = owner.snapshot().imagePreload?.status;
        const unchanged = before === draw();
        const count = compositions.length;
        const promoted = await owner.compose(next);
        let uploads = 0,
          programs = 0;
        const gl = canvas.getContext('webgl2')!;
        const upload = gl.texImage2D,
          program = gl.createProgram;
        gl.texImage2D = (...args: any[]) => {
          uploads++;
          return Reflect.apply(upload, gl, args);
        };
        gl.createProgram = () => {
          programs++;
          return program.call(gl);
        };
        try {
          drawing.begin();
          owner.draw(drawing, next);
          drawing.flush();
        } finally {
          gl.texImage2D = upload;
          gl.createProgram = program;
        }
        return {
          prepared,
          busy,
          unchanged,
          promoted,
          count,
          compositions,
          uploads,
          programs,
          after: owner.snapshot(),
        };
      } finally {
        owner.dispose();
        drawing.dispose();
        canvas.remove();
        window.Worker = NativeWorker;
      }
    }, nextStage);
    expect(result.prepared.imagePreload?.status).toBe('ready');
    expect(result.prepared.stage).toBe(nextStage === 0 ? 8 : 1);
    expect(result.unchanged).toBe(true);
    expect(result.busy).toBe('ready');
    expect(result.promoted).toBe(true);
    expect(result.compositions).toEqual([`${nextStage === 0 ? 8 : 1}:10`, `${nextStage}:11`]);
    expect(result.count).toBe(2);
    expect(result.after.stage).toBe(nextStage);
    expect(result.after.nextScene.promotions).toBe(1);
    expect(result.uploads).toBe(0);
    expect(result.programs).toBe(0);
  });

test('next-scene admission denies pressure and releases invalidated transferred planes', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createWorkerEnvironmentRenderer } =
      await import('/src/rendering/environment/worker-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const { documentSceneMemory } = await import('/src/platform/scene-memory.ts');
    const NativeWorker = window.Worker;
    const planes: ImageBitmap[] = [];
    let compositions = 0;
    window.Worker = class extends NativeWorker {
      constructor(url: string | URL, options?: WorkerOptions) {
        super(url, options);
        this.addEventListener('message', ({ data }) => {
          if (data.layers?.length) {
            compositions++;
            for (const layer of [...data.layers, ...data.foreground])
              planes.push(
                ...[layer.colour, layer.normal, layer.surface, layer.emissive].filter(Boolean),
              );
          }
        });
      }
    };
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    document.body.append(canvas);
    const drawing = await createTestDrawing(canvas);
    const owner = createWorkerEnvironmentRenderer(
      document,
      (items, options) => drawing.warmScene(items, options),
      {
        retainWorkerSources: (sources) => drawing.retainTextureSources(sources),
      },
    );
    const pressure = { memorySnapshot: { sources: 1, bytes: 2 ** 31 } };
    const frame = {
      width: 160,
      height: 100,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 10,
      lowQuality: false,
      reducedMotion: true,
      reducedFlashes: true,
    };
    const next = { ...frame, stage: 2, stageSeed: 11 };
    const sample = (incoming = next) =>
      sampleAssetBackground(1, true, 1, 8.3, incoming.stage, incoming);
    try {
      if (!(await owner.compose(frame))) throw Error('Current scene failed');
      const currentCount = planes.length;
      documentPixelMemory(document).trackGpu(pressure);
      sample();
      const denied = owner.snapshot();
      const deniedCompositions = compositions;
      pressure.memorySnapshot.bytes = 0;
      await new Promise((resolve) => setTimeout(resolve, 260));
      sample();
      const deadline = performance.now() + 30000;
      while (owner.snapshot().imagePreload?.status === 'pending' && performance.now() < deadline)
        await new Promise((resolve) => setTimeout(resolve, 10));
      const ready = owner.snapshot();
      sample({ ...next, width: next.width + 1 });
      const invalidated = owner.snapshot();
      const nextClosed = planes.slice(currentCount).every((plane) => plane.width === 0);
      const currentLive = planes.slice(0, currentCount).every((plane) => plane.width > 0);
      owner.dispose();
      return {
        denied,
        deniedCompositions,
        ready,
        invalidated,
        nextClosed,
        currentLive,
        allClosed: planes.every((plane) => plane.width === 0),
        remaining: documentSceneMemory(document),
      };
    } finally {
      owner.dispose();
      drawing.dispose();
      canvas.remove();
      window.Worker = NativeWorker;
    }
  });
  expect(result.denied.imagePreload?.status).toBe('denied');
  expect(result.denied.nextScene.reservedBytes).toBe(0);
  expect(result.deniedCompositions).toBe(1);
  expect(result.ready.imagePreload?.status).toBe('ready');
  expect(result.invalidated.imagePreload?.status).toBe('none');
  expect(result.nextClosed).toBe(true);
  expect(result.currentLive).toBe(true);
  expect(result.allClosed).toBe(true);
  expect(result.remaining.transferredBytes).toBe(0);
  expect(result.remaining.reservedBytes).toBe(0);
});

test('busy frames cancel pending next-scene warming without failing the current scene', async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createWorkerEnvironmentRenderer } =
      await import('/src/rendering/environment/worker-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const { documentSceneMemory } = await import('/src/platform/scene-memory.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const drawing = await createTestDrawing(canvas);
    let calls = 0;
    const nextPlanes: any[] = [];
    let reached!: () => void;
    const waiting = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const owner = createWorkerEnvironmentRenderer(
      document,
      async (items, signal) => {
        if (++calls === 1) return drawing.warmScene(items, signal);
        nextPlanes.push(...Array.from(items, (item) => item.texture.source));
        reached();
        return new Promise<boolean>((resolve) =>
          signal.addEventListener('abort', () => resolve(false), { once: true }),
        );
      },
      { retainWorkerSources: (sources) => drawing.retainTextureSources(sources) },
    );
    const frame = {
      width: 160,
      height: 100,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 10,
      lowQuality: false,
      reducedMotion: true,
      reducedFlashes: true,
    };
    const next = { ...frame, stage: 2, stageSeed: 11 };
    try {
      if (!(await owner.compose(frame))) throw Error('Current scene failed');
      sampleAssetBackground(1, true, 1, 8.3, 2, next);
      await waiting;
      const pending = owner.snapshot();
      sampleAssetBackground(1, false, 7, 8.3, 2, next);
      for (let i = 0; i < 20 && documentSceneMemory(document).reservedBytes; i++)
        await new Promise((resolve) => setTimeout(resolve, 10));
      drawing.begin();
      const currentDraw = owner.draw(drawing, frame);
      drawing.flush();
      return {
        pending,
        after: owner.snapshot(),
        currentDraw,
        closed: nextPlanes.length > 0 && nextPlanes.every((source) => source.width === 0),
        reserved: documentSceneMemory(document).reservedBytes,
      };
    } finally {
      owner.dispose();
      drawing.dispose();
    }
  });
  expect(result.pending.imagePreload?.status).toBe('pending');
  expect(result.pending.nextScene.reservedBytes).toBeGreaterThan(0);
  expect(result.after.imagePreload?.status).toBe('none');
  expect(result.after.workerFailure).toBeUndefined();
  expect(result.currentDraw).toBe(true);
  expect(result.closed).toBe(true);
  expect(result.reserved).toBe(0);
});
