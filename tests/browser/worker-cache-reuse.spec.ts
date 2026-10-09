import { test, expect } from '@playwright/test';

for (const memory of [2, 8])
  test(`worker cache reuse and pressure reclamation at ${memory} GiB`, async ({ page }) => {
    await page.goto('/privacy/index.html');
    const result = await page.evaluate(async (memory) => {
      Object.defineProperty(navigator, 'deviceMemory', { value: memory, configurable: true });
      const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
      const { trackPixelSource } = await import('/src/platform/pixel-memory.ts');
      const { documentSceneMemory } = await import('/src/platform/scene-memory.ts');
      const NativeWorker = window.Worker;
      const requests: any[] = [],
        decodes: any[] = [];
      window.Worker = class extends NativeWorker {
        constructor(url: string | URL, options?: WorkerOptions) {
          super(url, options);
          this.addEventListener('message', ({ data }) => {
            if (data.phase === 'decode-progress' && data.snapshot.decodedLoader.reservedBytes)
              decodes.push(data.id);
          });
        }
        postMessage(message: any) {
          requests.push(message);
          super.postMessage(message);
        }
      };
      const owner = createEnvironmentRenderer(document);
      // Ledger pressure exercises admission without allocating a huge native canvas.
      const pressure = trackPixelSource(document, { width: 0, height: 1 }, 'canvas');
      const frame = {
        width: 120,
        height: 180,
        dpr: 1,
        stage: 0,
        stageSeed: 424242,
        time: 0,
        lowQuality: false,
        reducedMotion: true,
        reducedFlashes: true,
      };
      try {
        if (!(await owner.compose(frame))) throw Error('Initial scene failed');
        const initial = owner.snapshot();
        decodes.length = 0;
        if (!(await owner.compose({ ...frame, stage: 1 }))) throw Error('Shared scene failed');
        const shared = owner.snapshot(),
          sharedDecodes = decodes.length;
        pressure.width = memory === 8 ? (850 * 1024 * 1024) / 4 : 0;
        if (!(await owner.compose({ ...frame, stage: 2 }))) throw Error('Pressure scene failed');
        const final = owner.snapshot(),
          committed = documentSceneMemory(document);
        return {
          initial,
          shared,
          sharedDecodes,
          final,
          committed,
          trims: requests.filter((request) => request.kind === 'trim').length,
        };
      } finally {
        pressure.width = 0;
        owner.dispose();
        window.Worker = NativeWorker;
      }
    }, memory);
    expect(result.initial.decodedLoader!.pinned).toBe(0);
    expect(result.shared.decodedLoader!.pinned).toBe(0);
    if (memory === 8) {
      expect(result.initial.decodedLoader!.bytes).toBeGreaterThan(0);
      expect(result.initial.decodedLoader!.bytes).toBeLessThanOrEqual(256 * 1024 * 1024);
      expect(result.sharedDecodes).toBe(0);
      expect(result.trims).toBeGreaterThan(0);
      expect(result.final.decodedLoader!.evictions).toBeGreaterThan(
        result.shared.decodedLoader!.evictions,
      );
      expect(result.committed.committedBytes).toBeLessThanOrEqual(result.committed.budget);
    } else {
      expect(result.initial.decodedLoader!.bytes).toBe(0);
      expect(result.shared.decodedLoader!.bytes).toBe(0);
      expect(result.sharedDecodes).toBeGreaterThan(0);
      expect(result.trims).toBe(0);
    }
  });
