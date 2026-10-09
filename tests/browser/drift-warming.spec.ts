import { test, expect } from '@playwright/test';

test('drift warms and retains the selected family until disposal', async ({ page }) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const { createLeafMotion } = await import('/src/rendering/scene/leaf-motion.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const g = await createTestDrawing(canvas),
      gl = canvas.getContext('webgl2')!;
    let uploads = 0,
      links = 0;
    const native = gl.texImage2D.bind(gl),
      link = gl.linkProgram.bind(gl);
    gl.texImage2D = ((...args: any[]) => {
      if (args.at(-1) instanceof HTMLImageElement) uploads++;
      return (native as any)(...args);
    }) as any;
    gl.linkProgram = (p) => {
      links++;
      link(p);
    };
    const owner = createDriftRenderer(document, () => g),
      motion = createLeafMotion();
    const leaf = {
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
    const started = performance.now();
    await owner.prepare(0);
    const prepareMs = performance.now() - started;
    const prepared = { uploads, links, textures: g.sourceTextureCount };
    uploads = links = 0;
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
    g.getImageData(0, 0, 96, 96);
    const first = { uploads, links, textures: g.sourceTextureCount };
    for (let i = 0; i < 150; i++) {
      g.begin();
      g.flush();
    }
    const idleTextures = g.sourceTextureCount;
    owner.dispose();
    g.begin();
    const disposedTextures = g.sourceTextureCount;
    g.dispose();
    return { prepareMs, prepared, first, idleTextures, disposedTextures };
  });
  expect(result.disposedTextures).toBe(0);
  expect(result.prepared.uploads).toBe(2);
  expect(result.prepared.textures).toBe(2);
  expect(result.first).toMatchObject({ uploads: 0, links: 0, textures: 2 });
  expect(result.idleTextures).toBe(2);
});

test('superseded and disposed drift warming aborts hidden uploads and retires pending sources', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const g = await createTestDrawing(canvas),
      warm = g.warmScene.bind(g);
    let calls = 0,
      entered = false;
    g.warmScene = async (uploads, signal) => {
      if (++calls === 2) {
        await g.warmTextures(uploads.slice(0, 2), signal);
        Object.defineProperty(document, 'hidden', { value: true, configurable: true });
        entered = true;
      }
      return warm(uploads, signal);
    };
    const owner = createDriftRenderer(document, () => g);
    await owner.prepare(0);
    const initial = owner.snapshot();
    const stale = owner.prepare(9);
    const deadline = performance.now() + 10000;
    while (!entered && performance.now() < deadline)
      await new Promise((resolve) => setTimeout(resolve, 10));
    if (!entered) throw new Error('Incoming warming did not start');
    const hidden = owner.snapshot(),
      latest = owner.prepare(4);
    owner.dispose();
    const results = await Promise.all([stale, latest]);
    delete (document as any).hidden;
    document.dispatchEvent(new Event('visibilitychange'));
    g.begin();
    const remaining = g.sourceTextureCount,
      final = owner.snapshot();
    g.dispose();
    return { initial, hidden, results, remaining, final };
  });
  expect(result.initial).toMatchObject({ ready: true, selected: ['leaves', 'petals'] });
  expect(result.hidden).toMatchObject({
    ready: false,
    selected: ['leaves', 'petals'],
    requested: ['fire'],
  });
  expect(result.results).toEqual([false, false]);
  expect(result.remaining).toBe(0);
  expect(result.final.bytes).toBe(0);
});

test('failed drift warming retains the old set and can retry without leaked incoming pins', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { createTestDrawing } = await import('/tests/browser/fixtures/native-drawing.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const g = await createTestDrawing(canvas),
      warm = g.warmScene.bind(g);
    let calls = 0;
    g.warmScene = async (uploads, signal) => {
      if (++calls === 2) {
        await g.warmTextures(uploads, signal);
        return false;
      }
      return warm(uploads, signal);
    };
    const owner = createDriftRenderer(document, () => g);
    await owner.prepare(0);
    const failed = await owner.prepare(9),
      snapshot = owner.snapshot();
    g.begin();
    const failedTextures = g.sourceTextureCount;
    const retried = await owner.prepare(9);
    g.begin();
    const active = owner.snapshot(),
      textures = g.sourceTextureCount;
    owner.dispose();
    g.begin();
    const remaining = g.sourceTextureCount;
    g.dispose();
    return { failed, snapshot, failedTextures, retried, active, textures, remaining };
  });
  expect(result.failed).toBe(false);
  expect(result.snapshot).toMatchObject({
    ready: false,
    selected: ['leaves', 'petals'],
    pinned: 2,
  });
  expect(result.failedTextures).toBe(2);
  expect(result.retried).toBe(true);
  expect(result.active).toMatchObject({ ready: true, selected: ['fire'], pinned: 2 });
  expect(result.textures).toBe(2);
  expect(result.remaining).toBe(0);
});
