import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('animated WebGL graphics keep shared listeners bounded across peers, resize and restoration', async ({
  page,
}, info) => {
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
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const { Texture } = await import('/tests/browser/fixtures/pixi-resources.ts');
    const counts = () => [
      Texture.EMPTY.source.listenerCount('change'),
      Texture.EMPTY.source.style.listenerCount('change'),
      Texture.WHITE.source.listenerCount('change'),
    ];
    const baseline = counts();
    const canvases = [0, 1].map(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 96;
      canvas.height = 64;
      return canvas;
    });
    const painters = await Promise.all(canvases.map(createPixiScenePainter));
    const draw = (index: number, frame: number) => {
      const painter = painters[index]!,
        canvas = canvases[index]!;
      painter.begin();
      painter.fillStyle = '#7d6b5f';
      painter.fillRect(0, 0, canvas.width, canvas.height);
      applyFilm(painter, canvas.width, canvas.height, canvas, 'trial-inferno', 1.25 + frame / 60);
      painter.flush();
    };
    const pixels = (index: number) => {
      const canvas = canvases[index]!,
        copy = document.createElement('canvas');
      copy.width = canvas.width;
      copy.height = canvas.height;
      const read = copy.getContext('2d', { willReadFrequently: true })!;
      read.drawImage(canvas, 0, 0);
      return [...read.getImageData(0, 0, copy.width, copy.height).data];
    };
    const rows: number[][] = [];
    for (let frame = 0; frame < 120; frame++) {
      if (frame === 40 || frame === 80) canvases.forEach((canvas) => canvas.width++);
      draw(0, frame);
      draw(1, frame);
      if ([0, 39, 40, 79, 80, 119].includes(frame)) rows.push(counts());
      await new Promise(requestAnimationFrame);
    }
    draw(0, 119);
    const beforeRestore = pixels(0);
    const canvas = canvases[0]!,
      gl = canvas.getContext('webgl2')!;
    const extension = gl.getExtension('WEBGL_lose_context')!;
    const lost = new Promise<void>((resolve) =>
      canvas.addEventListener('webglcontextlost', () => resolve(), { once: true }),
    );
    extension.loseContext();
    await lost;
    // Restoration must be requested after the loss event has finished dispatching.
    await new Promise((resolve) => setTimeout(resolve, 100));
    const restored = new Promise<void>((resolve) =>
      canvas.addEventListener('webglcontextrestored', () => resolve(), { once: true }),
    );
    extension.restoreContext();
    await restored;
    draw(0, 119);
    const afterRestore = pixels(0);
    rows.push(counts());
    for (let frame = 120; frame < 160; frame++) draw(0, frame);
    rows.push(counts());
    draw(1, 119);
    const peerBefore = pixels(1);
    painters[0]!.dispose();
    for (let frame = 120; frame < 160; frame++) draw(1, frame);
    draw(1, 119);
    const peerAfter = pixels(1);
    rows.push(counts());
    const glError = canvases[1]!.getContext('webgl2')!.getError();
    painters[1]!.dispose();
    return {
      baseline,
      rows,
      disposed: counts(),
      glError,
      restoredSame: beforeRestore.every((value, index) => value === afterRestore[index]),
      peerSame: peerBefore.every((value, index) => value === peerAfter[index]),
    };
  });
  await writeFile(info.outputPath('graphics-lifetime.json'), JSON.stringify(result, null, 2));
  expect(result.restoredSame).toBe(true);
  expect(result.peerSame).toBe(true);
  expect(result.glError).toBe(0);
  for (const row of result.rows)
    row.forEach((count, index) => expect(count - result.baseline[index]!).toBeLessThanOrEqual(32));
  expect(result.disposed).toEqual(result.baseline);
  expect(errors).toEqual([]);
});
