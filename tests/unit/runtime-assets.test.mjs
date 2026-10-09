import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runtimeInventory, imageDimensions } from '../../scripts/assets/runtime-inventory.mjs';
import { createPbrAtlas } from '../../src/rendering/pbr-atlas.ts';

test('material-only atlas does not decode unused colour and retains aligned data/emission/disposal', async () => {
  const requests = [],
    images = [];
  const doc = {
    createElement() {
      const image = {
        naturalWidth: 16,
        naturalHeight: 8,
        width: 16,
        height: 8,
        set src(value) {
          requests.push(value);
        },
        async decode() {},
        removeAttribute() {},
      };
      images.push(image);
      return image;
    },
  };
  const atlas = createPbrAtlas(
    doc,
    { diffuse: 'unused.webp', normal: 'n.webp', surface: 's.webp', emissive: 'e.webp' },
    16,
    8,
    { colour: false },
  );
  assert.equal(await atlas.prepare(), true);
  assert.deepEqual(requests, ['n.webp', 's.webp', 'e.webp']);
  assert.equal(atlas.diffuse, undefined);
  const material = atlas.material([0, 0, 16, 8]);
  assert.ok(material.normal && material.surface && material.emissive);
  assert.deepEqual(material.normal.frame, material.emissive.frame);
  atlas.dispose();
  assert.ok(images.every((image) => image.width === 0 && image.height === 0));
});

test('runtime inventory reproduces installed file metadata and measured stage kits without authoring PNGs', async () => {
  const inventory = await runtimeInventory();
  const saved = JSON.parse(await readFile('scripts/assets/runtime-inventory.json', 'utf8'));
  assert.deepEqual(inventory, saved, 'regenerate the inventory when consumers/assets change');
  assert.equal(new Set(inventory.assets.map((row) => row.path)).size, inventory.assets.length);
  assert.ok(inventory.assets.every((row) => row.decodedBytes === row.width * row.height * 4));
  assert.ok(
    inventory.assets.every(
      (row) => !row.path.endsWith('.png') || row.path.endsWith('.compact.png'),
    ),
  );
  assert.ok(inventory.assets.every((row) => !/^(?:assets|android|tests)\//.test(row.path)));
  assert.equal(
    inventory.stages[0].decodedBytesBefore,
    283171432,
    'stage kit matches the measured worker baseline',
  );
  assert.equal(inventory.stages[5].decodedBytesBefore, 151010592);
  for (const family of [
    'pine-atlas',
    'shrubs-atlas',
    'rocks-atlas',
    'snow-boulders-atlas',
    'grass-edges-atlas',
    'meadow-patches-atlas',
    'fog-wisps-atlas',
    'foreground-boulders-atlas',
    'woodland-landmarks-atlas',
    'snow-woodland-landmarks-atlas',
  ]) {
    const pair = inventory.duplicatePairs.find((row) =>
      row.source.endsWith('/' + family + '.webp'),
    );
    assert.ok(pair);
    assert.equal(pair.usesDiffuse, false);
  }
  assert.equal(
    inventory.duplicatePairs.find((row) => row.source.endsWith('/player-ronin-simple.webp'))
      .usesDiffuse,
    true,
  );
  for (const family of [
    'enemy-ronin-simple',
    'enemy-clothing-variants',
    'enemy-headwear-atlas',
    'enemy-headwear-variants',
  ]) {
    const pair = inventory.duplicatePairs.find((row) =>
      row.source.endsWith('/' + family + '.webp'),
    );
    assert.equal(pair.usesDiffuse, true, 'prepared enemy colour still consumes the diffuse map');
  }
  assert.ok(
    inventory.assets
      .find((row) => row.path.endsWith('/pine-atlas.webp'))
      .consumers.includes('src/rendering/environment/local-renderer.ts'),
  );
});

test('intrinsic SVG dimensions use explicit pixels or a viewBox without assuming browser residency', () => {
  assert.deepEqual(
    imageDimensions(Buffer.from('<svg width="12" height="8" viewBox="0 0 4 5">'), '.svg'),
    [12, 8],
  );
  assert.deepEqual(imageDimensions(Buffer.from('<svg viewBox="0,0,4,5">'), '.svg'), [4, 5]);
});
