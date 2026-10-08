import { expect, test } from '@playwright/test';

test('geometry buffer records coverage, last writer, maps and clip hierarchy without changing composite', async ({
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
    canvas.id = 'g-buffer-probe';
    canvas.width = 64;
    canvas.height = 32;
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas);
    const renderer = Reflect.get(painter, 'renderer');
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 4;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 4, 4);
      return { source, revision: 0 };
    };
    const red = texture('#804020'),
      green = texture('#00ff00'),
      blue = texture('#0000ff');
    const material = {
      normal: texture('rgb(128,128,255)'),
      surface: texture('rgb(64,128,192)'),
      lighting: 1,
      depth: 16,
      fog: 0,
      fogColor: [0, 0, 0],
    };
    const stamp = (
      source: any,
      x: number,
      y: number,
      width: number,
      height: number,
      mat: any = material,
    ) => drawMaterialStamp(painter, { texture: source, material: mat, x, y, width, height });
    painter.begin();
    setSceneLighting(painter, {
      ambient: [1, 1, 1],
      directional: [0, 0, 0],
      direction: [0, 0, 1],
      points: [],
    });
    stamp(red, 0, 0, 32, 32);
    stamp(green, 8, 8, 16, 16);
    painter.globalAlpha = 0.49;
    stamp(blue, 8, 8, 16, 16);
    painter.globalAlpha = 0.4;
    stamp(blue, 24, 0, 8, 8, { ...material, alphaCutoff: 0.3 });
    painter.globalAlpha = 1;
    painter.save();
    painter.beginPath();
    painter.rect(40, 0, 8, 32);
    painter.clip();
    stamp(green, 32, 0, 32, 32);
    painter.restore();
    painter.flush();
    const copy = document.createElement('canvas');
    copy.width = 64;
    copy.height = 32;
    const cg = copy.getContext('2d')!;
    cg.drawImage(canvas, 0, 0);
    const composite = Array.from(cg.getImageData(16, 16, 1, 1).data);
    const targets = painter.geometryTargets!;
    const read = (target: any, x: number, y: number) => {
      renderer.renderTarget.bind({ target, clear: false });
      const pixel = new Uint8Array(4);
      renderer.gl.readPixels(x, y, 1, 1, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, pixel);
      return Array.from(pixel);
    };
    const background = [read(targets.g0, 4, 16), read(targets.g1, 4, 16), read(targets.g2, 4, 16)];
    const lastWriter = read(targets.g2, 16, 16);
    const customCoverage = read(targets.g0, 28, 4);
    const clipped = [read(targets.g0, 44, 16), read(targets.g0, 36, 16), read(targets.g0, 52, 16)];
    const error = renderer.gl.getError();
    // Present a real debug target for the attached screenshot; the geometry owner
    // handles offscreen orientation and never exposes a raw context to UI.
    canvas.dataset.lightingView = 'g2';
    painter.flush();
    Object.assign(window, { geometryProbe: painter });
    return {
      background,
      composite,
      lastWriter,
      customCoverage,
      clipped,
      error,
      depthRange: targets.depthRange,
    };
  });
  expect(errors).toEqual([]);
  expect(result.error).toBe(0);
  expect(result.background[0]).toEqual([128, 128, 159, 255]);
  expect(result.background[1]).toEqual([64, 128, 192, 1]);
  expect(result.background[2]).toEqual([55, 13, 4, 255]);
  expect(result.lastWriter).toEqual([0, 255, 0, 255]);
  // The below-cutoff blue sprite still participates in the ordered translucent composite.
  expect(result.composite[1]).toBeGreaterThan(80);
  expect(result.composite[2]).toBeGreaterThan(80);
  expect(result.composite[3]).toBe(255);
  expect(result.customCoverage[3]).toBe(102);
  expect(result.clipped[0]![3]).toBe(255);
  expect(result.clipped.slice(1)).toEqual([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  await page
    .locator('#g-buffer-probe')
    .screenshot({ path: testInfo.outputPath('g2-linear-albedo.png') });
  await page.evaluate(() => (window as any).geometryProbe.dispose());
});

