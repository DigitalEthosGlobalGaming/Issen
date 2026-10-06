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
    const { uiTexture, uiTextureSource } = await import('/src/ui/ui-texture.ts');
    const stem = (pack: { sourcePath: string }) =>
      pack.sourcePath.split('/').pop()!.replace('.png', '');
    const { packedUi } = await import('/src/ui/packed-ui.ts');
    const { registerMaterialSink } = await import('/src/rendering/scene-material.ts');
    const packs = assetMaterialCatalog.filter((pack) => pack.sourcePath.startsWith('src/ui/'));
    const style = document.createElement('style');
    style.textContent = packs
      .map((pack, index) => `.pbr-test-${index} { background-image: ${uiTexture(stem(pack))}; }`)
      .join('\n');
    document.head.append(style);
    const buttonPack = packs.find((pack) => pack.sourcePath.endsWith('/button-normal.png'))!;
    const node = document.createElement('div');
    node.style.borderImage = `${uiTexture(stem(buttonPack))} 32 fill / 10px stretch`;
    const image = document.createElement('img');
    image.dataset.uiTexture = uiTextureSource(stem(buttonPack));
    image.src = buttonPack.source;
    document.body.append(node, image);
    const rig = createLightingRig();
    const ui = createUiMaterialLighting(document, rig);
    await ui.prepare();
    const initial = ui.snapshot();
    const originalSlice = getComputedStyle(node).borderImageSlice;
    const lit = image.src;
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
    const a = await read(lit);
    rig.state.enabled = false;
    await ui.prepare();
    const unlit = image.src;
    const b = await read(unlit),
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
    const shared = packedUi(document).snapshot();
    ui.dispose();
    const retained = packedUi(document).snapshot();
    disposeUiArt(document);
    const released = packedUi(document).snapshot();
    const restored =
      image.src === buttonPack.source &&
      node.style.borderImage.includes('--issen-ui-button-normal');
    style.remove();
    node.remove();
    image.remove();
    return {
      shared,
      retained,
      released,
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
  expect(result.shared.references).toBeGreaterThan(result.shared.pages);
  expect(result.retained.pages).toBeGreaterThan(0);
  expect(result.retained.references).toBeLessThan(result.shared.references);
  expect(result.released.pages).toBe(0);
  expect(result.released.references).toBe(0);
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

test('all packed UI cells preserve their authored colour and alpha windows', async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { uiTextureCatalog } = await import('/src/ui/ui-texture-catalog.ts');
    const { createUiMaterialLighting } = await import('/src/ui/material-lighting.ts');
    const { createLightingRig } = await import('/src/rendering/lighting-rig.ts');
    const cells = uiTextureCatalog.filter((pack) => pack.frame);
    const nodes = cells.map((pack) => {
      const node = document.createElement('div');
      node.style.backgroundImage = `var(--issen-ui-${pack.source.slice('issen-ui:'.length)})`;
      document.body.append(node);
      return node;
    });
    const rig = createLightingRig();
    rig.state.enabled = false;
    const owner = createUiMaterialLighting(document, rig);
    await owner.prepare();
    const original = new Map<string, HTMLImageElement>();
    const read = document.createElement('canvas');
    const context = read.getContext('2d')!;
    let alphaMismatch = 0,
      opaqueMismatch = 0,
      compared = 0;
    for (let index = 0; index < cells.length; index++) {
      const pack = cells[index]!;
      const url = getComputedStyle(nodes[index]!).backgroundImage.slice(5, -2);
      const image = new Image();
      image.src = url;
      await image.decode().catch(() => {
        throw Error(
          `UI cell failed: ${pack.source}, texture ${url.slice(0, 80)}, state ${JSON.stringify(owner.snapshot())}, style ${nodes[index]!.style.cssText}, alias ${document.documentElement.style.getPropertyValue('--issen-ui-' + pack.source.slice(9))}`,
        );
      });
      let source = original.get(pack.sourcePath);
      if (!source) {
        source = new Image();
        source.src = '/' + pack.sourcePath;
        await source.decode();
        original.set(pack.sourcePath, source);
      }
      const [x, y, width, height] = pack.frame!;
      read.width = width;
      read.height = height;
      context.drawImage(source, x, y, width, height, 0, 0, width, height);
      const expected = context.getImageData(0, 0, width, height).data;
      context.clearRect(0, 0, width, height);
      context.drawImage(image, 0, 0);
      const actual = context.getImageData(0, 0, width, height).data;
      for (let offset = 0; offset < expected.length; offset += 4) {
        if (actual[offset + 3] !== expected[offset + 3]) alphaMismatch++;
        if (
          expected[offset + 3]! > 240 &&
          [0, 1, 2].some(
            (channel) => Math.abs(actual[offset + channel]! - expected[offset + channel]!) > 2,
          )
        )
          opaqueMismatch++;
      }
      compared++;
    }
    owner.dispose();
    nodes.forEach((node) => node.remove());
    read.width = read.height = 0;
    return { compared, alphaMismatch, opaqueMismatch };
  });
  expect(result.compared).toBe(80);
  expect(result.alphaMismatch).toBe(0);
  expect(result.opaqueMismatch).toBe(0);
});
