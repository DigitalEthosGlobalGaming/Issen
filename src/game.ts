import { createRuntimeFoundation } from './runtime/foundation.ts';
import { createSealPresentation } from './presentation/seal.ts';
import { createStageState } from './presentation/stage-state.ts';
import { createPresentationGeometry } from './presentation/geometry.ts';
import { createSceneState } from './game/session/scene-state.ts';
import { createRuntimePreferences } from './platform/runtime-preferences.ts';
import { createRuntimeAudio } from './ui/wiring/audio.ts';
import { createRuntimeSessionState } from './game/session/runtime-state.ts';
import { stateView, cacheView } from './game/session/state-view.ts';
import type { PhaseBindingViews } from './game/session/phase-bindings.ts';
import { startRuntime } from './game/session/startup.ts';
import { createFrameBindings } from './game/session/frame-bindings.ts';
import { bindStandoffFeedback } from './presentation/standoff-feedback.ts';
import { createKillAppearance } from './presentation/kill-appearance.ts';
import { createViewport } from './presentation/viewport.ts';
import { bindGraphicsLifecycle } from './presentation/graphics-lifecycle.ts';
import { createRunActivity } from './game/session/activity.ts';
import { createSessionBindings, type SessionBindingViews } from './game/session/session-bindings.ts';
import { createMenuBindings, type MenuBindingViews } from './ui/wiring/menu-bindings.ts';
import { createPhaseBindings } from './game/session/phase-bindings.ts';
import { bindBossFeedback } from './presentation/boss-feedback.ts';
import { createFiguresHost } from './presentation/figures-host.ts';
import { bossShownDirection } from './game/encounters/boss-openings.ts';
import { createProfileFoundation, createProfileProgress, createProfileEquipment } from './game/progression/profile-state.ts';
import { createEnvironmentHost } from './presentation/environment-host.ts';

import { createEquipmentPresentation } from './presentation/equipment.ts';
import { createNativeServices, type PreparedLighting } from './presentation/native-services.ts';
import { bindDamageFeedback } from './presentation/damage-feedback.ts';
import { bindDuelFeedback } from './presentation/duel-feedback.ts';
import { bindEncounterProgression } from './game/progression/encounter-listeners.ts';
import { createSceneFlow } from './game/session/scene-flow.ts';
import { createProfileRules } from './game/progression/profile-rules.ts';
import { createActiveEquipment } from './game/equipment/active.ts';

import { visiblePet, saveWithFoxfire } from './game/player/companions.ts';
import { createCombatScore } from './game/progression/combat-score.ts';
import { bindCombatScoreFeedback } from './presentation/combat-score.ts';
import { bindKillFeedback } from './presentation/kill.ts';
import { bindCombatProgression } from './game/progression/combat-listeners.ts';
import { createEnemyKill } from './game/combat/kill.ts';
import { createPhaseRouter, definePhase } from './game/session/phase-router.ts';

import { bindProfileWiring } from './ui/wiring/profile.ts';

import { bindPurchaseWiring } from './ui/wiring/purchases.ts';
import { createInputWiring } from './ui/wiring/input.ts';

import { createTitleSecrets } from './ui/wiring/secrets.ts';

import { createPresentationState } from './presentation/state.ts';
import { createPostArtwork } from './presentation/post-artwork.ts';

import { createFeedbackPresentation } from './presentation/feedback.ts';

import { createEventBus, type GameEvents } from './game/events.ts';
import type { GameContext } from './game/session/context.ts';
import type { PresentationContext } from './presentation/context.ts';

import { recordDailyLogin, SEVEN_DAWNS_CREST } from './game/progression/daily-login.ts';

import { syncCollectionProgress } from './game/progression/collection-progress.ts';
import { type PendingSupportReward } from './platform/pending-support.ts';
import { createRewardedSupport } from './platform/rewarded-support.ts';
import { createRewardScreen } from './ui/screens/rewarded-support.ts';
import { setSealTextures } from './rendering/ui-art.ts';

import { createStageVisitSeeds } from './rendering/environment/stage-variation.ts';
import { compositionKey } from './rendering/environment/worker-types.ts';

import { premium } from './platform/purchases.ts';
import { SUPPORTER_FILM_ITEM } from './game/content/items.ts';
import { type GameEdition } from './platform/editions.ts';
import { precisionZone } from './game/progression/mastery.ts';
import { PREMIUM_FILM } from './platform/premium.ts';
import { testerPremiumActive } from './platform/tester-premium.ts';

import type { Item, ItemCategory } from './game/content/items.ts';
import type { Enemy } from './game/combat/enemy.ts';
import type { Boss } from './game/encounters/boss.ts';

import type { Direction } from './shared/directions.ts';

import { createLifecycle } from './platform/lifecycle.ts';

import { createRuntimeScreens } from './ui/wiring/screens.ts';
import { createRunState } from './game/run-state.ts';
import type { PreviewFrame } from './rendering/armory-preview.ts';
import { createArmoryPreview } from './rendering/armory-preview.ts';
import { activeNow, pageActive } from './platform/activity.ts';
import { createSecondaryMotion } from './rendering/figures/secondary-motion.ts';

import {
  appendGameOverUnlocks,
  renderGameOver,
  ITEM_TYPE_LABEL as TYPE_WORD,
} from './ui/screens/game-over.ts';
import { createRunResults } from './ui/screens/run-results.ts';
import type { ResultReveal } from './ui/screens/run-results.ts';

import { recordSecretEvent } from './game/progression/secret-events.ts';

import { bossPosition } from './rendering/figures/boss-position.ts';

import { createGrunt as createEnemy } from './game/combat/grunt-spawn.ts';
import { pickEnemyLook, orderedEnemies, selectAttacker } from './game/combat/enemy-spawn.ts';
import { enemyPosition } from './rendering/figures/enemy-position.ts';
import { advanceGrunts as simulateEnemies } from './game/combat/grunt.ts';

import { createWeatherState } from './rendering/scene/weather-state.ts';

import { REST_POSE as PREST, createPlayerAnimation, startSwing } from './game/player/player.ts';
import { comboMultiplier, scoreGain } from './game/progression/scoring.ts';

import { createEffectQuality } from './rendering/effects/quality.ts';
import { BOSS_SHADOW_DURATION } from './rendering/figures/death.ts';

import { renderShrine } from './ui/screens/shrine.ts';
import { createNotifications } from './ui/notifications.ts';
import { modeKey as getModeKey } from './game/progression/modes.ts';

import { makeFig, EPOSE } from './shared/figure-model.ts';

import type { createBackground } from './rendering/scene/background.ts';
import { createPalette } from './rendering/palette.ts';
import { waveConfig, bossParameters } from './game/encounters/configuration.ts';

import { createLayout } from './rendering/layout.ts';

import type { BladeStats } from './game/progression/statistics.ts';

import { BLESS, BLESS_BY } from './game/content/blessings.ts';
import { loadStatistics, loadSetup, loadUnlocks, loadEquipment } from './platform/saves.ts';
import { createItems } from './game/content/items.ts';

import { renderPauseBlessings } from './ui/screens/pause.ts';
import { itemPresentation } from './ui/screens/item-presentation.ts';

import { DEATH_REASONS } from './ui/screens/game-over.ts';

import { store, isTestProfile } from './platform/storage.ts';
import { STAGES } from './game/content/stages.ts';

import { rng, newRunSeed } from './shared/random.ts';
import {
  readRunCheckpoint,
  writeRunCheckpoint,
  clearRunCheckpoint,
} from './platform/run-checkpoint.ts';

