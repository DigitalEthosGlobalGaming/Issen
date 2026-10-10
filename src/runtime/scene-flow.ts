import { markScenePhase, measureScenePhase } from '../platform/scene-timing.ts';
import type { RunState } from '../game/run-state.ts';
import type { TrialDefinition } from '../game/content/trials.ts';
import { STAGES } from '../game/content/stages.ts';
import { sceneryLowQuality, type SceneryDetail } from '../rendering/environment/scenery-detail.ts';

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
  sceneryDetail?: SceneryDetail;
}
export interface SceneFlowViews {
  readonly stageSeed: number;
  readonly figureIdentity?: string;
  readonly W: number;
  readonly H: number;
  readonly DPR: number;
  readonly presentationState: { readonly time: number };
  readonly G: RunState;
  readonly reducedMotion: () => boolean;
  readonly reducedFlashes: () => boolean;
  readonly density: () => number;
  readonly sceneryDetail?: () => SceneryDetail | undefined;
  readonly activeTrial: TrialDefinition | null;
  readonly environmentState: { readonly previewDemon: boolean };
  readonly compositionKey: (frame: ScenePreparationFrame) => string;
  readonly cvs: { readonly dataset: DOMStringMap };
  readonly screenAnimation: { invalidate(): void };
  readonly demonRealmRenderer: {
    prepare(frame?: ScenePreparationFrame, signal?: AbortSignal): Promise<boolean>;
    release(): void;
    snapshot?(): { texturesWarmed?: boolean };
  };
  readonly driftRenderer: { prepare(stage: number): Promise<boolean> };
  prepareFigureArtwork(signal: AbortSignal): Promise<boolean>;
  reclaimMemory(): unknown;
  readonly environmentRenderer: {
    compose(frame: ScenePreparationFrame): Promise<boolean>;
    snapshot?(): { texturesWarmed?: boolean; backend?: string; workerFailure?: string };
    retry?(): boolean;
    suspend(): void;
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
  let occluded = false;
  function setOccluded(value: boolean) {
    if (value === occluded) return;
    occluded = value;
    if (!value) return;
    const views = readViews();
    figurePreparation?.abort();
    views.sceneRequest++;
    views.requestedSceneKey = '';
    views.sceneLoading = views.sceneReadyToPresent = false;
    views.environmentRenderer.suspend();
    views.demonRealmRenderer.release();
    views.cvs.dataset.sceneState = 'occluded';
  }
  function retryScene() {
    const views = readViews();
    if (views.lifecycle.disposed) return;
    views.environmentRenderer.retry?.();
    views.requestedSceneKey = '';
    prepareScene();
  }
  function prepareScene() {
    if (occluded) return;
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
      lowQuality: sceneryLowQuality(views.sceneryDetail?.(), density() <= 0.3),
      sceneryDetail: views.sceneryDetail?.(),
    };
    const demon = activeTrial?.realm === 'demon' || environmentState.previewDemon;
    const key = `${demon}:${compositionKey(frame)}${views.figureIdentity ? ':' + views.figureIdentity : ''}`;
    if (key === views.requestedSceneKey) return;
    figurePreparation?.abort();
    figurePreparation = new AbortController();
    if (!demon) demonRealmRenderer.release();
    else environmentRenderer.suspend();
    views.reclaimMemory();
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
    let failureReason: string | undefined;
    function reportFailure(step: string, error?: unknown) {
      if (lifecycle.disposed || request !== views.sceneRequest) return;
      const message =
        error === undefined ? undefined : error instanceof Error ? error.message : String(error);
      failureReason ??= `Scene preparation failed: ${step}${message ? ' (' + message + ')' : ''}`;
      const detail = { step, stage: frame.stage, seed: frame.stageSeed, request, error: message };
      markScenePhase('scene-preparation-failed', key + ':' + step, detail);
      console.warn('[Issen] Scene preparation failed.', { ...detail, key }, error);
    }
    function trackPreparation(step: string, pending: Promise<boolean>) {
      return pending.then(
        (ready) => {
          if (!ready) reportFailure(step);
          return ready;
        },
        (error: unknown) => {
          reportFailure(step, error);
          throw error;
        },
      );
    }
    const unavailable = (error?: unknown) => {
      if (lifecycle.disposed || request !== views.sceneRequest) return;
      if (!failureReason) reportFailure('readiness', error);
      cvs.dataset.sceneState = 'unavailable';
      cvs.dataset.sceneError =
        views.environmentRenderer.snapshot?.().workerFailure ?? failureReason;
      views.sceneRecovery?.show(retryScene);
      screenAnimation.invalidate();
    };
    const pending = Promise.all([
      trackPreparation(
        'scenery',
        demon
          ? demonRealmRenderer.prepare(frame, figurePreparation.signal)
          : environmentRenderer.compose(frame),
      ),
      trackPreparation('drift', views.driftRenderer.prepare(demon ? STAGES.length : G.stage)),
      trackPreparation('figures', views.prepareFigureArtwork(figurePreparation.signal)),
    ]).then(([sceneReady, driftReady, weaponsReady]) => sceneReady && driftReady && weaponsReady);
    void pending
      .then((ready) => {
        if (lifecycle.disposed || request !== views.sceneRequest) return;
        if (!ready) {
          unavailable();
          return;
        }
        views.reclaimMemory();
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
      const prewarmed = key.startsWith('true:')
        ? views.demonRealmRenderer.snapshot?.().texturesWarmed
        : views.environmentRenderer.snapshot?.().texturesWarmed;
      if (!prewarmed)
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
  return { prepareScene, retryScene, deferUntilSceneReady, settlePresentedScene, setOccluded };
}
