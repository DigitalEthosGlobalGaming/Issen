import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';

test('late preview artwork repaints without advancing effects and suspension cancels repainting', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  await page.route('**/src/rendering/effects/update.ts*', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      /function updateEffects\([\s\S]*?\)\s*\{/,
      (match) =>
        `${match}\nwindow.__previewEffectUpdates = (window.__previewEffectUpdates ?? 0) + 1;`,
    );
    await route.fulfill({ response, body });
  });
  let release: (() => void) | undefined;
  await page.route(/companion-parts-atlas_normal\.webp/, async (route) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  const before = await page.evaluate(async () => {
    const { createArmoryPreview } = await import('/src/rendering/armory-preview.ts');
    const { SceneSurface } = await import('/src/rendering/scene-surface.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const { makeFig } = await import('/src/shared/figure-model.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 180;
    const surface = new SceneSurface(canvas, true);
    await surface.initialize();
    const silent = () => {};
    const scope = window as any;
    scope.previewNow = 1000;
    const preview = createArmoryPreview(
      canvas,
      {
        random: () => 0.5,
        now: () => scope.previewNow,
        sounds: new Proxy({ bonk: silent, slice: silent, clink: silent }, { get: () => silent }),
      },
      undefined,
      surface,
    );
    await preview.prepare();
    const palette = createPalette();
    const frame = {
      time: 0,
      wind: 0,
      petActive: false,
      palette: (fog: number) => palette.fog(fog, [146, 141, 132]),
      background: null,
      appearance: { d: makeFig(12), robeId: 'hai', bladeId: 'steel', pal: palette.robe('hai') },
      pet: 'cat',
      film: 'mono',
      effectsVisible: true,
      font: 'serif',
      seal: '#a3271d',
      mistSprite: null,
    };
    preview.draw(frame);
    scope.previewOwner = preview;
    scope.previewSurface = surface;
    scope.previewFrame = frame;
    return surface.native!.sourceTextureCount;
  });
  await expect.poll(() => !!release).toBe(true);
  await page.evaluate(() => {
    (window as any).previewNow = 100_000;
  });
  release!();
  await page.waitForFunction(
    (before) => (window as any).previewSurface.native.sourceTextureCount === before + 3,
    before,
  );
  expect(await page.evaluate(() => (window as any).__previewEffectUpdates)).toBe(1);
  const suspended = await page.evaluate(async () => {
    const scope = window as any;
    scope.previewOwner.draw({ ...scope.previewFrame, pet: 'mystic-rock' });
    scope.previewOwner.suspend();
    const updates = scope.__previewEffectUpdates,
      count = scope.previewSurface.native.sourceTextureCount;
    // The companion queue is serial; a later shared kit waits behind the canceled rock kit.
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const peer = createInkCompanionRenderer(document);
    peer.select('mystic-rock');
    await peer.prepare();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const after = {
      updates: scope.__previewEffectUpdates,
      count: scope.previewSurface.native.sourceTextureCount,
    };
    scope.previewOwner.dispose();
    peer.dispose();
    scope.previewSurface.dispose();
    return { updates, count, after };
  });
  expect(suspended.after).toEqual({ updates: suspended.updates, count: suspended.count });
});

