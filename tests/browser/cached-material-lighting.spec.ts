import { expect, test } from '@playwright/test';

test('cached coverage lights material pixels and preserves procedural colour and alpha', async ({
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
    const colour = document.createElement('canvas');
    colour.width = 8;
    colour.height = 4;
    const g = colour.getContext('2d')!;
    g.fillStyle = '#808080';
    g.fillRect(0, 0, 8, 4);
    const normal = document.createElement('canvas');
    normal.width = 8;
    normal.height = 4;
    const n = normal.getContext('2d')!;
    n.fillStyle = '#8080ff';
    n.fillRect(0, 0, 8, 4);
    const surface = document.createElement('canvas');
    surface.width = 8;
    surface.height = 4;
    const s = surface.getContext('2d')!;
    s.fillStyle = 'rgb(220,0,255)';
    s.fillRect(0, 0, 4, 4);
    const readback = document.createElement('canvas');
    readback.width = 8;
    readback.height = 4;
    const read = readback.getContext('2d')!;
    function render(enabled: boolean) {
      painter.begin();
      setSceneLighting(painter, {
        ambient: [0.05, 0.05, 0.05],
        directional: [0, 0, 0],
        direction: [0, 0, 1],
        points: [],
        materialLighting: enabled ? 1 : 0,
      });
      drawMaterialStamp(painter, {
        texture: { source: colour, revision: 0 },
        material: {
          normal: { source: normal, revision: 0 },
          surface: { source: surface, revision: 0 },
          surfaceCoverage: true,
          normalY: -1,
          lighting: 1,
          depth: 0,
          fog: 0,
          fogColor: [0, 0, 0],
        },
        x: 0,
        y: 0,
        width: 8,
        height: 4,
      });
      painter.flush();
      read.clearRect(0, 0, 8, 4);
      read.drawImage(canvas, 0, 0);
      return [...read.getImageData(0, 0, 8, 4).data];
    }
    const lit = render(true),
      unlit = render(false);
    painter.dispose();
    return {
      litMaterial: lit[4],
      litProcedural: lit[24],
      unlitMaterial: unlit[4],
      unlitProcedural: unlit[24],
      alpha: lit.every((value, index) => index % 4 !== 3 || value === unlit[index]),
    };
  });
  expect(result.litMaterial).toBeLessThan(70);
  expect(result.litProcedural).toBe(128);
  expect(result.unlitMaterial).toBe(128);
  expect(result.unlitProcedural).toBe(128);
  expect(result.alpha).toBe(true);
});
