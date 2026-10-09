import { expect, test } from '@playwright/test';

test('ordered leaf instances preserve all catalogue frames and opacity while GPU motion keeps spawn data unchanged', async ({
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
    const { drawInstancedLeaves } = await import('/src/rendering/scene-leaves.ts');
    const { createLeafMotion, leafMotionPose } =
      await import('/src/rendering/scene/leaf-motion.ts');
    const { DRIFT_SPRITES } = await import('/src/rendering/scene/drift-catalog.ts');
    const { leafSprite } = await import('/src/rendering/scene/drift-frame.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const texture = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = 64;
      source.height = 32;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 64, 32);
      return { source, revision: 0 };
    };
    const normal = texture('rgb(128,128,255)'),
      surface = texture('rgb(217,0,255)');
    const merged = texture('#fff');
    merged.source.width = 1024;
    merged.source.height = 512;
    const mergedContext = merged.source.getContext('2d')!;
    DRIFT_SPRITES.forEach((sprite, i) => {
      const [u, v, w, h] = sprite.frame;
      mergedContext.fillStyle = `rgba(${40 + (i % 8) * 20},${40 + Math.floor(i / 8) * 40},${160 - (i % 8) * 10},${0.65 + (i % 8) * 0.04})`;
      mergedContext.fillRect(u * 1024 + 10, v * 512 + 5, w * 1024 - 20, h * 512 - 10);
    });
    const atlases = ['leaves', 'petals', 'debris', 'fire'].map((id) => ({
      id,
      texture: merged,
      width: 1024,
      height: 512,
      material: { normal, surface, lighting: 1, depth: 0, fog: 0, fogColor: [0, 0, 0], normalY: 1 },
    }));
    const motion = createLeafMotion();
    const leaves = DRIFT_SPRITES.map((sprite, i) => ({
      sprite: sprite.id,
      spin: sprite.spin,
      rise: sprite.rise,
      flutter: sprite.flutter,
      x: 35 + (i % 8) * 65,
      y: 45 + Math.floor(i / 8) * 60,
      z: 0.9,
      s: 10,
      rot: (i % 3) * 0.2,
      vr: 0.5,
      fl: (i % 2) * 0.4,
      vf: 2,
      vy: 6,
      ph: i * 0.2,
      col: '#fff',
    }));
    leaves.forEach((leaf) => motion.register(leaf));
    const canvas = document.createElement('canvas');
    canvas.width = 560;
    canvas.height = 280;
    canvas.id = 'leaf-probe';
    document.body.append(canvas);
    const painter = await createPixiScenePainter(canvas),
      renderer = Reflect.get(painter, 'renderer'),
      gl = renderer.gl as WebGL2RenderingContext;
    const referenceCanvas = document.createElement('canvas');
    referenceCanvas.width = 560;
    referenceCanvas.height = 280;
    const reference = await createPixiScenePainter(referenceCanvas);
    const images = new Map(
      atlases.map((a) => [a.id, { source: a.texture.source, width: a.width, height: a.height }]),
    );
    const draws: number[] = [];
    const nativeDraw = gl.drawElementsInstanced.bind(gl);
    gl.drawElementsInstanced = (mode, count, type, offset, n) => {
      draws.push(n);
      nativeDraw(mode, count, type, offset, n);
    };
    const capture = (source: HTMLCanvasElement) => {
      const copy = document.createElement('canvas');
      copy.width = 560;
      copy.height = 280;
      const g = copy.getContext('2d')!;
      g.drawImage(source, 0, 0);
      return [...g.getImageData(0, 0, 560, 280).data];
    };
    const lighting = {
      materialLighting: 0,
      ambient: [0.4, 0.4, 0.4],
      directional: [0.5, 0.5, 0.5],
      direction: [-0.5, -0.3, 1],
      points: [],
    };
    const frame = {
      leaves,
      front: false,
      motion,
      spriteMotion: true,
      scale: 1,
      width: 560,
      height: 280,
      atlases,
    };
    const render = () => {
      painter.begin();
      setSceneLighting(painter, lighting);
      drawInstancedLeaves(painter, frame);
      painter.flush();
      return capture(canvas);
    };
    const expected = () => {
      reference.begin();
      setSceneLighting(reference, lighting);
      for (const leaf of leaves) {
        const pose = leafMotionPose(leaf, motion.birth(leaf), motion.clock, 1, true);
        const sprite = leafSprite(
          {
            ...leaf,
            x: pose.x,
            y: pose.y,
            rot: pose.rot,
            fl: leaf.fl + leaf.vf * (motion.clock.elapsed - motion.birth(leaf).elapsed),
          },
          images,
          true,
        )!;
        reference.save();
        reference.setTransform(
          sprite.transform.a,
          sprite.transform.b,
          sprite.transform.c,
          sprite.transform.d,
          sprite.transform.tx,
          sprite.transform.ty,
        );
        reference.globalAlpha = sprite.alpha;
        drawMaterialStamp(reference, {
          texture: sprite.texture,
          material: atlases.find((a) => a.id === leaf.sprite.split('.')[0])!.material,
          x: 0,
          y: 0,
          width: sprite.width,
          height: sprite.height,
        });
        reference.restore();
      }
      reference.flush();
      return capture(referenceCanvas);
    };
    const difference = (a: number[], b: number[]) =>
      a.reduce((n, v, i) => n + Math.abs(v - b[i]!), 0) / a.length;
    const first = render(),
      old = expected(),
      before = JSON.stringify(leaves);
    const samples = leaves.map((leaf) => {
      const i = (Math.round(leaf.y) * 560 + Math.round(leaf.x)) * 4;
      return { actual: first.slice(i, i + 4), expected: old.slice(i, i + 4) };
    });
    const instanceBuffer = Reflect.get(painter, 'slots')[0].leaf.mesh.geometry.attributes.aSpawn
      .buffer.data;
    const repeat = render();
    motion.advance(0.4, 0.4, 0.6);
    const moved = render(),
      movedExpected = expected();
    const retained =
      Reflect.get(painter, 'slots')[0].leaf.mesh.geometry.attributes.aSpawn.buffer.data ===
      instanceBuffer;
    lighting.materialLighting = 1;
    const lit = render();
    const targets = painter.geometryTargets!;
    renderer.renderTarget.bind({ target: targets.g1, clear: false });
    const data = new Uint8Array(560 * 280 * 4);
    gl.readPixels(0, 0, 560, 280, gl.RGBA, gl.UNSIGNED_BYTE, data);
    const pbr = data.filter((v, i) => i % 4 === 3 && v === 1).length;
    const error = gl.getError();
    reference.dispose();
    Object.assign(window, { leafProbe: painter });
    return {
      draws,
      samples,
      firstDifference: difference(first, old),
      repeatDifference: difference(first, repeat),
      movedDifference: difference(moved, movedExpected),
      motionDifference: difference(first, moved),
      lightingDifference: difference(moved, lit),
      unchanged: before === JSON.stringify(leaves),
      retained,
      pbr,
      error,
    };
  });
  expect(errors).toEqual([]);
  expect(result.error).toBe(0);
  expect(result.draws).toEqual([32, 32, 32, 32]);
  for (const sample of result.samples) {
    expect(sample.expected[3]).toBeGreaterThan(50);
    expect(sample.actual).toEqual(sample.expected);
  }
  expect(result.firstDifference).toBeLessThan(9);
  expect(result.movedDifference).toBeLessThan(9);
  expect(result.repeatDifference).toBe(0);
  expect(result.motionDifference).toBeGreaterThan(0.1);
  expect(result.lightingDifference).toBeGreaterThan(0.05);
  expect(result.unchanged).toBe(true);
  expect(result.retained).toBe(true);
  expect(result.pbr).toBe(0);
  await page
    .locator('#leaf-probe')
    .screenshot({ path: testInfo.outputPath('instanced-leaves.png') });
  await page.evaluate(() => (window as any).leafProbe.dispose());
  expect(errors).toEqual([]);
});

