import { test, expect } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
for (const kind of ['player', 'sword'] as const)
  test(`${kind} owned artwork retires every native source without affecting a peer`, async ({
    page,
  }, testInfo) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
        warnings.push(message.text());
    });
    await page.goto('/privacy/index.html');
    const result = await page.evaluate(async (kind) => {
      const { createInkPlayerRenderer } = await import('/src/rendering/figures/ink-player.ts');
      const { createInkSwordRenderer } = await import('/src/rendering/figures/ink-sword.ts');
      const { INK_OUTFIT_RECIPES } = await import('/src/rendering/figures/outfit-kit.ts');
      const { BLADE_RECIPES } = await import('/src/rendering/figures/blade-recipes.ts');
      const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
      const { createPalette } = await import('/src/rendering/palette.ts');
      const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
      const factory = kind === 'player' ? createInkPlayerRenderer : createInkSwordRenderer;
      const owners = [factory(document), factory(document)];
      await Promise.all(owners.map((owner) => owner.prepare()));
      const canvases = [0, 1].map(() => {
        const c = document.createElement('canvas');
        c.width = 180;
        c.height = 160;
        return c;
      });
      const painters = await Promise.all(canvases.map((c) => createTestDrawing(c)));
      const palette = createPalette();
      const env = {
        time: 1.25,
        wind: 0.2,
        width: 180,
        height: 160,
        palette: (fog: number) => palette.fog(fog, [100, 110, 120]),
        reducedMotion: true,
        reducedFlashes: true,
      };
      const ids = Object.keys(kind === 'player' ? INK_OUTFIT_RECIPES : BLADE_RECIPES);
      const draw = (index: number, id: string) => {
        const g = painters[index];
        g.begin();
        g.save();
        g.translate(90, 125);
        g.scale(kind === 'player' ? -95 : 180, kind === 'player' ? 95 : 180);
        const owner = owners[index] as any;
        if (kind === 'player') {
          if (
            !owner.draw(
              g,
              {
                back: true,
                robeId: id,
                d: makeFig(43),
                pose: EPOSE.guard,
                fog: 0,
                secondary: { cloth: 0.1, charm: 0 },
              },
              env,
            )
          )
            throw Error('Missing outfit:' + id);
        } else {
          if (!owner.draw(g, 0, 0, -0.1, palette, { len: 0.65, gold: true }, id))
            throw Error('Missing weapon:' + id);
        }
        g.restore();
        return g.getImageData(0, 0, 180, 160).data;
      };
      for (const id of ids) {
        draw(0, id);
        draw(1, id);
      }
      const before = painters.map((p) => p.sourceTextureCount);
      const original = draw(1, ids.at(-1)!);
      owners[0].dispose();
      owners[0].dispose();
      const disposed = painters[0].sourceTextureCount;
      const surviving = draw(1, ids.at(-1)!);
      const peerMax = surviving.reduce(
        (n, value, i) => Math.max(n, Math.abs(value - original[i])),
        0,
      );
      const peer = { count: painters[1].sourceTextureCount, snapshot: owners[1].snapshot() };
      owners[1].dispose();
      const final = painters.map((p) => ({
        count: p.sourceTextureCount,
        pending: p.sourceRetirementSnapshot,
      }));
      painters.forEach((p) => p.dispose());
      return { cases: ids.length, before, disposed, peerMax, peer, final };
    }, kind);
    await writeFile(
      testInfo.outputPath(`figure-retirement-${kind}.json`),
      JSON.stringify(result, null, 2),
    );
    expect(result.cases).toBe(20);
    expect(result.before.every((count) => count > 0)).toBe(true);
    expect(result.disposed).toBe(0);
    expect(result.peerMax).toBe(0);
    expect(result.peer.count).toBe(result.before[1]);
    expect(result.final).toEqual([
      { count: 0, pending: { sources: 0, bytes: 0 } },
      { count: 0, pending: { sources: 0, bytes: 0 } },
    ]);
    expect(warnings).toEqual([]);
  });

test('weapon cache eviction retains a warmed queued blade until the next frame', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkSwordRenderer } = await import('/src/rendering/figures/ink-sword.ts');
    const { BLADE_RECIPES } = await import('/src/rendering/figures/blade-recipes.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const ids = Array.from({ length: 100 }, (_, i) => `eviction-fixture-${i}`);
    const recipes = BLADE_RECIPES as any;
    for (const [i, id] of ids.entries())
      recipes[id] = { ...recipes.steel, tint: `rgb(${i},20,30)` };
    const owner = createInkSwordRenderer(document);
    await owner.prepare();
    const canvas = document.createElement('canvas');
    canvas.width = 240;
    canvas.height = 220;
    const g = await createTestDrawing(canvas);
    const draw = (id: string, i: number) => {
      g.save();
      g.translate(4 + (i % 10) * 24, 12 + Math.floor(i / 10) * 22);
      g.scale(30, 30);
      if (!owner.draw(g, 0, 0, -0.1, createPalette(), { len: 0.65 }, id))
        throw Error('Missing fixture blade');
      g.restore();
    };
    try {
      draw(ids[0], 0);
      const warm = g.getImageData(0, 0, 20, 20).data;
      g.begin();
      ids.forEach(draw);
      const current = g.getImageData(0, 0, 20, 20).data;
      const repeat = g.getImageData(0, 0, 20, 20).data;
      const difference = (a: Uint8ClampedArray, b: Uint8ClampedArray) =>
        a.reduce((n, value, i) => Math.max(n, Math.abs(value - b[i])), 0);
      const queued = {
        native: g.sourceTextureCount,
        pending: g.sourceRetirementSnapshot,
        parts: owner.snapshot().cachedParts,
      };
      g.begin();
      const boundary = { native: g.sourceTextureCount, pending: g.sourceRetirementSnapshot };
      owner.dispose();
      const final = g.sourceTextureCount;
      return {
        warmVisible: warm.some((value, i) => i % 4 === 3 && value > 0),
        warmMax: difference(warm, current),
        replayMax: difference(current, repeat),
        queued,
        boundary,
        final,
      };
    } finally {
      ids.forEach((id) => delete recipes[id]);
      owner.dispose();
      g.dispose();
    }
  });
  await writeFile(
    testInfo.outputPath('weapon-cache-retirement.json'),
    JSON.stringify(result, null, 2),
  );
  expect(result.warmVisible).toBe(true);
  expect(result.warmMax).toBe(0);
  expect(result.replayMax).toBe(0);
  expect(result.queued.parts).toBeLessThanOrEqual(80);
  expect(result.queued.pending.sources).toBeGreaterThan(0);
  expect(result.boundary.pending).toEqual({ sources: 0, bytes: 0 });
  expect(result.boundary.native).toBeLessThan(result.queued.native);
  expect(result.final).toBe(0);
});
