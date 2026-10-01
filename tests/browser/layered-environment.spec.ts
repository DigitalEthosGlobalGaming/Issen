import { expect, test } from '@playwright/test';

test('layered scenery resizes, preserves context, caches frames and disposes independently', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const a = createEnvironmentRenderer(document),
      b = createEnvironmentRenderer(document);
    const canvas = document.createElement('canvas');
    canvas.width = 390;
    canvas.height = 844;
    const ctx = canvas.getContext('2d')!;
    const classic = document.createElement('canvas');
    classic.width = 2;
    classic.height = 2;
    const base = classic.getContext('2d')!;
    base.fillStyle = '#ff0000';
    base.fillRect(0, 0, 2, 2);
    let frame = {
      width: 390,
      height: 844,
      dpr: 2,
      time: 0,
      stage: 0,
      reducedMotion: true,
      reducedFlashes: true,
      lowQuality: false,
    };
    const loading = a.draw(ctx, frame);
    const fallbackPixel = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    await Promise.all([a.prepare(), b.prepare()]);
    ctx.globalAlpha = 0.7;
    const layered = a.draw(ctx, frame);
    const alpha = ctx.globalAlpha;
    const first = a.snapshot();
    a.draw(ctx, { ...frame, time: 900 });
    const cached = a.snapshot().builds === first.builds;
    a.draw(ctx, frame);
    const sameAfterSwitch = a.snapshot().builds === first.builds;
    frame = { ...frame, width: 3840, height: 2160, dpr: 3 };
    a.draw(ctx, frame);
    const desktop = a.snapshot();
    a.dispose();
    const disposed = a.snapshot();
    const other = b.draw(ctx, frame);
    b.dispose();
    return {
      loading,
      fallbackPixel,
      layered,
      alpha,
      cached,
      sameAfterSwitch,
      desktop,
      disposed,
      other,
    };
  });
  expect(result.loading).toBe(false);
  expect(result.fallbackPixel).toEqual([0, 0, 0, 0]);
  expect(result.layered).toBe(true);
  expect(result.alpha).toBeCloseTo(0.7);
  expect(result.cached).toBe(true);
  expect(result.sameAfterSwitch).toBe(true);
  expect(result.desktop.pixels).toBeLessThanOrEqual(3_006_000);
  expect(result.desktop.layers).toBe(3);
  expect(result.disposed.width).toBe(0);
  expect(result.disposed.height).toBe(0);
  expect(result.other).toBe(true);
});

test('missing sprite assets report unavailable without substituted artwork', async ({ page }) => {
  await page.route('**/mountain-atlas.png*', (route) => route.abort());
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const renderer = createEnvironmentRenderer(document);
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d')!;
    const classic = document.createElement('canvas');
    classic.width = 2;
    classic.height = 2;
    const base = classic.getContext('2d')!;
    base.fillStyle = '#ff0000';
    base.fillRect(0, 0, 2, 2);
    await renderer.prepare();
    const drawn = renderer.draw(ctx, {
      width: 10,
      height: 10,
      dpr: 1,
      time: 0,
      stage: 0,
      reducedMotion: false,
      reducedFlashes: false,
      lowQuality: false,
    });
    const backend = renderer.backend;
    const pixel = Array.from(ctx.getImageData(0, 0, 1, 1).data);
    renderer.dispose();
    return { drawn, backend, pixel };
  });
  expect(result.drawn).toBe(false);
  expect(result.backend).toBe('unavailable');
  expect(result.pixel).toEqual([0, 0, 0, 0]);
});

test('ink layers retain film grading and freeze decorative motion for accessibility', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const renderer = createEnvironmentRenderer(document);
    await renderer.prepare();
    const canvas = document.createElement('canvas');
    canvas.width = 480;
    canvas.height = 270;
    const ctx = canvas.getContext('2d')!;
    const frame = {
      width: 480,
      height: 270,
      dpr: 1,
      time: 0,
      stage: 0,
      reducedMotion: false,
      reducedFlashes: false,
      lowQuality: false,
    };
    const pixels = () => canvas.toDataURL();
    const render = (changes = {}) => {
      renderer.draw(ctx, { ...frame, ...changes });
      return pixels();
    };
    const stillA = render({ reducedMotion: true });
    const stillB = render({ reducedMotion: true, time: 12 });
    const flashesA = render({ reducedFlashes: true });
    const flashesB = render({ reducedFlashes: true, time: 12 });
    const movingA = render();
    const movingB = render({ time: 12 });
    const films = [
      'mono',
      'sepia',
      'silver',
      'noir',
      'cyan',
      'nitrate',
      'ukiyo',
      'koda',
      'supporter-print',
      'trial-gold',
      'trial-glitch',
      'trial-dusk',
      'trial-dawn',
    ];
    const outputs = films.map((film) => {
      render({ reducedMotion: true });
      applyFilm(ctx, 480, 270, canvas, film, 0, { reducedMotion: true, reducedFlashes: true });
      return pixels();
    });
    renderer.dispose();
    return {
      motionFrozen: stillA === stillB,
      flashesFrozen: flashesA === flashesB,
      moving: movingA !== movingB,
      filmCount: outputs.length,
      distinct: new Set(outputs).size,
    };
  });
  expect(result.motionFrozen).toBe(true);
  expect(result.flashesFrozen).toBe(true);
  expect(result.moving).toBe(true);
  expect(result.distinct).toBe(result.filmCount);
});
