import { markScenePhase, measureScenePhase } from '../platform/scene-timing.ts';
import type { RunState } from '../game/run-state.ts';
import type { TrialDefinition } from '../game/content/trials.ts';
import { STAGES } from '../game/content/stages.ts';

export interface ScenePreparationFrame {
  stageSeed: number;
  width: number;
  height: number;
  dpr: number;
  time: number;
  stage: number;
  reducedMotion: boolean;
  reducedFlashes: boolean;
  lowQuality: boolean;
}
export interface SceneFlowViews {
  readonly stageSeed: number;
  readonly W: number;
  readonly H: number;
  readonly DPR: number;
  readonly presentationState: { readonly time: number };
  readonly G: RunState;
  readonly reducedMotion: () => boolean;
  readonly reducedFlashes: () => boolean;
  readonly density: () => number;
  readonly activeTrial: TrialDefinition | null;
  readonly environmentState: { readonly previewDemon: boolean };
  readonly compositionKey: (frame: ScenePreparationFrame) => string;
  readonly cvs: { readonly dataset: DOMStringMap };
  readonly screenAnimation: { invalidate(): void };
  readonly demonRealmRenderer: { prepare(): Promise<boolean> };
  readonly driftRenderer: { prepare(stage: number): Promise<boolean> };
  prepareFigureArtwork(signal: AbortSignal): Promise<boolean>;
  readonly environmentRenderer: {
    compose(frame: ScenePreparationFrame): Promise<boolean>;
    snapshot?(): { texturesWarmed?: boolean; backend?: string; workerFailure?: string };
    retry?(): boolean;
  };
  readonly sceneRecovery?: { show(retry: () => void): void; clear(): void };
  readonly lifecycle: { readonly disposed: boolean };
  readonly frameLoop: { resetClock(): void };
  requestedSceneKey: string;
  sceneRequest: number;
  requestedSceneIdentity: string;
  sceneContinuation: (() => void) | undefined;
  sceneLoading: boolean;
  sceneReadyToPresent: boolean;
}
/** Scene readiness owns stale-request suppression and paused continuation adoption.
 * Renderer operations are explicit ports; drawing never resumes gameplay. */
export function createSceneFlow(readViews: () => SceneFlowViews) {
  let figurePreparation: AbortController | undefined;
  function retryScene() {
    const views = readViews();
    if (views.lifecycle.disposed) return;
    views.environmentRenderer.retry?.();
    views.requestedSceneKey = '';
    prepareScene();
  }
  function prepareScene() {
    const views = readViews();
    const {
      stageSeed,
      W,
      H,
      DPR,
      presentationState,
      G,
      reducedMotion,
      reducedFlashes,
      density,
      activeTrial,
      environmentState,
      compositionKey,
      cvs,
      screenAnimation,
      demonRealmRenderer,
      environmentRenderer,
      lifecycle,
    } = views;
    const frame = {
      stageSeed,
      width: W,
      height: H,
      dpr: DPR,
      time: presentationState.time,
      stage: G.stage,
      reducedMotion: reducedMotion(),
      reducedFlashes: reducedFlashes(),
      lowQuality: density() <= 0.3,
    };
    const demon = activeTrial?.realm === 'demon' || environmentState.previewDemon;
    const key = `${demon}:${compositionKey(frame)}`;
    if (key === views.requestedSceneKey) return;
    figurePreparation?.abort();
    figurePreparation = new AbortController();
    markScenePhase('prepare-scene', key, { stage: G.stage, seed: stageSeed });
    views.requestedSceneKey = key;
    const request = ++views.sceneRequest;
    views.sceneRecovery?.clear();
    delete cvs.dataset.sceneError;
    const identity = `${demon}:${G.stage}:${stageSeed}`;
    if (identity !== views.requestedSceneIdentity) views.sceneContinuation = undefined;
    views.requestedSceneIdentity = identity;
    views.sceneLoading = true;
    views.sceneReadyToPresent = false;
    cvs.dataset.sceneState = 'loading';
    screenAnimation.invalidate();
    const unavailable = () => {
      if (lifecycle.disposed || request !== views.sceneRequest) return;
      cvs.dataset.sceneState = 'unavailable';
      cvs.dataset.sceneError =
        views.environmentRenderer.snapshot?.().workerFailure ?? 'Scene preparation failed';
      views.sceneRecovery?.show(retryScene);
      screenAnimation.invalidate();
    };
    const pending = Promise.all([
      demon ? demonRealmRenderer.prepare() : environmentRenderer.compose(frame),
      views.driftRenderer.prepare(demon ? STAGES.length : G.stage),
      views.prepareFigureArtwork(figurePreparation.signal),
    ]).then(([sceneReady, driftReady, weaponsReady]) => sceneReady && driftReady && weaponsReady);
    void pending
      .then((ready) => {
        if (lifecycle.disposed || request !== views.sceneRequest) return;
        if (!ready) {
          unavailable();
          return;
        }
        views.sceneReadyToPresent = true;
        screenAnimation.invalidate();
      })
      .catch(unavailable);
  }
  function deferUntilSceneReady(action: () => void) {
    const views = readViews();
    if (!views.sceneLoading) return false;
    views.sceneContinuation = action;
    return true;
  }
  function settlePresentedScene() {
    const views = readViews();
    const { cvs, G, frameLoop } = views;
    if (views.sceneLoading && views.sceneReadyToPresent) {
      const key = views.requestedSceneKey;
      if (!views.environmentRenderer.snapshot?.().texturesWarmed || key.startsWith('true:'))
        markScenePhase('textures-warmed', key, {
          mode: 'first-present-submission',
          prewarmed: false,
        });
      markScenePhase('settle-presented-scene', key);
      measureScenePhase(
        'scene-load',
        'issen:prepare-scene:' + key,
        'issen:settle-presented-scene:' + key,
        key,
      );
      views.sceneLoading = false;
      views.sceneReadyToPresent = false;
      cvs.dataset.sceneState = 'ready';
      const continuation = views.sceneContinuation;
      views.sceneContinuation = undefined;
      const paused = G.state === 'paused';
      continuation?.();
      if (paused && G.state !== 'paused') {
        G.pausedFrom = G.state;
        G.state = 'paused';
      }
      frameLoop.resetClock();
    }
  }
  return { prepareScene, retryScene, deferUntilSceneReady, settlePresentedScene };
}
