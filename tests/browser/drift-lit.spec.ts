import { test, expect } from '@playwright/test';

test('merged drift is lit over geometry and sky, emissive in darkness, mipmapped and single-pass at DPR3', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const rows = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { createLeafMotion } = await import('/src/rendering/scene/leaf-motion.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const { DRIFT_SPRITES } = await import('/src/rendering/scene/drift-catalog.ts');
    const map = (colour: string) => {
      const source = document.createElement('canvas');
      source.width = source.height = 1;
      const g = source.getContext('2d')!;
      g.fillStyle = colour;
      g.fillRect(0, 0, 1, 1);
      return { source, revision: 0 };
    };
    const rows = [];
    for (const scenario of [
      { id: 'daylight', ambient: 0.65, family: 'leaves', size: 12 },
      { id: 'lantern', ambient: 0.03, family: 'petals', size: 12 },
      { id: 'fire', ambient: 0, family: 'fire', size: 12 },
      { id: 'gust', ambient: 0.4, family: 'leaves', size: 30 },
    ]) {
      const canvas = document.createElement('canvas');
      canvas.width = 1170;
      canvas.height = 900;
      canvas.id = scenario.id;
      canvas.style.width = '390px';
      canvas.style.height = '300px';
      document.body.append(canvas);
      const g = await createPixiScenePainter(canvas),
        drift = createDriftRenderer(document, () => g);
      await drift.prepare();
      const gl = canvas.getContext('webgl2')!,
        nativeDraw = gl.drawElementsInstanced.bind(gl);
      let draws = 0;
      gl.drawElementsInstanced = (...args) => {
        draws++;
        nativeDraw(...args);
      };
      const motion = createLeafMotion();
      const leaves = DRIFT_SPRITES.filter((sprite) => sprite.atlas === scenario.family).map(
        (sprite, i) => ({
          sprite: sprite.id,
          x: 50 + (i % 4) * 95,
          y: i < 4 ? 75 : 220,
          z: 1,
          s: scenario.size,
          rot: i * 0.25,
          vr: 0,
          fl: i % 2 ? Math.PI : 0,
          vf: 0,
          vy: 0,
          ph: 0,
          col: '#fff',
          flutter: 1,
        }),
      );
      leaves.forEach((leaf) => motion.register(leaf));
      g.begin();
      g.setTransform(3, 0, 0, 3, 0, 0);
      setSceneLighting(g, {
        ambient: [scenario.ambient, scenario.ambient, scenario.ambient],
        directional: [0.2, 0.2, 0.2],
        direction: [0, 0, 1],
        points:
          scenario.id === 'lantern'
            ? [{ x: 580, y: 660, z: 50, radius: 450, intensity: 2, color: [1, 0.7, 0.3] }]
            : [],
      });
      g.fillStyle = '#171513';
      g.fillRect(0, 0, 390, 300);
      drawMaterialStamp(g, {
        texture: map('#6e6559'),
        material: {
          normal: map('rgb(128,128,255)'),
          surface: map('rgb(255,0,255)'),
          lighting: 1,
          depth: 0,
          fog: 0,
          fogColor: [0, 0, 0],
        },
        x: 0,
        y: 150,
        width: 390,
        height: 150,
      });
      drift.drawLeaves(g, {
        leaves,
        front: false,
        motion,
        spriteMotion: true,
        scale: 1,
        width: 390,
        height: 300,
      });
      g.flush();
      const renderer = Reflect.get(g, 'renderer'),
        slots = Reflect.get(g, 'slots');
      const leaf = slots.find((slot: any) => slot.leaf).leaf;
      const source = leaf.mesh.shader.resources.uDiffuse;
      renderer.renderTarget.bind({ target: g.geometryTargets!.g0, clear: false });
      const sky = new Uint8Array(4);
      gl.readPixels(150, 225, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, sky);
      renderer.renderTarget.bind({ target: renderer.view.renderTarget, clear: false });
      const copy = document.createElement('canvas');
      copy.width = 1170;
      copy.height = 900;
      const ctx = copy.getContext('2d')!;
      ctx.drawImage(canvas, 0, 0);
      const pixels = ctx.getImageData(0, 0, 1170, 450).data;
      let bright = 0;
      for (let i = 0; i < pixels.length; i += 4)
        if (Math.max(pixels[i]!, pixels[i + 1]!, pixels[i + 2]!) > 35) bright++;
      rows.push({
        scenario: scenario.id,
        draws,
        skyAlpha: sky[3],
        bright,
        mipmaps: source.autoGenerateMipmaps,
        filter: source.style.mipmapFilter,
        error: gl.getError(),
      });
      // Preserve screenshot pixels while releasing native ownership.
      const image = document.createElement('img');
      image.id = scenario.id + '-capture';
      image.src = canvas.toDataURL();
      image.width = 1170;
      image.height = 900;
      document.body.append(image);
      drift.dispose();
      g.dispose();
      canvas.remove();
    }
    return rows;
  });
  for (const row of rows) {
    expect(row.draws).toBe(1);
    expect(row.skyAlpha).toBe(0);
    expect(row.mipmaps).toBe(true);
    expect(row.filter).toBe('linear');
    expect(row.error).toBe(0);
    expect(row.bright).toBeGreaterThan(100);
    await page
      .locator('#' + row.scenario + '-capture')
      .screenshot({ path: testInfo.outputPath(row.scenario + '-DPR3.png') });
  }
  expect(errors).toEqual([]);
});
