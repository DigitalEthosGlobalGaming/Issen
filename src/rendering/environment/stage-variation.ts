import type { SceneDrawing } from '../scene-drawing.ts';
import { rng } from '../../shared/random.ts';
import { createLayout } from '../layout.ts';
import { drawAtlasSprite } from './scene-kit.ts';
import { packedMaterialFrame } from '../packed-assets.ts';

import { LANDMARK_LAYOUT, type LandmarkFamily } from './landmark-layout.ts';
import type { LandmarkLease } from './packed-landmarks.ts';
import type { createCachedMaterials } from '../cached-materials.ts';

export type VariationFamily = LandmarkFamily;
export interface StageVariationProp {
  family: VariationFamily;
  cell: number;
  /** Center of the visible cropped silhouette, never the off-center root pivot. */
  x: number;
  width: number;
  maxHeight: number;
  footOffset: number;
  alpha: number;
  angle: number;
  flip: boolean;
}

/** Pure normalized plan: resolution and quality never reroll its visual choices. */
export function stageVariationPlan(stage: number, seed: number): StageVariationProp[] {
  if (!Number.isInteger(stage) || stage < 0 || stage > 8) return [];
  const random = rng((seed >>> 0) ^ Math.imul(stage + 1, 0x45d9f3b));
  const family: VariationFamily =
    stage === 2
      ? 'cherryLandmarks'
      : stage === 4
        ? 'bambooLandmarks'
        : stage === 5
          ? 'snowWoodland'
          : stage === 6
            ? 'stones'
            : 'woodland';
  // Ridge keeps its dominant left shoulder; Shore leaves its left sea open.
  const primarySide = stage === 1 ? 0 : stage === 7 ? 1 : random() < 0.5 ? 0 : 1;
  const primaryCell = (seed >>> 0) % 4;
  return [0, 1].map((index) => {
    const primary = index === 0;
    const side = primary ? primarySide : 1 - primarySide;
    const width = primary ? 0.3 + random() * 0.04 : 0.18 + random() * 0.04;
    // Keep the entire visible silhouette outside the central .34-.66 combat corridor.
    const center = Math.min(0.17 + random() * 0.012, 0.328 - width / 2);
    return {
      family: primary ? family : stage === 5 ? 'snowWoodland' : 'stones',
      cell: primary ? primaryCell : (primaryCell + 1 + Math.floor(random() * 3)) % 4,
      // The courtyard's edge architecture fills both margins on portrait tablets.
      // Its main landmark occupies the distant gap between the gate and wall.
      x: stage === 6 && primary ? 0.55 : side ? 1 - center : center,
      width: stage === 6 && primary ? 0.26 : width,
      maxHeight: primary ? (stage === 6 ? 0.3 : 0.38 + random() * 0.04) : 0.23,
      footOffset: stage === 6 && primary ? 0 : (random() - 0.5) * 0.018,
      alpha: primary ? 0.68 + random() * 0.12 : 0.52 + random() * 0.12,
      angle: (random() - 0.5) * 0.015,
      flip: random() < 0.5,
    };
  });
}

/** Native aspect and root offset are resolved once per composition rebuild. */
export function stageVariationPlacement(prop: StageVariationProp, width: number, height: number) {
  const layout = LANDMARK_LAYOUT[prop.family].frames[prop.cell]!;
  const renderWidth = Math.min(
    width * prop.width,
    (height * prop.maxHeight * layout.frame.width) / layout.frame.height,
  );
  const { groundY, eH } = createLayout(width, height);
  return {
    ...layout,
    width: renderWidth,
    // Mirroring reverses the root offset while preserving the silhouette's visual center.
    x: prop.x * width + (prop.flip ? -1 : 1) * (layout.anchorX - 0.5) * renderWidth,
    foot: groundY - eH * 0.3 + height * prop.footOffset,
  };
}

/** Midground landmarks are painted only during cached composition rebuilds. */
export function drawStageVariations(
  ctx: SceneDrawing,
  lease: LandmarkLease,
  stage: number,
  seed: number,
  width: number,
  height: number,
  _lowQuality: boolean,
  materials: ReturnType<typeof createCachedMaterials>,
) {
  // Both silhouettes remain visible at low quality; they add no per-frame allocation.
  for (const prop of stageVariationPlan(stage, seed)) {
    const sprite = lease.sprite(`landmark.${prop.family}.${prop.cell}`);
    if (!sprite || sprite.metadata.empty) continue;
    const image = sprite.colour;
    const placement = stageVariationPlacement(prop, width, height);
    drawAtlasSprite(ctx, image, prop.cell, placement.x, placement.foot, placement.width, {
      alpha: prop.alpha,
      angle: prop.angle,
      flip: prop.flip,
      frame: {
        x: sprite.metadata.frame[0],
        y: sprite.metadata.frame[1],
        width: sprite.metadata.frame[2],
        height: sprite.metadata.frame[3],
      },
      logicalSize: sprite.metadata.logicalSize,
      trim: sprite.metadata.trim,
      draw: (ctx, source, frame, x, y, width, height, colour) =>
        materials.draw(
          ctx,
          source as HTMLImageElement | ImageBitmap,
          frame,
          x,
          y,
          width,
          height,
          colour,
          packedMaterialFrame(sprite.material, frame),
        ),
      anchorX: placement.anchorX,
      anchorY: placement.anchorY,
      fadeFrom: placement.anchorY - 0.1,
      fadeTo: placement.anchorY + 0.005,
    });
  }
}

/** Runtime-local visit identity; never consumes the run RNG or writes a checkpoint. */
export function createStageVisitSeeds(initialSeed: number) {
  let currentStage: number | undefined;
  let visit = 0;
  let seed = initialSeed >>> 0;
  return {
    enter(stage: number, forceNewVisit = false): number {
      if (stage !== currentStage || forceNewVisit) {
        currentStage = stage;
        visit++;
        seed =
          (initialSeed + Math.imul(visit, 0x9e3779b9) + Math.imul(stage + 1, 0x85ebca6b)) >>> 0;
      }
      return seed;
    },
    get seed() {
      return seed;
    },
    get visits() {
      return visit;
    },
  };
}
