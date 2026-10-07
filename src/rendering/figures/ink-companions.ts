import type { SceneDrawing } from '../scene-drawing.ts';
import { createAssetMaterials } from '../asset-materials.ts';
import { drawMaterialStamp } from '../scene-material.ts';
const COMPANION_URL = new URL('./assets/companion-parts-atlas.webp', import.meta.url).href;
const ROCK_URL = new URL('./assets/mystic-rock.webp', import.meta.url).href;

/** Verified packed windows, with source-pixel joints and native aspect ratios. */
export const INK_COMPANION_FRAMES = [
  [0, 0, 313, 440],
  [313, 0, 314, 440],
  [627, 0, 313, 440],
  [940, 0, 314, 440],
  [0, 440, 313, 300],
  [313, 440, 314, 300],
  [627, 440, 313, 300],
  [940, 440, 314, 300],
  [0, 740, 313, 250],
  [313, 740, 314, 250],
  [627, 740, 313, 250],
  [940, 740, 314, 250],
  [0, 990, 313, 264],
  [313, 990, 314, 264],
  [627, 990, 313, 264],
  [940, 990, 314, 264],
] as const;

/** Companion rigs share one loader; each joint animates without moving the ground anchor. */
export function createInkCompanionRenderer(doc: Document) {
  const materials = createAssetMaterials(doc, { parts: COMPANION_URL, rock: ROCK_URL });
  let image: HTMLImageElement | null = null;
  let pending: Promise<void> | null = null;
  let finishLoad: (() => void) | null = null;
  let ready = false;
  let disposed = false;
  let rock: HTMLImageElement | null = null;
  let rockReady = false;
  let finishRock: (() => void) | null = null;

  function prepare(): Promise<void> {
    if (pending) return pending;
    if (disposed) return Promise.resolve();
    const rockPending = new Promise<void>((resolve) => {
      rock = doc.createElement('img');
      const sprite = rock;
      sprite.decoding = 'async';
      const finish = () => {
        sprite.onload = sprite.onerror = null;
        finishRock = null;
        resolve();
      };
      finishRock = finish;
      sprite.onload = () => {
        rockReady = !disposed && sprite.naturalWidth === 1145 && sprite.naturalHeight === 1373;
        finish();
      };
      sprite.onerror = finish;
      sprite.src = ROCK_URL;
    });
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
      sprite.onerror = finish;
      sprite.src = COMPANION_URL;
    });
    pending = Promise.all([pending, rockPending, materials.prepare()]).then(() => {
      ready = ready && materials.ready('parts');
      rockReady = rockReady && materials.ready('rock');
    });
    return pending;
  }

  function draw(
    type: string,
    g: SceneDrawing,
    x: number,
    y: number,
    size: number,
    time = 0,
    active = false,
    reducedMotion = false,
  ): boolean {
    if (
      disposed ||
      !['crow', 'shiba', 'cat', 'mystic-rock'].includes(type) ||
      size <= 0 ||
      ![x, y, size, time].every(Number.isFinite)
    )
      return false;
    void prepare();
    if (type === 'mystic-rock') {
      if (!rockReady || !rock) return false;
      const factor = size / 1157;
      const bob = reducedMotion ? 0 : Math.sin(time * 1.4) * size * 0.035;
      g.save();
      try {
        const material = materials.material('rock', [0, 0, 1145, 1373]);
        if (material)
          drawMaterialStamp(g, {
            texture: { source: rock, revision: 0 },
            material,
            x: x - 580 * factor,
            y: y - 1350 * factor + bob,
            width: 1145 * factor,
            height: 1373 * factor,
          });
        else
          g.drawImage(
            rock,
            x - 580 * factor,
            y - 1350 * factor + bob,
            1145 * factor,
            1373 * factor,
          );
      } finally {
        g.restore();
      }
      return true;
    }
    if (!ready || !image) return false;
    const t = reducedMotion ? 0 : time;
    const reaction = active && !reducedMotion;
    const sine = (speed: number, phase = 0) => (reducedMotion ? 0 : Math.sin(t * speed + phase));
    const factor =
      size / (type === 'shiba' ? 225 : type === 'cat' ? 235 : type === 'crow' ? 155 : 205);
    function part(
      index: number,
      pivotX: number,
      pivotY: number,
      ax: number,
      ay: number,
      scale = 1,
      angle = 0,
      stretch = 1,
    ) {
      const [sx, sy, sw, sh] = INK_COMPANION_FRAMES[index]!;
      g.save();
      try {
        g.translate(ax, ay);
        g.rotate(angle);
        g.scale(scale, scale * stretch);
        const material = materials.material('parts', INK_COMPANION_FRAMES[index]!);
        if (material)
          drawMaterialStamp(g, {
            texture: { source: image!, revision: 0, frame: INK_COMPANION_FRAMES[index]! },
            material,
            x: -pivotX,
            y: -pivotY,
            width: sw,
            height: sh,
          });
        else g.drawImage(image!, sx, sy, sw, sh, -pivotX, -pivotY, sw, sh);
      } finally {
        g.restore();
      }
    }
    g.save();
    try {
      g.translate(x, y);
      g.scale(factor, factor);
      if (type === 'shiba') {
        const breath = 1 + sine(2.3) * 0.012;
        part(2, 213, 352, -83, -62, 1, sine(reaction ? 8 : 2.2) * (reaction ? 0.24 : 0.07));
        part(0, 216, 361, 0, 0, 1, 0, breath);
        part(3, 138, 238, 15, -130, 1, reaction ? sine(5) * 0.12 : 0);
        part(1, 166, 356, 18, -95 * breath, 0.85, sine(1.6) * 0.035 - (reaction ? 0.08 : 0));
      } else if (type === 'cat') {
        const breath = 1 + sine(2.1, 0.7) * 0.01;
        part(6, 225, 219, -79, -61, 0.9, sine(reaction ? 4 : 1.7) * (reaction ? 0.24 : 0.12));
        part(4, 209, 230, 0, 0, 1, 0, breath);
        part(7, 154, 102, 31, -120, 1, reaction ? sine(4.2) * 0.07 : 0);
        part(5, 182, 225, 34, -111 * breath, 0.8, sine(1.3) * 0.04 - (reaction ? 0.09 : 0));
      } else if (type === 'crow') {
        const flap = sine(reaction ? 10 : 2.4) * (reaction ? 0.22 : 0.025);
        part(11, 88, 87, 5, -95, 0.5, reaction ? -0.8 - flap : 0.4 + flap);
        part(8, 222, 205, 0, 0);
        part(10, 225, 85, 3, -93, 0.65, reaction ? 0.8 + flap : -0.2 - flap);
        part(9, 182, 185, 23, -90, 0.65, sine(1.8) * 0.04);
      }
      return true;
    } finally {
      g.restore();
    }
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    materials.dispose();
    ready = false;
    if (image) {
      image.onload = image.onerror = null;
      image.removeAttribute('src');
    }
    finishLoad?.();
    rockReady = false;
    if (rock) {
      rock.onload = rock.onerror = null;
      rock.removeAttribute('src');
    }
    finishRock?.();
    rock = null;
    image = null;
  }
  return {
    prepare,
    draw,
    dispose,
    get ready() {
      return ready && rockReady;
    },
  };
}
