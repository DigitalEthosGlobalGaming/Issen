import { expect, test } from '@playwright/test';

test('material lighting preserves midtones, matte cloth, fog colour and light footprint', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const result = await page.evaluate(async () => {
    const { createPixiBackend } = await import('/src/rendering/pixi/backend.ts');
    const { SceneTextureStore } = await import('/src/rendering/pixi/texture-store.ts');
    const { IDENTITY } = await import('/src/rendering/scene-frame.ts');
    const canvas = document.createElement('canvas');
    const backend = await createPixiBackend(canvas);
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 8;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 8, 8);
      return { source, revision: 0 };
    };
    const material = {
      normal: texture('rgb(128,128,255)'),
      surface: texture('rgb(217,0,255)'),
      lighting: 1,
      depth: 0,
      fog: 0,
      fogColor: [0, 0, 0],
    };
    const sprite: any = {
      kind: 'sprite',
      texture: texture('#808080'),
      transform: IDENTITY,
      width: 32,
      height: 32,
      alpha: 0.5,
      tint: 0xffffff,
      blend: 'normal',
      material,
    };
    const lighting: any = {
      ambient: [1, 1, 1],
      directional: [0, 0, 0],
      direction: [0, 0, 1],
      points: [],
    };
    const frame: any = {
      width: 32,
      height: 32,
      dpr: 1,
      time: 0,
      reducedMotion: false,
      reducedFlashes: false,
      sprites: [sprite],
      lighting,
    };
    const copy = document.createElement('canvas');
    copy.width = copy.height = 32;
    const g = copy.getContext('2d')!;
    const capture = () => {
      backend.render(frame);
      g.clearRect(0, 0, 32, 32);
      g.drawImage(canvas, 0, 0);
      return [...g.getImageData(16, 16, 1, 1).data];
    };
    const neutral = capture();
    material.lighting = 0;
    const unlit = capture();
    material.lighting = 1;
    material.surface = texture('rgba(217,0,255,0.25)');
    const transparentData = capture();
    material.surface = texture('rgb(217,0,255)');
    sprite.texture = texture('#202020');
    lighting.ambient = [0, 0, 0];
    lighting.directional = [1, 1, 1];
    const cloth = capture();
    lighting.direction = [0, 0, -1];
    const backlit = capture();
    lighting.directional = [0, 0, 0];
    const point = { x: 16, y: 16, z: 16, radius: 32, intensity: 1, color: [1, 1, 1] };
    lighting.points = [point];
    const low = capture();
    point.z = 64;
    const high = capture();
    lighting.points = [
      ...Array.from({ length: 4 }, () => ({ ...point, x: 1000, intensity: 10 })),
      point,
    ];
    const selected = capture();
    material.fog = 1;
    material.fogColor = [0.5, 0.5, 0.5];
    sprite.tint = 0xff0000;
    const fog = capture();
    const store = new SceneTextureStore();
    const displayTexture = store.get(material.surface);
    const dataTexture = store.getData(material.surface);
    const rawMode = dataTexture.source.alphaMode;
    const separateSources = displayTexture.source !== dataTexture.source;
    store.dispose();
    backend.dispose();
    return {
      neutral,
      unlit,
      transparentData,
      cloth,
      backlit,
      low,
      high,
      selected,
      fog,
      rawMode,
      separateSources,
    };
  });
  expect(errors).toEqual([]);
  expect(result.neutral[0]).toBeGreaterThan(125);
  expect(result.neutral[0]).toBeLessThan(132);
  expect(Math.abs(result.neutral[0]! - result.unlit[0]!)).toBeLessThan(3);
  expect(Math.abs(result.neutral[0]! - result.transparentData[0]!)).toBeLessThan(4);
  expect(result.cloth[0]).toBeGreaterThan(30);
  expect(result.cloth[0]).toBeLessThan(65);
  expect(result.backlit.slice(0, 3)).toEqual([0, 0, 0]);
  expect(result.high[0]).toBeGreaterThan(30);
  expect(Math.abs(result.high[0]! - result.low[0]!)).toBeLessThan(4);
  expect(result.selected).toEqual(result.high);
  expect(result.fog.slice(0, 3).every((channel) => channel > 125 && channel < 132)).toBe(true);
  expect(result.neutral[3]).toBeGreaterThanOrEqual(127);
  expect(result.neutral[3]).toBeLessThanOrEqual(128);
  expect(result.cloth[3]).toBe(result.neutral[3]);
  expect(result.rawMode).toBe('no-premultiply-alpha');
  expect(result.separateSources).toBe(true);
});
