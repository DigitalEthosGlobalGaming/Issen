import { expect, test } from '@playwright/test';

test('material preview uses canonical sprites and reference pages with independent ownership', async ({
  page,
}) => {
  const images: string[] = [];
  page.on('request', (request) => {
    if (request.url().endsWith('.png')) images.push(request.url());
  });
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createLightingDebug } = await import('/src/ui/lighting-debug.ts');
    const { createLightingRig } = await import('/src/rendering/lighting-rig.ts');
    const { packedMaterialEntries, packedDomainStore } =
      await import('/src/rendering/packed-catalog.ts');
    const app = document.createElement('div');
    document.body.append(app);
    const canvas = document.createElement('canvas');
    canvas.width = 160;
    canvas.height = 120;
    app.append(canvas);
    const rig = createLightingRig();
    const debug = createLightingDebug(
      app,
      rig,
      () => canvas,
      () => {},
    );
    const select = app.querySelector('select')!;
    const image = app.querySelector<HTMLImageElement>('.lighting-material-preview')!;
    const entries = [
      ...packedMaterialEntries.filter((entry) => entry.domain === 'reference'),
      ...(['landmarks', 'scenery', 'drift', 'figures', 'ui'] as const).map((domain) =>
        packedMaterialEntries.find((entry) => entry.domain === domain)!,
      ),
      ...packedMaterialEntries
        .filter((entry) => entry.domain === 'figures' && entry.id.startsWith('enemy.'))
        .slice(0, 2),
    ];
    const drawn = [];
    for (const entry of entries) {
      select.value = entry.key;
      select.dispatchEvent(new Event('change'));
      await debug.preparePreview();
      drawn.push(image.src.startsWith('data:image/png') && !image.hidden);
    }
    const last = entries.at(-1)!;
    const store = await packedDomainStore(document, last.domain);
    const borrowed = store.acquire([last.id]);
    await borrowed.ready;
    const shared = store.snapshot();
    const before = image.src;
    rig.state.x = 0.9;
    const changed = image.src !== before;
    // A replacement selection can be cancelled by clearing the preview.
    select.value = entries[0]!.key;
    select.dispatchEvent(new Event('change'));
    select.value = '';
    select.dispatchEvent(new Event('change'));
    await debug.preparePreview();
    debug.dispose();
    const retained = store.snapshot();
    borrowed.release();
    const released = store.snapshot();
    app.remove();
    return {
      options: select.options.length,
      entries: packedMaterialEntries.length,
      drawn,
      changed,
      shared,
      retained,
      released,
      hidden: image.hidden,
    };
  });
  expect(result.entries).toBe(336);
  expect(result.options).toBe(result.entries + 1);
  expect(result.drawn).toHaveLength(10);
  expect(result.drawn.every(Boolean)).toBe(true);
  expect(result.changed).toBe(true);
  expect(result.shared.references).toBe(2);
  expect(result.retained.references).toBe(1);
  expect(result.released.pages).toBe(0);
  expect(result.hidden).toBe(true);
  expect(images.length).toBeGreaterThan(0);
  expect(images.every((url) => url.includes('/generated/'))).toBe(true);
});
