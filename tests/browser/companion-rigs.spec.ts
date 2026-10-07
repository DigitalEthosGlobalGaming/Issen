import { expect, test } from '@playwright/test';

test('assembled companions animate separate parts and preserve canvas state', async ({
  page,
}, info) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const rig = createInkCompanionRenderer(document);
    await rig.prepare();
    const canvas = document.createElement('canvas');
    canvas.width = 1100;
    canvas.height = 750;
    canvas.style.cssText = 'position:fixed;inset:0;z-index:99999;width:1100px;height:750px';
    document.body.append(canvas);
    const g = await createTestDrawing(canvas);
    g.fillStyle = '#c9c6bd';
    g.fillRect(0, 0, 1100, 750);
    g.font = '18px serif';
    g.fillStyle = '#252321';
    const types = ['shiba', 'cat', 'crow', 'mystic-rock'];
    const hashes: string[][] = [];
    for (const [col, type] of types.entries()) {
      g.fillText(type, 65 + col * 270, 28);
      for (let row = 0; row < 3; row++) {
        g.globalAlpha = 0.8;
        rig.draw(type, g, 155 + col * 270, 220 + row * 245, 145, row * 1.1, row === 2);
        if (g.globalAlpha !== 0.8 || g.getTransform().a !== 1 || g.getTransform().e !== 0)
          throw new Error('Rig leaked canvas state');
      }
      const scratch = document.createElement('canvas');
      scratch.width = scratch.height = 220;
      const sg = await createTestDrawing(scratch);
      const render = (time: number, reduced: boolean) => {
        sg.clearRect(0, 0, 220, 220);
        rig.draw(type, sg, 110, 205, 140, time, true, reduced);
        return scratch.toDataURL();
      };
      hashes.push([render(0, true), render(99, true), render(0, false), render(1.1, false)]);
    }
    const ready = rig.ready;
    rig.dispose();
    return { ready, hashes };
  });
  expect(result.ready).toBe(true);
  for (const [a, b, c, d] of result.hashes) {
    expect(a).toBe(b);
    expect(c).not.toBe(d);
  }
  await page.setViewportSize({ width: 1100, height: 750 });
  await page.screenshot({ path: info.outputPath('companion-rigs.png') });
});