test('actual catalogue leaves retain independent layers, target lifetimes and lit flutter after restore', async ({
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
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { createLeafMotion } = await import('/src/rendering/scene/leaf-motion.ts');
    const { DRIFT_SPRITES } = await import('/src/rendering/scene/drift-catalog.ts');
    const { setSceneLighting } = await import('/src/rendering/scene-material.ts');
    const drift = createDriftRenderer();
    await drift.prepare();
    if (!drift.ready) throw new Error('Actual drift material catalogue did not prepare');
    const motion = createLeafMotion();
    const leaves = Array.from({ length: 1000 }, (_, i) => {
      const sprite = DRIFT_SPRITES[i % 32]!;
      const leaf = {
        sprite: sprite.id,
        spin: sprite.spin,
        rise: sprite.rise,
        flutter: sprite.flutter,
        x: 25 + (i % 20) * 17,
        y: 35 + Math.floor((i % 200) / 20) * 17,
        z: i % 2 ? 0.8 : 1.7,
        s: 5,
        rot: (i % 5) * 0.15,
        vr: 1.2,
        fl: i % 3 === 0 ? Math.PI : 0,
        vf: 2.5,
        vy: 4,
        ph: (i % 7) * 0.3,
        col: '#fff',
      };
      motion.register(leaf);
      return leaf;
    });
    const make = async (id: string) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400;
      canvas.height = 240;
      canvas.id = id;
      document.body.append(canvas);
      return { canvas, painter: await createPixiScenePainter(canvas) };
    };
    const first = await make('actual-leaf-probe'),
      second = await make('other-leaf-probe');
    const frame = { leaves, motion, spriteMotion: true, scale: 1, width: 400, height: 240 };
    const capture = (owner: typeof first) => {
      const copy = document.createElement('canvas');
      copy.width = owner.canvas.width;
      copy.height = owner.canvas.height;
      const g = copy.getContext('2d')!;
      g.drawImage(owner.canvas, 0, 0);
      return [...g.getImageData(0, 0, copy.width, copy.height).data];
    };
    const render = (owner: typeof first, ambient: number) => {
      const g = owner.painter;
      g.begin();
      setSceneLighting(g, {
        ambient: [ambient, ambient, ambient],
        directional: [0.4, 0.4, 0.4],
        direction: [-0.4, -0.3, 1],
        points: [],
      });
      drift.drawLeaves(g, { ...frame, front: false });
      drift.drawLeaves(g, { ...frame, front: true });
      g.flush();
      return capture(owner);
    };
    const before = JSON.stringify(leaves);
    const initial = render(first, 0.2),
      bright = render(second, 0.7);
    const firstSlots = Reflect.get(first.painter, 'slots');
    const counts = firstSlots.map((slot: any) => slot.leaf.mesh.geometry.instanceCount);
    const identities = firstSlots.map(
      (slot: any) => slot.leaf.mesh.geometry.attributes.aSpawn.buffer.data,
    );
    motion.advance(0.2, 0.2, 0.4);
    render(first, 0.2);
    const retained = firstSlots.every(
      (slot: any, i: number) =>
        slot.leaf.mesh.geometry.attributes.aSpawn.buffer.data === identities[i],
    );
    const geometry = first.painter.geometryTargets!,
      lights = first.painter.lightTargets!;
    first.canvas.width = 420;
    render(first, 0.2);
    const resized = geometry.g0.source.destroyed && lights.diffuse.source.destroyed;
    const snapshotTargets = () => {
      const renderer = Reflect.get(first.painter, 'renderer'),
        gl = renderer.gl as WebGL2RenderingContext;
      const geometry = first.painter.geometryTargets!,
        lights = first.painter.lightTargets!;
      const targets = [geometry.g0, geometry.g1, geometry.g2, lights.diffuse, lights.specular];
      const result = targets.map((target, i) => {
        renderer.renderTarget.bind({ target, clear: false });
        const data = i < 3 ? new Uint8Array(420 * 240 * 4) : new Float32Array(420 * 240 * 4);
        gl.readPixels(0, 0, 420, 240, gl.RGBA, i < 3 ? gl.UNSIGNED_BYTE : gl.FLOAT, data);
        return data;
      });
      renderer.renderTarget.bind({ target: renderer.view.renderTarget, clear: false });
      return result;
    };
    const expected = capture(first);
    const targetExpected = snapshotTargets();
    first.painter.flush();
    const repeated = capture(first);
    const targetRepeated = snapshotTargets();
    const targetRepeatDifferences = targetRepeated.map((data, j) =>
      data.reduce((n, v, i) => n + (v !== targetExpected[j]![i] ? 1 : 0), 0),
    );
    const repeatMismatch = repeated.reduce((n, v, i) => n + (v !== expected[i] ? 1 : 0), 0);
    const renderer = Reflect.get(first.painter, 'renderer'),
      gl = renderer.gl as WebGL2RenderingContext;
    const extension = gl.getExtension('WEBGL_lose_context')!;
    const oldTarget = first.painter.geometryTargets!.g0;
    Object.assign(window, {
      actualLeafProbe: first.painter,
      actualLeafExtension: extension,
      actualLeafExpected: expected,
      actualLeafTargets: targetExpected,
      actualLeafSnapshotTargets: snapshotTargets,
      actualLeafCapture: () => capture(first),
      actualLeafOldTarget: oldTarget,
      actualLeafSecond: second,
      actualLeafRender: render,
      actualLeafDrift: drift,
    });
    let difference = 0;
    for (let i = 0; i < initial.length; i++) difference += Math.abs(initial[i]! - bright[i]!);
    return {
      counts,
      repeatMismatch,
      targetRepeatDifferences,
      retained,
      resized,
      unchanged: before === JSON.stringify(leaves),
      covered: initial.filter((v, i) => i % 4 === 3 && v > 0).length,
      difference,
      error: gl.getError(),
    };
  });
  expect(errors).toEqual([]);
  expect(result.error).toBe(0);
  expect(result.counts).toEqual([500, 500]);
  expect(result.retained).toBe(true);
  expect(result.resized).toBe(true);
  expect(result.unchanged).toBe(true);
  expect(result.covered).toBeGreaterThan(1000);
  expect(result.difference).toBeGreaterThan(1000);
  await page
    .locator('#actual-leaf-probe')
    .screenshot({ path: testInfo.outputPath('actual-instanced-leaf-catalogue.png') });
  await page.evaluate(() => (window as any).actualLeafExtension.loseContext());
  await expect
    .poll(() => page.locator('#actual-leaf-probe').getAttribute('data-context-state'))
    .toBe('lost');
  await page.evaluate(() => (window as any).actualLeafExtension.restoreContext());
  await expect
    .poll(() => page.locator('#actual-leaf-probe').getAttribute('data-context-state'))
    .toBe('ready');
  const restored = await page.evaluate(() => {
    const w = window as any;
    w.actualLeafProbe.flush();
    const actual = w.actualLeafCapture();
    const mismatch = actual.reduce(
      (n: number, v: number, i: number) => n + (v !== w.actualLeafExpected[i] ? 1 : 0),
      0,
    );
    let alphaMismatch = 0,
      maxAlphaDifference = 0,
      displayDifference = 0;
    for (let i = 0; i < actual.length; i += 4) {
      if (actual[i + 3] !== w.actualLeafExpected[i + 3]) alphaMismatch++;
      maxAlphaDifference = Math.max(
        maxAlphaDifference,
        Math.abs(actual[i + 3] - w.actualLeafExpected[i + 3]),
      );
      for (let channel = 0; channel < 3; channel++)
        displayDifference += Math.abs(
          (actual[i + channel] * actual[i + 3]) / 255 -
            (w.actualLeafExpected[i + channel] * w.actualLeafExpected[i + 3]) / 255,
        );
    }
    const meanDisplayDifference = displayDifference / (420 * 240 * 3);
    const actualTargets = w.actualLeafSnapshotTargets();
    const targetDifferences = actualTargets.map((data: any, j: number) =>
      data.reduce(
        (n: number, v: number, i: number) => n + (v !== w.actualLeafTargets[j][i] ? 1 : 0),
        0,
      ),
    );
    const replaced = w.actualLeafOldTarget.source.destroyed;
    w.actualLeafProbe.dispose();
    const independent = w.actualLeafRender(w.actualLeafSecond, 0.7);
    const covered = independent.filter((v: number, i: number) => i % 4 === 3 && v > 0).length;
    const gl = Reflect.get(w.actualLeafSecond.painter, 'renderer').gl as WebGL2RenderingContext;
    const error = gl.getError();
    w.actualLeafSecond.painter.dispose();
    w.actualLeafDrift.dispose();
    return {
      mismatch,
      replaced,
      covered,
      error,
      alphaMismatch,
      maxAlphaDifference,
      meanDisplayDifference,
      targetDifferences,
    };
  });
  // Native display rounding can differ by one colour byte even before context loss.
  // Encoded geometry, HDR radiance and coverage remain exact; displayed RGB uses
  // the same scene tolerance as the preserved renderer comparison fixtures.
  expect(result.targetRepeatDifferences).toEqual([0, 0, 0, 0, 0]);
  expect(restored.targetDifferences).toEqual([0, 0, 0, 0, 0]);
  await testInfo.attach('native-leaf-restoration', {
    body: JSON.stringify({ result, restored }),
    contentType: 'application/json',
  });
  expect(restored.alphaMismatch, JSON.stringify(restored)).toBe(0);
  expect(restored.meanDisplayDifference).toBeLessThan(9);
  expect(restored.replaced).toBe(true);
  expect(restored.covered).toBeGreaterThan(1000);
  expect(restored.error).toBe(0);
  expect(errors).toEqual([]);
});

