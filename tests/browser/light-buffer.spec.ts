import { expect, test } from '@playwright/test';

test('native HDR light MRT retains diffuse AO, metal tint and all 16 point lights', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const canvas = document.createElement('canvas');
    canvas.id = 'light-probe';
    canvas.width = canvas.height = 32;
    document.body.append(canvas);
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
    const white = texture('#fff'),
      red = texture('#ff0000');
    const material = {
      lighting: 1,
      depth: 0,
      fog: 0,
      fogColor: [0, 0, 0],
      normal: texture('rgb(128,128,255)'),
      surface: texture('rgb(128,0,128)'),
    };
    const ambient = {
      ambient: [2, 2, 2],
      directional: [0, 0, 0],
      direction: [0, 0, 1],
      points: [],
    };
    const draw = (lighting: any) => {
      painter.begin();
      setSceneLighting(painter, lighting);
      drawMaterialStamp(painter, { texture: white, material, x: 0, y: 0, width: 16, height: 32 });
      drawMaterialStamp(painter, {
        texture: red,
        material: { ...material, surface: texture('rgb(128,255,128)') },
        x: 16,
        y: 0,
        width: 16,
        height: 32,
      });
      painter.flush();
    };
    const read = (target: any, x: number, y: number) => {
      renderer.renderTarget.bind({ target, clear: false });
      const gl = renderer.gl,
        pixel = new Float32Array(4);
      gl.readPixels(x, y, 1, 1, gl.RGBA, gl.FLOAT, pixel);
      return Array.from(pixel);
    };
    draw(ambient);
    const original = painter.lightTargets!;
    const dielectric = [read(original.diffuse, 8, 16), read(original.specular, 8, 16)];
    const metal = [read(original.diffuse, 24, 16), read(original.specular, 24, 16)];
    const point = { x: 8.5, y: 16.5, z: 1000, radius: 1000000, intensity: 1, color: [1, 1, 1] };
    const points = (count: number) => ({
      ...ambient,
      ambient: [0, 0, 0],
      points: Array.from({ length: count }, () => point),
    });
    draw(points(1));
    const one = [
      read(painter.lightTargets!.diffuse, 8, 16),
      read(painter.lightTargets!.specular, 8, 16),
    ];
    draw(points(16));
    const sixteen = [
      read(painter.lightTargets!.diffuse, 8, 16),
      read(painter.lightTargets!.specular, 8, 16),
    ];
    draw({ ...points(16), materialLighting: 0 });
    const disabled = [
      read(painter.lightTargets!.diffuse, 8, 16),
      read(painter.lightTargets!.specular, 8, 16),
    ];
    const oldSources = [original.diffuse.source, original.specular.source];
    canvas.width = 48;
    draw(points(16));
    const resized = painter.lightTargets!;
    const ownership = {
      generation: resized.generation,
      oldDestroyed: oldSources.map((source) => source.destroyed),
      format: resized.specular.source.format,
    };
    const error = renderer.gl.getError();
    canvas.dataset.lightingView = 'specular';
    painter.flush();
    Object.assign(window, { lightProbe: painter });
    return { dielectric, metal, one, sixteen, disabled, ownership, error };
  });
  expect(errors).toEqual([]);
  expect(result.error).toBe(0);
  for (const value of result.dielectric[0].slice(0, 3)) expect(value).toBeCloseTo(256 / 255, 2);
  expect(result.dielectric[1].slice(0, 3)).toEqual([0, 0, 0]);
  expect(result.metal[0].slice(0, 3)).toEqual([0, 0, 0]);
  expect(result.metal[1][0]).toBeCloseTo(256 / 255, 2);
  expect(result.metal[1].slice(1, 3)).toEqual([0, 0]);
  for (let target = 0; target < 2; target++)
    for (let channel = 0; channel < 3; channel++)
      expect(result.sixteen[target]![channel]! / result.one[target]![channel]!).toBeCloseTo(16, 1);
  expect(result.one[0]![0]).toBeCloseTo(0.96, 3);
  // At normal incidence GGX reduces to F0 / (4 * roughness^4), with Lambert gain 1.
  expect(result.one[1]![0]).toBeCloseTo(0.04 / (4 * (128 / 255) ** 4), 3);
  expect(result.sixteen[1]![0]).toBeGreaterThan(1);
  expect(result.disabled[0].slice(0, 3)).toEqual([1, 1, 1]);
  expect(result.disabled[1].slice(0, 3)).toEqual([0, 0, 0]);
  expect(result.ownership).toEqual({
    generation: 2,
    oldDestroyed: [true, true],
    format: 'rgba16float',
  });
  await page.locator('#light-probe').screenshot({ path: testInfo.outputPath('specular-hdr.png') });
  await page.evaluate(() => {
    const painter = Reflect.get(window, 'lightProbe');
    const sources = [painter.lightTargets.diffuse.source, painter.lightTargets.specular.source];
    painter.dispose();
    painter.dispose();
    if (!sources.every((source) => source.destroyed))
      throw new Error('Light targets survived disposal');
  });
});

