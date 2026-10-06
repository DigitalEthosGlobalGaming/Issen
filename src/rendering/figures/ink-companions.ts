import type { SceneDrawing } from '../scene-drawing.ts';
import { INK_COMPANION_FRAMES } from './companion-catalog.ts';
import { packedSpritePlacement } from '../packed-assets.ts';
import type { FigureLease } from './packed-figures.ts';
import { drawMaterialStamp } from '../scene-material.ts';
export { INK_COMPANION_FRAMES } from './companion-catalog.ts';
/** Companion rigs share one loader; each joint animates without moving the ground anchor. */
export function createInkCompanionRenderer(doc: Document) {
  let lease: FigureLease | undefined;
  let pending: Promise<void> | null = null;
  let ready = false,
    disposed = false;
  function prepare(): Promise<void> {
    if (pending) return pending;
    if (disposed) return Promise.resolve();
    pending = (async () => {
      try {
        const { packedFigures } = await import('./packed-figures.ts');
        if (disposed) return;
        const acquired = packedFigures(doc).acquireGroup('companions');
        lease = acquired;
        await acquired.ready;
        ready = !disposed;
      } catch {
        lease?.release();
        lease = undefined;
      }
    })();
    return pending;
  }
  function stamp(g: SceneDrawing, id: string, x: number, y: number, width: number, height: number) {
    const packed = lease?.sprite(id);
    if (!packed || packed.metadata.empty) return;
    const placed = packedSpritePlacement(packed.metadata, x, y, width, height);
    if (packed.material)
      drawMaterialStamp(g, {
        texture: { source: packed.colour, revision: 0, frame: packed.metadata.frame },
        material: packed.material,
        ...placed,
      });
    else
      g.drawImage(
        packed.colour,
        ...packed.metadata.frame,
        placed.x,
        placed.y,
        placed.width,
        placed.height,
      );
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
      if (!ready) return false;
      const factor = size / 1157;
      const bob = reducedMotion ? 0 : Math.sin(time * 1.4) * size * 0.035;
      g.save();
      try {
        stamp(
          g,
          'companion.rock',
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
    if (!ready) return false;
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
        stamp(g, `companion.parts.${index}`, -pivotX, -pivotY, sw, sh);
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
    ready = false;
    lease?.release();
    lease = undefined;
  }
  return {
    prepare,
    draw,
    dispose,
    get ready() {
      return ready && !disposed;
    },
  };
}
