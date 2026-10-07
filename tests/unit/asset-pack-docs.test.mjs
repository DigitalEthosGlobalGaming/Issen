import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, stat, rm } from 'node:fs/promises';
import path from 'node:path';
import { refreshPackDocs } from '../../scripts/pbr/refresh-pack-docs.mjs';

test('installation refreshes compact map links, preserves provenance and is idempotent for shared pack directories', async () => {
  const parent = path.resolve('tmp/asset-compaction/tests');
  await mkdir(parent, { recursive: true });
  const root = await mkdtemp(path.join(parent, 'docs-'));
  try {
    await mkdir(path.join(root, 'scripts/pbr'), { recursive: true });
    await mkdir(path.join(root, 'src/maps'), { recursive: true });
    await writeFile(
      path.join(root, 'scripts/pbr/asset-packs.json'),
      JSON.stringify({
        assets: [
          { source: 'src/first.png', output: 'src/maps' },
          { source: 'src/second.png', output: 'src/maps' },
        ],
      }),
    );
    const readme = path.join(root, 'src/maps/README.md');
    await writeFile(
      readme,
      '# Export provenance\n\nGenerated using cloth and metal; recipe frame [2, 3, 4, 5].\n\nMaps: [diffuse](first_diffuse.png), [roughness](first_roughness.png), [emissive](first_emissive.png).\n',
    );
    for (const stem of ['first', 'second'])
      for (const kind of ['diffuse', 'normal', 'surface'])
        await writeFile(path.join(root, `src/maps/${stem}_${kind}.webp`), 'fixture');
    await writeFile(path.join(root, 'src/maps/second_emissive.webp'), 'emitting fixture');
    assert.equal(await refreshPackDocs(root), 1);
    const text = await readFile(readme, 'utf8');
    assert.match(text, /Generated using cloth and metal; recipe frame \[2, 3, 4, 5\]/);
    assert.doesNotMatch(text, /first_roughness.png|first_emissive.png|first_diffuse.png/);
    assert.match(text, /first_surface.webp/);
    assert.match(text, /second_emissive.webp/);
    const time = (await stat(readme)).mtimeMs;
    assert.equal(await refreshPackDocs(root), 0);
    assert.equal((await stat(readme)).mtimeMs, time);
    assert.equal(await readFile(readme, 'utf8'), text);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