test('required companion decoding works hidden and selected pixels survive native context restoration', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  const result = await page.evaluate(async () => {
    Object.defineProperty(document, 'hidden', { value: true, configurable: true });
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const owner = createInkCompanionRenderer(document);
    owner.select('mystic-rock');
    const hiddenReady = await owner.prepare();
    delete (document as any).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 160;
    const painter = await createPixiScenePainter(canvas);
    const draw = () => {
      painter.begin();
      painter.fillStyle = '#eee9df';
      painter.fillRect(0, 0, 160, 160);
      owner.draw('mystic-rock', painter, 80, 140, 100, 1.25, true, true);
      painter.flush();
      const gl = canvas.getContext('webgl2')!;
      const pixels = new Uint8Array(160 * 160 * 4);
      gl.readPixels(0, 0, 160, 160, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      return pixels;
    };
    const before = draw();
    const gl = canvas.getContext('webgl2')!,
      extension = gl.getExtension('WEBGL_lose_context')!;
    const lost = new Promise((resolve) =>
      canvas.addEventListener('webglcontextlost', resolve, { once: true }),
    );
    extension.loseContext();
    await lost;
    const retained = owner.snapshot();
    const restored = new Promise((resolve) =>
      canvas.addEventListener('webglcontextrestored', resolve, { once: true }),
    );
    await new Promise((resolve) => setTimeout(resolve, 0));
    extension.restoreContext();
    await restored;
    const after = draw();
    let max = 0;
    for (let pixel = 0; pixel < before.length; pixel++)
      max = Math.max(max, Math.abs(before[pixel]! - after[pixel]!));
    const count = painter.sourceTextureCount;
    owner.dispose();
    const disposed = painter.sourceTextureCount;
    painter.dispose();
    return { hiddenReady, retained, max, count, disposed };
  });
  expect(result.hiddenReady).toBe(true);
  expect(result.retained).toMatchObject({
    selected: ['rock'],
    ready: true,
    decodedLoader: { pinned: 3 },
  });
  expect(result.max).toBe(0);
  expect(result.count).toBe(3);
  expect(result.disposed).toBe(0);
  expect(errors).toEqual([]);
});

test('runtime startup skips unused companions and panels release their selected artwork', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  const companionUrls = /(?:companion-parts-atlas|mystic-rock).*\.webp/;
  await page.route(companionUrls, (route) =>
    route.request().resourceType() === 'script' ? route.continue() : route.abort(),
  );
  await page.route('**/src/game.ts*', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'artworkReady = true;',
      'window.__companionRuntime = { foundation, presentation, controls, frames, surfaces }; artworkReady = true;',
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__companionRuntime);
  const empty = await page.evaluate(() => {
    const { foundation, frames } = (window as any).__companionRuntime;
    frames.frameLoop.stop();
    return foundation.browser.inkCompanion.snapshot();
  });
  expect(empty).toMatchObject({ selected: [], equipped: [], borrowed: 0, ready: true });
  await page.unroute(companionUrls);
  const result = await page.evaluate(async () => {
    const {
      foundation: f,
      presentation: p,
      controls,
      surfaces,
    } = (window as any).__companionRuntime;
    const owner = f.browser.inkCompanion;
    f.profile.profileEquipment.EQ = {
      ...f.profile.profileEquipment.EQ,
      robe: 'scarecrow',
      pet: 'nopet',
    };
    p.figureRenderer();
    await owner.prepare();
    const crow = owner.snapshot();
    controls.openPanel('armory');
    controls.drawPreview();
    const armory = owner.snapshot();
    controls.closePanel();
    const closedArmory = owner.snapshot();
    controls.openPanel('support');
    await owner.prepare();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const support = {
      snapshot: owner.snapshot(),
      native: surfaces.get('supportPreview').native.sourceTextureCount,
    };
    controls.closePanel();
    const closedSupport = {
      snapshot: owner.snapshot(),
      native: surfaces.get('supportPreview').native.sourceTextureCount,
    };
    // A fresh preview of a kit not yet loaded must redraw when its selected images arrive.
    f.profile.profileEquipment.EQ = {
      ...f.profile.profileEquipment.EQ,
      robe: 'hai',
      pet: 'mystic-rock',
    };
    p.figureRenderer();
    controls.openPanel('support');
    const pending = owner.snapshot();
    await owner.prepare();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const arrived = {
      snapshot: owner.snapshot(),
      native: surfaces.get('supportPreview').native.sourceTextureCount,
    };
    // The player owner now also retires its base maps and seven hai tone parts on suspension.
    f.browser.inkPlayer.releaseCanvas(surfaces.get('supportPreview').drawing);
    const afterPlayerRelease = surfaces.get('supportPreview').native.sourceTextureCount;
    controls.closePanel();
    const closedRock = {
      snapshot: owner.snapshot(),
      native: surfaces.get('supportPreview').native.sourceTextureCount,
    };
    return {
      crow,
      armory,
      closedArmory,
      support,
      closedSupport,
      pending,
      arrived,
      afterPlayerRelease,
      closedRock,
    };
  });
  expect(result.crow).toMatchObject({ equipped: ['parts'], selected: ['parts'], ready: true });
  expect(result.armory.borrowed).toBe(1);
  expect(result.closedArmory.borrowed).toBe(0);
  expect(result.support.snapshot.borrowed).toBe(1);
  expect(result.closedSupport.snapshot.borrowed).toBe(0);
  expect(result.support.native).toBeGreaterThan(0);
  // Suspension releases the whole hidden preview, including its player and weapon.
  expect(result.closedSupport.native).toBe(0);
  expect(result.pending).toMatchObject({ selected: ['rock'], borrowed: 1, ready: false });
  expect(result.arrived.snapshot).toMatchObject({ selected: ['rock'], borrowed: 1, ready: true });
  expect(result.arrived.native - result.afterPlayerRelease).toBe(10);
  expect(result.afterPlayerRelease).toBeGreaterThan(0);
  expect(result.closedRock.native).toBe(0);
  expect(result.closedRock.snapshot.borrowed).toBe(0);
  expect(errors).toEqual([]);
  const path = testInfo.outputPath('runtime-companion-selection.json');
  await writeFile(path, JSON.stringify({ empty, ...result }, null, 2));
  await testInfo.attach('runtime-companion-selection', { path, contentType: 'application/json' });
});

