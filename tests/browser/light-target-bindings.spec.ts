import { expect, test } from '@playwright/test';

test('light passes retain geometry samplers until their generation is replaced or disposed', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const painter = await createPixiScenePainter(canvas);
    const buffer = Reflect.get(painter, 'lightBuffer');
    const detach = buffer.detachGeometry.bind(buffer);
    let releases = 0;
    buffer.detachGeometry = () => {
      releases++;
      detach();
    };
    const draw = () => {
      painter.begin();
      painter.fillStyle = '#7b604e';
      painter.fillRect(0, 0, canvas.width, canvas.height);
      painter.flush();
    };
    draw();
    const source = buffer.shader.resources.uG0;
    draw();
    draw();
    const steady = {
      releases,
      same: buffer.shader.resources.uG0 === source,
      live: !source.destroyed,
    };
    canvas.width = 33;
    draw();
    const resized = {
      releases,
      replaced: buffer.shader.resources.uG0 !== source,
      retired: source.destroyed,
    };
    const next = buffer.shader.resources.uG0;
    painter.dispose();
    return { steady, resized, final: { releases, retired: next.destroyed } };
  });
  expect(result).toEqual({
    steady: { releases: 0, same: true, live: true },
    resized: { releases: 1, replaced: true, retired: true },
    final: { releases: 2, retired: true },
  });
});

test('composite shaders borrow the shared light group and release their own listeners', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createSharedLightResources, createLightShader } =
      await import('/src/rendering/pixi/shared-light-resources.ts');
    const group = createSharedLightResources();
    const Source = Reflect.get(group.getResource(0), 'constructor');
    const light = new Source({ width: 2, height: 2 });
    const material = new Source({ width: 2, height: 2 });
    group.setResource(light, 0);
    const gl = {
      vertex: 'void main(){gl_Position=vec4(0.0);}',
      fragment: 'void main(){}',
      name: 'binding-ownership-test',
    };
    const first = createLightShader(gl, { uDiffuse: material }, group);
    const second = createLightShader(gl, { uDiffuse: material }, group);
    const listeners = light.listenerCount('change');
    first.dispose();
    const peerRetainsLight = second.shader.resources.uLightDiffuse === light;
    const ownListeners = material.listenerCount('change');
    second.dispose();
    const afterMaterials = light.listenerCount('change');
    const releasedMaterial = material.listenerCount('change');
    group.destroy();
    const releasedLight = light.listenerCount('change');
    light.destroy();
    material.destroy();
    return {
      listeners,
      peerRetainsLight,
      ownListeners,
      afterMaterials,
      releasedMaterial,
      releasedLight,
    };
  });
  expect(result).toEqual({
    listeners: 1,
    peerRetainsLight: true,
    ownListeners: 1,
    afterMaterials: 1,
    releasedMaterial: 0,
    releasedLight: 0,
  });
});

test('shrinking scene pools detach only previously prepared slots and preserve geometry without feedback', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || /feedback loop|GL_INVALID/.test(message.text()))
      errors.push(message.text());
  });
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    const painter = await createPixiScenePainter(canvas);
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 2;
      const ctx = source.getContext('2d')!;
      ctx.fillStyle = colour;
      ctx.fillRect(0, 0, 2, 2);
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
    const draw = (count: number) => {
      painter.begin();
      setSceneLighting(painter, {
        ambient: [0.25, 0.25, 0.25],
        directional: [0, 0, 0],
        direction: [0, 0, 1],
        points: [],
      });
      for (let index = 0; index < count; index++)
        drawMaterialStamp(painter, {
          texture: white,
          material,
          x: (index % 8) * 8,
          y: Math.floor(index / 8) * 8,
          width: 8,
          height: 8,
        });
      painter.flush();
    };
    draw(40);
    const listenerCount = () =>
      Reflect.get(painter, 'lightBuffer').targets.diffuse.source.listenerCount('change');
    const largePoolListeners = listenerCount();
    const released: number[] = [],
      slots = Reflect.get(painter, 'slots');
    slots.forEach((slot: any, index: number) => {
      const release = slot.material.releaseLightTargets;
      slot.material.releaseLightTargets = () => {
        released.push(index);
        release();
      };
    });
    draw(2);
    const previous = released.splice(0);
    draw(2);
    const active = released.splice(0);
    const smallPoolListeners = listenerCount();
    const copy = document.createElement('canvas');
    copy.width = copy.height = 64;
    const ctx = copy.getContext('2d', { willReadFrequently: true })!;
    ctx.drawImage(canvas, 0, 0);
    const before = [...ctx.getImageData(0, 0, 64, 64).data];
    painter.flush();
    ctx.clearRect(0, 0, 64, 64);
    ctx.drawImage(canvas, 0, 0);
    const repeat = [...ctx.getImageData(0, 0, 64, 64).data];
    canvas.width = 65;
    draw(2);
    const glError = Reflect.get(painter, 'renderer').gl.getError();
    painter.dispose();
    return {
      previous,
      active,
      same: before.every((value, index) => value === repeat[index]),
      glError,
      largePoolListeners,
      smallPoolListeners,
    };
  });
  expect(result.previous).toEqual(Array.from({ length: 40 }, (_, index) => index));
  expect(result.active).toEqual([0, 1]);
  expect(result.same).toBe(true);
  expect(result.glError).toBe(0);
  expect(result.largePoolListeners).toBeLessThanOrEqual(3);
  expect(result.smallPoolListeners).toBe(result.largePoolListeners);
  expect(errors).toEqual([]);
});
