import { test, expect } from '@playwright/test';

test('only stage sprites remain, including legacy saves and every cinematic stage', async ({
  page,
}) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.addInitScript(() =>
    localStorage.setItem('issen.settings', JSON.stringify({ version: 1, debrisStyle: 'original' })),
  );
  await page.goto('/');
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites', { timeout: 30000 });
  await page.locator('#bOptions').click();
  await page.getByRole('button', { name: 'Display and Accessibility', exact: false }).click();
  await expect(page.getByLabel('Drifting leaves', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites', { timeout: 30000 });
  await expect(page.locator('.startup-loading')).toHaveCount(0, { timeout: 30000 });
  await page.locator('#title .t-k').click({ clickCount: 3 });
  await expect(page.locator('#cinematic')).toBeVisible();
  await expect(page.getByLabel('Preview debris')).toHaveCount(0);
  for (let stage = 0; stage < 10; stage++) {
    await expect(page.locator('#cinematic')).toHaveAttribute('data-scene', String(stage));
    await expect(page.locator('#c')).toHaveAttribute('data-debris', 'sprites');
    if (stage < 9) await page.getByRole('button', { name: 'Next scene' }).click();
  }
  await page.getByRole('button', { name: 'Exit', exact: true }).click();
  expect(errors).toEqual([]);
});

test('all 32 packed drift sprites paint and overlapping owners retain their pages', async ({
  page,
}) => {
  const requests: string[] = [];
  page.on('request', (request) => requests.push(request.url()));
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { DRIFT_SPRITES } = await import('/src/rendering/scene/drift-catalog.ts');
    const { packedDrift } = await import('/src/rendering/scene/packed-drift.ts');
    const renderer = createDriftRenderer();
    await renderer.prepare();
    const initial = packedDrift(document).snapshot();
    const preview = createDriftRenderer();
    await preview.prepare();
    const overlapping = packedDrift(document).snapshot();
    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 96;
    const g = canvas.getContext('2d', { willReadFrequently: true })!;
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
    };
    function paint(sprite?: string) {
      g.clearRect(0, 0, 96, 96);
      g.save();
      g.translate(48, 48);
      g.rotate(leaf.rot);
      g.scale(1, Math.cos(leaf.fl));
      g.fillStyle = leaf.col;
      renderer.draw(g, { ...leaf, sprite });
      g.restore();
      return g.getImageData(0, 0, 96, 96).data;
    }
    const coverage = DRIFT_SPRITES.map(
      (sprite) => paint(sprite.id).filter((v, i) => i % 4 === 3 && v > 16).length,
    );
    renderer.dispose();
    const retained = packedDrift(document).snapshot();
    const previewReady = preview.ready;
    preview.dispose();
    return {
      coverage,
      initial,
      overlapping,
      retained,
      previewReady,
      released: packedDrift(document).snapshot(),
    };
  });
  expect(result.coverage).toHaveLength(32);
  expect(Math.min(...result.coverage)).toBeGreaterThan(50);
  expect(result.overlapping.pages).toBe(result.initial.pages);
  expect(result.overlapping.references).toBe(result.initial.references * 2);
  expect(result.retained).toEqual(result.initial);
  expect(result.previewReady).toBe(true);
  expect(result.released).toEqual({ pages: 0, references: 0, nominalPixels: 0 });
  expect(requests.filter((url) => /\/environment\/assets\/.*drift.*\.png/.test(url))).toEqual([]);
});

test('drift selections load only dependencies and retain shared pages during rapid A-B-A changes', async ({
  page,
}) => {
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createDriftRenderer } = await import('/src/rendering/scene/drift-renderer.ts');
    const { driftDependencies } = await import('/src/rendering/scene/drift-catalog.ts');
    const { packedDrift } = await import('/src/rendering/scene/packed-drift.ts');
    const renderer = createDriftRenderer(),
      preview = createDriftRenderer();
    const a = driftDependencies(0),
      b = driftDependencies(4);
    await renderer.prepare(a);
    const initial = packedDrift(document).snapshot();
    await preview.prepare(a);
    const stale = renderer.prepare(b);
    const beforeReplacement = renderer.snapshot().selected;
    const returned = renderer.prepare(a);
    const cancelled = await stale,
      reused = await returned;
    const active = renderer.snapshot().selected;
    await renderer.prepare(b);
    const replacement = renderer.snapshot().selected;
    renderer.dispose();
    const retained = packedDrift(document).snapshot();
    const independent = preview.ready;
    await preview.prepare();
    const all = packedDrift(document).snapshot();
    preview.dispose();
    return {
      a,
      b,
      initial,
      beforeReplacement,
      cancelled,
      reused,
      active,
      replacement,
      retained,
      independent,
      all,
      released: packedDrift(document).snapshot(),
    };
  });
  expect(result.beforeReplacement).toEqual(result.a);
  expect(result.cancelled).toBe(false);
  expect(result.reused).toBe(true);
  expect(result.active).toEqual(result.a);
  expect(result.replacement).toEqual(result.b);
  expect(result.retained).toEqual(result.initial);
  expect(result.independent).toBe(true);
  expect(result.initial.nominalPixels).toBeLessThan(result.all.nominalPixels);
  expect(result.released).toEqual({ pages: 0, references: 0, nominalPixels: 0 });
});
