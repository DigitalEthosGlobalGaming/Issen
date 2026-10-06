// Navigation-relative readiness and explicit decode-method events, test builds only.
export function initLoadingProbe() {
  const realm = globalThis;
  if (realm.__loadingProbe) return realm.__loadingProbe;
  const scenes = [],
    phases = [],
    decodes = [];
  let scene,
    presentation,
    submittedStage = null,
    phase,
    firstCompleteTitleMs = null;
  const now = () => performance.now();
  const probe = (realm.__loadingProbe = {
    readyPhases: {},
    get firstCompleteTitleMs() {
      return firstCompleteTitleMs;
    },
    get submittedStage() {
      return submittedStage;
    },
    beginScene(stage) {
      if (scene) scene.cancelled = true;
      if (presentation) presentation.cancelledBeforeSubmission = true;
      presentation = undefined;
      submittedStage = null;
      scene = {
        stage,
        requestedMs: now(),
        readyMs: null,
        latencyMs: null,
        submittedMs: null,
        submissionLatencyMs: null,
        cancelled: false,
      };
      scenes.push(scene);
    },
    sceneReady() {
      if (!scene) return;
      scene.readyMs = now();
      scene.latencyMs = scene.readyMs - scene.requestedMs;
      presentation = scene;
      scene = undefined;
    },
    beginPhase(name) {
      phase = { name, requestedMs: now(), readyMs: null, latencyMs: null };
      phases.push(phase);
    },
    frame(state, ready, uiReady = true) {
      if (!ready) return;
      if (presentation) {
        presentation.submittedMs = now();
        presentation.submissionLatencyMs = presentation.submittedMs - presentation.requestedMs;
        submittedStage = presentation.stage;
        presentation = undefined;
      }
      if (state === 'title' && uiReady && firstCompleteTitleMs === null)
        firstCompleteTitleMs = now();
      if (phase?.name === 'combat' && ['playing', 'boss'].includes(state)) probe.phaseReady();
    },
    previewFrame(id, ready) {
      if (id !== 'prevC' || !ready) return;
      if (
        ['inspection', 'inactive-inspection'].includes(phase?.name) &&
        !document.querySelector('.arm-inspection[open]')
      )
        return;
      if (['armoury', 'inspection', 'inactive-inspection'].includes(phase?.name))
        probe.phaseReady();
    },
    phaseReady() {
      if (phase) {
        phase.readyMs = now();
        probe.readyPhases[phase.name] = phase.readyMs;
        phase.latencyMs = phase.readyMs - phase.requestedMs;
        phase = undefined;
      }
    },
    snapshot: () => ({
      firstCompleteTitleMs,
      scenes: scenes.map((value) => ({ ...value })),
      phases: phases.map((value) => ({ ...value })),
      explicitImageDecodes: decodes.length,
      decodeMethodElapsedMs: decodes.reduce((sum, value) => sum + value.elapsedMs, 0),
      decodes: [...decodes],
    }),
  });
  if (realm.HTMLImageElement?.prototype.decode) {
    const native = realm.HTMLImageElement.prototype.decode;
    realm.HTMLImageElement.prototype.decode = function (...args) {
      const started = now(),
        source = this.src;
      return native.apply(this, args).then(
        (value) => {
          decodes.push({ source, elapsedMs: now() - started, ok: true });
          return value;
        },
        (error) => {
          decodes.push({ source, elapsedMs: now() - started, ok: false });
          throw error;
        },
      );
    };
  }
  return probe;
}
