import { expect, test } from '@playwright/test';

test('Broken signal preserves scene regions on high-density canvases', async ({ page }) => {
  await page.goto('/');
  const samples = await page.evaluate(async () => {
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    return [1, 1.5, 2].map((dpr) => {
      const canvas = document.createElement('canvas');
      canvas.width = 400 * dpr;
      canvas.height = 400 * dpr;
      const g = canvas.getContext('2d')!;
      g.scale(dpr, dpr);
      for (let row = 0; row < 2; row++) {
        for (let col = 0; col < 2; col++) {
          g.fillStyle = row === col ? '#eeeeee' : '#111111';
          g.fillRect(col * 200, row * 200, 200, 200);
        }
      }
      applyFilm(g, 400, 400, canvas, 'trial-glitch', 1.2);
      return [
        [100, 100],
        [300, 100],
        [100, 300],
        [300, 300],
      ].map(([x, y]) => {
        const p = g.getImageData(x * dpr, y * dpr, 1, 1).data;
        return (p[0] + p[1] + p[2]) / 3;
      });
    });
  });
  for (const [topLeft, topRight, bottomLeft, bottomRight] of samples) {
    expect(topLeft).toBeGreaterThan(180);
    expect(topRight).toBeLessThan(70);
    expect(bottomLeft).toBeLessThan(70);
    expect(bottomRight).toBeGreaterThan(180);
  }
});

test('Broken signal moves with explicit time and preserves its source and canvas state', async ({
  page,
}) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const source = document.createElement('canvas');
    source.width = 390;
    source.height = 240;
    const original = source.getContext('2d')!;
    original.fillStyle = '#777';
    original.fillRect(0, 0, 390, 240);
    for (let x = 0; x < 390; x += 13) {
      original.fillStyle = x % 2 ? '#fff' : '#111';
      original.fillRect(x, 0, 5, 240);
    }
    const before = source.toDataURL();
    const render = (time: number, film = 'trial-glitch') => {
      const canvas = document.createElement('canvas');
      canvas.width = source.width;
      canvas.height = source.height;
      const g = canvas.getContext('2d')!;
      g.drawImage(source, 0, 0);
      applyFilm(g, 390, 240, canvas, film, time);
      if (g.globalAlpha !== 1 || g.globalCompositeOperation !== 'source-over')
        throw new Error('Canvas state leaked');
      return canvas.toDataURL();
    };
    return {
      animated: render(0) !== render(1),
      deterministic: render(1) === render(1),
      staticGold: render(0, 'trial-gold') === render(1, 'trial-gold'),
      isolated: source.toDataURL() === before,
    };
  });
  expect(result).toEqual({ animated: true, deterministic: true, staticGold: true, isolated: true });
});

test('Endurance films render distinct gold and broken-screen scenes in both orientations', async ({
  page,
}, testInfo) => {
  await page.goto('/');
  const distinct = await page.evaluate(async () => {
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const { createBackground } = await import('/src/rendering/scene/background.ts');
    const sheet = document.createElement('div');
    sheet.style.cssText = 'display:flex;gap:12px;background:#171512;padding:12px;color:white';
    const images = new Set<string>();
    for (const film of ['mono', 'trial-gold', 'trial-glitch']) {
      const column = document.createElement('div');
      column.textContent = film;
      for (const [w, h] of [
        [390, 844],
        [844, 390],
      ]) {
        const { canvas } = createBackground(w, h, 1, 0);
        const g = canvas.getContext('2d')!;
        applyFilm(g, w, h, canvas, film);
        if (g.globalAlpha !== 1 || g.globalCompositeOperation !== 'source-over')
          throw new Error('Film leaked canvas state');
        images.add(canvas.toDataURL());
        canvas.style.cssText = `display:block;width:300px;height:${(h / w) * 300}px`;
        column.append(canvas);
      }
      sheet.append(column);
    }
    document.body.replaceChildren(sheet);
    return images.size;
  });
  expect(distinct).toBe(6);
  await page.setViewportSize({ width: 960, height: 840 });
  await page.screenshot({ path: testInfo.outputPath('trial-films.png') });
});
