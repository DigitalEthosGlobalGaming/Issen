import {
  createPackedAssetStore,
  decodePackedBitmap,
  type PackedManifest,
} from '../packed-assets.ts';
import generated from '../generated/landmarks/manifest.json';
import { releaseSceneryCutouts } from './scene-kit.ts';

const urls = import.meta.glob<string>('../generated/landmarks/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
export const landmarkManifest = generated as unknown as PackedManifest;
const stores = new WeakMap<Document, ReturnType<typeof createPackedAssetStore>>();

/** Each realm shares decoded pages; scene and preview leases own their references. */
export function packedLandmarks(doc: Document) {
  let store = stores.get(doc);
  if (!store) {
    store = createPackedAssetStore(
      doc,
      landmarkManifest,
      (filename) => {
        const url = urls[`../generated/landmarks/${filename}`];
        if (!url) throw Error(`Missing generated landmark page ${filename}`);
        return url;
      },
      {
        releaseImages: releaseSceneryCutouts,
        // Give local pages explicit bitmap ownership, closed on the final release.
        ...(typeof window !== 'undefined' && typeof createImageBitmap === 'function'
          ? { bitmap: (image: HTMLImageElement) => decodePackedBitmap(doc, image) }
          : {}),
      },
    );
    stores.set(doc, store);
  }
  return store;
}
export type LandmarkLease = ReturnType<ReturnType<typeof packedLandmarks>['acquire']>;
