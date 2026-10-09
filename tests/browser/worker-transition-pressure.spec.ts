import { test, expect } from '@playwright/test';

for (const cancel of [false, true])
  test(`scene upload pressure retains outgoing colour and restores full materials${cancel ? ' after cancellation' : ''}`, async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (/feedback loop|destroyed while still bound|GL_INVALID_OPERATION/i.test(message.text()))
        warnings.push(message.text());
    });
    await page.goto('/privacy/index.html');
    const result = await page.evaluate(async (cancel) => {
      Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
      const { createWorkerEnvironmentRenderer } =
        await import('/src/rendering/environment/worker-renderer.ts');
      const { registerSceneMemory, documentSceneMemory } =
        await import('/src/platform/scene-memory.ts');
      const { composedLayerBytes } = await import('/src/rendering/environment/worker-types.ts');
      const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
      const NativeWorker = window.Worker;
      const replies: any[] = [];
      const stages: number[] = [];
      window.Worker = class extends NativeWorker {
        constructor(...args: ConstructorParameters<typeof Worker>) {
          super(...args);
          this.addEventListener('message', ({ data }) => {
            if (!data.phase && data.layers?.length)
              replies.push(data.layers.map((layer: any) => ({ ...layer })));
          });
        }
        postMessage(message: any, transfer?: any) {
          if (message.kind === 'compose') stages.push(message.frame.stage);
          super.postMessage(message, transfer);
        }
      };
      const canvas = document.createElement('canvas');
      canvas.width = 160;
      canvas.height = 100;
      const drawing = await createTestDrawing(canvas);
      let warming = 0,
        releaseWarm: (() => void) | undefined;
      const owner = createWorkerEnvironmentRenderer(document, async (items, signal) => {
        if (++warming === 2) {
          await new Promise<void>((resolve) => {
            releaseWarm = resolve;
            signal.addEventListener('abort', () => resolve(), { once: true });
          });
        }
        return !signal.aborted && drawing.warmScene(items, signal);
      });
      let pressureBytes = 0;
      const pressureOwner = {
        get memorySnapshot() {
          return {
            decodedBytes: 0,
            canvasBytes: pressureBytes,
            transferredBytes: 0,
            reservedBytes: 0,
          };
        },
      };
      registerSceneMemory(document, pressureOwner);
      const frame = {
        width: 160,
        height: 100,
        dpr: 1,
        stage: 1,
        stageSeed: 123,
        time: 0,
        lowQuality: true,
        reducedMotion: true,
        reducedFlashes: true,
      };
      try {
        if (!(await owner.compose(frame))) throw Error('Initial scene unavailable');
        const before = replies[0];
        const memory = documentSceneMemory(document);
        pressureBytes = memory.budget - memory.committedBytes - composedLayerBytes(before) * 1.5;
        const incomingFrame = { ...frame, stage: 2 };
        const pending = owner.compose(incomingFrame);
        const deadline = performance.now() + 15000;
        while (!releaseWarm && performance.now() < deadline)
          await new Promise((resolve) => setTimeout(resolve, 10));
        if (!releaseWarm) throw Error('Incoming upload did not start');
        const colourAlive = before.every((layer: any) => layer.colour.width > 0);
        const mapsClosed = before.every((layer: any) =>
          ['normal', 'surface', 'emissive'].every(
            (kind) => !layer[kind] || layer[kind].width === 0,
          ),
        );
        drawing.begin();
        const drawable = owner.draw(drawing, incomingFrame);
        drawing.getImageData(0, 0, 160, 100);
        pressureBytes = 0;
        const restored = cancel ? owner.compose(frame) : undefined;
        releaseWarm();
        const incomingReady = await pending;
        const finalReady = restored ? await restored : incomingReady;
        const finalMaps = replies
          .at(-1)
          .every((layer: any) => layer.normal?.width > 0 && layer.surface?.width > 0);
        return {
          colourAlive,
          mapsClosed,
          drawable,
          incomingReady,
          finalReady,
          finalMaps,
          stages,
          finalStage: owner.snapshot().stage,
        };
      } finally {
        pressureBytes = 0;
        owner.dispose();
        drawing.dispose();
        window.Worker = NativeWorker;
      }
    }, cancel);
    expect(result.colourAlive).toBe(true);
    expect(result.mapsClosed).toBe(true);
    expect(result.drawable).toBe(true);
    expect(result.incomingReady).toBe(!cancel);
    expect(result.finalReady).toBe(true);
    expect(result.finalMaps).toBe(true);
    expect(result.stages).toEqual(cancel ? [1, 2, 1] : [1, 2]);
    expect(result.finalStage).toBe(cancel ? 1 : 2);
    expect(warnings).toEqual([]);
  });
