import { expect, test } from '@playwright/test';

test('Low and Medium grass borrow scene lighting in one draw without geometry writes', async ({
  page,
}, testInfo) => {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawInstancedGrass } = await import('/src/rendering/scene-grass.ts');
    const { setSceneLighting, drawMaterialStamp } =
      await import('/src/rendering/scene-material.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 96;
    canvas.id = 'grass-quality-probe';
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas);
    const renderer = Reflect.get(painter, 'renderer');
    const gl = renderer.gl as WebGL2RenderingContext;
    let draws = 0;
    const nativeDraw = gl.drawElementsInstanced.bind(gl);
    gl.drawElementsInstanced = (...args) => {
      draws++;
      nativeDraw(...args);
    };
    const blades = Array.from({ length: 100 }, (_, i) => ({
      x: 8 + i * 1.4,
      y: 88 + (i % 3),
      h: 25 + (i % 17),
      w: 2,
      ph: i * 0.4,
      col: 'rgba(140,180,100,0.8)',
    }));
    const copy = document.createElement('canvas');
    copy.width = 160;
    copy.height = 96;
    const read = copy.getContext('2d', { willReadFrequently: true })!;
    function texture(fill: string) {
      const source = document.createElement('canvas');
      source.width = 160;
      source.height = 96;
      const context = source.getContext('2d')!;
      context.fillStyle = fill;
      context.fillRect(0, 0, 160, 96);
      return { source, revision: 0 };
    }
    const colour = texture('#000000'),
      normal = texture('#8080ff'),
      surface = texture('rgb(220,0,255)');
    function frame(
      quality: string,
      density: number,
      ambient: number,
      time = 0,
      flat = false,
      background = false,
      directional = 0.6,
    ) {
      canvas.dataset.graphicsGrass = quality;
      canvas.dataset.graphicsLighting = flat ? 'off' : 'full';
      draws = 0;
      painter.begin();
      setSceneLighting(painter, {
        ambient: [ambient, ambient, ambient],
        directional: [directional, directional, directional],
        direction: [-0.5, -0.2, 1],
        points: [],
      });
      if (background)
        drawMaterialStamp(painter, {
          texture: colour,
          material: { normal, surface, lighting: 1, depth: 0, fog: 0, fogColor: [0, 0, 0] },
          x: 0,
          y: 0,
          width: 160,
          height: 96,
        });
      drawInstancedGrass(painter, { blades, density, time, wind: 0.5, depth: 12 });
      painter.flush();
      read.clearRect(0, 0, 160, 96);
      read.drawImage(canvas, 0, 0);
      const pixels = [...read.getImageData(0, 0, 160, 96).data];
      renderer.renderTarget.bind({ target: painter.geometryTargets!.g0, clear: false });
      const geometry = new Uint8Array(160 * 96 * 4);
      gl.readPixels(0, 0, 160, 96, gl.RGBA, gl.UNSIGNED_BYTE, geometry);
      let covered = 0,
        alpha = 0,
        red = 0;
      for (let i = 0; i < pixels.length; i += 4) {
        if (geometry[i + 3]) covered++;
        alpha += pixels[i + 3]!;
        red += pixels[i]!;
      }
      return { draws, covered, alpha, red, pixels, geometry: background ? [...geometry] : [] };
    }
    const high = frame('high', 1, 0.3);
    const low = frame('low', 0.3, 0.3);
    const medium = frame('medium', 0.6, 0.3);
    const bright = frame('medium', 0.6, 0.8);
    const flat = frame('medium', 0.6, 0.01, 0, true);
    const flatBright = frame('medium', 0.6, 0.8, 0, true);
    const background = frame('medium', 0, 0.3, 0, false, true, 0);
    const borrowedDark = frame('medium', 0.6, 0.3, 0, false, true, 0);
    const borrowedLit = frame('medium', 0.6, 0.3, 0, false, true);
    const moved = frame('medium', 0.6, 0.3, 1.4);
    const error = gl.getError();
    Object.assign(window, { grassQualityPainter: painter });
    return {
      high,
      low,
      medium,
      bright,
      flat,
      flatBright,
      background,
      borrowedDark,
      borrowedLit,
      moved,
      error,
    };
  });
  expect(result.high.draws).toBe(2);
  expect(result.high.covered).toBeGreaterThan(100);
  for (const row of [result.low, result.medium, result.bright, result.flat, result.moved]) {
    expect(row.draws).toBe(1);
    expect(row.covered).toBe(0);
    expect(row.alpha).toBeGreaterThan(0);
  }
  expect(result.low.alpha).toBeLessThan(result.medium.alpha);
  expect(result.medium.alpha).toBeLessThan(result.high.alpha);
  expect(result.bright.red).toBeGreaterThan(result.medium.red);
  expect(result.bright.alpha).toBe(result.medium.alpha);
  expect(result.flat.pixels).toEqual(result.flatBright.pixels);
  expect(result.flat.red).toBeGreaterThan(result.bright.red);
  expect(result.moved.pixels).not.toEqual(result.medium.pixels);
  expect(result.background.red).toBe(0);
  expect(result.borrowedDark.geometry).toEqual(result.background.geometry);
  expect(result.borrowedLit.geometry).toEqual(result.background.geometry);
  expect(result.borrowedDark.red).toBeGreaterThan(0);
  expect(result.borrowedLit.red).toBeGreaterThan(result.borrowedDark.red);
  expect(result.error).toBe(0);
  expect(errors).toEqual([]);
  await page
    .locator('#grass-quality-probe')
    .screenshot({ path: testInfo.outputPath('medium-grass.png') });
  await page.evaluate(() => (window as any).grassQualityPainter.dispose());
});
