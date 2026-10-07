import { createCombatScore } from '../../../src/game/progression/combat-score.ts';
import { createEventBus } from '../../../src/game/events.ts';
import { bindCombatProgression } from '../../../src/game/progression/combat-listeners.ts';
import { createEnemyKill } from '../../../src/game/combat/kill.ts';
import { scoreGain, comboMultiplier } from '../../../src/game/progression/scoring.ts';
import { accrueRunReward } from '../../../src/game/progression/run-rewards.ts';
import { orderedEnemies } from '../../../src/game/combat/enemy-spawn.ts';

export function enemyKillFixture(session) {
  const G = session.run,
    trace = [];
  const events = createEventBus();
  const views = {
    events,
    G,
    ST: session.views.ST,
    activeTrial: null,
    trialFailure: '',
    combatRandom: session.random.next,
    W: 200,
    H: 400,
    S: 1,
    hitStop: 0,
    pz: () => 0.78,
    enemyPos: (enemy) => enemy.pos,
    waveConfiguration: () => G.cfg,
    earn: (event) => accrueRunReward(session.views.rewardLedger, event),
    addScore(points, x, y, label) {
      return score.addScore(points, x, y, label);
    },
    comboMult: () => comboMultiplier(G.combo, G.m),
    bst: () => null,
    challenge() {},
    bumpCombo() {
      G.maxCombo = Math.max(G.maxCombo, G.combo);
    },
    addSlash() {},
    killFx() {},
    scraps() {},
    ring() {},
    swingPlayer() {},
    combatHaptics: { play() {} },
    renderLives() {},
    pop() {},
    hud() {},
    setScore() {},
    stamp() {},
    letterbox() {},
    punch() {},
    flash() {},
    gustLeaves() {},
    notifications: { activeHint: null },
    hideHint() {},
    liveOrdered: () => orderedEnemies(G.enemies),
    checkUnlocks() {},
    deathAppearance: () => ({ deathType: 'split', fallDir: 1 }),
    disarm() {},
    coin() {},
    stain() {},
    shake() {},
    sfx: { coin() {}, bonk() {}, slice() {}, perfect() {}, chime() {}, drum() {} },
  };
  const score = createCombatScore(() => views);
  const dispose = bindCombatProgression(events, () => views);
  return { views, trace, events, dispose, rules: createEnemyKill(() => views) };
}
