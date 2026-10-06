import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetMaterialCatalog } from '../../src/rendering/asset-material-catalog.ts';
import {
  DRIFT_ATLASES,
  DRIFT_SPRITES,
  DRIFT_MIXTURES,
} from '../../src/rendering/scene/drift-catalog.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sprites = DRIFT_SPRITES.map((sprite) => {
  const stem = DRIFT_ATLASES[sprite.atlas];
  const pack = assetMaterialCatalog.find((pack) => pack.sourcePath.endsWith(`/${stem}.png`));
  if (!pack) throw Error(`Missing drift material ${sprite.id}`);
  const [width, height] = pack.dimensions;
  const [u, v, w, h] = sprite.frame;
  const x = Math.round(u * width),
    y = Math.round(v * height);
  const sw = Math.round((u + w) * width) - x;
  const sh = Math.round((v + h) * height) - y;
  return {
    id: sprite.id,
    frame: [x, y, sw, sh],
    pivot: [sprite.pivot[0] * sw, sprite.pivot[1] * sh],
    maps: {
      colour: pack.sourcePath,
      ...Object.fromEntries(
        ['normal', 'surface', 'emissive']
          .filter((kind) => pack.maps[kind])
          .map((kind) => [
            kind,
            path.relative(root, fileURLToPath(pack.maps[kind])).replaceAll('\\', '/'),
          ]),
      ),
    },
  };
});
const dependencies = Object.fromEntries(
  DRIFT_MIXTURES.map((entries, stage) => [`stage-${stage}`, entries.map(([id]) => id)]),
);
dependencies.embers = ['fire.coal', 'fire.ember', 'fire.streak'];
dependencies.all = sprites.map((sprite) => sprite.id);
await mkdir('tmp/asset-pipeline', { recursive: true });
await writeFile(
  'tmp/asset-pipeline/drift.json',
  JSON.stringify(
    {
      version: 1,
      sprites,
      dependencies,
      packingGroups: Object.keys(dependencies).filter((name) => name !== 'all'),
      configurationSources: [
        'scripts/assets/drift-spec.mjs',
        'scripts/assets/pack.py',
        'src/rendering/scene/drift-catalog.ts',
        'src/rendering/asset-material-catalog.ts',
      ],
    },
    null,
    2,
  ),
);
console.log(`Extracted ${sprites.length} stable drift sprites.`);
