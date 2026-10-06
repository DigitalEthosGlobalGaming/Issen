import type { SceneDrawing } from '../scene-drawing.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { CHARM_RECIPES as RECIPES } from './charm-catalog.ts';
import { packedSpritePlacement } from '../packed-assets.ts';
import type { FigureLease } from './packed-figures.ts';

/** Caller owns position/animation; this renderer only replaces the physical charm. */
export function createInkCharmRenderer(doc: Document) {
  let lease: FigureLease | undefined;
  let pending: Promise<boolean> | undefined;
  let settle: ((ready: boolean) => void) | undefined;
  let state: 'idle' | 'loading' | 'ready' | 'unavailable' | 'disposed' = 'idle';
  const isDisposed = () => state === 'disposed';
  const cache = new Map<string, HTMLCanvasElement>();
  function prepare(): Promise<boolean> {
    if (state === 'disposed') return Promise.resolve(false);
    if (pending) return pending;
    state = 'loading';
    pending = new Promise<boolean>((resolve) => {
      settle = resolve;
      void (async () => {
        try {
          const { packedFigures } = await import('./packed-figures.ts');
          if (isDisposed()) return;
          const acquired = packedFigures(doc).acquireGroup('charms');
          lease = acquired;
          await acquired.ready;
          if (!isDisposed()) state = 'ready';
        } catch {
          lease?.release();
          lease = undefined;
          if (!isDisposed()) state = 'unavailable';
        } finally {
          settle = undefined;
          resolve(state === 'ready');
        }
      })();
    });
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
    if (state !== 'ready') return false;
    const [cell, tone] = RECIPES[id]!;
    const packed = lease?.sprite(`charm.${cell}`);
    if (!packed || packed.metadata.empty) return false;
    const [sw, sh] = packed.metadata.logicalSize;
    const [sx, sy, pw, ph] = packed.metadata.frame;
    const [tx, ty] = packed.metadata.trim;
    const tint = tone ?? color;
    const key = `${cell}:${tint ?? ''}`;
    let sprite = cache.get(key);
    if (!sprite) {
      sprite = doc.createElement('canvas');
      // Keep the original tint-cache sampling grid; only atlas storage is trimmed.
      sprite.width = Math.max(1, Math.round((128 * sw) / sh));
      sprite.height = 128;
      const c = sprite.getContext('2d');
      if (!c) return false;
      c.drawImage(
        packed.colour,
        sx,
        sy,
        pw,
        ph,
        (tx * sprite.width) / sw,
        (ty * sprite.height) / sh,
        (pw * sprite.width) / sw,
        (ph * sprite.height) / sh,
      );
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
    const material = packed.material;
    const placed = packedSpritePlacement(packed.metadata, x - width / 2, y, width, size);
    const cacheFrame = [
      (tx * sprite.width) / sw,
      (ty * sprite.height) / sh,
      (pw * sprite.width) / sw,
      (ph * sprite.height) / sh,
    ] as const;
    if (material)
      drawMaterialStamp(g, {
        texture: { source: sprite, revision: 0, frame: cacheFrame },
        material,
        ...placed,
      });
    else g.drawImage(sprite, ...cacheFrame, placed.x, placed.y, placed.width, placed.height);
    return true;
  }
  return {
    prepare,
    draw,
    snapshot: () => ({ state, cached: cache.size, supported: Object.keys(RECIPES) }),
    dispose() {
      state = 'disposed';
      lease?.release();
      lease = undefined;
      settle?.(false);
      settle = undefined;
      for (const c of cache.values()) c.width = c.height = 0;
      cache.clear();
    },
  };
}
