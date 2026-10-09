import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('busy frames cancel pending background UI exports without retaining their workspace', async ({
  page,
}) => {
  let releaseRequest!: () => void;
  let requested!: () => void;
  const blocked = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  const started = new Promise<void>((resolve) => {
    requested = resolve;
  });
  await page.route('**/src/ui/assets/armoury-room.webp', async (route) => {
    requested();
    await blocked;
    await route.abort().catch(() => {});
  });
  await page.goto('/privacy/index.html');
  await page.evaluate(async () => {
    const { createUiMaterialLighting } = await import('/src/ui/material-lighting.ts');
    const { createLightingRig } = await import('/src/rendering/lighting-rig.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const room = assetMaterialCatalog.find((pack) =>
      pack.sourcePath.endsWith('/armoury-room.png'),
    )!;
    const style = document.createElement('style');
    style.textContent = `.cancel-room {background-image:url("${room.source}")}`;
    document.head.append(style);
    const scope = window as any;
    scope.cancelUi = createUiMaterialLighting(document, createLightingRig());
    scope.cancelSample = sampleAssetBackground;
    sampleAssetBackground(0, true, 0, 8.3);
  });
  try {
    await started;
    expect(
      await page.evaluate(() => (window as any).cancelUi.snapshot().reservedBytes),
    ).toBeGreaterThan(0);
    await page.evaluate(() => (window as any).cancelSample(0, false, 0, 8.3));
    await expect
      .poll(() => page.evaluate(() => (window as any).cancelUi.snapshot().decodedLoader.queued))
      .toBe(0);
    const cancelled = await page.evaluate(() => (window as any).cancelUi.snapshot());
    expect(cancelled.rendered).toBe(0);
    expect(cancelled.reservedBytes).toBe(0);
    expect(cancelled.deferred).toBe(true);
    expect(cancelled.exportPixels).toBe(1);
    await page.evaluate(() => (window as any).cancelUi.dispose());
  } finally {
    releaseRequest();
  }
});

test('UI exports defer under shared pressure and reserve CSS backing after recovery', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createUiMaterialLighting } = await import('/src/ui/material-lighting.ts');
    const { createLightingRig } = await import('/src/rendering/lighting-rig.ts');
    const { registerSceneMemory } = await import('/src/platform/scene-memory.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const room = assetMaterialCatalog.find((pack) =>
      pack.sourcePath.endsWith('/armoury-room.png'),
    )!;
    const style = document.createElement('style');
    style.textContent = `.pressure-room { background-image: url("${room.source}"); }`;
    document.head.append(style);
    const scope = window as any;
    scope.uiPressure = {
      memorySnapshot: {
        decodedBytes: 0,
        canvasBytes: 0,
        transferredBytes: 0,
        reservedBytes: 430 * 1024 * 1024,
      },
    };
    registerSceneMemory(document, scope.uiPressure);
    scope.pressureUi = createUiMaterialLighting(document, createLightingRig());
    scope.pressureSample = sampleAssetBackground;
    scope.pressureStyle = style;
    sampleAssetBackground(0, true, 0, 8.3);
    await scope.pressureUi.prepare();
  });
  const blocked = await page.evaluate(() => (window as any).pressureUi.snapshot());
  expect(blocked.deferred).toBe(true);
  expect(blocked.rendered).toBe(0);
  expect(blocked.decodedLoader.bytes).toBe(0);
  expect(blocked.reservedBytes).toBe(0);
  await page.evaluate(() => {
    (window as any).uiPressure.memorySnapshot.reservedBytes = 0;
  });
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const scope = window as any;
        scope.pressureSample(0, true, 0, 8.3);
        return scope.pressureUi.snapshot().rendered;
      }),
    )
    .toBe(1);
  const ready = await page.evaluate(() => (window as any).pressureUi.snapshot());
  expect(ready.reservedBytes).toBe(1536 * 1024 * 8);
  expect(ready.exportPixels).toBe(1);
  await page.evaluate(() => {
    const scope = window as any;
    scope.pressureUi.dispose();
    scope.pressureStyle.remove();
  });
  expect(await page.evaluate(() => (window as any).pressureUi.snapshot().reservedBytes)).toBe(0);
});

