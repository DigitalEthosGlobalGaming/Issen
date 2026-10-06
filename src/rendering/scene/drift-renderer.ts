import type { SceneDrawing } from '../scene-drawing.ts';
import type { Leaf } from './ambient.ts';
import { DRIFT_BY_ID } from './drift-catalog.ts';
import type { WeatherParticle } from './weather-state.ts';
import { packedDrift } from './packed-drift.ts';
import { packedSpritePlacement } from '../packed-assets.ts';
import { drawMaterialStamp } from '../scene-material.ts';

/** Canonical packed pages are shared by overlapping runtimes and previews. */
export function createDriftRenderer(doc: Document = document) {
  const store = packedDrift(doc);
  let lease: ReturnType<typeof store.acquire> | undefined;
  let selected: readonly string[] = [];
  let selectedKey = '';
  let generation = 0;
  let preparing: ReturnType<typeof store.acquire> | undefined;
  let pendingKey = '';
  let disposed = false;
  let pending: Promise<boolean> | undefined;
  function paint(g: SceneDrawing, id: string, size: number, opacity: number) {
    const sprite = DRIFT_BY_ID.get(id)!;
    const packed = lease?.sprite(id);
    if (!packed || packed.metadata.empty) return;
    const [sw, sh] = packed.metadata.logicalSize;
    const width = size * sprite.size,
      height = (width * sh) / sw;
    g.globalAlpha *= opacity * sprite.opacity;
    const frame = packed.metadata.frame;
    const material = packed.material;
    const dx = -width * sprite.pivot[0],
      dy = -height * sprite.pivot[1];
    const placed = packedSpritePlacement(packed.metadata, dx, dy, width, height);
    if (material)
      drawMaterialStamp(g, {
        texture: { source: packed.colour, revision: 0, frame },
        material,
        ...placed,
      });
    else g.drawImage(packed.colour, ...frame, placed.x, placed.y, placed.width, placed.height);
  }
  return {
    get ready() {
      return !!lease && !disposed;
    },
    snapshot: () => ({ selected: [...selected], pending: pendingKey, ...store.snapshot() }),
    prepare(ids: readonly string[] = [...DRIFT_BY_ID.keys()]) {
      if (disposed) return Promise.reject(Error('Drift renderer disposed'));
      const unique = [...new Set(ids)].sort();
      const key = JSON.stringify(unique);
      if (pending && key === pendingKey) return pending;
      const request = ++generation;
      preparing?.release();
      preparing = undefined;
      pending = undefined;
      pendingKey = '';
      if (key === selectedKey) return Promise.resolve(true);
      const acquired = store.acquire(unique);
      preparing = acquired;
      pendingKey = key;
      pending = acquired.ready
        .then(() => {
          if (disposed || request !== generation) {
            acquired.release();
            return false;
          }
          const previous = lease;
          lease = acquired;
          selected = unique;
          selectedKey = key;
          previous?.release();
          preparing = undefined;
          pendingKey = '';
          pending = undefined;
          return true;
        })
        .catch((error: unknown) => {
          acquired.release();
          if (disposed || request !== generation) return false;
          preparing = undefined;
          pendingKey = '';
          pending = undefined;
          throw error;
        });
      return pending;
    },
    draw(g: SceneDrawing, leaf: Leaf) {
      paint(g, leaf.sprite ?? 'leaves.willow', leaf.s * 3, leaf.z > 1.25 ? 0.6 : 0.9);
    },
    drawEmber(g: SceneDrawing, p: WeatherParticle, index: number, scale: number) {
      g.save();
      g.translate(p.x, p.y);
      g.rotate(p.ph);
      paint(
        g,
        index % 3 === 0 ? 'fire.coal' : index % 3 === 1 ? 'fire.ember' : 'fire.streak',
        (3 + p.z * 4) * scale,
        0.75,
      );
      g.restore();
    },
    dispose() {
      disposed = true;
      generation++;
      preparing?.release();
      preparing = undefined;
      selected = [];
      selectedKey = pendingKey = '';
      lease?.release();
      lease = undefined;
    },
  };
}
