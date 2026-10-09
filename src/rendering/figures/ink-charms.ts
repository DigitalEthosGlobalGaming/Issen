import type { SceneDrawing } from '../scene-drawing.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { createMainImageOwner, documentImageBudget } from '../../platform/main-images.ts';
import { assetMaterialCatalog } from '../asset-material-catalog.ts';
import { createPreparedFigureAtlas } from './prepared-atlas.ts';
import { trackPixelSource } from '../../platform/pixel-memory.ts';
import { retireSceneTexture } from '../texture-revision.ts';
import { materialTextureUploads, nextVisibleFrame, type TextureUpload } from '../texture-upload.ts';
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
  const compact = documentImageBudget(doc) <= 256 * 1024 * 1024;
  const materials = compact ? undefined : createAssetMaterials(doc, { charms: ATLAS_URL }, images);
  const pack = assetMaterialCatalog.find((pack) => pack.source === ATLAS_URL)!;
  const parts = compact
    ? createPreparedFigureAtlas(
        doc,
        { ...pack.maps, diffuse: ATLAS_URL },
        1536,
        1024,
        FRAMES,
        true,
        { images, maxSize: 128 },
      )
    : undefined;
  let image: HTMLImageElement | undefined;
  let pending: Promise<boolean> | undefined;
  let state: 'idle' | 'loading' | 'ready' | 'unavailable' | 'disposed' = 'idle';
  const cache = new Map<string, HTMLCanvasElement>();
  function prepare(): Promise<boolean> {
    if (state === 'disposed') return Promise.resolve(false);
    if (pending) return pending;
    state = 'loading';
    if (parts) {
      return (pending = parts.prepare().then((ready) => {
        if (state === 'disposed') return false;
        state = ready ? 'ready' : 'unavailable';
        return ready;
      }));
    }
    const lease = images.acquire(ATLAS_URL);
    pending = Promise.all([lease.ready, materials!.prepare()]).then(
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
  const preparation = new AbortController();
  function sprite(id: string, color?: string) {
    if (state !== 'ready') return;
    const [cell, tone] = RECIPES[id]!;
    const frame = FRAMES[cell]!;
    const colour = parts?.colour(frame);
    const source = colour?.source ?? image;
    if (!source) return;
    const [sx, sy, sw, sh] = colour?.frame ?? frame;
    const tint = tone ?? color;
    const key = `${cell}:${tint ?? ''}`;
    let sprite = cache.get(key);
    if (!sprite) {
      sprite = trackPixelSource(doc, doc.createElement('canvas'), 'canvas');
      sprite.width = Math.max(1, Math.round((128 * frame[2]) / frame[3]));
      sprite.height = 128;
      const c = sprite.getContext('2d');
      if (!c) return false;
      c.drawImage(source, sx, sy, sw, sh, 0, 0, sprite.width, sprite.height);
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
        retireSceneTexture(prior, true);
        prior.width = prior.height = 0;
        cache.delete(oldest);
      }
    }
    return { image: sprite, frame: FRAMES[cell]!, ratio: frame[2] / frame[3] };
  }
  async function prepareUploads(
    id: string | undefined,
    color: string | undefined,
    signal: AbortSignal,
  ): Promise<TextureUpload[] | undefined> {
    const lifetime = AbortSignal.any([signal, preparation.signal]);
    if (lifetime.aborted) return;
    if (!id || !Object.hasOwn(RECIPES, id)) return [];
    if (!(await prepare()) || !(await nextVisibleFrame(doc, lifetime)) || lifetime.aborted) return;
    const part = sprite(id, color);
    if (!part) return;
    return materialTextureUploads(
      { source: part.image, revision: 0 },
      parts?.material(part.frame) ?? materials?.material('charms', part.frame),
    );
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
    if (state !== 'ready') return false;
    const part = sprite(id, color);
    if (!part) return false;
    const { image: texture, frame } = part;
    const width = size * part.ratio;
    const material = parts?.material(frame) ?? materials?.material('charms', frame);
    if (material)
      drawMaterialStamp(g, {
        texture: { source: texture, revision: 0 },
        material,
        x: x - width / 2,
        y,
        width,
        height: size,
      });
    else g.drawImage(texture, x - width / 2, y, width, size);
    return true;
  }
  return {
    prepare,
    prepareUploads,
    draw,
    snapshot: () => ({
      state,
      compact,
      partPixels:
        parts
          ?.textureSources()
          .reduce((pixels, source) => pixels + source.width * source.height, 0) ?? 0,
      cached: cache.size,
      supported: Object.keys(RECIPES),
      decodedLoader: images.snapshot(),
    }),
    dispose() {
      preparation.abort();
      parts?.dispose();
      materials?.dispose();
      images.dispose();
      state = 'disposed';
      image = undefined;
      for (const c of cache.values()) {
        retireSceneTexture(c);
        c.width = c.height = 0;
      }
      cache.clear();
    },
  };
}
