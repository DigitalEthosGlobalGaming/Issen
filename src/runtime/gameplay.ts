import { createRuntimeSceneCoordination } from './scene.ts';
import { createRuntimeCombat } from './combat.ts';
import { createRuntimeRules } from './rules.ts';
import { bindRuntimeReactions } from './reactions.ts';
import { createRuntimeUIBase } from '../runtime/ui-base.ts';
import { createRuntimeSession } from '../runtime/session.ts';
import { createRuntimePhases } from '../runtime/phases.ts';

import { createRuntimePresentation } from '../runtime/presentation.ts';
import { createRuntimeFoundation } from '../runtime/foundation.ts';

import { createMenuBindings, type MenuBindingViews } from '../ui/wiring/menu-bindings.ts';

import { createPhaseRouter, definePhase } from '../game/session/phase-router.ts';

import { createEventBus, type GameEvents } from '../game/events.ts';
import type { GameContext } from '../game/session/context.ts';
import type { PresentationContext } from '../presentation/context.ts';
import { recordDailyLogin, SEVEN_DAWNS_CREST } from '../game/progression/daily-login.ts';

import { type PendingSupportReward } from '../platform/pending-support.ts';

import { premium } from '../platform/purchases.ts';

import { testerPremiumActive } from '../platform/tester-premium.ts';

import type { Enemy } from '../game/combat/enemy.ts';
import type { Boss } from '../game/encounters/boss.ts';
import type { Direction } from '../shared/directions.ts';

import { store, isTestProfile } from '../platform/storage.ts';
import { STAGES } from '../game/content/stages.ts';

import type { createFrameLoop } from '../platform/frame-loop.ts';
type MenuPorts = Pick<MenuBindingViews, 'refreshArmoryNew'> &
  Pick<ReturnType<typeof createMenuBindings>, 'openPanel' | 'setBestLine'>;
