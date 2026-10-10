import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('mixed precision preserves atlas, lighting and film output against highp', async ({
  page,
}, testInfo) => {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const { drawInstancedGrass } = await import('/src/rendering/scene-grass.ts');
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const nativeSource = WebGL2RenderingContext.prototype.shaderSource;
    let loweredPrograms = 0;
    WebGL2RenderingContext.prototype.shaderSource = function (shader, source) {
      if (source.includes('mediump')) loweredPrograms++;
      if ((this.canvas as HTMLCanvasElement).dataset.reference)
        source = source.replace(/\bmediump\b/g, 'highp');
      nativeSource.call(this, shader, source);
    };
    const canvases = [false, true].map((reference) => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 128;
      if (reference) canvas.dataset.reference = 'highp';
      document.body.append(canvas);
      return canvas;
    });
    const painters = await Promise.all(canvases.map((canvas) => createPixiScenePainter(canvas)));
    const texture = (fill: string, gradient = false) => {
      const source = document.createElement('canvas');
      source.width = 2048;
      source.height = 32;
      const c = source.getContext('2d')!;
      if (gradient) {
        const g = c.createLinearGradient(0, 0, 2048, 0);
        g.addColorStop(0, '#010203');
        g.addColorStop(0.5, '#739bca');
        g.addColorStop(1, '#fff4b0');
        c.fillStyle = g;
      } else c.fillStyle = fill;
      c.fillRect(0, 0, 2048, 32);
      return { source, revision: 0, frame: [1537, 0, 511, 32] as const };
    };
    const colour = texture('', true),
      normal = texture('#7095f0'),
      emissive = texture('#261008');
    const blades = Array.from({ length: 30 }, (_, i) => ({
      x: i * 8,
      y: 125,
      h: 30,
      w: 2,
      ph: i,
      col: '#627b48',
    }));
    const copy = document.createElement('canvas');
    copy.width = 256;
    copy.height = 128;
    const read = copy.getContext('2d', { willReadFrequently: true })!;
    const rows: { lighting: string; grass: string; film: string; max: number; changed: number }[] =
      [];
    try {
      for (const lighting of ['off', 'half', 'full'])
        for (const grass of ['medium', 'high'])
          for (const film of ['', 'noir', 'trial-glitch']) {
            const surface = texture(grass === 'high' ? '#14ffff' : '#d000ff');
            const outputs = painters.map((painter, index) => {
              const canvas = canvases[index]!;
              canvas.dataset.graphicsLighting = lighting;
              canvas.dataset.graphicsGrass = grass;
              painter.begin();
              setSceneLighting(painter, {
                ambient: [0.025, 0.04, 0.07],
                directional: [0.7, 0.6, 0.4],
                direction: [-0.3, -0.2, 1],
                points: [
                  { x: 173.25, y: 57.75, z: 20, radius: 110, intensity: 2, color: [1, 0.2, 0.04] },
                ],
              });
              painter.fillStyle = '#10151c';
              painter.fillRect(0, 0, 256, 128);
              drawMaterialStamp(painter, {
                texture: colour,
                material: {
                  normal,
                  surface,
                  emissive,
                  lighting: 1,
                  depth: 8,
                  fog: 0.12,
                  fogColor: [0.08, 0.1, 0.14],
                },
                x: 0.25,
                y: 0.75,
                width: 256,
                height: 128,
              });
              drawInstancedGrass(painter, {
                blades,
                density: 0.6,
                time: 2.7,
                wind: 0.35,
                depth: 12,
              });
              if (film) applyFilm(painter, 256, 128, canvas, film, 2.7);
              painter.flush();
              read.clearRect(0, 0, 256, 128);
              read.drawImage(canvas, 0, 0);
              return read.getImageData(0, 0, 256, 128).data;
            });
            let max = 0,
              changed = 0;
            for (let i = 0; i < outputs[0]!.length; i++) {
              const delta = Math.abs(outputs[0]![i]! - outputs[1]![i]!);
              max = Math.max(max, delta);
              if (delta) changed++;
            }
            rows.push({ lighting, grass, film, max, changed });
          }
      return {
        rows,
        loweredPrograms,
        glErrors: canvases.map((canvas) => canvas.getContext('webgl2')!.getError()),
      };
    } finally {
      for (const painter of painters) painter.dispose();
      WebGL2RenderingContext.prototype.shaderSource = nativeSource;
    }
  });
  await writeFile(
    testInfo.outputPath('precision-comparison.json'),
    JSON.stringify(result, null, 2),
  );
  expect(errors).toEqual([]);
  expect(result.loweredPrograms).toBeGreaterThan(0);
  expect(result.glErrors).toEqual([0, 0]);
  expect(result.rows).toHaveLength(18);
  // A deliberate precision change allows at most two display-byte rounding steps.
  for (const row of result.rows) expect(row.max, JSON.stringify(row)).toBeLessThanOrEqual(2);
});