test('equipped and borrowed companion kits share pins, retain peers and release inactive selections', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const owner = createInkCompanionRenderer(document);
    owner.select('nopet');
    const emptyReady = await owner.prepare(),
      empty = owner.snapshot();
    owner.select('cat');
    await owner.prepare();
    const parts = owner.snapshot();
    const preview = owner.borrow();
    preview.select('crow');
    await preview.prepare();
    const source = preview.sources()[0]!;
    for (let index = 0; index < 100; index++) owner.select(index % 2 ? 'shiba' : 'cat');
    const repeated = owner.snapshot();
    owner.select('mystic-rock');
    await owner.prepare();
    const union = owner.snapshot(),
      retained = preview.sources()[0] === source;
    preview.dispose();
    const rock = owner.snapshot();
    const peer = createInkCompanionRenderer(document);
    peer.select('mystic-rock');
    await peer.prepare();
    const borrowed = peer.borrow();
    borrowed.select('mystic-rock');
    const peerSource = borrowed.sources()[0]!;
    owner.dispose();
    const peerSurvives = {
      ready: peer.ready,
      width: peerSource.naturalWidth,
      snapshot: peer.snapshot(),
    };
    peer.select('nopet');
    borrowed.dispose();
    const unpinned = peer.snapshot();
    peer.dispose();
    return {
      emptyReady,
      empty,
      parts,
      repeated,
      union,
      retained,
      rock,
      peerSurvives,
      unpinned,
      disposed: peer.snapshot(),
      width: peerSource.naturalWidth,
    };
  });
  expect(result.emptyReady).toBe(true);
  expect(result.empty).toMatchObject({
    selected: [],
    ready: true,
    decodedLoader: { decoded: 0, bytes: 0, pinned: 0 },
  });
  expect(result.parts).toMatchObject({
    selected: ['parts'],
    decodedLoader: { decoded: 3, pinned: 3, bytes: 18_870_192 },
  });
  expect(result.repeated.decodedLoader).toEqual(result.parts.decodedLoader);
  expect(result.union).toMatchObject({
    selected: ['parts', 'rock'],
    borrowed: 1,
    decodedLoader: { decoded: 6, pinned: 6, bytes: 37_735_212 },
  });
  expect(result.retained).toBe(true);
  expect(result.rock).toMatchObject({
    selected: ['rock'],
    borrowed: 0,
    decodedLoader: { decoded: 6, pinned: 3, pinnedBytes: 18_865_020 },
  });
  expect(result.peerSurvives).toMatchObject({
    ready: true,
    width: 1145,
    snapshot: { selected: ['rock'] },
  });
  expect(result.unpinned).toMatchObject({ selected: [], decodedLoader: { decoded: 6, pinned: 0 } });
  expect(result.disposed).toMatchObject({ ready: false, decodedLoader: { bytes: 0, decoded: 0 } });
  expect(result.width).toBe(0);
  const path = testInfo.outputPath('companion-selected-kits.json');
  await writeFile(path, JSON.stringify(result, null, 2));
  await testInfo.attach('companion-selected-kits', { path, contentType: 'application/json' });
});

