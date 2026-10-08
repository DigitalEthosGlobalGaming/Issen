import { expect, test } from '@playwright/test';

test('explicit native passes reuse GPU preparation and invalidate borrowed targets after new submissions, quality or resize', async ({
  page,
}, testInfo) => {
  await page.route('**/favicon.ico', (r) => r.fulfill({ status: 204 }));
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => {
    if (m.type() === 'error' || (m.type() === 'warning' && m.text().includes('PixiJS')))
      errors.push(m.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    canvas.id = 'pass-probe';
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas),
      renderer = Reflect.get(painter, 'renderer');
    const geometry = Reflect.get(painter, 'geometryBuffer'),
      light = Reflect.get(painter, 'lightBuffer');
    let geometryCalls = 0,
      lightCalls = 0;
    const nativeG = geometry.render.bind(geometry),
      nativeL = light.render.bind(light);
    geometry.render = (...args: any[]) => {
      geometryCalls++;
      return nativeG(...args);
    };
    light.render = (...args: any[]) => {
      lightCalls++;
      return nativeL(...args);
    };
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 2;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 2, 2);
      return { source, revision: 0 };
    };
    const white = texture('#fff'),
      material = {
        lighting: 1,
        depth: 0,
        fog: 0,
        fogColor: [0, 0, 0] as const,
        normal: texture('rgb(128,128,255)'),
        surface: texture('rgb(255,0,255)'),
      };
    const lighting = {
      ambient: [0.25, 0.25, 0.25] as const,
      directional: [0, 0, 0] as const,
      direction: [0, 0, 1] as const,
      points: [],
    };
    const stamp = (x: number, width: number) =>
      drawMaterialStamp(painter, { texture: white, material, x, y: 0, width, height: 64 });
    const read = () => {
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      const g = copy.getContext('2d')!;
      g.drawImage(canvas, 0, 0);
      return [...g.getImageData(0, 0, copy.width, copy.height).data];
    };
    painter.begin();
    setSceneLighting(painter, lighting);
    stamp(0, 32);
    const before = !painter.lightingTargets;
    painter.geometryPass();
    painter.geometryPass();
    const geometryOnly = !painter.lightingTargets;
    painter.lightPass();
    painter.lightPass();
    const targets = painter.lightingTargets!;
    const frozen =
      Object.isFrozen(targets) &&
      Object.isFrozen(targets.geometry) &&
      Object.isFrozen(targets.light);
    painter.flush();
    const first = read();
    painter.flush();
    const repeat = read();
    const prepared = [geometryCalls, lightCalls];
    stamp(32, 32);
    const lateInvalid = !painter.lightingTargets;
    painter.flush();
    const late = read(),
      lateCalls = [geometryCalls, lightCalls];
    canvas.dataset.lightResolution = 'half';
    const qualityInvalid = !painter.lightingTargets;
    painter.lightPass();
    painter.flush();
    const half = read(),
      halfCalls = [geometryCalls, lightCalls];
    const quality = {
      sameG: targets.geometry === painter.geometryTargets,
      size: [painter.lightTargets!.width, painter.lightTargets!.height],
      oldLDestroyed: targets.light.diffuse.source.destroyed,
    };
    const old = painter.lightingTargets!;
    canvas.width = 65;
    const resizeInvalid = !painter.lightingTargets;
    painter.geometryPass();
    painter.lightPass();
    painter.flush();
    const resize = {
      calls: [geometryCalls, lightCalls],
      oldGDestroyed: old.geometry.g0.source.destroyed,
      oldLDestroyed: old.light.diffuse.source.destroyed,
      size: [painter.lightTargets!.width, painter.lightTargets!.height],
      guide: painter.lightingTargets!.light.guide === painter.lightingTargets!.geometry.g0,
    };
    setSceneLighting(painter, { ...lighting, ambient: [0.5, 0.5, 0.5] });
    const lightingInvalid = !painter.lightingTargets;
    painter.flush();
    const lightingCalls = [geometryCalls, lightCalls];
    const error = renderer.gl.getError();
    Object.assign(window, {
      passDispose: () => {
        painter.dispose();
        return !painter.lightingTargets;
      },
    });
    return {
      before,
      geometryOnly,
      frozen,
      first,
      repeat,
      prepared,
      lateInvalid,
      late,
      lateCalls,
      qualityInvalid,
      half,
      halfCalls,
      quality,
      resizeInvalid,
      resize,
      lightingInvalid,
      lightingCalls,
      error,
    };
  });
  expect(result.before).toBe(true);
  expect(result.geometryOnly).toBe(true);
  expect(result.frozen).toBe(true);
  expect(result.repeat).toEqual(result.first);
  expect(result.prepared).toEqual([1, 1]);
  expect(result.lateInvalid).toBe(true);
  expect(result.lateCalls).toEqual([2, 2]);
  expect(result.late.filter((_, i) => i % 4 === 3 && result.late[i] === 255)).toHaveLength(64 * 64);
  expect(result.qualityInvalid).toBe(true);
  expect(result.halfCalls).toEqual([2, 3]);
  expect(result.half).toEqual(result.late);
  expect(result.quality).toEqual({ sameG: true, size: [32, 32], oldLDestroyed: true });
  expect(result.resizeInvalid).toBe(true);
  expect(result.resize).toEqual({
    calls: [3, 4],
    oldGDestroyed: true,
    oldLDestroyed: true,
    size: [33, 32],
    guide: true,
  });
  expect(result.lightingInvalid).toBe(true);
  expect(result.lightingCalls).toEqual([4, 5]);
  expect(result.error).toBe(0);
  await page
    .locator('#pass-probe')
    .screenshot({ path: testInfo.outputPath('named-light-passes.png') });
  expect(await page.evaluate(() => Reflect.get(window, 'passDispose')())).toBe(true);
  expect(errors).toEqual([]);
});
