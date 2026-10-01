const COMPANION_URL = new URL('./assets/companion-atlas.png', import.meta.url).href;

/** Explicit packed source rectangles; the generated animals cross the nominal half-height. */
export const INK_COMPANION_FRAMES = {
  shiba: { x: 0, y: 0, width: 660, height: 665, pivotX: 433, pivotY: 637, scale: 1.14 / 591 },
  cat: { x: 660, y: 0, width: 594, height: 665, pivotX: 364, pivotY: 640, scale: 1.08 / 555 },
  crow: { x: 0, y: 665, width: 660, height: 589, pivotX: 397, pivotY: 518, scale: 1.65 / 583 },
  crowRaised: {
    x: 660,
    y: 665,
    width: 594,
    height: 589,
    pivotX: 366,
    pivotY: 518,
    scale: 1.65 / 583,
  },
} as const;

/** Caller owns item selection and classic fallback; coordinates use its existing pet size units. */
export function createInkCompanionRenderer(doc: Document) {
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
        ready = !disposed && sprite.naturalWidth === 1254 && sprite.naturalHeight === 1254;
        finish();
      };
      sprite.onerror = () => {
        ready = false;
        finish();
      };
      sprite.src = COMPANION_URL;
    });
    return pending;
  }

  function draw(
    type: string,
    g: CanvasRenderingContext2D,
    x: number,
    y: number,
    size: number,
    time = 0,
    active = false,
    reducedMotion = false,
  ): boolean {
    if (
      disposed ||
      !['crow', 'shiba', 'cat'].includes(type) ||
      size <= 0 ||
      ![x, y, size, time].every(Number.isFinite)
    )
      return false;
    void prepare();
    if (!ready || !image) return false;
    // Raised wings are a single reaction pose, not an unrelated-frame animation loop.
    const key =
      type === 'crow' && active && !reducedMotion
        ? 'crowRaised'
        : (type as 'crow' | 'shiba' | 'cat');
    const frame = INK_COMPANION_FRAMES[key];
    const factor = frame.scale * size;
    const breath = reducedMotion || type === 'crow' ? 1 : 1 + Math.sin(time * 2.3) * 0.008;
    g.save();
    try {
      g.translate(x, y);
      g.scale(1, breath);
      g.drawImage(
        image,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        -frame.pivotX * factor,
        -frame.pivotY * factor,
        frame.width * factor,
        frame.height * factor,
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