test('stale companion decoding cannot publish an old kit or a released preview', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  let release: (() => void) | undefined;
  await page.route(/companion-parts-atlas_normal\.webp/, async (route) => {
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    await route.continue();
  });
  await page.evaluate(async () => {
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const scope = window as any;
    scope.owner = createInkCompanionRenderer(document);
    scope.owner.select('cat');
    scope.initial = scope.owner.prepare();
    scope.preview = scope.owner.borrow();
    scope.preview.select('cat');
    scope.borrowed = scope.preview.prepare();
  });
  await expect.poll(() => !!release).toBe(true);
  await page.evaluate(() => {
    const scope = window as any;
    scope.owner.select('mystic-rock');
    scope.preview.dispose();
    scope.current = scope.owner.prepare();
  });
  release!();
  const result = await page.evaluate(async () => {
    const scope = window as any;
    const ready = await Promise.all([scope.initial, scope.borrowed, scope.current]);
    const snapshot = scope.owner.snapshot();
    scope.owner.dispose();
    return { ready, snapshot, disposed: scope.owner.snapshot() };
  });
  expect(result.ready).toEqual([false, false, true]);
  expect(result.snapshot).toMatchObject({
    selected: ['rock'],
    ready: true,
    borrowed: 0,
    decodedLoader: { pinned: 3 },
  });
  expect(result.disposed.decodedLoader.bytes).toBe(0);
});

test('selected companions, charms and local scenery cycle all stages within the low-memory pool', async ({
  page,
}, testInfo) => {
  test.setTimeout(60_000);
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const { createInkCharmRenderer } = await import('/src/rendering/figures/ink-charms.ts');
    const { createLocalEnvironmentRenderer } =
      await import('/src/rendering/environment/local-renderer.ts');
    const companion = createInkCompanionRenderer(document),
      charms = createInkCharmRenderer(document),
      scenery = createLocalEnvironmentRenderer(document);
    await charms.prepare();
    const snapshots = [];
    const partsTypes = ['cat', 'crow', 'shiba'];
    for (let cycle = 0; cycle < 3; cycle++)
      for (let stage = 0; stage < 9; stage++) {
        const type =
          cycle === 0
            ? 'nopet'
            : cycle === 1
              ? partsTypes[stage % partsTypes.length]!
              : 'mystic-rock';
        companion.select(type);
        const prepared = await companion.prepare();
        await scenery.prepare(stage);
        snapshots.push({
          cycle,
          stage,
          type,
          prepared,
          companion: companion.snapshot(),
          scenery: scenery.snapshot(),
        });
      }
    companion.dispose();
    charms.dispose();
    scenery.dispose();
    delete (navigator as any).deviceMemory;
    return { snapshots, disposed: companion.snapshot() };
  });
  expect(result.snapshots).toHaveLength(27);
  for (const snapshot of result.snapshots) {
    expect(snapshot.prepared).toBe(true);
    expect(snapshot.scenery.backend).toBe('layered');
    expect(snapshot.companion.decodedLoader.peakBytes).toBeLessThanOrEqual(256 * 1024 * 1024);
    expect(snapshot.companion.decodedLoader.budget).toBe(256 * 1024 * 1024);
    expect(snapshot.companion.selected.length).toBe(snapshot.type === 'nopet' ? 0 : 1);
  }
  expect(result.snapshots.at(-1)!.companion.decodedLoader.evictions).toBeGreaterThan(0);
  expect(result.disposed.decodedLoader.bytes).toBe(0);
  const path = testInfo.outputPath('companion-local-charm-budget.json');
  await writeFile(path, JSON.stringify(result, null, 2));
  await testInfo.attach('companion-local-charm-budget', { path, contentType: 'application/json' });
});

