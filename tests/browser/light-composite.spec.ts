import { writeFile } from 'node:fs/promises';
import { expect, test } from '@playwright/test';

test('lookup composite matches preserved forward PBR references within existing scene tolerance', async ({
  page,
}, testInfo) => {
  await page.route('**/favicon.ico', (route) => route.fulfill({ status: 204 }));
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error' || message.text().includes('GL_INVALID'))
      errors.push(message.text());
  });
  const results = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { createPbrAtlas } = await import('/src/rendering/pbr-atlas.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const studies = [
      { name: 'foreground-boulders-atlas', frame: [0, 0, 887, 443], width: 170, height: 85 },
      { name: 'player-ronin-simple', frame: [45, 54, 382, 358], width: 100, height: 94 },
      { name: 'blade-profile-atlas', frame: [152, 111, 955, 92], width: 165, height: 16 },
    ];
    const atlases = await Promise.all(
      studies.map(async (study) => {
        const pack = assetMaterialCatalog.find((pack) =>
          pack.sourcePath.endsWith(`/${study.name}.png`),
        )!;
        const atlas = createPbrAtlas(document, pack.maps, ...pack.dimensions);
        if (!(await atlas.prepare())) throw new Error(`Missing PBR ${study.name}`);
        return atlas;
      }),
    );
    const canvas = document.createElement('canvas');
    canvas.width = 600;
    canvas.height = 280;
    const painter = await createPixiScenePainter(canvas),
      copy = document.createElement('canvas');
    copy.width = 600;
    copy.height = 280;
    const read = copy.getContext('2d')!,
      results = [];
    document.body.replaceChildren();
    document.body.style.cssText = 'margin:0;padding:0;max-width:none;background:#151515';
    const capture = (mode: string, scenario: number) => {
      painter.begin();
      setSceneLighting(painter, {
        materialLighting: scenario === 3 ? 0 : 1,
        ambient: [0.55, 0.55, 0.55],
        directional: [0.25, 0.25, 0.25],
        direction: [-0.4, -0.5, 1],
        points: [
          {
            x: scenario % 2 ? 530 : 70,
            y: 60,
            z: 250,
            radius: 800,
            intensity: 1.5,
            color: scenario % 2 ? [0.6, 0.8, 1] : [1, 0.9, 0.7],
          },
        ],
      });
      for (let index = 0; index < studies.length; index++)
        for (let row = 0; row < 2; row++) {
          const study = studies[index]!,
            atlas = atlases[index]!,
            material = atlas.material(study.frame as [number, number, number, number])!;
          painter.save();
          painter.translate(index * 200 + 100, row * 130 + 75);
          painter.rotate(row ? 0.12 : -0.08);
          painter.scale(row ? -1 : 1, row ? 0.85 : 1.1);
          painter.globalAlpha = row ? 0.7 : 1;
          drawMaterialStamp(painter, {
            texture: {
              source: atlas.diffuse!,
              revision: 0,
              frame: study.frame as [number, number, number, number],
            },
            material: { ...material, fog: row ? 0.35 : 0, depth: row ? 20 : 0 },
            x: -study.width / 2,
            y: -study.height / 2,
            width: study.width,
            height: study.height,
          });
          painter.restore();
        }
      if (scenario === 2) applyFilm(painter, 600, 280, canvas, 'noir', 1, {});
      painter.flush();
      read.clearRect(0, 0, 600, 280);
      read.drawImage(canvas, 0, 0);
      const pixels = read.getImageData(0, 0, 600, 280).data;
      const snapshot = document.createElement('canvas');
      snapshot.width = 600;
      snapshot.height = 280;
      snapshot.getContext('2d')!.drawImage(copy, 0, 0);
      snapshot.dataset.comparison = `${mode}-${scenario}`;
      document.body.append(snapshot);
      return pixels;
    };
    for (let scenario = 0; scenario < 4; scenario++) {
      const image = new Image();
      image.src = `/tests/browser/fixtures/lighting-forward/scenario-${scenario}.png`;
      await image.decode();
      read.clearRect(0, 0, 600, 280);
      read.drawImage(image, 0, 0);
      const old = read.getImageData(0, 0, 600, 280).data;
      const next = capture('lookup', scenario);
      let difference = 0,
        coverageMismatch = 0,
        covered = 0;
      for (let i = 0; i < old.length; i += 4) {
        if (old[i + 3] !== next[i + 3]) coverageMismatch++;
        if (old[i + 3]! > 127) covered++;
        // Compare displayed contribution over black, so thin edges use their actual coverage.
        for (let channel = 0; channel < 3; channel++)
          difference += Math.abs(
            (old[i + channel]! * old[i + 3]!) / 255 - (next[i + channel]! * next[i + 3]!) / 255,
          );
      }
      results.push({
        scenario,
        meanDifference: difference / (600 * 280 * 3),
        coverageMismatch,
        covered,
      });
    }
    painter.dispose();
    for (const atlas of atlases) atlas.dispose();
    return results;
  });
  await writeFile(testInfo.outputPath('comparison-metrics.json'), JSON.stringify(results, null, 2));
  await testInfo.attach('comparison-metrics', {
    body: JSON.stringify(results, null, 2),
    contentType: 'application/json',
  });
  expect(errors).toEqual([]);
  for (const result of results) {
    expect(result.covered).toBeGreaterThan(1000);
    expect(result.coverageMismatch).toBe(0);
    expect(result.meanDifference, JSON.stringify(result)).toBeLessThan(9);
  }
  await page
    .locator('[data-comparison="lookup-0"]')
    .screenshot({ path: testInfo.outputPath('lookup-studies.png') });
});
