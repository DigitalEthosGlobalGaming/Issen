import { drawLastLightRidge } from './ridge.ts';
import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { createBackground } from '../scene/background.ts';
import { drawForegroundBoulders } from './foreground.ts';
import { drawMountainTiles } from './mountains.ts';
import { drawFieldMidground } from './midground.ts';
import { drawMeadowTransition, drawMeadowFog } from './meadow.ts';

export type EnvironmentMode = 'classic' | 'ink';
export type EnvironmentBackend = 'classic' | 'loading' | 'layered' | 'unavailable';
export interface EnvironmentFrame {
  width: number;
  height: number;
  dpr: number;
  /** Seconds on the presentation clock, independent of gameplay randomness. */
  time: number;
  stage: number;
  reducedMotion: boolean;
  reducedFlashes: boolean;
  lowQuality: boolean;
}

const BAMBOO_URL = new URL('./assets/bamboo-atlas.png', import.meta.url).href;
const ROCKS_URL = new URL('./assets/rocks-atlas.png', import.meta.url).href;
const PINE_URL = new URL('./assets/pine-atlas.png', import.meta.url).href;
const MOUNTAIN_URL = new URL('./assets/mountain-atlas.png', import.meta.url).href;
const BANKS_URL = new URL('./assets/field-banks-atlas.png', import.meta.url).href;
const SHRUBS_URL = new URL('./assets/shrubs-atlas.png', import.meta.url).href;
const FIELD_ROCKS_URL = new URL('./assets/field-rocks-atlas.png', import.meta.url).href;
const GRASS_EDGES_URL = new URL('./assets/grass-edges-atlas.png', import.meta.url).href;
const MEADOW_PATCHES_URL = new URL('./assets/meadow-patches-atlas.png', import.meta.url).href;
const FOREGROUND_BOULDERS_URL = new URL('./assets/foreground-boulders-atlas.png', import.meta.url)
  .href;
const FOG_WISPS_URL = new URL('./assets/fog-wisps-atlas.png', import.meta.url).href;

