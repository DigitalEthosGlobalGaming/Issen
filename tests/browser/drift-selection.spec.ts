import { test, expect } from '@playwright/test';

test('scene-specific drift preserves held leaves, suppresses superseded sets and bounds active pins', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  await page.evaluate(async () => {
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createLeafMotion } = await import('/src/rendering/scene/leaf-motion.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const g = await createTestDrawing(canvas);
    const owner = createDriftRenderer(document, () => g);
    await owner.prepare(0);
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
    const draw = (leaves: any[]) => {
      g.begin();
      owner.drawLeaves(g, {
        leaves,
        front: false,
        motion,
        spriteMotion: true,
        scale: 1,
        width: 96,
        height: 96,
      });
      return Array.from(g.getImageData(0, 0, 96, 96).data);
    };
    draw([leaf]);
    const stable = draw([leaf]);
    (window as any).__selectedDrift = {
      owner,
      g,
      motion,
      leaf,
      draw,
      stable,
      initial: owner.snapshot(),
    };
  });
  await page.evaluate(() => {
    const d = (window as any).__selectedDrift,
      warm = d.g.warmScene.bind(d.g);
    let calls = 0;
    d.g.warmScene = async (uploads: any, signal: AbortSignal) => {
      if (++calls === 1) {
        d.entered = true;
        await new Promise<void>((resolve) => {
          d.release = resolve;
        });
      }
      return warm(uploads, signal);
    };
  });
  await page.evaluate(() => {
    const d = (window as any).__selectedDrift;
    d.incoming = d.owner.prepare(4);
  });
  await page.waitForFunction(() => (window as any).__selectedDrift.entered);
  const pending = await page.evaluate(() => {
    const d = (window as any).__selectedDrift;
    const before = d.draw([{ ...d.leaf, sprite: 'debris.splinter' }]);
    let changes = 0;
    for (let i = 0; i < before.length; i++) if (before[i] !== d.stable[i]) changes++;
    d.motion.advance(0.1, 0.1, 1);
    const after = d.draw([{ ...d.leaf, sprite: 'debris.splinter' }]);
    let motionChanges = 0;
    for (let i = 0; i < after.length; i++) if (after[i] !== before[i]) motionChanges++;
    d.latest = d.owner.prepare(9);
    return { initial: d.initial, pending: d.owner.snapshot(), changes, motionChanges };
  });
  expect(pending.initial).toMatchObject({
    selected: ['leaves', 'petals'],
    pinned: 2,
    pinnedBytes: 4194304,
    ready: true,
  });
  expect(pending.pending.selected).toEqual(['leaves', 'petals']);
  expect(pending.pending.requested).toEqual(['fire']);
  expect(pending.pending.ready).toBe(false);
  expect(pending.changes).toBe(0);
  expect(pending.motionChanges).toBeGreaterThan(0);
  await page.evaluate(() => (window as any).__selectedDrift.release());
  const done = await page.evaluate(async () => {
    const d = (window as any).__selectedDrift;
    const [stale, ready] = await Promise.all([d.incoming, d.latest]);
    d.draw([{ ...d.leaf, sprite: 'fire.spectral-flame' }]);
    const fire = d.owner.snapshot(),
      textures = d.g.sourceTextureCount;
    const rows = [];
    for (let stage = 0; stage < 10; stage++) {
      await d.owner.prepare(stage);
      rows.push(d.owner.snapshot());
    }
    d.owner.dispose();
    d.g.dispose();
    return { stale, ready, fire, textures, rows, final: d.owner.snapshot() };
  });
  expect(done.stale).toBe(false);
  expect(done.ready).toBe(true);
  expect(done.fire).toMatchObject({
    selected: ['fire'],
    pinned: 2,
    pinnedBytes: 4194304,
    ready: true,
  });
  expect(done.textures).toBe(2);
  expect(done.rows.every((r) => r.ready && r.pinned === 2 && r.bytes <= r.budget)).toBe(true);
  expect(done.rows[0]).toMatchObject({ selected: ['leaves', 'petals'], pinned: 2 });
  expect(done.final.bytes).toBe(0);
});

test('runtime startup prepares only the current drift mixture', async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator, 'connection', {
      value: { saveData: true, addEventListener() {}, removeEventListener() {} },
    }),
  );
  const blocked: string[] = [];
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.route(/drift-(debris|fire)-atlas.*\.webp/, (route) => {
    if (route.request().resourceType() === 'image' || route.request().resourceType() === 'fetch') {
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
        'window.__driftSelectedStartup={presentation,frames}; artworkReady = true;',
      ),
    });
  });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__driftSelectedStartup);
  const snapshot = await page.evaluate(() => {
    const d = (window as any).__driftSelectedStartup;
    d.frames.frameLoop.stop();
    return d.presentation.driftRenderer.snapshot();
  });
  expect(snapshot.selected).toEqual(['leaves', 'petals']);
  expect(snapshot.ready).toBe(true);
  expect(blocked).toEqual([]);
});

test('runtime scene readiness waits for drift publication', async ({ page }) => {
  await page.route(/https:\/\/fonts\.(googleapis|gstatic)\.com\//, (route) => route.abort());
  await page.route('**/src/game.ts*', async (route) => {
    const response = await route.fetch();
    await route.fulfill({
      response,
      body: (await response.text()).replace(
        'artworkReady = true;',
        'window.__driftSelection = presentation; artworkReady = true;',
      ),
    });
  });
  await page.goto('/');
  await page.waitForFunction(() => (window as any).__driftSelection);
  await page.locator('#title .t-k').click({ clickCount: 3 });
  const canvas = page.locator('#c');
  await expect(canvas).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await page.evaluate(() => {
    const d = (window as any).__driftSelection,
      prepare = d.driftRenderer.prepare.bind(d.driftRenderer);
    d.driftRenderer.prepare = async (stage: number) => {
      if (stage === 1 && !d.held) {
        d.held = true;
        await new Promise<void>((resolve) => {
          d.release = resolve;
        });
      }
      return prepare(stage);
    };
  });
  await page.getByRole('button', { name: 'Next scene', exact: true }).click();
  await page.waitForFunction(() => (window as any).__driftSelection.held);
  await expect(canvas).toHaveAttribute('data-scene-state', 'loading');
  await page.evaluate(() => (window as any).__driftSelection.release());
  await expect(canvas).toHaveAttribute('data-scene-state', 'ready', { timeout: 15000 });
  await expect(canvas).toHaveAttribute('data-scene', '1');
});
