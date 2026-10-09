import { expect, test } from '@playwright/test';

test('compact outfit previews share finite backing after raw input eviction', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    Object.defineProperty(navigator, 'deviceMemory', { value: 2, configurable: true });
    const { createOutfitKit } = await import('/src/rendering/figures/outfit-kit.ts');
    const { trimMainImages } = await import('/src/platform/main-images.ts');
    const { documentPixelMemory } = await import('/src/platform/pixel-memory.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 120;
    canvas.height = 120;
    const drawing = await createTestDrawing(canvas),
      kit = createOutfitKit(document);
    kit.select('kasa');
    await kit.prepare();
    const first = documentPixelMemory(document).snapshot().canvasBytes;
    const a = kit.borrow(),
      b = kit.borrow();
    a.select('monk');
    b.select('kasa');
    await Promise.all([a.prepare(), b.prepare()]);
    const shared = documentPixelMemory(document).snapshot().canvasBytes;
    kit.select('sumi');
    const draw = () => {
      drawing.begin();
      drawing.save();
      drawing.translate(60, 110);
      drawing.scale(90, 90);
      kit.draw(drawing, 'head', {
        x: 0,
        y: 0,
        h: 1,
        fog: 0,
        robeId: 'monk',
        d: makeFig(1),
        pose: EPOSE.left,
      });
      drawing.restore();
      drawing.flush();
      return canvas.toDataURL();
    };
    const before = draw();
    trimMainImages(document, Infinity);
    const evicted = kit.snapshot(),
      after = draw();
    a.dispose();
    const peer = kit.snapshot();
    b.dispose();
    drawing.begin();
    drawing.flush();
    const released = kit.snapshot(),
      native = drawing.sourceTextureCount;
    kit.dispose();
    drawing.dispose();
    return { first, shared, exact: before === after, evicted, peer, released, native };
  });
  expect(result.shared).toBe(result.first);
  expect(result.exact).toBe(true);
  expect(result.evicted).toMatchObject({
    compact: true,
    loaded: ['headwear'],
    decodedLoader: { bytes: 0, pinned: 0 },
  });
  expect(result.evicted.partPixels).toBeGreaterThan(0);
  expect(result.evicted.partPixels).toBeLessThanOrEqual(4 * 256 * 256 * 3);
  expect(result.peer.loaded).toEqual(['headwear']);
  expect(result.released.loaded).toEqual([]);
  expect(result.native).toBe(0);
});

test('outfit primary and preview selections share pins and release only unused families', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createOutfitKit } = await import('/src/rendering/figures/outfit-kit.ts');
    const kit = createOutfitKit(document);
    kit.select('sumi');
    await kit.prepare();
    const empty = kit.snapshot();
    kit.select('oni');
    await kit.prepare();
    const masks = kit.snapshot();
    const a = kit.borrow(),
      b = kit.borrow();
    a.select('kasa');
    b.select('komuso');
    await Promise.all([a.prepare(), b.prepare()]);
    const previews = kit.snapshot();
    a.dispose();
    a.dispose();
    const released = kit.snapshot();
    kit.select('sumi');
    const primary = kit.snapshot();
    b.dispose();
    const unpinned = kit.snapshot();
    kit.dispose();
    kit.dispose();
    const disposed = kit.snapshot();
    return { empty, masks, previews, released, primary, unpinned, disposed };
  });
  expect(result.empty).toMatchObject({ loaded: [], decodedLoader: { pinned: 0, bytes: 0 } });
  expect(result.masks).toMatchObject({
    loaded: ['masks'],
    decodedLoader: { pinned: 3, pinnedBytes: 18870192 },
  });
  expect(result.previews.loaded.sort()).toEqual(['headwear', 'masks', 'special']);
  expect(result.previews.decodedLoader).toMatchObject({
    decoded: 9,
    pinned: 9,
    pinnedBytes: 56610576,
  });
  expect(result.released.loaded.sort()).toEqual(['masks', 'special']);
  expect(result.released.decodedLoader.pinned).toBe(6);
  expect(result.primary.loaded).toEqual(['special']);
  expect(result.primary.decodedLoader.pinned).toBe(3);
  expect(result.unpinned).toMatchObject({
    loaded: [],
    decodedLoader: { pinned: 0, bytes: 56610576 },
  });
  expect(result.disposed.decodedLoader).toMatchObject({ decoded: 0, bytes: 0, pinned: 0 });
});

