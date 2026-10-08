import { expect, test } from '@playwright/test';

test('half light lookup preserves normal and depth boundaries that plain bilinear sampling bleeds across', async ({
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
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 2;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 2, 2);
      return { source, revision: 0 };
    };
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 64;
    canvas.id = 'half-edge-probe';
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas),
      renderer = Reflect.get(painter, 'renderer');
    const grey = texture('#888'),
      flat = texture('rgb(128,128,255)'),
      surface = texture('rgb(255,0,255)');
    const read = () => {
      const copy = document.createElement('canvas');
      copy.width = copy.height = 64;
      const g = copy.getContext('2d')!;
      g.drawImage(canvas, 0, 0);
      return [...g.getImageData(0, 0, 64, 64).data];
    };
    const render = (resolution: 1 | 0.5, depth: boolean) => {
      painter.begin();
      setSceneLighting(painter, {
        lightResolution: resolution,
        ambient: [0, 0, 0],
        directional: depth ? [0, 0, 0] : [0.8, 0.8, 0.8],
        direction: [1, 0, 1],
        points: depth ? [{ x: 32, y: 32, z: 0, radius: 1000, intensity: 1, color: [1, 1, 1] }] : [],
      });
      for (let side = 0; side < 2; side++)
        drawMaterialStamp(painter, {
          texture: grey,
          material: {
            lighting: 1,
            fog: 0,
            fogColor: [0, 0, 0],
            surface,
            normal: depth ? flat : texture(side ? 'rgb(0,128,128)' : 'rgb(255,128,128)'),
            depth: depth ? (side ? 24 : -24) : 0,
          },
          x: side ? 31 : 0,
          y: 0,
          width: side ? 33 : 31,
          height: 64,
        });
      painter.flush();
      return read();
    };
    const compare = (depth: boolean) => {
      const full = render(1, depth),
        geometry = painter.geometryTargets;
      const aware = render(0.5, depth),
        light = painter.lightTargets!;
      // Ablate only the guide, leaving the same four-tap accumulated-light lookup.
      for (const slot of Reflect.get(painter, 'slots'))
        if (slot.material)
          slot.material.mesh.shader.resources.uLightGuide = Reflect.get(
            light.guide,
            'constructor',
          ).EMPTY.source;
      renderer.render({ container: Reflect.get(painter, 'root'), clear: true });
      const bilinear = read();
      let alphaMismatch = 0,
        total = 0,
        edgeAware = 0,
        edgeBilinear = 0;
      for (let i = 0; i < full.length; i += 4) {
        if (full[i + 3] !== aware[i + 3]) alphaMismatch++;
        for (let c = 0; c < 3; c++) total += Math.abs(full[i + c]! - aware[i + c]!);
      }
      for (let y = 8; y < 56; y++)
        for (let x = 30; x <= 31; x++) {
          const i = (y * 64 + x) * 4;
          for (let c = 0; c < 3; c++) {
            edgeAware += Math.abs(full[i + c]! - aware[i + c]!);
            edgeBilinear += Math.abs(full[i + c]! - bilinear[i + c]!);
          }
        }
      render(0.5, depth);
      return {
        alphaMismatch,
        mean: total / (64 * 64 * 3),
        edgeAware: edgeAware / (48 * 2 * 3),
        edgeBilinear: edgeBilinear / (48 * 2 * 3),
        sameGeometry: geometry === painter.geometryTargets,
        size: [light.width, light.height, light.sceneWidth, light.sceneHeight],
        guide: light.guide === painter.geometryTargets!.g0,
      };
    };
    const normal = compare(false),
      depth = compare(true),
      glError = renderer.gl.getError();
    Object.assign(window, { halfEdgeDispose: () => painter.dispose() });
    return { normal, depth, glError };
  });
  for (const row of [result.normal, result.depth]) {
    expect(row.size).toEqual([32, 32, 64, 64]);
    expect(row.sameGeometry).toBe(true);
    expect(row.guide).toBe(true);
    expect(row.alphaMismatch).toBe(0);
    expect(row.mean).toBeLessThanOrEqual(9);
    expect(row.edgeBilinear).toBeGreaterThan(row.edgeAware + 5);
  }
  expect(result.glError).toBe(0);
  await page
    .locator('#half-edge-probe')
    .screenshot({ path: testInfo.outputPath('half-depth-edge.png') });
  await page.evaluate(() => Reflect.get(window, 'halfEdgeDispose')());
  expect(errors).toEqual([]);
});

