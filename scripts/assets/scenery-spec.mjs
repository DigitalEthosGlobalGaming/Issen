import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assetMaterialCatalog } from '../../src/rendering/asset-material-catalog.ts';
import { SCENERY_SOURCES, SCENE_ASSETS } from '../../src/rendering/environment/scenery-sources.ts';

async function literal(filename, name) {
  const source = await readFile(filename, 'utf8');
  const match = new RegExp(`const\\s+${name}\\s*=\\s*([\\s\\S]*?)\\s+as const;`).exec(source);
  if (!match) throw Error(`Missing literal frame definition ${name}`);
  // Evaluate only the repository's authored literal, never renderer code or images.
  return Function(`return (${match[1]})`)();
}
const temple = await literal('src/rendering/environment/temple.ts', 'TEMPLE_ATLAS_FRAMES');
const boulders = await literal(
  'src/rendering/environment/foreground.ts',
  'FOREGROUND_BOULDER_FRAMES',
);
const winter = await readFile('src/rendering/environment/winter.ts', 'utf8');
const extras = {};
for (const match of winter.matchAll(/atlases\.(snowPines|snowRocks)!,\s*(\[[\d., ]+\])/g)) {
  const stem = match[1] === 'snowPines' ? 'snow-pines-atlas' : 'snow-rocks-atlas';
  (extras[stem] ??= []).push(JSON.parse(match[2]));
}
const demonTerrain = await literal('src/rendering/environment/demon-realm.ts', 'terrainFrames');
const root = fileURLToPath(new URL('../../', import.meta.url));
const sprites = [],
  collections = {};
for (const stem of SCENERY_SOURCES) {
  const pack = assetMaterialCatalog.find((pack) => pack.sourcePath.endsWith(`/${stem}.png`));
  if (!pack) throw Error(`Missing installed scenery material ${stem}`);
  const [width, height] = pack.dimensions;
  let frames = Array.from({ length: 4 }, (_, cell) => [
    ((cell % 2) * width) / 2,
    (Math.floor(cell / 2) * height) / 2,
    width / 2,
    height / 2,
  ]);
  const family = /^temple-(posts|walls|roofs|steps)-atlas$/.exec(stem)?.[1];
  if (family) frames = temple[family].map(({ x, y, width, height }) => [x, y, width, height]);
  if (stem === 'foreground-boulders-atlas')
    frames = boulders.map(({ x, y, width, height }) => [x, y, width, height]);
  if (stem === 'snow-peak') frames = [[0, 0, width, height]];
  if (stem === 'demon-terrain-atlas') frames = demonTerrain;
  frames = [
    ...new Map([...frames, ...(extras[stem] ?? [])].map((frame) => [frame.join(), frame])).values(),
  ];
  const ids = frames.map((frame, index) => {
    const id = `scenery.${stem}.${index}`;
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
  collections[stem] = { size: [width, height], sprites: ids };
}
const dependencies = Object.fromEntries(
  SCENE_ASSETS.map((indices, stage) => [
    `stage-${stage}`,
    indices.flatMap((index) => collections[SCENERY_SOURCES[index]].sprites),
  ]),
);
dependencies.demon = [3, 25, 26].flatMap((index) => collections[SCENERY_SOURCES[index]].sprites);
dependencies.fog = collections['fog-wisps-atlas'].sprites;
dependencies['material-preview'] = sprites.map((sprite) => sprite.id);
const configurationSources = [
  'scripts/assets/scenery-spec.mjs',
  'scripts/assets/pack.py',
  'src/rendering/environment/scenery-sources.ts',
  'src/rendering/environment/temple.ts',
  'src/rendering/environment/foreground.ts',
  'src/rendering/environment/winter.ts',
  'src/rendering/environment/demon-realm.ts',
];
await mkdir('tmp/asset-pipeline', { recursive: true });
await writeFile(
  'tmp/asset-pipeline/scenery.json',
  JSON.stringify(
    {
      version: 1,
      sprites,
      collections,
      dependencies,
      packingGroups: Object.keys(dependencies).filter((name) => name !== 'material-preview'),
      configurationSources,
    },
    null,
    2,
  ),
);
console.log(
  `Extracted ${sprites.length} scenery windows from ${SCENERY_SOURCES.length} authoring sheets.`,
);
