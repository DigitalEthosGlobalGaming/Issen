import { bindWaveFeedback } from '../../../src/presentation/wave-feedback.ts';
import { createWaveLifecycle } from '../../../src/game/phases/waves.ts';
import { waveConfig } from '../../../src/game/encounters/configuration.ts';

/** Narrow test-owned feedback/service ports around the real wave lifecycle. */
export function waveLifecycleFixture(session, feedback = true) {
  const G = session.run,
    trace = [],
    pending = [];
  const views = {
    events: session.views.events,
    G,
    ST: session.views.ST,
    W: 200,
    H: 400,
    S: 1,
    combatRandom: session.random.next,
    renderLives() {
      trace.push('lives');
    },
    pop() {},
    setStage(stage) {
      G.stage = stage;
      trace.push(['stage', stage]);
    },
    bst: () => null,
    challenge() {},
    saveStats() {},
    checkUnlocks() {},
    startStandoff(wave, changed) {
      trace.push(['standoff', wave, changed]);
    },
    waveCfg: (wave) => waveConfig(wave, G.mode, G.m),
    waveConfiguration: () => G.cfg,
    banner(title, subtitle) {
      trace.push(['banner', title, subtitle]);
    },
    setWaveLabel(label) {
      trace.push(['label', label]);
    },
    sfx: {
      drum() {
        trace.push('drum');
      },
      step() {
        trace.push('step');
      },
    },
    hint() {},
    captureCheckpoint() {
      trace.push('checkpoint');
    },
    deferUntilSceneReady() {
      return false;
    },
    spawnEnemy(slot) {
      trace.push(['spawn', slot]);
    },
    lightningFx() {
      trace.push('lightning');
    },
    killEnemy(enemy, direction, chained, preserve) {
      trace.push(['kill', enemy, direction, chained, preserve]);
    },
    dust() {},
    earn(event) {
      trace.push(['earn', event]);
    },
    addScore(points) {
      G.score += points;
      trace.push(['score', points]);
      return points;
    },
  };
  const disposeFeedback = feedback ? bindWaveFeedback(views.events, () => views) : () => {};
  return { disposeFeedback, views, trace, pending, lifecycle: createWaveLifecycle(() => views) };
}
