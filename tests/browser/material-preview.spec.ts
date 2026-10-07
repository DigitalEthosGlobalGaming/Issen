import { expect, test } from '@playwright/test';

test('the lighting menu can render retained artwork and the six original packs', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createLightingDebug } = await import('/src/ui/lighting-debug.ts');
    const { createUiMaterialLighting } = await import('/src/ui/material-lighting.ts');
    const { createLightingRig } = await import('/src/rendering/lighting-rig.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const app = document.createElement('div');
    document.body.append(app);
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    app.append(canvas);
    const rig = createLightingRig();
    const ui = createUiMaterialLighting(document, rig);
    const debug = createLightingDebug(
      app,
      rig,
      () => canvas,
      () => {},
    );
    const select = app.querySelector('select')!;
    const image = app.querySelector<HTMLImageElement>('.lighting-material-preview')!;
    const names = [
      'companion-atlas',
      'katana',
      'player-ronin-atlas',
      'rocks-atlas',
      'blade-profile-atlas',
      'player-ronin-simple',
      'enemy-ronin-simple',
      'enemy-clothing-variants',
      'enemy-headwear-atlas',
      'enemy-headwear-variants',
    ];
    const drawn = [];
    for (const name of names) {
      const pack = assetMaterialCatalog.find((pack) => pack.sourcePath.endsWith(`/${name}.png`))!;
      select.value = pack.source;
      select.dispatchEvent(new Event('change'));
      ui.refresh();
      await ui.prepare();
      drawn.push(image.src.startsWith('data:image/png'));
    }
    const before = image.src;
    rig.state.enabled = false;
    await ui.prepare();
    const changed = image.src !== before;
    const options = select.options.length;
    debug.dispose();
    ui.dispose();
    app.remove();
    return { options, families: assetMaterialCatalog.length, drawn, changed };
  });
  expect(result.families).toBe(86);
  expect(result.options).toBe(87);
  expect(result.drawn).toHaveLength(10);
  expect(result.drawn.every(Boolean)).toBe(true);
  expect(result.changed).toBe(true);
});
