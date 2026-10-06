import type { SceneDrawing } from '../scene-drawing.ts';
import {
  createCachedMaterials,
  clearCachedMaterial,
  drawCachedImage,
  cachedMaterialContext,
  getCachedMaterial,
} from '../cached-materials.ts';
import { invalidateSceneTexture } from '../texture-revision.ts';
import { createBambooForegroundRenderer } from './bamboo-foreground.ts';
import { drawRainwaterHollow } from './hollow.ts';
import { drawStageVariations } from './stage-variation.ts';
import { packedLandmarks, landmarkManifest, type LandmarkLease } from './packed-landmarks.ts';
import { drawHollowBambooRoad } from './bamboo.ts';
import { drawWhiteSilencePass } from './winter.ts';
import { drawEmberCourtyard } from './temple.ts';
import { drawBrokenShore } from './shore.ts';
import { drawMoonwatchClearing } from './moonwatch.ts';
import { drawFallingBlossomPath } from './blossom.ts';
import { drawLastLightRidge } from './ridge.ts';
import { STAGES } from '../../game/content/stages.ts';
import { createLayout } from '../layout.ts';
import { createBackground } from '../scene/background.ts';
import { drawForegroundBoulders } from './foreground.ts';
import { drawMountainTiles } from './mountains.ts';
import { drawFieldMidground } from './midground.ts';
import { drawMeadowTransition } from './meadow.ts';
import { drawEnvironmentMotion } from './motion.ts';
import { drawAtlasSprite, setSceneryAtmosphere } from './scene-kit.ts';
import {
  packedScenery,
  sceneryAtlas,
  sceneryManifest,
  type SceneryLease,
} from './packed-scenery.ts';
import { SCENERY_SOURCES, SCENE_ASSETS } from './scenery-sources.ts';
import type { PackedSceneryAtlas } from './packed-scene-atlas.ts';

