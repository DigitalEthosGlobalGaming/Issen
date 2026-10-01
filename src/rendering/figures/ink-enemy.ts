import type { Figure, FigureEnvironment, Point } from './types.ts';

type Part = 'body' | 'head' | 'arms' | 'hands';
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
const LOOKS = new Set(['', 'mask', 'monk', 'jingasa', 'kasa', 'kabuto', 'hair']);
const URLS = {
  base: new URL('./assets/enemy-ronin-simple.png', import.meta.url).href,
  heads: new URL('./assets/enemy-headwear-atlas.png', import.meta.url).href,
};
/** Front-view puppet, in the caller's normalized figure transform. No gameplay state. */
export function createInkEnemyRenderer(doc: Document) {
  const images = new Map<string, HTMLImageElement>(),
    loaded = new Set<string>();
  const cache = new Map<string, HTMLCanvasElement>(),
    finish = new Set<() => void>();
  let disposed = false,
    pending: Promise<boolean> | undefined;
  function prepare(): Promise<boolean> {
    if (pending) return pending;
    if (disposed) return Promise.resolve(false);
    pending = Promise.all(
      Object.entries(URLS).map(
        ([key, url]) =>
          new Promise<void>((resolve) => {
            const image = doc.createElement('img');
            images.set(key, image);
            const done = () => {
              finish.delete(done);
              image.onload = null;
              image.onerror = null;
              resolve();
            };
            finish.add(done);
            image.onload = () => {
              if (
                !disposed &&
                image.naturalWidth === (key === 'base' ? 1254 : 1536) &&
                image.naturalHeight === (key === 'base' ? 1254 : 1024)
              )
                loaded.add(key);
              done();
            };
            image.onerror = done;
            image.src = url;
          }),
      ),
    ).then(() => loaded.has('base'));
    return pending;
  }
  function supports(f: Figure) {
    const v = f.variant || '';
    return (
      !disposed &&
      !f.back &&
      LOOKS.has(v) &&
      loaded.has('base') &&
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
  ): HTMLCanvasElement | null {
    const family = key.startsWith('head:') ? 'heads' : 'base',
      image = images.get(family);
    if (!image) return null;
    const fog = Math.max(0, Math.min(1, Math.round(f.fog * 4) / 4));
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
    g.drawImage(image, sx, sy, sw, sh, 0, 0, c.width, c.height);
    if (palette) {
      const data = g.getImageData(0, 0, c.width, c.height),
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
      g.putImageData(data, 0, 0);
    }
    if (fog) {
      g.globalCompositeOperation = 'source-atop';
      g.globalAlpha = fog;
      g.fillStyle = mist;
      g.fillRect(0, 0, c.width, c.height);
    }
    cache.set(keyFull, c);
    if (cache.size > 96) {
      const first = cache.keys().next().value!;
      const old = cache.get(first)!;
      old.width = old.height = 0;
      cache.delete(first);
    }
    return c;
  }
  function stamp(
    g: CanvasRenderingContext2D,
    key: keyof typeof BASE_FRAMES,
    x: number,
    y: number,
    w: number,
    h: number,
    f: Figure,
    env: FigureEnvironment,
  ) {
    const im = sprite(key, BASE_FRAMES[key], f, env, key !== 'head' && key !== 'hand');
    if (im) g.drawImage(im, x, y, w, h);
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
    g: CanvasRenderingContext2D,
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
  function drawPart(
    g: CanvasRenderingContext2D,
    part: Part,
    f: Figure,
    env: FigureEnvironment,
  ): boolean {
    if (!pending && !disposed) void prepare();
    if (!supports(f)) return false;
    const l = f.lean || 0;
    g.save();
    if (part === 'body') {
      g.save();
      g.translate(l * 0.5, -0.51);
      const sway =
        env.reducedMotion || env.reducedFlashes
          ? 0
          : Math.sin(env.time * 1.8 + f.d.seed) * 0.012 + env.wind * 0.003;
      g.rotate(sway);
      g.fillStyle = (f.pal || env.palette(Math.round(f.fog * 4) / 4)).robeD;
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
      g.restore();
      stamp(g, 'torso', -0.175 + l * 0.8, -0.835, 0.35, 0.355, f, env);
    } else if (part === 'head') {
      stamp(g, 'head', l * 1.05 - 0.067, -0.973, 0.134, 0.171, f, env);
      const v = f.variant || '',
        frame = HEAD_FRAMES[v];
      if (frame) {
        const im = sprite('head:' + v, frame, f, env, false);
        if (im) {
          const w = v === 'kasa' || v === 'jingasa' ? 0.28 : v === 'kabuto' ? 0.23 : 0.17;
          g.drawImage(
            im,
            l * 1.05 - w / 2,
            v === 'mask' ? -0.935 : -1.0,
            w,
            (w * frame[3]) / frame[2],
          );
        }
      }
    } else
      for (const [i, j] of joints(f).entries()) {
        if (part === 'arms') {
          bone(g, i ? 'rightSleeve' : 'leftSleeve', j.shoulder, j.elbow, 0.135, f, env);
          bone(g, i ? 'rightForearm' : 'leftForearm', j.elbow, j.hand, 0.055, f, env);
        } else {
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
      ready: loaded.has('base'),
      loaded: [...loaded],
      cachedParts: cache.size,
      disposed,
    }),
    dispose() {
      disposed = true;
      for (const im of images.values()) {
        im.onload = null;
        im.onerror = null;
        im.removeAttribute('src');
      }
      for (const fn of [...finish]) fn();
      for (const c of cache.values()) c.width = c.height = 0;
      cache.clear();
      images.clear();
      loaded.clear();
    },
  };
}
export type InkEnemyRenderer = ReturnType<typeof createInkEnemyRenderer>;
