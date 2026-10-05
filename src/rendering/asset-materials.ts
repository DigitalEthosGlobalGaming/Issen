import { createPbrAtlas } from './pbr-atlas.ts';
import { assetMaterialCatalog } from './asset-material-catalog.ts';
const packs = new Map(assetMaterialCatalog.map((pack) => [pack.source, pack]));

/** Own only the selected packs; atlas frames remain aligned through tint/crop caches. */
export function createAssetMaterials<K extends string>(doc: Document, sources: Record<K, string>) {
  const atlases = new Map<K, ReturnType<typeof createPbrAtlas>>();
  for (const key of Object.keys(sources) as K[]) {
    const pack = packs.get(sources[key]);
    if (!pack) continue;
    atlases.set(key, createPbrAtlas(doc, pack.maps, pack.dimensions[0], pack.dimensions[1]));
  }
  return {
    prepare: () => Promise.all([...atlases.values()].map((atlas) => atlas.prepare())),
    ready: (key: K) => atlases.get(key)?.ready === true,
    material: (key: K, frame: readonly [number, number, number, number]) =>
      atlases.get(key)?.material(frame) ?? null,
    dispose: () => {
      for (const atlas of atlases.values()) atlas.dispose();
      atlases.clear();
    },
  };
}
