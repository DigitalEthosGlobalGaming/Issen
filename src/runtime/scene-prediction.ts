import { predictNextStage } from '../game/session/stage-progression.ts';
import type { RunState } from '../game/run-state.ts';
import type { CompositionIdentity } from '../rendering/environment/worker-types.ts';

export type UpcomingScene = Readonly<Required<CompositionIdentity>>;
interface PredictionViews {
  readonly G: Pick<RunState, 'state' | 'wave' | 'stage' | 'rush'>;
  readonly activeTrial: unknown;
  readonly cinematic: { readonly active: boolean };
  readonly stageVisits: { peek(stage: number): number };
  readonly W: number;
  readonly H: number;
  readonly DPR: number;
  density(): number;
}

/** Forecast the actual visit ledger without entering it or spending combat randomness. */
export function createScenePrediction(readViews: () => PredictionViews) {
  let cached: UpcomingScene | undefined;
  return (): UpcomingScene | undefined => {
    const views = readViews();
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
      lowQuality = views.density() <= 0.3;
    if (
      cached?.stage === stage &&
      cached.stageSeed === stageSeed &&
      cached.width === width &&
      cached.height === height &&
      cached.dpr === dpr &&
      cached.lowQuality === lowQuality
    )
      return cached;
    return (cached = Object.freeze({ stage, stageSeed, width, height, dpr, lowQuality }));
  };
}
