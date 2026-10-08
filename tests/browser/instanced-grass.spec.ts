import { expect, test } from '@playwright/test';

test('grass uses retained instanced draws, GPU wind, curved normals and density without rereading blades', async ({
  page,
}, testInfo) => {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('PixiJS')))
      errors.push(m.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawInstancedGrass } = await import('/src/rendering/scene-grass.ts');
    const { setSceneLighting } = await import('/src/rendering/scene-material.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 96;
    canvas.id = 'grass-probe';
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas),
      renderer = Reflect.get(painter, 'renderer');
    const gl = renderer.gl as WebGL2RenderingContext;
    const draws: number[] = [];
    const nativeDraw = gl.drawElementsInstanced.bind(gl);
    gl.drawElementsInstanced = (mode, count, type, offset, instances) => {
      draws.push(instances);
      nativeDraw(mode, count, type, offset, instances);
    };
    let reads = 0;
    const blades = Array.from({ length: 1000 }, (_, i) => {
      const values = {
        x: 12 + (i % 12) * 11,
        y: 84 + (i % 3) * 2,
        h: 42,
        w: 3,
        ph: (i % 5) * 0.4,
        col: 'rgba(140,180,100,0.8)',
      };
      return Object.fromEntries(
        Object.entries(values).map(([key, value]) => [
          key,
          {
            get value() {
              reads++;
              return value;
            },
          },
        ]),
      ) as any;
    });
    // Count actual property reads after initial upload, rather than timing frames.
    for (const blade of blades)
      for (const key of Object.keys(blade)) {
        const holder = blade[key];
        Object.defineProperty(blade, key, { get: () => holder.value });
      }
    const snapshot = () => {
      const copy = document.createElement('canvas');
      copy.width = 160;
      copy.height = 96;
      const g = copy.getContext('2d')!;
      g.drawImage(canvas, 0, 0);
      return [...g.getImageData(0, 0, 160, 96).data];
    };
    const frame = (time: number, wind: number, density: number) => {
      painter.begin();
      setSceneLighting(painter, {
        ambient: [0.3, 0.3, 0.3],
        directional: [0.6, 0.6, 0.6],
        direction: [-0.5, -0.2, 1],
        points: [],
      });
      drawInstancedGrass(painter, { blades, time, wind, depth: 12, density });
      painter.flush();
      return snapshot();
    };
    const initial = frame(0, 0, 1),
      afterUpload = reads;
    const still = frame(0, 0, 1),
      moved = frame(1.2, 1, 1),
      thin = frame(1.2, 1, 0.3),
      afterMotion = reads;
    const targets = painter.geometryTargets!;
    const readTarget = (target: any) => {
      renderer.renderTarget.bind({ target, clear: false });
      const data = new Uint8Array(160 * 96 * 4);
      gl.readPixels(0, 0, 160, 96, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return [...data];
    };
    const g0 = readTarget(targets.g0),
      g1 = readTarget(targets.g1);
    const normals = new Set<string>();
    let covered = 0,
      pbr = 0;
    for (let i = 0; i < g0.length; i += 4)
      if (g0[i + 3]! > 0) {
        covered++;
        normals.add(`${g0[i]},${g0[i + 1]}`);
        if (g1[i + 3] === 1) pbr++;
      }
    const difference = (a: number[], b: number[]) =>
      a.reduce((n, v, i) => n + (v !== b[i] ? 1 : 0), 0);
    const alpha = (a: number[]) => a.reduce((n, v, i) => n + (i % 4 === 3 ? v : 0), 0);
    const error = gl.getError();
    frame(1.2, 1, 1);
    Object.assign(window, {
      grassProbe: painter,
      grassSnapshot: snapshot,
      grassExpected: snapshot(),
      grassOldTarget: targets.g0,
    });
    return {
      draws,
      afterUpload,
      afterMotion,
      repeatDifference: difference(initial, still),
      motionDifference: difference(still, moved),
      fullAlpha: alpha(moved),
      thinAlpha: alpha(thin),
      covered,
      pbr,
      normals: normals.size,
      error,
    };
  });
  expect(errors).toEqual([]);
  expect(result.error).toBe(0);
  expect(result.draws.length).toBe(10);
  expect(result.draws.every((count) => count === 1000)).toBe(true);
  expect(result.afterUpload).toBeGreaterThan(1000);
  expect(result.afterMotion).toBe(result.afterUpload);
  expect(result.repeatDifference).toBe(0);
  expect(result.motionDifference).toBeGreaterThan(100);
  expect(result.thinAlpha).toBeLessThan(result.fullAlpha);
  expect(result.covered).toBeGreaterThan(100);
  expect(result.pbr).toBe(result.covered);
  expect(result.normals).toBeGreaterThan(10);
  await page
    .locator('#grass-probe')
    .screenshot({ path: testInfo.outputPath('instanced-grass.png') });
  await page.evaluate(() => {
    const g = (window as any).grassProbe;
    const gl = Reflect.get(g, 'renderer').gl as WebGL2RenderingContext;
    const extension = gl.getExtension('WEBGL_lose_context')!;
    Object.assign(window, { grassContextExtension: extension });
    extension.loseContext();
  });
  await expect
    .poll(() => page.locator('#grass-probe').getAttribute('data-context-state'))
    .toBe('lost');
  await page.evaluate(() => {
    const gl = Reflect.get((window as any).grassProbe, 'renderer').gl as WebGL2RenderingContext;
    (window as any).grassContextExtension.restoreContext();
  });
  await expect
    .poll(() => page.locator('#grass-probe').getAttribute('data-context-state'))
    .toBe('ready');
  const restored = await page.evaluate(() => {
    const w = window as any;
    w.grassProbe.flush();
    const pixels = w.grassSnapshot();
    return {
      same: pixels.every((v: number, i: number) => v === w.grassExpected[i]),
      destroyed: w.grassOldTarget.source.destroyed,
      error: Reflect.get(w.grassProbe, 'renderer').gl.getError(),
    };
  });
  expect(restored).toEqual({ same: true, destroyed: true, error: 0 });
  await page.evaluate(() => (window as any).grassProbe.dispose());
  expect(errors).toEqual([]);
});