test('geometry buffers retain transformed normals, raw coverage and independent resize/dispose lifetimes', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp } = await import('/src/rendering/scene-material.ts');
    const canvases = [64, 16].map((size) => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      return c;
    });
    const [a, b] = await Promise.all(canvases.map(createPixiScenePainter));
    const source = document.createElement('canvas');
    source.width = source.height = 4;
    const g = source.getContext('2d')!;
    g.fillStyle = '#fff';
    g.fillRect(0, 0, 4, 4);
    const normal = document.createElement('canvas');
    normal.width = normal.height = 4;
    const ng = normal.getContext('2d')!;
    ng.fillStyle = 'rgb(218,128,218)';
    ng.fillRect(0, 0, 4, 4);
    const stamp = {
      texture: { source, revision: 0 },
      material: {
        normal: { source: normal, revision: 0 },
        lighting: 1,
        depth: 0,
        fog: 0,
        fogColor: [0, 0, 0],
      },
      x: 0,
      y: 0,
      width: 16,
      height: 16,
    };
    a!.begin();
    a!.setTransform(1, 0, 0, 1, 0, 0);
    drawMaterialStamp(a!, stamp);
    a!.setTransform(-1, 0, 0, 1, 48, 0);
    drawMaterialStamp(a!, stamp);
    const tilted = document.createElement('canvas');
    tilted.width = tilted.height = 4;
    const tg = tilted.getContext('2d')!;
    tg.fillStyle = 'rgb(218,164,218)';
    tg.fillRect(0, 0, 4, 4);
    a!.setTransform(0, 2, -0.5, 0, 56, 16);
    drawMaterialStamp(a!, {
      ...stamp,
      material: { ...stamp.material, normal: { source: tilted, revision: 0 }, normalY: -1 },
    });
    a!.flush();
    const renderer = Reflect.get(a!, 'renderer');
    renderer.renderTarget.bind({ target: a!.geometryTargets!.g0, clear: false });
    const pixel = (x: number) => {
      const out = new Uint8Array(4);
      renderer.gl.readPixels(x, 8, 1, 1, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, out);
      return Array.from(out);
    };
    const normals = [pixel(8), pixel(40)];
    const rotatedPixel = new Uint8Array(4);
    renderer.gl.readPixels(52, 32, 1, 1, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, rotatedPixel);
    const rotated = Array.from(rotatedPixel);
    const first = a!.geometryTargets!;
    const firstSource = first.g0.source;
    const independent = first.g0.source !== b!.geometryTargets!.g0.source;
    canvases[0]!.width = 80;
    canvases[0]!.height = 40;
    a!.begin();
    drawMaterialStamp(a!, stamp);
    a!.flush();
    const next = a!.geometryTargets!;
    const resized = {
      width: next.width,
      height: next.height,
      generation: next.generation,
      oldDestroyed: first.g0.destroyed,
      oldSourceDestroyed: firstSource.destroyed,
    };
    const other = { width: b!.geometryTargets!.width, height: b!.geometryTargets!.height };
    const error = renderer.gl.getError();
    a!.dispose();
    a!.dispose();
    b!.dispose();
    return {
      normals,
      rotated,
      independent,
      resized,
      other,
      error,
      disposed: next.g0.destroyed && a!.geometryTargets === undefined,
    };
  });
  expect(errors).toEqual([]);
  expect(result.error).toBe(0);
  expect(result.normals[0]![0]).toBeGreaterThan(175);
  expect(result.normals[1]![0]).toBeLessThan(80);
  expect(result.normals.map((normal) => normal[1])).toEqual([128, 128]);
  expect(result.rotated).toEqual([172, 155, 128, 255]);
  expect(result.independent).toBe(true);
  expect(result.resized).toEqual({
    width: 80,
    height: 40,
    generation: 2,
    oldDestroyed: true,
    oldSourceDestroyed: true,
  });
  expect(result.other).toEqual({ width: 16, height: 16 });
  expect(result.disposed).toBe(true);
});

