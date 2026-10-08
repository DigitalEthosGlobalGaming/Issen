import { expect, test } from '@playwright/test';

test('runtime renders an extra high-refresh frame without advancing simulation or post RNG', async ({
  page,
}, testInfo) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'completed' })),
  );
  await page.route(
    /\/src\/(game\.ts|platform\/frame-loop\.ts|presentation\/post-preparation\.ts)(?:\?|$)/,
    async (route) => {
      const response = await route.fetch();
      let body = await response.text();
      const path = new URL(route.request().url()).pathname;
      if (path.endsWith('/game.ts')) {
        body = body.replace(
          'artworkReady = true;',
          'window.__highRefresh = { foundation, frames, game }; artworkReady = true;',
        );
      } else if (path.endsWith('/frame-loop.ts')) {
        expect(body).toContain('let last = scheduler.now();');
        body = body.replace(
          'let last = scheduler.now();',
          'window.__framePorts = { timing, callbacks }; let last = scheduler.now();',
        );
      } else {
        expect(body).toContain('function preparePresentation(raw) {');
        body = body.replace(
          'function preparePresentation(raw) {',
          'function preparePresentation(raw) { window.__postPreparations = (window.__postPreparations || 0) + 1;',
        );
      }
      await route.fulfill({ response, body });
    },
  );
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__highRefresh);
  await page.evaluate(() => (window as any).__highRefresh.game.startRun());
  await page.waitForFunction(
    () =>
      document.querySelector<HTMLCanvasElement>('#c')?.dataset.sceneState === 'ready' &&
      (window as any).__highRefresh.foundation.run.G.state === 'playing',
  );
  const result = await page.evaluate(async () => {
    const { createFrameLoop } = await import('/src/platform/frame-loop.ts');
    const { foundation: f, frames } = (window as any).__highRefresh;
    const { timing, callbacks } = (window as any).__framePorts;
    frames.frameLoop.stop();
    let now = 0,
      callback: FrameRequestCallback,
      updates = 0,
      renders = 0;
    const loop = createFrameLoop(
      timing,
      {
        ...callbacks,
        update(dt: number, raw: number) {
          updates++;
          callbacks.update(dt, raw);
        },
        render(raw: number) {
          renders++;
          callbacks.render(raw);
        },
      },
      {
        now: () => now,
        request(cb: FrameRequestCallback) {
          callback = cb;
          return 1;
        },
        cancel() {},
      },
    );
    (window as any).__postPreparations = 0;
    loop.start();
    const step = (tick: number) => {
      now = (tick * 1000) / 120;
      callback(now);
    };
    step(1);
    step(2);
    const source = document.querySelector<HTMLCanvasElement>('#c')!;
    const copy = document.createElement('canvas');
    copy.width = source.width;
    copy.height = source.height;
    const read = copy.getContext('2d', { willReadFrequently: true })!;
    const capture = () => {
      read.clearRect(0, 0, copy.width, copy.height);
      read.drawImage(source, 0, 0);
      return read.getImageData(0, 0, copy.width, copy.height).data;
    };
    const snapshot = () =>
      JSON.stringify({
        G: f.run.G,
        P: f.run.P,
        fx: f.view.presentationState.fx,
        time: f.view.presentationState.time,
        post: frames.postPreparation.state,
        rng: f.run.activity.runRandom.state(),
      });
    const before = snapshot(),
      first = capture();
    step(3);
    const after = snapshot(),
      second = capture();
    loop.stop();
    let maxDifference = 0,
      changed = 0;
    for (let i = 0; i < first.length; i++) {
      const difference = Math.abs(first[i] - second[i]);
      maxDifference = Math.max(maxDifference, difference);
      if (difference) changed++;
    }
    const gameFps = callbacks.maxFps();
    f.run.G.state = 'paused';
    return {
      updates,
      renders,
      preparations: (window as any).__postPreparations,
      same: before === after,
      maxDifference,
      fractionChanged: changed / first.length,
      gameFps,
      pausedFps: callbacks.maxFps(),
      updateFps: callbacks.maxUpdateFps(),
    };
  });
  const { maxDifference, fractionChanged, ...counts } = result;
  await testInfo.attach('replay-metrics', {
    body: JSON.stringify(result),
    contentType: 'application/json',
  });
  // Same edge-rounding allowance as the existing prepared-scene replay test.
  expect(maxDifference).toBeLessThanOrEqual(2);
  expect(fractionChanged).toBeLessThan(0.01);
  expect(counts).toEqual({
    updates: 2,
    renders: 3,
    preparations: 2,
    same: true,
    gameFps: 120,
    pausedFps: 60,
    updateFps: 60,
  });
  expect(errors).toEqual([]);
});
