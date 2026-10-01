import type { Palette } from '../palette.ts';
import type { BladeStyle } from './types.ts';

const KATANA_URL = new URL('./assets/katana.png', import.meta.url).href;
/** Measured source pixels, with top-left origin. Grip is immediately behind the guard. */
export const INK_KATANA_GEOMETRY = {
  width: 2172,
  height: 724,
  grip: { x: 535, y: 355 },
  tip: { x: 2064, y: 306 },
  visibleBounds: { x: 106, y: 265, width: 1959, height: 178 },
  defaultLength: 0.52,
} as const;

/** Instance-owned physical sword only. Caller gates the player and equipped item ID. */
export function createInkSwordRenderer(doc: Document) {
  let image: HTMLImageElement | null = null;
  let pending: Promise<void> | null = null;
  let finishLoad: (() => void) | null = null;
  let ready = false;
  let disposed = false;

  function prepare(): Promise<void> {
    if (pending) return pending;
    if (disposed) return Promise.resolve();
    pending = new Promise<void>((resolve) => {
      const sprite = doc.createElement('img');
      image = sprite;
      sprite.decoding = 'async';
      const finish = () => {
        sprite.onload = sprite.onerror = null;
        finishLoad = null;
        resolve();
      };
      finishLoad = finish;
      sprite.onload = () => {
        ready = !disposed && sprite.naturalWidth > 0 && sprite.naturalHeight > 0;
        finish();
      };
      sprite.onerror = () => {
        ready = false;
        finish();
      };
      sprite.src = KATANA_URL;
    });
    return pending;
  }

  function draw(
    g: CanvasRenderingContext2D,
    gx: number,
    gy: number,
    ang: number,
    _C: Palette,
    bs?: BladeStyle | null,
  ): boolean {
    // Other physical forms and lengths retain classic art. Item identity belongs to the caller.
    // Steel awakenings keep the same body: their glow/aura/edge overlays remain caller-owned.
    const length = bs?.len ?? INK_KATANA_GEOMETRY.defaultLength;
    if (
      disposed ||
      (bs?.kind && bs.kind !== 'katana') ||
      Math.abs(length - 0.52) > 0.00001 ||
      ![gx, gy, ang, length].every(Number.isFinite)
    )
      return false;
    void prepare();
    if (!ready || !image) return false;
    const { grip, tip } = INK_KATANA_GEOMETRY;
    const dx = tip.x - grip.x,
      dy = tip.y - grip.y;
    const scale = Math.hypot(length, length * 0.05) / Math.hypot(dx, dy);
    // Preserve native shape while aligning with figure.ts tipOf() and aura geometry.
    const correction = Math.atan2(-0.05, 1) - Math.atan2(dy, dx);
    g.save();
    try {
      g.translate(gx, gy);
      g.rotate(ang + correction);
      if (bs?.alpha !== undefined) g.globalAlpha *= Math.max(0, Math.min(1, bs.alpha));
      g.drawImage(
        image,
        -grip.x * scale,
        -grip.y * scale,
        INK_KATANA_GEOMETRY.width * scale,
        INK_KATANA_GEOMETRY.height * scale,
      );
      return true;
    } finally {
      g.restore();
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    ready = false;
    if (image) {
      image.onload = image.onerror = null;
      image.removeAttribute('src');
    }
    finishLoad?.();
    image = null;
  }
  return {
    prepare,
    draw,
    dispose,
    get ready() {
      return ready;
    },
  };
}