test('folded leaf backs stay visible without geometry writes and preserve scoped native clipping', async ({
  page,
}) => {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { drawInstancedLeaves } = await import('/src/rendering/scene-leaves.ts');
    const { createLeafMotion } = await import('/src/rendering/scene/leaf-motion.ts');
    const { setSceneLighting } = await import('/src/rendering/scene-material.ts');
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
    canvas.width = 120;
    canvas.height = 80;
    const painter = await createPixiScenePainter(canvas),
      renderer = Reflect.get(painter, 'renderer'),
      gl = renderer.gl as WebGL2RenderingContext;
    const motion = createLeafMotion();
    const leaves = [0, Math.PI].map((fl, i) => ({
      sprite: 'leaves.willow',
      x: 30 + i * 50,
      y: 30,
      z: 0.8,
      s: 10,
      rot: 0,
      vr: 0,
      fl,
      vf: 0,
      flutter: 1,
      vy: 0,
      ph: 0,
      col: '#fff',
    }));
    leaves.forEach((leaf) => motion.register(leaf));
    const atlases = [
      {
        id: 'leaves',
        width: 64,
        height: 32,
        texture: texture('#808080'),
        material: {
          normal: texture('rgb(200,128,240)'),
          surface: texture('rgb(217,0,255)'),
          lighting: 1,
          depth: 0,
          fog: 0,
          fogColor: [0, 0, 0],
          normalY: 1,
        },
      },
    ];
    const frame = {
      leaves,
      motion,
      atlases,
      front: false,
      spriteMotion: true,
      scale: 1,
      width: 120,
      height: 80,
    };
    const render = (clip: boolean) => {
      painter.begin();
      setSceneLighting(painter, {
        ambient: [0.15, 0.15, 0.15],
        directional: [0.8, 0.8, 0.8],
        direction: [0.8, 0, 1],
        points: [],
      });
      if (clip) {
        painter.save();
        painter.beginPath();
        painter.rect(0, 0, 55, 80);
        painter.clip();
      }
      drawInstancedLeaves(painter, frame);
      if (clip) painter.restore();
      painter.flush();
      const copy = document.createElement('canvas');
      copy.width = 120;
      copy.height = 80;
      const g = copy.getContext('2d')!;
      g.drawImage(canvas, 0, 0);
      const colours = [30, 80].map((x) => [...g.getImageData(x, 30, 1, 1).data]);
      const read = (target: any, x: number) => {
        renderer.renderTarget.bind({ target, clear: false });
        const pixel = new Uint8Array(4);
        gl.readPixels(x, 30, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
        return [...pixel];
      };
      const targets = painter.geometryTargets!;
      return {
        colours,
        normals: [30, 80].map((x) => read(targets.g0, x)),
        flags: [30, 80].map((x) => read(targets.g1, x)[3]),
      };
    };
    const both = render(false),
      clipped = render(true),
      error = gl.getError();
    painter.dispose();
    return { both, clipped, error };
  });
  expect(errors).toEqual([]);
  expect(result.error).toBe(0);
  expect(result.both.normals).toEqual([
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ]);
  expect(result.both.flags).toEqual([0, 0]);
  expect(result.both.colours[0]).toEqual(result.both.colours[1]);
  expect(result.both.colours.map((c) => c[3])).toEqual([229, 229]);
  expect(result.clipped.normals[0]).toEqual(result.both.normals[0]);
  expect(result.clipped.normals[1]).toEqual([0, 0, 0, 0]);
  expect(result.clipped.colours[0]).toEqual(result.both.colours[0]);
  expect(result.clipped.colours[1]).toEqual([0, 0, 0, 0]);
});
