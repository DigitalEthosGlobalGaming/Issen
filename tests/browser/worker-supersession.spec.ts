import { expect, test } from '@playwright/test';

test('a foreground scene superseded during cache trimming dispatches only its replacement', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createWorkerEnvironmentRenderer } =
      await import('/src/rendering/environment/worker-renderer.ts');
    const NativeWorker = window.Worker;
    let hold = false,
      release = () => {},
      reached!: () => void;
    const waiting = new Promise<void>((resolve) => {
      reached = resolve;
    });
    const sent: number[] = [];
    window.Worker = class extends NativeWorker {
      postMessage(message: any, transfer?: any) {
        if (hold && message.kind === 'trim') {
          hold = false;
          release = () => {
            release = () => {};
            super.postMessage(message, transfer);
          };
          reached();
          return;
        }
        if (message.kind === 'compose') sent.push(message.frame.stage);
        super.postMessage(message, transfer);
      }
    };
    const owner = createWorkerEnvironmentRenderer(document);
    const frame = {
      width: 160,
      height: 100,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 123,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    };
    try {
      if (!(await owner.compose(frame))) throw Error('Initial scene failed');
      hold = true;
      const obsolete = owner.compose({ ...frame, stage: 2 });
      await waiting;
      const latest = owner.compose({ ...frame, stage: 3 });
      release();
      const outcomes = await Promise.all([obsolete, latest]);
      const snapshot = owner.snapshot();
      return { sent, outcomes, stage: snapshot.stage, failure: snapshot.workerFailure };
    } finally {
      release();
      owner.dispose();
      window.Worker = NativeWorker;
    }
  });
  expect(result.sent).toEqual([1, 3]);
  expect(result.outcomes).toEqual([false, true]);
  expect(result.stage).toBe(3);
  expect(result.failure).toBeUndefined();
});

test('a foreground scene superseded during fog preparation never reaches composition', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createWorkerEnvironmentRenderer } =
      await import('/src/rendering/environment/worker-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const nativeDecode = HTMLImageElement.prototype.decode;
    const NativeWorker = window.Worker;
    let release!: () => void,
      reached!: () => void,
      hold = true;
    const blocked = new Promise<void>((resolve) => {
      release = resolve;
    });
    const waiting = new Promise<void>((resolve) => {
      reached = resolve;
    });
    HTMLImageElement.prototype.decode = function () {
      const decoded = nativeDecode.call(this);
      if (hold && this.src.endsWith('/fog-wisps-atlas.webp')) {
        hold = false;
        return decoded.then(() => {
          reached();
          return blocked;
        });
      }
      return decoded;
    };
    const sent: number[] = [];
    window.Worker = class extends NativeWorker {
      postMessage(message: any, transfer?: any) {
        if (message.kind === 'compose') sent.push(message.frame.stage);
        super.postMessage(message, transfer);
      }
    };
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 100;
    const drawing = await createTestDrawing(canvas);
    const owner = createWorkerEnvironmentRenderer(document, (items, signal) =>
      drawing.warmScene(items, signal),
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
    try {
      const obsolete = owner.compose(frame);
      await waiting;
      const latest = owner.compose({ ...frame, stage: 3, stageSeed: 456 });
      release();
      const outcomes = await Promise.all([obsolete, latest]);
      const snapshot = owner.snapshot();
      const markedStages = performance
        .getEntriesByType('mark')
        .filter((entry) => entry.name.startsWith('issen:compose-sent:false:'))
        .map((entry) => (entry as PerformanceMark).detail.stage);
      return {
        sent,
        outcomes,
        markedStages,
        stage: snapshot.stage,
        backend: snapshot.backend,
        failure: snapshot.workerFailure,
        warmed: snapshot.texturesWarmed,
      };
    } finally {
      release();
      owner.dispose();
      drawing.dispose();
      HTMLImageElement.prototype.decode = nativeDecode;
      window.Worker = NativeWorker;
    }
  });
  expect(result.sent).toEqual([3]);
  expect(result.markedStages).toEqual([3]);
  expect(result.outcomes).toEqual([false, true]);
  expect(result.stage).toBe(3);
  expect(result.backend).toBe('layered');
  expect(result.failure).toBeUndefined();
  expect(result.warmed).toBe(true);
});
