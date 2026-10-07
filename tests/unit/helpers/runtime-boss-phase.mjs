import { createBossPhase } from '../../../src/game/phases/boss.ts';
import { standoffPhaseFixture } from './runtime-standoff-phase.mjs';

export function bossPhaseFixture(session) {
  const base = standoffPhaseFixture(session),
    { G } = base.views,
    trace = base.trace;
  const views = {
    ...base.views,
    bossPos: () => ({ x: 100, y: 200, h: 150, fog: 0, alpha: 1 }),
    bossTipWorld: (boss) => [boss.pos.x, boss.pos.y - boss.pos.h],
    activeTrial: null,
    activeDaily: null,
    runBossMilestone: 0,
    pop() {},
    renderHp() {},
    renderLives() {},
    setScore() {},
    guided: {
      startBoss() {
        return false;
      },
      bossFlash() {},
      bossParried() {},
    },
    notifications: { activeHint: null },
    hideHint() {},
    shake() {},
    buzz() {},
    sparks() {},
    inkBurst() {},
    bossStain() {},
    setBossLabels() {},
    showBossBar(shown) {
      trace.push(['bossBar', shown]);
    },
    bst: () => null,
    breakCombo() {
      G.combo = 0;
      trace.push('broken');
    },
    sfx: {
      ...base.views.sfx,
      feint() {},
      clang() {},
      block() {},
      slice() {},
      bossDie() {},
      caw() {},
      deflect() {},
    },
  };
  return { session, views, trace, phase: createBossPhase((ctx) => ctx, views) };
}
