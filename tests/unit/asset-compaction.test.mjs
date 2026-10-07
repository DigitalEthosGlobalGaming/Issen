import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { createPbrAtlas } from '../../src/rendering/pbr-atlas.ts';
import { generateRuntimeCatalog } from '../../scripts/pbr/update-runtime-catalog.mjs';

test('missing emissive does not request an image, aligned maps remain usable and disposal releases them', async () => {
  const requests = [],
    images = [];
  const doc = {
    createElement(kind) {
      assert.equal(kind, 'img');
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
    { diffuse: 'd.webp', normal: 'n.webp', surface: 's.webp' },
    16,
    8,
  );
  assert.equal(await atlas.prepare(), true);
  assert.deepEqual(requests, ['d.webp', 'n.webp', 's.webp']);
  const material = atlas.material([1, 2, 3, 4]);
  assert.equal(material.emissive, undefined);
  assert.deepEqual(material.normal.frame, material.surface.frame);
  atlas.dispose();
  assert.equal(atlas.ready, false);
  assert.equal(atlas.material([1, 2, 3, 4]), null);
  assert.ok(images.every((image) => image.width === 0 && image.height === 0));
});

test('emitting packs request their map and invalid map dimensions reject readiness', async () => {
  let invalid = false;
  const doc = {
    createElement() {
      return {
        naturalWidth: invalid ? 4 : 16,
        naturalHeight: 8,
        async decode() {},
        removeAttribute() {},
      };
    },
  };
  const sources = { diffuse: 'd.webp', normal: 'n.webp', surface: 's.webp', emissive: 'e.webp' };
  const atlas = createPbrAtlas(doc, sources, 16, 8);
  assert.equal(await atlas.prepare(), true);
  assert.ok(atlas.material([0, 0, 16, 8]).emissive);
  invalid = true;
  const bad = createPbrAtlas(doc, sources, 16, 8);
  assert.equal(await bad.prepare(), false);
  assert.equal(bad.material([0, 0, 16, 8]), null);
  atlas.dispose();
  bad.dispose();
});

test('catalog lists only installed runtime planes, supports optional emission and rejects missing required data', async () => {
  const tmp = path.resolve('tmp/asset-compaction/tests');
  await mkdir(tmp, { recursive: true });
  const root = await mkdtemp(path.join(tmp, 'catalog-'));
  try {
    await mkdir(path.join(root, 'scripts/pbr'), { recursive: true });
    await mkdir(path.join(root, 'src/rendering/maps'), { recursive: true });
    await writeFile(
      path.join(root, 'scripts/pbr/asset-packs.json'),
      JSON.stringify({
        assets: [],
        installed: [
          {
            source: 'src/rendering/sample.png',
            output: 'src/rendering/maps',
            dimensions: [16, 8],
          },
        ],
      }),
    );
    await writeFile(path.join(root, 'src/rendering/sample.webp'), 'fixture');
    for (const kind of ['diffuse', 'normal', 'surface'])
      await writeFile(path.join(root, `src/rendering/maps/sample_${kind}.webp`), 'fixture');
    for (const kind of ['roughness', 'metallic', 'ao'])
      await writeFile(
        path.join(root, `src/rendering/maps/sample_${kind}.png`),
        'legacy scalar fixture',
      );
    const zeroPath = 'src/rendering/maps/sample_emissive.png';
    const zeroBytes = 'validated zero-emission fixture';
    await writeFile(path.join(root, zeroPath), zeroBytes);
    await mkdir(path.join(root, 'scripts/assets'), { recursive: true });
    await writeFile(
      path.join(root, 'scripts/assets/compaction-manifest.json'),
      JSON.stringify({
        files: [
          {
            originalPath: zeroPath,
            originalHash: createHash('sha256').update(zeroBytes).digest('hex'),
            action: 'zero-emission',
          },
        ],
      }),
    );
    const initial = await generateRuntimeCatalog(root);
    assert.match(initial, /sample_surface.webp/);
    assert.doesNotMatch(initial, /emissive:|roughness:|metallic:|ao:/);
    // A new export must not be hidden by the old zero-emission record.
    await writeFile(path.join(root, zeroPath), 'regenerated emitting fixture');
    assert.match(await generateRuntimeCatalog(root), /emissive:.*sample_emissive.png/);
    // An emitting WebP takes priority even if a staged zero PNG remains.
    await writeFile(path.join(root, zeroPath), zeroBytes);
    await writeFile(path.join(root, 'src/rendering/maps/sample_emissive.webp'), 'fixture');
    assert.match(await generateRuntimeCatalog(root), /emissive:.*sample_emissive.webp/);
    await rm(path.join(root, 'src/rendering/maps/sample_normal.webp'));
    await assert.rejects(generateRuntimeCatalog(root), /Missing runtime plane/);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
