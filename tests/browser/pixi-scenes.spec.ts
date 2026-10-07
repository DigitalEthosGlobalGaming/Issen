import { expect, test } from '@playwright/test';

for (const [width, height] of [
  [280, 180],
  [180, 320],
]) {
  test(`all nine native environments repeat native composition across isolated surfaces at ${width}x${height}`, async ({
    page,
  }, info) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'warning' && message.text().includes('PixiJS'))
        errors.push(message.text());
    });
    await page.goto('/privacy/index.html');
    const results = await page.evaluate(
      async ({ width, height }) => {
        const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
        const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
        const environment = createEnvironmentRenderer(document);
        const native = document.createElement('canvas'),
          reference = document.createElement('canvas');
        native.width = reference.width = width;
        native.height = reference.height = height;
        const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
        const painter = await createPixiScenePainter(native),
          canvas = await createTestDrawing(reference);
        document.body.replaceChildren();
        document.body.style.cssText = 'margin:0; background:#ddd; color:#222; font:14px sans-serif';
        const results = [];
        for (let stage = 0; stage < 9; stage++) {
          await environment.prepare(stage);
          const frame = {
            width,
            height,
            dpr: 1,
            time: 3,
            stage,
            stageSeed: 127,
            reducedMotion: true,
            reducedFlashes: true,
            lowQuality: false,
          };
          await environment.compose(frame);
          painter.begin();
          canvas.clearRect(0, 0, width, height);
          if (!environment.draw(painter, frame) || !environment.draw(canvas, frame))
            throw new Error('Missing stage ' + stage);
          environment.drawForeground(painter, frame);
          environment.drawForeground(canvas, frame);
          painter.flush();
          const copy = document.createElement('canvas');
          copy.width = width;
          copy.height = height;
          const read = copy.getContext('2d')!;
          read.drawImage(native, 0, 0);
          const expected = canvas.getImageData(0, 0, width, height).data,
            actual = read.getImageData(0, 0, width, height).data;
          let difference = 0,
            uncovered = 0;
          for (let i = 0; i < actual.length; i += 4) {
            for (let channel = 0; channel < 3; channel++)
              difference += Math.abs(actual[i + channel]! - expected[i + channel]!);
            if (actual[i + 3]! < 250 && expected[i + 3]! >= 250) uncovered++;
          }
          results.push({ stage, meanDifference: difference / (width * height * 3), uncovered });
          const heading = document.createElement('p');
          heading.textContent = `Stage ${stage + 1} — Native / repeated frame`;
          document.body.append(heading);
          const row = document.createElement('div');
          row.style.display = 'flex';
          row.append(copy);
          const ref = document.createElement('canvas');
          ref.width = width;
          ref.height = height;
          ref.getContext('2d')!.drawImage(reference, 0, 0);
          row.append(ref);
          document.body.append(row);
        }
        canvas.dispose();
        painter.dispose();
        environment.dispose();
        return results;
      },
      { width: width!, height: height! },
    );
    await page.setViewportSize({ width: width! * 2, height: 800 });
    await page.screenshot({ path: info.outputPath('stage-repeat-draw.png'), fullPage: true });
    expect(errors).toEqual([]);
    for (const result of results) {
      expect(result.meanDifference, JSON.stringify(result)).toBeLessThan(9);
      expect(result.uncovered, JSON.stringify(result)).toBeLessThan(20);
    }
  });
}

test('authored rock, cloth and steel materials support moving lights, fog and unlit fallback', async ({
  page,
}, info) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'warning' && message.text().includes('PixiJS'))
      errors.push(message.text());
  });
  const result = await page.evaluate(async () => {
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { createSurfaceMapLibrary } = await import('/src/rendering/surface-maps.ts');
    const { drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const studies = [
      {
        profile: 'rock' as const,
        src: '/src/rendering/environment/assets/foreground-boulders-atlas.webp',
        frame: [0, 0, 887, 443] as const,
        width: 210,
        height: 105,
      },
      {
        profile: 'cloth' as const,
        src: '/src/rendering/figures/assets/player-ronin-simple.webp',
        frame: [45, 54, 382, 358] as const,
        width: 128,
        height: 120,
      },
      {
        profile: 'steel' as const,
        src: '/src/rendering/figures/assets/blade-profile-atlas.png',
        frame: [152, 111, 955, 92] as const,
        width: 230,
        height: 23,
      },
    ];
    const images = await Promise.all(
      studies.map(async (study) => {
        const image = new Image();
        image.src = study.src;
        await image.decode();
        return image;
      }),
    );
    const canvas = document.createElement('canvas');
    canvas.width = 960;
    canvas.height = 450;
    const painter = await createPixiScenePainter(canvas),
      maps = createSurfaceMapLibrary(document);
    painter.begin();
    painter.fillStyle = '#ddd6c8';
    painter.fillRect(0, 0, 960, 450);
    for (let row = 0; row < studies.length; row++)
      for (let column = 0; column < 4; column++) {
        const study = studies[row]!,
          x = column * 240 + 120,
          y = row * 150 + 84;
        painter.font = '13px sans-serif';
        painter.fillStyle = '#222';
        painter.fillText(
          `${study.profile}: ${['unlit', 'left light', 'right light', 'depth fog'][column]}`,
          column * 240 + 10,
          row * 150 + 20,
        );
        setSceneLighting(painter, {
          ambient: [0.78, 0.78, 0.78],
          directional: [0, 0, 0],
          direction: [0, 0, 1],
          points: [
            {
              x: x + (column === 2 ? 95 : -95),
              y: y - 45,
              z: 70,
              radius: 300,
              intensity: 0.7,
              color: [1, 0.94, 0.85],
            },
          ],
        });
        painter.save();
        painter.translate(x, y);
        drawMaterialStamp(painter, {
          texture: { source: images[row]!, revision: 0, frame: study.frame },
          material: {
            ...maps.get(study.profile),
            lighting: column ? 1 : 0,
            depth: column === 3 ? 130 : 0,
            fog: column === 3 ? 0.4 : 0,
          },
          x: -study.width / 2,
          y: -study.height / 2,
          width: study.width,
          height: study.height,
        });
        painter.restore();
      }
    painter.flush();
    const copy = document.createElement('canvas');
    copy.width = canvas.width;
    copy.height = canvas.height;
    const read = copy.getContext('2d')!;
    read.drawImage(canvas, 0, 0);
    const pixels = read.getImageData(0, 0, 960, 450).data;
    const changes = studies.map((study, row) => {
      let difference = 0;
      for (let y = row * 150 + 30; y < (row + 1) * 150; y++)
        for (let x = 0; x < 240; x++) {
          const left = (y * 960 + 240 + x) * 4,
            right = (y * 960 + 480 + x) * 4;
          difference += Math.abs(pixels[left]! - pixels[right]!);
        }
      return { profile: study.profile, difference };
    });
    painter.dispose();
    maps.dispose();
    document.body.replaceChildren(copy);
    document.body.style.cssText = 'margin:0; padding:0; max-width:none';
    return changes;
  });
  await page.setViewportSize({ width: 960, height: 450 });
  await page.screenshot({ path: info.outputPath('material-studies.png') });
  expect(errors).toEqual([]);
  for (const study of result) expect(study.difference, study.profile).toBeGreaterThan(100);
});
