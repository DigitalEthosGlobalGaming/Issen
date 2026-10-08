import { expect, test } from '@playwright/test';

test('prepared art and native geometry read common light targets across independent owners and resize', async ({
  page,
}) => {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (
      message.type() === 'error' ||
      (message.type() === 'warning' && message.text().includes('PixiJS'))
    )
      errors.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const { drawCachedBrushRing, drawCachedGlyphArrow } =
      await import('/src/rendering/scene-brush-ring.ts');
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 8;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 8, 8);
      return { source, revision: 0 };
    };
    const black = texture('#000'),
      white = texture('#fff');
    const material = {
      normal: texture('rgb(128,128,255)'),
      surface: texture('rgb(255,0,255)'),
      lighting: 1,
      depth: 0,
      fog: 0,
      fogColor: [0, 0, 0],
    };
    const make = async () => {
      const canvas = document.createElement('canvas');
      canvas.width = 480;
      canvas.height = 48;
      const painter = await createPixiScenePainter(canvas);
      return { canvas, painter };
    };
    const first = await make(),
      second = await make();
    const capture = (owner: typeof first, ambient: number, amount: number) => {
      const { painter: g, canvas } = owner;
      // Exercise the shared material parameter directly, without introducing a runtime debug path.
      const lookup = Reflect.get(g, 'artworkMaterials');
      lookup.uniforms.uniforms.uArtworkLighting = amount;
      lookup.uniforms.update();
      g.begin();
      setSceneLighting(g, {
        ambient: [ambient, ambient, ambient],
        directional: [0, 0, 0],
        direction: [0, 0, 1],
        points: [],
      });
      drawMaterialStamp(g, {
        texture: black,
        material,
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
      g.fillStyle = '#fff';
      g.fillRect(8, 8, 30, 30);
      g.drawImage(white.source, 68, 8, 30, 30);
      const gradient = g.createLinearGradient(128, 8, 158, 38);
      gradient.addColorStop(0, '#fff');
      gradient.addColorStop(1, '#fff');
      g.fillStyle = gradient;
      g.fillRect(128, 8, 30, 30);
      g.strokeStyle = '#fff';
      g.lineWidth = 12;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(188, 24);
      g.lineTo(218, 24);
      g.stroke();
      g.fillStyle = '#fff';
      g.beginPath();
      g.ellipse(263, 24, 15, 15, 0, 0, Math.PI * 2);
      g.fill();
      g.font = 'bold 28px sans-serif';
      g.fillText('M', 308, 34);
      g.save();
      g.translate(383, 24);
      if (!drawCachedBrushRing(g, 15, '#fff')) throw new Error('Missing ring sink');
      g.restore();
      g.save();
      g.translate(436, 24);
      g.lineWidth = 24 * 0.23;
      if (!drawCachedGlyphArrow(g, 24)) throw new Error('Missing glyph sink');
      g.restore();
      g.flush();
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      const read = copy.getContext('2d')!;
      read.drawImage(canvas, 0, 0);
      const pixels = [...read.getImageData(0, 0, canvas.width, canvas.height).data];
      const gl = Reflect.get(g, 'renderer').gl as WebGL2RenderingContext;
      return { pixels, width: canvas.width, error: gl.getError() };
    };
    const neutral = capture(first, 0.25, 0),
      dark = capture(first, 0.25, 1),
      bright = capture(second, 0.5, 1);
    const regions = Array.from({ length: 8 }, (_, kind) => {
      let count = 0,
        low = 255,
        high = 0,
        brightLow = 255,
        brightHigh = 0;
      for (let y = 0; y < 48; y++)
        for (let x = kind * 60; x < (kind + 1) * 60; x++) {
          const i = (y * 480 + x) * 4;
          if (neutral.pixels[i]! < 254) continue;
          count++;
          low = Math.min(low, dark.pixels[i]!);
          high = Math.max(high, dark.pixels[i]!);
          brightLow = Math.min(brightLow, bright.pixels[i]!);
          brightHigh = Math.max(brightHigh, bright.pixels[i]!);
        }
      return { kind, count, low, high, brightLow, brightHigh };
    });
    const targets = Reflect.get(first.painter, 'geometryBuffer').targets;
    first.canvas.width = 512;
    const resized = capture(first, 0.25, 1);
    const oldDestroyed = targets.g0.source.destroyed;
    first.painter.dispose();
    const independent = capture(second, 0.5, 1);
    second.painter.dispose();
    return {
      regions,
      errors: [neutral.error, dark.error, bright.error, resized.error, independent.error],
      oldDestroyed,
      resizedSample: resized.pixels[(20 * 512 + 20) * 4],
      independentSample: independent.pixels[(20 * 480 + 20) * 4],
    };
  });
  expect(errors).toEqual([]);
  expect(result.errors).toEqual([0, 0, 0, 0, 0]);
  expect(result.oldDestroyed).toBe(true);
  for (const region of result.regions) {
    expect(region.count, JSON.stringify(region)).toBeGreaterThan(5);
    expect(region.low, JSON.stringify(region)).toBeGreaterThanOrEqual(135);
    expect(region.high, JSON.stringify(region)).toBeLessThanOrEqual(139);
    expect(region.brightLow, JSON.stringify(region)).toBeGreaterThanOrEqual(186);
    expect(region.brightHigh, JSON.stringify(region)).toBeLessThanOrEqual(190);
  }
  expect(result.resizedSample).toBeGreaterThanOrEqual(135);
  expect(result.resizedSample).toBeLessThanOrEqual(139);
  expect(result.independentSample).toBeGreaterThanOrEqual(186);
  expect(result.independentSample).toBeLessThanOrEqual(190);
});
