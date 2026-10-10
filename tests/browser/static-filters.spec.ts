import { expect, test } from '@playwright/test';

test('static filters reuse baked output and refresh for content, lighting and filter changes', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const { invalidateSceneTexture } = await import('/src/rendering/texture-revision.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 96;
    canvas.height = 64;
    const painter = await createPixiScenePainter(canvas);
    const renderer = Reflect.get(painter, 'renderer');
    let passes = 0;
    const apply = renderer.filter.applyFilter.bind(renderer.filter);
    renderer.filter.applyFilter = (...args: unknown[]) => {
      passes++;
      return apply(...args);
    };
    const image = document.createElement('canvas');
    image.width = image.height = 16;
    const context = image.getContext('2d')!;
    context.fillStyle = '#e84';
    context.fillRect(0, 0, 16, 16);
    const copy = document.createElement('canvas');
    copy.width = 96;
    copy.height = 64;
    const read = copy.getContext('2d', { willReadFrequently: true })!;
    const capture = () => {
      read.clearRect(0, 0, 96, 64);
      read.drawImage(canvas, 0, 0);
      return read.getImageData(0, 0, 96, 64).data;
    };
    const point = { x: 40, y: 30, z: 10, intensity: 1, radius: 90, color: [1, 0.6, 0.2] as const };
    let x = 20,
      filter = 'grayscale(0.4) blur(2px)',
      alpha = 0.8,
      lit = false,
      vector = false;
    const rows: {
      name: string;
      passes: number;
      maxDifference: number;
      cached: boolean;
      error: number;
    }[] = [];
    function frame(name: string) {
      const before = passes;
      painter.begin();
      setSceneLighting(painter, {
        ambient: [0.2, 0.2, 0.2],
        directional: [0, 0, 0],
        direction: [0, 0, 1],
        points: [point],
      });
      painter.fillStyle = '#123';
      painter.fillRect(0, 0, 96, 64);
      painter.save();
      painter.filter = filter;
      painter.globalAlpha = alpha;
      if (lit)
        drawMaterialStamp(painter, {
          texture: { source: image, revision: 0 },
          material: { lighting: 1, depth: 1, fog: 0, fogColor: [0, 0, 0] },
          x,
          y: 15,
          width: 35,
          height: 28,
        });
      else if (vector) {
        painter.fillStyle = '#e84';
        painter.translate(x, 15);
        painter.rotate(0.2);
        painter.fillRect(0, 0, 35, 28);
      } else painter.drawImage(image, x, 15, 35, 28);
      painter.restore();
      painter.flush();
      const actual = capture(),
        count = passes - before;
      const slots = Reflect.get(painter, 'slots');
      const cache = slots[1].filterCache;
      const cached = cache.container.isCachedAsTexture;
      cache.release();
      renderer.render({ container: painter.root, clear: true });
      const reference = capture();
      let difference = 0;
      for (let i = 0; i < actual.length; i++)
        difference = Math.max(difference, Math.abs(actual[i]! - reference[i]!));
      rows.push({
        name,
        passes: count,
        maxDifference: difference,
        cached,
        error: renderer.gl.getError(),
      });
      // Restore the existing bake for the next frame; this reference render is excluded from counts.
      if (cached) {
        cache.container.cacheAsTexture({ resolution: 1, antialias: renderer.view.antialias });
        renderer.render({ container: painter.root, clear: true });
      }
    }
    try {
      frame('first');
      frame('bake');
      frame('reuse');
      Reflect.set(painter, 'geometryDirty', true);
      frame('geometry reuse');
      x = 25;
      frame('move');
      frame('move bake');
      frame('move reuse');
      alpha = 0.5;
      frame('alpha');
      context.fillStyle = '#4e8';
      context.fillRect(0, 0, 16, 16);
      invalidateSceneTexture(image);
      frame('pixels');
      frame('pixels bake');
      frame('pixels reuse');
      filter = 'blur(3px)';
      frame('filter');
      frame('filter bake');
      frame('filter reuse');
      lit = true;
      frame('material');
      frame('material bake');
      frame('material reuse');
      point.intensity = 2;
      frame('flicker');
      frame('flicker bake');
      frame('flicker reuse');
      lit = false;
      vector = true;
      frame('vector');
      frame('vector bake');
      frame('vector reuse');
      const cache = Reflect.get(painter, 'slots')[1].filterCache;
      cache.prepare(4096, 4096, filter, 0, 0, 1024, true);
      if (cache.container.isCachedAsTexture) throw new Error('Cache exceeded its allowance');
      return rows;
    } finally {
      painter.dispose();
    }
  });
  for (const row of result) {
    expect(row.error, row.name).toBe(0);
    expect(row.maxDifference, row.name).toBeLessThanOrEqual(2);
    if (row.name.includes('reuse')) {
      expect(row.passes, row.name).toBe(0);
      expect(row.cached, row.name).toBe(true);
    } else expect(row.passes, row.name).toBeGreaterThan(0);
  }
});
