import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('quantised normal cutouts preserve mirrored/slope lighting, alpha, clipping and cache lifetime', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (/feedback loop/i.test(message.text())) errors.push(message.text());
  });
  const results = await page.evaluate(async () => {
    const { createCachedMaterials, cachedMaterialContext, drawCachedImage, getCachedMaterial } =
      await import('/src/rendering/cached-materials.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { setSceneLighting } = await import('/src/rendering/scene-material.ts');
    const canvas = (size: number) => {
      const c = document.createElement('canvas');
      c.width = c.height = size;
      return c;
    };
    const colour = canvas(32),
      normal = canvas(32),
      surface = canvas(32);
    const ink = colour.getContext('2d')!;
    ink.fillStyle = '#706054';
    ink.beginPath();
    ink.ellipse(16, 16, 15, 13, 0, 0, Math.PI * 2);
    ink.fill();
    const n = normal.getContext('2d')!;
    n.fillStyle = 'rgb(190,110,235)';
    n.fillRect(0, 0, 32, 32);
    const s = surface.getContext('2d')!;
    s.fillStyle = 'rgb(220,0,255)';
    s.fillRect(0, 0, 32, 32);
    const images = await Promise.all(
      [0, 1].map(async () => {
        const image = document.createElement('img');
        image.src = colour.toDataURL();
        await image.decode();
        return image;
      }),
    );
    const owners = [createCachedMaterials({ normalAngleStep: 0 }), createCachedMaterials()];
    owners.forEach((owner, i) =>
      owner.bind(images[i], (frame) => ({
        normal: { source: normal, revision: 0, frame },
        surface: { source: surface, revision: 0, frame },
        normalY: -1,
        lighting: 1,
        depth: 0,
        fog: 0.12,
        fogColor: [0.4, 0.35, 0.3],
      })),
    );
    const output = canvas(96),
      painter = await createPixiScenePainter(output),
      copy = canvas(96);
    const read = copy.getContext('2d', { willReadFrequently: true })!;
    const capture = (source: HTMLCanvasElement) => {
      read.clearRect(0, 0, 96, 96);
      read.drawImage(source, 0, 0);
      return read.getImageData(0, 0, 96, 96).data;
    };
    const diff = (a: Uint8ClampedArray, b: Uint8ClampedArray) => {
      let sum = 0,
        max = 0,
        alphaMax = 0;
      for (let i = 0; i < a.length; i++) {
        const d = Math.abs(a[i] - b[i]);
        sum += d;
        max = Math.max(max, d);
        if (i % 4 === 3) alphaMax = Math.max(alphaMax, d);
      }
      return { mean: sum / a.length, max, alphaMax };
    };
    const rows = [];
    const proof = canvas(96),
      normalProof = canvas(96);
    for (const grid of [proof, normalProof]) {
      grid.width = 192;
      grid.height = 960;
    }
    for (const angle of [0, 0.9, 8.9, -10.3, 179.2])
      for (const mirror of [false, true]) {
        const layers = owners.map((owner, i) => {
          const layer = canvas(96),
            g = cachedMaterialContext(layer.getContext('2d')!);
          g.save();
          g.beginPath();
          g.rect(4, 4, 88, 88);
          g.clip();
          g.translate(48, 48);
          g.rotate((angle * Math.PI) / 180);
          g.scale(mirror ? -1.2 : 1.2, 0.9);
          drawCachedImage(g, images[i], [0, 0, 32, 32], -16, -16, 32, 32);
          g.restore();
          return layer;
        });
        const maps = ['normal', 'surface', 'emissive'].map((kind) => {
          const a = (getCachedMaterial(layers[0]) as any)[kind].source as HTMLCanvasElement;
          const b = (getCachedMaterial(layers[1]) as any)[kind].source as HTMLCanvasElement;
          if (kind === 'normal') {
            normalProof.getContext('2d')!.drawImage(a, 0, rows.length * 96);
            normalProof.getContext('2d')!.drawImage(b, 96, rows.length * 96);
          }
          return { kind, ...diff(capture(a), capture(b)) };
        });
        const lit = layers.map((layer, i) => {
          painter.begin();
          setSceneLighting(painter, {
            ambient: [0.2, 0.2, 0.2],
            directional: [0.65, 0.6, 0.55],
            direction: [0.4, 0.35, 1],
            points: [],
          });
          drawCachedImage(painter, layer, [0, 0, 96, 96], 0, 0, 96, 96);
          painter.flush();
          proof.getContext('2d')!.drawImage(output, i * 96, rows.length * 96);
          return capture(output);
        });
        rows.push({
          angle,
          mirror,
          colour: diff(capture(layers[0]), capture(layers[1])),
          maps,
          lit: diff(lit[0], lit[1]),
        });
      }
    const before = owners[1].snapshot();
    const layer = canvas(96),
      g = cachedMaterialContext(layer.getContext('2d')!);
    drawCachedImage(g, images[1], [0, 0, 32, 32], 0, 0, 32, 32);
    const first = owners[1].snapshot();
    drawCachedImage(g, images[1], [0, 0, 32, 32], 40, 0, 32, 32);
    const second = owners[1].snapshot();
    drawCachedImage(g, images[1], [0, 0, 32, 32], 10, 40, 32, 32);
    const third = owners[1].snapshot();
    owners.forEach((owner) => owner.dispose());
    painter.dispose();
    return {
      rows,
      before,
      first,
      second,
      third,
      disposed: owners[1].snapshot(),
      proof: proof.toDataURL(),
      normalProof: normalProof.toDataURL(),
    };
  });
  const { proof, normalProof, ...metrics } = results;
  for (const [name, data] of [
    ['lit-parity.png', proof],
    ['normal-parity.png', normalProof],
  ]) {
    const path = testInfo.outputPath(name);
    await writeFile(path, Buffer.from(data.split(',')[1], 'base64'));
    await testInfo.attach(name, { path, contentType: 'image/png' });
  }
  const metricsPath = testInfo.outputPath('cutout-parity.json');
  await writeFile(metricsPath, JSON.stringify(metrics, null, 2));
  await testInfo.attach('cutout-parity', { path: metricsPath, contentType: 'application/json' });
  for (const row of results.rows) {
    expect(row.colour.max).toBe(0);
    for (const map of row.maps) {
      expect(map.alphaMax).toBe(0);
      if (map.kind === 'normal') expect(map.mean).toBeLessThan(0.5);
      else expect(map.max).toBe(0);
    }
    expect(row.lit.mean).toBeLessThan(0.1);
    expect(row.lit.max).toBeLessThanOrEqual(2);
    expect(row.lit.alphaMax).toBe(0);
  }
  expect(results.third.hits - results.second.hits).toBe(3);
  expect(results.third.misses).toBe(results.second.misses);
  expect(results.second.pixels).toBeLessThanOrEqual(results.second.pixelBudget);
  expect(results.disposed.entries).toBe(0);
  expect(results.disposed.pixels).toBe(0);
  expect(results.disposed.scratchPixels).toBe(0);
  expect(errors).toEqual([]);
});
