import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('realm suspension releases ordinary scenery and resumes the same scene with a fresh worker', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createWorkerEnvironmentRenderer } =
      await import('/src/rendering/environment/worker-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const NativeWorker = window.Worker;
    let created = 0,
      terminated = 0;
    window.Worker = class extends NativeWorker {
      constructor(...args: ConstructorParameters<typeof Worker>) {
        super(...args);
        created++;
      }
      terminate() {
        terminated++;
        super.terminate();
      }
    };
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const drawing = await createTestDrawing(canvas);
    const owner = createWorkerEnvironmentRenderer(
      document,
      (items, signal) => drawing.warmScene(items, signal),
      { retainWorkerSources: (sources) => drawing.retainTextureSources(sources) },
    );
    const frame = {
      width: 160,
      height: 100,
      dpr: 1,
      time: 0,
      stage: 0,
      stageSeed: 123,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    };
    const draw = () => {
      drawing.begin();
      owner.draw(drawing, frame);
      return drawing.getImageData(0, 0, 160, 100).data;
    };
    try {
      if (!(await owner.compose(frame))) throw Error('Scene unavailable');
      const before = draw();
      sampleAssetBackground(0, true, 1, 8.3, 1, { ...frame, stage: 1, stageSeed: 124 });
      const deadline = performance.now() + 15000;
      while (owner.snapshot().imagePreload.status === 'pending' && performance.now() < deadline)
        await new Promise((resolve) => setTimeout(resolve, 10));
      const nextReady = owner.snapshot().nextScene.ready;
      const resident = owner.memorySnapshot;
      const decodedBefore = documentPixelMemory(document).snapshot().decodedBytes;
      owner.suspend();
      owner.suspend();
      await Promise.resolve();
      const parked = {
        ...owner.memorySnapshot,
        worker: owner.snapshot().worker,
        suspended: owner.snapshot().suspended,
        gpu: drawing.sourceTextureCount,
        decoded: documentPixelMemory(document).snapshot().decodedBytes,
      };
      sampleAssetBackground(0, true, 1, 8.3, 1, { ...frame, stage: 1 });
      await new Promise((resolve) => setTimeout(resolve, 30));
      const workersWhileParked = created;
      const resumed = await owner.compose(frame);
      const after = draw();
      const maximum = before.reduce((n, value, i) => Math.max(n, Math.abs(value - after[i])), 0);
      const active = owner.snapshot();
      sampleAssetBackground(0, true, 1, 8.3, 1, { ...frame, stage: 1, stageSeed: 124 });
      const resumedDeadline = performance.now() + 15000;
      while (
        owner.snapshot().imagePreload.status === 'pending' &&
        performance.now() < resumedDeadline
      )
        await new Promise((resolve) => setTimeout(resolve, 10));
      const resumedNextReady = owner.snapshot().nextScene.ready;
      owner.dispose();
      return {
        resident,
        nextReady,
        resumedNextReady,
        decodedBefore,
        parked,
        workersWhileParked,
        resumed,
        maximum,
        active: { worker: active.worker, suspended: active.suspended, stage: active.stage },
        created,
        terminated,
        final: owner.memorySnapshot,
        finalGpu: drawing.sourceTextureCount,
      };
    } finally {
      owner.dispose();
      drawing.dispose();
      window.Worker = NativeWorker;
    }
  });
  await writeFile(testInfo.outputPath('worker-suspension.json'), JSON.stringify(result, null, 2));
  // Completed scenes live in transferred bitmaps, not duplicate worker canvases.
  expect(result.resident.canvasBytes).toBe(0);
  expect(result.nextReady).toBe(true);
  expect(result.resumedNextReady).toBe(true);
  expect(result.resident.transferredBytes).toBeGreaterThan(0);
  expect(result.decodedBefore).toBeGreaterThan(0);
  expect(result.parked).toEqual({
    decodedBytes: 0,
    canvasBytes: 0,
    transferredBytes: 0,
    reservedBytes: 0,
    worker: false,
    suspended: true,
    gpu: 0,
    decoded: 0,
  });
  expect(result.workersWhileParked).toBe(1);
  expect(result.resumed).toBe(true);
  expect(result.maximum).toBeLessThanOrEqual(1);
  expect(result.active).toEqual({ worker: true, suspended: false, stage: 0 });
  expect(result.created).toBe(2);
  expect(result.terminated).toBe(2);
  expect(result.final).toEqual({
    decodedBytes: 0,
    canvasBytes: 0,
    transferredBytes: 0,
    reservedBytes: 0,
  });
  expect(result.finalGpu).toBe(0);
});

test('suspending a worker request settles callers without reporting failure or adopting stale pixels', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createWorkerEnvironmentRenderer } =
      await import('/src/rendering/environment/worker-renderer.ts');
    const NativeWorker = window.Worker;
    let terminated = 0,
      failures = 0;
    window.Worker = class extends EventTarget {
      postMessage() {}
      terminate() {
        terminated++;
      }
    } as any;
    const owner = createWorkerEnvironmentRenderer(document);
    owner.observeFailure(() => failures++);
    const frame = {
      width: 160,
      height: 100,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 7,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    };
    try {
      const pending = owner.compose(frame);
      owner.suspend();
      const cancelled = await pending;
      window.Worker = NativeWorker;
      const resumed = await owner.compose(frame);
      return {
        cancelled,
        resumed,
        terminated,
        failures,
        stage: owner.snapshot().stage,
        error: owner.snapshot().workerFailure,
      };
    } finally {
      owner.dispose();
      window.Worker = NativeWorker;
    }
  });
  expect(result).toEqual({
    cancelled: false,
    resumed: true,
    terminated: 1,
    failures: 0,
    stage: 1,
    error: undefined,
  });
});
