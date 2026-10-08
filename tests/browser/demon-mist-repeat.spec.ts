import { expect, test } from '@playwright/test';

test('native Demon mist repeats exact pixels in both orientations and at capped DPR', async ({
  page,
}, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.text().includes('PixiJS Warning') || message.text().includes('GL_INVALID'))
      errors.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const results = await page.evaluate(async () => {
    const { createDemonRealmRenderer } = await import('/src/rendering/environment/demon-realm.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const scene = createDemonRealmRenderer(document);
    if (!(await scene.prepare())) throw new Error('Demon scenery unavailable');
    const results = [];
    for (const [width, height] of [
      [844, 390],
      [390, 844],
    ]) {
      for (const dpr of [1, 2]) {
        const canvas = document.createElement('canvas');
        canvas.width = width! * dpr;
        canvas.height = height! * dpr;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        const painter = await createPixiScenePainter(canvas);
        const copy = document.createElement('canvas');
        copy.width = canvas.width;
        copy.height = canvas.height;
        const read = copy.getContext('2d')!;
        const draw = (seed: number) => {
          painter.begin();
          painter.scale(dpr, dpr);
          scene.draw(painter, width!, height!, 0, true, seed);
          painter.flush();
          read.clearRect(0, 0, copy.width, copy.height);
          read.drawImage(canvas, 0, 0);
          return read.getImageData(0, 0, copy.width, copy.height).data;
        };
        const first = draw(123),
          repeat = draw(123),
          different = draw(456);
        let repeatChanges = 0,
          seedChanges = 0;
        for (let i = 0; i < first.length; i++) {
          if (first[i] !== repeat[i]) repeatChanges++;
          if (first[i] !== different[i]) seedChanges++;
        }
        const glError = Reflect.get(painter, 'renderer').gl.getError();
        results.push({ width, height, dpr, repeatChanges, seedChanges, glError });
        if (dpr === 1 && width === 844) {
          copy.id = 'demon-mist-probe';
          document.body.append(copy);
        }
        painter.dispose();
      }
    }
    scene.dispose();
    return results;
  });
  expect(errors).toEqual([]);
  for (const result of results) {
    expect(result.repeatChanges, JSON.stringify(result)).toBe(0);
    expect(result.seedChanges, JSON.stringify(result)).toBeGreaterThan(0);
    expect(result.glError, JSON.stringify(result)).toBe(0);
  }
  await page
    .locator('#demon-mist-probe')
    .screenshot({ path: testInfo.outputPath('demon-mist-repeat.png') });
});
