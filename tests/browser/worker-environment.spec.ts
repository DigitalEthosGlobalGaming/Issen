import { expect, test } from '@playwright/test';

test('worker construction, runtime and composition errors settle through the owned local fallback', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const original = window.Worker;
    const frame = {
      width: 160,
      height: 100,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 7,
      reducedMotion: true,
      reducedFlashes: true,
      lowQuality: true,
    };
    const results = [];
    try {
      for (const failure of ['construction', 'runtime', 'composition']) {
        let terminated = 0;
        (window as any).Worker = class extends EventTarget {
          constructor() {
            super();
            if (failure === 'construction') throw Error('fixture constructor failure');
          }
          postMessage(request: { id: number }) {
            if (failure === 'composition') {
              this.dispatchEvent(
                new MessageEvent('message', {
                  data: {
                    id: request.id,
                    ok: false,
                    error: 'fixture composition failure',
                    layers: [],
                    foreground: [],
                    snapshot: {},
                  },
                }),
              );
              return;
            }
            this.dispatchEvent(new ErrorEvent('error', { message: 'fixture runtime failure' }));
          }
          terminate() {
            terminated++;
          }
        };
        const renderer = createEnvironmentRenderer(document);
        const ready = await renderer.compose(frame);
        const canvas = document.createElement('canvas');
        canvas.width = 160;
        canvas.height = 100;
        const drawn = renderer.draw(await createTestDrawing(canvas), frame);
        const snapshot = renderer.snapshot();
        renderer.dispose();
        results.push({
          ready,
          drawn,
          worker: snapshot.worker,
          stage: snapshot.stage,
          failure: snapshot.workerFailure,
          terminated,
        });
      }
    } finally {
      window.Worker = original;
    }
    return results;
  });
  for (const row of result) {
    expect(row.ready).toBe(true);
    expect(row.drawn).toBe(true);
    expect(row.worker).toBe(false);
    expect(row.stage).toBe(1);
  }
  expect(result[1]!.failure).toContain('fixture runtime failure');
  expect(result[1]!.terminated).toBeGreaterThan(0);
  expect(result[2]!.failure).toContain('fixture composition failure');
  expect(result[2]!.terminated).toBeGreaterThan(0);
});

test('worker scenery preserves all nine lit compositions and foreground materials', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { setSceneLighting } = await import('/src/rendering/scene-material.ts');
    const local = createEnvironmentRenderer(document, { worker: false });
    const worker = createEnvironmentRenderer(document);
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    const painter = await createPixiScenePainter(canvas);
    const readback = document.createElement('canvas');
    readback.width = 180;
    readback.height = 120;
    const read = readback.getContext('2d')!;
    const rows = [];
    for (let stage = 0; stage < 9; stage++) {
      const frame = {
        width: 180,
        height: 120,
        dpr: 1,
        time: 0,
        stage,
        stageSeed: 424242,
        reducedMotion: true,
        reducedFlashes: true,
        lowQuality: true,
      };
      await Promise.all([local.compose(frame), worker.compose(frame)]);
      const draw = (owner: typeof worker, enabled = true) => {
        painter.begin();
        setSceneLighting(painter, {
          materialLighting: enabled ? 1 : 0,
          ambient: [0.6, 0.6, 0.6],
          directional: [0, 0, 0],
          direction: [0, 0, 1],
          points: [{ x: 40, y: 20, z: 80, radius: 400, intensity: 1, color: [1, 0.9, 0.8] }],
        });
        const drawn = owner.draw(painter, frame);
        const foreground = owner.drawForeground(painter, frame);
        painter.flush();
        read.clearRect(0, 0, 180, 120);
        read.drawImage(canvas, 0, 0);
        return { drawn, foreground, pixels: read.getImageData(0, 0, 180, 120).data };
      };
      const before = draw(local),
        after = draw(worker);
      const unlitLocal = draw(local, false),
        unlitWorker = draw(worker, false);
      let changed = 0,
        alpha = 0,
        absolute = 0;
      for (let i = 0; i < before.pixels.length; i++) {
        const delta = Math.abs(before.pixels[i]! - after.pixels[i]!);
        if (i % 4 === 3) alpha += delta;
        else {
          absolute += delta;
          if (delta > 3) changed++;
        }
      }
      rows.push({
        stage,
        worker: worker.snapshot().worker,
        drawn: after.drawn,
        foreground: after.foreground,
        alpha,
        mean: absolute / (180 * 120 * 3),
        changed,
        unlitMismatch: unlitLocal.pixels.filter(
          (value, index) => value !== unlitWorker.pixels[index],
        ).length,
        lightingChanged: after.pixels.some(
          (value, index) => index % 4 !== 3 && Math.abs(value - unlitWorker.pixels[index]!) > 3,
        ),
      });
    }
    local.dispose();
    worker.dispose();
    painter.dispose();
    return rows;
  });
  for (const row of result) {
    expect(row.worker).toBe(true);
    expect(row.drawn).toBe(true);
    expect(row.alpha).toBe(0);
    expect(row.mean, `stage ${row.stage}`).toBeLessThan(1);
    expect(row.changed, `stage ${row.stage}`).toBeLessThan(180 * 120 * 3 * 0.04);
    expect(row.unlitMismatch, `stage ${row.stage}`).toBe(0);
    expect(row.lightingChanged).toBe(true);
    if (row.stage === 4) expect(row.foreground).toBe(true);
  }
});

