import { expect, test } from '@playwright/test';

test('MSAA changes match fresh painters and retire the previous back-buffer source', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvases = [0, 1, 2].map(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 64;
      return canvas;
    });
    const painters = await Promise.all(
      canvases.map((canvas, index) => createPixiScenePainter(canvas, { antialias: index !== 2 })),
    );
    const readback = document.createElement('canvas');
    readback.width = 96;
    readback.height = 64;
    const read = readback.getContext('2d', { willReadFrequently: true })!;
    const render = (index: number) => {
      const g = painters[index]!;
      g.begin();
      g.fillStyle = '#111';
      g.fillRect(0, 0, 96, 64);
      g.fillStyle = '#ddd';
      g.save();
      g.translate(46.3, 30.7);
      g.rotate(0.37);
      g.fillRect(-23, -12, 46, 24);
      g.restore();
      g.flush();
      read.clearRect(0, 0, 96, 64);
      read.drawImage(canvases[index]!, 0, 0);
      return read.getImageData(0, 0, 96, 64).data.slice();
    };
    const same = (a: Uint8ClampedArray, b: Uint8ClampedArray) =>
      a.every((value, index) => value === b[index]);
    try {
      const on = render(1),
        off = render(2);
      const renderer = Reflect.get(painters[0]!, 'renderer');
      const comparisons = [],
        destroyed: boolean[] = [];
      for (const enabled of [true, false, true, false, true]) {
        const old = Reflect.get(renderer.backBuffer, '_backBufferTexture')?.source;
        canvases[0]!.dataset.graphicsAntialias = String(enabled);
        comparisons.push(same(render(0), enabled ? on : off));
        if (old && old !== Reflect.get(renderer.backBuffer, '_backBufferTexture')?.source)
          destroyed.push(old.destroyed);
      }
      return {
        comparisons,
        destroyed,
        distinct: !same(on, off),
        context: canvases[0]!.getContext('webgl2')!.getContextAttributes()!.antialias,
        error: renderer.gl.getError(),
      };
    } finally {
      painters.forEach((painter) => painter.dispose());
    }
  });
  expect(result.comparisons).toEqual([true, true, true, true, true]);
  expect(result.destroyed).toEqual([true, true, true, true]);
  expect(result.distinct).toBe(true);
  expect(result.context).toBe(false);
  expect(result.error).toBe(0);
});

test('Graphics debounces AA, keeps the same paused canvas and persists the choice', async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  await page.locator('#pauseBtn').click();
  await page.locator('#bPauseOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Graphics/ })
    .click();
  await page.getByLabel('Anti-aliasing', { exact: true }).check();
  await expect(page.locator('#c')).toHaveAttribute('data-graphics-antialias-applied', 'true');
  const before = await page.locator('#c').evaluate((canvas: HTMLCanvasElement) => {
    (window as any).aaCanvas = canvas;
    return {
      width: canvas.width,
      checkpoint: localStorage.getItem('issen.runCheckpoint'),
      prepared: performance
        .getEntriesByType('mark')
        .filter((entry) => entry.name.startsWith('issen:prepare-scene:')).length,
    };
  });
  const immediate = await page
    .getByLabel('Anti-aliasing', { exact: true })
    .evaluate((input: HTMLInputElement) => {
      for (const checked of [false, true, false]) {
        input.checked = checked;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        applied: document.documentElement.dataset.graphicsAntialias,
        applying: document.documentElement.dataset.graphicsApplying,
      };
    });
  expect(immediate).toEqual({ applied: 'true', applying: 'true' });
  await expect(page.locator('#c')).toHaveAttribute('data-graphics-antialias-applied', 'false');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-applying', 'false');
  const after = await page
    .locator('#c')
    .evaluate((canvas: HTMLCanvasElement) => ({
      same: canvas === (window as any).aaCanvas,
      width: canvas.width,
      checkpoint: localStorage.getItem('issen.runCheckpoint'),
      prepared: performance
        .getEntriesByType('mark')
        .filter((entry) => entry.name.startsWith('issen:prepare-scene:')).length,
    }));
  expect(after).toEqual({ ...before, same: true });
  expect(
    await page.evaluate(() => JSON.parse(localStorage.getItem('issen.settings')!).graphics),
  ).toMatchObject({ preset: 'custom', antialias: false });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await expect(page.locator('#c')).toHaveAttribute('data-graphics-antialias-applied', 'false');
});
