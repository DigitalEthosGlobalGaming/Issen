import { expect, test } from '@playwright/test';

test('live cosmetics stay independent and resolution changes coalesce while audio avoids preparation', async ({
  page,
}, testInfo) => {
  await page.addInitScript(() =>
    localStorage.setItem('issen.meta', JSON.stringify({ schemaVersion: 4, tutorial: 'skipped' })),
  );
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.locator('#bPlay').click();
  await page.locator('#bBegin').click();
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  const before = await page.locator('#c').evaluate((canvas: HTMLCanvasElement) => canvas.width);
  await page.locator('#pauseBtn').click();
  await page.locator('#bPauseOptions').click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Graphics/ })
    .click();
  await page.getByLabel('Adaptive quality', { exact: true }).uncheck();
  await page.getByLabel('Preload next stage', { exact: true }).uncheck();
  await page.getByLabel('Ambient particles', { exact: true }).selectOption('off');
  await page.getByLabel('Weather effects', { exact: true }).selectOption('reduced');
  await page.getByLabel('Lighting', { exact: true }).selectOption('half');
  await page.getByLabel('Grass', { exact: true }).selectOption('medium');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-grass', 'medium');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-particles', 'off');
  await expect(page.locator('html')).toHaveAttribute('data-graphics-weather', 'reduced');
  const immediate = await page
    .getByLabel('Render resolution', { exact: true })
    .evaluate((input: HTMLInputElement) => {
      for (const value of ['90', '70', '50']) {
        input.value = value;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return {
        width: (document.querySelector('#c') as HTMLCanvasElement).width,
        applying: document.documentElement.dataset.graphicsApplying,
      };
    });
  expect(immediate).toEqual({ width: before, applying: 'true' });
  await expect(page.locator('html')).toHaveAttribute('data-graphics-resolution', '50');
  await expect
    .poll(() => page.locator('#c').evaluate((canvas: HTMLCanvasElement) => canvas.width))
    .toBe(Math.round(before / 2));
  await expect(page.locator('#c')).toHaveAttribute('data-scene-state', 'ready', {
    timeout: 30_000,
  });
  await expect(page.locator('html')).toHaveAttribute('data-graphics-applying', 'false');
  const chosen = await page.evaluate(
    () => JSON.parse(localStorage.getItem('issen.settings')!).graphics,
  );
  expect(chosen).toMatchObject({
    preset: 'custom',
    resolution: 50,
    particles: 'off',
    weather: 'reduced',
    lighting: 'half',
    grass: 'medium',
    adaptive: false,
    preload: false,
  });
  await page.screenshot({ path: testInfo.outputPath('graphics-controls-portrait.png') });
  await page.locator('#options').getByRole('button', { name: 'Back', exact: true }).click();
  await page
    .locator('#options')
    .getByRole('button', { name: /^Audio/ })
    .click();
  const preparedBefore = await page.evaluate(() =>
    performance
      .getEntriesByType('mark')
      .filter((e) => e.name.startsWith('issen:prepare-scene:'))
      .map((e) => e.startTime),
  );
  await page.getByLabel('Master mute', { exact: true }).check();
  const preparedAfter = await page.evaluate(() =>
    performance
      .getEntriesByType('mark')
      .filter((e) => e.name.startsWith('issen:prepare-scene:'))
      .map((e) => e.startTime),
  );
  expect(preparedAfter).toEqual(preparedBefore);
});

test('Off is flat unlit and Half uses smaller light targets without overwriting debug resolution', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 8;
    canvas.height = 4;
    const painter = await createPixiScenePainter(canvas);
    function texture(fill: string) {
      const source = document.createElement('canvas');
      source.width = 8;
      source.height = 4;
      const g = source.getContext('2d')!;
      g.fillStyle = fill;
      g.fillRect(0, 0, 8, 4);
      return { source, revision: 0 };
    }
    const colour = texture('#808080'),
      normal = texture('#8080ff'),
      surface = texture('rgb(220,0,255)');
    const readback = document.createElement('canvas');
    readback.width = 8;
    readback.height = 4;
    const read = readback.getContext('2d')!;
    const lighting = {
      ambient: [0.05, 0.05, 0.05],
      directional: [0, 0, 0],
      direction: [0, 0, 1],
      points: [],
      materialLighting: 1,
    };
    const rows = [];
    for (const mode of ['full', 'half', 'off']) {
      canvas.dataset.graphicsLighting = mode;
      painter.begin();
      setSceneLighting(painter, lighting);
      drawMaterialStamp(painter, {
        texture: colour,
        material: { normal, surface, lighting: 1, depth: 0, fog: 0, fogColor: [0, 0, 0] },
        x: 0,
        y: 0,
        width: 8,
        height: 4,
      });
      painter.flush();
      read.clearRect(0, 0, 8, 4);
      read.drawImage(canvas, 0, 0);
      rows.push({
        mode,
        red: read.getImageData(2, 2, 1, 1).data[0],
        width: painter.lightTargets!.width,
      });
    }
    canvas.dataset.graphicsLighting = 'half';
    canvas.dataset.lightResolution = 'full';
    painter.begin();
    setSceneLighting(painter, lighting);
    painter.flush();
    const debugWidth = painter.lightTargets!.width;
    painter.dispose();
    return { rows, debugWidth, unchanged: lighting.materialLighting };
  });
  expect(result.rows.map((row) => row.width)).toEqual([8, 4, 4]);
  expect(result.rows[0].red).toBeLessThan(70);
  expect(result.rows[1].red).toBeLessThan(70);
  expect(result.rows[2].red).toBe(128);
  expect(result.debugWidth).toBe(8);
  expect(result.unchanged).toBe(1);
});
