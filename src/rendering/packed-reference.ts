import {
  createPackedAssetStore,
  decodePackedBitmap,
  type PackedManifest,
} from './packed-assets.ts';
import generated from './generated/reference/manifest.json';

const urls = import.meta.glob<string>('./generated/reference/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
const stores = new WeakMap<Document, ReturnType<typeof createPackedAssetStore>>();
export function packedReference(doc: Document) {
  let store = stores.get(doc);
  if (!store) {
    store = createPackedAssetStore(
      doc,
      generated as unknown as PackedManifest,
      (filename) => {
        const url = urls[`./generated/reference/${filename}`];
        if (!url) throw Error(`Missing generated reference page ${filename}`);
        return url;
      },
      typeof createImageBitmap === 'function'
        ? { bitmap: (image) => decodePackedBitmap(doc, image) }
        : {},
    );
    stores.set(doc, store);
  }
  return store;
}
export type ReferenceLease = ReturnType<ReturnType<typeof packedReference>['acquire']>;
