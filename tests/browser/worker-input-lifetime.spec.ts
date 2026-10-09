import { test, expect } from '@playwright/test';

test('worker phase accounting includes pinned inputs without settling scene readiness', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const { sceneImageUrls } = await import('/src/rendering/environment/asset-sources.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const { workerDecodeSize } = await import('/src/rendering/environment/decode-size.ts');
    const dimensions = new Map(
      assetMaterialCatalog.flatMap((pack) =>
        [pack.source, ...Object.values(pack.maps)].map((url) => [url, pack.dimensions] as const),
      ),
    );
    const expectedBytes = sceneImageUrls(1).reduce((sum, url) => {
      const size = workerDecodeSize(...dimensions.get(url)!, 256 * 1024 * 1024);
      return sum + size.width * size.height * 4;
    }, 0);
    const NativeWorker = window.Worker;
    let releaseResponse: (() => void) | undefined;
    const phases: Array<{
      phase: string;
      decoded: number;
      canvas: number;
      reserved: number;
      exported: number;
      settled: boolean;
    }> = [];
    let settled = false;
    let owner: ReturnType<typeof createEnvironmentRenderer>;
    window.Worker = class extends EventTarget {
      native: Worker;
      constructor(url: string | URL, options?: WorkerOptions) {
        super();
        this.native = new NativeWorker(url, options);
        this.native.addEventListener('message', ({ data }) => {
          const publish = () => this.dispatchEvent(new MessageEvent('message', { data }));
          if (data.phase) {
            publish();
            phases.push({
              phase: data.phase,
              decoded: owner.memorySnapshot.decodedBytes,
              canvas: owner.memorySnapshot.canvasBytes,
              reserved: data.snapshot.decodedLoader?.reservedBytes ?? 0,
              exported: owner.memorySnapshot.reservedBytes,
              settled,
            });
          } else releaseResponse = publish;
        });
      }
      postMessage(message: unknown) {
        this.native.postMessage(message);
      }
      terminate() {
        this.native.terminate();
      }
    } as unknown as typeof Worker;
    owner = createEnvironmentRenderer(document);
    try {
      const pending = owner
        .compose({
          width: 390,
          height: 844,
          dpr: 3,
          stage: 1,
          stageSeed: 424242,
          time: 0,
          lowQuality: false,
          reducedMotion: true,
          reducedFlashes: true,
        })
        .then((ready) => {
          settled = true;
          return ready;
        });
      const deadline = performance.now() + 15000;
      while (!releaseResponse && performance.now() < deadline)
        await new Promise((resolve) => setTimeout(resolve, 10));
      if (!releaseResponse) throw Error('Worker did not complete');
      const settledBeforeResponse = settled;
      releaseResponse();
      const handoffBytes = owner.memorySnapshot.transferredBytes;
      const ready = await pending;
      return {
        phases,
        expectedBytes,
        settledBeforeResponse,
        handoffBytes,
        ready,
        final: owner.memorySnapshot,
        size: { width: owner.snapshot().width, height: owner.snapshot().height },
      };
    } finally {
      owner.dispose();
      window.Worker = NativeWorker;
    }
  });
  const boundaries = result.phases.filter((row) => row.phase !== 'decode-progress');
  expect(boundaries.map((row) => row.phase)).toEqual(['assets-ready', 'composed']);
  expect(boundaries.every((row) => row.decoded === result.expectedBytes)).toBe(true);
  expect(boundaries[1].canvas).toBeGreaterThan(0);
  expect(boundaries[0].exported).toBe(0);
  expect(boundaries[1].exported).toBe(result.final.transferredBytes);
  expect(result.final.reservedBytes).toBe(0);
  const progress = result.phases.filter((row) => row.phase === 'decode-progress');
  expect(
    progress.some(
      (row) => row.decoded > 0 && row.decoded < result.expectedBytes && row.reserved > 0,
    ),
  ).toBe(true);
  expect(progress.at(-1)!.decoded).toBe(0);
  expect(result.phases.every((row) => !row.settled)).toBe(true);
  expect(result.settledBeforeResponse).toBe(false);
  expect(result.ready).toBe(true);
  expect(result.final.decodedBytes).toBe(0);
  expect(result.final.canvasBytes).toBe(0);
  expect(result.final.transferredBytes).toBeGreaterThan(0);
  expect(result.handoffBytes).toBe(result.final.transferredBytes);
  expect(result.size).toEqual({ width: 390, height: 844 });
});

for (const policy of [
  { memory: 2, mobile: false, budget: 256 },
  { memory: 4, mobile: true, budget: 384 },
  { memory: 8, mobile: false, budget: 512 },
])
  test(`worker owns ${policy.budget}MiB inputs and reacquires released composition sources`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto('/privacy/index.html');
    const result = await page.evaluate(async (policy) => {
      Object.defineProperty(navigator, 'deviceMemory', {
        value: policy.memory,
        configurable: true,
      });
      if (policy.mobile)
        Object.defineProperty(navigator, 'userAgent', { value: 'Android', configurable: true });
      const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
      const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
      const canvas = document.createElement('canvas');
      canvas.width = 120;
      canvas.height = 180;
      const g = await createTestDrawing(canvas),
        owner = createEnvironmentRenderer(document);
      const frame = {
        width: 120,
        height: 180,
        dpr: 1,
        stage: 0,
        stageSeed: 424242,
        time: 1,
        lowQuality: false,
        reducedMotion: false,
        reducedFlashes: false,
      };
      const pixels = () => {
        for (let n = 0; n < 2; n++) {
          g.begin();
          owner.draw(g, frame);
          owner.drawForeground(g, frame);
          g.getImageData(0, 0, 120, 180);
        }
        return Array.from(g.getImageData(0, 0, 120, 180).data);
      };
      const rows = [];
      for (let cycle = 0; cycle < 2; cycle++)
        for (let stage = 0; stage < 9; stage++) {
          frame.stage = stage;
          const ready = await owner.compose(frame);
          const snapshot = owner.snapshot();
          rows.push({ stage, cycle, ready, snapshot });
        }
      frame.stage = 0;
      frame.stageSeed = 424243;
      await owner.compose(frame);
      frame.stageSeed = 424242;
      await owner.compose(frame);
      // Compare settled submissions of the same completed key. The saved original also
      // differs between its first native frame and a later recomposition.
      const first = pixels();
      await owner.compose({ ...frame });
      const restored = pixels();
      let changes = 0;
      for (let n = 0; n < first.length; n++) if (first[n] !== restored[n]) changes++;
      owner.dispose();
      g.dispose();
      return { rows, changes };
    }, policy);
    expect(result.changes).toBe(0);
    expect(result.rows).toHaveLength(18);
    for (const row of result.rows) {
      expect(row.ready).toBe(true);
      expect(row.snapshot.worker).toBe(true);
      expect(row.snapshot.canvasBytes).toBe(0);
      const decoded = row.snapshot.decodedLoader!;
      expect(decoded.budget).toBe(policy.budget * 1024 * 1024);
      expect(decoded.peakBytes).toBeLessThanOrEqual(decoded.budget);
      expect(decoded.pinned).toBe(0);
      expect(decoded.pinnedBytes).toBe(0);
    }
    if (policy.budget === 256)
      expect(result.rows.at(-1)!.snapshot.decodedLoader!.evictions).toBeGreaterThan(0);
  });
