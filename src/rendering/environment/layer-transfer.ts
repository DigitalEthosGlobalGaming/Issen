import type { SceneMaterial } from '../scene-frame.ts';
import type { ComposedLayer } from './worker-types.ts';

type LayerSource = { colour: HTMLCanvasElement; material: SceneMaterial | null };
type Copy = (source: ImageBitmapSource, colour: boolean) => Promise<ImageBitmap>;

/** Every exported plane gets an independent bitmap, even when its source is shared. */
export function exportedLayerBytes(entries: readonly LayerSource[]): number {
  const bytes = (source: {
    width: number;
    height: number;
    naturalWidth?: number;
    naturalHeight?: number;
  }) => (source.naturalWidth ?? source.width) * (source.naturalHeight ?? source.height) * 4;
  return entries.reduce(
    (total, entry) =>
      total +
      bytes(entry.colour) +
      (['normal', 'surface', 'emissive'] as const).reduce(
        (sum, kind) => sum + (entry.material?.[kind] ? bytes(entry.material[kind].source) : 0),
        0,
      ),
    0,
  );
}

/** Copy all planes concurrently, retaining ownership until every copy has settled. */
export async function copyComposedLayers(
  entries: readonly LayerSource[],
  copy: Copy = (source, colour) =>
    createImageBitmap(source, {
      premultiplyAlpha: colour ? 'premultiply' : 'none',
      colorSpaceConversion: 'none',
    }),
): Promise<ComposedLayer[]> {
  const owned = new Set<ImageBitmap>();
  const copies: Promise<ImageBitmap>[] = [];
  function start(source: ImageBitmapSource, colour = false) {
    const pending = Promise.resolve()
      .then(() => copy(source, colour))
      .then((bitmap) => {
        owned.add(bitmap);
        return bitmap;
      });
    copies.push(pending);
    return pending;
  }
  const layers = entries.map((entry) => {
    const keys = [
      'colour',
      ...(['normal', 'surface', 'emissive'] as const).filter((kind) => entry.material?.[kind]),
    ] as const;
    return Promise.all(
      keys.map(
        async (kind) =>
          [
            kind,
            await start(
              kind === 'colour' ? entry.colour : entry.material![kind]!.source,
              kind === 'colour',
            ),
          ] as const,
      ),
    ).then((planes) => Object.fromEntries(planes) as ComposedLayer);
  });
  try {
    return await Promise.all(layers);
  } catch (error) {
    // A failed layer's Promise.all can reject while its other planes are pending.
    await Promise.allSettled(copies);
    for (const bitmap of owned) bitmap.close();
    throw error;
  }
}
