import type { SceneDrawing } from '../scene-drawing.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { createMainImageOwner } from '../../platform/main-images.ts';
const ATLAS_URL = new URL('./assets/charm-atlas.webp', import.meta.url).href;
/** Packed source windows; the generated rows are not equal thirds. */
const FRAMES = [
  [110, 22, 265, 336],
  [501, 21, 166, 336],
  [802, 42, 247, 311],
  [1159, 25, 268, 334],
  [157, 384, 173, 245],
  [491, 369, 200, 275],
  [809, 371, 238, 283],
  [1199, 374, 192, 287],
  [147, 650, 170, 353],
  [509, 650, 141, 332],
  [810, 670, 238, 296],
  [1179, 681, 227, 293],
] as const;
const RECIPES: Record<string, readonly [number, string?]> = {
  'first-strike': [1, '#b8322a'],
  'pilgrims-bead': [2, '#7e654c'],
  hisshou: [0, '#9b3930'],
  kaiun: [2],
  yakuyoke: [0, '#586766'],
  enmei: [1, '#68775b'],
  shobai: [2, '#aa713b'],
  kotsu: [3, '#4e6571'],
  gakugyo: [1, '#8574a0'],
  suzu: [4],
  maneki: [5],
  daruma: [6],
  kitsunebi: [7],
  furin: [8],
  ofuda: [9],
  kinun: [2, '#d2ae48'],
  kachi: [0, '#424b75'],
  shingan: [3, '#745b88'],
  ryoen: [3, '#b67572'],
  kagami: [10],
  omikuji: [11],
};

/** Caller owns position/animation; this renderer only replaces the physical charm. */
export function createInkCharmRenderer(doc: Document) {
  const images = createMainImageOwner(doc);
  const materials = createAssetMaterials(doc, { charms: ATLAS_URL }, images);
  let image: HTMLImageElement | undefined;
  let pending: Promise<boolean> | undefined;
  let state: 'idle' | 'loading' | 'ready' | 'unavailable' | 'disposed' = 'idle';
  const cache = new Map<string, HTMLCanvasElement>();
  function prepare(): Promise<boolean> {
    if (state === 'disposed') return Promise.resolve(false);
    if (pending) return pending;
    state = 'loading';
    const lease = images.acquire(ATLAS_URL);
    pending = Promise.all([lease.ready, materials.prepare()]).then(
      ([img, maps]) => {
        if (state === 'disposed') return false;
        image = img;
        const ready =
          img.naturalWidth === 1536 && img.naturalHeight === 1024 && maps.every(Boolean);
        state = ready ? 'ready' : 'unavailable';
        return ready;
      },
      () => {
        if (state !== 'disposed') state = 'unavailable';
        return false;
      },
    );
    return pending;
  }
  /** x/y is the top suspension point; size is full height in caller coordinates. */
  function draw(
    g: SceneDrawing,
    id: string | undefined,
    x: number,
    y: number,
    size: number,
    color?: string,
  ): boolean {
    if (!id || !Object.hasOwn(RECIPES, id) || ![x, y, size].every(Number.isFinite) || size <= 0)
      return false;
    if (state === 'idle') void prepare();
    if (state !== 'ready' || !image) return false;
    const [cell, tone] = RECIPES[id]!;
    const [sx, sy, sw, sh] = FRAMES[cell]!;
    const tint = tone ?? color;
    const key = `${cell}:${tint ?? ''}`;
    let sprite = cache.get(key);
    if (!sprite) {
      sprite = doc.createElement('canvas');
      sprite.width = Math.max(1, Math.round((128 * sw) / sh));
      sprite.height = 128;
      const c = sprite.getContext('2d');
      if (!c) return false;
      c.drawImage(image, sx, sy, sw, sh, 0, 0, sprite.width, sprite.height);
      if (tint) {
        c.globalCompositeOperation = 'source-atop';
        c.globalAlpha = tone ? 0.46 : 0.16;
        c.fillStyle = tint;
        c.fillRect(0, 0, sprite.width, sprite.height);
      }
      cache.set(key, sprite);
      if (cache.size > 32) {
        const oldest = cache.keys().next().value!;
        const prior = cache.get(oldest)!;
        prior.width = prior.height = 0;
        cache.delete(oldest);
      }
    }
    const width = (size * sw) / sh;
    const material = materials.material('charms', FRAMES[cell]!);
    if (material)
      drawMaterialStamp(g, {
        texture: { source: sprite, revision: 0 },
        material,
        x: x - width / 2,
        y,
        width,
        height: size,
      });
    else g.drawImage(sprite, x - width / 2, y, width, size);
    return true;
  }
  return {
    prepare,
    draw,
    snapshot: () => ({
      state,
      cached: cache.size,
      supported: Object.keys(RECIPES),
      decodedLoader: images.snapshot(),
    }),
    dispose() {
      materials.dispose();
      images.dispose();
      state = 'disposed';
      image = undefined;
      for (const c of cache.values()) c.width = c.height = 0;
      cache.clear();
    },
  };
}