test('worker requests coalesce and owners dispose independently, including pending builds', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const a = createEnvironmentRenderer(document),
      b = createEnvironmentRenderer(document);
    const c = document.createElement('canvas');
    c.width = 200;
    c.height = 150;
    const g = await createTestDrawing(c);
    const frame = {
      width: 200,
      height: 150,
      dpr: 1,
      time: 0,
      stage: 0,
      stageSeed: 1,
      reducedMotion: true,
      reducedFlashes: true,
      lowQuality: true,
    };
    await Promise.all([a.compose(frame), b.compose(frame)]);
    const initial = a.snapshot().builds;
    for (let stage = 1; stage < 9; stage++) a.draw(g, { ...frame, stage });
    const final = { ...frame, stage: 4, width: 180, height: 120, stageSeed: 3 };
    const ready = await a.compose(final);
    const snapshot = a.snapshot();
    a.dispose();
    const independent = b.draw(g, frame);
    const pending = b.compose({ ...frame, stage: 5, width: 250 });
    b.dispose();
    return {
      ready,
      worker: snapshot.worker,
      builds: snapshot.builds - initial,
      foreground: snapshot.foreground.layers,
      independent,
      pending: await pending,
      disposed: a.snapshot().pixels === 0 && b.snapshot().pixels === 0,
    };
  });
  expect(result).toMatchObject({
    ready: true,
    worker: true,
    foreground: 2,
    independent: true,
    pending: false,
    disposed: true,
  });
  expect(result.builds).toBeLessThanOrEqual(2);
});

test('inactive owners defer composition until visible and keep the completed scene drawable', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const r = createEnvironmentRenderer(document);
    const frame = {
      width: 180,
      height: 120,
      dpr: 1,
      time: 0,
      stage: 0,
      stageSeed: 1,
      reducedMotion: true,
      reducedFlashes: true,
      lowQuality: true,
    };
    await r.compose(frame);
    const before = r.snapshot().builds;
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });
    document.dispatchEvent(new Event('visibilitychange'));
    const ready = r.compose({ ...frame, stage: 3 });
    await new Promise((resolve) => setTimeout(resolve, 100));
    const quiet = r.snapshot().builds === before && !r.snapshot().pending;
    const c = document.createElement('canvas');
    c.width = 180;
    c.height = 120;
    const retained = r.draw(await createTestDrawing(c), { ...frame, stage: 3 });
    delete (document as any).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    const resumed = await ready;
    const changed = r.snapshot().builds === before + 1;
    r.dispose();
    return { quiet, retained, resumed, changed };
  });
  expect(result).toEqual({ quiet: true, retained: true, resumed: true, changed: true });
});
