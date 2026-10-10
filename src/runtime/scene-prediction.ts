import { predictNextStage } from '../game/session/stage-progression.ts';
import type { RunState } from '../game/run-state.ts';
import type { CompositionIdentity } from '../rendering/environment/worker-types.ts';
import { sceneryLowQuality, type SceneryDetail } from '../rendering/environment/scenery-detail.ts';

export type UpcomingScene = Readonly<
  Required<Omit<CompositionIdentity, 'sceneryDetail'>> & Pick<CompositionIdentity, 'sceneryDetail'>
>;
interface PredictionViews {
  readonly G: Pick<RunState, 'state' | 'wave' | 'stage' | 'rush'>;
  readonly activeTrial: unknown;
  readonly cinematic: { readonly active: boolean };
  readonly stageVisits: { peek(stage: number): number };
  readonly W: number;
  readonly H: number;
  readonly DPR: number;
  density(): number;
  preload?(): boolean;
  sceneryDetail?(): SceneryDetail | undefined;
}

/** Forecast the actual visit ledger without entering it or spending combat randomness. */
export function createScenePrediction(readViews: () => PredictionViews) {
  let cached: UpcomingScene | undefined;
  return (): UpcomingScene | undefined => {
    const views = readViews();
    if (views.preload?.() === false) {
      cached = undefined;
      return undefined;
    }
    const stage = predictNextStage(views.G, !!views.activeTrial, views.cinematic.active);
    const { W: width, H: height, DPR: dpr } = views;
    if (
      stage === undefined ||
      !Number.isFinite(width) ||
      width <= 0 ||
      !Number.isFinite(height) ||
      height <= 0 ||
      !Number.isFinite(dpr) ||
      dpr <= 0
    ) {
      cached = undefined;
      return undefined;
    }
    const stageSeed = views.stageVisits.peek(stage),
      sceneryDetail = views.sceneryDetail?.(),
      lowQuality = sceneryLowQuality(sceneryDetail, views.density() <= 0.3);
    if (
      cached?.stage === stage &&
      cached.stageSeed === stageSeed &&
      cached.width === width &&
      cached.height === height &&
      cached.dpr === dpr &&
      cached.lowQuality === lowQuality &&
      cached.sceneryDetail === sceneryDetail
    )
      return cached;
    return (cached = Object.freeze({
      stage,
      stageSeed,
      width,
      height,
      dpr,
      lowQuality,
      sceneryDetail,
    }));
  };
}