test('grass preserves authored curve coverage and exact geometry cutoff in ordered layers', async ({
  page,
}) => {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('PixiJS')))
      errors.push(m.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawInstancedGrass } = await import('/src/rendering/scene-grass.ts');
    const { setSceneLighting } = await import('/src/rendering/scene-material.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 96;
    const painter = await createPixiScenePainter(canvas),
      renderer = Reflect.get(painter, 'renderer');
    const blades = [
      { x: 25, y: 86, h: 55, w: 5, ph: 0.2, col: 'rgba(140,150,100,.8)' },
      { x: 65, y: 84, h: 40, w: 7, ph: 2, col: 'rgba(210,180,160,.5)' },
      { x: 110, y: 84, h: 65, w: 4, ph: 4, col: 'rgba(160,100,80,.49)' },
    ];
    const time = 0.7,
      wind = 0.5;
    painter.begin();
    setSceneLighting(painter, {
      materialLighting: 0,
      ambient: [1, 1, 1],
      directional: [0, 0, 0],
      direction: [0, 0, 1],
      points: [],
    });
    drawInstancedGrass(painter, { blades, time, wind, depth: -12, density: 1 });
    painter.flush();
    const copy = document.createElement('canvas');
    copy.width = 160;
    copy.height = 96;
    const native = copy.getContext('2d')!;
    native.drawImage(canvas, 0, 0);
    const actual = native.getImageData(0, 0, 160, 96).data;
    const reference = document.createElement('canvas');
    reference.width = 160;
    reference.height = 96;
    const g = reference.getContext('2d')!;
    for (const b of blades) {
      const sw =
        wind * 0.5 + Math.sin(time * 2.3 + b.ph) * 0.25 + Math.sin(time * 5.1 + b.ph * 2) * 0.06;
      const tx = b.x + sw * b.h * 0.45,
        ty = b.y - b.h * (1 - 0.12 * Math.abs(sw));
      g.fillStyle = b.col;
      g.beginPath();
      g.moveTo(b.x - b.w, b.y);
      g.quadraticCurveTo(b.x + sw * b.h * 0.1, b.y - b.h * 0.5, tx, ty);
      g.quadraticCurveTo(b.x + sw * b.h * 0.12 + b.w * 0.3, b.y - b.h * 0.5, b.x + b.w, b.y);
      g.fill();
    }
    const expected = g.getImageData(0, 0, 160, 96).data;
    let difference = 0;
    for (let i = 0; i < actual.length; i += 4)
      for (let c = 0; c < 3; c++)
        difference += Math.abs(
          (actual[i + c]! * actual[i + 3]!) / 255 - (expected[i + c]! * expected[i + 3]!) / 255,
        );
    const target = painter.geometryTargets!.g0;
    renderer.renderTarget.bind({ target, clear: false });
    const coverage = new Uint8Array(160 * 96 * 4);
    renderer.gl.readPixels(0, 0, 160, 96, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, coverage);
    let acceptedHalf = 0,
      rejectedThin = 0,
      opaque = 0;
    for (let y = 0; y < 96; y++)
      for (let x = 0; x < 160; x++) {
        const alpha = coverage[(y * 160 + x) * 4 + 3]!;
        if (x < 50 && alpha > 0) opaque++;
        if (x >= 50 && x < 90 && alpha === 128) acceptedHalf++;
        if (x >= 90 && alpha > 0) rejectedThin++;
      }
    // A translucent foreground layer must not replace the accepted layer behind it.
    painter.begin();
    const behind = [{ x: 80, y: 80, h: 50, w: 10, ph: 0, col: '#fff' }],
      front = [{ ...behind[0]!, col: 'rgba(255,0,0,.49)' }];
    drawInstancedGrass(painter, { blades: behind, time: 0, wind: 0, depth: -12, density: 1 });
    drawInstancedGrass(painter, { blades: front, time: 0, wind: 0, depth: 12, density: 1 });
    painter.flush();
    renderer.renderTarget.bind({ target: painter.geometryTargets!.g0, clear: false });
    const last = new Uint8Array(4);
    renderer.gl.readPixels(80, 70, 1, 1, renderer.gl.RGBA, renderer.gl.UNSIGNED_BYTE, last);
    const error = renderer.gl.getError();
    painter.dispose();
    return {
      halfAlphas: [
        ...new Set(
          Array.from(coverage).filter(
            (_, i) => i % 4 === 3 && Math.floor(i / 4) % 160 >= 50 && Math.floor(i / 4) % 160 < 90,
          ),
        ),
      ],
      meanDifference: difference / (160 * 96 * 3),
      opaque,
      acceptedHalf,
      rejectedThin,
      last: [...last],
      error,
    };
  });
  expect(errors).toEqual([]);
  expect(result.error).toBe(0);
  expect(result.meanDifference).toBeLessThan(9);
  expect(result.opaque).toBeGreaterThan(100);
  expect(result.acceptedHalf, JSON.stringify(result)).toBeGreaterThan(50);
  expect(result.rejectedThin).toBe(0);
  expect(result.last[2]).toBe(118);
  expect(result.last[3]).toBe(255);
});
