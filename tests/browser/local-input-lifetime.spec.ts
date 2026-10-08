import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('completed local planes and live effects survive compose input eviction', async ({
  page,
}, testInfo) => {
  test.setTimeout(180000);
  const warnings: string[] = [];
  page.on('console', (m) => {
    if (/feedback loop|destroyed while still bound|GL_INVALID_OPERATION/i.test(m.text()))
      warnings.push(m.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createLocalEnvironmentRenderer } =
      await import('/src/rendering/environment/local-renderer.ts');
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const { runtimeAssets } = await import('/src/platform/runtime-assets.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const enemyUrls = assetMaterialCatalog
      .filter((p) =>
        /\/enemy-(ronin-simple|clothing-variants|headwear-atlas|headwear-variants)\.png$/.test(
          p.sourcePath,
        ),
      )
      .flatMap((p) => Object.values(p.maps));
    if (enemyUrls.length !== 12) throw Error('Enemy catalogue selection failed');
    const pressureUrls = runtimeAssets
      .filter((a) => a.group === 'figures' && a.width * a.height > 1000000)
      .map((a) => a.url);
    const rows = [];
    for (let stage = 0; stage < 9; stage++)
      for (const low of stage === 0 || stage === 4 ? [true, false] : [true]) {
        const renderer = createLocalEnvironmentRenderer(document);
        const pressure = createMainImageOwner(document);
        const frame = {
          width: low ? 160 : 170,
          height: low ? 100 : 110,
          dpr: low ? 1 : 2,
          time: 1.25,
          stage,
          stageSeed: low ? 424242 : 424243,
          lowQuality: low,
          reducedMotion: low,
          reducedFlashes: low,
        };
        const inputSources: HTMLImageElement[] = [];
        const decode = HTMLImageElement.prototype.decode;
        HTMLImageElement.prototype.decode = function () {
          inputSources.push(this);
          return decode.call(this);
        };
        try {
          if (!(await renderer.compose(frame))) throw Error('Compose failed');
        } finally {
          HTMLImageElement.prototype.decode = decode;
        }
        const canvas = document.createElement('canvas');
        canvas.width = 180;
        canvas.height = 120;
        const g = await createTestDrawing(canvas);
        const planes = () => {
          const output = renderer.exportLayers();
          return [...output.layers, ...output.foreground]
            .flatMap((l) => [
              l.colour,
              ...['normal', 'surface', 'emissive'].map((k) => l.material?.[k]?.source),
            ])
            .map((c) => {
              if (!c) throw Error('Missing plane');
              return c
                .getContext('2d', { willReadFrequently: true })
                .getImageData(0, 0, c.width, c.height).data;
            });
        };
        const draw = () => {
          g.begin();
          g.clearRect(0, 0, 180, 120);
          if (!renderer.draw(g, frame)) throw Error('Missing scene');
          renderer.drawForeground(g, frame);
          return g.getImageData(0, 0, 180, 120).data;
        };
        const diff = (a: Uint8ClampedArray, b: Uint8ClampedArray) =>
          a.reduce((max, v, i) => Math.max(max, Math.abs(v - b[i])), 0);
        const before = renderer.snapshot(),
          firstPlanes = planes(),
          firstPixels = draw();
        const expected = planes(),
          pixels = draw();
        const controlRawMax = Math.max(...firstPlanes.map((p, i) => diff(p, expected[i]))),
          controlLiveMax = diff(firstPixels, pixels);

        const released = renderer.snapshot();
        const enemy = enemyUrls.map((url) => pressure.acquire(url!));
        await Promise.all(enemy.map((lease) => lease.ready));
        for (const url of pressureUrls) {
          const lease = pressure.acquire(url);
          await lease.ready;
          lease.release();
        }
        const after = renderer.snapshot(),
          actual = planes(),
          displayed = draw();
        const rawMax = Math.max(...expected.map((p, i) => diff(p, actual[i]))),
          liveMax = diff(pixels, displayed);
        const replayMax = diff(displayed, draw());
        let restoredMax = 0;
        if ((stage === 0 || stage === 4) && !low) {
          const extension = canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context')!;
          await new Promise<void>((resolve) => {
            canvas.addEventListener('webglcontextlost', () => resolve(), { once: true });
            extension.loseContext();
          });
          await new Promise((resolve) => setTimeout(resolve, 0));
          await new Promise<void>((resolve) => {
            canvas.addEventListener('webglcontextrestored', () => resolve(), { once: true });
            extension.restoreContext();
          });
          restoredMax = diff(displayed, draw());
        }
        const remainingInputs = inputSources.filter((i) => i.naturalWidth > 0).length;
        for (const lease of enemy) lease.release();
        renderer.dispose();
        pressure.dispose();
        g.dispose();
        rows.push({
          stage,
          low,
          before,
          released,
          after,
          controlRawMax,
          controlLiveMax,
          rawMax,
          liveMax,
          replayMax,
          restoredMax,
          createdInputs: inputSources.length,
          remainingInputs,
          disposed: renderer.snapshot(),
        });
      }
    return rows;
  });
  await writeFile(
    testInfo.outputPath('completed-scene-release.json'),
    JSON.stringify({ rows: result, warnings }, null, 2),
  );
  expect(result).toHaveLength(11);
  for (const row of result) {
    expect(row.rawMax).toBeLessThanOrEqual(row.controlRawMax);
    expect(row.liveMax).toBeLessThanOrEqual(row.controlLiveMax);
    expect(row.replayMax).toBe(0);
    expect(row.restoredMax).toBeLessThanOrEqual(1);
    expect(row.after.decodedLoader.evictions).toBeGreaterThan(0);
    expect(row.after.decodedLoader.peakBytes).toBeLessThanOrEqual(256 * 1024 * 1024);
    const liveInputs = row.stage === 0 ? 4 : row.stage === 4 ? 3 : 0;
    expect(row.released.decodedLoader.pinned).toBe(liveInputs);
    expect(row.remainingInputs).toBe(liveInputs);
    expect(row.disposed.decodedLoader.bytes).toBe(0);
  }
  expect(warnings).toEqual([]);
});

test('local reacquisition preserves bamboo maps and rebuilds every composition key', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createLocalEnvironmentRenderer } =
      await import('/src/rendering/environment/local-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const renderer = createLocalEnvironmentRenderer(document);
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    const g = await createTestDrawing(canvas);
    const frame = {
      width: 140,
      height: 95,
      dpr: 1,
      time: 1.25,
      stage: 4,
      stageSeed: 424242,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    };
    const capture = () => {
      g.begin();
      g.clearRect(0, 0, 180, 120);
      if (!renderer.draw(g, frame) || !renderer.drawForeground(g, frame))
        throw Error('Missing bamboo scene');
      return g.getImageData(0, 0, 180, 120).data;
    };
    const rows = [];
    if (!(await renderer.compose(frame))) throw Error('Initial compose failed');
    const initial = renderer.exportLayers().foreground;
    for (const change of [
      { stageSeed: 424243 },
      { dpr: 2 },
      { lowQuality: false },
      { width: 160, height: 100 },
    ]) {
      const previousBuilds = renderer.snapshot().builds;
      Object.assign(frame, change);
      if (!(await renderer.compose(frame))) throw Error('Key compose failed');
      const output = renderer.exportLayers().foreground;
      const before = capture(),
        after = capture();
      const replayMax = before.reduce((max, v, i) => Math.max(max, Math.abs(v - after[i])), 0);
      const afterBuilds = renderer.snapshot().builds;
      if (!(await renderer.compose({ ...frame, time: 2.5 })))
        throw Error('Repeated compose failed');
      rows.push({
        previousBuilds,
        afterBuilds,
        repeatBuilds: renderer.snapshot().builds,
        replayMax,
        maps: output.every(
          (l) =>
            l.material &&
            ['normal', 'surface', 'emissive'].every(
              (k) => (l.material as any)[k]?.source.width > 0,
            ),
        ),
        retainedSeedMaps:
          'stageSeed' in change
            ? output.every(
                (l, i) =>
                  l.colour === initial[i].colour &&
                  l.material?.normal.source === initial[i].material?.normal.source,
              )
            : true,
        pins: renderer.snapshot().decodedLoader?.pinned,
      });
    }
    const foreground = renderer.exportLayers().foreground;
    await renderer.prepare(4);
    const preservedDuringPrepare = renderer
      .exportLayers()
      .foreground.every(
        (l, i) =>
          l.colour === foreground[i].colour &&
          l.material?.normal.source === foreground[i].material?.normal.source,
      );
    if (!(await renderer.compose(frame))) throw Error('Explicit preparation failed');
    const explicitMaps = renderer.exportLayers().foreground.every((l) => !!l.material);
    renderer.dispose();
    g.dispose();
    return { rows, preservedDuringPrepare, explicitMaps, disposed: renderer.snapshot() };
  });
  for (const row of result.rows) {
    expect(row.afterBuilds).toBe(row.previousBuilds + 1);
    expect(row.repeatBuilds).toBe(row.afterBuilds);
    expect(row.replayMax).toBeLessThanOrEqual(1);
    expect(row.maps).toBe(true);
    expect(row.retainedSeedMaps).toBe(true);
    expect(row.pins).toBe(3);
  }
  expect(result.preservedDuringPrepare).toBe(true);
  expect(result.explicitMaps).toBe(true);
  expect(result.disposed.decodedLoader?.bytes).toBe(0);
});