/** Own gameplay context, controllers, combat/scene coordination and event subscriptions. */
export function createRuntimeGameplay(
  foundation: ReturnType<typeof createRuntimeFoundation>,
  presentation: ReturnType<typeof createRuntimePresentation>,
  ui: ReturnType<typeof createRuntimeUIBase>,
  readMenus: () => MenuPorts,
  readClock: () => Pick<ReturnType<typeof createFrameLoop>, 'resetClock'>,
) {
  function reviveDaruma(ph = false, support = false) {
    deathPhase.reviveDaruma(ph, support);
  }
  const context: GameContext<PresentationContext> = {
    run: {
      state: foundation.run.G,
      get random() {
        return foundation.run.activity.runRandom;
      },
      set random(value) {
        foundation.run.activity.runRandom = value;
        foundation.run.activity.combatRandom = value.next;
      },
      get equipment() {
        return foundation.profile.profileEquipment.EQ;
      },
      set equipment(value) {
        foundation.profile.profileEquipment.EQ = value;
      },
      setup: foundation.profile.SETUP,
      get trial() {
        return foundation.run.activity.activeTrial;
      },
      set trial(value) {
        foundation.run.activity.activeTrial = value;
      },
      get daily() {
        return foundation.run.activity.activeDaily;
      },
      set daily(value) {
        foundation.run.activity.activeDaily = value;
      },
    },
    services: {
      audio: foundation.browser.audio,
      storage: store,
      settings: foundation.browser.settings,
      notify: ui.toast,
    },
    presentation: {
      random: foundation.view.R,
      effects: () => presentation.effectSpawner(),
      layout: () => foundation.view.geometry.L,
      viewport: () => ({
        width: foundation.view.geometry.W,
        height: foundation.view.geometry.H,
        dpr: foundation.view.geometry.DPR,
        scale: foundation.view.geometry.S,
      }),
      environment: presentation.environmentState,
      state: foundation.view.presentationState,
      camera: foundation.view.presentationState,
    },
    events: createEventBus<GameEvents>(),
  };
  foundation.lifecycle.add(context.events.clear);
  const rules = createRuntimeRules(foundation, readMenus);

  const combat = createRuntimeCombat(foundation, presentation, ui, rules, context, () => ({
    playerDie,
  }));

  const scene = createRuntimeSceneCoordination(foundation, presentation, ui, combat, readClock);

  const sessionBindings = createRuntimeSession(foundation, presentation, context, () => ({
    get resultsSession() {
      return resultsSession;
    },
    get phaseRouter() {
      return phaseRouter;
    },
    get bossPos() {
      return combat.bossPos;
    },
    get computeMods() {
      return rules.computeMods;
    },
    get enemyPos() {
      return combat.enemyPos;
    },
    get hud() {
      return ui.hud;
    },
    get renderHp() {
      return ui.renderHp;
    },
    get renderLives() {
      return ui.renderLives;
    },
    get setScore() {
      return ui.setScore;
    },
    get setStage() {
      return scene.setStage;
    },
    get toast() {
      return ui.toast;
    },
    get updateSavedRunButtons() {
      return ui.updateSavedRunButtons;
    },
    get showScreen() {
      return ui.showScreen;
    },
    get showShrineOffers() {
      return ui.showShrineOffers;
    },
    get showOver() {
      return showOver;
    },
    get frameLoop() {
      return readClock();
    },
    get checkUnlocks() {
      return rules.checkUnlocks;
    },
    get clearHints() {
      return ui.clearHints;
    },
    get hint() {
      return ui.hint;
    },
    get prepareScene() {
      return scene.prepareScene;
    },
    get startTrialEncounter() {
      return startTrialEncounter;
    },
    get startWave() {
      return startWave;
    },
    get startBoss() {
      return startBoss;
    },
    get waveCfg() {
      return combat.waveCfg;
    },
    get deferUntilSceneReady() {
      return scene.deferUntilSceneReady;
    },
    get banner() {
      return ui.banner;
    },
    get renderTrialObjective() {
      return ui.renderTrialObjective;
    },
    get toTitle() {
      return toTitle;
    },
    get openPanel() {
      return readMenus().openPanel;
    },
    get rewardScreen() {
      return ui.rewardScreen;
    },
    get supportPremium() {
      return supportPremium;
    },
    get rewardSupport() {
      return ui.rewardSupport;
    },
    get captureCheckpoint() {
      return captureCheckpoint;
    },
    get reviveDaruma() {
      return reviveDaruma;
    },
    get finishTrial() {
      return finishTrial;
    },
    get challenge() {
      return rules.challenge;
    },
    get runResults() {
      return ui.runResults;
    },
    get setBestLine() {
      return readMenus().setBestLine;
    },
    get modeKey() {
      return combat.modeKey;
    },
    get refreshArmoryNew() {
      return readMenus().refreshArmoryNew;
    },
    get setupAttract() {
      return scene.setupAttract;
    },
    get showPauseScreen() {
      return ui.showPauseScreen;
    },
  }));
  const { captureCheckpoint, restoreCheckpoint, continueSavedRun, abandonSavedRun } =
    sessionBindings.checkpoint();

  const { startRun, startDaily, startTrial, nextStep, startRushDuel } = sessionBindings.runStart();
  const trialSession = sessionBindings.trial();
  function startTrialEncounter() {
    trialSession.startTrialEncounter();
  }
  function finishTrial(message?: string) {
    trialSession.finishTrial(message);
  }
  const {
    waveLifecycle,
    wavesPhase,
    bossPhase,
    standoffPhase,
    shrinePhase,
    deathPhase,
    betweenPhase,
  } = createRuntimePhases(foundation, context, () => ({
    get setStage() {
      return scene.setStage;
    },
    get checkUnlocks() {
      return rules.checkUnlocks;
    },
    get startStandoff() {
      return startStandoff;
    },
    get waveCfg() {
      return combat.waveCfg;
    },
    get waveConfiguration() {
      return combat.waveConfiguration;
    },
    get captureCheckpoint() {
      return captureCheckpoint;
    },
    get deferUntilSceneReady() {
      return scene.deferUntilSceneReady;
    },
    get spawnEnemy() {
      return combat.spawnEnemy;
    },
    get killEnemy() {
      return combat.killEnemy;
    },
    get earn() {
      return rules.earn;
    },
    get addScore() {
      return combat.addScore;
    },
    get swingPlayer() {
      return combat.swingPlayer;
    },
    get playerDie() {
      return playerDie;
    },
    get enemyPos() {
      return combat.enemyPos;
    },
    get comboMult() {
      return combat.comboMult;
    },
    get bossPos() {
      return combat.bossPos;
    },
    get breakCombo() {
      return combat.breakCombo;
    },
    get bossTipWorld() {
      return combat.bossTipWorld;
    },
    get bumpCombo() {
      return combat.bumpCombo;
    },
    get pickLook() {
      return combat.pickLook;
    },
    get startWave() {
      return startWave;
    },
    get nextStep() {
      return nextStep;
    },
    get computeMods() {
      return rules.computeMods;
    },
    get startBoss() {
      return startBoss;
    },
    get bossSwipe() {
      return bossSwipe;
    },
    get showOver() {
      return showOver;
    },
    get finishTrial() {
      return finishTrial;
    },
    get startTrialEncounter() {
      return startTrialEncounter;
    },
    get openShrine() {
      return openShrine;
    },
  }));
  function startWave(n: number, skipEvent = false) {
    waveLifecycle.startWave(n, skipEvent);
  }
  function updateWave(dt: number) {
    waveLifecycle.updateWave(dt);
  }

  bindRuntimeReactions(foundation, presentation, ui, context.events, {
    bst: rules.bst,
    challenge: rules.challenge,
    checkUnlocks: rules.checkUnlocks,
    readKillViews: combat.readKillViews,
  });

  function onSwipe(dir: Direction) {
    if (foundation.run.sceneState.sceneLoading) return;
    if (
      foundation.browser.guided.swipe(
        dir,
        foundation.run.G.state === 'playing' && combat.waveConfiguration().ordered
          ? (combat.liveOrdered()[0]?.dir ?? null)
          : null,
      )
    )
      return;
    phaseRouter.onSwipe(dir);
  }
  function startBoss() {
    bossPhase.startBoss();
  }
  function updateBoss(dt: number, raw = dt) {
    bossPhase.updateBoss(dt, raw);
  }
  function bossSwipe(dir: Direction, automatic = false) {
    bossPhase.bossSwipe(dir, automatic);
  }

  function onTapDown() {
    if (foundation.run.sceneState.sceneLoading) return false;
    // Finger-down begins a possible swipe. Consume taps on release during cut
    // practice so the pointer adapter can still recognize the teaching gesture.
    if (foundation.browser.guided.phase === 'order-practice') return false;
    if (foundation.browser.guided.tap()) return true;
    return phaseRouter.onTapDown();
  }
  function onTap() {
    if (foundation.run.sceneState.sceneLoading) return;
    if (foundation.browser.guided.tap()) return;
    phaseRouter.onTap();
  }
  function startStandoff(n: number, changed: boolean) {
    standoffPhase.startStandoff(n, changed);
  }
  function updateStandoff(dt: number) {
    standoffPhase.update(context, dt);
  }
  function standoffSwipe(dir: Direction) {
    standoffPhase.onSwipe(context, dir);
  }

  function applyPick(id: string) {
    shrinePhase.applyPick(id);
  }
  function openShrine() {
    shrinePhase.openShrine();
  }
  function playerDie(killer: Enemy | Boss | null, reason: string) {
    deathPhase.playerDie(killer, reason);
  }
  function finishDaily() {
    resultsSession.finishDaily();
  }
  const resultsSession = sessionBindings.results();
  const supportPremium = () =>
    premium.state.owned ||
    foundation.browser.edition === 'premium' ||
    testerPremiumActive(foundation.browser.browserPreferences.testerPremium);
  function showOver() {
    resultsSession.showOver();
  }
  async function claimEmberBonus(pending: PendingSupportReward) {
    return resultsSession.claimEmberBonus(pending);
  }
  function recoverSupportReward() {
    resultsSession.recoverSupportReward();
  }
  const { toTitle, pause, resume, endRun } = sessionBindings.runFlow();
  function testJump(stage: number, wave: number, boss: boolean) {
    if (!isTestProfile()) return;
    foundation.profile.SETUP.mode = 'waves';
    startRun();
    foundation.run.G.enemies = [];
    foundation.run.G.pendingSpawns = [];
    foundation.run.G.attacker = null;
    foundation.run.G.boss = null;
    foundation.run.G.so = null;
    foundation.run.G.toSpawn = 0;
    foundation.run.G.pausedFrom = null;
    const ordinal = Math.max(0, Math.min(STAGES.length - 1, Math.floor(stage)));
    foundation.run.G.bossCount = ordinal;
    if (boss) {
      foundation.run.G.wave = ordinal * 3 + 3;
      scene.setStage(ordinal, true);
      foundation.run.G.cfg = combat.waveCfg(foundation.run.G.wave);
      startBoss();
    } else startWave(ordinal * 3 + Math.max(1, Math.min(3, Math.floor(wave))), true);
    foundation.run.G.panel = null;
    ui.showScreen(null);
  }
  const phaseRouter = createPhaseRouter(
    context,
    {
      read: () => foundation.run.G.state,
      write: (state) => {
        foundation.run.G.state = state;
      },
      changed: (from, to) => context.events.emit('phaseChanged', { from, to }),
    },
    {
      title: definePhase({}),
      playing: wavesPhase,
      boss: bossPhase,
      between: betweenPhase,
      standoff: standoffPhase,
      shrine: shrinePhase,
      dead: deathPhase,
      over: definePhase({}),
      paused: definePhase({}),
    },
  );

  function visitToday() {
    const next = recordDailyLogin(foundation.profile.DAILY_LOGIN);
    if (!store.set('issen.dailyLogin', next)) return;
    Object.assign(foundation.profile.DAILY_LOGIN, next);
    if (!next.earned) return;
    const newlyOwned = !foundation.profile.UNL.has(SEVEN_DAWNS_CREST);
    foundation.profile.UNL.add(SEVEN_DAWNS_CREST);
    store.set('issen.unlocks', [...foundation.profile.UNL]);
    if (newlyOwned && !foundation.run.sessionState.loginCrestRevealed) {
      foundation.run.sessionState.loginCrestRevealed = true;
      ui.toast({ k: '暁', msg: 'Unlocked: Seven Dawns crest' });
      readMenus().refreshArmoryNew();
    }
  }
  return {
    earn: rules.earn,
    buildWeather: scene.buildWeather,
    setStage: scene.setStage,
    foxSave: combat.foxSave,
    reviveDaruma,
    context,
    profileRules: rules.profileRules,
    activeEquipment: rules.activeEquipment,
    powersEnabled: rules.powersEnabled,
    isSp: rules.isSp,
    isSteelThird: rules.isSteelThird,
    isRobeSp: rules.isRobeSp,
    challenge: rules.challenge,
    bladeMods: rules.bladeMods,
    bst: rules.bst,
    computeMods: rules.computeMods,
    pz: combat.pz,
    pickLook: combat.pickLook,
    waveConfiguration: combat.waveConfiguration,
    waveCfg: combat.waveCfg,
    bossParams: combat.bossParams,
    comboMult: combat.comboMult,
    gain: combat.gain,
    modeKey: combat.modeKey,
    combatScore: combat.combatScore,
    bumpCombo: combat.bumpCombo,
    sceneFlow: scene.sceneFlow,
    prepareScene: scene.prepareScene,
    deferUntilSceneReady: scene.deferUntilSceneReady,
    checkUnlocks: rules.checkUnlocks,
    sessionBindings,
    captureCheckpoint,
    restoreCheckpoint,
    continueSavedRun,
    abandonSavedRun,
    addScore: combat.addScore,
    enemyPos: combat.enemyPos,
    spawnEnemy: combat.spawnEnemy,
    setupAttract: scene.setupAttract,
    liveOrdered: combat.liveOrdered,
    pickAttacker: combat.pickAttacker,
    updateEnemies: combat.updateEnemies,
    startRun,
    startDaily,
    startTrial,
    nextStep,
    startRushDuel,
    trialSession,
    startTrialEncounter,
    finishTrial,
    waveLifecycle,
    wavesPhase,
    bossPhase,
    standoffPhase,
    shrinePhase,
    deathPhase,
    betweenPhase,
    startWave,
    updateWave,
    killAppearance: combat.killAppearance,
    readKillViews: combat.readKillViews,
    killRules: combat.killRules,
    killEnemy: combat.killEnemy,
    swingPlayer: combat.swingPlayer,
    onSwipe,
    startBoss,
    updateBoss,
    bossSwipe,
    bossPos: combat.bossPos,
    bossTipWorld: combat.bossTipWorld,
    onTapDown,
    onTap,
    startStandoff,
    updateStandoff,
    standoffSwipe,
    breakCombo: combat.breakCombo,
    applyPick,
    openShrine,
    playerDie,
    finishDaily,
    resultsSession,
    supportPremium,
    showOver,
    claimEmberBonus,
    recoverSupportReward,
    toTitle,
    pause,
    resume,
    endRun,
    testJump,
    phaseRouter,
    settlePresentedScene: scene.settlePresentedScene,
    visitToday,
  };
}
