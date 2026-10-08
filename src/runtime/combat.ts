import { createRuntimeRules } from './rules.ts';

import { createRuntimeUIBase } from '../runtime/ui-base.ts';

import { createRuntimePresentation } from '../runtime/presentation.ts';
import { createRuntimeFoundation } from '../runtime/foundation.ts';
import { stateView, cacheView } from '../game/session/state-view.ts';
import { createKillAppearance } from '../presentation/kill-appearance.ts';

import { saveWithFoxfire } from '../game/player/companions.ts';
import { createCombatScore } from '../game/progression/combat-score.ts';
import { createEnemyKill } from '../game/combat/kill.ts';

import type { GameContext } from '../game/session/context.ts';
import type { PresentationContext } from '../presentation/context.ts';

import { precisionZone } from '../game/progression/mastery.ts';

import type { Enemy } from '../game/combat/enemy.ts';
import type { Boss } from '../game/encounters/boss.ts';
import type { Direction } from '../shared/directions.ts';

import { bossPosition } from '../rendering/figures/boss-position.ts';
import { createGrunt as createEnemy } from '../game/combat/grunt-spawn.ts';
import { pickEnemyLook, orderedEnemies, selectAttacker } from '../game/combat/enemy-spawn.ts';
import { enemyPosition } from '../rendering/figures/enemy-position.ts';
import { advanceGrunts as simulateEnemies } from '../game/combat/grunt.ts';

import { startSwing } from '../game/player/player.ts';
import { comboMultiplier, scoreGain } from '../game/progression/scoring.ts';
import { modeKey as getModeKey } from '../game/progression/modes.ts';
import { waveConfig, bossParameters } from '../game/encounters/configuration.ts';

