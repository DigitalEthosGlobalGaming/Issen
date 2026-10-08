import type { RunState } from '../game/run-state.ts';
import type { TrialDefinition } from '../game/content/trials.ts';

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
  readonly environmentRenderer: { compose(frame: ScenePreparationFrame): Promise<boolean> };
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
    views.requestedSceneKey = key;
    const request = ++views.sceneRequest;
    const identity = `${demon}:${G.stage}:${stageSeed}`;
    if (identity !== views.requestedSceneIdentity) views.sceneContinuation = undefined;
    views.requestedSceneIdentity = identity;
    views.sceneLoading = true;
    views.sceneReadyToPresent = false;
    cvs.dataset.sceneState = 'loading';
    screenAnimation.invalidate();
    const pending = demon ? demonRealmRenderer.prepare() : environmentRenderer.compose(frame);
    void pending
      .then((ready) => {
        if (lifecycle.disposed || request !== views.sceneRequest) return;
        if (!ready) {
          cvs.dataset.sceneState = 'unavailable';
          return;
        }
        views.sceneReadyToPresent = true;
        screenAnimation.invalidate();
      })
      .catch(() => {
        if (!lifecycle.disposed && request === views.sceneRequest)
          cvs.dataset.sceneState = 'unavailable';
      });
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
  return { prepareScene, deferUntilSceneReady, settlePresentedScene };
}
