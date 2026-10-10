import test from 'node:test';
import assert from 'node:assert/strict';
import { createSceneFlow } from '../../src/runtime/scene-flow.ts';

const turn = () => new Promise((resolve) => setImmediate(resolve));
function fixture(overrides = {}) {
  const views = {
    stageSeed: 42,
    W: 390,
    H: 844,
    DPR: 1.5,
    presentationState: { time: 0 },
    G: { stage: 3, state: 'paused' },
    reducedMotion: () => false,
    reducedFlashes: () => false,
    density: () => 1,
    activeTrial: null,
    environmentState: { previewDemon: false },
    compositionKey: (frame) => `${frame.stage}:${frame.stageSeed}:${frame.width}`,
    cvs: { dataset: {} },
    screenAnimation: { invalidate() {} },
    demonRealmRenderer: { release() {}, prepare: async () => true },
    driftRenderer: { prepare: async () => true },
    prepareFigureArtwork: async () => true,
    reclaimMemory() {},
    environmentRenderer: { compose: async () => true, suspend() {} },
    sceneRecovery: { clear() {}, show() {} },
    lifecycle: { disposed: false },
    frameLoop: { resetClock() {} },
    requestedSceneKey: '',
    sceneRequest: 0,
    requestedSceneIdentity: '',
    sceneContinuation: undefined,
    sceneLoading: false,
    sceneReadyToPresent: false,
    ...overrides,
  };
  return { views, flow: createSceneFlow(() => views) };
}

for (const step of ['scenery', 'drift', 'figures']) {
  test(`a failed ${step} readiness check identifies its step and preserves paused gameplay`, async (t) => {
    const warning = t.mock.method(console, 'warn', () => {});
    const { views, flow } = fixture();
    const fail = async () => false;
    if (step === 'scenery') views.environmentRenderer.compose = fail;
    else if (step === 'drift') views.driftRenderer.prepare = fail;
    else views.prepareFigureArtwork = fail;
    flow.prepareScene();
    await turn();
    flow.settlePresentedScene();
    assert.equal(views.cvs.dataset.sceneState, 'unavailable');
    assert.equal(views.cvs.dataset.sceneError, `Scene preparation failed: ${step}`);
    assert.equal(views.G.state, 'paused');
    assert.equal(views.sceneReadyToPresent, false);
    assert.equal(warning.mock.callCount(), 1);
    const detail = warning.mock.calls[0].arguments[1];
    assert.equal(detail.step, step);
    assert.equal(detail.stage, 3);
    assert.equal(detail.seed, 42);
    const [mark] = performance.getEntriesByName(
      `issen:scene-preparation-failed:${detail.key}:${step}`,
      'mark',
    );
    assert.equal(mark.detail.step, step);
  });
}

test('a rejected preparation exposes its original exception without waiting for other steps', async (t) => {
  const warning = t.mock.method(console, 'warn', () => {});
  const error = new Error('Bitmap decode failed');
  const { views, flow } = fixture({
    driftRenderer: { prepare: () => new Promise(() => {}) },
    prepareFigureArtwork: async () => {
      throw error;
    },
  });
  flow.prepareScene();
  await turn();
  assert.equal(views.cvs.dataset.sceneState, 'unavailable');
  assert.equal(
    views.cvs.dataset.sceneError,
    'Scene preparation failed: figures (Bitmap decode failed)',
  );
  assert.equal(warning.mock.callCount(), 1);
  assert.equal(warning.mock.calls[0].arguments[2], error);
});

test('cancelled and disposed preparations do not emit misleading failure warnings', async (t) => {
  const warning = t.mock.method(console, 'warn', () => {});
  for (const disposed of [false, true]) {
    let reject;
    const { views, flow } = fixture({
      prepareFigureArtwork: () =>
        new Promise((_resolve, fail) => {
          reject = fail;
        }),
    });
    flow.prepareScene();
    if (disposed) views.lifecycle.disposed = true;
    else flow.setOccluded(true);
    reject(new DOMException('Cancelled', 'AbortError'));
    await turn();
    assert.notEqual(views.cvs.dataset.sceneState, 'unavailable');
  }
  assert.equal(warning.mock.callCount(), 0);
});
