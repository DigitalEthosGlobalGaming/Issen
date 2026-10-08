import { expect, test } from '@playwright/test';

test('outfit and charm packs load aligned material maps and submit material stamps', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createOutfitKit, INK_OUTFIT_RECIPES } =
      await import('/src/rendering/figures/outfit-kit.ts');
    const { createInkCharmRenderer } = await import('/src/rendering/figures/ink-charms.ts');
    const { registerMaterialSink } = await import('/src/rendering/scene-material.ts');
    const outfit = createOutfitKit(document);
    const charms = createInkCharmRenderer(document);
    await Promise.all([outfit.prepare(), charms.prepare()]);
    const canvas = document.createElement('canvas');
    const g = canvas.getContext('2d')!;
    const stamps: any[] = [];
    registerMaterialSink(g, { draw: (stamp: any) => stamps.push(stamp), lights: () => {} });
    for (const robeId of Object.keys(INK_OUTFIT_RECIPES)) {
      outfit.draw(g, 'body', { robeId } as any);
      outfit.draw(g, 'head', { robeId } as any);
    }
    const charmIds = charms.snapshot().supported;
    const charmDrawn = charmIds.every((id) => charms.draw(g, id, 10, 10, 30));
    const ready = outfit.snapshot().outfits;
    const aligned = stamps.every(
      (stamp) =>
        stamp.material.normal.frame.join() === stamp.material.surface.frame.join() &&
        (!stamp.material.emissive ||
          stamp.material.emissive.frame.join() === stamp.material.normal.frame.join()),
    );
    const count = stamps.length;
    const allOutfits = ready.length === Object.keys(INK_OUTFIT_RECIPES).length;
    outfit.dispose();
    charms.dispose();
    return { allOutfits, charmDrawn, aligned, count, disposed: outfit.snapshot().outfits.length };
  });
  expect(result.allOutfits).toBe(true);
  expect(result.charmDrawn).toBe(true);
  expect(result.aligned).toBe(true);
  expect(result.count).toBeGreaterThan(40);
  expect(result.disposed).toBe(0);
  expect(requested.some((url) => /_diffuse\.(?:webp|png)/.test(url))).toBe(false);
});
