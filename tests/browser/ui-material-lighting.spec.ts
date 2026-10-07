import { expect, test } from '@playwright/test';

test('all UI packs render through the shader and CSS images follow the light without losing slices', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createUiMaterialLighting } = await import('/src/ui/material-lighting.ts');
    const { createLightingRig } = await import('/src/rendering/lighting-rig.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const { prepareUiArt, drawSeal, drawCrestSprite, setSealTextures, disposeUiArt } =
      await import('/src/rendering/ui-art.ts');
    const { registerMaterialSink } = await import('/src/rendering/scene-material.ts');
    const packs = assetMaterialCatalog.filter((pack) => pack.sourcePath.startsWith('src/ui/'));
    const style = document.createElement('style');
    style.textContent = packs
      .map((pack, index) => `.pbr-test-${index} { background-image: url("${pack.source}"); }`)
      .join('\n');
    document.head.append(style);
    const buttonPack = packs.find((pack) => pack.sourcePath.endsWith('/button-normal.png'))!;
    const node = document.createElement('div');
    node.style.borderImage = `url("${buttonPack.source}") 32 fill / 10px stretch`;
    const image = document.createElement('img');
    image.src = buttonPack.source;
    document.body.append(node, image);
    const rig = createLightingRig();
    const ui = createUiMaterialLighting(document, rig);
    await ui.prepare();
    const initial = ui.snapshot();
    const originalSlice = getComputedStyle(node).borderImageSlice;
    const lit = image.src;
    rig.state.enabled = false;
    await ui.prepare();
    const unlit = image.src;
    const read = async (url: string) => {
      const source = document.createElement('img');
      source.src = url;
      await source.decode();
      const canvas = document.createElement('canvas');
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
      const g = canvas.getContext('2d')!;
      g.drawImage(source, 0, 0);
      return g.getImageData(0, 0, canvas.width, canvas.height).data;
    };
    const a = await read(lit),
      b = await read(unlit),
      original = await read(buttonPack.source);
    let changed = 0,
      alphaMismatch = 0,
      unlitMismatch = 0;
    for (let index = 0; index < a.length; index += 4) {
      if (Math.abs(a[index]! - b[index]!) > 5) changed++;
      if (a[index + 3] !== b[index + 3] || b[index + 3] !== original[index + 3]) alphaMismatch++;
      if (b[index + 3]! > 240 && Math.abs(b[index]! - original[index]!) > 2) unlitMismatch++;
    }
    await setSealTextures(node, '#806040');
    await ui.prepare();
    const sealVariable = node.style.getPropertyValue('--seal-metal');
    await prepareUiArt(document);
    const drawing = document.createElement('canvas').getContext('2d')!;
    const stamps: any[] = [];
    registerMaterialSink(drawing, { draw: (stamp) => stamps.push(stamp), lights: () => {} });
    drawSeal(drawing, 'metal', '#806040', 0, 0, 80, 40);
    drawCrestSprite(drawing, 'tomoe', 20, 20, 10);
    const materialStamps = stamps.length;
    ui.dispose();
    disposeUiArt(document);
    const restored =
      image.src === buttonPack.source && node.style.borderImage.includes(buttonPack.source);
    style.remove();
    node.remove();
    image.remove();
    return {
      total: packs.length,
      rendered: initial.rendered,
      changed,
      alphaMismatch,
      unlitMismatch,
      originalSlice,
      sealVariable: sealVariable.startsWith('var(--pbr-ui-'),
      materialStamps,
      restored,
    };
  });
  expect(result.total).toBe(31);
  expect(result.rendered).toBe(result.total);
  expect(result.changed).toBeGreaterThan(10);
  expect(result.alphaMismatch).toBe(0);
  expect(result.unlitMismatch).toBe(0);
  expect(result.originalSlice).toBe('32 fill');
  expect(result.sealVariable).toBe(true);
  expect(result.materialStamps).toBe(10);
  expect(result.restored).toBe(true);
});