/** Compose combat/scoring, character positions and kill rules through explicit owners. */
export function createRuntimeCombat(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
  ui: ReturnType<typeof createRuntimeUIBase>,
  rules: ReturnType<typeof createRuntimeRules>,
  context: GameContext<PresentationContext>,
  readDamage: () => { playerDie: (killer: Enemy | Boss | null, reason: string) => void },
) {
  function foxSave(e: Enemy) {
    saveWithFoxfire(e, { events: context.events, killEnemy });
  }
  const pz = () =>
    precisionZone(
      foundation.view.PZ,
      foundation.run.G.m?.pz ?? 0,
      foundation.run.G.m?.precision ?? 0,
    );
  function pickLook(n: number) {
    return pickEnemyLook(n, foundation.view.R);
  }
  function waveConfiguration() {
    if (!foundation.run.G.cfg) throw new Error('Encounter requires a wave configuration');
    return foundation.run.G.cfg;
  }
  const waveCfg = (w: number) => waveConfig(w, foundation.run.G.mode, foundation.run.G.m);
  const bossParams = (n: number) => bossParameters(n, foundation.run.G.mode, foundation.run.G.m);
  const comboMult = () => comboMultiplier(foundation.run.G.combo, foundation.run.G.m);
  const gain = (p: number) => scoreGain(p, foundation.run.G);
  const modeKey = () => getModeKey(foundation.run.G);
  const combatScore = createCombatScore(() => ({
    G: foundation.run.G,
    events: context.events,
    activeTrial: foundation.run.activity.activeTrial,
    get trialFailure() {
      return foundation.run.activity.trialFailure;
    },
    set trialFailure(value) {
      foundation.run.activity.trialFailure = value;
    },
  }));
  function bumpCombo() {
    combatScore.bumpCombo();
  }
  function addScore(pts: number, x: number, y: number, label?: string, size?: number) {
    return combatScore.addScore(pts, x, y, label, size);
  }
  function enemyPos(e: Enemy) {
    return enemyPosition(
      e,
      foundation.view.geometry.L,
      foundation.view.geometry.W,
      foundation.view.geometry.H,
    );
  }
  function spawnEnemy(slot: number, attract = false) {
    if (foundation.run.activity.activeTrial && !attract && foundation.run.G.toSpawn <= 0) return;
    return createEnemy(
      foundation.run.G,
      slot,
      attract,
      enemyPos,
      attract ? foundation.view.R : foundation.run.activity.combatRandom,
    );
  }
  function liveOrdered() {
    return orderedEnemies(foundation.run.G.enemies);
  }
  function pickAttacker() {
    return selectAttacker(
      foundation.run.G.enemies,
      waveConfiguration().ordered,
      foundation.run.activity.combatRandom,
    );
  }
  function updateEnemies(dt: number, raw = dt) {
    simulateEnemies(foundation.run.G, dt, {
      rawDelta: raw,
      surge: foundation.run.WX.surge,
      time: foundation.view.presentationState.time,
      perfectZone: pz,
      events: context.events,
      pet: foundation.profile.profileEquipment.EQ.pet,
      foxSave,
      playerDie: readDamage().playerDie,
      position: enemyPos,
    });
  }
  const killAppearance = createKillAppearance(() => ({
    R: foundation.view.R,
    bonk: !!foundation.run.G.m.bonk,
    fxId: foundation.profile.profileEquipment.EQ.fx,
    accessible: foundation.browser.accessible,
    presentationState: foundation.view.presentationState,
  }));
  const readKillViews = cacheView(() =>
    stateView(
      foundation.run.activity,
      ['combatRandom', 'activeTrial', 'trialFailure'],
      stateView(
        foundation.run.sessionState,
        ['hitStop'],
        stateView(
          foundation.view.geometry,
          ['S', 'W', 'H'],
          stateView(foundation.profile.profileFoundation, ['ST'], {
            events: context.events,
            G: foundation.run.G,
            pz,
            enemyPos,
            waveConfiguration,
            earn: rules.earn,
            sfx: foundation.browser.sfx,
            addScore,
            comboMult,
            bst: rules.bst,
            challenge: rules.challenge,
            bumpCombo,
            addSlash: presentation.addSlash,
            killFx: presentation.killFx,
            scraps: presentation.scraps,
            ring: presentation.ring,
            swingPlayer,
            combatHaptics: foundation.browser.combatHaptics,
            renderLives: ui.renderLives,
            pop: presentation.pop,
            hud: ui.hud,
            setScore: ui.setScore,
            stamp: presentation.stamp,
            letterbox: presentation.letterbox,
            punch: presentation.punch,
            flash: presentation.flash,
            gustLeaves: presentation.gustLeaves,
            notifications: ui.notifications,
            hideHint: ui.hideHint,
            liveOrdered,
            checkUnlocks: rules.checkUnlocks,
            deathAppearance: killAppearance.deathAppearance,
            disarm: killAppearance.disarm,
            coin: killAppearance.coin,
            stain: killAppearance.stain,
            shake: killAppearance.shake,
          }),
        ),
      ),
    ),
  );
  const killRules = createEnemyKill(readKillViews);
  function killEnemy(
    e: Enemy,
    dir: Direction,
    chained = false,
    preserveStreak = false,
    automatic = false,
  ) {
    killRules.killEnemy(e, dir, chained, preserveStreak, automatic);
  }
  function swingPlayer(dir: Direction | 'block', perfect = false) {
    if (
      foundation.profile.profileEquipment.EQ.blade === 'koken' &&
      foundation.run.G.state !== 'title'
    )
      foundation.browser.sfx.hum();
    startSwing(foundation.run.P, dir);
    foundation.view.apparelMotion.kick(dir, foundation.browser.reducedMotion(), perfect);
  }
  function bossPos(b: Boss) {
    return bossPosition(b, foundation.view.geometry.L);
  }
  function bossTipWorld(b: Boss): [number, number] {
    const tp = presentation.tipOf(b.pose, b.lean, b.def.spear ? 0.98 : 0.52);
    return [b.pos.x + tp[0] * b.pos.h, b.pos.y + tp[1] * b.pos.h];
  }
  function breakCombo() {
    combatScore.breakCombo();
  }
  return {
    foxSave,
    pz,
    pickLook,
    waveConfiguration,
    waveCfg,
    bossParams,
    comboMult,
    gain,
    modeKey,
    combatScore,
    bumpCombo,
    addScore,
    enemyPos,
    spawnEnemy,
    liveOrdered,
    pickAttacker,
    updateEnemies,
    killAppearance,
    readKillViews,
    killRules,
    killEnemy,
    swingPlayer,
    bossPos,
    bossTipWorld,
    breakCombo,
  };
}
