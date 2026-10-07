import { createDeathPhase } from '../../../src/game/phases/death.ts';
import { standoffPhaseFixture } from './runtime-standoff-phase.mjs';
export function deathPhaseFixture(session) {
  const base = standoffPhaseFixture(session),
    trace = base.trace,
    G = session.run;
  const views = {
    ...base.views,
    L: { player: { x: 100, y: 200, h: 150 } },
    timeScale: 1,
    activeTrial: null,
    trialFailure: '',
    rewardFlowBusy: false,
    sfx: { hurt() {}, death() {} },
    renderLives() {},
    hud() {},
    clearHints() {},
    clearLetterbox() {},
    inkPulse() {},
    shake() {},
    hideBossBar() {},
    reasonMessage: () => 'A mistake',
    pop() {},
    inkBurst() {},
    setScore() {},
    breakCombo() {
      G.combo = 0;
    },
    resetPlayer() {
      trace.push('resetPlayer');
    },
    fallPlayer(fall) {
      trace.push(['fall', fall]);
    },
    captureCheckpoint(status) {
      trace.push(['checkpoint', status]);
    },
    startWave(wave, skip) {
      G.state = 'playing';
      trace.push(['wave', wave, skip]);
    },
    startBoss() {
      G.state = 'boss';
      G.bossCount++;
      trace.push('boss');
    },
    showOver() {
      G.state = 'over';
      trace.push('over');
    },
    waveConfiguration: () => G.cfg,
    killEnemy(enemy) {
      enemy.state = 'dying';
      trace.push(['kill', enemy]);
    },
    bossSwipe(direction, automatic) {
      trace.push(['bossSwipe', direction, automatic]);
    },
  };
  return { views, trace, phase: createDeathPhase(() => views) };
}
