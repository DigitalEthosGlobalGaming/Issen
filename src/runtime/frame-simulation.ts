import { STAGES } from '../game/content/stages.ts';
import type { RunState } from '../game/run-state.ts';
import type { TrialDefinition } from '../game/content/trials.ts';
import type { DailyRun } from '../game/progression/daily.ts';
export interface FrameSimulationViews {
  readonly sceneLoading: boolean;
  readonly activeTrial: TrialDefinition | null;
  readonly trialFailure: string;
  readonly finishTrial: (message?: string) => void;
  readonly G: RunState;
  readonly updateAmbient: (dt: number) => void;
  readonly cinematic: { readonly active: boolean };
  readonly updateWeather: (dt: number) => void;
  readonly reducedMotion: () => boolean;
  readonly audio: { update(dt: number, weather: (typeof STAGES)[number]['weather'], wind: number, veil: number): void };
  readonly presentationState: { readonly wind: number };
  readonly updatePlayer: (dt: number) => void;
  readonly apparelMotion: { update(dt: number, reduced: boolean): void };
  readonly updateEnemies: (dt: number, raw: number) => void;
  readonly activeDaily: DailyRun | null;
  readonly waveConfiguration: () => { ordered: boolean };
  readonly liveOrdered: () => readonly { state: string }[];
  readonly guided: { startOrder(): unknown };
  readonly bossPhase: { updateBackground(dt: number, raw: number): void };
  readonly phaseRouter: { updateFrame(dt: number, raw: number): void };
  readonly updateFx: (dt: number, raw: number) => void;
  readonly renderTrialObjective: () => void;
  readonly updateTransition: (raw: number) => void;
  readonly WX: { readonly wo: number };
  readonly advanceClock: (dt: number) => void;
  readonly advanceCamera: (raw: number) => void;
}
/** Owns simulation dispatch/order; visual clocks and browser capabilities are ports. */
export function createFrameSimulation(readViews: () => FrameSimulationViews) {
  function update(dt: number, raw: number) {
    const { sceneLoading, activeTrial, trialFailure, finishTrial, G, updateAmbient, cinematic, updateWeather, reducedMotion, audio, presentationState, updatePlayer, apparelMotion, updateEnemies, activeDaily, waveConfiguration, liveOrdered, guided, bossPhase, phaseRouter, updateFx, renderTrialObjective, updateTransition, WX, advanceClock, advanceCamera } = readViews();
    if (sceneLoading) return;
    if (activeTrial && trialFailure) {
      finishTrial(trialFailure);
      return;
    }
    advanceClock(dt);
    if (['playing', 'boss', 'between', 'standoff', 'shrine'].includes(G.state)) G.runTime += raw;
    updateAmbient(dt);
    // Cinematic mode advances cosmetic time only: no encounters, weather hazards or run RNG.
    if (cinematic.active) {
      updateWeather(reducedMotion() ? 0 : dt);
      audio.update(raw, STAGES[G.stage]!.weather, presentationState.wind, 0);
      return;
    }
    if (G.freezeT > 0) G.freezeT -= dt;
    if (G.petT > 0) G.petT -= dt;
    updateWeather(dt);
    updatePlayer(dt);
    apparelMotion.update(raw, reducedMotion());
    updateEnemies(dt, raw);
    if (
      !activeTrial &&
      !activeDaily &&
      G.state === 'playing' &&
      waveConfiguration().ordered &&
      liveOrdered()[0]?.state === 'idle'
    )
      guided.startOrder();
    bossPhase.updateBackground(dt, raw);
    phaseRouter.updateFrame(dt, raw);
    updateFx(dt, raw);
    renderTrialObjective();
    updateTransition(raw);
    advanceCamera(raw);
    audio.update(raw, STAGES[G.stage]!.weather, presentationState.wind, WX.wo);
  }

  return { update };
}
