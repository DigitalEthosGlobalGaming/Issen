import { PLAYER_FRAMES } from './player-catalog.ts';
import { packedSpritePlacement } from '../packed-assets.ts';
import type { FigureLease } from './packed-figures.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { createPalette } from '../palette.ts';
import { createOutfitKit, supportsInkOutfit } from './outfit-kit.ts';
import type { Figure, FigureEnvironment, Point } from './types.ts';

type Part = 'body' | 'head' | 'arms';
export { PLAYER_FRAMES } from './player-catalog.ts';
export type InkPlayerRenderer = ReturnType<typeof createInkPlayerRenderer>;

/** Per-runtime atlas ownership. draw/drawPart inherit normalized figure transforms and alpha. */
export function createInkPlayerRenderer(doc: Document) {
  let lease: FigureLease | undefined;
  const outfits = createOutfitKit(doc);
  const palettes = createPalette();
  const tones = new Map<string, HTMLCanvasElement>();
  let currentTone: string | undefined;
  function tonePart(key: keyof typeof PLAYER_FRAMES): HTMLCanvasElement | null {
    if (!currentTone || key === 'head' || key === 'hand' || !lease) return null;
    const id = currentTone + ':' + key,
      prior = tones.get(id);
    if (prior) return prior;
    const [, , sw, sh] = PLAYER_FRAMES[key],
      c = doc.createElement('canvas');
    // Keep source detail for the large foreground and Armoury crops.
    c.width = sw;
    c.height = sh;
    const cg = c.getContext('2d');
    if (!cg) return null;
    const sprite = lease.sprite(`player.${key}`);
    if (!sprite) return null;
    const [px, py, pw, ph] = sprite.metadata.frame;
    cg.drawImage(sprite.colour, px, py, pw, ph, ...sprite.metadata.trim, pw, ph);
    const data = cg.getImageData(0, 0, c.width, c.height),
      pal = palettes.robe(currentTone),
      parse = (v: string) => (v.match(/[\d.]+/g) || []).map(Number),
      dark = parse(pal.robeD),
      light = parse(pal.robeL);
    for (let i = 0; i < data.data.length; i += 4) {
      if (!data.data[i + 3]) continue;
      const t = Math.min(1, (data.data[i]! + data.data[i + 1]! + data.data[i + 2]!) / 330);
      for (let n = 0; n < 3; n++) data.data[i + n] = dark[n]! + (light[n]! - dark[n]!) * t;
    }
    cg.putImageData(data, 0, 0);
    tones.set(id, c);
    return c;
  }
  let state: 'idle' | 'loading' | 'ready' | 'unavailable' | 'disposed' = 'idle';
  const isDisposed = () => state === 'disposed';
  let pending: Promise<boolean> | null = null;
  let settle: ((ready: boolean) => void) | undefined;
  function prepare(): Promise<boolean> {
    if (pending) return pending;
    if (state === 'disposed') return Promise.resolve(false);
    state = 'loading';
    pending = new Promise<boolean>((resolve) => {
      settle = resolve;
      void (async () => {
        try {
          const { packedFigures } = await import('./packed-figures.ts');
          if (isDisposed()) return;
          const acquired = packedFigures(doc).acquireGroup('player');
          lease = acquired;
          await Promise.all([acquired.ready, outfits.prepare()]);
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
  function stamp(
    g: SceneDrawing,
    key: keyof typeof PLAYER_FRAMES,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const sprite = lease?.sprite(`player.${key}`);
    if (!sprite || sprite.metadata.empty) return;
    const tinted = tonePart(key);
    const placed = packedSpritePlacement(sprite.metadata, x, y, w, h);
    const crop = tinted
      ? ([...sprite.metadata.trim, sprite.metadata.frame[2], sprite.metadata.frame[3]] as const)
      : sprite.metadata.frame;
    if (sprite.material) {
      drawMaterialStamp(g, {
        texture: { source: tinted ?? sprite.colour, revision: 0, frame: crop },
        material: sprite.material,
        ...placed,
      });
    } else
      g.drawImage(
        tinted ?? sprite.colour,
        ...crop,
        placed.x,
        placed.y,
        placed.width,
        placed.height,
      );
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
    g: SceneDrawing,
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
  function drawPart(g: SceneDrawing, part: Part, f: Figure, env: FigureEnvironment): boolean {
    if (!f.back || !supportsInkOutfit(f.robeId)) return false;
    if (state !== 'ready' || !lease) {
      if (state === 'idle') void prepare();
      return false;
    }
    if (!outfits.ready(f.robeId)) return false;
    if (env.reducedMotion && f.secondary) f = { ...f, secondary: undefined };
    const recipe = outfits.recipe(f.robeId);
    currentTone = recipe?.tone;
    const l = f.lean || 0;
    g.save();
    if (part === 'body') {
      const sway =
        env.reducedMotion || env.reducedFlashes
          ? 0
          : Math.sin(env.time * 1.8 + f.d.seed) * 0.012 +
            env.wind * 0.003 +
            (f.secondary?.cloth ?? 0);
      g.save();
      g.translate(l * 0.5, -0.51);
      g.rotate(sway);
      // Opaque under-robe joins the separately posed panels across the broad obi.
      // It tapers into their overlapping hems rather than exposing the backdrop.
      g.fillStyle = currentTone ? palettes.robe(currentTone).robeD : '#20201f';
      g.beginPath();
      g.moveTo(-0.12, -0.008);
      g.lineTo(0.12, -0.008);
      g.lineTo(0.19, 0.47);
      g.lineTo(0.04, 0.51);
      g.lineTo(-0.17, 0.47);
      g.closePath();
      g.fill();
      g.save();
      g.rotate((f.secondary?.cloth ?? 0) * 0.3);
      g.transform(1, 0, -0.065, 1, 0, 0);
      stamp(g, 'leftPanel', -0.26, 0, 0.325, 0.52);
      g.restore();
      g.save();
      g.rotate(-(f.secondary?.cloth ?? 0) * 0.25);
      g.transform(1, 0, 0.065, 1, 0, 0);
      stamp(g, 'rightPanel', -0.065, 0, 0.325, 0.52);
      g.restore();
      g.restore();
      stamp(g, 'torso', -0.175 + l * 0.8, -0.835, 0.35, 0.355);
      outfits.draw(g, 'body', f);
    } else if (part === 'head') {
      if (!recipe?.replaceHead) stamp(g, 'head', l * 1.05 - 0.067, -0.973, 0.134, 0.171);
      outfits.draw(g, 'head', f);
    } else {
      joints(f).forEach((j, i) => {
        g.save();
        g.translate(j.shoulder[0], j.shoulder[1]);
        g.rotate((f.secondary?.cloth ?? 0) * (i ? -0.25 : 0.25));
        g.translate(-j.shoulder[0], -j.shoulder[1]);
        bone(g, i ? 'rightSleeve' : 'leftSleeve', j.shoulder, j.elbow, 0.135);
        g.restore();
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
    draw(g: SceneDrawing, f: Figure, env: FigureEnvironment) {
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
      toneParts: tones.size,
      pbrReady: state === 'ready',
    }),
    dispose() {
      state = 'disposed';
      outfits.dispose();
      lease?.release();
      lease = undefined;
      for (const c of tones.values()) c.width = c.height = 0;
      tones.clear();
      settle?.(false);
      settle = undefined;
    },
  };
}