test('obsolete local composition cannot publish after a newer stage request', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createLocalEnvironmentRenderer } =
      await import('/src/rendering/environment/local-renderer.ts');
    const renderer = createLocalEnvironmentRenderer(document);
    const frame = {
      width: 160,
      height: 100,
      dpr: 1,
      time: 0,
      stage: 0,
      stageSeed: 424242,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    };
    const obsolete = renderer.compose(frame);
    const incoming = renderer.compose({ ...frame, stage: 4, stageSeed: 424243 });
    const outcomes = await Promise.all([obsolete, incoming]);
    const snapshot = renderer.snapshot();
    const foreground = renderer.exportLayers().foreground;
    const maps = foreground.every((layer) => !!layer.material);
    renderer.dispose();
    return {
      outcomes,
      snapshot,
      maps,
      foregroundCount: foreground.length,
      disposed: renderer.snapshot(),
    };
  });
  expect(result.outcomes).toEqual([false, true]);
  expect(result.snapshot.stage).toBe(4);
  expect(result.snapshot.builds).toBe(1);
  expect(result.snapshot.decodedLoader?.pinned).toBe(3);
  expect(result.snapshot.decodedLoader!.peakBytes).toBeLessThanOrEqual(256 * 1024 * 1024);
  expect(result.foregroundCount).toBe(2);
  expect(result.maps).toBe(true);
  expect(result.disposed.decodedLoader?.bytes).toBe(0);
});
