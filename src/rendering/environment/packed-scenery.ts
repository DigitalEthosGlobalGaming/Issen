import {
  createPackedAssetStore,
  decodePackedBitmap,
  packedMaterialFrame,
  type PackedManifest,
} from '../packed-assets.ts';
import generated from '../generated/scenery/manifest.json';
import { releaseSceneryCutouts } from './scene-kit.ts';
import type { createCachedMaterials } from '../cached-materials.ts';
import type { PackedSceneryAtlas } from './packed-scene-atlas.ts';

const urls = import.meta.glob<string>('../generated/scenery/*.png', {
  eager: true,
  query: '?url',
  import: 'default',
});
export const sceneryManifest = generated as unknown as PackedManifest;
const stores = new WeakMap<Document, ReturnType<typeof createPackedAssetStore>>();
export function packedScenery(doc: Document) {
  let store = stores.get(doc);
  if (!store) {
    store = createPackedAssetStore(
      doc,
      sceneryManifest,
      (filename) => {
        const url = urls[`../generated/scenery/${filename}`];
        if (!url) throw Error(`Missing generated scenery page ${filename}`);
        return url;
      },
      {
        releaseImages: releaseSceneryCutouts,
        ...(typeof window !== 'undefined' && typeof createImageBitmap === 'function'
          ? { bitmap: (image: HTMLImageElement) => decodePackedBitmap(doc, image) }
          : {}),
      },
    );
    stores.set(doc, store);
  }
  return store;
}
export type SceneryLease = ReturnType<ReturnType<typeof packedScenery>['acquire']>;
export function sceneryAtlas(
  stem: string,
  lease: SceneryLease,
  materials: ReturnType<typeof createCachedMaterials>,
): PackedSceneryAtlas {
  const collection = (
    generated.collections as Record<string, { size: number[]; sprites: string[] }>
  )[stem];
  if (!collection) throw Error(`Unknown scenery collection ${stem}`);
  const entries = new Map(
    collection.sprites.map((id) => [
      (generated.sprites as Record<string, { sourceFrame: number[] }>)[id]!.sourceFrame.join(),
      id,
    ]),
  );
  return {
    naturalWidth: collection.size[0]!,
    naturalHeight: collection.size[1]!,
    complete: true,
    resolve(frame) {
      const id = entries.get(frame.join());
      if (!id) throw Error(`Undeclared scenery window ${stem}: ${frame.join()}`);
      const sprite = lease.sprite(id);
      if (!sprite) throw Error(`Scenery sprite not prepared ${id}`);
      return sprite;
    },
    draw(ctx, sprite, frame, x, y, width, height, colour) {
      materials.draw(
        ctx,
        sprite.colour,
        frame,
        x,
        y,
        width,
        height,
        colour,
        packedMaterialFrame(sprite.material, frame),
      );
    },
  };
}