test('runtime starts without unused outfit maps and releases borrowed preview families on close', async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  const outfitUrls =
    /(?:player-mask-atlas|player-special-headwear-atlas|armour-plates-atlas|outfit-headwear-atlas|outfit-cloth-atlas).*\.webp/;
  await page.route(outfitUrls, (route) =>
    route.request().resourceType() === 'script' ? route.continue() : route.abort(),
  );
  await page.route('**/src/game.ts*', async (route) => {
    const response = await route.fetch();
    const body = (await response.text()).replace(
      'artworkReady = true;',
      'window.__outfitRuntime = { foundation, presentation, controls, frames }; artworkReady = true;',
    );
    await route.fulfill({ response, body });
  });
  await page.goto('/');
  await page.waitForFunction(() => !!(window as any).__outfitRuntime);
  const initial = await page.evaluate(() => {
    const { foundation, frames } = (window as any).__outfitRuntime;
    frames.frameLoop.stop();
    return foundation.browser.inkPlayer.snapshot().outfits;
  });
  expect(initial).toMatchObject({ loaded: [], equipped: [], borrowed: 0 });
  await page.unroute(outfitUrls);
  const result = await page.evaluate(async () => {
    const { foundation: f, presentation: p, controls } = (window as any).__outfitRuntime;
    const owner = f.browser.inkPlayer;
    f.profile.profileEquipment.EQ.robe = 'oni';
    p.figureRenderer();
    await owner.prepare();
    const equipped = owner.snapshot().outfits;
    controls.openPanel('armory');
    const frame = p.previewFrame('mono', false);
    controls.preview.draw({ ...frame, appearance: { ...frame.appearance, robeId: 'komuso' } });
    await owner.prepare();
    await new Promise((resolve) => setTimeout(resolve, 0));
    const preview = owner.snapshot().outfits;
    controls.closePanel();
    const closed = owner.snapshot().outfits;
    f.profile.profileEquipment.EQ.robe = 'sumi';
    p.figureRenderer();
    const cleared = owner.snapshot().outfits;
    return { equipped, preview, closed, cleared };
  });
  expect(result.equipped).toMatchObject({ loaded: ['masks'], equipped: ['masks'], borrowed: 0 });
  expect(result.preview.loaded.sort()).toEqual(['masks', 'special']);
  expect(result.preview.borrowed).toBe(1);
  expect(result.closed).toMatchObject({ loaded: ['masks'], equipped: ['masks'], borrowed: 0 });
  expect(result.cleared).toMatchObject({ loaded: [], equipped: [], borrowed: 0 });
  expect(errors).toEqual([]);
});

test('outfit selection cancellation cannot publish a stale family or resurrect disposal', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createOutfitKit } = await import('/src/rendering/figures/outfit-kit.ts');
    const kit = createOutfitKit(document);
    kit.select('oni');
    const old = kit.prepare();
    kit.select('kasa');
    const next = kit.prepare();
    const stale = await old;
    const ready = await next;
    const selected = kit.snapshot();
    kit.select('komuso');
    const pending = kit.prepare();
    kit.dispose();
    const cancelled = await pending;
    const disposed = kit.snapshot();
    return { stale, ready, selected, cancelled, disposed };
  });
  expect(result.stale).toBe(false);
  expect(result.ready).toBe(true);
  expect(result.selected).toMatchObject({
    loaded: ['headwear'],
    decodedLoader: { pinned: 3, pinnedBytes: 18870192 },
  });
  expect(result.cancelled).toBe(false);
  expect(result.disposed).toMatchObject({
    loaded: [],
    decodedLoader: { bytes: 0, pinned: 0, queued: 0 },
  });
});

test('changing an outfit preserves its queued native frame and retires only that painter', async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/feedback loop|GL_INVALID_OPERATION|destroyed while still bound/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createInkPlayerRenderer } = await import('/src/rendering/figures/ink-player.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { makeFig, EPOSE } = await import('/src/shared/figure-model.ts');
    const { createPalette } = await import('/src/rendering/palette.ts');
    const owners = [createInkPlayerRenderer(document), createInkPlayerRenderer(document)];
    owners.forEach((o) => o.select('oni'));
    await Promise.all(owners.map((o) => o.prepare()));
    const painters = await Promise.all(
      owners.map(() => {
        const c = document.createElement('canvas');
        c.width = 180;
        c.height = 160;
        return createTestDrawing(c);
      }),
    );
    const env = {
      time: 1.25,
      wind: 0.2,
      width: 180,
      height: 160,
      palette: (fog: number) => createPalette().fog(fog, [100, 110, 120]),
      reducedMotion: true,
      reducedFlashes: true,
    };
    const draw = (index: number) => {
      const g = painters[index];
      g.save();
      g.translate(90, 125);
      g.scale(-95, 95);
      const ready = owners[index].draw(
        g,
        { back: true, robeId: 'oni', d: makeFig(43), pose: EPOSE.guard, fog: 0 },
        env,
      );
      g.restore();
      if (!ready) throw Error('Missing outfit');
    };
    const read = (index: number) => painters[index].getImageData(0, 0, 180, 160).data;
    draw(0);
    read(0);
    painters[0].begin();
    draw(0);
    const expected = read(0);
    draw(1);
    read(1);
    painters[1].begin();
    draw(1);
    const peerExpected = read(1);
    painters[0].begin();
    draw(0);
    owners[0].select('sumi');
    const pending = painters[0].sourceRetirementSnapshot;
    const queued = read(0),
      repeat = read(0);
    painters[1].begin();
    draw(1);
    const peer = read(1);
    const diff = (a: Uint8ClampedArray, b: Uint8ClampedArray) =>
      a.reduce((m, v, i) => Math.max(m, Math.abs(v - b[i]!)), 0);
    painters[0].begin();
    const boundary = painters[0].sourceRetirementSnapshot;
    owners[0].dispose();
    const firstDisposed = painters[0].sourceTextureCount;
    owners[1].dispose();
    const final = painters.map((p) => p.sourceTextureCount);
    painters.forEach((p) => p.dispose());
    return {
      pending,
      boundary,
      queuedMax: diff(expected, queued),
      replayMax: diff(queued, repeat),
      peerMax: diff(peerExpected, peer),
      firstDisposed,
      final,
    };
  });
  expect(result.pending.sources).toBeGreaterThan(0);
  expect(result.boundary).toEqual({ sources: 0, bytes: 0 });
  expect(result.queuedMax).toBe(0);
  expect(result.replayMax).toBe(0);
  expect(result.peerMax).toBe(0);
  expect(result.firstDisposed).toBe(0);
  expect(result.final).toEqual([0, 0]);
  expect(warnings).toEqual([]);
});
