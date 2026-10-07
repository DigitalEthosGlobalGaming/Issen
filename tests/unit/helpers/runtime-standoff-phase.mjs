import { createStandoffPhase } from '../../../src/game/phases/standoff.ts';
import { waveConfig } from '../../../src/game/encounters/configuration.ts';
import { makeFig, EPOSE } from '../../../src/shared/figure-model.ts';
import { scoreGain, comboMultiplier } from '../../../src/game/progression/scoring.ts';

export function standoffPhaseFixture(session) {
  const G = session.run,
    trace = [];
  const views = {
    events: session.views.events,
    G,
    ST: session.views.ST,
    EQ: session.views.EQ,
    W: 200,
    H: 400,
    S: 1,
    L: { boss: { x: 100, y: 200, h: 150 } },
    combatRandom: session.random.next,
    waveCfg: (wave) => waveConfig(wave, G.mode, G.m),
    deferUntilSceneReady: () => false,
    enemyPos: (enemy) => ({ ...enemy.fixed, alpha: 1 }),
    pickLook: () => null,
    makeFigure: makeFig,
    guardPose: EPOSE.guard,
    accessible: () => false,
    hitStop: 0,
    banner() {},
    setWaveLabel() {},
    letterbox() {},
    hint() {},
    captureCheckpoint() {
      trace.push('checkpoint');
    },
    startWave(wave, skip) {
      trace.push(['wave', wave, skip]);
    },
    clearLetterbox() {
      trace.push('clearLetterbox');
    },
    sfx: {
      drum() {},
      step() {},
      glint() {
        trace.push('draw');
      },
      perfect() {},
      whoosh() {},
    },
    playerDie(enemy, reason) {
      G.state = 'dead';
      trace.push(['die', enemy, reason]);
    },
    flash() {},
    swingPlayer(direction) {
      trace.push(['swing', direction]);
    },
    addSlash() {},
    killFx() {},
    scraps() {},
    ring() {},
    stamp() {},
    punch() {},
    combatHaptics: { play() {} },
    bumpCombo() {},
    challenge() {},
    earn(event) {
      trace.push(['earn', event]);
    },
    addScore(points) {
      const gain = scoreGain(points, G);
      G.score += gain;
      return gain;
    },
    comboMult: () => comboMultiplier(G.combo, G.m),
    saveStats() {},
    checkUnlocks() {},
  };
  return { views, trace, phase: createStandoffPhase((ctx) => ctx, views) };
}
