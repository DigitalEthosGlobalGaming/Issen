import { rng } from '../../shared/random.ts';
import { createLayout } from '../layout.ts';
import { drawAtlasSprite } from './scene-kit.ts';

export type VariationFamily = 'pines' | 'shrubs' | 'bamboo' | 'snowPines' | 'rocks' | 'snowRocks';
export interface StageVariationProp {
  family: VariationFamily;
  cell: number;
  /** Viewport-relative center/width; only the outer margins receive props. */
  x: number;
  width: number;
  footOffset: number;
  alpha: number;
  angle: number;
  flip: boolean;
  ground: boolean;
  frame?: { x: number; y: number; width: number; height: number };
  anchorY?: number;
}

/** Pure normalized plan: resolution and quality never reroll its visual choices. */
export function stageVariationPlan(stage: number, seed: number): StageVariationProp[] {
  if (!Number.isInteger(stage) || stage < 0 || stage > 8) return [];
  const random = rng((seed >>> 0) ^ Math.imul(stage + 1, 0x45d9f3b));
  const family: VariationFamily =
    stage === 4 ? 'bamboo' : stage === 5 ? 'snowPines' : stage === 2 ? 'shrubs' : 'pines';
  // Ridge's pine shoulder is on the left; Shore keeps its open sea on the left.
  const treeSide = stage === 1 ? 0 : stage === 7 ? 1 : random() < 0.5 ? 0 : 1;
  return [0, 1, 2].map((index) => {
    const ground = index !== 0 || stage === 6;
    const side = index === 0 ? treeSide : index === 1 ? 1 - treeSide : treeSide;
    const inset = 0.025 + random() * 0.04;
    const prop: StageVariationProp = {
      family: ground ? (stage === 5 ? 'snowRocks' : 'rocks') : family,
      cell: Math.floor(random() * 4),
      x: side ? 1 - inset : inset,
      width: (ground ? 0.055 : 0.085) + random() * (ground ? 0.025 : 0.025),
      footOffset: ground ? 0.84 + random() * 0.095 : -0.018 + random() * 0.018,
      alpha: ground ? 0.3 + random() * 0.14 : 0.18 + random() * 0.1,
      angle: (random() - 0.5) * (ground ? 0.065 : 0.035),
      flip: random() < 0.5,
      ground,
    };
    if (stage === 5) {
      // These sheets are unevenly packed; never sample nominal 2x2 cells.
      const alternate = prop.cell % 2 === 1;
      prop.frame = ground
        ? { x: 0, y: 500, width: 887, height: 387 }
        : alternate
          ? { x: 660, y: 660, width: 594, height: 594 }
          : { x: 700, y: 0, width: 554, height: 627 };
      prop.anchorY = ground ? 0.82 : alternate ? 0.81 : 0.975;
      prop.flip = false;
    }
    return prop;
  });
}

/** Call only while rebuilding a cached composition; no per-frame canvases or random rolls. */
export function drawStageVariations(
  ctx: CanvasRenderingContext2D,
  atlases: Partial<Record<VariationFamily, HTMLImageElement>>,
  stage: number,
  seed: number,
  width: number,
  height: number,
  lowQuality: boolean,
) {
  const { groundY, eH } = createLayout(width, height);
  for (const prop of stageVariationPlan(stage, seed).slice(0, lowQuality ? 2 : 3)) {
    const image = atlases[prop.family];
    if (!image?.naturalWidth || !image.naturalHeight) continue;
    drawAtlasSprite(
      ctx,
      image,
      prop.cell,
      prop.x * width,
      prop.ground ? height * prop.footOffset : groundY - eH * 0.27 + height * prop.footOffset,
      Math.min(width * prop.width, height * (prop.ground ? 0.17 : 0.28)),
      {
        alpha: prop.alpha,
        angle: prop.angle,
        flip: prop.flip,
        frame: prop.frame,
        anchorY: prop.anchorY ?? 0.96,
        fadeFrom: prop.anchorY ? prop.anchorY - 0.13 : prop.ground ? 0.72 : 0.84,
      },
    );
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
