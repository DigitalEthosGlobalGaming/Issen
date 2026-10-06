// Extract existing authoritative windows/anchors without executing renderers or viewing art.
import { mkdir, writeFile } from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import { LANDMARK_LAYOUT } from '../../src/rendering/environment/landmark-layout.ts';

const stems = {
  woodland: 'woodland-landmarks-atlas',
  snowWoodland: 'snow-woodland-landmarks-atlas',
  stones: 'landmark-stones-atlas',
  bambooLandmarks: 'bamboo-landmarks-atlas',
  cherryLandmarks: 'cherry-landmarks-atlas',
};
const sprites = Object.entries(LANDMARK_LAYOUT).flatMap(([family, layout]) => {
  const stem = stems[family];
  let omitted = {};
  try {
    omitted =
      JSON.parse(
        readFileSync(
          new URL(
            `../../src/rendering/environment/assets/pbr/${stem}/${stem}.material.json`,
            import.meta.url,
          ),
          'utf8',
        ),
      ).omittedMaps ?? {};
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  return layout.frames.map(({ frame, anchorX, anchorY }, cell) => ({
    id: `landmark.${family}.${cell}`,
    frame: [frame.x, frame.y, frame.width, frame.height],
    pivot: [frame.width * anchorX, frame.height * anchorY],
    maps: {
      colour: `src/rendering/environment/assets/${stem}.png`,
      ...Object.fromEntries(
        ['normal', 'surface', 'emissive']
          .filter((kind) => omitted[kind] === undefined)
          .map((kind) => [
            kind,
            `src/rendering/environment/assets/pbr/${stem}/${stem}_${kind}.png`,
          ]),
      ),
    },
  }));
});
const ids = (family) =>
  sprites.filter((s) => s.id.startsWith(`landmark.${family}.`)).map((s) => s.id);
const dependencies = Object.fromEntries(
  Array.from({ length: 9 }, (_, stage) => {
    const family =
      stage === 2
        ? 'cherryLandmarks'
        : stage === 4
          ? 'bambooLandmarks'
          : stage === 5
            ? 'snowWoodland'
            : stage === 6
              ? 'stones'
              : 'woodland';
    return [
      `stage-${stage}`,
      [...new Set([...ids(family), ...ids(stage === 5 ? 'snowWoodland' : 'stones')])],
    ];
  }),
);
dependencies['material-preview'] = sprites.map((s) => s.id);
await mkdir(new URL('../../tmp/asset-pipeline/', import.meta.url), { recursive: true });
await writeFile(
  new URL('../../tmp/asset-pipeline/landmarks.json', import.meta.url),
  JSON.stringify(
    {
      version: 1,
      sprites,
      dependencies,
      packingGroups: Object.keys(dependencies).filter((name) => name.startsWith('stage-')),
      configurationSources: [
        'scripts/assets/landmark-spec.mjs',
        'scripts/assets/pack.py',
        'src/rendering/environment/landmark-layout.ts',
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(`Extracted ${sprites.length} canonical sprites with shared scene dependencies.`);
