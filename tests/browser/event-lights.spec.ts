import { expect, test } from '@playwright/test';

test('event flashes reach native light/composite targets and freeze, decay, suppress and dispose independently', async ({
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
    const { createEventBus } = await import('/src/game/events.ts');
    const { createLightSources } = await import('/src/presentation/light-sources.ts');
    const { bindEventLights } = await import('/src/presentation/event-lights.ts');
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 2;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 2, 2);
      return { source, revision: 0 };
    };
    const canvas = document.createElement('canvas');
    canvas.id = 'event-light-probe';
    canvas.width = canvas.height = 64;
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas);
    const renderer = Reflect.get(painter, 'renderer');
    const events = createEventBus();
    const sources = createLightSources();
    const views = { time: 0, reducedFlashes: false };
    const dispose = bindEventLights(events, sources, () => views);
    const white = texture('#888');
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
      painter.begin();
      setSceneLighting(
        painter,
        sources.lighting({ width: 64, height: 64, time: views.time }, base),
      );
      drawMaterialStamp(painter, { texture: white, material, x: 0, y: 0, width: 64, height: 64 });
      painter.flush();
      const copy = document.createElement('canvas');
      copy.width = copy.height = 64;
      const g = copy.getContext('2d')!;
      g.drawImage(canvas, 0, 0);
      const colour = Array.from(g.getImageData(32, 29, 1, 1).data);
      const irradiance = new Float32Array(4);
      renderer.renderTarget.bind({ target: painter.lightTargets!.diffuse, clear: false });
      renderer.gl.readPixels(32, 29, 1, 1, renderer.gl.RGBA, renderer.gl.FLOAT, irradiance);
      return { colour, irradiance: Array.from(irradiance) };
    };
    const dark = capture();
    events.emit('kill', { x: 32, y: 64, height: 64, perfect: true } as any);
    const initial = capture(),
      frozen = capture();
    views.time = 0.09;
    const half = capture();
    views.reducedFlashes = true;
    const suppressed = capture();
    views.reducedFlashes = false;
    views.time = 0.19;
    const expired = capture();
    views.time = 1;
    events.emit('parry', { x: 32, y: 64, height: 64, perfect: true } as any);
    const parry = capture();
    dispose();
    dispose();
    events.emit('block', { x: 32, y: 64, height: 64, perfect: true } as any);
    const detached = capture();
    const glError = renderer.gl.getError();
    views.time = 2;
    const remove = bindEventLights(events, sources, () => views);
    events.emit('parry', { x: 32, y: 64, height: 64, perfect: true } as any);
    capture();
    Object.assign(window, {
      eventLightDispose: () => {
        remove();
        sources.dispose();
        painter.dispose();
      },
    });
    return { dark, initial, frozen, half, suppressed, expired, parry, detached, glError };
  });
  expect(result.glError).toBe(0);
  expect(result.initial.colour[0]).toBeGreaterThan(result.dark.colour[0]! + 15);
  expect(result.frozen).toEqual(result.initial);
  for (let channel = 0; channel < 3; channel++)
    expect(result.half.irradiance[channel]! / result.initial.irradiance[channel]!).toBeCloseTo(
      0.25,
      2,
    );
  expect(result.suppressed).toEqual(result.dark);
  expect(result.expired).toEqual(result.dark);
  expect(result.detached).toEqual(result.dark);
  expect(result.parry.colour[2]).toBeGreaterThan(result.dark.colour[2]! + 15);
  await page
    .locator('#event-light-probe')
    .screenshot({ path: testInfo.outputPath('parry-light.png') });
  await page.evaluate(() => Reflect.get(window, 'eventLightDispose')());
  expect(errors).toEqual([]);
});
