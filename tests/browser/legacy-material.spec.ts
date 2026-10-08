import { expect, test } from '@playwright/test';

test('legacy gloss and strength encode the same PBR surface while emission stays local', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createPixiScenePainter(canvas),
      renderer = Reflect.get(painter, 'renderer');
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 2;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 2, 2);
      return { source, revision: 0 };
    };
    const albedo = texture('#804020'),
      base = { lighting: 1, depth: 0, fog: 0, fogColor: [0, 0, 0] };
    const copy = document.createElement('canvas');
    copy.width = copy.height = 32;
    const read = copy.getContext('2d')!;
    const capture = (material: any, lit = true) => {
      painter.begin();
      setSceneLighting(painter, {
        ambient: lit ? [0.5, 0.5, 0.5] : [0, 0, 0],
        directional: lit ? [1, 1, 1] : [0, 0, 0],
        direction: [0, 0, 1],
        points: [],
      });
      drawMaterialStamp(painter, { texture: albedo, material, x: 0, y: 0, width: 32, height: 32 });
      painter.flush();
      read.clearRect(0, 0, 32, 32);
      read.drawImage(canvas, 0, 0);
      const colour = Array.from(read.getImageData(16, 16, 1, 1).data);
      const gl = renderer.gl;
      renderer.renderTarget.bind({ target: painter.geometryTargets!.g1, clear: false });
      const surface = new Uint8Array(4);
      gl.readPixels(16, 16, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, surface);
      const lights = [painter.lightTargets!.diffuse, painter.lightTargets!.specular].map(
        (target) => {
          renderer.renderTarget.bind({ target, clear: false });
          const pixel = new Float32Array(4);
          gl.readPixels(16, 16, 1, 1, gl.RGBA, gl.FLOAT, pixel);
          return Array.from(pixel);
        },
      );
      return { colour, surface: Array.from(surface), lights };
    };
    const legacy = capture({ ...base, mask: texture('rgb(128,64,0)') });
    const pbr = capture({ ...base, surface: texture('rgb(127,128,255)') });
    const dark = capture({ ...base, mask: texture('rgb(128,64,0)') }, false);
    const emission = capture({ ...base, mask: texture('rgb(128,64,153)') }, false);
    const error = renderer.gl.getError();
    painter.dispose();
    return { legacy, pbr, dark, emission, error };
  });
  expect(result.error).toBe(0);
  expect(result.legacy.surface).toEqual([127, 128, 255, 1]);
  expect(result.legacy.lights).toEqual(result.pbr.lights);
  expect(result.legacy.colour).toEqual(result.pbr.colour);
  expect(result.dark.colour).toEqual([0, 0, 0, 255]);
  expect(result.emission.lights).toEqual(result.dark.lights);
  for (let channel = 0; channel < 3; channel++)
    expect(result.emission.colour[channel]).toBeGreaterThan(10);
  expect(result.emission.colour[3]).toBe(255);
});