test('all companion poses preserve direct HTML colour and material decoding', async ({
  page,
}, testInfo) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const { assetMaterialCatalog } = await import('/src/rendering/asset-material-catalog.ts');
    const { registerMaterialSink, drawMaterialStamp, setSceneLighting } =
      await import('/src/rendering/scene-material.ts');
    const originalCreate = document.createElement.bind(document);
    const images: HTMLImageElement[] = [];
    document.createElement = ((...args: Parameters<typeof originalCreate>) => {
      const element = originalCreate(...args);
      if (args[0] === 'img') images.push(element as HTMLImageElement);
      return element;
    }) as typeof document.createElement;
    const owner = createInkCompanionRenderer(document);
    try {
      await owner.prepare();
    } finally {
      document.createElement = originalCreate;
    }
    const prepared = {
      images: images.length,
      decodedBytes: images.reduce(
        (bytes, image) => bytes + image.naturalWidth * image.naturalHeight * 4,
        0,
      ),
      ready: owner.ready,
    };
    const direct = new Map<string, any>();
    for (const name of ['companion-parts-atlas', 'mystic-rock']) {
      const pack = assetMaterialCatalog.find((pack: any) =>
        pack.sourcePath.endsWith(`/${name}.png`),
      )!;
      const sources: Record<string, HTMLImageElement> = {};
      for (const [kind, url] of Object.entries({
        colour: pack.source,
        normal: pack.maps.normal,
        surface: pack.maps.surface,
      })) {
        const image = document.createElement('img');
        image.src = url as string;
        await image.decode();
        sources[kind] = image;
      }
      direct.set(name, sources);
    }
    const canvases = [0, 1].map(() => {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 180;
      return canvas;
    });
    const painters = await Promise.all(canvases.map((canvas) => createPixiScenePainter(canvas)));
    const reference = new Proxy(painters[1]!, {
      get(target, key) {
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
      set(target, key, value) {
        return Reflect.set(target, key, value, target);
      },
    });
    let sources: Record<string, HTMLImageElement>;
    registerMaterialSink(reference, {
      lights: (lighting: any) => setSceneLighting(painters[1]!, lighting),
      draw: (stamp: any) =>
        drawMaterialStamp(painters[1]!, {
          ...stamp,
          texture: { ...stamp.texture, source: sources.colour },
          material: {
            ...stamp.material,
            normal: { ...stamp.material.normal, source: sources.normal },
            surface: { ...stamp.material.surface, source: sources.surface },
          },
        }),
    });
    const pixels = (canvas: HTMLCanvasElement) => {
      const gl = canvas.getContext('webgl2')!;
      const data = new Uint8Array(180 * 180 * 4);
      gl.readPixels(0, 0, 180, 180, gl.RGBA, gl.UNSIGNED_BYTE, data);
      return data;
    };
    const samples = [];
    for (const type of ['crow', 'shiba', 'cat', 'mystic-rock']) {
      sources = direct.get(type === 'mystic-rock' ? 'mystic-rock' : 'companion-parts-atlas');
      for (const reducedMotion of [false, true]) {
        for (const painter of painters) {
          painter.begin();
          painter.fillStyle = '#eee9df';
          painter.fillRect(0, 0, 180, 180);
        }
        const drawn = [
          owner.draw(type, painters[0]!, 90, 155, 105, 1.25, true, reducedMotion),
          owner.draw(type, reference, 90, 155, 105, 1.25, true, reducedMotion),
        ];
        painters.forEach((painter) => painter.flush());
        const a = pixels(canvases[0]!),
          b = pixels(canvases[1]!);
        let max = 0;
        for (let pixel = 0; pixel < a.length; pixel++)
          max = Math.max(max, Math.abs(a[pixel]! - b[pixel]!));
        samples.push({ type, reducedMotion, drawn, max });
      }
    }
    owner.dispose();
    painters.forEach((painter) => painter.dispose());
    for (const sources of direct.values())
      for (const image of Object.values(sources) as HTMLImageElement[])
        image.removeAttribute('src');
    return { prepared, samples };
  });
  expect(result.prepared).toEqual({ images: 6, decodedBytes: 37_735_212, ready: true });
  for (const sample of result.samples) {
    expect(sample.drawn).toEqual([true, true]);
    expect(sample.max).toBe(0);
  }
  const path = testInfo.outputPath('companion-html-parity.json');
  await writeFile(path, JSON.stringify(result, null, 2));
  await testInfo.attach('companion-html-parity', { path, contentType: 'application/json' });
});

