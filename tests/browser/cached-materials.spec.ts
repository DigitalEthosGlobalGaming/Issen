import { expect, test } from '@playwright/test';

test('cached material layers preserve mirrored normals, procedural occlusion and light coverage', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createCachedMaterials, cachedMaterialContext, drawCachedImage } =
      await import('/src/rendering/cached-materials.ts');
    const { registerMaterialSink } = await import('/src/rendering/scene-material.ts');
    const colour = document.createElement('canvas');
    colour.width = colour.height = 4;
    const c = colour.getContext('2d')!;
    c.fillStyle = '#804020';
    c.fillRect(0, 0, 4, 4);
    const image = document.createElement('img');
    image.src = colour.toDataURL();
    await image.decode();
    const normal = document.createElement('canvas');
    normal.width = normal.height = 4;
    const n = normal.getContext('2d')!;
    n.fillStyle = 'rgb(200,128,230)';
    n.fillRect(0, 0, 4, 4);
    const surface = document.createElement('canvas');
    surface.width = surface.height = 4;
    const s = surface.getContext('2d')!;
    s.fillStyle = 'rgb(220,0,255)';
    s.fillRect(0, 0, 4, 4);
    const controller = createCachedMaterials();
    controller.bind(image, (frame) => ({
      normal: { source: normal, revision: 0, frame },
      surface: { source: surface, revision: 0, frame },
      normalY: -1,
      lighting: 1,
      depth: 0,
      fog: 0,
      fogColor: [0, 0, 0],
    }));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 8;
    const g = cachedMaterialContext(canvas.getContext('2d')!);
    g.fillStyle = '#202020';
    g.fillRect(0, 0, 8, 8);
    g.save();
    g.translate(4, 0);
    g.scale(-1, 1);
    drawCachedImage(g, image, [0, 0, 4, 4], 0, 0, 4, 4);
    g.restore();
    g.fillStyle = '#404040';
    g.fillRect(0, 0, 4, 2);
    const output = document.createElement('canvas').getContext('2d')!;
    let stamp: any;
    registerMaterialSink(output, {
      draw: (value) => {
        stamp = value;
      },
      lights: () => {},
    });
    drawCachedImage(output, canvas, [0, 0, 8, 8], 0, 0, 8, 8);
    const sample = (kind: string, x: number, y: number) => [
      ...stamp.material[kind].source.getContext('2d').getImageData(x, y, 1, 1).data,
    ];
    const beforeClear = controller.snapshot();
    const completedNormal = stamp.material.normal.source;
    controller.clearCutouts();
    controller.clearCutouts();
    const afterClear = controller.snapshot();
    const result = {
      flipped: sample('normal', 1, 3)[0],
      covered: sample('surface', 1, 0)[3],
      material: sample('surface', 1, 3)[3],
      procedural: sample('surface', 6, 6)[3],
      coverage: stamp.material.surfaceCoverage,
      beforeClear,
      afterClear,
      completedNormalAlive: completedNormal.width === 8 && completedNormal.height === 8,
    };
    drawCachedImage(output, image, [0, 0, 4, 4], 0, 0, 4, 4);
    const bindingsAlive =
      stamp.material.normal.source === normal && stamp.material.surface.source === surface;
    controller.dispose();
    return { ...result, bindingsAlive };
  });
  expect(result.flipped).toBeLessThan(128);
  expect(result.covered).toBe(0);
  expect(result.material).toBe(255);
  expect(result.procedural).toBe(0);
  expect(result.coverage).toBe(true);
  expect(result.beforeClear.entries).toBeGreaterThan(0);
  expect(result.afterClear.entries).toBe(0);
  expect(result.afterClear.pixels).toBe(0);
  expect(result.afterClear.scratchPixels).toBe(0);
  expect(result.completedNormalAlive && result.bindingsAlive).toBe(true);
});
