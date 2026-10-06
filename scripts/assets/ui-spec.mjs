import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetMaterialCatalog } from '../../src/rendering/asset-material-catalog.ts';

const root = fileURLToPath(new URL('../../', import.meta.url));
const sprites = [],
  collections = {},
  dependencies = {};
const grids = {
  'temple-symbols-atlas': [3, 3],
  'trial-symbols-atlas': [4, 3],
  'ui-strokes-atlas': [4, 2],
  'button-atlas': [2, 1],
  'panel-atlas': [2, 1],
  'awakening-buttons-atlas': [3, 1],
};
for (const pack of assetMaterialCatalog.filter((pack) => pack.sourcePath.startsWith('src/ui/'))) {
  const stem = path.basename(pack.sourcePath, '.png');
  const [width, height] = pack.dimensions;
  const [columns, rows] = grids[stem] ?? [1, 1];
  let frames = Array.from({ length: columns * rows }, (_, cell) => [
    ((cell % columns) * width) / columns,
    (Math.floor(cell / columns) * height) / rows,
    width / columns,
    height / rows,
  ]);
  if (stem === 'world-ui-atlas')
    frames = [
      ...Array.from({ length: 8 }, (_, cell) => [
        (cell % 4) * 192,
        Math.floor(cell / 4) * 192,
        192,
        192,
      ]),
      ...Array.from({ length: 12 }, (_, cell) => [
        (cell % 6) * 128,
        384 + Math.floor(cell / 6) * 128,
        128,
        128,
      ]),
    ];
  const ids = frames.map((frame, cell) => {
    const id = `ui.${stem}.${cell}`;
    sprites.push({
      id,
      frame,
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
    });
    return id;
  });
  collections[pack.sourcePath] = { size: pack.dimensions, sprites: ids };
  dependencies[stem] = ids;
}
await mkdir('tmp/asset-pipeline', { recursive: true });
await writeFile(
  'tmp/asset-pipeline/ui.json',
  JSON.stringify(
    {
      version: 1,
      sprites,
      collections,
      dependencies,
      packingGroups: Object.keys(dependencies),
      configurationSources: [
        'scripts/assets/ui-spec.mjs',
        'scripts/assets/pack.py',
        'src/rendering/asset-material-catalog.ts',
      ],
    },
    null,
    2,
  ),
);
console.log(
  `Extracted ${sprites.length} UI windows in ${Object.keys(collections).length} source collections.`,
);