test('HDR attachment capability is required by native startup', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const getExtension = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function (name: string) {
      return name === 'EXT_color_buffer_float' || name === 'EXT_color_buffer_half_float'
        ? null
        : getExtension.call(this, name);
    };
    try {
      const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
      try {
        await createPixiScenePainter(document.createElement('canvas'));
        return { name: 'accepted', cause: '' };
      } catch (error) {
        return { name: (error as Error).name, cause: String((error as Error).cause) };
      }
    } finally {
      WebGL2RenderingContext.prototype.getExtension = getExtension;
    }
  });
  expect(result).toEqual({
    name: 'GraphicsUnsupportedError',
    cause: 'WebGL2 HDR colour attachments are required.',
  });
});

test('HDR targets are independent per surface and rebuild after actual context restoration', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const make = async () => {
      const c = document.createElement('canvas');
      c.width = c.height = 16;
      document.body.append(c);
      return createPixiScenePainter(c);
    };
    const a = await make(),
      b = await make();
    const source = document.createElement('canvas');
    source.width = source.height = 2;
    const g = source.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 2, 2);
    const stamp = {
      texture: { source, revision: 0 },
      material: { lighting: 1, depth: 0, fog: 0, fogColor: [0, 0, 0] },
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    };
    const draw = (painter: any) => {
      painter.begin();
      setSceneLighting(painter, {
        ambient: [2, 2, 2],
        directional: [0, 0, 0],
        direction: [0, 0, 1],
        points: [],
      });
      drawMaterialStamp(painter, stamp);
      painter.flush();
    };
    draw(a);
    draw(b);
    Object.assign(window, {
      lightRestore: {
        a,
        b,
        draw,
        first: a.lightTargets,
        other: b.lightTargets,
        extension: a.canvas.getContext('webgl2')!.getExtension('WEBGL_lose_context'),
      },
    });
  });
  await page.evaluate(() => Reflect.get(window, 'lightRestore').extension.loseContext());
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, 'lightRestore').a.contextLost))
    .toBe(true);
  await page.evaluate(() => Reflect.get(window, 'lightRestore').extension.restoreContext());
  await expect
    .poll(() => page.evaluate(() => Reflect.get(window, 'lightRestore').a.contextLost))
    .toBe(false);
  const result = await page.evaluate(() => {
    const { a, b, draw, first, other } = Reflect.get(window, 'lightRestore');
    draw(a);
    draw(b);
    const next = a.lightTargets,
      renderer = Reflect.get(a, 'renderer'),
      gl = renderer.gl;
    renderer.renderTarget.bind({ target: next.diffuse, clear: false });
    const pixel = new Float32Array(4);
    gl.readPixels(8, 8, 1, 1, gl.RGBA, gl.FLOAT, pixel);
    const result = {
      independent: next.diffuse.source !== b.lightTargets.diffuse.source,
      otherSame: other === b.lightTargets,
      generation: next.generation,
      oldDestroyed: first.diffuse.destroyed && first.specular.destroyed,
      pixel: Array.from(pixel),
      error: gl.getError(),
    };
    a.dispose();
    b.dispose();
    return result;
  });
  expect(errors).toEqual([]);
  expect(result).toEqual({
    independent: true,
    otherSame: true,
    generation: 2,
    oldDestroyed: true,
    pixel: [2, 2, 2, 1],
    error: 0,
  });
});

test('missing HDR capability shows one graphics Retry screen', async ({ page }) => {
  await page.addInitScript(() => {
    const get = WebGL2RenderingContext.prototype.getExtension;
    WebGL2RenderingContext.prototype.getExtension = function (name: string) {
      return name === 'EXT_color_buffer_float' || name === 'EXT_color_buffer_half_float'
        ? null
        : get.call(this, name);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Graphics not supported' })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(page.locator('.startup-loading')).toHaveCount(1);
});
