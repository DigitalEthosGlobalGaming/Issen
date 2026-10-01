import { createOutfitKit, supportsInkOutfit } from './outfit-kit.ts';
import type { Figure, FigureEnvironment, Point } from './types.ts';

const ATLAS_URL = new URL('./assets/player-ronin-simple.png', import.meta.url).href;
type Part = 'body' | 'head' | 'arms';
type Frame = readonly [number, number, number, number];
/** Tight source frames in original 1254² atlas; see adjacent provenance metadata. */
export const PLAYER_FRAMES = {
  torso: [45, 54, 382, 358],
  head: [523, 110, 229, 282],
  leftPanel: [864, 45, 366, 392],
  rightPanel: [37, 452, 380, 369],
  leftSleeve: [503, 464, 233, 368],
  rightSleeve: [924, 465, 257, 368],
  leftForearm: [134, 861, 165, 344],
  rightForearm: [554, 861, 155, 344],
  hand: [959, 926, 165, 236],
} as const satisfies Record<string, Frame>;
export type InkPlayerRenderer = ReturnType<typeof createInkPlayerRenderer>;

/** Per-runtime atlas ownership. draw/drawPart inherit normalized figure transforms and alpha. */
export function createInkPlayerRenderer(doc: Document) {
  const outfits = createOutfitKit(doc);
  let atlas: HTMLImageElement | null = null;
  let state: 'idle' | 'loading' | 'ready' | 'unavailable' | 'disposed' = 'idle';
  let pending: Promise<boolean> | null = null;
  let settle: ((ready: boolean) => void) | undefined;
  function prepare(): Promise<boolean> {
    if (pending) return pending;
    if (state === 'disposed') return Promise.resolve(false);
    void outfits.prepare();
    state = 'loading';
    const image = doc.createElement('img');
    atlas = image;
    pending = new Promise<boolean>((resolve) => {
      settle = resolve;
      image.onload = () => {
        state =
          image.naturalWidth === 1254 && image.naturalHeight === 1254 ? 'ready' : 'unavailable';
        resolve(state === 'ready');
        settle = undefined;
      };
      image.onerror = () => {
        state = 'unavailable';
        resolve(false);
        settle = undefined;
      };
    });
    image.src = ATLAS_URL;
    pending = pending.then(async (ready) => {
      await outfits.prepare();
      return ready;
    });
    return pending;
  }
  function stamp(
    g: CanvasRenderingContext2D,
    key: keyof typeof PLAYER_FRAMES,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const [sx, sy, sw, sh] = PLAYER_FRAMES[key];
    g.drawImage(atlas!, sx, sy, sw, sh, x, y, w, h);
  }
  function joints(f: Figure) {
    const l = f.lean || 0,
      p = f.pose;
    const h1: Point = [p.gx + l, p.gy];
    const length = f.spear ? 0.2 : 0.075;
    const h2: Point = f.twin
      ? [-0.19 + l, -0.5]
      : [h1[0] - Math.cos(p.ang) * length, h1[1] - Math.sin(p.ang) * length];
    // Stable grip identities avoid exchanging painted limbs as hands cross on a swing.
    return [h1, h2].map((hand, i) => {
      const side = i ? 1 : -1;
      const shoulder: Point = [side * 0.15 + l, -0.765];
      const elbow: Point = [
        (shoulder[0] + hand[0]) / 2 + side * 0.05,
        (shoulder[1] + hand[1]) / 2 + 0.05,
      ];
      return { shoulder, elbow, hand };
    });
  }
  function bone(
    g: CanvasRenderingContext2D,
    key: keyof typeof PLAYER_FRAMES,
    a: Point,
    b: Point,
    width: number,
  ) {
    g.save();
    g.translate(a[0], a[1]);
    g.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2);
    // Small joint overlap prevents holes; length follows the existing exact hand target.
    stamp(g, key, -width / 2, -0.018, width, Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.035);
    g.restore();
  }
  function drawPart(
    g: CanvasRenderingContext2D,
    part: Part,
    f: Figure,
    env: FigureEnvironment,
  ): boolean {
    if (!f.back || !supportsInkOutfit(f.robeId)) return false;
    if (part === 'head' && f.robeId === 'sumi' && f.variant) return false;
    if (state !== 'ready' || !atlas) {
      if (state === 'idle') void prepare();
      return false;
    }
    if (!outfits.ready(f.robeId)) return false;
    const l = f.lean || 0;
    g.save();
    if (part === 'body') {
      const sway =
        env.reducedMotion || env.reducedFlashes
          ? 0
          : Math.sin(env.time * 1.8 + f.d.seed) * 0.012 + env.wind * 0.003;
      g.save();
      g.translate(l * 0.5, -0.51);
      g.rotate(sway);
      // Opaque under-robe joins the separately posed panels across the broad obi.
      // It tapers into their overlapping hems rather than exposing the backdrop.
      g.fillStyle = '#20201f';
      g.beginPath();
      g.moveTo(-0.12, -0.008);
      g.lineTo(0.12, -0.008);
      g.lineTo(0.19, 0.47);
      g.lineTo(0.04, 0.51);
      g.lineTo(-0.17, 0.47);
      g.closePath();
      g.fill();
      g.save();
      g.transform(1, 0, -0.065, 1, 0, 0);
      stamp(g, 'leftPanel', -0.26, 0, 0.325, 0.52);
      g.restore();
      g.save();
      g.transform(1, 0, 0.065, 1, 0, 0);
      stamp(g, 'rightPanel', -0.065, 0, 0.325, 0.52);
      g.restore();
      g.restore();
      stamp(g, 'torso', -0.175 + l * 0.8, -0.835, 0.35, 0.355);
      outfits.draw(g, 'body', f);
    } else if (part === 'head') {
      if (f.robeId !== 'shinobi') stamp(g, 'head', l * 1.05 - 0.067, -0.973, 0.134, 0.171);
      outfits.draw(g, 'head', f);
    } else {
      joints(f).forEach((j, i) => {
        bone(g, i ? 'rightSleeve' : 'leftSleeve', j.shoulder, j.elbow, 0.135);
        bone(g, i ? 'rightForearm' : 'leftForearm', j.elbow, j.hand, 0.055);
        g.save();
        g.translate(j.hand[0], j.hand[1]);
        g.rotate(f.pose.ang + Math.PI / 2);
        stamp(g, 'hand', -0.024, -0.024, 0.048, 0.058);
        g.restore();
        outfits.drawArm(g, f, i, j.shoulder, j.elbow, j.hand);
      });
    }
    g.restore();
    return true;
  }
  return {
    prepare,
    drawPart,
    draw(g: CanvasRenderingContext2D, f: Figure, env: FigureEnvironment) {
      if (state !== 'ready') {
        if (state === 'idle') void prepare();
        return false;
      }
      drawPart(g, 'arms', f, env);
      const body = drawPart(g, 'body', f, env);
      drawPart(g, 'head', f, env);
      return body;
    },
    snapshot: () => ({
      status: state,
      ready: state === 'ready',
      parts: state === 'ready' ? 9 : 0,
      outfits: outfits.snapshot(),
    }),
    dispose() {
      state = 'disposed';
      outfits.dispose();
      if (atlas) {
        atlas.onload = null;
        atlas.onerror = null;
        atlas.removeAttribute('src');
      }
      atlas = null;
      settle?.(false);
      settle = undefined;
    },
  };
}