export function startGame(
  surfaces: ReadonlyMap<string, import('./rendering/scene-surface.ts').SceneSurface>,
  lighting?: PreparedLighting,
): () => void {
  const foundation = createRuntimeFoundation(surfaces, lighting, { edition: import.meta.env.VITE_GAME_EDITION as GameEdition, saveSettings: () => saveSettings() });

  ('use strict');

   // perfect-cut zone starts at this fraction of the attack ring

  /* ---------------- stages ---------------- */
  /* ---------------- layout ---------------- */

  /* ---------------- colours ---------------- */

  /* ---------------- armory data ---------------- */

  const equipmentPresentation = createEquipmentPresentation(() => (stateView(foundation.view.sealState, ["SEAL"], stateView(foundation.profile.profileEquipment, ["EQ"], {
    $: foundation.browser.$,
    robePal: foundation.view.robePal,
    isRobeSp,
    isSteelThird,
    isSp,
    lightingRig: foundation.browser.lightingRig,
    presentationState: foundation.view.presentationState,
    density: foundation.browser.density,
    reducedMotion: foundation.browser.reducedMotion,
    reducedFlashes: foundation.browser.reducedFlashes,
    G: foundation.run.G,
    cols: foundation.view.cols,
    environmentState,
    P: foundation.run.P,
    petOf,
    FONT: foundation.view.FONT
  }))));
  const { CHARMCOL } = equipmentPresentation;

  /* ---------------- persistent stats & unlocks ---------------- */

  function updateSavedRunButtons() {
    const available = foundation.run.sessionState.savedRun?.status === 'active';
    foundation.browser.$('bContinue').hidden = !available;
    foundation.browser.$('bAbandon').hidden = !available;
    foundation.browser.$('bPlay').textContent = available ? 'Start new run' : 'Draw your blade';
    for (const id of ['bArmory', 'bStats', 'bTemplate', 'bSupport', 'bTrials'])
      (foundation.browser.$(id) as HTMLButtonElement).disabled = available;
    foundation.browser.$('tSeed').textContent = available
      ? foundation.run.sessionState.savedRun!.dailyDay
        ? `Daily · ${foundation.run.sessionState.savedRun!.dailyDay}`
        : `Saved run · seed ${foundation.run.sessionState.savedRun!.seed}`
      : '';
  }
  function earn(event: 'kill' | 'wave' | 'boss') { return profileRules.earn(event); }

  /* ---------------- background ---------------- */

  const { environmentState, driftRenderer, buildBG, buildMist, buildGrass, newLeaf, buildLeaves, gustLeaves, buildWeatherArtwork, rebalanceWeather, ambient, blades, drawLeaves, weatherRenderer, drawWeather, drawSmoke, updateAmbient, updateTransition } = createEnvironmentHost(foundation.browser.cvs.ownerDocument, foundation.lifecycle, () => (stateView(foundation.view.geometry, ["W","H","DPR","S","L"], {
    G: foundation.run.G,
    R: foundation.view.R,
    density: foundation.browser.density,
    context2d: foundation.browser.context2d,
    activeTrial: foundation.run.activity.activeTrial,
    reducedMotion: foundation.browser.reducedMotion,
    g: foundation.browser.g,
    presentationState: foundation.view.presentationState,
    cinematic,
    WX: foundation.run.WX
  })));
  function buildWeather(resetSimulation = true) {
    buildWeatherArtwork();
    if (resetSimulation) Object.assign(foundation.run.WX, createWeatherState(foundation.run.activity.combatRandom));
  }
  const postArtwork = createPostArtwork(foundation.browser.cvs.ownerDocument, () => (stateView(foundation.view.geometry, ["W","H"], {
    R: foundation.view.R,
    mainG: foundation.browser.mainG,
    context2d: foundation.browser.context2d
  })));
  const { buildPost } = postArtwork;

  function setStage(si: number, anim: boolean) {
    foundation.view.stageState.stageSeed = foundation.view.stageVisits.enter(si);
    if (anim && environmentState.bg) {
      environmentState.prevBg = environmentState.bg;
      environmentState.stageFade = 1;
    }
    foundation.run.G.stage = si;
    buildLeaves();
    foundation.view.geometry.MIST = STAGES[si]!.fog;
    foundation.view.palette.clearFog();
    buildBG();
    buildMist();
    buildGrass();
    buildWeather();
    prepareScene();
  }
  /* ---------------- figures ---------------- */
  const { figureRenderer, drawFigure, drawSplit, drawPetAt, drawSword, drawGlint, tipOf, drawEnemy, drawBoss, playerFigures, drawEnso, drawGlyphs } = createFiguresHost(() => (stateView(foundation.view.sealState, ["SEAL","SEALARC"], stateView(foundation.profile.profileEquipment, ["EQ"], stateView(foundation.view.geometry, ["W","H","L"], {
    g: foundation.browser.g,
    inkCharm: foundation.browser.inkCharm,
    inkCompanion: foundation.browser.inkCompanion,
    inkEnemy: foundation.browser.inkEnemy,
    inkPlayer: foundation.browser.inkPlayer,
    inkSword: foundation.browser.inkSword,
    presentationState: foundation.view.presentationState,
    G: foundation.run.G,
    cols: foundation.view.cols,
    R: foundation.view.R,
    density: foundation.browser.density,
    reducedMotion: foundation.browser.reducedMotion,
    reducedFlashes: foundation.browser.reducedFlashes,
    robePal: foundation.view.robePal,
    accessible: foundation.browser.accessible,
    FONT: foundation.view.FONT,
    P: foundation.run.P,
    apparelMotion: foundation.view.apparelMotion,
    playerRobePalette,
    isRobeSp,
    bladeStyle,
    CHARMCOL,
    petOf,
    pz,
    waveConfiguration,
    liveOrdered,
    WX: foundation.run.WX
  })))));
  function petOf() {
    return visiblePet(foundation.profile.profileEquipment.EQ);
  }
  function drawFoxfire() { playerFigures.drawFoxfire(); }
  function foxSave(e: Enemy) {
    saveWithFoxfire(e, { events: context.events, killEnemy });
  }
  function reviveDaruma(ph = false, support = false) {
    deathPhase.reviveDaruma(ph, support);
  }
  function drawPet() { playerFigures.drawPet(); }
  /* ---------------- ensō glyph ---------------- */
  /* ---------------- audio ---------------- */

  /* ---------------- game state ---------------- */

  // Transitional adapters preserve closure ownership while consumers migrate to slices.
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
    services: { audio: foundation.browser.audio, storage: store, settings: foundation.browser.settings, notify: toast },
    presentation: {
      random: foundation.view.R,
      effects: () => effectSpawner(),
      layout: () => foundation.view.geometry.L,
      viewport: () => ({ width: foundation.view.geometry.W, height: foundation.view.geometry.H, dpr: foundation.view.geometry.DPR, scale: foundation.view.geometry.S }),
      environment: environmentState,
      state: foundation.view.presentationState,
      camera: foundation.view.presentationState,
    },
    events: createEventBus<GameEvents>(),
  };
  foundation.lifecycle.add(context.events.clear);
  const profileRules = createProfileRules(() => (stateView(foundation.run.activity, ["activeTrial", "activeDaily"], stateView(foundation.run.sessionState, ["rewardLedger", "runItemReveals"], stateView(foundation.profile.profileFoundation, ["ST"], {
    G: foundation.run.G,
    AWAKENING: foundation.profile.AWAKENING,
    META: foundation.profile.META,
    saveAwakening: foundation.profile.saveAwakening,
    UNL: foundation.profile.UNL,
    ITEMS: foundation.profile.ITEMS,
    ITEM_BY: foundation.profile.ITEM_BY,
    revoked: foundation.profile.revoked,
    COLLECTION_PROGRESS: foundation.profile.COLLECTION_PROGRESS,
    accessible: foundation.browser.accessible,
    refreshArmoryNew,
    store,
    itemPresentation,
    TYPE_WORD
  })))));
  const activeEquipment = createActiveEquipment(() => (stateView(foundation.run.activity, ["activeTrial"], stateView(foundation.run.sessionState, ["runTemplate"], stateView(foundation.profile.profileEquipment, ["EQ"], {
    G: foundation.run.G,
    SETUP: foundation.profile.SETUP,
    META: foundation.profile.META,
    UNL: foundation.profile.UNL,
    ITEM_BY: foundation.profile.ITEM_BY,
    accessible: foundation.browser.accessible
  })))));
  function powersEnabled() { return activeEquipment.powersEnabled(); }
  function isSp() { return activeEquipment.isSp(); }
  function isSteelThird() { return activeEquipment.isSteelThird(); }
  function isRobeSp() { return activeEquipment.isRobeSp(); }
  function playerRobePalette() { return equipmentPresentation.playerRobePalette(); }
  function challenge(metric: keyof BladeStats, value = 1) { return profileRules.challenge(metric, value); }
  function bladeMods() { return activeEquipment.bladeMods(); }
  function bladeStyle() { return equipmentPresentation.bladeStyle(); }
  function bst() { return profileRules.bst(); }
  function computeMods() { return activeEquipment.computeMods(); }
  const pz = () => precisionZone(foundation.view.PZ, foundation.run.G.m?.pz ?? 0, foundation.run.G.m?.precision ?? 0);
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

  const { hudView, screenAnimation, showScreen, renderLives, hud, setScore, banner, renderHp } =
    createRuntimeScreens(foundation.browser.$('app'), activeNow, () => ({
      G: foundation.run.G,
      activeDaily: !!foundation.run.activity.activeDaily,
      syncCollections: foundation.profile.syncCollections,
    }));
  let artworkReady = false;

  const sceneFlow = createSceneFlow(() => (stateView(foundation.run.sceneState, ["requestedSceneKey","sceneRequest","requestedSceneIdentity","sceneContinuation","sceneLoading","sceneReadyToPresent"], stateView(foundation.view.geometry, ["W","H","DPR"], stateView(foundation.view.stageState, ["stageSeed"], {
    presentationState: foundation.view.presentationState,
    G: foundation.run.G,
    reducedMotion: foundation.browser.reducedMotion,
    reducedFlashes: foundation.browser.reducedFlashes,
    density: foundation.browser.density,
    activeTrial: foundation.run.activity.activeTrial,
    environmentState,
    compositionKey,
    cvs: foundation.browser.cvs,
    screenAnimation,
    demonRealmRenderer: foundation.browser.demonRealmRenderer,
    environmentRenderer: foundation.browser.environmentRenderer,
    lifecycle: foundation.lifecycle,
    frameLoop
  })))));
  function prepareScene() { return sceneFlow.prepareScene(); }
  function deferUntilSceneReady(action: () => void) { return sceneFlow.deferUntilSceneReady(action); }
  const notifications = createNotifications(foundation.browser.$('hint'), foundation.browser.$('toast'), () => foundation.browser.sfx.unlock());
  const runResults = createRunResults(foundation.browser.$('over'), () => foundation.browser.sfx.reveal(), foundation.browser.reducedMotion);
  function hint(key: string, text: string, dur = 3500) {
    if (foundation.run.activity.activeTrial || foundation.run.activity.activeDaily) return;
    if (foundation.run.G.hints[key]) return;
    foundation.run.G.hints[key] = 1;
    store.set('issen.hints', foundation.run.G.hints);
    notifications.hint(key, text, dur || 3500);
  }
  const hideHint = notifications.hideHint,
    clearHints = notifications.clearHints;
  function toast(it: { k: string; msg?: string; n?: string; type?: ItemCategory }) {
    notifications.toast({
      k: it.k,
      msg: it.msg || 'Unlocked: ' + it.n + ' ' + (it.type ? TYPE_WORD[it.type] : ''),
    });
  }
  function checkUnlocks() { return profileRules.checkUnlocks(); }
  const {
    flash,
    letterbox,
    punch,
    weatherBurst,
    killFx,
    updateFx,
    pop,
    stamp,
    effectSpawner,
    addSlash,
    inkBurst,
    scraps,
    ring,
    sparks,
    dust,
    effectRenderer,
    drawFx,
    drawFx2,
    drawStains,
    drawPops,
    drawStamps,
  } = createFeedbackPresentation(() => (stateView(foundation.view.sealState, ["SEAL"], stateView(foundation.view.geometry, ["S","W","H","portrait"], {
    g: foundation.browser.g,
    fx: foundation.view.presentationState.fx,
    time: foundation.view.presentationState.time,
    FONT: foundation.view.FONT,
    mistSprite: environmentState.mistSprite,
    R: foundation.view.R,
    density: foundation.browser.density,
    sfx: foundation.browser.sfx,
    state: foundation.view.presentationState,
    reducedFlashes: foundation.browser.reducedFlashes,
    reducedMotion: foundation.browser.reducedMotion,
    weather: STAGES[foundation.run.G.stage]!.weather,
    newLeaf,
    leaves: environmentState.leaves,
    killEffect: () => (foundation.browser.accessible(foundation.profile.profileEquipment.EQ.fx) ? foundation.profile.profileEquipment.EQ.fx : 'ink'),
    clink: () => foundation.browser.sfx.clink()
  }))));
  const sessionBindings: ReturnType<typeof createSessionBindings<typeof PREST, ResultReveal>> = createSessionBindings<typeof PREST, ResultReveal>(() => (stateView(foundation.run.activity, ["activeTrial", "activeDaily", "runRandom", "combatRandom", "runTrialsWasUnlocked", "trialFailure", "trialResult"], stateView(foundation.run.sessionState, ["rewardLedger", "runBossMilestone", "runTemplate", "savedRun", "shrineOfferIds", "runItemReveals", "timeScale", "hitStop", "rewardFlowBusy"], stateView(foundation.view.stageState, ["stageSeed"], stateView(foundation.profile.profileFoundation, ["ST"], stateView(foundation.profile.profileEquipment, ["EQ"], stateView(foundation.run.sceneState, ["sceneLoading","sceneContinuation"], {
    get adoptPhase(): SessionBindingViews<typeof PREST, ResultReveal>['adoptPhase'] { return () => phaseRouter.adoptCheckpoint(); },
    get discardSceneContinuation(): SessionBindingViews<typeof PREST, ResultReveal>['discardSceneContinuation'] { return () => { foundation.run.sceneState.sceneContinuation = undefined; }; },
    get $() { return foundation.browser.$; },
    get AWAKENING() { return foundation.profile.AWAKENING; },
    get COLLECTION_PROGRESS() { return foundation.profile.COLLECTION_PROGRESS; },
    get G() { return foundation.run.G; },
    get META() { return foundation.profile.META; },
    get SETUP() { return foundation.profile.SETUP; },
    get UNL() { return foundation.profile.UNL; },
    get WX() { return foundation.run.WX; },
    get DAILY_LOGIN() { return foundation.profile.DAILY_LOGIN; },
    get ITEMS() { return foundation.profile.ITEMS; },
    get accessibleUnlocks() { return foundation.profile.accessibleUnlocks; },
    get applySeal() { return foundation.view.applySeal; },
    get bossPos() { return bossPos; },
    get computeMods() { return computeMods; },
    get enemyPos() { return enemyPos; },
    get hud() { return hud; },
    get playerEquipment() { return foundation.profile.playerEquipment; },
    get playerStats() { return foundation.profile.playerStats; },
    get premiumAccess() { return foundation.browser.premiumAccess; },
    get renderHp() { return renderHp; },
    get renderLives() { return renderLives; },
    get saveAwakening() { return foundation.profile.saveAwakening; },
    get saveMeta() { return foundation.profile.saveMeta; },
    get saveStats() { return foundation.profile.saveStats; },
    get saveCollections() { return foundation.profile.saveCollections; },
    get setScore() { return setScore; },
    get setStage() { return setStage; },
    get syncCollections() { return foundation.profile.syncCollections; },
    get toast() { return toast; },
    get updateSavedRunButtons() { return updateSavedRunButtons; },
    get showScreen() { return showScreen; },
    get showShrineOffers() { return showShrineOffers; },
    get showOver() { return showOver; },
    get persistence(): SessionBindingViews<typeof PREST, ResultReveal>['persistence'] { return {
        read: readRunCheckpoint,
        write: writeRunCheckpoint,
        clear: clearRunCheckpoint,
      }; },
    get storage(): SessionBindingViews<typeof PREST, ResultReveal>['storage'] { return store; },
    get resetClock(): SessionBindingViews<typeof PREST, ResultReveal>['resetClock'] { return () => frameLoop.resetClock(); },
    get events(): SessionBindingViews<typeof PREST, ResultReveal>['events'] { return context.events; },
    get P() { return foundation.run.P; },
    get PREST() { return PREST; },
    get apparelMotion() { return foundation.view.apparelMotion; },
    get audio() { return foundation.browser.audio; },
    get checkUnlocks() { return checkUnlocks; },
    get clearHints() { return clearHints; },
    get guided() { return foundation.browser.guided; },
    get hint() { return hint; },
    get prepareScene() { return prepareScene; },
    get presentationState() { return foundation.view.presentationState; },
    get stageVisits() { return foundation.view.stageVisits; },
    get startTrialEncounter() { return startTrialEncounter; },
    get startWave() { return startWave; },
    get startBoss() { return startBoss; },
    get audioInit() { return foundation.browser.audioInit; },
    get buildLeaves() { return buildLeaves; },
    get waveCfg() { return waveCfg; },
    get clearTrialResult(): SessionBindingViews<typeof PREST, ResultReveal>['clearTrialResult'] { return () => {
      foundation.run.activity.trialResult = null;
    }; },
    get clearCheckpoint(): SessionBindingViews<typeof PREST, ResultReveal>['clearCheckpoint'] { return clearRunCheckpoint; },
    get newRunSeed() { return newRunSeed; },
    get resetWeather(): SessionBindingViews<typeof PREST, ResultReveal>['resetWeather'] { return (random) => {
      Object.assign(foundation.run.WX, createWeatherState(random));
    }; },
    get clearEffects(): SessionBindingViews<typeof PREST, ResultReveal>['clearEffects'] { return () => {
      for (const [key, particles] of Object.entries(foundation.view.presentationState.fx))
        if (key !== 'scratches') particles.length = 0;
    }; },
    get TRIAL_PROGRESS() { return foundation.profile.TRIAL_PROGRESS; },
    get R() { return foundation.view.R; },
    get deferUntilSceneReady() { return deferUntilSceneReady; },
    get banner() { return banner; },
    get setWaveLabel(): SessionBindingViews<typeof PREST, ResultReveal>['setWaveLabel'] { return (label) => {
      foundation.browser.$('waveLbl').textContent = label;
    }; },
    get renderTrialObjective() { return renderTrialObjective; },
    get store() { return store; },
    get sfx() { return foundation.browser.sfx; },
    get hideTrialObjective(): SessionBindingViews<typeof PREST, ResultReveal>['hideTrialObjective'] { return () => {
      foundation.browser.$('trialObjective').hidden = true;
    }; },
    get toTitle() { return toTitle; },
    get openPanel() { return openPanel; },
    get focusTrialResult(): SessionBindingViews<typeof PREST, ResultReveal>['focusTrialResult'] { return () => {
      foundation.browser.$('trials')
        .querySelector<HTMLButtonElement>('#trialResult button')
        ?.focus({ preventScroll: true });
    }; },
    get rewardScreen() { return rewardScreen; },
    get supportPremium() { return supportPremium; },
    get testerPremium() { return foundation.browser.browserPreferences.testerPremium; },
    get lifecycle() { return foundation.lifecycle; },
    get rewardSupport() { return rewardSupport; },
    get captureCheckpoint() { return captureCheckpoint; },
    get reviveDaruma() { return reviveDaruma; },
    get finishTrial() { return finishTrial; },
    get challenge() { return challenge; },
    get runResults() { return runResults; },
    get setBestLine(): SessionBindingViews<typeof PREST, ResultReveal>['setBestLine'] { return () => setBestLine(); },
    get modeKey() { return modeKey; },
    get clearRunCheckpoint() { return clearRunCheckpoint; },
    get renderGameOver() { return renderGameOver; },
    get refreshArmoryNew() { return refreshArmoryNew; },
    get setupAttract() { return setupAttract; },
    get showPauseScreen() { return showPauseScreen; },
    get contextLost() {
      return !!foundation.browser.nativeScene?.contextLost;
    }
  }))))))));
  const { captureCheckpoint, restoreCheckpoint, continueSavedRun, abandonSavedRun } = sessionBindings.checkpoint();
  function addScore(pts: number, x: number, y: number, label?: string, size?: number) {
    return combatScore.addScore(pts, x, y, label, size);
  }
  /* ---------------- enemies ---------------- */
  function enemyPos(e: Enemy) {
    return enemyPosition(e, foundation.view.geometry.L, foundation.view.geometry.W, foundation.view.geometry.H);
  }
  function spawnEnemy(slot: number, attract = false) {
    if (foundation.run.activity.activeTrial && !attract && foundation.run.G.toSpawn <= 0) return;
    return createEnemy(foundation.run.G, slot, attract, enemyPos, attract ? foundation.view.R : foundation.run.activity.combatRandom);
  }
  function setupAttract() {
    if (deferUntilSceneReady(setupAttract)) return;
    foundation.run.G.enemies = [];
    foundation.run.G.cfg = null;
    foundation.run.G.boss = null;
    foundation.run.G.attacker = null;
    for (let i = 0; i < 5; i++) spawnEnemy(i, true);
  }
  function liveOrdered() {
    return orderedEnemies(foundation.run.G.enemies);
  }
  function pickAttacker() {
    return selectAttacker(foundation.run.G.enemies, waveConfiguration().ordered, foundation.run.activity.combatRandom);
  }
  function updateEnemies(dt: number, raw = dt) {
    simulateEnemies(foundation.run.G, dt, {
      rawDelta: raw,
      surge: foundation.run.WX.surge,
      time: foundation.view.presentationState.time,
      perfectZone: pz,
      sounds: foundation.browser.sfx,
      pet: foundation.profile.profileEquipment.EQ.pet,
      foxSave,
      playerDie,
      position: enemyPos,
    });
  }
  const { startRun, startDaily, startTrial, nextStep, startRushDuel } = sessionBindings.runStart();
  const trialSession = sessionBindings.trial();
  function startTrialEncounter() {
    trialSession.startTrialEncounter();
  }
  function finishTrial(message?: string) {
    trialSession.finishTrial(message);
  }
  function renderTrialObjective() {
    const trial = foundation.run.activity.activeTrial;
    const visible = !!trial && ['playing', 'boss', 'between'].includes(foundation.run.G.state);
    foundation.browser.$('trialObjective').hidden = !visible;
    if (!trial || !visible) return;
    foundation.browser.$('trialObjective').textContent =
      trial.duelMaster && foundation.run.G.boss
        ? `Duel Master · ${20 - foundation.run.G.boss.hp}/20 exchanges · No mistakes`
        : trial.wave
          ? `${trial.name} · ${trial.waveCount ? `Wave ${foundation.run.G.wave}/${trial.waveCount} · ` : ''}${foundation.run.G.kills}/${trial.wave.total} cuts${trial.wave.perfects ? ` · ${foundation.run.G.perfects}/${trial.wave.perfects} perfect` : ''} · ${trial.mirrored ? 'Cut opposite' : 'No mistakes'}`
          : `${trial.name} · ${foundation.run.G.bossesSlain}/${trial.bosses!.length} duels · ${trial.cleanOpenings ? 'No hits or missed openings' : 'No hits'}`;
  }
    const { waveLifecycle, wavesPhase, bossPhase, standoffPhase, shrinePhase, deathPhase, betweenPhase } = createPhaseBindings(cacheView(() => (stateView(foundation.run.activity, ["combatRandom", "activeTrial", "activeDaily", "trialFailure"], stateView(foundation.run.sessionState, ["hitStop", "runBossMilestone", "shrineOfferIds", "timeScale", "rewardFlowBusy"], stateView(foundation.profile.profileEquipment, ["EQ"], stateView(foundation.view.geometry, ["W","H","S","L"], stateView(foundation.profile.profileFoundation, ["ST"], {
    events: context.events,
    G: foundation.run.G,
    renderLives,
    pop,
    setStage,
    bst,
    challenge,
    saveStats: foundation.profile.saveStats,
    checkUnlocks,
    startStandoff,
    waveCfg,
    waveConfiguration,
    banner,
    setWaveLabel: (label) => {
      foundation.browser.$('waveLbl').textContent = label;
    },
    sfx: foundation.browser.sfx,
    hint,
    captureCheckpoint,
    deferUntilSceneReady,
    spawnEnemy,
    lightningFx: (p) =>
      effectSpawner().killFx('bolt', p.x, p.y - p.h * 0.55, -Math.PI / 2, p.h / 160),
    killEnemy,
    dust,
    earn,
    addScore,
    orderSucceeded: () => foundation.browser.guided.orderSucceeded(),
    swingPlayer,
    playerDie,
    enemyPos,
    comboMult,
    sparks,
    buzz: foundation.browser.buzz,
    hud,
    knifeTrail(pos) {
        foundation.view.presentationState.fx.knives.push({
          x0: foundation.view.geometry.L.player.x,
          y0: foundation.view.geometry.L.player.y - foundation.view.geometry.L.player.h * 0.55,
          x1: pos.x,
          y1: pos.y - pos.h * 0.55,
          t: 0,
          life: 0.18,
        });
      },
    bossPos,
    renderHp,
    guided: foundation.browser.guided,
    flash,
    breakCombo,
    setScore,
    bossTipWorld,
    ring,
    combatHaptics: foundation.browser.combatHaptics,
    letterbox,
    bumpCombo,
    notifications,
    hideHint,
    addSlash,
    killFx,
    scraps,
    stamp,
    punch,
    inkBurst,
    shake: (amount) => {
        foundation.view.presentationState.shake = Math.max(foundation.view.presentationState.shake, amount);
      },
    setBossLabels: (wave, glyph, name) => {
        foundation.browser.$('waveLbl').textContent = wave;
        foundation.browser.$('bossK').textContent = glyph;
        foundation.browser.$('bossN').textContent = name;
      },
    showBossBar: (shown) => {
        foundation.browser.$('bossbar').classList.toggle('on', shown);
      },
    bossStain: (p) => {
        foundation.view.presentationState.fx.stains.push({
          x: p.x,
          y: p.y + p.h * 0.01,
          rx: p.h * 0.3,
          t: 0,
          life: BOSS_SHADOW_DURATION,
        });
      },
    pickLook,
    startWave,
    accessible: foundation.browser.accessible,
    makeFigure: makeFig,
    guardPose: EPOSE.guard,
    clearLetterbox: () => {
        foundation.view.presentationState.lbT = 0;
      },
    toast,
    nextStep,
    showShrineOffers,
    premiumAccess: foundation.browser.premiumAccess,
    computeMods,
    showScreen,
    resetKnocks: () => {
      foundation.run.sessionState.knocks = 0;
    },
    startBoss,
    bossSwipe,
    reasonMessage: (reason) => DEATH_REASONS[reason] || '',
    fallPlayer: (fall) => {
      foundation.run.P.fall = fall;
    },
    showOver,
    finishTrial,
    startTrialEncounter,
    openShrine
  } satisfies Omit<PhaseBindingViews, "hitStop" | "runBossMilestone" | "shrineOfferIds" | "timeScale" | "rewardFlowBusy" | "combatRandom" | "activeTrial" | "activeDaily" | "trialFailure" | "ST" | "W" | "H" | "S" | "L" | "EQ">))) satisfies Omit<PhaseBindingViews, "hitStop" | "runBossMilestone" | "shrineOfferIds" | "timeScale" | "rewardFlowBusy" | "combatRandom" | "activeTrial" | "activeDaily" | "trialFailure">)))), context);
  function startWave(n: number, skipEvent = false) {
    waveLifecycle.startWave(n, skipEvent);
  }
  function updateWave(dt: number) {
    waveLifecycle.updateWave(dt);
  }
  const killAppearance = createKillAppearance(() => ({ R: foundation.view.R, bonk: !!foundation.run.G.m.bonk, fxId: foundation.profile.profileEquipment.EQ.fx, accessible: foundation.browser.accessible, presentationState: foundation.view.presentationState }));
  const readKillViews = cacheView(() => (stateView(foundation.run.activity, ["combatRandom", "activeTrial", "trialFailure"], stateView(foundation.run.sessionState, ["hitStop"], stateView(foundation.view.geometry, ["S","W","H"], stateView(foundation.profile.profileFoundation, ["ST"], {
    events: context.events,
    G: foundation.run.G,
    pz,
    enemyPos,
    waveConfiguration,
    earn,
    sfx: foundation.browser.sfx,
    addScore,
    comboMult,
    bst,
    challenge,
    bumpCombo,
    addSlash,
    killFx,
    scraps,
    ring,
    swingPlayer,
    combatHaptics: foundation.browser.combatHaptics,
    renderLives,
    pop,
    hud,
    setScore,
    stamp,
    letterbox,
    punch,
    flash,
    gustLeaves,
    notifications,
    hideHint,
    liveOrdered,
    checkUnlocks,
    deathAppearance: killAppearance.deathAppearance,
    disarm: killAppearance.disarm,
    coin: killAppearance.coin,
    stain: killAppearance.stain,
    shake: killAppearance.shake
  }))))));
  const killRules = createEnemyKill(readKillViews);
  foundation.lifecycle.add(
    bindCombatProgression(context.events, () => ({ ST: foundation.profile.profileFoundation.ST, bst, challenge, checkUnlocks })),
  );
  foundation.lifecycle.add(bindEncounterProgression(context.events, () => ({ ST: foundation.profile.profileFoundation.ST, bst, challenge })));
  foundation.lifecycle.add(bindBossFeedback(context.events, () => ({
    W: foundation.view.geometry.W, H: foundation.view.geometry.H, S: foundation.view.geometry.S, addSlash, killFx, scraps, ring, flash, sfx: foundation.browser.sfx, combatHaptics: foundation.browser.combatHaptics,
    stamp, letterbox, punch, inkBurst,
    shake: amount => { foundation.view.presentationState.shake = Math.max(foundation.view.presentationState.shake, amount); },
    showBossBar: shown => { foundation.browser.$('bossbar').classList.toggle('on', shown); },
    bossStain: p => { foundation.view.presentationState.fx.stains.push({ x:p.x, y:p.y+p.h*0.01, rx:p.h*0.3, t:0, life:BOSS_SHADOW_DURATION }); },
  })));
  foundation.lifecycle.add(bindStandoffFeedback(context.events, () => ({ W: foundation.view.geometry.W, H: foundation.view.geometry.H, S: foundation.view.geometry.S, addSlash, killFx, scraps, ring, stamp, punch, flash, sfx: foundation.browser.sfx, combatHaptics: foundation.browser.combatHaptics })));
  foundation.lifecycle.add(bindDuelFeedback(context.events, () => ({
    S: foundation.view.geometry.S, sparks, ring, flash, sfx: foundation.browser.sfx, combatHaptics: foundation.browser.combatHaptics, letterbox, buzz: foundation.browser.buzz,
    shake: amount => { foundation.view.presentationState.shake = Math.max(foundation.view.presentationState.shake, amount); },
  })));
  foundation.lifecycle.add(bindDamageFeedback(context.events, () => ({
    W: foundation.view.geometry.W, H: foundation.view.geometry.H, S: foundation.view.geometry.S, addSlash, inkBurst, scraps, flash, pop, sfx: foundation.browser.sfx, combatHaptics: foundation.browser.combatHaptics,
    renderLives, setScore, hud, letterbox,
    inkPulse: value => { foundation.view.presentationState.inkPulse = value; },
    clearLetterbox: () => { foundation.view.presentationState.lbT = 0; },
    resetPlayer: () => { foundation.run.P.fall = 0; foundation.run.P.pose = { ...PREST }; },
    banner, stamp, clearHints,
    hideBossBar: () => { foundation.browser.$('bossbar').classList.remove('on'); },
    shake: amount => { foundation.view.presentationState.shake = Math.max(foundation.view.presentationState.shake, amount); },
  })));
  foundation.lifecycle.add(bindKillFeedback(context.events, readKillViews));
  foundation.lifecycle.add(bindCombatScoreFeedback(context.events, () => ({ setScore, pop, W: foundation.view.geometry.W, H: foundation.view.geometry.H })));
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
    if (foundation.profile.profileEquipment.EQ.blade === 'koken' && foundation.run.G.state !== 'title') foundation.browser.sfx.hum();
    startSwing(foundation.run.P, dir);
    foundation.view.apparelMotion.kick(dir, foundation.browser.reducedMotion(), perfect);
  }

  function onSwipe(dir: Direction) {
    if (foundation.run.sceneState.sceneLoading) return;
    if (
      foundation.browser.guided.swipe(
        dir,
        foundation.run.G.state === 'playing' && waveConfiguration().ordered
          ? (liveOrdered()[0]?.dir ?? null)
          : null,
      )
    )
      return;
    phaseRouter.onSwipe(dir);
  }

  /* ---------------- boss ---------------- */

  function startBoss() {
    bossPhase.startBoss();
  }
  function updateBoss(dt: number, raw = dt) {
    bossPhase.updateBoss(dt, raw);
  }
  function bossSwipe(dir: Direction, automatic = false) {
    bossPhase.bossSwipe(dir, automatic);
  }
  function bossPos(b: Boss) {
    return bossPosition(b, foundation.view.geometry.L);
  }
  function bossTipWorld(b: Boss): [number, number] {
    const tp = tipOf(b.pose, b.lean, b.def.spear ? 0.98 : 0.52);
    return [b.pos.x + tp[0] * b.pos.h, b.pos.y + tp[1] * b.pos.h];
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

  /* ---------------- standoff & shrine ---------------- */

  function startStandoff(n: number, changed: boolean) {
    standoffPhase.startStandoff(n, changed);
  }
  function updateStandoff(dt: number) {
    standoffPhase.update(context, dt);
  }
  function standoffSwipe(dir: Direction) {
    standoffPhase.onSwipe(context, dir);
  }

  foundation.lifecycle.listen(foundation.browser.$('shrineK'), 'click', () => {
    foundation.browser.audioInit();
    foundation.browser.sfx.knock();
    foundation.run.sessionState.knocks++;
    if (recordSecretEvent(foundation.profile.profileFoundation.ST, { kind: 'shrineKnocks', count: foundation.run.sessionState.knocks })) {
      foundation.profile.saveStats();
      foundation.browser.sfx.bell();
      checkUnlocks();
    }
  });
  function breakCombo() {
    combatScore.breakCombo();
  }

  function applyPick(id: string) {
    shrinePhase.applyPick(id);
  }
  foundation.lifecycle.listen(foundation.browser.$('oScore'), 'click', (e) => {
    e.stopPropagation();
    foundation.browser.audioInit();
    foundation.run.G.claps = (foundation.run.G.claps || 0) + 1;
    foundation.browser.tn({ f0: 700 + foundation.run.G.claps * 90, dur: 0.06, g: 0.05 });
    if (recordSecretEvent(foundation.profile.profileFoundation.ST, { kind: 'scoreClaps', count: foundation.run.G.claps })) {
      foundation.profile.saveStats();
      foundation.browser.sfx.popper();
      const previous = foundation.run.sessionState.runItemReveals.length;
      checkUnlocks();
      const newReveals = foundation.run.sessionState.runItemReveals.slice(previous);
      if (newReveals.length) {
        appendGameOverUnlocks(foundation.browser.$('over'), newReveals);
        foundation.run.G.overReady = false;
        foundation.browser.$('bAgain').disabled = true;
        runResults.startUnlocks(newReveals, () => {
          foundation.run.G.overReady = true;
          foundation.browser.$('bAgain').disabled = false;
        });
      }
    }
  });
  function openShrine() {
    shrinePhase.openShrine();
  }
  foundation.lifecycle.listen(foundation.browser.$('bRerollShrine'), 'click', () => shrinePhase.reroll());
  function showShrineOffers(opts: (typeof BLESS)[number][]) {
    (foundation.browser.$('bRerollShrine') as HTMLButtonElement).hidden = foundation.run.G.shrineRerolls < 1 || !foundation.browser.premiumAccess();
    renderShrine(foundation.browser.$('blessList'), opts, (bl) => {
      shrinePhase.pick(bl);
    });
    showScreen('shrine');
    foundation.browser.sfx.drum();
  }

  /* ---------------- death & menus ---------------- */

  function playerDie(killer: Enemy | Boss | null, reason: string) {
    deathPhase.playerDie(killer, reason);
  }
  function finishDaily() { resultsSession.finishDaily(); }
  const rewardSupport = createRewardedSupport();
  const rewardScreen = createRewardScreen(document.getElementById('app')!);
  foundation.lifecycle.add(rewardScreen.dispose);

  const resultsSession = sessionBindings.results();
  // Support benefits are independent of Web collection access.
  const supportPremium = () =>
    premium.state.owned || foundation.browser.edition === 'premium' || testerPremiumActive(foundation.browser.browserPreferences.testerPremium);
  function showOver() { resultsSession.showOver(); }
  async function claimEmberBonus(pending: PendingSupportReward) { return resultsSession.claimEmberBonus(pending); }
  function recoverSupportReward() { resultsSession.recoverSupportReward(); }
  const { toTitle, pause, resume, endRun } = sessionBindings.runFlow();
    const { setBestLine, openPanel, closePanel, renderStats, setupScreen, renderSetup, tutorial, launchTutorial, showAdmin, scrollMenus, applySettings, saveSettings, lightingDebug, options, armoryWiring, cinematicWiring } = createMenuBindings(() => (stateView(foundation.run.activity, ["trialResult"], stateView(foundation.run.sessionState, ["savedRun"], stateView(foundation.view.geometry, ["MIST"], stateView(foundation.view.stageState, ["stageSeed"], stateView(foundation.profile.profileFoundation, ["ST"], stateView(foundation.profile.profileEquipment, ["EQ"], {
    get $(): MenuBindingViews['$'] { return foundation.browser.$; },
    get playerStats(): MenuBindingViews['playerStats'] { return foundation.profile.playerStats; },
    get G(): MenuBindingViews['G'] { return foundation.run.G; },
    get hudView(): MenuBindingViews['hudView'] { return hudView; },
    get previewFrame(): MenuBindingViews['previewFrame'] { return previewFrame; },
    get testerPremium(): MenuBindingViews['testerPremium'] { return foundation.browser.browserPreferences.testerPremium; },
    get renderArmory(): MenuBindingViews['renderArmory'] { return renderArmory; },
    get META(): MenuBindingViews['META'] { return foundation.profile.META; },
    get saveMeta(): MenuBindingViews['saveMeta'] { return foundation.profile.saveMeta; },
    get premiumAccess(): MenuBindingViews['premiumAccess'] { return foundation.browser.premiumAccess; },
    get TRIAL_PROGRESS(): MenuBindingViews['TRIAL_PROGRESS'] { return foundation.profile.TRIAL_PROGRESS; },
    get startTrial(): MenuBindingViews['startTrial'] { return startTrial; },
    get showScreen(): MenuBindingViews['showScreen'] { return showScreen; },
    get UNL(): MenuBindingViews['UNL'] { return foundation.profile.UNL; },
    get ITEMS(): MenuBindingViews['ITEMS'] { return foundation.profile.ITEMS; },
    get clearTrialResult(): MenuBindingViews['clearTrialResult'] { return () => {
      foundation.run.activity.trialResult = null;
    }; },
    get SETUP(): MenuBindingViews['SETUP'] { return foundation.profile.SETUP; },
    get ITEM_BY(): MenuBindingViews['ITEM_BY'] { return foundation.profile.ITEM_BY; },
    get sfx(): MenuBindingViews['sfx'] { return foundation.browser.sfx; },
    get toTitle(): MenuBindingViews['toTitle'] { return toTitle; },
    get reducedMotion(): MenuBindingViews['reducedMotion'] { return foundation.browser.reducedMotion; },
    get AWAKENING(): MenuBindingViews['AWAKENING'] { return foundation.profile.AWAKENING; },
    get applySeal(): MenuBindingViews['applySeal'] { return foundation.view.applySeal; },
    get checkUnlocks(): MenuBindingViews['checkUnlocks'] { return checkUnlocks; },
    get computeMods(): MenuBindingViews['computeMods'] { return computeMods; },
    get hud(): MenuBindingViews['hud'] { return hud; },
    get playerEquipment(): MenuBindingViews['playerEquipment'] { return foundation.profile.playerEquipment; },
    get refreshArmoryNew(): MenuBindingViews['refreshArmoryNew'] { return refreshArmoryNew; },
    get renderLives(): MenuBindingViews['renderLives'] { return renderLives; },
    get revoked(): MenuBindingViews['revoked'] { return foundation.profile.revoked; },
    get saveAwakening(): MenuBindingViews['saveAwakening'] { return foundation.profile.saveAwakening; },
    get testJump(): MenuBindingViews['testJump'] { return testJump; },
    get toast(): MenuBindingViews['toast'] { return toast; },
    get setTrialsWasUnlocked(): MenuBindingViews['setTrialsWasUnlocked'] { return (value) => {
      foundation.run.activity.runTrialsWasUnlocked = value;
    }; },
    get cvs(): MenuBindingViews['cvs'] { return foundation.browser.cvs; },
    get screenAnimation(): MenuBindingViews['screenAnimation'] { return screenAnimation; },
    get lifecycle(): MenuBindingViews['lifecycle'] { return foundation.lifecycle; },
    get settings(): MenuBindingViews['settings'] { return foundation.browser.settings; },
    get reducedFlashes(): MenuBindingViews['reducedFlashes'] { return foundation.browser.reducedFlashes; },
    get prepareScene(): MenuBindingViews['prepareScene'] { return prepareScene; },
    get combatHaptics(): MenuBindingViews['combatHaptics'] { return foundation.browser.combatHaptics; },
    get audio(): MenuBindingViews['audio'] { return foundation.browser.audio; },
    get setMuteIcon(): MenuBindingViews['setMuteIcon'] { return foundation.browser.setMuteIcon; },
    get presentationState(): MenuBindingViews['presentationState'] { return foundation.view.presentationState; },
    get environmentState(): MenuBindingViews['environmentState'] { return environmentState; },
    get ambient(): MenuBindingViews['ambient'] { return ambient; },
    get rebalanceWeather(): MenuBindingViews['rebalanceWeather'] { return rebalanceWeather; },
    get lightingRig(): MenuBindingViews['lightingRig'] { return foundation.browser.lightingRig; },
    get audioInit(): MenuBindingViews['audioInit'] { return foundation.browser.audioInit; },
    get systemMotion(): MenuBindingViews['systemMotion'] { return foundation.browser.systemMotion; },
    get artworkReady() {
        return artworkReady;
      },
    get supportPreview() {
        return supportPreview;
      },
    get accessibleUnlocks(): MenuBindingViews['accessibleUnlocks'] { return foundation.profile.accessibleUnlocks; },
    get accessible(): MenuBindingViews['accessible'] { return foundation.browser.accessible; },
    get DAILY_LOGIN(): MenuBindingViews['DAILY_LOGIN'] { return foundation.profile.DAILY_LOGIN; },
    get COLLECTION_PROGRESS(): MenuBindingViews['COLLECTION_PROGRESS'] { return foundation.profile.COLLECTION_PROGRESS; },
    get ARMORY_SEEN(): MenuBindingViews['ARMORY_SEEN'] { return foundation.profile.ARMORY_SEEN; },
    get SEALS(): MenuBindingViews['SEALS'] { return foundation.view.SEALS; },
    get CHARMCOL(): MenuBindingViews['CHARMCOL'] { return CHARMCOL; },
    get demoKill(): MenuBindingViews['demoKill'] { return demoKill; },
    get previewVisits(): MenuBindingViews['previewVisits'] { return foundation.view.previewVisits; },
    get buildLeaves(): MenuBindingViews['buildLeaves'] { return buildLeaves; },
    get palette(): MenuBindingViews['palette'] { return foundation.view.palette; },
    get buildBG(): MenuBindingViews['buildBG'] { return buildBG; },
    get buildMist(): MenuBindingViews['buildMist'] { return buildMist; },
    get buildGrass(): MenuBindingViews['buildGrass'] { return buildGrass; },
    get buildWeather(): MenuBindingViews['buildWeather'] { return buildWeather; },
    get setupAttract(): MenuBindingViews['setupAttract'] { return setupAttract; },
    get saveStats(): MenuBindingViews['saveStats'] { return foundation.profile.saveStats; }
  }))))))));

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
      setStage(ordinal, true);
      foundation.run.G.cfg = waveCfg(foundation.run.G.wave);
      startBoss();
    } else startWave(ordinal * 3 + Math.max(1, Math.min(3, Math.floor(wave))), true);
    foundation.run.G.panel = null;
    showScreen(null);
  }

  const { PRESETS, presetScreen, armory, equipArmory, renderArmory } = armoryWiring;
  function refreshArmoryNew() {
    armoryWiring.refreshArmoryNew();
  }

  const { cinematic, sceneFilm, previewStage } = cinematicWiring;
  const { titleTap, konamiInput, bindTitleGestures } = createTitleSecrets(() => ({
    G: foundation.run.G,
    ST: foundation.profile.profileFoundation.ST,
    UNL: foundation.profile.UNL,
    audioInit: foundation.browser.audioInit,
    tn: foundation.browser.tn,
    sfx: foundation.browser.sfx,
    flash,
    saveStats: foundation.profile.saveStats,
    checkUnlocks,
    toast,
  }));
  bindTitleGestures(foundation.browser.$('title'), foundation.lifecycle, () => cinematic.logoTap());
  const { flushProfile } = bindProfileWiring({
    $: foundation.browser.$,
    lifecycle: foundation.lifecycle,
    playerStats: foundation.profile.playerStats,
    playerEquipment: foundation.profile.playerEquipment,
    saveMeta: foundation.profile.saveMeta,
    saveAwakening: foundation.profile.saveAwakening,
    UNL: foundation.profile.UNL,
  });
  const previewArtwork = { inkCharm: foundation.browser.inkCharm, inkCompanion: foundation.browser.inkCompanion, inkEnemy: foundation.browser.inkEnemy, inkPlayer: foundation.browser.inkPlayer, inkSword: foundation.browser.inkSword };
  const preview = createArmoryPreview(
    foundation.browser.$('prevC'),
    {
      random: foundation.view.R,
      now: activeNow,
      sounds: foundation.browser.sfx,
    },
    previewArtwork,
    surfaces?.get('prevC'),
  );
  const supportPreview = createArmoryPreview(
    foundation.browser.$('supportPreview'),
    {
      random: rng(4242),
      now: activeNow,
      sounds: foundation.browser.sfx,
    },
    previewArtwork,
    surfaces?.get('supportPreview'),
  );
  foundation.lifecycle.add(preview.dispose);
  foundation.lifecycle.add(supportPreview.dispose);
  function demoKill() {
    preview.demo(armory.tab === 'fx' ? (armory.selected ?? foundation.profile.profileEquipment.EQ.fx) : foundation.profile.profileEquipment.EQ.fx, !!(foundation.run.G.m && foundation.run.G.m.bonk));
  }
  function drawPreview() {
    lightingDebug.refresh();
    preview.draw(
      previewFrame(
        foundation.profile.profileEquipment.EQ.film === PREMIUM_FILM && !foundation.browser.premiumAccess() ? 'mono' : foundation.profile.profileEquipment.EQ.film,
        armory.tab === 'fx',
      ),
    );
  }
  function previewFrame(film: string, effectsVisible: boolean, target = foundation.browser.$('prevC')): PreviewFrame { return equipmentPresentation.previewFrame(film, effectsVisible, target); }
  /* ---------------- input ---------------- */
  const { disposePointer, bindNavigation } = createInputWiring(foundation.browser.cvs, stateView(foundation.view.geometry, ["W","H"], {
    $: foundation.browser.$,
    G: foundation.run.G,
    settings: foundation.browser.settings,
    cinematic,
    audioInit: foundation.browser.audioInit,
    onSwipe,
    onTapDown,
    onTap,
    lifecycle: foundation.lifecycle,
    abandonSavedRun,
    continueSavedRun,
    openPanel,
    startDaily,
    startRun,
    options,
    closePanel,
    pause,
    resume,
    endRun,
    toTitle,
    rewardScreen,
    konamiInput,
    get savedRun() {
      return foundation.run.sessionState.savedRun;
    },
    get activeTrial() {
      return foundation.run.activity.activeTrial;
    }
  }));
  bindPurchaseWiring(stateView(foundation.run.activity, ["activeTrial", "trialFailure"], stateView(foundation.run.sessionState, ["runTemplate"], stateView(foundation.profile.profileEquipment, ["EQ"], {
    $: foundation.browser.$,
    G: foundation.run.G,
    lifecycle: foundation.lifecycle,
    premiumAccess: foundation.browser.premiumAccess,
    savedEquipment: foundation.profile.savedEquipment,
    accessibleUnlocks: foundation.profile.accessibleUnlocks,
    ITEMS: foundation.profile.ITEMS,
    playerEquipment: foundation.profile.playerEquipment,
    savedFilm: foundation.profile.savedFilm,
    META: foundation.profile.META,
    SETUP: foundation.profile.SETUP,
    computeMods,
    renderArmory,
    saveMeta: foundation.profile.saveMeta,
    openPanel,
    pause,
    audio: foundation.browser.audio,
    guided: foundation.browser.guided,
    edition: foundation.browser.edition,
    UNL: foundation.profile.UNL,
    get initialPurchaseCheck() {
      return foundation.browser.browserPreferences.initialPurchaseCheck;
    },
    set initialPurchaseCheck(value) {
      foundation.browser.browserPreferences.initialPurchaseCheck = value;
    },
    get testerPremium() {
      return foundation.browser.browserPreferences.testerPremium;
    },
    set testerPremium(value) {
      foundation.browser.browserPreferences.testerPremium = value;
    }
  }))));
  const disposeKeyboard = bindNavigation();
  function showPauseScreen() {
    foundation.browser.combatHaptics.stop();
    foundation.browser.audio.setPaused(true);
    renderPauseBlessings(foundation.browser.$('paused'), foundation.run.G.bless);
    foundation.browser.$('pauseSeed').textContent = foundation.run.activity.activeDaily
      ? `Daily · ${foundation.run.activity.activeDaily.day}`
      : foundation.run.activity.activeTrial
        ? ''
        : `Seed ${foundation.run.G.seed}`;
    showScreen('paused');
    renderTrialObjective();
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
  const { frameLoop, update, render, drawScene, postPreparation, advancePost, preparePresentation } = createFrameBindings(cacheView(() => (stateView(foundation.run.activity, ["activeTrial", "trialFailure", "activeDaily", "combatRandom"], stateView(foundation.run.sessionState, ["hitStop", "timeScale"], stateView(foundation.view.stageState, ["stageSeed"], stateView(foundation.run.sceneState, ["sceneLoading"], stateView(foundation.view.geometry, ["W","H","S","DPR","L"], {
    G: foundation.run.G,
    P: foundation.run.P,
    WX: foundation.run.WX,
    R: foundation.view.R,
    g: foundation.browser.g,
    cvs: foundation.browser.cvs,
    nativeScene: foundation.browser.nativeScene,
    presentationState: foundation.view.presentationState,
    environmentState,
    postArtwork,
    playerFigures,
    finishTrial,
    updateAmbient,
    cinematic,
    reducedMotion: foundation.browser.reducedMotion,
    reducedFlashes: foundation.browser.reducedFlashes,
    audio: foundation.browser.audio,
    apparelMotion: foundation.view.apparelMotion,
    updateEnemies,
    waveConfiguration,
    liveOrdered,
    guided: foundation.browser.guided,
    bossPhase,
    phaseRouter,
    updateFx,
    renderTrialObjective,
    updateTransition,
    sceneFilm,
    pz,
    buzz: foundation.browser.buzz,
    premiumAccess: foundation.browser.premiumAccess,
    lightingDebug,
    lightingRig: foundation.browser.lightingRig,
    demonRealmRenderer: foundation.browser.demonRealmRenderer,
    environmentRenderer: foundation.browser.environmentRenderer,
    density: foundation.browser.density,
    blades,
    drawStains,
    drawLeaves,
    drawEnemy,
    drawBoss,
    drawFx,
    drawFx2,
    drawGlyphs,
    drawSmoke,
    drawWeather,
    drawPops,
    drawStamps,
    screenAnimation,
    effectQuality: foundation.view.effectQuality,
    ambient,
    rebalanceWeather,
    armory,
    flash,
    sfx: foundation.browser.sfx,
    gustLeaves,
    drawPreview,
    settlePresentedScene
  }))))))));
  // Scene readiness belongs to orchestration, never to a drawing call.
  function settlePresentedScene() { return sceneFlow.settlePresentedScene(); }
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
      toast({ k: '暁', msg: 'Unlocked: Seven Dawns crest' });
      refreshArmoryNew();
    }
  }
  bindGraphicsLifecycle(() => ({
    lifecycle: foundation.lifecycle, frameLoop, combatHaptics: foundation.browser.combatHaptics, audio: foundation.browser.audio, G: foundation.run.G, showPauseScreen, cvs: foundation.browser.cvs,
    nativeScene: foundation.browser.nativeScene, $: foundation.browser.$, screenAnimation, visitToday,
    get artworkReady() { return artworkReady; },
  }));

  /* ---------------- boot ---------------- */
  const { resize } = createViewport(() => (stateView(foundation.view.geometry, ["W","H","DPR"], {
    cvs: foundation.browser.cvs,
    lifecycle: foundation.lifecycle,
    layout: foundation.view.layout,
    buildBG,
    buildMist,
    buildGrass,
    buildLeaves,
    buildWeather,
    buildPost,
    screenAnimation,
    prepareScene,
    environmentState,
    get artworkReady() { return artworkReady; },
    reposition() {
    for (const e of foundation.run.G.enemies) {
      e.pos = enemyPos(e);
      if (e.state === 'dying') e.deathGround = { ...e.pos };
    }
    if (foundation.run.G.boss) {
      foundation.run.G.boss.pos = bossPos(foundation.run.G.boss);
      if (foundation.run.G.boss.state === 'dying') foundation.run.G.boss.deathGround = { ...foundation.run.G.boss.pos };
    }
    }
  })));
  startRuntime(() => (stateView(foundation.run.sessionState, ["savedRun"], stateView(foundation.view.geometry, ["W","H","DPR"], stateView(foundation.view.stageState, ["stageSeed"], {
    lifecycle: foundation.lifecycle,
    frameLoop,
    G: foundation.run.G,
    cinematic,
    setupScreen,
    tutorial,
    armory,
    notifications,
    guided: foundation.browser.guided,
    runResults,
    audio: foundation.browser.audio,
    driftRenderer,
    reducedMotion: foundation.browser.reducedMotion,
    reducedFlashes: foundation.browser.reducedFlashes,
    density: foundation.browser.density,
    computeMods,
    applySeal: foundation.view.applySeal,
    resize,
    setupAttract,
    restoreCheckpoint,
    showPauseScreen,
    showOver,
    recoverSupportReward,
    setMuteIcon: foundation.browser.setMuteIcon,
    refreshArmoryNew,
    setBestLine,
    updateSavedRunButtons,
    disposePointer,
    disposeKeyboard,
    inkCharm: foundation.browser.inkCharm,
    inkCompanion: foundation.browser.inkCompanion,
    inkEnemy: foundation.browser.inkEnemy,
    inkPlayer: foundation.browser.inkPlayer,
    inkSword: foundation.browser.inkSword,
    environmentRenderer: foundation.browser.environmentRenderer,
    presentationState: foundation.view.presentationState,
    markArtworkReady() {
      artworkReady = true;
      if (pageActive()) frameLoop.start();
    }
  })))));
  return foundation.lifecycle.dispose;
}
