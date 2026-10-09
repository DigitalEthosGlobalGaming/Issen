import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneFlow } from '../../src/runtime/scene-flow.ts';

test('inspection cancels stale preparation and restores the same continuation after resize', async () => {
  const requests = [],
    signals = [];
  let suspended = 0,
    recovery = 0,
    continued = 0;
  const views = {
    stageSeed: 42,
    W: 390,
    H: 844,
    DPR: 1.5,
    presentationState: { time: 0 },
    G: { stage: 0, state: 'title' },
    reducedMotion: () => false,
    reducedFlashes: () => false,
    density: () => 1,
    activeTrial: null,
    environmentState: { previewDemon: false },
    compositionKey: (f) => `${f.stage}:${f.stageSeed}:${f.width}:${f.height}`,
    cvs: { dataset: {} },
    screenAnimation: { invalidate() {} },
    demonRealmRenderer: { release() {}, prepare: async () => true },
    driftRenderer: { prepare: async () => true },
    prepareFigureArtwork: async (signal) => {
      signals.push(signal);
      return true;
    },
    reclaimMemory() {},
    environmentRenderer: {
      compose: (frame) => new Promise((resolve) => requests.push({ frame, resolve })),
      suspend() {
        suspended++;
      },
      snapshot: () => ({ texturesWarmed: true }),
    },
    sceneRecovery: {
      clear() {},
      show() {
        recovery++;
      },
    },
    lifecycle: { disposed: false },
    frameLoop: { resetClock() {} },
    requestedSceneKey: '',
    sceneRequest: 0,
    requestedSceneIdentity: '',
    sceneContinuation: undefined,
    sceneLoading: false,
    sceneReadyToPresent: false,
  };
  const flow = createSceneFlow(() => views);
  flow.prepareScene();
  assert.equal(
    flow.deferUntilSceneReady(() => continued++),
    true,
  );
  flow.setOccluded(true);
  flow.setOccluded(true);
  assert.equal(suspended, 1);
  assert.equal(signals[0].aborted, true);
  views.W = 844;
  views.H = 390;
  flow.prepareScene();
  assert.equal(requests.length, 1);
  requests[0].resolve(false);
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(views.cvs.dataset.sceneState, 'occluded');
  assert.equal(recovery, 0);
  flow.setOccluded(false);
  flow.prepareScene();
  assert.equal(requests[1].frame.stageSeed, 42);
  assert.equal(requests[1].frame.width, 844);
  requests[1].resolve(true);
  await new Promise((resolve) => setImmediate(resolve));
  flow.settlePresentedScene();
  assert.equal(continued, 1);
  assert.equal(views.cvs.dataset.sceneState, 'ready');
});