export type EnvironmentBackend = 'loading' | 'layered' | 'unavailable';
export interface EnvironmentFrame {
  /** Cosmetic visit identity, independent of the saved run RNG. */
  stageSeed?: number;
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

/** Instance-owned image loading and caches; safe for independent previews. */
export function createLocalEnvironmentRenderer(doc: Document) {
  const cachedMaterials = createCachedMaterials();
  const landmarkStore = packedLandmarks(doc);
  let landmarks: LandmarkLease | undefined;
  const sceneryStore = packedScenery(doc);
  let scenery: SceneryLease | undefined;
  const foreground = createBambooForegroundRenderer(doc);
  let disposed = false;
  let status: EnvironmentBackend = 'loading';
  let ready = false;
  let failed = false;
  let pending: Promise<void> | undefined;
  let preparedStage = -1;
  let generation = 0;
  let images: (PackedSceneryAtlas | undefined)[] = [];
  let cached: HTMLCanvasElement | undefined;
  let distant: HTMLCanvasElement | undefined;
  let nearby: HTMLCanvasElement | undefined;
  let cacheKey = '';
  let builds = 0;

  function prepare(stage = 0): Promise<void> {
    if (pending && stage === preparedStage) return pending;
    if (disposed) return Promise.resolve();
    const request = ++generation;
    preparedStage = stage;
    ready = false;
    failed = false;
    const actualStage = stage >= 0 && stage < SCENE_ASSETS.length ? stage : 0;
    const previousLandmarks = landmarks,
      previousScenery = scenery;
    const nextLandmarks = landmarkStore.acquire(
      landmarkManifest.dependencies[`stage-${stage}`] ?? [],
    );
    const nextScenery = sceneryStore.acquireGroup(`stage-${actualStage}`);
    landmarks = nextLandmarks;
    scenery = nextScenery;
    status = 'loading';
    pending = Promise.all([nextLandmarks.ready, nextScenery.ready])
      .then(() => {
        if (disposed || request !== generation) return;
        cachedMaterials.dispose();
        images = [];
        for (const index of SCENE_ASSETS[actualStage]!)
          images[index] = sceneryAtlas(SCENERY_SOURCES[index]!, nextScenery, cachedMaterials);
        cacheKey = '';
        ready = true;
        status = 'layered';
      })
      .catch(() => {
        nextLandmarks.release();
        nextScenery.release();
        if (!disposed && request === generation) {
          failed = true;
          status = 'unavailable';
        }
      })
      .finally(() => {
        previousLandmarks?.release();
        previousScenery?.release();
      });
    return pending;
  }

  function stamp(
    ctx: SceneDrawing,
    image: PackedSceneryAtlas,
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
    drawAtlasSprite(ctx, image, cell, x, foot, width, { alpha: opacity, flip, anchorY: 1 });
  }

  function build(frame: EnvironmentFrame) {
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
    clearCachedMaterial(canvas);
    canvas.width = Math.max(1, Math.round(w * scale));
    canvas.height = Math.max(1, Math.round(h * scale));
    const nativeContext = canvas.getContext('2d');
    if (!nativeContext) return false;
    const ctx = cachedMaterialContext(nativeContext);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    const layer = (existing: HTMLCanvasElement | undefined) => {
      const target = existing ?? doc.createElement('canvas');
      clearCachedMaterial(target);
      target.width = canvas.width;
      target.height = canvas.height;
      const native = target.getContext('2d');
      const context = native ? cachedMaterialContext(native) : null;
      context?.setTransform(scale, 0, 0, scale, 0, 0);
      return { target, context };
    };
    const far = layer(distant),
      near = layer(nearby);
    distant = far.target;
    nearby = near.target;
    if (!far.context || !near.context) return false;
    const hazeColor = `rgb(${stage.fog.join(',')})`;
    setSceneryAtmosphere(ctx, hazeColor);
    setSceneryAtmosphere(far.context, hazeColor, 0.9);
    setSceneryAtmosphere(near.context, hazeColor, 0.35);
    const finish = () => {
      // Courtyard landmarks belong behind its gateway, never across the roof or posts.
      const variationContext = frame.stage === 6 ? far.context! : near.context!;
      variationContext.save();
      if (frame.stage === 6) variationContext.globalCompositeOperation = 'destination-over';
      drawStageVariations(
        variationContext,
        landmarks!,
        frame.stage,
        frame.stageSeed ?? 0,
        w,
        h,
        frame.lowQuality,
        cachedMaterials,
      );
      variationContext.restore();
      cached = canvas;
      for (const layer of [canvas, distant, nearby]) if (layer) invalidateSceneTexture(layer);
      builds++;
      return true;
    };
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
      return finish();
    }
    if (frame.stage === 2) {
      drawFallingBlossomPath(
        ctx,
        far.context,
        near.context,
        {
          cherries: images[11]!,
          petals: images[12]!,
          mountains: images[3]!,
          banks: images[4]!,
          shrubs: images[5]!,
          rocks: images[6]!,
        },
        w,
        h,
        scale,
        frame.lowQuality,
      );
      return finish();
    }
    const compose = [
      undefined,
      undefined,
      undefined,
      drawRainwaterHollow,
      drawHollowBambooRoad,
      drawWhiteSilencePass,
      drawEmberCourtyard,
      drawBrokenShore,
      drawMoonwatchClearing,
    ][frame.stage];
    if (compose) {
      compose(
        ctx,
        far.context,
        near.context,
        {
          bamboo: images[0]!,
          pines: images[2]!,
          mountains: images[3]!,
          banks: images[4]!,
          shrubs: images[5]!,
          rocks: images[6]!,
          fieldRocks: images[6]!,
          grassEdges: images[7]!,
          fogWisps: images[9]!,
          boulders: images[10]!,
          reeds: images[13]!,
          snowPeak: images[24]!,
          snowPines: images[14]!,
          snowBoulders: images[15]!,
          snowRocks: images[16]!,
          templePosts: images[17]!,
          templeWalls: images[18]!,
          templeRoofs: images[19]!,
          templeSteps: images[20]!,
          seaStacks: images[21]!,
          foam: images[22]!,
          fallenBamboo: images[23]!,
        },
        w,
        h,
        scale,
        frame.lowQuality,
      );
      return finish();
    }
    const { horizonY, groundY, eH } = createLayout(w, h);
    const openField = frame.stage === 0;
    const restoredField = openField;
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
        fieldMist: 0.3,
        mountains: (g) => drawMountainTiles(g, images[3]!, w, h, stage),
      }).canvas;
      drawCachedImage(ctx, field, [0, 0, field.width, field.height], 0, 0, w, h);
      clearCachedMaterial(field);
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
    return finish();
  }

  function draw(ctx: SceneDrawing, frame: EnvironmentFrame): boolean {
    ctx.save();
    try {
      const valid =
        Number.isFinite(frame.width) &&
        Number.isFinite(frame.height) &&
        frame.width > 0 &&
        frame.height > 0 &&
        Number.isFinite(frame.dpr);
      if (!disposed && valid) {
        void prepare(frame.stage);
        if (ready) {
          const key = JSON.stringify([
            frame.width,
            frame.height,
            frame.dpr,
            frame.stage,
            frame.stageSeed ?? 0,
            frame.lowQuality,
          ]);
          if (key !== cacheKey) {
            if (build(frame)) cacheKey = key;
            else {
              failed = true;
              ready = false;
            }
          }
          if (ready && cached) {
            status = 'layered';
            drawCachedImage(
              ctx,
              cached,
              [0, 0, cached.width, cached.height],
              0,
              0,
              frame.width,
              frame.height,
            );
            const motion =
              frame.reducedMotion || frame.reducedFlashes || frame.lowQuality
                ? 0
                : Math.sin(frame.time * 0.12);
            if (distant)
              drawCachedImage(
                ctx,
                distant,
                [0, 0, distant.width, distant.height],
                motion * 1.5,
                0,
                frame.width,
                frame.height,
              );
            if (nearby)
              drawCachedImage(
                ctx,
                nearby,
                [0, 0, nearby.width, nearby.height],
                motion * 3,
                0,
                frame.width,
                frame.height,
              );
            drawEnvironmentMotion(ctx, frame, images[9]);
            return true;
          }
        }
        status = failed ? 'unavailable' : 'loading';
      } else status = 'loading';
      return false;
    } finally {
      ctx.restore();
    }
  }

  function dispose() {
    landmarks?.release();
    landmarks = undefined;
    scenery?.release();
    scenery = undefined;
    cachedMaterials.dispose();
    foreground.dispose();
    disposed = true;
    generation++;
    status = 'loading';
    images = [];
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
    async compose(frame: EnvironmentFrame): Promise<boolean> {
      await prepare(frame.stage);
      if (
        disposed ||
        !ready ||
        !Number.isFinite(frame.width) ||
        !Number.isFinite(frame.height) ||
        !Number.isFinite(frame.dpr) ||
        frame.width <= 0 ||
        frame.height <= 0
      )
        return false;
      const key = JSON.stringify([
        frame.width,
        frame.height,
        frame.dpr,
        frame.stage,
        frame.stageSeed ?? 0,
        frame.lowQuality,
      ]);
      if (cacheKey !== key) {
        if (!build(frame)) return false;
        cacheKey = key;
      }
      if (frame.stage === 4 && images[0]) foreground.prepare(images[0], frame);
      return true;
    },
    exportLayers() {
      const describe = (canvas: HTMLCanvasElement) => ({
        colour: canvas,
        material: getCachedMaterial(canvas),
      });
      return {
        layers: [cached, distant, nearby]
          .filter((layer): layer is HTMLCanvasElement => !!layer)
          .map(describe),
        foreground: preparedStage === 4 ? foreground.layers.map(describe) : [],
      };
    },
    drawForeground(ctx: SceneDrawing, frame: EnvironmentFrame) {
      return (
        !disposed &&
        status === 'layered' &&
        frame.stage === 4 &&
        !!images[0] &&
        foreground.draw(ctx, images[0], frame)
      );
    },
    prepare,
    dispose,
    get backend(): EnvironmentBackend {
      return status;
    },
    snapshot: () => ({
      foreground: foreground.snapshot(),
      backend: status,
      stage: cacheKey ? preparedStage : undefined,
      builds,
      loadedImages:
        images.filter((image) => image?.naturalWidth).length +
        (landmarks ? landmarkStore.snapshot().pages : 0),
      packedPages: { landmarks: landmarkStore.snapshot(), scenery: sceneryStore.snapshot() },
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
