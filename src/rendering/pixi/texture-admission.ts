import type { TextureSource } from 'pixi.js';

/** Admit changed pending storage immediately; reconcile unchanged frames once a second.
 * Weak keys never retain artwork, and context generations require fresh admission. */
export function createTextureAdmission() {
  const admitted = new WeakMap<
    TextureSource,
    {
      width: number;
      height: number;
      mipmaps: boolean;
      format: string;
      generation: number;
    }
  >();
  let nextReconciliation = 0;
  return {
    required(
      sources: Iterable<TextureSource>,
      rendererUid: number,
      generation: number,
      now: number,
    ) {
      let changed = false;
      for (const source of sources) {
        if (source._gpuData?.[rendererUid]) {
          admitted.delete(source);
          continue;
        }
        if (source.pixelWidth <= 0 || source.pixelHeight <= 0) continue;
        const previous = admitted.get(source);
        if (
          previous?.width === source.pixelWidth &&
          previous.height === source.pixelHeight &&
          previous.mipmaps === source.autoGenerateMipmaps &&
          previous.format === source.format &&
          previous.generation === generation
        )
          continue;
        admitted.set(source, {
          width: source.pixelWidth,
          height: source.pixelHeight,
          mipmaps: source.autoGenerateMipmaps,
          format: source.format,
          generation,
        });
        changed = true;
      }
      if (!changed && now < nextReconciliation) return false;
      nextReconciliation = now + 1000;
      return true;
    },
  };
}