test('context restore recreates geometry attachments on the original canvas', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp } = await import('/src/rendering/scene-material.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas);
    const source = document.createElement('canvas');
    source.width = source.height = 4;
    const ink = source.getContext('2d')!;
    ink.fillStyle = '#fff';
    ink.fillRect(0, 0, 4, 4);
    const stamp = {
      texture: { source, revision: 0 },
      material: { lighting: 1, depth: 0, fog: 0, fogColor: [0, 0, 0] },
      x: 0,
      y: 0,
      width: 32,
      height: 32,
    };
    painter.begin();
    drawMaterialStamp(painter, stamp);
    painter.flush();
    const first = painter.geometryTargets!;
    const gl = canvas.getContext('webgl2')!;
    Object.assign(window, {
      restoreProbe: {
        canvas,
        painter,
        first,
        gl,
        stamp,
        drawMaterialStamp,
        extension: gl.getExtension('WEBGL_lose_context')!,
      },
    });
  });
  await page.evaluate(() => (window as any).restoreProbe.extension.loseContext());
  await expect
    .poll(() => page.evaluate(() => (window as any).restoreProbe.painter.contextLost))
    .toBe(true);
  // Restore in a later browser task, after context-loss dispatch has completed.
  await page.evaluate(() => (window as any).restoreProbe.extension.restoreContext());
  await expect
    .poll(() => page.evaluate(() => (window as any).restoreProbe.painter.contextLost))
    .toBe(false);
  const result = await page.evaluate(() => {
    const { canvas, painter, first, gl, stamp, drawMaterialStamp } = (window as any).restoreProbe;
    painter.begin();
    drawMaterialStamp(painter, stamp);
    painter.flush();
    const next = painter.geometryTargets;
    const renderer = Reflect.get(painter, 'renderer');
    renderer.renderTarget.bind({ target: next.g2, clear: false });
    const pixel = new Uint8Array(4);
    gl.readPixels(16, 16, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
    const result = {
      ready: !painter.contextLost,
      generation: next.generation,
      changed: first.g0 !== next.g0,
      oldDestroyed: first.g0.destroyed,
      error: gl.getError(),
      same: painter.canvas === canvas,
      pixel: Array.from(pixel),
    };
    painter.dispose();
    return result;
  });
  expect(errors).toEqual([]);
  expect(result).toEqual({
    ready: true,
    generation: 2,
    changed: true,
    oldDestroyed: true,
    error: 0,
    same: true,
    pixel: [255, 255, 255, 255],
  });
});

test('missing MRT shows the existing graphics Retry error without an alternate renderer', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const get = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = function (parameter: number) {
      return parameter === this.MAX_DRAW_BUFFERS ? 2 : get.call(this, parameter);
    };
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Graphics not supported' })).toBeVisible({
    timeout: 30000,
  });
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible();
  await expect(page.locator('.startup-loading')).toHaveCount(1);
  await expect(page.locator('[data-graphics-backend="canvas"]')).toHaveCount(0);
});

test('lighting debug selects geometry and HDR light targets without storing settings', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#title')).toHaveClass(/on/);
  await expect(page.locator('.startup-loading')).toHaveCount(0);
  await expect(page.locator('#c')).toHaveAttribute('data-context-state', 'ready');
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await page.keyboard.press('Backquote');
  for (const value of ['g0', 'g1', 'g2', 'diffuse', 'specular']) {
    await page.getByRole('combobox', { name: 'Buffer view', exact: true }).selectOption(value);
    await expect(page.locator('#c')).toHaveAttribute('data-lighting-view', value);
    await expect(page.locator('#c')).toHaveAttribute('data-lighting-frame-view', value);
    await page.locator('#c').screenshot({ path: testInfo.outputPath(`${value}-title.png`) });
  }
  await page.getByRole('combobox', { name: 'Buffer view', exact: true }).selectOption('none');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
  await page.keyboard.press('Escape');
  await expect(page.locator('#lighting-debug')).toBeHidden();
});
