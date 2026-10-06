import type { SceneMaterial } from './scene-frame.ts';

type Frame = readonly [number, number, number, number];
type Plane = 'colour' | 'normal' | 'surface' | 'emissive';
export interface PackedSprite {
  sourceFrame?: Frame;
  page: number;
  frame: Frame;
  logicalSize: readonly [number, number];
  trim: readonly [number, number];
  pivot: readonly [number, number];
  planes: readonly Plane[];
  empty: boolean;
}
export interface PackedManifest {
  version: number;
  pages: readonly { size: readonly [number, number]; maps: Partial<Record<Plane, string>> }[];
  sprites: Readonly<Record<string, PackedSprite>>;
  dependencies: Readonly<Record<string, readonly string[]>>;
}
type LoadedPage = {
  references: number;
  images: Partial<Record<Plane, HTMLImageElement | ImageBitmap>>;
  ready: Promise<void>;
};

/** Aligned packed planes follow a padded sampling rectangle together. */
export function packedMaterialFrame(
  material: SceneMaterial | null,
  frame: Frame,
): SceneMaterial | null {
  if (!material) return null;
  return {
    ...material,
    ...(material.normal ? { normal: { ...material.normal, frame } } : {}),
    ...(material.surface ? { surface: { ...material.surface, frame } } : {}),
    ...(material.emissive ? { emissive: { ...material.emissive, frame } } : {}),
  };
}

/** Rasterize once at declared resolution before shrinking any page crops.
 * Encoded-image first draws can select different decoder sampling caches.
 * The scratch canvas is transient; the page owns only the resulting bitmap.
 */
export async function decodePackedBitmap(
  doc: Document,
  image: HTMLImageElement,
): Promise<ImageBitmap> {
  const canvas = doc.createElement('canvas');
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  try {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw Error('Unable to rasterize packed page');
    ctx.drawImage(image, 0, 0);
    return await createImageBitmap(canvas);
  } finally {
    canvas.width = canvas.height = 0;
  }
}

/** Shared decoded page ownership within one document/worker realm, independent of GPU surfaces. */
export function createPackedAssetStore(
  doc: Document,
  manifest: PackedManifest,
  resolveUrl: (filename: string) => string,
  options: {
    releaseImages?: (images: (HTMLImageElement | ImageBitmap)[]) => void;
    bitmap?: (image: HTMLImageElement) => Promise<ImageBitmap>;
  } = {},
) {
  if (manifest.version !== 1) throw Error('Unsupported packed asset schema');
  const pages = new Map<number, LoadedPage>();
  let disposed = false;
  function clear(page: LoadedPage) {
    options.releaseImages?.(
      Object.values(page.images).filter(
        (image): image is HTMLImageElement | ImageBitmap => !!image,
      ),
    );
    for (const image of Object.values(page.images)) {
      if (image && 'removeAttribute' in image) image.removeAttribute('src');
      else image?.close();
    }
    page.images = {};
  }
  function load(index: number): LoadedPage {
    const prior = pages.get(index);
    if (prior) return prior;
    const description = manifest.pages[index];
    if (!description?.maps.colour) throw Error(`Missing packed page ${index}`);
    const page: LoadedPage = { references: 0, images: {}, ready: Promise.resolve() };
    pages.set(index, page);
    page.ready = Promise.all(
      Object.entries(description.maps).map(async ([kind, filename]) => {
        if (!filename) throw Error(`Missing ${kind} page URL`);
        const image = doc.createElement('img');
        page.images[kind as Plane] = image;
        image.src = resolveUrl(filename);
        await image.decode();
        if (disposed || pages.get(index) !== page)
          throw Error('Packed page released during loading');
        if (
          image.naturalWidth !== description.size[0] ||
          image.naturalHeight !== description.size[1]
        )
          throw Error(`Packed page ${index} ${kind} dimensions differ`);
        if (options.bitmap) {
          const bitmap = await options.bitmap(image);
          image.removeAttribute('src');
          if (disposed || pages.get(index) !== page) {
            bitmap.close();
            throw Error('Packed page released during bitmap preparation');
          }
          page.images[kind as Plane] = bitmap;
        }
      }),
    ).then(() => {});
    // Acquisition callers observe errors; disposing without awaiting a lease is also safe.
    void page.ready.catch(() => {});
    return page;
  }
  function acquire(ids: readonly string[]) {
    if (disposed) throw Error('Packed asset store disposed');
    const unique = new Set(ids);
    const indices = new Set<number>();
    for (const id of unique) {
      const sprite = manifest.sprites[id];
      if (!sprite) throw Error(`Unknown packed sprite ${id}`);
      if (!manifest.pages[sprite.page]?.maps.colour)
        throw Error(`Unknown or incomplete page for ${id}`);
      indices.add(sprite.page);
    }
    const owned = new Map<number, LoadedPage>();
    for (const index of indices) {
      const page = load(index);
      page.references++;
      owned.set(index, page);
    }
    let released = false,
      ready = false;
    function release() {
      if (released) return;
      released = true;
      for (const [index, page] of owned) {
        page.references--;
        if (!page.references && pages.get(index) === page) {
          pages.delete(index);
          clear(page);
        }
      }
      owned.clear();
    }
    const prepared = Promise.all([...owned.values()].map((page) => page.ready))
      .then(() => {
        if (released || disposed) throw Error('Packed asset lease released during loading');
        ready = true;
      })
      .catch((error: unknown) => {
        release();
        throw error;
      });
    void prepared.catch(() => {});
    return {
      ready: prepared,
      release,
      sprite(id: string) {
        if (!ready || released || disposed || !unique.has(id)) return null;
        const sprite = manifest.sprites[id]!;
        const images = owned.get(sprite.page)!.images;
        const material: SceneMaterial | null =
          sprite.planes.includes('normal') && images.normal
            ? {
                normal: { source: images.normal, revision: 0, frame: sprite.frame },
                surface:
                  sprite.planes.includes('surface') && images.surface
                    ? { source: images.surface, revision: 0, frame: sprite.frame }
                    : undefined,
                emissive:
                  sprite.planes.includes('emissive') && images.emissive
                    ? { source: images.emissive, revision: 0, frame: sprite.frame }
                    : undefined,
                normalY: -1,
                lighting: 1,
                depth: 0,
                fog: 0,
                fogColor: [0.53, 0.51, 0.47],
              }
            : null;
        return { metadata: sprite, colour: images.colour!, material };
      },
    };
  }
  return {
    acquire,
    acquireGroup(name: string) {
      const ids = manifest.dependencies[name];
      if (!ids) throw Error(`Unknown packed dependency group ${name}`);
      return acquire(ids);
    },
    snapshot() {
      return {
        pages: pages.size,
        references: [...pages.values()].reduce((sum, page) => sum + page.references, 0),
        nominalPixels: [...pages.keys()].reduce((sum, index) => {
          const description = manifest.pages[index]!;
          return (
            sum + description.size[0] * description.size[1] * Object.keys(description.maps).length
          );
        }, 0),
      };
    },
    dispose() {
      disposed = true;
      for (const page of pages.values()) clear(page);
      pages.clear();
    },
  };
}

/** Keep placement in logical source coordinates even when stored pixels are tightly trimmed. */
export function packedSpritePlacement(
  sprite: PackedSprite,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const scaleX = width / sprite.logicalSize[0],
    scaleY = height / sprite.logicalSize[1];
  return {
    x: x + sprite.trim[0] * scaleX,
    y: y + sprite.trim[1] * scaleY,
    width: sprite.frame[2] * scaleX,
    height: sprite.frame[3] * scaleY,
  };
}
