import { expect, test } from '@playwright/test';

test('a failed packed UI page rejects preparation and a retry releases all owned pages', async ({
  page,
}) => {
  test.setTimeout(60000);
  let failures = 0;
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.route('**/generated/ui/*-normal.png', async (route) => {
    if (route.request().resourceType() === 'image' && !failures) {
      failures++;
      await route.abort('failed');
    } else await route.continue();
  });
  // A standalone page avoids borrowing already prepared application textures.
  await page.goto('/privacy/index.html');
  const result = await page.evaluate(async () => {
    const { createUiMaterialLighting } = await import('/src/ui/material-lighting.ts');
    const { createLightingRig } = await import('/src/rendering/lighting-rig.ts');
    const { uiTextureCatalog } = await import('/src/ui/ui-texture-catalog.ts');
    const { packedUi } = await import('/src/ui/packed-ui.ts');
    const pack = uiTextureCatalog.find(
      (entry) => entry.ids.length === 1 && entry.dimensions[0] < 512 && entry.dimensions[1] < 512,
    )!;
    const style = document.createElement('style');
    style.textContent = `.retry-probe { background: var(--issen-ui-${pack.source.slice('issen-ui:'.length)}); }`;
    document.head.append(style);
    const ui = createUiMaterialLighting(document, createLightingRig());
    let failure = '';
    try {
      await ui.prepare();
    } catch (error) {
      failure = (error as Error).name;
    }
    const failed = ui.snapshot();
    await ui.prepare();
    const ready = ui.snapshot();
    const active = packedUi(document).snapshot();
    ui.dispose();
    return { failure, failed, ready, active, disposed: packedUi(document).snapshot() };
  });
  expect(failures).toBe(1);
  expect(result.failure).toBe('UiArtworkLoadError');
  expect(result.failed.rendered).toBe(0);
  expect(result.ready.rendered).toBe(result.ready.jobs);
  expect(result.active.pages).toBeGreaterThan(0);
  expect(result.disposed.pages).toBe(0);
  expect(result.disposed.references).toBe(0);
  expect(errors).toEqual([]);
});