test('half targets serve every colour provider and retain independent resize/restore ownership', async ({
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
  const initial = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const { drawInstancedGrass } = await import('/src/rendering/scene-grass.ts');
    const { drawInstancedLeaves } = await import('/src/rendering/scene-leaves.ts');
    const { createLeafMotion } = await import('/src/rendering/scene/leaf-motion.ts');
    const { DRIFT_SPRITES } = await import('/src/rendering/scene/drift-catalog.ts');
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = 64;
      source.height = 32;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 64, 32);
      return { source, revision: 0 };
    };
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 128;
    canvas.id = 'half-owner-probe';
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas),
      renderer = Reflect.get(painter, 'renderer');
    Reflect.get(painter, 'artworkMaterials').uniforms.uniforms.uArtworkLighting = 1;
    const grey = texture('#888'),
      normal = texture('rgb(128,128,255)'),
      surface = texture('rgb(255,0,255)');
    const material = {
      lighting: 1,
      depth: 0,
      fog: 0,
      fogColor: [0, 0, 0] as const,
      normal,
      surface,
    };
    const atlases = ['leaves', 'petals', 'debris', 'fire'].map((id) => ({
      id,
      texture: grey,
      material,
      width: 64,
      height: 32,
    }));
    const motion = createLeafMotion();
    const leaf = {
      x: 98,
      y: 85,
      z: 1,
      s: 24,
      rot: 0,
      vr: 0,
      fl: 0,
      vf: 0,
      vy: 0,
      ph: 0,
      col: '#888',
      sprite: DRIFT_SPRITES[0]!.id,
    };
    motion.register(leaf);
    const leaves = [leaf],
      blades = [{ x: 45, y: 112, h: 45, w: 12, ph: 0, col: '#888' }];
    const capture = (resolution: 1 | 0.5) => {
      painter.begin();
      setSceneLighting(painter, {
        lightResolution: resolution,
        ambient: [0.25, 0.25, 0.25],
        directional: [0, 0, 0],
        direction: [0, 0, 1],
        points: [],
      });
      drawMaterialStamp(painter, {
        texture: grey,
        material,
        x: 0,
        y: 0,
        width: canvas.width,
        height: canvas.height,
      });
      painter.fillStyle = '#888';
      painter.fillRect(8, 8, 28, 24);
      painter.drawImage(grey.source, 48, 8, 28, 24);
      drawInstancedGrass(painter, { blades, time: 0, wind: 0, depth: 0, density: 1 });
      drawInstancedLeaves(painter, {
        leaves,
        front: false,
        motion,
        spriteMotion: true,
        scale: 1,
        width: canvas.width,
        height: canvas.height,
        atlases,
      });
      painter.flush();
      const copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      const g = copy.getContext('2d')!;
      g.drawImage(canvas, 0, 0);
      return [...g.getImageData(0, 0, copy.width, copy.height).data];
    };
    const full = capture(1),
      geometry = painter.geometryTargets!,
      oldLight = painter.lightTargets!;
    const half = capture(0.5),
      halfTargets = painter.lightTargets!;
    const providers = Reflect.get(painter, 'slots')
      .slice(0, Reflect.get(painter, 'cursor'))
      .map((s: any) =>
        s.leaf
          ? 'leaf'
          : s.grass
            ? 'grass'
            : s.material
              ? 'material'
              : s.lookup
                ? 'image'
                : 'graphics',
      );
    const switchState = {
      gSame: geometry === painter.geometryTargets,
      oldDestroyed: oldLight.diffuse.source.destroyed,
      size: [halfTargets.width, halfTargets.height],
      guide: halfTargets.guide === geometry.g0,
    };
    const otherCanvas = document.createElement('canvas');
    otherCanvas.width = 31;
    otherCanvas.height = 17;
    const other = await createPixiScenePainter(otherCanvas);
    other.begin();
    setSceneLighting(other, {
      lightResolution: 0.5,
      ambient: [0.5, 0.5, 0.5],
      directional: [0, 0, 0],
      direction: [0, 0, 1],
      points: [],
    });
    drawMaterialStamp(other, { texture: grey, material, x: 0, y: 0, width: 31, height: 17 });
    other.flush();
    const otherTargets = other.lightTargets;
    canvas.width = 65;
    canvas.height = 33;
    const resized = capture(0.5),
      next = painter.lightTargets!;
    const resize = {
      size: [next.width, next.height, next.sceneWidth, next.sceneHeight],
      oldGDestroyed: geometry.g0.source.destroyed,
      oldLightDestroyed: halfTargets.diffuse.source.destroyed,
      otherSame: otherTargets === other.lightTargets,
      otherSize: [otherTargets!.width, otherTargets!.height],
      guide: next.guide === painter.geometryTargets!.g0,
    };
    const extension = renderer.gl.getExtension('WEBGL_lose_context');
    Object.assign(window, { halfOwner: { painter, other, renderer, capture, extension, resized } });
    return { full, half, providers, switchState, resize, glError: renderer.gl.getError() };
  });
  expect(initial.full).toEqual(initial.half);
  expect(initial.providers).toEqual(
    expect.arrayContaining(['material', 'graphics', 'image', 'grass', 'leaf']),
  );
  expect(initial.switchState).toEqual({
    gSame: true,
    oldDestroyed: true,
    size: [64, 64],
    guide: true,
  });
  expect(initial.resize).toEqual({
    size: [33, 17, 65, 33],
    oldGDestroyed: true,
    oldLightDestroyed: true,
    otherSame: true,
    otherSize: [16, 9],
    guide: true,
  });
  expect(initial.glError).toBe(0);
  await page.evaluate(() => Reflect.get(window, 'halfOwner').extension.loseContext());
  await expect(page.locator('#half-owner-probe')).toHaveAttribute('data-context-state', 'lost');
  await page.evaluate(() => Reflect.get(window, 'halfOwner').extension.restoreContext());
  await expect(page.locator('#half-owner-probe')).toHaveAttribute('data-context-state', 'ready');
  const restored = await page.evaluate(() => {
    const owner = Reflect.get(window, 'halfOwner'),
      before = owner.resized,
      after = owner.capture(0.5);
    let alpha = 0,
      rgb = 0;
    for (let i = 0; i < after.length; i += 4) {
      if (before[i + 3] !== after[i + 3]) alpha++;
      for (let c = 0; c < 3; c++) rgb += Math.abs(before[i + c] - after[i + c]);
    }
    const targets = owner.painter.lightTargets;
    return {
      alpha,
      mean: rgb / ((after.length / 4) * 3),
      size: [targets.width, targets.height],
      guide: targets.guide === owner.painter.geometryTargets.g0,
      error: owner.renderer.gl.getError(),
    };
  });
  expect(restored.alpha).toBe(0);
  expect(restored.mean).toBeLessThanOrEqual(9);
  expect(restored.size).toEqual([33, 17]);
  expect(restored.guide).toBe(true);
  expect(restored.error).toBe(0);
  await page
    .locator('#half-owner-probe')
    .screenshot({ path: testInfo.outputPath('half-all-providers.png') });
  const disposal = await page.evaluate(() => {
    const owner = Reflect.get(window, 'halfOwner'),
      targets = owner.painter.lightTargets;
    owner.painter.dispose();
    owner.other.flush();
    const independent =
      !!owner.other.lightTargets && !owner.other.lightTargets.diffuse.source.destroyed;
    owner.other.dispose();
    return {
      destroyed: targets.diffuse.source.destroyed && targets.specular.source.destroyed,
      independent,
    };
  });
  expect(disposal).toEqual({ destroyed: true, independent: true });
  expect(errors).toEqual([]);
});

test('light resolution testing control updates actual targets and remains session-only', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.locator('#c')).toHaveAttribute('data-renderer', 'ink');
  const saved = await page.evaluate(() => localStorage.getItem('issen.settings'));
  await page.keyboard.press('Backquote');
  await page.getByLabel('Light resolution', { exact: true }).selectOption('half');
  const dimensions = await page
    .locator('#c')
    .evaluate((c: HTMLCanvasElement) => `${Math.ceil(c.width / 2)}x${Math.ceil(c.height / 2)}`);
  await expect(page.locator('#c')).toHaveAttribute('data-light-buffer-size', dimensions);
  expect(await page.evaluate(() => localStorage.getItem('issen.settings'))).toBe(saved);
  await page.getByRole('button', { name: 'Reset light', exact: true }).click();
  await expect(page.getByLabel('Light resolution', { exact: true })).toHaveValue('full');
  const full = await page
    .locator('#c')
    .evaluate((c: HTMLCanvasElement) => `${c.width}x${c.height}`);
  await expect(page.locator('#c')).toHaveAttribute('data-light-buffer-size', full);
  await page.reload();
  await page.keyboard.press('Backquote');
  await expect(page.getByLabel('Light resolution', { exact: true })).toHaveValue('full');
});
