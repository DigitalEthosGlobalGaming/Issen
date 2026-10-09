import { assetMaterialCatalog } from '../asset-material-catalog.ts';
const materialPacks = new Map(assetMaterialCatalog.map((pack) => [pack.source, pack]));
const CHERRY_URL = new URL('./assets/cherry-trees-atlas.webp', import.meta.url).href;
const PETALS_URL = new URL('./assets/petal-ground-atlas.webp', import.meta.url).href;
const BAMBOO_URL = new URL('./assets/bamboo-atlas.webp', import.meta.url).href;
const ROCKS_URL = new URL('./assets/rocks-atlas.webp', import.meta.url).href;
const PINE_URL = new URL('./assets/pine-atlas.webp', import.meta.url).href;
const MOUNTAIN_URL = new URL('./assets/mountain-atlas.webp', import.meta.url).href;
const BANKS_URL = new URL('./assets/field-banks-atlas.webp', import.meta.url).href;
const SHRUBS_URL = new URL('./assets/shrubs-atlas.webp', import.meta.url).href;
const FIELD_ROCKS_URL = new URL('./assets/field-rocks-atlas.webp', import.meta.url).href;
const GRASS_EDGES_URL = new URL('./assets/grass-edges-atlas.webp', import.meta.url).href;
const MEADOW_PATCHES_URL = new URL('./assets/meadow-patches-atlas.webp', import.meta.url).href;
const FOREGROUND_BOULDERS_URL = new URL('./assets/foreground-boulders-atlas.webp', import.meta.url)
  .href;
const FOG_WISPS_URL = new URL('./assets/fog-wisps-atlas.webp', import.meta.url).href;

export const environmentAssetUrls = [
  BAMBOO_URL,
  ROCKS_URL,
  PINE_URL,
  MOUNTAIN_URL,
  BANKS_URL,
  SHRUBS_URL,
  FIELD_ROCKS_URL,
  GRASS_EDGES_URL,
  MEADOW_PATCHES_URL,
  FOG_WISPS_URL,
  FOREGROUND_BOULDERS_URL,
  CHERRY_URL,
  PETALS_URL,
  new URL('./assets/reeds-atlas.webp', import.meta.url).href,
  new URL('./assets/snow-pines-atlas.webp', import.meta.url).href,
  new URL('./assets/snow-boulders-atlas.webp', import.meta.url).href,
  new URL('./assets/snow-rocks-atlas.webp', import.meta.url).href,
  new URL('./assets/temple-posts-atlas.webp', import.meta.url).href,
  new URL('./assets/temple-walls-atlas.webp', import.meta.url).href,
  new URL('./assets/temple-roofs-atlas.webp', import.meta.url).href,
  new URL('./assets/temple-steps-atlas.webp', import.meta.url).href,
  new URL('./assets/sea-stacks-atlas.webp', import.meta.url).href,
  new URL('./assets/foam-strips-atlas.webp', import.meta.url).href,
  new URL('./assets/fallen-bamboo-atlas.webp', import.meta.url).href,
  new URL('./assets/snow-peak.webp', import.meta.url).href,
  new URL('./assets/woodland-landmarks-atlas.webp', import.meta.url).href,
  new URL('./assets/snow-woodland-landmarks-atlas.webp', import.meta.url).href,
  new URL('./assets/landmark-stones-atlas.webp', import.meta.url).href,
  new URL('./assets/bamboo-landmarks-atlas.webp', import.meta.url).href,
  new URL('./assets/cherry-landmarks-atlas.webp', import.meta.url).href,
];

/** Decode only the current scene's kit; shared images survive a scene switch. */
export function sceneAssetIndices(stage: number, liveMotion = true): number[] {
  if (stage === 0)
    return liveMotion ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 27] : [2, 3, 4, 5, 6, 7, 8, 10, 25, 27];
  if (stage === 1) return [2, 3, 4, 5, 6, 25, 27];
  if (stage === 2) return [3, 4, 5, 6, 11, 12, 27, 29];
  if (stage === 3) return [2, 3, 4, 5, 6, 7, 13, 25, 27];
  if (stage === 4) return [0, 3, 4, 6, 23, 27, 28];
  if (stage === 5) return [3, 14, 15, 16, 24, 26];
  if (stage === 6) return [2, 3, 6, 17, 18, 19, 20, 27];
  if (stage === 7) return [2, 3, 4, 6, 10, 21, 22, 25, 27];
  if (stage === 8) return [2, 3, 6, 9, 17, 20, 25, 27];
  return [2, 3, 4, 5, 6, 7, 8, 9, 10, 25, 27];
}

/** Same colour and aligned maps as prepare(), without creating active bindings. */
export function sceneImageUrls(stage: number, liveMotion = true): string[] {
  return [
    ...new Set(
      sceneAssetIndices(stage, liveMotion)
        .flatMap((index) => {
          const source = environmentAssetUrls[index]!;
          const maps = materialPacks.get(source)?.maps;
          return [maps?.normal, maps?.surface, maps?.emissive].filter(
            (url): url is string => !!url,
          );
        })
        .concat(sceneAssetIndices(stage, liveMotion).map((index) => environmentAssetUrls[index]!)),
    ),
  ];
}
