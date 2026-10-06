import {
  createPackedAssetStore,
  decodePackedBitmap,
  type PackedManifest,
} from '../packed-assets.ts';
import generated from '../generated/figures/manifest.json';

const urls = import.meta.glob<string>('../generated/figures/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
const stores = new WeakMap<Document, ReturnType<typeof createPackedAssetStore>>();
export function packedFigures(doc: Document) {
  let store = stores.get(doc);
  if (!store) {
    store = createPackedAssetStore(
      doc,
      generated as unknown as PackedManifest,
      (filename) => {
        const url = urls[`../generated/figures/${filename}`];
        if (!url) throw Error(`Missing generated figure page ${filename}`);
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
export type FigureLease = ReturnType<ReturnType<typeof packedFigures>['acquire']>;
