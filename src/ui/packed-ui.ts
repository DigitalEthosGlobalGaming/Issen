import {
  createPackedAssetStore,
  decodePackedBitmap,
  type PackedManifest,
} from '../rendering/packed-assets.ts';
import generated from '../rendering/generated/ui/manifest.json';

const urls = import.meta.glob<string>('../rendering/generated/ui/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
const stores = new WeakMap<Document, ReturnType<typeof createPackedAssetStore>>();
export function packedUi(doc: Document) {
  let store = stores.get(doc);
  if (!store) {
    store = createPackedAssetStore(
      doc,
      generated as unknown as PackedManifest,
      (filename) => {
        const url = urls[`../rendering/generated/ui/${filename}`];
        if (!url) throw Error(`Missing generated UI page ${filename}`);
        return url;
      },
      { bitmap: (image) => decodePackedBitmap(doc, image) },
    );
    stores.set(doc, store);
  }
  return store;
}
export function uiCollection(sourcePath: string) {
  const collection = (
    generated.collections as Record<string, { size: number[]; sprites: string[] }>
  )[sourcePath];
  if (!collection) throw Error(`Unknown packed UI source ${sourcePath}`);
  return collection;
}
export type UiLease = ReturnType<ReturnType<typeof packedUi>['acquire']>;
