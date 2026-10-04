import { expect, test } from '@playwright/test';

test('Glitch preserves pixels, fractional transforms, transparency and accessibility preferences', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const failures = await page.evaluate(async () => {
    const originalPath = '/tests/fixtures/film-glitch-reference.ts';
    const { applyFilm: original } = await import(originalPath);
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const failures = [];
    for (const [w, h] of [
      [390, 844],
      [844, 390],
      [333, 197],
    ])
      for (const dpr of [1, 1.25, 2])
        for (const shifted of [false, true])
          for (const transparent of [false, true])
            for (const preferences of [{}, { reducedMotion: true }, { reducedFlashes: true }]) {
              const canvases = [document.createElement('canvas'), document.createElement('canvas')];
              for (const [i, canvas] of canvases.entries()) {
                canvas.width = Math.round(w * dpr);
                canvas.height = Math.round(h * dpr);
                const g = canvas.getContext('2d')!;
                g.scale(dpr, dpr);
                g.fillStyle = transparent ? 'rgba(40,100,190,.45)' : 'rgb(40,100,190)';
                g.fillRect(0, 0, w, h);
                for (let j = 0; j < 90; j++) {
                  g.fillStyle = `rgba(${(j * 47) % 255},${(j * 91) % 255},${(j * 13) % 255},.7)`;
                  g.fillRect((j * 41) % w, (j * 53) % h, 43, 67);
                }
                g.globalAlpha = transparent ? 0.7 : 1;
                if (shifted) g.translate(0.3, 0.5);
                (i ? applyFilm : original)(g, w, h, canvas, 'trial-glitch', 1.23, preferences);
              }
              if (canvases[0].toDataURL() !== canvases[1].toDataURL())
                failures.push({ w, h, dpr, shifted, transparent, preferences });
            }
    return failures;
  });
  expect(failures).toEqual([]);
});

test('Glitch reuses native-sized copies and releases backing storage when switching film', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 780;
    canvas.height = 1688;
    const g = canvas.getContext('2d')!;
    g.scale(2, 2);
    g.fillStyle = '#987';
    g.fillRect(0, 0, 390, 844);
    const create = document.createElement.bind(document),
      copies: HTMLCanvasElement[] = [];
    document.createElement = ((...args: Parameters<typeof create>) => {
      const element = create(...args);
      if (args[0] === 'canvas') copies.push(element as HTMLCanvasElement);
      return element;
    }) as typeof document.createElement;
    try {
      for (let i = 0; i < 5; i++) applyFilm(g, 390, 844, canvas, 'trial-glitch', i);
      const allocated = copies.map((c) => [c.width, c.height]);
      applyFilm(g, 390, 844, canvas, 'mono');
      return { allocated, released: copies.every((c) => c.width === 0 && c.height === 0) };
    } finally {
      document.createElement = create;
    }
  });
  expect(result).toEqual({ allocated: [[780, 1688]], released: true });
});
