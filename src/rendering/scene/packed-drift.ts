import {
  createPackedAssetStore,
  decodePackedBitmap,
  type PackedManifest,
} from '../packed-assets.ts';
import generated from '../generated/drift/manifest.json';

const urls = import.meta.glob<string>('../generated/drift/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
const stores = new WeakMap<Document, ReturnType<typeof createPackedAssetStore>>();
export function packedDrift(doc: Document) {
  let store = stores.get(doc);
  if (!store) {
    store = createPackedAssetStore(
      doc,
      generated as unknown as PackedManifest,
      (filename) => {
        const url = urls[`../generated/drift/${filename}`];
        if (!url) throw Error(`Missing generated drift page ${filename}`);
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