test('background UI exports wait for quiet visible frames and disposal releases a waiting pass', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  await page.evaluate(async () => {
    const { createUiMaterialLighting } = await import('/src/ui/material-lighting.ts');
    const { createLightingRig } = await import('/src/rendering/lighting-rig.ts');
    const { sampleAssetBackground } = await import('/src/platform/asset-background.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const pack = assetMaterialCatalog.find((pack: any) =>
      pack.sourcePath.endsWith('/button-normal.png'),
    )!;
    const style = document.createElement('style');
    style.textContent = `.quiet-fixture { background-image:url("${pack.source}"); }`;
    document.head.append(style);
    const scope = window as any;
    scope.quietRig = createLightingRig();
    scope.quietUi = createUiMaterialLighting(document, scope.quietRig);
    scope.quietSample = sampleAssetBackground;
    sampleAssetBackground(0, false, 0, 8.3);
    sampleAssetBackground(0, true, 10, 8.3);
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    sampleAssetBackground(0, true, 0, 8.3);
  });
  await page.waitForTimeout(60);
  expect(await page.evaluate(() => (window as any).quietUi.snapshot().decodedLoader.pinned)).toBe(
    0,
  );
  expect(await page.evaluate(() => (window as any).quietUi.snapshot().available)).toBe(false);
  await page.evaluate(() => {
    Object.defineProperty(document, 'hidden', { value: false, configurable: true });
    document.dispatchEvent(new Event('visibilitychange'));
  });
  await expect.poll(() => page.evaluate(() => (window as any).quietUi.snapshot().rendered)).toBe(1);
  const idle = await page.evaluate(() => (window as any).quietUi.snapshot());
  expect(idle.exportPixels).toBe(1);
  expect(idle.gpuMemory.bytes).toBeLessThan(1024 * 1024);
  await page.evaluate(() => {
    const scope = window as any;
    scope.quietSample(0, false, 0, 8.3);
    scope.quietRig.state.intensity = 3;
  });
  await page.waitForTimeout(60);
  expect(await page.evaluate(() => (window as any).quietUi.snapshot().decodedLoader.pinned)).toBe(
    0,
  );
  await page.evaluate(() => (window as any).quietUi.dispose());
  await expect
    .poll(() => page.evaluate(() => (window as any).quietUi.snapshot().decodedLoader.bytes))
    .toBe(0);
});

test('UI exports release pins and GPU sources while a low-memory local stage remains live', async ({
  page,
}, testInfo) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createLocalEnvironmentRenderer } =
      await import('/src/rendering/environment/local-renderer.ts');
    const { createUiMaterialLighting } = await import('/src/ui/material-lighting.ts');
    const { createLightingRig } = await import('/src/rendering/lighting-rig.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const stage = createLocalEnvironmentRenderer(document);
    await stage.prepare(0);
    const { createInkCharmRenderer } = await import('/src/rendering/figures/ink-charms.ts');
    const charms = createInkCharmRenderer(document);
    const charmPeer = createInkCharmRenderer(document);
    if (!(await charms.prepare()) || !(await charmPeer.prepare()))
      throw Error('Charm prepare failed');
    charms.dispose();
    const before = stage.snapshot().decodedLoader!;
    const packs = assetMaterialCatalog.filter((pack: any) => pack.sourcePath.startsWith('src/ui/'));
    const style = document.createElement('style');
    style.textContent = packs
      .map(
        (pack: any, index: number) =>
          `.budget-ui-${index} {background-image:url("${pack.source}")}`,
      )
      .join('\n');
    document.head.append(style);
    const rig = createLightingRig();
    const ui = createUiMaterialLighting(document, rig);
    await ui.prepare();
    const samples = [ui.snapshot()];
    rig.state.enabled = false;
    await ui.prepare();
    samples.push(ui.snapshot());
    ui.dispose();
    const after = stage.snapshot().decodedLoader!;
    const live = await stage.compose({
      width: 160,
      height: 100,
      dpr: 1,
      time: 0,
      stage: 0,
      stageSeed: 424242,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    });
    style.remove();
    const charmReady = charmPeer.snapshot().state;
    charmPeer.dispose();
    stage.dispose();
    return { before, samples, after, live, charmReady, disposed: stage.snapshot().decodedLoader! };
  });
  expect(result.samples.every((sample) => sample.rendered === 31)).toBe(true);
  for (const sample of result.samples) {
    expect(sample.sourceTextures).toBe(0);
    expect(sample.exportPixels).toBe(1);
    expect(sample.gpuMemory.bytes).toBeLessThan(1024 * 1024);
    expect(sample.decodedLoader.pinned).toBe(result.before.pinned);
    expect(sample.decodedLoader.peakBytes).toBeLessThanOrEqual(256 * 1024 * 1024);
  }
  expect(result.after.pinned).toBe(result.before.pinned);
  expect(result.after.evictions).toBeGreaterThan(0);
  expect(result.live).toBe(true);
  expect(result.charmReady).toBe('ready');
  expect(result.disposed.bytes).toBe(0);
  expect(warnings).toEqual([]);
  const path = testInfo.outputPath('ui-and-stage-budget.json');
  await writeFile(path, JSON.stringify(result, null, 2));
  await testInfo.attach('ui-and-stage-budget', { path, contentType: 'application/json' });
});

test('all UI packs render through the shader and CSS images follow the light without losing slices', async ({
  page,
}) => {
  const requested: string[] = [];
  page.on('request', (request) => requested.push(request.url()));
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
  expect(requested.some((url) => /_diffuse\.(?:webp|png)/.test(url))).toBe(false);
});