/** Instance-owned image loading and caches; safe for independent previews. */
export function createEnvironmentRenderer(doc: Document) {
  let disposed = false;
  let status: EnvironmentBackend = 'classic';
  let ready = false;
  let failed = false;
  let pending: Promise<void> | undefined;
  let images: HTMLImageElement[] = [];
  let cached: HTMLCanvasElement | undefined;
  let distant: HTMLCanvasElement | undefined;
  let nearby: HTMLCanvasElement | undefined;
  let cacheKey = '';
  let builds = 0;
  const settleLoads: Array<() => void> = [];

  function prepare(): Promise<void> {
    if (pending) return pending;
    if (disposed) return Promise.resolve();
    status = 'loading';
    pending = Promise.all(
      [
        BAMBOO_URL,
        ROCKS_URL,
        PINE_URL,
        MOUNTAIN_URL,
        BANKS_URL,
        SHRUBS_URL,
        FIELD_ROCKS_URL,
        GRASS_EDGES_URL,
        MEADOW_PATCHES_URL,
        FOG_WISPS_URL,
        FOREGROUND_BOULDERS_URL,
      ].map(
        (url) =>
          new Promise<void>((resolve) => {
            settleLoads.push(resolve);
            const image = doc.createElement('img');
            images.push(image);
            image.decoding = 'async';
            image.onload = () => {
              if (!image.naturalWidth || !image.naturalHeight) failed = true;
              image.onload = image.onerror = null;
              resolve();
            };
            image.onerror = () => {
              failed = true;
              image.onload = image.onerror = null;
              resolve();
            };
            image.src = url;
          }),
      ),
    ).then(() => {
      if (!disposed) {
        ready = !failed;
        status = failed ? 'unavailable' : 'layered';
      }
    });
    return pending;
  }

  function stamp(
    ctx: CanvasRenderingContext2D,
    image: HTMLImageElement,
    cell: number,
    x: number,
    foot: number,
    height: number,
    opacity: number,
    flip = false,
  ) {
    const sw = image.naturalWidth / 2,
      sh = image.naturalHeight / 2;
    const width = (height * sw) / sh;
    ctx.save();
    ctx.globalAlpha = opacity;
    ctx.translate(x, foot);
    ctx.scale(flip ? -1 : 1, 1);
    ctx.drawImage(
      image,
      (cell % 2) * sw,
      Math.floor(cell / 2) * sh,
      sw,
      sh,
      -width / 2,
      -height,
      width,
      height,
    );
    ctx.restore();
  }

  function build(frame: EnvironmentFrame, classicCanvas: HTMLCanvasElement | null) {
    const { width: w, height: h } = frame;
    const stage = STAGES[frame.stage] ?? STAGES[0]!;
    // Bound backing pixels for tablets/4K desktops without changing world geometry.
    const scale = Math.min(
      Math.max(1, frame.dpr),
      frame.lowQuality ? 1 : 1.5,
      2560 / w,
      1920 / h,
      Math.sqrt(1_000_000 / (w * h)),
    );
    const canvas = cached ?? doc.createElement('canvas');
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const layer = (existing: HTMLCanvasElement | undefined) => {
      const target = existing ?? doc.createElement('canvas');
      target.width = canvas.width;
      target.height = canvas.height;
      const context = target.getContext('2d');
      context?.setTransform(scale, 0, 0, scale, 0, 0);
      return { target, context };
    };
    const far = layer(distant),
      near = layer(nearby);
    distant = far.target;
    nearby = near.target;
    if (!far.context || !near.context) return false;
    if (frame.stage === 1) {
      drawLastLightRidge(
        ctx,
        far.context,
        near.context,
        {
          mountains: images[3]!,
          pines: images[2]!,
          banks: images[4]!,
          shrubs: images[5]!,
          rocks: images[6]!,
        },
        w,
        h,
        scale,
        frame.lowQuality,
      );
      cached = canvas;
      builds++;
      return true;
    }
    const { horizonY, groundY, eH } = createLayout(w, h);
    const openField = frame.stage === 0;
    const restoredField = openField && classicCanvas !== null;
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#161713');
    sky.addColorStop((horizonY / h) * 0.7, stage.sky[1]);
    sky.addColorStop(horizonY / h, stage.sky[3]);
    sky.addColorStop(groundY / h, stage.field[0]);
    sky.addColorStop(1, '#1c1d18');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    // Keep the classic sky, rolling ground and grass around the generated ridge layer.
    // Keep that full field beneath the image props; animated grass still draws in the runtime.
    if (restoredField) {
      const field = createBackground(w, h, scale, frame.stage, {
        fieldTrees: false,
        fieldStatues: false,
        fieldRocks: false,
        fieldMist: 0.3,
        mountains: (g) => drawMountainTiles(g, images[3]!, w, h, stage),
      }).canvas;
      ctx.drawImage(field, 0, 0, w, h);
      field.width = field.height = 0;
    }
    if (openField) drawMeadowTransition(ctx, images[7]!, images[8]!, w, h, frame.lowQuality);
    if (openField) drawForegroundBoulders(ctx, images[10]!, w, h);
    const bamboo = images[0]!,
      rocks = images[1]!,
      pines = images[2]!;
    if (openField) {
      drawFieldMidground(
        far.context,
        { banks: images[4]!, shrubs: images[5]!, rocks: images[6]! },
        w,
        h,
        frame.lowQuality,
      );
    }
    // Scale the treeline population with the world width, not a fixed screen image.
    const unit = Math.min(h, w * 1.3);
    const count = openField
      ? Math.round((Math.ceil(w / (unit * (frame.lowQuality ? 0.55 : 0.4))) + 1) * 1.5)
      : frame.lowQuality
        ? 7
        : 13;
    for (let i = 0; i < count; i++) {
      const variation = ((i * 37 + 11) % 101) / 101;
      const x = ((i + 0.25 + (openField ? Math.sin(i * 2.7) * 0.23 : 0)) / count) * w;
      const height = openField
        ? unit * (0.045 + variation * 0.04)
        : unit * (0.3 + ((i * 7) % 11) * 0.012);
      stamp(
        far.context,
        openField ? pines : bamboo,
        i % 4,
        x,
        openField ? groundY - eH * 0.34 + h * variation * 0.009 : horizonY + h * 0.025,
        height,
        openField ? 0.24 + variation * 0.14 : 0.13 + Math.abs(x / w - 0.5) * 0.35,
        i % 2 === 0,
      );
      if (openField) {
        // A smaller, paler second group sits just beyond each visible grove.
        stamp(
          far.context,
          pines,
          (i + 2) % 4,
          x + unit * 0.09,
          groundY - eH * 0.42,
          height * 0.6,
          0.1,
          i % 2 !== 0,
        );
      }
    }
    // Ground strokes follow the existing perspective, leaving target silhouettes clear.
    ctx.fillStyle = 'rgba(226,217,193,0.1)';
    for (let i = 0; i < (restoredField ? 0 : 18); i++) {
      const y = groundY + (i / 18) ** 1.65 * (h - groundY);
      ctx.beginPath();
      ctx.moveTo(w * (0.05 + (i % 3) * 0.08), y);
      ctx.lineTo(w * 0.98, y + h * 0.012);
      ctx.lineTo(w * 0.91, y + h * 0.016);
      ctx.closePath();
      ctx.fill();
    }
    // Side framing scales by viewport height and stays anchored beyond the fight lane.
    for (let side = 0; side < (openField ? 0 : 2); side++) {
      for (let i = 0; i < (openField ? 0 : 3); i++) {
        const x = side === 0 ? w * (-0.12 + i * 0.045) : w * (1.12 - i * 0.045);
        stamp(
          near.context,
          bamboo,
          (i + side) % 4,
          x,
          groundY + unit * 0.09,
          unit * (0.83 - i * 0.09),
          0.85 - i * 0.12,
          side === 1,
        );
      }
      stamp(
        near.context,
        rocks,
        side,
        side ? w * 1.04 : -w * 0.04,
        groundY + unit * 0.13,
        unit * (openField ? 0.16 : 0.3),
        openField ? 0.45 : 0.85,
        side === 1,
      );
      stamp(
        near.context,
        rocks,
        side + 2,
        side ? w * 0.99 : w * 0.01,
        h * 1.1,
        unit * (openField ? 0.24 : 0.43),
        openField ? 0.5 : 0.78,
        side === 0,
      );
    }
    // Sparse warm leaf accents are baked into scenery, never added to game particle state.
    ctx.fillStyle = 'rgba(139,57,37,0.64)';
    for (let i = 0; i < (restoredField ? 0 : 9); i++) {
      const x = (((i * 83 + 19) % 101) / 101) * w;
      const y = groundY + (((i * 37 + 13) % 97) / 97) * (h - groundY);
      const r = Math.max(2, Math.min(w, h) * 0.007);
      ctx.beginPath();
      ctx.moveTo(x - r * 2, y);
      ctx.lineTo(x, y - r);
      ctx.lineTo(x + r, y - r * 2);
      ctx.lineTo(x + r * 0.6, y);
      ctx.lineTo(x + r * 2, y + r);
      ctx.lineTo(x, y + r * 0.7);
      ctx.closePath();
      ctx.fill();
    }
    const vignette = ctx.createRadialGradient(
      w * 0.5,
      groundY,
      w * 0.12,
      w * 0.5,
      groundY,
      Math.max(w, h) * 0.72,
    );
    vignette.addColorStop(0, 'rgba(8,10,7,0)');
    vignette.addColorStop(1, 'rgba(8,10,7,0.56)');
    if (!restoredField) {
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, w, h);
    }
    cached = canvas;
    builds++;
    return true;
  }

  function draw(
    ctx: CanvasRenderingContext2D,
    frame: EnvironmentFrame,
    mode: EnvironmentMode,
    classicCanvas: HTMLCanvasElement | null,
  ): boolean {
    ctx.save();
    try {
      const valid =
        Number.isFinite(frame.width) &&
        Number.isFinite(frame.height) &&
        frame.width > 0 &&
        frame.height > 0 &&
        Number.isFinite(frame.dpr);
      if (!disposed && mode === 'ink' && valid) {
        void prepare();
        if (ready) {
          const key = JSON.stringify([
            frame.width,
            frame.height,
            frame.dpr,
            frame.stage,
            frame.lowQuality,
          ]);
          if (key !== cacheKey) {
            if (build(frame, classicCanvas)) cacheKey = key;
            else {
              failed = true;
              ready = false;
            }
          }
          if (ready && cached) {
            status = 'layered';
            ctx.drawImage(cached, 0, 0, frame.width, frame.height);
            const motion =
              frame.reducedMotion || frame.reducedFlashes || frame.lowQuality
                ? 0
                : Math.sin(frame.time * 0.12);
            if (distant) ctx.drawImage(distant, motion * 1.5, 0, frame.width, frame.height);
            if (nearby) ctx.drawImage(nearby, motion * 3, 0, frame.width, frame.height);
            if (frame.stage === 0) drawMeadowFog(ctx, images[9]!, frame);
            if (!frame.lowQuality && frame.stage !== 0) {
              const { groundY, horizonY } = createLayout(frame.width, frame.height);
              const offset =
                frame.reducedMotion || frame.reducedFlashes
                  ? 0
                  : Math.sin(frame.time * 0.12) * frame.height * 0.006;
              const mist = ctx.createLinearGradient(
                0,
                horizonY + offset,
                0,
                groundY + frame.height * 0.07 + offset,
              );
              mist.addColorStop(0, 'rgba(222,213,191,0)');
              mist.addColorStop(0.4, 'rgba(222,213,191,0.11)');
              mist.addColorStop(1, 'rgba(222,213,191,0)');
              ctx.fillStyle = mist;
              ctx.fillRect(
                0,
                horizonY + offset,
                frame.width,
                groundY - horizonY + frame.height * 0.07,
              );
            }
            return true;
          }
        }
        status = failed ? 'unavailable' : 'loading';
      } else status = 'classic';
      if (classicCanvas && valid) ctx.drawImage(classicCanvas, 0, 0, frame.width, frame.height);
      return false;
    } finally {
      ctx.restore();
    }
  }

  function dispose() {
    disposed = true;
    status = 'classic';
    for (const image of images) {
      image.onload = image.onerror = null;
      image.removeAttribute('src');
    }
    images = [];
    for (const settle of settleLoads.splice(0)) settle();
    for (const layer of [cached, distant, nearby]) {
      if (layer) {
        layer.width = 0;
        layer.height = 0;
      }
    }
    distant = nearby = undefined;
    cached = undefined;
    cacheKey = '';
    ready = false;
  }

  return {
    draw,
    prepare,
    dispose,
    get backend(): EnvironmentBackend {
      return status;
    },
    snapshot: () => ({
      backend: status,
      builds,
      width: cached?.width ?? 0,
      height: cached?.height ?? 0,
      layers: [cached, distant, nearby].filter(Boolean).length,
      pixels: [cached, distant, nearby].reduce(
        (total, layer) => total + (layer ? layer.width * layer.height : 0),
        0,
      ),
    }),
  };
}
