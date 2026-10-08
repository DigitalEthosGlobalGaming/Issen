import { expect, test } from '@playwright/test';

test('all persistent scene source families illuminate native materials with isolated removal', async ({
  page,
}, testInfo) => {
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
    const { createLightSources } = await import('/src/presentation/light-sources.ts');
    const { bindSceneLightSources } = await import('/src/presentation/scene-light-sources.ts');
    const { makeFig } = await import('/src/shared/figure-model.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    canvas.id = 'persistent-light-probe';
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas);
    const renderer = Reflect.get(painter, 'renderer');
    const sources = createLightSources();
    const views: any = {
      G: { enemies: [], boss: null, m: { foxfire: false }, foxUsed: false, state: 'boss' },
      fx: { px: [], embers: [] },
      player: { x: 48.4, y: 104.8, h: 40 },
      scale: 1,
      sceneLoading: false,
      cinematic: false,
      reducedMotion: false,
      reducedFlashes: false,
    };
    const dispose = bindSceneLightSources(sources, () => views);
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 2;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 2, 2);
      return { source, revision: 0 };
    };
    const grey = texture('#888');
    const material = {
      normal: texture('rgb(128,128,255)'),
      surface: texture('rgb(255,0,255)'),
      lighting: 1,
      depth: 0,
      fog: 0,
      fogColor: [0, 0, 0] as const,
    };
    const base = {
      ambient: [0, 0, 0] as const,
      directional: [0, 0, 0] as const,
      direction: [0, 0, 1] as const,
      points: [],
    };
    const capture = () => {
      const lighting = sources.lighting({ width: 128, height: 128, time: 0 }, base);
      painter.begin();
      setSceneLighting(painter, lighting);
      drawMaterialStamp(painter, { texture: grey, material, x: 0, y: 0, width: 128, height: 128 });
      painter.flush();
      const copy = document.createElement('canvas');
      copy.width = copy.height = 128;
      const g = copy.getContext('2d')!;
      g.drawImage(canvas, 0, 0);
      const pixel = Array.from(g.getImageData(64, 64, 1, 1).data);
      return { count: lighting.points.length, pixel };
    };
    const dark = capture();
    const rows: any[] = [];
    const sample = (name: string, install: () => void, clear: () => void) => {
      install();
      const before = JSON.stringify(views),
        lit = capture(),
        repeat = capture();
      const unchanged = before === JSON.stringify(views);
      clear();
      rows.push({ name, lit, repeat, unchanged, removed: capture() });
    };
    sample(
      'sword-glints',
      () =>
        views.G.enemies.push({
          state: 'idle',
          glint: 1,
          pos: { x: 43.2, y: 65.04, h: 40, alpha: 1, fog: 0 },
          d: makeFig(7),
          pose: { gx: 0, gy: 0, ang: 0 },
          lean: 0,
        }),
      () => (views.G.enemies.length = 0),
    );
    sample(
      'lanterns',
      () => views.fx.px.push({ k: 'lantern', x: 64, y: 64, s: 10, t: 0, life: 2, ph: 0 }),
      () => (views.fx.px.length = 0),
    );
    sample(
      'embers',
      () => views.fx.embers.push({ x: 64, y: 64, t: 0, life: 2, ph: 0 }),
      () => (views.fx.embers.length = 0),
    );
    sample(
      'foxfire',
      () => (views.G.m.foxfire = true),
      () => (views.G.m.foxfire = false),
    );
    sample(
      'boss-auras',
      () =>
        (views.G.boss = {
          state: 'flash',
          def: {},
          d: makeFig(8),
          pose: { gx: 0, gy: 0, ang: 0 },
          lean: 0,
          glint: 0,
          pos: { x: 64, y: 101.2, h: 60, alpha: 1, fog: 0 },
          bp: { flash: 0.4 },
          t: 0.2,
        }),
      () => (views.G.boss = null),
    );
    views.G.m.foxfire = true;
    const live = capture();
    dispose();
    dispose();
    const detached = capture(),
      glError = renderer.gl.getError();
    const remove = bindSceneLightSources(sources, () => views);
    capture();
    Object.assign(window, {
      persistentLightDispose: () => {
        remove();
        sources.dispose();
        painter.dispose();
      },
    });
    return { dark, rows, live, detached, glError };
  });
  expect(result.glError).toBe(0);
  expect(result.rows).toHaveLength(5);
  for (const row of result.rows) {
    expect(row.lit.count, row.name).toBe(1);
    expect(Math.max(...row.lit.pixel.slice(0, 3)), row.name).toBeGreaterThan(15);
    expect(row.lit.pixel[3], row.name).toBe(255);
    expect(row.repeat, row.name).toEqual(row.lit);
    expect(row.unchanged, row.name).toBe(true);
    expect(row.removed, row.name).toEqual(result.dark);
  }
  expect(result.live.count).toBe(1);
  expect(result.detached).toEqual(result.dark);
  await page
    .locator('#persistent-light-probe')
    .screenshot({ path: testInfo.outputPath('foxfire-light.png') });
  await page.evaluate(() => Reflect.get(window, 'persistentLightDispose')());
  expect(errors).toEqual([]);
});
