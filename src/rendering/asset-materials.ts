import { createPbrAtlas } from './pbr-atlas.ts';
import { assetMaterialCatalog } from './asset-material-catalog.ts';
const packs = new Map(assetMaterialCatalog.map((pack) => [pack.source, pack]));

/** Own only the selected packs; atlas frames remain aligned through tint/crop caches. */
export function createAssetMaterials<K extends string>(doc: Document, sources: Record<K, string>) {
  const atlases = new Map<K, ReturnType<typeof createPbrAtlas>>();
  const selected = new Map<K, string>();
  let disposed = false;
  function select(next: Record<K, string>) {
    if (disposed) return;
    for (const [key, atlas] of atlases)
      if (selected.get(key) !== next[key]) {
        atlas.dispose();
        atlases.delete(key);
        selected.delete(key);
      }
    for (const key of Object.keys(next) as K[]) {
      if (atlases.has(key)) continue;
      const pack = packs.get(next[key]);
      if (!pack) continue;
      selected.set(key, next[key]);
      atlases.set(
        key,
        createPbrAtlas(doc, pack.maps, pack.dimensions[0], pack.dimensions[1], { colour: false }),
      );
    }
  }
  select(sources);
  return {
    select,
    prepare: () => Promise.all([...atlases.values()].map((atlas) => atlas.prepare())),
    ready: (key: K) => atlases.get(key)?.ready === true,
    material: (key: K, frame: readonly [number, number, number, number]) =>
      atlases.get(key)?.material(frame) ?? null,
    dispose: () => {
      disposed = true;
      for (const atlas of atlases.values()) atlas.dispose();
      atlases.clear();
      selected.clear();
    },
  };
}