test('selected companion warming covers first idle and active draws without uploading unused kits', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const results = await page.evaluate(async () => {
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const rows = [];
    for (const type of ['shiba', 'cat', 'crow', 'mystic-rock']) {
      const owner = createInkCompanionRenderer(document);
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 160;
      const painter = await createPixiScenePainter(canvas);
      const signal = new AbortController().signal;
      try {
        const uploads = await owner.prepareUploads(type, signal);
        const ready = !!uploads && (await painter.warmScene(uploads, signal));
        const snapshot = owner.snapshot();
        const gl = canvas.getContext('webgl2')!;
        const upload = gl.texImage2D;
        let firstUse = 0;
        gl.texImage2D = (...args: any[]) => {
          firstUse++;
          return Reflect.apply(upload, gl, args);
        };
        const drawn: boolean[] = [];
        try {
          for (const active of [false, true]) {
            painter.begin();
            drawn.push(owner.draw(type, painter, 80, 145, 75, 1.25, active, false));
            painter.flush();
          }
        } finally {
          gl.texImage2D = upload;
        }
        owner.dispose();
        rows.push({ type, ready, snapshot, drawn, firstUse, disposed: painter.sourceTextureCount });
      } finally {
        owner.dispose();
        painter.dispose();
      }
    }
    const empty = createInkCompanionRenderer(document);
    const none = await empty.prepareUploads('nopet', new AbortController().signal);
    const unloaded = empty.snapshot().decodedLoader;
    empty.dispose();
    return { rows, none: none?.length, unloaded };
  });
  for (const row of results.rows) {
    expect(row.ready).toBe(true);
    expect(row.snapshot.selected).toEqual([row.type === 'mystic-rock' ? 'rock' : 'parts']);
    expect(row.snapshot.decodedLoader.pinned).toBe(3);
    expect(row.drawn).toEqual([true, true]);
    expect(row.firstUse).toBe(0);
    expect(row.disposed).toBe(0);
  }
  expect(results.none).toBe(0);
  expect(results.unloaded.pinned).toBe(0);
  expect(results.unloaded.bytes).toBe(0);
});

test('compact companion planes are shared and survive raw eviction until the final borrower leaves', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createInkCompanionRenderer } = await import('/src/rendering/figures/ink-companions.ts');
    const { trimMainImages } = await import('/src/platform/main-images.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const owner = createInkCompanionRenderer(document);
    owner.select('cat');
    const a = owner.borrow(),
      b = owner.borrow();
    a.select('cat', 'mystic-rock');
    b.select('cat');
    const prepared = await owner.prepare();
    const snapshot = owner.snapshot();
    const shared = b.sources().every((source) => a.sources().includes(source));
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 180;
    const painter = await createPixiScenePainter(canvas);
    try {
      const draw = () => {
        painter.begin();
        painter.fillStyle = '#eee9df';
        painter.fillRect(0, 0, 180, 180);
        owner.draw('cat', painter, 50, 165, 60, 1.25, true, false);
        owner.draw('mystic-rock', painter, 130, 165, 60, 1.25, true, false);
        painter.flush();
        const gl = canvas.getContext('webgl2')!;
        const pixels = new Uint8Array(180 * 180 * 4);
        gl.readPixels(0, 0, 180, 180, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        return pixels;
      };
      draw();
      const before = draw();
      trimMainImages(document, 1024 * 1024 * 1024);
      const evicted = owner.snapshot().decodedLoader;
      const after = draw();
      let difference = 0;
      for (let i = 0; i < before.length; i++)
        difference = Math.max(difference, Math.abs(before[i]! - after[i]!));
      owner.select('nopet');
      a.dispose();
      const remaining = owner.snapshot().selected;
      b.dispose();
      const released = owner.snapshot().selected;
      const nativeSources = painter.sourceTextureCount;
      return {
        prepared,
        snapshot,
        shared,
        evicted,
        difference,
        remaining,
        released,
        nativeSources,
      };
    } finally {
      a.dispose();
      b.dispose();
      owner.dispose();
      painter.dispose();
    }
  });
  expect(result.prepared).toBe(true);
  expect(result.snapshot.compact).toBe(true);
  expect(result.snapshot.partPixels).toBeLessThan(3_300_000);
  expect(result.snapshot.decodedLoader.pinned).toBe(0);
  expect(result.shared).toBe(true);
  expect(result.evicted.bytes).toBe(0);
  expect(result.difference).toBe(0);
  expect(result.remaining).toEqual(['parts']);
  expect(result.released).toEqual([]);
  expect(result.nativeSources).toBe(0);
});
