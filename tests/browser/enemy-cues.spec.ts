import { expect, test } from '@playwright/test';

test('attacker brackets remain distinct with arrows and timing rings hidden', async ({
  page,
}, testInfo) => {
  await page.setViewportSize({ width: 390, height: 540 });
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const mainPath = document.querySelector<HTMLScriptElement>('script[src*="/src/main.ts"]')!.src;
    (await import(mainPath)).dispose();
    const { drawEnso, enemyGlyphCue } = await import('/src/rendering/glyphs.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 390;
    canvas.height = 540;
    canvas.id = 'cue-preview';
    document.body.replaceChildren(canvas);
    const g = canvas.getContext('2d')!;
    g.fillStyle = '#292823';
    g.fillRect(0, 0, canvas.width, canvas.height);
    const env = {
      time: 0,
      seal: '#a3271d',
      sealArc: '#a3271d',
      font: 'serif',
      perfectZone: 0.8,
      noArc: false,
    };
    const rows = ['Arrows shown', 'Arrows hidden', 'Arrows and timing ring hidden'];
    const samples: number[][] = [];
    const restored: boolean[] = [];
    for (let row = 0; row < rows.length; row++) {
      g.fillStyle = '#eee8dc';
      g.font = '15px sans-serif';
      g.textAlign = 'left';
      g.fillText(rows[row]!, 16, 30 + row * 175);
      const brightness: number[] = [];
      for (let column = 0; column < 3; column++) {
        const attacking = column === 2;
        const cue = enemyGlyphCue(attacking, column === 0 ? 2 : 1);
        const x = 65 + column * 130,
          y = 95 + row * 175;
        const r = attacking ? 28 : 18;
        drawEnso(g, env, x, y, r, 'left', {
          ...cue,
          rank: column === 0 ? 2 : 1,
          prog: attacking && row !== 2 ? 0.45 : null,
          arrowA: row === 0 ? null : 0,
        });
        restored.push(g.globalAlpha === 1 && g.shadowBlur === 0);
        // The upper-left corner is outside the circle/rank seal. Only the
        // attacker should paint this location, regardless of arrow/ring rules.
        const pixel = g.getImageData(Math.round(x - r * 1.32), Math.round(y - r * 1.32), 1, 1).data;
        brightness.push(pixel[0]!);
        g.fillStyle = '#eee8dc';
        g.textAlign = 'center';
        g.font = '13px sans-serif';
        g.fillText(['Waiting', 'Next', 'Attacking'][column]!, x, y + 60);
      }
      samples.push(brightness);
    }
    return { samples, restored };
  });
  for (const [waiting, next, attacking] of result.samples) {
    expect(attacking).toBeGreaterThan(180);
    expect(waiting).toBeLessThan(80);
    expect(next).toBeLessThan(80);
  }
  expect(result.restored.every(Boolean)).toBe(true);
  await page
    .locator('#cue-preview')
    .screenshot({ path: testInfo.outputPath('enemy-cues-portrait.png') });
});
