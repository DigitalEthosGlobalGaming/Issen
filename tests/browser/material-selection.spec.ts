import { expect, test } from '@playwright/test';

test('scene material selection reuses shared packs and releases departed packs', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createAssetMaterials } = await import('/src/rendering/asset-materials.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const [shared, departing, arriving] = assetMaterialCatalog;
    const owner = createAssetMaterials(document, {
      shared: shared.source,
      other: departing.source,
    });
    await owner.prepare();
    const frame = [0, 0, 4, 4] as const;
    const retained = owner.material('shared', frame)!;
    const released = owner.material('other', frame)!;
    owner.select({ shared: shared.source, other: arriving.source });
    const reused = owner.material('shared', frame) === retained;
    const dropped = (released.surface!.source as HTMLCanvasElement).width === 0;
    await owner.prepare();
    const replacement = owner.material('other', frame)!;
    const ready = owner.ready('shared') && owner.ready('other');
    owner.dispose();
    owner.select({ shared: shared.source, other: arriving.source });
    return {
      reused,
      dropped,
      ready,
      disposed:
        (retained.surface!.source as HTMLCanvasElement).width === 0 &&
        (replacement.surface!.source as HTMLCanvasElement).width === 0 &&
        !owner.ready('shared'),
    };
  });
  expect(result).toEqual({ reused: true, dropped: true, ready: true, disposed: true });
});
