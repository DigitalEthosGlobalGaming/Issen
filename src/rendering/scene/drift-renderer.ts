import type { Leaf } from './ambient.ts';
import { DRIFT_ATLASES as urls, DRIFT_BY_ID } from './drift-catalog.ts';

export type DriftMode = 'original' | 'shape' | 'sprites';
/** One retained path and three decoded images per runtime; no per-frame image processing. */
export function createDriftRenderer() {
  const images = new Map<string, HTMLImageElement>();
  const shape = new Path2D();
  shape.moveTo(-1, 0);
  shape.quadraticCurveTo(0, -0.48, 1, 0);
  shape.quadraticCurveTo(0, 0.48, -1, 0);
  let mode: DriftMode = 'sprites';
  let disposed = false;
  let pending: Promise<void> | undefined;
  return {
    get mode() {
      return mode;
    },
    set mode(value: DriftMode) {
      mode = value;
    },
    get ready() {
      return images.size === Object.keys(urls).length;
    },
    prepare() {
      return (pending ??= Promise.all(
        Object.entries(urls).map(async ([id, url]) => {
          const image = new Image();
          image.src = url;
          try {
            await image.decode();
            if (!disposed && image.naturalWidth > 0) images.set(id, image);
          } catch {
            /* Runtime startup reports missing artwork and offers retry. */
          }
        }),
      ).then(() => {}));
    },
    draw(g: CanvasRenderingContext2D, leaf: Leaf) {
      if (mode === 'sprites') {
        const sprite = DRIFT_BY_ID.get(leaf.sprite ?? 'leaves.willow')!;
        const image = images.get(sprite.atlas);
        if (!image) return;
        const [x, y, w, h] = sprite.frame;
        const sx = Math.round(x * image.naturalWidth),
          sy = Math.round(y * image.naturalHeight);
        const sw = Math.round((x + w) * image.naturalWidth) - sx;
        const sh = Math.round((y + h) * image.naturalHeight) - sy;
        // Cell padding surrounds the artwork; scale the cell to keep the visible leaf comparable.
        const width = leaf.s * 3 * sprite.size;
        const height = (width * sh) / sw;
        g.globalAlpha *= (leaf.z > 1.25 ? 0.6 : 0.9) * sprite.opacity;
        g.drawImage(
          image,
          sx,
          sy,
          sw,
          sh,
          -width * sprite.pivot[0],
          -height * sprite.pivot[1],
          width,
          height,
        );
      } else if (mode === 'shape') {
        g.scale(leaf.s, leaf.s);
        g.fill(shape);
      } else {
        g.beginPath();
        g.moveTo(-leaf.s, 0);
        g.quadraticCurveTo(0, -leaf.s * 0.48, leaf.s, 0);
        g.quadraticCurveTo(0, leaf.s * 0.48, -leaf.s, 0);
        g.fill();
      }
    },
    dispose() {
      disposed = true;
      images.clear();
    },
  };
}
