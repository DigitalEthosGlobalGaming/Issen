import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetMaterialCatalog } from '../../src/rendering/asset-material-catalog.ts';

// Reference-only artwork has no live sprite entry. Keep it out of gameplay leases.
const root = fileURLToPath(new URL('../../', import.meta.url));
const manifests = ['landmarks', 'scenery', 'drift', 'figures', 'ui'].map(
  (name) => `src/rendering/generated/${name}/manifest.json`,
);
const sources = new Set(
  (
    await Promise.all(
      manifests.map(async (filename) =>
        Object.keys(JSON.parse(await readFile(path.join(root, filename), 'utf8')).sources),
      ),
    )
  ).flat(),
);
const relative = (url) => path.relative(root, fileURLToPath(url)).replaceAll('\\', '/');
const sprites = assetMaterialCatalog
  .filter((pack) => !sources.has(relative(pack.maps.normal)))
  .map((pack) => ({
    id: `reference.${path.basename(pack.sourcePath, '.png')}`,
    frame: [0, 0, ...pack.dimensions],
    maps: {
      colour: pack.sourcePath,
      ...Object.fromEntries(
        ['normal', 'surface', 'emissive']
          .filter((kind) => pack.maps[kind])
          .map((kind) => [kind, relative(pack.maps[kind])]),
      ),
    },
  }));
await mkdir(path.join(root, 'tmp/asset-pipeline'), { recursive: true });
await writeFile(
  path.join(root, 'tmp/asset-pipeline/reference.json'),
  JSON.stringify(
    {
      version: 1,
      sprites,
      dependencies: Object.fromEntries(sprites.map((sprite) => [sprite.id, [sprite.id]])),
      packingGroups: sprites.map((sprite) => sprite.id),
      configurationSources: [
        'scripts/assets/reference-spec.mjs',
        'scripts/assets/pack.py',
        'src/rendering/asset-material-catalog.ts',
        ...manifests,
      ],
    },
    null,
    2,
  ) + '\n',
);
