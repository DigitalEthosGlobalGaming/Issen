import { expect, test } from '@playwright/test';

test('drift owners share pending inputs and retire only their consuming painter', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  let release!: () => void;
  const gate = new Promise<void>((resolve) => {
    release = resolve;
  });
  const held: string[] = [];
  await page.route(/drift-.*\.webp/, async (route) => {
    held.push(route.request().url());
    await gate;
    await route.continue();
  });
  await page.evaluate(async () => {
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { createMainImageOwner } = await import('/src/platform/main-images.ts');
    const observer = createMainImageOwner(document),
      cancelled = createDriftRenderer(document),
      survivor = createDriftRenderer(document);
    const pending = Promise.all([cancelled.prepare(), survivor.prepare()]);
    (window as any).__driftOwners = { observer, cancelled, survivor, pending };
  });
  await expect.poll(() => held.length).toBe(1);
  const waiting = await page.evaluate(() => {
    const d = (window as any).__driftOwners;
    d.cancelled.dispose();
    return { pool: d.observer.snapshot(), ready: d.cancelled.ready };
  });
  expect(waiting.pool).toMatchObject({ queued: 4, decoded: 0, pinned: 0 });
  expect(waiting.ready).toBe(false);
  release();
  const result = await page.evaluate(async () => {
    const d = (window as any).__driftOwners;
    await d.pending;
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createLeafMotion } = await import('/src/rendering/scene/leaf-motion.ts');
    const peer = createDriftRenderer(document);
    await peer.prepare();
    const shared = d.observer.snapshot();
    const gs = [];
    for (let i = 0; i < 2; i++) {
      const c = document.createElement('canvas');
      c.width = c.height = 96;
      gs.push(await createTestDrawing(c));
    }
    const motion = createLeafMotion(),
      leaf = {
        x: 48,
        y: 48,
        z: 1,
        s: 20,
        rot: 0.7,
        vr: 1,
        fl: 0.3,
        vf: 1,
        vy: 1,
        ph: 1,
        col: '#322321',
        sprite: 'leaves.willow',
      };
    motion.register(leaf);
    const draw = (owner: any, g: any) => {
      g.begin();
      owner.drawLeaves(g, {
        leaves: [leaf],
        front: false,
        motion,
        spriteMotion: true,
        scale: 1,
        width: 96,
        height: 96,
      });
      return g.getImageData(0, 0, 96, 96).data;
    };
    draw(d.survivor, gs[0]);
    // The saved original changes two channels on its first repeat; compare settled frames.
    draw(peer, gs[1]);
    const before = draw(peer, gs[1]);
    const textures = gs.map((g) => g.sourceTextureCount);
    d.survivor.dispose();
    d.survivor.dispose();
    const retired = gs.map((g) => g.sourceTextureCount);
    const still = d.observer.snapshot(),
      after = draw(peer, gs[1]);
    let changes = 0;
    for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) changes++;
    const ready = { cancelled: d.cancelled.ready, survivor: d.survivor.ready, peer: peer.ready };
    peer.dispose();
    const unpinned = d.observer.snapshot();
    d.observer.dispose();
    const final = d.observer.snapshot();
    await d.cancelled.prepare();
    const cold = createDriftRenderer(document);
    cold.dispose();
    await cold.prepare();
    const afterCold = cold.snapshot();
    gs.forEach((g) => g.dispose());
    return { shared, textures, retired, still, changes, ready, unpinned, final, afterCold };
  });
  expect(result.shared.decoded).toBe(13);
  expect(result.shared.pinned).toBe(13);
  expect(result.shared.pinnedBytes).toBe(81823976);
  expect(result.textures).toEqual([13, 13]);
  expect(result.retired).toEqual([0, 13]);
  expect(result.still.pinned).toBe(13);
  expect(result.changes).toBe(0);
  expect(result.ready).toEqual({ cancelled: false, survivor: false, peer: true });
  expect(result.unpinned.pinned).toBe(0);
  expect(result.final.bytes).toBe(0);
  expect(result.afterCold.bytes).toBe(0);
});

test('runtime prepares drift without direct atlas image requests', async ({ page }) => {
  const blocked: string[] = [],
    errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.route(/drift-.*\.webp/, (route) => {
    if (route.request().resourceType() === 'image') {
      blocked.push(route.request().url());
      return route.abort();
    }
    return route.continue();
  });
  await page.route('**/src/game.ts*', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__driftRuntime = { presentation, frames }; artworkReady = true;',
      ),
    });
  });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__driftRuntime);
  expect(
    await page.evaluate(() => {
      const d = (window as any).__driftRuntime;
      d.frames.frameLoop.stop();
      return d.presentation.driftRenderer.ready;
    }),
  ).toBe(true);
  expect(blocked).toEqual([]);
  expect(errors).toEqual([]);
});
