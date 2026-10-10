import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('all nine worker scenes have distinct detail tiers while High preserves authored composition', async ({
  page,
}, testInfo) => {
  test.setTimeout(90_000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createWorkerEnvironmentRenderer } =
      await import('/src/rendering/environment/worker-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const NativeWorker = window.Worker;
    const shorePlanes: { key: string; hashes: number[] }[] = [];
    document.body.replaceChildren();
    document.body.style.cssText =
      'display:grid;grid-template-columns:repeat(2,180px);gap:8px;padding:8px;margin:0';
    window.Worker = class extends NativeWorker {
      constructor(...args: ConstructorParameters<typeof Worker>) {
        super(...args);
        this.addEventListener('message', (event) => {
          const response = event.data;
          if (!response.key || !response.layers?.length || JSON.parse(response.key)[3] !== 7)
            return;
          const hashes: number[] = [];
          for (const layer of response.layers)
            for (const name of ['colour', 'normal', 'surface', 'emissive']) {
              const bitmap = layer[name];
              if (!bitmap) {
                hashes.push(0);
                continue;
              }
              const readback = document.createElement('canvas');
              readback.width = bitmap.width;
              readback.height = bitmap.height;
              const g = readback.getContext('2d', { willReadFrequently: true })!;
              g.drawImage(bitmap, 0, 0);
              let hash = 2166136261;
              for (const byte of g.getImageData(0, 0, bitmap.width, bitmap.height).data)
                hash = Math.imul(hash ^ byte, 16777619);
              hashes.push(hash >>> 0);
              readback.width = readback.height = 0;
            }
          shorePlanes.push({ key: response.key, hashes });
        });
      }
    };
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 180;
    const drawing = await createTestDrawing(canvas);
    const owner = createWorkerEnvironmentRenderer(document, (items, signal) =>
      drawing.warmScene(items, signal),
    );
    const frame = {
      width: 320,
      height: 180,
      dpr: 1,
      time: 0,
      stage: 0,
      stageSeed: 123,
      lowQuality: false,
      reducedMotion: true,
      reducedFlashes: true,
    };
    const rows = [];
    const difference = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
      let count = 0;
      for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) count++;
      return count;
    };
    async function compose(stage: number, sceneryDetail?: 'low' | 'normal' | 'high') {
      const current = { ...frame, stage, sceneryDetail, lowQuality: sceneryDetail === 'low' };
      if (!(await owner.compose(current)))
        throw Error(`Scene ${stage}/${sceneryDetail} unavailable`);
      drawing.begin();
      if (!owner.draw(drawing, current)) throw Error('Prepared scene missing');
      owner.drawForeground(drawing, current);
      return drawing.getImageData(0, 0, 320, 180).data.slice();
    }
    try {
      for (let stage = 0; stage < 9; stage++) {
        const legacy = await compose(stage);
        const high = await compose(stage, 'high');
        let highLegacyMaximum = 0;
        for (let i = 0; i < high.length; i++)
          highLegacyMaximum = Math.max(highLegacyMaximum, Math.abs(high[i]! - legacy[i]!));
        const normal = await compose(stage, 'normal');
        const preview = document.createElement('canvas');
        preview.width = 320;
        preview.height = 180;
        preview.style.width = '180px';
        preview.style.height = '101px';
        preview.getContext('2d')!.putImageData(new ImageData(normal, 320, 180), 0, 0);
        preview.setAttribute('aria-label', `Normal scenery stage ${stage}`);
        document.body.append(preview);
        const low = await compose(stage, 'low');
        rows.push({
          stage,
          highLegacy: difference(high, legacy),
          highLegacyMaximum,
          highNormal: difference(high, normal),
          normalLow: difference(normal, low),
          failure: owner.snapshot().workerFailure,
        });
      }
      return { rows, shorePlanes };
    } finally {
      owner.dispose();
      drawing.dispose();
      window.Worker = NativeWorker;
    }
  });
  await writeFile(testInfo.outputPath('scenery-detail.json'), JSON.stringify(result, null, 2));
  await page.screenshot({ path: testInfo.outputPath('normal-scenery-stages.png'), fullPage: true });
  for (const row of result.rows) {
    expect(row.highLegacy, `High stage ${row.stage}`).toBe(0);
    expect(row.highNormal, `Normal stage ${row.stage}`).toBeGreaterThan(0);
    expect(row.normalLow, `Low stage ${row.stage}`).toBeGreaterThan(0);
    expect(row.failure).toBeUndefined();
  }
});

test('scenery choices debounce into one rebuild without resizing or advancing a paused run', async ({
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
  await page.getByLabel('Scenery detail', { exact: true }).selectOption('high');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-scenery', 'high');
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  const snapshot = () =>
    page.evaluate(() => ({
      width: (document.querySelector('#c') as HTMLCanvasElement).width,
      checkpoint: localStorage.getItem('issen.runCheckpoint'),
      prepared: performance
        .getEntriesByType('mark')
        .filter((entry) => entry.name.startsWith('issen:prepare-scene:'))
        .map((entry) => entry.name),
    }));
  const before = await snapshot();
  const immediate = await page
    .getByLabel('Scenery detail', { exact: true })
    .evaluate((input: HTMLSelectElement) => {
      for (const value of ['low', 'high', 'normal']) {
        input.value = value;
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return {
        detail: document.documentElement.dataset.graphicsScenery,
        applying: document.documentElement.dataset.graphicsApplying,
      };
    });
  expect(immediate).toEqual({ detail: 'high', applying: 'true' });
  await expect(page.locator('html')).toHaveAttribute('data-graphics-scenery', 'normal');
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  await expect(page.locator('html')).toHaveAttribute('data-graphics-applying', 'false');
  const after = await snapshot();
  expect(after.width).toBe(before.width);
  expect(after.checkpoint).toBe(before.checkpoint);
  expect(after.prepared.length).toBe(before.prepared.length + 1);
  expect(after.prepared.at(-1)).toContain('"normal"]');
  const saved = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.settings')!).graphics,
  );
  expect(saved).toMatchObject({ preset: 'custom', scenery: 'normal' });
});
