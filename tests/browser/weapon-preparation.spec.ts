import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('selected weapon cutouts match cold native draws without first-use readbacks', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkSwordRenderer } = await import('/src/rendering/figures/ink-sword.ts');
    const { ENEMY_WEAPON_IDS } = await import('/src/rendering/figures/enemy-presence.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const painters = await Promise.all(
      [0, 1].map(() => {
        const canvas = document.createElement('canvas');
        canvas.width = 240;
        canvas.height = 200;
        return createTestDrawing(canvas);
      }),
    );
    const palette = createPalette(),
      cases = [];
    const read = CanvasRenderingContext2D.prototype.getImageData;
    let reads = 0;
    CanvasRenderingContext2D.prototype.getImageData = function (...args) {
      reads++;
      return read.apply(this, args);
    };
    try {
      for (const player of ['steel', 'pan', 'koken']) {
        const cold = createInkSwordRenderer(document),
          warm = createInkSwordRenderer(document);
        try {
          await Promise.all([cold.prepare(), warm.prepare()]);
          const ids = [...ENEMY_WEAPON_IDS, player];
          const pending = warm.prepareParts(ids);
          const shared = pending === warm.prepareParts([...ids].reverse());
          const prepared = await pending,
            before = warm.snapshot();
          let maximum = 0,
            coldReads = 0,
            warmReads = 0,
            comparisons = 0;
          for (const id of new Set(ids))
            for (const gold of [false, true])
              for (const mirror of [1, -1]) {
                const pixels = [];
                for (const [index, owner] of [cold, warm].entries()) {
                  const g = painters[index];
                  g.begin();
                  g.save();
                  g.translate(mirror === 1 ? 35 : 205, 130);
                  g.scale(240 * mirror, 240);
                  const prior = reads;
                  if (!owner.draw(g, 0, 0, -0.17, palette, { len: 0.65, gold }, id))
                    throw Error('Missing weapon');
                  if (index === 0) coldReads += reads - prior;
                  else warmReads += reads - prior;
                  g.restore();
                  pixels.push(g.getImageData(0, 0, 240, 200).data);
                }
                maximum = pixels[0].reduce(
                  (n, value, i) => Math.max(n, Math.abs(value - pixels[1][i])),
                  maximum,
                );
                comparisons++;
              }
          cases.push({
            player,
            prepared,
            shared,
            before,
            maximum,
            coldReads,
            warmReads,
            comparisons,
          });
        } finally {
          cold.dispose();
          warm.dispose();
        }
      }
      return { cases, final: painters.map((g) => g.sourceTextureCount) };
    } finally {
      CanvasRenderingContext2D.prototype.getImageData = read;
      painters.forEach((g) => g.dispose());
    }
  });
  await writeFile(testInfo.outputPath('weapon-preparation.json'), JSON.stringify(result, null, 2));
  for (const entry of result.cases) {
    expect(entry.prepared).toBe(true);
    expect(entry.shared).toBe(true);
    expect(entry.maximum).toBe(0);
    expect(entry.coldReads).toBeGreaterThan(0);
    expect(entry.warmReads).toBe(0);
    expect(entry.before.cachedParts).toBeLessThan(31);
    expect(entry.before.cachedPixels).toBeLessThan(2_567_054);
  }
  expect(result.cases.reduce((sum, entry) => sum + entry.comparisons, 0)).toBe(80);
  expect(result.final).toEqual([0, 0]);
});

test('hidden weapon preparation resumes on visibility and disposal cancels the wait', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkSwordRenderer } = await import('/src/rendering/figures/ink-sword.ts');
    let hidden = true;
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    const cancelled = createInkSwordRenderer(document),
      resumed = createInkSwordRenderer(document);
    try {
      await Promise.all([cancelled.prepare(), resumed.prepare()]);
      const cancel = cancelled.prepareParts(['steel']),
        resume = resumed.prepareParts(['pan']);
      await new Promise((resolve) => setTimeout(resolve, 100));
      const waiting = [cancelled.snapshot().cachedParts, resumed.snapshot().cachedParts];
      cancelled.dispose();
      const cancelledReady = await cancel;
      hidden = false;
      document.dispatchEvent(new Event('visibilitychange'));
      const resumedReady = await resume,
        parts = resumed.snapshot().cachedParts;
      const invalid = await resumed.prepareParts(['missing']);
      return { waiting, cancelledReady, resumedReady, parts, invalid };
    } finally {
      cancelled.dispose();
      resumed.dispose();
      delete (document as any).hidden;
    }
  });
  expect(result).toEqual({
    waiting: [0, 0],
    cancelledReady: false,
    resumedReady: true,
    parts: 2,
    invalid: false,
  });
});
