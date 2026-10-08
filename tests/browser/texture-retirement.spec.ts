import { expect, test } from '@playwright/test';

for (const kind of ['mesh', 'pattern'])
  test(`expiry detaches Pixi cached ${kind} source and sampler before destruction`, async ({
    page,
  }) => {
    const warnings: string[] = [];
    page.on('console', (message) => {
      if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
        warnings.push(message.text());
    });
    await page.goto('/privacy/index.html');
    const counts = await page.evaluate(async (kind) => {
      const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 32;
      const source = document.createElement('canvas');
      source.width = source.height = 16;
      source.getContext('2d')!.fillRect(0, 0, 16, 16);
      const painter = await createPixiScenePainter(canvas);
      painter.begin();
      if (kind === 'mesh') {
        painter.drawImage(source, 0, 0);
        // Exercise Pixi's native default mesh adaptor, separate from the custom lookup shader.
        Reflect.set(painter.root.children[0]!, 'shader', null);
        Reflect.set(Reflect.get(painter.root.children[0]!, 'geometry'), 'batchMode', 'no-batch');
      } else {
        painter.fillStyle = painter.createPattern(source, 'repeat')!;
        painter.fillRect(0, 0, 32, 32);
      }
      painter.flush();
      const before = painter.sourceTextureCount;
      for (let frame = 0; frame < 121; frame++) {
        painter.begin();
        painter.fillStyle = '#fff';
        painter.fillRect(0, 0, 32, 32);
        painter.flush();
      }
      const expired = painter.sourceTextureCount;
      painter.begin();
      painter.drawImage(source, 0, 0);
      painter.flush();
      const reused = painter.sourceTextureCount;
      painter.dispose();
      return { before, expired, reused, disposed: painter.sourceTextureCount };
    }, kind);
    expect(counts).toEqual({ before: 1, expired: 0, reused: 1, disposed: 0 });
    expect(warnings).toEqual([]);
  });

test('closing composed pixels immediately releases colour/data/crop GPU consumers independently', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { SceneTextureStore } = await import('/src/rendering/pixi/texture-store.ts');
    const { closeLayers } = await import('/src/rendering/environment/worker-types.ts');
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 12;
    canvas.getContext('2d')!.fillRect(0, 0, 12, 12);
    const bitmap = await createImageBitmap(canvas);
    const a = new SceneTextureStore(),
      b = new SceneTextureStore();
    const colour = a.get({ source: bitmap, revision: 0 });
    const data = a.getData({ source: bitmap, revision: 0 });
    const crop = b.getFrame(bitmap, 0, 0, 0, 6, 6);
    const sources = [colour.source, data.source, crop.source];
    a.get({ source: canvas, revision: 0 });
    b.get({ source: canvas, revision: 0 });
    const before = [a.size, b.size];
    closeLayers([{ colour: bitmap }]);
    const retired = {
      counts: [a.size, b.size],
      textures: [colour.destroyed, data.destroyed, crop.destroyed],
      sources: sources.map((source) => source.destroyed),
      width: bitmap.width,
    };
    a.dispose();
    const peer = b.get({ source: canvas, revision: 0 });
    const peerReady = !peer.destroyed && !peer.source.destroyed;
    b.dispose();
    return { before, retired, peerReady, disposed: [a.size, b.size] };
  });
  expect(result.before).toEqual([3, 2]);
  expect(result.retired).toEqual({
    counts: [1, 1],
    textures: [true, true, true],
    sources: [true, true, true],
    width: 0,
  });
  expect(result.peerReady).toBe(true);
  expect(result.disposed).toEqual([0, 0]);
});

test('worker scene replacement retires uploaded completed maps before the next draw', async ({
  page,
}) => {
  const warnings: string[] = [];
  page.on('console', (message) => {
    if (/destroyed while still bound|feedback loop|GL_INVALID_OPERATION/i.test(message.text()))
      warnings.push(message.text());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createEnvironmentRenderer } = await import('/src/rendering/environment/index.ts');
    const { createPixiScenePainter } = await import('/src/rendering/pixi/scene-painter.ts');
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    const painter = await createPixiScenePainter(canvas);
    const owner = createEnvironmentRenderer(document);
    const frame = {
      width: 180,
      height: 120,
      dpr: 1,
      time: 0,
      stage: 1,
      stageSeed: 424242,
      lowQuality: true,
      reducedMotion: true,
      reducedFlashes: true,
    };
    await owner.compose(frame);
    painter.begin();
    owner.draw(painter, frame);
    painter.flush();
    const before = painter.sourceTextureCount;
    await owner.compose({ ...frame, stage: 2 });
    const replaced = painter.sourceTextureCount;
    painter.begin();
    owner.draw(painter, { ...frame, stage: 2 });
    painter.flush();
    const after = painter.sourceTextureCount;
    owner.dispose();
    const disposed = painter.sourceTextureCount;
    painter.dispose();
    return { before, replaced, after, disposed, worker: owner.snapshot().worker };
  });
  expect(result.before).toBe(12);
  expect(result.replaced).toBe(0);
  expect(result.after).toBe(12);
  expect(result.disposed).toBe(0);
  expect(warnings).toEqual([]);
});
