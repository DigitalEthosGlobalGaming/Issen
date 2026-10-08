import { assetMaterialCatalog } from '../asset-material-catalog.ts';
import type { SceneDrawing } from '../scene-drawing.ts';
import { createPbrAtlas } from '../pbr-atlas.ts';
import { drawMaterialStamp } from '../scene-material.ts';
import { enemyAppearance } from './enemy-appearance.ts';
import type { Figure, FigureEnvironment, Point, EnemyPart } from './types.ts';

type Part = EnemyPart;
type Frame = readonly [number, number, number, number];
const BASE_FRAMES = {
  torso: [63, 92, 343, 334],
  head: [510, 101, 230, 319],
  leftPanel: [865, 63, 365, 395],
  rightPanel: [38, 470, 385, 371],
  leftSleeve: [508, 502, 242, 336],
  rightSleeve: [911, 502, 246, 339],
  leftForearm: [157, 875, 139, 314],
  rightForearm: [550, 875, 139, 320],
  hand: [971, 944, 166, 228],
} as const satisfies Record<string, Frame>;
const HEAD_FRAMES: Record<string, Frame> = {
  kasa: [8, 137, 557, 290],
  kabuto: [582, 64, 458, 419],
  hair: [1105, 54, 400, 450],
  mask: [63, 600, 382, 331],
  jingasa: [490, 588, 576, 301],
  monk: [1110, 527, 396, 452],
};
// Packed windows measured from alpha; clothing rows divide at y440, not half-height.
const CLOTHING_FRAMES: readonly Frame[] = [
  [85, 34, 367, 378],
  [562, 22, 400, 413],
  [1117, 42, 286, 377],
  [53, 459, 427, 509],
  [538, 460, 481, 532],
  [1102, 459, 377, 522],
];
const VARIANT_HEAD_FRAMES: readonly Frame[] = [
  [54, 110, 493, 468],
  [653, 79, 577, 522],
  [82, 660, 494, 504],
  [724, 632, 423, 540],
];
// Neck centers in source pixels. Complete heads replace, rather than overlay, the base face.
const HEAD_NECKS = [360, 932, 333, 945];
const HEAD_BOTTOMS = [574, 570, 1160, 1168];
const HEAD_WIDTHS = [0.19, 0.235, 0.205, 0.165];
const LOOKS = new Set(['', 'mask', 'monk', 'jingasa', 'kasa', 'kabuto', 'hair']);
// Retained for material debugging; successful enemy paints use PBR diffuse only.
export const INK_ENEMY_DEBUG_SOURCES = {
  clothing: new URL('./assets/enemy-clothing-variants.webp', import.meta.url).href,
  variationHeads: new URL('./assets/enemy-headwear-variants.webp', import.meta.url).href,
  base: new URL('./assets/enemy-ronin-simple.webp', import.meta.url).href,
  heads: new URL('./assets/enemy-headwear-atlas.webp', import.meta.url).href,
};
const PBR_SOURCES = {
  base: assetMaterialCatalog.find(
    (pack) => pack.sourcePath === 'src/rendering/figures/assets/enemy-ronin-simple.png',
  )!.maps,
  clothing: assetMaterialCatalog.find(
    (pack) => pack.sourcePath === 'src/rendering/figures/assets/enemy-clothing-variants.png',
  )!.maps,
  heads: assetMaterialCatalog.find(
    (pack) => pack.sourcePath === 'src/rendering/figures/assets/enemy-headwear-atlas.png',
  )!.maps,
  variationHeads: assetMaterialCatalog.find(
    (pack) => pack.sourcePath === 'src/rendering/figures/assets/enemy-headwear-variants.png',
  )!.maps,
};
function familyFor(key: string): keyof typeof PBR_SOURCES {
  return key.startsWith('clothing:')
    ? 'clothing'
    : key.startsWith('variationHead:')
      ? 'variationHeads'
      : key.startsWith('head:')
        ? 'heads'
        : 'base';
}
/** Front-view puppet, in the caller's normalized figure transform. No gameplay state. */
export function createInkEnemyRenderer(doc: Document) {
  const pbr = {
    base: createPbrAtlas(doc, PBR_SOURCES.base, 1254),
    clothing: createPbrAtlas(doc, PBR_SOURCES.clothing, 1536, 1024),
    heads: createPbrAtlas(doc, PBR_SOURCES.heads, 1536, 1024),
    variationHeads: createPbrAtlas(doc, PBR_SOURCES.variationHeads, 1254),
  };
  const loaded = new Set<string>();
  const cache = new Map<string, HTMLCanvasElement>(),
    tones = new Map<string, HTMLCanvasElement>();
  // Separate costly pixel recoloring from cheap fog composites. Both stores are bounded.
  const budgets = { variants: 6_000_000, tones: 2_000_000 };
  let variantPixels = 0,
    tonePixels = 0;
  function retain(store: Map<string, HTMLCanvasElement>, key: string, canvas: HTMLCanvasElement) {
    store.set(key, canvas);
    const isTone = store === tones;
    if (isTone) tonePixels += canvas.width * canvas.height;
    else variantPixels += canvas.width * canvas.height;
    while (
      store.size > (isTone ? 48 : 192) ||
      (isTone ? tonePixels : variantPixels) > (isTone ? budgets.tones : budgets.variants)
    ) {
      const oldest = store.keys().next().value!;
      const image = store.get(oldest)!;
      if (isTone) tonePixels -= image.width * image.height;
      else variantPixels -= image.width * image.height;
      image.width = image.height = 0;
      store.delete(oldest);
    }
  }
  let disposed = false,
    pending: Promise<boolean> | undefined;
  function prepare(): Promise<boolean> {
    if (pending) return pending;
    if (disposed) return Promise.resolve(false);
    pending = Promise.all(
      Object.entries(pbr).map(async ([key, atlas]) => {
        const ready = await atlas.prepare();
        if (ready && !disposed) loaded.add(key);
        return ready;
      }),
    ).then((materials) => !disposed && materials.every(Boolean));
    return pending;
  }
  function supports(f: Figure) {
    const v = f.variant || '';
    return (
      !disposed &&
      !f.back &&
      LOOKS.has(v) &&
      loaded.has('base') &&
      Object.values(pbr).every((atlas) => atlas.ready) &&
      (!f.varied || (loaded.has('clothing') && loaded.has('variationHeads'))) &&
      (v === '' || loaded.has('heads'))
    );
  }
  function rgb(color: string): number[] {
    return (color.match(/[\d.]+/g) || ['0', '0', '0']).slice(0, 3).map(Number);
  }
  function sprite(
    key: string,
    frame: Frame,
    f: Figure,
    env: FigureEnvironment,
    cloth: boolean,
    applyFog = true,
  ): HTMLCanvasElement | null {
    const family = familyFor(key),
      image = pbr[family].diffuse;
    if (!image) return null;
    const fog = applyFog ? Math.max(0, Math.min(1, Math.round(f.fog * 4) / 4)) : 0;
    const mist = env.palette(1).robe;
    const palette = cloth ? f.pal : null,
      keyFull =
        key +
        ':' +
        fog +
        ':' +
        (fog ? mist : '') +
        ':' +
        (palette ? palette.robeD + palette.robeL : '');
    const found = cache.get(keyFull);
    if (found) {
      cache.delete(keyFull);
      cache.set(keyFull, found);
      return found;
    }
    const [sx, sy, sw, sh] = frame,
      c = doc.createElement('canvas');
    const ratio = 256 / Math.max(sw, sh);
    c.width = Math.max(1, Math.round(sw * ratio));
    c.height = Math.max(1, Math.round(sh * ratio));
    const g = c.getContext('2d');
    if (!g) return null;
    if (palette) {
      const toneKey = key + ':' + palette.robeD + ':' + palette.robeL;
      let tone = tones.get(toneKey);
      if (tone) {
        tones.delete(toneKey);
        tones.set(toneKey, tone);
      } else {
        tone = doc.createElement('canvas');
        tone.width = c.width;
        tone.height = c.height;
        const tg = tone.getContext('2d', { willReadFrequently: true });
        if (!tg) {
          c.width = c.height = 0;
          return null;
        }
        tg.drawImage(image, sx, sy, sw, sh, 0, 0, tone.width, tone.height);
        const data = tg.getImageData(0, 0, tone.width, tone.height),
          a = rgb(palette.robeD),
          b = rgb(palette.robeL);
        for (let i = 0; i < data.data.length; i += 4) {
          if (!data.data[i + 3]) continue;
          const t = Math.max(
            0,
            Math.min(1, (data.data[i]! + data.data[i + 1]! + data.data[i + 2]!) / 3 / 110),
          );
          for (let j = 0; j < 3; j++) data.data[i + j] = a[j]! + (b[j]! - a[j]!) * t;
        }
        tg.putImageData(data, 0, 0);
        retain(tones, toneKey, tone);
      }
      g.drawImage(tone, 0, 0);
    } else g.drawImage(image, sx, sy, sw, sh, 0, 0, c.width, c.height);
    if (fog) {
      g.globalCompositeOperation = 'source-atop';
      g.globalAlpha = fog;
      g.fillStyle = mist;
      g.fillRect(0, 0, c.width, c.height);
    }
    retain(cache, keyFull, c);
    return c;
  }
  function stamp(
    g: SceneDrawing,
    key: keyof typeof BASE_FRAMES,
    x: number,
    y: number,
    w: number,
    h: number,
    f: Figure,
    env: FigureEnvironment,
  ) {
    paint(g, key, BASE_FRAMES[key], x, y, w, h, f, env, key !== 'head' && key !== 'hand');
  }
  function paint(
    g: SceneDrawing,
    key: string,
    frame: Frame,
    x: number,
    y: number,
    w: number,
    h: number,
    f: Figure,
    env: FigureEnvironment,
    cloth: boolean,
  ) {
    const material =
      cloth ||
      key === 'head' ||
      key === 'hand' ||
      familyFor(key) === 'heads' ||
      familyFor(key) === 'variationHeads'
        ? pbr[familyFor(key)].material(frame)
        : null;
    const im = sprite(key, frame, f, env, cloth, !material);
    if (!im) return;
    if (material) {
      // Keep palette recolouring in the diffuse cache, then apply fog after lighting.
      const fog = Math.max(0, Math.min(1, Math.round(f.fog * 4) / 4));
      const mist = rgb(env.palette(1).robe);
      drawMaterialStamp(g, {
        texture: { source: im, revision: 0 },
        material: {
          ...material,
          fog,
          fogColor: [mist[0]! / 255, mist[1]! / 255, mist[2]! / 255],
        },
        x,
        y,
        width: w,
        height: h,
      });
    } else g.drawImage(im, x, y, w, h);
  }
  function joints(f: Figure) {
    const l = f.lean || 0,
      p = f.pose,
      h1: Point = [p.gx + l, p.gy],
      length = f.spear ? 0.2 : 0.075;
    const h2: Point = f.twin
      ? [-0.19 + l, -0.5]
      : [h1[0] - Math.cos(p.ang) * length, h1[1] - Math.sin(p.ang) * length];
    return [h1, h2].map((hand, i) => {
      const side = i ? 1 : -1,
        shoulder: Point = [side * 0.15 + l, -0.765],
        elbow: Point = [
          (shoulder[0] + hand[0]) / 2 + side * 0.05,
          (shoulder[1] + hand[1]) / 2 + 0.05,
        ];
      return { hand, shoulder, elbow };
    });
  }
  function bone(
    g: SceneDrawing,
    key: keyof typeof BASE_FRAMES,
    a: Point,
    b: Point,
    w: number,
    f: Figure,
    env: FigureEnvironment,
  ) {
    g.save();
    g.translate(...a);
    g.rotate(Math.atan2(b[1] - a[1], b[0] - a[0]) - Math.PI / 2);
    stamp(g, key, -w / 2, -0.018, w, Math.hypot(b[0] - a[0], b[1] - a[1]) + 0.035, f, env);
    g.restore();
  }
  function drawPart(g: SceneDrawing, part: Part, f: Figure, env: FigureEnvironment): boolean {
    const appearance = f.varied ? enemyAppearance(f) : undefined;
    const useVariantHead = !!appearance && !f.variant;
    if (appearance) f = { ...f, variant: appearance.variant, pal: appearance.palette };
    if (!pending && !disposed) void prepare();
    if (!supports(f)) return false;
    const l = f.lean || 0;
    g.save();
    if (part === 'body' || part === 'torso' || part === 'skirt') {
      g.scale(appearance?.width ?? 1, 1);
      if (part !== 'torso') {
        g.save();
        g.translate(l * 0.5, -0.51);
        const sway =
          env.reducedMotion || env.reducedFlashes
            ? 0
            : Math.sin(env.time * 1.8 + f.d.seed) * 0.012 + env.wind * 0.003;
        g.rotate(sway);
        if (appearance) {
          const i = appearance.clothing + 3;
          const frame = CLOTHING_FRAMES[i]!,
            width = (0.52 * frame[2]) / frame[3];
          paint(g, 'clothing:' + i, frame, -width / 2, 0, width, 0.52, f, env, true);
        } else {
          const fog = Math.max(0, Math.min(1, Math.round(f.fog * 4) / 4));
          const dark = rgb((f.pal || env.palette(0)).robeD);
          const mist = rgb(env.palette(1).robe);
          g.fillStyle = `rgb(${dark.map((v, i) => Math.round(v + (mist[i]! - v) * fog)).join(',')})`;
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
          stamp(g, 'leftPanel', -0.26, 0, 0.325, 0.52, f, env);
          g.restore();
          g.save();
          g.transform(1, 0, 0.065, 1, 0, 0);
          stamp(g, 'rightPanel', -0.065, 0, 0.325, 0.52, f, env);
          g.restore();
        }
        g.restore();
      }
      if (part !== 'skirt') {
        if (appearance) {
          const i = appearance.clothing;
          const frame = CLOTHING_FRAMES[i]!,
            width = (0.355 * frame[2]) / frame[3];
          paint(
            g,
            'clothing:' + i,
            frame,
            -width / 2 + l * 0.8,
            -0.835,
            width,
            0.355,
            f,
            env,
            true,
          );
        } else stamp(g, 'torso', -0.175 + l * 0.8, -0.835, 0.35, 0.355, f, env);
      }
    } else if (part === 'head') {
      if (appearance && useVariantHead) {
        const i = appearance.head,
          frame = VARIANT_HEAD_FRAMES[i]!;
        const scale = HEAD_WIDTHS[i]! / frame[2];
        paint(
          g,
          'variationHead:' + i,
          frame,
          l * 1.05 - (HEAD_NECKS[i]! - frame[0]) * scale,
          -0.815 - (HEAD_BOTTOMS[i]! - frame[1]) * scale,
          frame[2] * scale,
          frame[3] * scale,
          f,
          env,
          false,
        );
      } else {
        stamp(g, 'head', l * 1.05 - 0.067, -0.973, 0.134, 0.171, f, env);
        const v = f.variant || '',
          frame = HEAD_FRAMES[v];
        if (frame) {
          const w = v === 'kasa' || v === 'jingasa' ? 0.28 : v === 'kabuto' ? 0.23 : 0.17;
          paint(
            g,
            'head:' + v,
            frame,
            l * 1.05 - w / 2,
            v === 'mask' ? -0.935 : -1.0,
            w,
            (w * frame[3]) / frame[2],
            f,
            env,
            false,
          );
        }
      }
    } else
      for (const [i, j] of joints(f).entries()) {
        const side = i ? 'right' : 'left';
        if (part === 'arms' || part === side + 'Sleeve')
          bone(g, i ? 'rightSleeve' : 'leftSleeve', j.shoulder, j.elbow, 0.135, f, env);
        if (part === 'arms' || part === side + 'Forearm')
          bone(g, i ? 'rightForearm' : 'leftForearm', j.elbow, j.hand, 0.055, f, env);
        if (part === 'hands' || part === side + 'Hand') {
          g.save();
          g.translate(...j.hand);
          g.rotate(f.pose.ang + Math.PI / 2);
          stamp(g, 'hand', -0.024, -0.024, 0.048, 0.058, f, env);
          g.restore();
        }
      }
    g.restore();
    return true;
  }
  return {
    prepare,
    drawPart,
    snapshot: () => ({
      ready:
        Object.keys(pbr).every((key) => loaded.has(key)) &&
        Object.values(pbr).every((atlas) => atlas.ready),
      loaded: [...loaded],
      cachedParts: cache.size,
      toneParts: tones.size,
      variantPixels,
      tonePixels,
      maxCachePixels: budgets.variants + budgets.tones,
      disposed,
    }),
    dispose() {
      disposed = true;
      for (const atlas of Object.values(pbr)) atlas.dispose();
      for (const c of cache.values()) c.width = c.height = 0;
      for (const c of tones.values()) c.width = c.height = 0;
      cache.clear();
      tones.clear();
      variantPixels = tonePixels = 0;
      loaded.clear();
    },
  };
}
export type InkEnemyRenderer = ReturnType<typeof createInkEnemyRenderer>;
