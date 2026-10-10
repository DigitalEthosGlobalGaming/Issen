import { expect, test } from '@playwright/test';

test('unchanged lit submissions reuse passes and mutations match forced redraws', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { setSceneLighting, drawMaterialStamp } =
      await import('/src/rendering/scene-material.ts');
    const { drawInstancedGrass } = await import('/src/rendering/scene-grass.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 64;
    const painter = await createPixiScenePainter(canvas);
    const geometry = Reflect.get(painter, 'geometryBuffer');
    const light = Reflect.get(painter, 'lightBuffer');
    let geometryCount = 0,
      lightCount = 0;
    const originalGeometry = geometry.render.bind(geometry),
      originalLight = light.render.bind(light);
    geometry.render = (...args: unknown[]) => {
      geometryCount++;
      return originalGeometry(...args);
    };
    light.render = (...args: unknown[]) => {
      lightCount++;
      return originalLight(...args);
    };
    const source = document.createElement('canvas');
    source.width = source.height = 4;
    const context = source.getContext('2d')!;
    context.fillStyle = '#c84';
    context.fillRect(0, 0, 4, 4);
    const texture = { source, revision: 0 };
    const material = { lighting: 1, depth: 1, fog: 0, fogColor: [0, 0, 0] as const };
    const point = { x: 30, y: 20, z: 12, radius: 70, intensity: 1, color: [1, 0.5, 0.2] as const };
    const lights = {
      ambient: [0.2, 0.2, 0.2] as const,
      directional: [0.3, 0.3, 0.3] as const,
      direction: [0, 0, 1] as const,
      points: [point],
    };
    const blades = [{ x: 30, y: 58, h: 20, w: 3, ph: 1, col: '#485' }];
    const copy = document.createElement('canvas');
    copy.width = 96;
    copy.height = 64;
    const read = copy.getContext('2d', { willReadFrequently: true })!;
    const pixels = () => {
      read.clearRect(0, 0, 96, 64);
      read.drawImage(canvas, 0, 0);
      return read.getImageData(0, 0, 96, 64).data;
    };
    let x = 0,
      clip = 80,
      alpha = 1,
      lit = true,
      time = 0,
      grass = false;
    const rows: {
      name: string;
      geometry: number;
      light: number;
      identical: boolean;
      error: number;
    }[] = [];
    function frame(name: string) {
      const g0 = geometryCount,
        l0 = lightCount;
      painter.begin();
      setSceneLighting(painter, lights);
      painter.fillStyle = '#123';
      painter.fillRect(time, 0, 96, 64);
      painter.save();
      painter.translate(x, 0);
      painter.globalAlpha = alpha;
      painter.beginPath();
      painter.rect(0, 0, clip, 64);
      painter.clip();
      if (lit)
        for (let i = 0; i < 2; i++)
          drawMaterialStamp(painter, {
            texture,
            material,
            x: 8 + i * 30,
            y: 8,
            width: 28,
            height: 38,
          });
      if (grass) drawInstancedGrass(painter, { blades, time, wind: 0.5, depth: 2, density: 1 });
      painter.restore();
      painter.flush();
      const actual = pixels(),
        g = geometryCount - g0,
        l = lightCount - l0;
      Reflect.get(painter, 'invalidateLighting').call(painter);
      painter.flush();
      const reference = pixels();
      rows.push({
        name,
        geometry: g,
        light: l,
        identical: actual.every((v, i) => v === reference[i]),
        error: Reflect.get(painter, 'renderer').gl.getError(),
      });
    }
    try {
      frame('initial');
      frame('unchanged');
      time = 2;
      frame('cosmetics');
      point.intensity = 2;
      frame('flicker');
      x = 3;
      frame('camera');
      clip = 45;
      frame('clip');
      frame('same clip');
      alpha = 0.7;
      frame('alpha');
      material.depth = 4;
      frame('depth');
      material.fog = 0.2;
      frame('fog');
      canvas.dataset.graphicsLighting = 'half';
      frame('half');
      canvas.dataset.graphicsLighting = 'off';
      frame('flat');
      canvas.dataset.graphicsLighting = 'full';
      frame('full');
      context.fillStyle = '#8c4';
      context.fillRect(0, 0, 4, 4);
      texture.revision++;
      frame('pixels');
      grass = true;
      canvas.dataset.graphicsGrass = 'medium';
      frame('cheap grass');
      time++;
      frame('cheap grass motion');
      canvas.dataset.graphicsGrass = 'high';
      frame('high grass');
      time++;
      frame('high grass motion');
      grass = false;
      lit = false;
      frame('removed');
      frame('empty');
      canvas.width = 100;
      frame('resize');
      return { rows, error: Reflect.get(painter, 'renderer').gl.getError() };
    } finally {
      painter.dispose();
    }
  });
  const reused = new Set([
    'unchanged',
    'cosmetics',
    'same clip',
    'cheap grass',
    'cheap grass motion',
    'fog',
    'empty',
  ]);
  for (const row of result.rows) {
    expect(row.identical, row.name).toBe(true);
    expect(row.error, row.name).toBe(0);
    expect(row.geometry, row.name).toBe(
      reused.has(row.name) || row.name === 'flicker' || row.name === 'half' ? 0 : 1,
    );
    expect(row.light, row.name).toBe(reused.has(row.name) ? 0 : 1);
  }
  expect(result.error).toBe(0);
});
