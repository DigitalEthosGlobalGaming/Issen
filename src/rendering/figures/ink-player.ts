import { assetMaterialCatalog } from '../asset-material-catalog.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import { trackPixelSource } from '../../platform/pixel-memory.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { createSurfaceMapLibrary } from '../surface-maps.ts';
import { createPbrAtlas } from '../pbr-atlas.ts';
import { retireSceneTexture } from '../texture-revision.ts';
import { createPalette } from '../palette.ts';
import { createOutfitKit, supportsInkOutfit } from './outfit-kit.ts';
import type { Figure, FigureEnvironment, Point } from './types.ts';
import { createMainImageOwner } from '../../platform/main-images.ts';
import type { PixiScenePainter } from '../pixi/scene-painter.ts';

const ATLAS_URL = new URL('./assets/player-ronin-simple.webp', import.meta.url).href;
const PBR_SOURCES = assetMaterialCatalog.find(
  (pack) => pack.sourcePath === 'src/rendering/figures/assets/player-ronin-simple.png',
)!.maps;
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
  const images = createMainImageOwner(doc);
  const materials = createSurfaceMapLibrary(doc);
  const pbr = createPbrAtlas(doc, PBR_SOURCES, 1254, 1254, { images });
  const outfits = createOutfitKit(doc);
  const palettes = createPalette();
  const tones = new Map<string, HTMLCanvasElement>();
  const consumers = new Set<SceneDrawing>();
  let currentTone: string | undefined;
  let currentPbr = false;
  function tonePart(key: keyof typeof PLAYER_FRAMES): HTMLCanvasElement | null {
    if (!currentTone || key === 'head' || key === 'hand' || !atlas) return null;
    const id = currentTone + ':' + key,
      prior = tones.get(id);
    if (prior) return prior;
    const [sx, sy, sw, sh] = PLAYER_FRAMES[key],
      c = trackPixelSource(doc, doc.createElement('canvas'), 'canvas');
    // Keep source detail for the large foreground and Armoury crops.
    c.width = sw;
    c.height = sh;
    const cg = c.getContext('2d', { willReadFrequently: true });
    if (!cg) return null;
    cg.drawImage(atlas, sx, sy, sw, sh, 0, 0, c.width, c.height);
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
  let atlas: HTMLImageElement | null = null;
  let state: 'idle' | 'loading' | 'ready' | 'unavailable' | 'disposed' = 'idle';
  let pending: Promise<boolean> | null = null;
  function prepareBase(): Promise<boolean> {
    if (pending) return pending;
    if (state === 'disposed') return Promise.resolve(false);
    state = 'loading';
    const lease = images.acquire(ATLAS_URL);
    pending = Promise.all([lease.ready, pbr.prepare()]).then(
      ([image, pbrReady]) => {
        if (state === 'disposed') return false;
        atlas = image;
        state =
          image.naturalWidth === 1254 && image.naturalHeight === 1254 && pbrReady
            ? 'ready'
            : 'unavailable';
        return state === 'ready';
      },
      () => {
        if (state !== 'disposed') state = 'unavailable';
        return false;
      },
    );
    return pending;
  }
  let outfitPreparation: Promise<boolean> | undefined, prepared: Promise<boolean> | undefined;
  function prepare(): Promise<boolean> {
    const next = outfits.prepare();
    if (next !== outfitPreparation) {
      outfitPreparation = next;
      prepared = Promise.all([prepareBase(), next]).then(([base, outfit]) => base && outfit);
    }
    return prepared!;
  }
  function stamp(
    g: SceneDrawing,
    key: keyof typeof PLAYER_FRAMES,
    x: number,
    y: number,
    w: number,
    h: number,
  ) {
    const [sx, sy, sw, sh] = PLAYER_FRAMES[key];
    const tinted = tonePart(key);
    const source = currentPbr ? pbr.diffuse! : atlas!;
    const material = currentPbr
      ? pbr.material(PLAYER_FRAMES[key])
      : key === 'torso'
        ? materials.get('cloth')
        : null;
    if (material) {
      drawMaterialStamp(g, {
        texture: {
          source: tinted ?? source,
          revision: 0,
          frame: tinted ? undefined : [sx, sy, sw, sh],
        },
        material,
        x,
        y,
        width: w,
        height: h,
      });
    } else if (tinted) g.drawImage(tinted, x, y, w, h);
    else g.drawImage(source, sx, sy, sw, sh, x, y, w, h);
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
    if (state !== 'ready' || !atlas) {
      if (state === 'idle') void prepare();
      return false;
    }
    if (!outfits.ready(f.robeId)) return false;
    consumers.add(g);
    if (env.reducedMotion && f.secondary) f = { ...f, secondary: undefined };
    const recipe = outfits.recipe(f.robeId);
    currentTone = recipe?.tone;
    currentPbr = pbr.ready;
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
  function releaseCanvas(g: SceneDrawing) {
    outfits.releaseCanvas(g);
    const material = pbr.material([0, 0, 1254, 1254]);
    const sources = [
      atlas,
      pbr.diffuse,
      material?.normal?.source,
      material?.surface?.source,
      material?.emissive?.source,
      ...tones.values(),
    ].filter((source) => !!source);
    if ('releaseTextureSources' in g)
      (g as SceneDrawing & Pick<PixiScenePainter, 'releaseTextureSources'>).releaseTextureSources(
        sources,
      );
    consumers.delete(g);
  }
  return {
    prepare,
    select: outfits.select,
    releaseCanvas,
    borrow() {
      const selection = outfits.borrow();
      return {
        select: selection.select,
        prepare: async () => (await prepareBase()) && (await selection.prepare()),
        dispose: selection.dispose,
      };
    },
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
      pbrReady: pbr.ready,
      decodedLoader: images.snapshot(),
    }),
    dispose() {
      if (state === 'disposed') return;
      state = 'disposed';
      for (const g of consumers) releaseCanvas(g);
      outfits.dispose();
      materials.dispose();
      pbr.dispose();
      images.dispose();
      for (const c of tones.values()) {
        retireSceneTexture(c);
        c.width = c.height = 0;
      }
      tones.clear();
      atlas = null;
    },
  };
}
