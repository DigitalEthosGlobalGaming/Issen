import { expect, test } from '@playwright/test';

test('native films retain Canvas grading and logical scanline sizing across DPRs', async ({
  page,
}, info) => {
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
    const { applyFilm } = await import('/src/rendering/effects/film.ts');
    const films = [
      'mono',
      'trial-inferno',
      'supporter-print',
      'trial-gold',
      'trial-glitch',
      'trial-dusk',
      'trial-dawn',
      'sepia',
      'silver',
      'noir',
      'cyan',
      'nitrate',
      'ukiyo',
      'koda',
    ];
    const native = document.createElement('canvas'),
      reference = document.createElement('canvas'),
      copy = document.createElement('canvas');
    const painter = await createPixiScenePainter(native),
      canvas = reference.getContext('2d')!,
      read = copy.getContext('2d')!;
    const width = 256,
      height = 144,
      results = [];
    document.body.replaceChildren();
    document.body.style.cssText =
      'margin:0;padding:0;max-width:none;background:#ddd; color:#222;font:14px sans-serif';
    for (const dpr of [1, 1.5, 2]) {
      for (const target of [native, reference, copy]) {
        target.width = width * dpr;
        target.height = height * dpr;
      }
      for (const film of films) {
        painter.begin();
        for (const g of [painter, canvas]) {
          g.setTransform(dpr, 0, 0, dpr, 0, 0);
          g.fillStyle = '#7c837d';
          g.fillRect(0, 0, width, height);
          g.fillStyle = '#151b24';
          g.fillRect(0, 0, width / 2, height / 2);
          g.fillStyle = '#d9d1bf';
          g.fillRect(width / 2, height / 2, width / 2, height / 2);
          g.fillStyle = '#9d543a';
          g.fillRect(40, 30, 20, 80);
          g.fillStyle = '#284b65';
          g.fillRect(160, 30, 20, 80);
          applyFilm(g, width, height, g.canvas, film, 1.2, {});
        }
        painter.flush();
        read.clearRect(0, 0, copy.width, copy.height);
        read.drawImage(native, 0, 0);
        const expected = canvas.getImageData(0, 0, reference.width, reference.height).data,
          actual = read.getImageData(0, 0, copy.width, copy.height).data;
        let difference = 0;
        for (let i = 0; i < actual.length; i += 4)
          for (let c = 0; c < 3; c++) difference += Math.abs(actual[i + c]! - expected[i + c]!);
        results.push({ film, dpr, difference: difference / (copy.width * copy.height * 3) });
        if (dpr === 2) {
          const row = document.createElement('div'),
            heading = document.createElement('p');
          heading.textContent = film + ' — Pixi / Canvas';
          document.body.append(heading);
          row.style.display = 'flex';
          for (const source of [copy, reference]) {
            const image = document.createElement('canvas');
            image.width = width;
            image.height = height;
            image.getContext('2d')!.drawImage(source, 0, 0, width, height);
            row.append(image);
          }
          document.body.append(row);
        }
      }
    }
    painter.dispose();
    return results;
  });
  await page.setViewportSize({ width: 512, height: 800 });
  await page.screenshot({ path: info.outputPath('film-comparisons.png'), fullPage: true });
  expect(errors).toEqual([]);
  for (const result of results) expect(result.difference, JSON.stringify(results)).toBeLessThan(9);
});
