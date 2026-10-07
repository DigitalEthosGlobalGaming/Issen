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
import { createFrameSimulation } from './game/session/frame-simulation.ts';
import { createEquipmentPresentation } from './presentation/equipment.ts';
import { createNativeServices, type PreparedLighting } from './presentation/native-services.ts';
import { bindDuelFeedback } from './presentation/duel-feedback.ts';
import { bindEncounterProgression } from './game/progression/encounter-listeners.ts';
import { createSceneFlow } from './game/session/scene-flow.ts';
import { createProfileRules } from './game/progression/profile-rules.ts';
import { createActiveEquipment } from './game/equipment/active.ts';
import { createPlayerFigures } from './presentation/player-figures.ts';
import { createResultsSession } from './game/session/results.ts';
import { visiblePet, saveWithFoxfire } from './game/player/companions.ts';
import { createCombatScore } from './game/progression/combat-score.ts';
import { bindCombatScoreFeedback } from './presentation/combat-score.ts';
import { bindKillFeedback } from './presentation/kill.ts';
import { bindCombatProgression } from './game/progression/combat-listeners.ts';
import { createEnemyKill } from './game/combat/kill.ts';
import { createPhaseRouter, definePhase } from './game/session/phase-router.ts';
import { createBetweenPhase } from './game/phases/between.ts';
import { createDeathPhase } from './game/phases/death.ts';
import { createShrinePhase } from './game/phases/shrine.ts';
import { createTrialSession } from './game/session/trials.ts';
import { createBossPhase } from './game/phases/boss.ts';
import { createStandoffPhase } from './game/phases/standoff.ts';
import { createWavesPhase, createWaveLifecycle } from './game/phases/waves.ts';
import { createRunStart } from './game/session/run-start.ts';
import { createCheckpointFlow } from './game/session/checkpoint-flow.ts';
import { createRunFlow } from './game/session/run-flow.ts';
import { bindProfileWiring } from './ui/wiring/profile.ts';
import { createCinematicWiring } from './ui/wiring/cinematic.ts';
import { bindPurchaseWiring } from './ui/wiring/purchases.ts';
import { createInputWiring } from './ui/wiring/input.ts';
import { createArmoryWiring } from './ui/wiring/armory.ts';
import { createSetupWiring } from './ui/wiring/setup.ts';
import { createSettingsWiring } from './ui/wiring/settings.ts';
import { createPanelWiring } from './ui/wiring/panels.ts';
import { createTitleSecrets } from './ui/wiring/secrets.ts';


import { createCuePresentation } from './presentation/cues.ts';
import {
  createPresentationState,
  advancePresentationClock,
  advancePresentationCamera,
} from './presentation/state.ts';
import { createPostArtwork } from './presentation/post-artwork.ts';

import { createFeedbackPresentation } from './presentation/feedback.ts';
import { createFiguresPresentation } from './presentation/figures.ts';
import { createRuntimeScene } from './presentation/scene.ts';
import { createEventBus, type GameEvents } from './game/events.ts';
import type { GameContext } from './game/session/context.ts';
import type { PresentationContext } from './presentation/context.ts';
import { reportGraphicsError, GRAPHICS_ERROR_EVENT } from './rendering/graphics-error.ts';

import {
  parseDailyLogin,
  recordDailyLogin,
  SEVEN_DAWNS_CREST,
} from './game/progression/daily-login.ts';

import { parseCollectionProgress, initializeCollections, syncCollectionProgress } from './game/progression/collection-progress.ts';
import { type PendingSupportReward } from './platform/pending-support.ts';
import { createRewardedSupport } from './platform/rewarded-support.ts';
import { createRewardScreen } from './ui/screens/rewarded-support.ts';
import { setSealTextures } from './rendering/ui-art.ts';

import { type DailyRun } from './game/progression/daily.ts';
import { mountStartupLoading } from './ui/startup-loading.ts';
import { createStageVisitSeeds } from './rendering/environment/stage-variation.ts';
import { compositionKey } from './rendering/environment/worker-types.ts';

import { premium } from './platform/purchases.ts';
import { SUPPORTER_FILM_ITEM } from './game/content/items.ts';
import { editionAccess, itemAccessible, type GameEdition } from './platform/editions.ts';
import { precisionZone } from './game/progression/mastery.ts';
import { PREMIUM_FILM } from './platform/premium.ts';
import { testerPremiumActive, parseTesterPremium } from './platform/tester-premium.ts';

import type { Item, ItemCategory } from './game/content/items.ts';
import type { Enemy } from './game/combat/enemy.ts';
import type { Boss } from './game/encounters/boss.ts';

import type { Direction } from './shared/directions.ts';

import { createLifecycle } from './platform/lifecycle.ts';
import { createFrameLoop } from './platform/frame-loop.ts';
import { createRuntimeScreens } from './ui/wiring/screens.ts';
import { createRunState } from './game/run-state.ts';
import type { PreviewFrame } from './rendering/armory-preview.ts';
import { createArmoryPreview } from './rendering/armory-preview.ts';
import { activeNow, pageActive, onActivityChange } from './platform/activity.ts';
import { createSecondaryMotion } from './rendering/figures/secondary-motion.ts';

import {
  appendGameOverUnlocks,
  renderGameOver,
  ITEM_TYPE_LABEL as TYPE_WORD,
} from './ui/screens/game-over.ts';
import { createRunResults } from './ui/screens/run-results.ts';
import type { ResultReveal } from './ui/screens/run-results.ts';

import { recordSecretEvent, reconcileCinematicCompanion } from './game/progression/secret-events.ts';
import { createRunRewardLedger } from './game/progression/run-rewards.ts';






import { bossPosition } from './rendering/figures/boss-position.ts';

import { createGrunt as createEnemy } from './game/combat/grunt-spawn.ts';
import { pickEnemyLook, orderedEnemies, selectAttacker } from './game/combat/enemy-spawn.ts';
import { enemyPosition } from './rendering/figures/enemy-position.ts';
import { advanceGrunts as simulateEnemies } from './game/combat/grunt.ts';

import { createWeatherState } from './rendering/scene/weather-state.ts';
import { updateWeather as simulateWeather } from './rendering/scene/weather-update.ts';
import {
  REST_POSE as PREST,
  createPlayerAnimation,
  startSwing,
  updatePlayerAnimation,
} from './game/player/player.ts';
import { comboMultiplier, scoreGain } from './game/progression/scoring.ts';

import { createEffectQuality, preferredDensity } from './rendering/effects/quality.ts';
import {
  chooseDeathStyle,
  BOSS_SHADOW_DURATION,
  SHADOW_DURATION,
} from './rendering/figures/death.ts';
import { parseSettings, preferenceEnabled } from './platform/settings.ts';



import { renderShrine } from './ui/screens/shrine.ts';
import { createNotifications } from './ui/notifications.ts';
import { modeKey as getModeKey } from './game/progression/modes.ts';


import { parseArmorySeen } from './game/progression/armory-seen.ts';
import { makeFig, EPOSE } from './shared/figure-model.ts';
import { createPostPresentation } from './presentation/post.ts';
import { createPostPreparation } from './presentation/post-preparation.ts';

import type { createBackground } from './rendering/scene/background.ts';
import { createPalette } from './rendering/palette.ts';
import { waveConfig, bossParameters } from './game/encounters/configuration.ts';

import { createAdminWiring } from './ui/wiring/admin.ts';

import { createGuidedLessons } from './game/onboarding/guided-lessons.ts';
import { parseMeta, templateModifiers, sanitizeSetup } from './game/progression/meta.ts';
import { createLayout } from './rendering/layout.ts';



import { parseAwakeningProgress } from './game/progression/awakening-progress.ts';
import type { BladeStats } from './game/progression/statistics.ts';




import { BLESS, BLESS_BY } from './game/content/blessings.ts';
import { loadStatistics, loadSetup, loadUnlocks, loadEquipment } from './platform/saves.ts';
import { createItems } from './game/content/items.ts';

import type { TrialDefinition } from './game/content/trials.ts';
import { parseTrialProgress, trialsUnlocked, grantTrialRewards } from './game/progression/trials.ts';

import { renderPauseBlessings } from './ui/screens/pause.ts';
import { itemPresentation } from './ui/screens/item-presentation.ts';
import type { TrialResult } from './ui/screens/trials.ts';
import { DEATH_REASONS } from './ui/screens/game-over.ts';

import { createAudio } from './audio/audio.ts';

import { store, isTestProfile } from './platform/storage.ts';
import { STAGES } from './game/content/stages.ts';
import { TAU } from './shared/math.ts';
import { rng, restorableRng, newRunSeed } from './shared/random.ts';
import {
  readRunCheckpoint,
  writeRunCheckpoint,
  clearRunCheckpoint,
} from './platform/run-checkpoint.ts';



import { createHaptics, createCombatHaptics } from './platform/haptics.ts';
export function startGame(
  surfaces: ReadonlyMap<string, import('./rendering/scene-surface.ts').SceneSurface>,
  lighting?: PreparedLighting,
): () => void {
  const lifecycle = createLifecycle();
  if (surfaces) for (const surface of surfaces.values()) lifecycle.add(surface.dispose);
  const nativeScene = surfaces.get('c')?.native;
  if (!nativeScene) throw new Error('A prepared WebGL2 scene is required');
  ('use strict');
  function $(id: 'c' | 'prevC' | 'supportPreview'): HTMLCanvasElement;
  function $(id: 'bAgain'): HTMLButtonElement;
  function $(id: string): HTMLElement;
  function $(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error('Missing game element ' + id);
    return el;
  }
  function context2d(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Canvas 2D unavailable');
    return context;
  }
  const cvs = $('c'),
    mainG = nativeScene;
  let g = mainG;
  const { environmentRenderer, demonRealmRenderer, inkCharm, inkCompanion, inkEnemy, inkPlayer, inkSword, lightingRig, uiMaterialLighting } = createNativeServices(cvs.ownerDocument, lifecycle, lighting);
  const R = Math.random;
  const settings = parseSettings(
    store.get('issen.settings', null),
    store.get('issen.muted', false) === true,
  );
  const systemMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reducedMotion = () => preferenceEnabled(settings.reducedMotion, systemMotion.matches);
  const reducedFlashes = () => preferenceEnabled(settings.reducedFlashes, systemMotion.matches);
  const buzz = createHaptics(() => settings.vibration);
  const combatHaptics = createCombatHaptics(
    () => settings.vibration,
    () => settings.vibrationStrength,
  );
  lifecycle.add(combatHaptics.stop);
  const edition = import.meta.env.VITE_GAME_EDITION as GameEdition;
  let testerPremium = parseTesterPremium(store.get('issen.testerPremium', null));
  const premiumAccess = () =>
    editionAccess(edition, premium.state.owned || testerPremiumActive(testerPremium));
  const accessible = (id: string) => itemAccessible(id, premiumAccess());
  const density = () => preferredDensity(settings.quality, effectQuality.density, reducedMotion());
  const FONT = '"Shippori Mincho B1","Hiragino Mincho ProN","Yu Mincho",serif';

  const PZ = 0.78; // perfect-cut zone starts at this fraction of the attack ring

  /* ---------------- stages ---------------- */
  /* ---------------- layout ---------------- */
  let W = 1,
    H = 1,
    DPR = 1,
    S = 1,
    portrait = true;
  let L: ReturnType<typeof createLayout> & {
    glows?: ReturnType<typeof createBackground>['glows'];
  } = createLayout(1, 1);
  function layout() {
    portrait = H >= W * 0.9;
    S = Math.max(W, H) / 900;
    L = createLayout(W, H);
  }

  /* ---------------- colours ---------------- */
  let MIST: number[] = [146, 141, 132];
  const palette = createPalette();
  const cols = (fog: number) => palette.fog(fog, MIST);
  /* ---------------- armory data ---------------- */
  const ITEMS = [
    ...createItems(() => new Set([...UNL].filter((id) => id !== PREMIUM_FILM))),
    SUPPORTER_FILM_ITEM,
  ];
  const equipmentPresentation = createEquipmentPresentation(() => ({
    $,
    EQ,
    robePal,
    isRobeSp,
    isSteelThird,
    isSp,
    lightingRig,
    presentationState,
    density,
    reducedMotion,
    reducedFlashes,
    G,
    cols,
    environmentState,
    P,
    petOf,
    FONT,
    SEAL,
  }));
  const { CHARMCOL } = equipmentPresentation;
  const ITEM_BY: Record<string, Item> = {};
  for (const it of ITEMS) ITEM_BY[it.id] = it;
  const robePal = palette.robe;

  /* ---------------- persistent stats & unlocks ---------------- */

  const profileServices = { store, loadStatistics, loadSetup, loadUnlocks, loadEquipment, premiumAccess, accessible, isTestProfile };
  const profileFoundation = createProfileFoundation(profileServices);
  let ST = profileFoundation.ST;
  const { SETUP, UNL, DAILY_LOGIN, TRIAL_PROGRESS, playerStats } = profileFoundation;
  let loginCrestRevealed = false;
  const activity = createRunActivity(R, playerStats.roninWave);
  
  
  
  
  
  
  const { META, AWAKENING, COLLECTION_PROGRESS, saveAwakening, saveCollections, saveMeta, ARMORY_SEEN } = createProfileProgress(profileServices, () => ST, SETUP, UNL);
  const syncCollections = () => {
    if (!activity.activeTrial && !activity.activeDaily && !['title'].includes(G.state))
      syncCollectionProgress(COLLECTION_PROGRESS, META, ST, G);
  };
  let runTemplate = templateModifiers(META, SETUP, premiumAccess());
  let rewardLedger = createRunRewardLedger();
  let runBossMilestone = 0;
  let runItemReveals: ResultReveal[] = [];
  let savedRun = readRunCheckpoint();
  let shrineOfferIds: string[] | null = null;
  function updateSavedRunButtons() {
    const available = savedRun?.status === 'active';
    $('bContinue').hidden = !available;
    $('bAbandon').hidden = !available;
    $('bPlay').textContent = available ? 'Start new run' : 'Draw your blade';
    for (const id of ['bArmory', 'bStats', 'bTemplate', 'bSupport', 'bTrials'])
      ($(id) as HTMLButtonElement).disabled = available;
    $('tSeed').textContent = available
      ? savedRun!.dailyDay
        ? `Daily · ${savedRun!.dailyDay}`
        : `Saved run · seed ${savedRun!.seed}`
      : '';
  }
  function earn(event: 'kill' | 'wave' | 'boss') { return profileRules.earn(event); }
  const saveStats = () => {
    if (!activity.activeTrial && !activity.activeDaily) {
      syncCollections();
      saveCollections();
      store.set('issen.stats', ST);
    }
  };
  const profileEquipment = createProfileEquipment(profileServices, UNL, ITEMS);
  let EQ = profileEquipment.EQ;
  const { revoked, accessibleUnlocks, playerEquipment, savedFilm, savedEquipment } = profileEquipment;
  let initialPurchaseCheck = true;
  const SEALS: Record<string, string> = {
    verm: '#a3271d',
    gold: '#a67c22',
    indigo: '#2d3e72',
    jade: '#2f6f55',
    sumiseal: '#1b1a18',
    'trial-platinum': '#aebbc5',
    'trial-copper': '#c1845e',
    'quiet-seal': '#678b7b',
  };
  let SEAL = '#a3271d',
    SEALARC = '#a3271d';
  function applySeal() {
    SEAL = SEALS[EQ.seal] || '#a3271d';
    SEALARC = EQ.seal === 'sumiseal' ? '#e9e3d6' : SEAL;
    document.documentElement.style.setProperty('--seal', SEAL);
    void setSealTextures($('app'), SEAL);
  }

  /* ---------------- background ---------------- */
  const stageVisits = createStageVisitSeeds((R() * 0x100000000) >>> 0);
  const previewVisits = createStageVisitSeeds((R() * 0x100000000) >>> 0);
  let stageSeed = stageVisits.enter(0);
  const WX = createWeatherState(() => 0.5);

  const { environmentState, driftRenderer, buildBG, buildMist, buildGrass, newLeaf, buildLeaves, gustLeaves, buildWeatherArtwork, rebalanceWeather, ambient, blades, drawLeaves, weatherRenderer, drawWeather, drawSmoke, updateAmbient, updateTransition } = createEnvironmentHost(cvs.ownerDocument, lifecycle, () => ({
    W,
    H,
    DPR,
    S,
    G,
    L,
    R,
    density,
    context2d,
    activeTrial: activity.activeTrial,
    reducedMotion,
    g,
    presentationState,
    cinematic,
    WX,
  }));
  function buildWeather(resetSimulation = true) {
    buildWeatherArtwork();
    if (resetSimulation) Object.assign(WX, createWeatherState(activity.combatRandom));
  }
  const postArtwork = createPostArtwork(cvs.ownerDocument, () => ({ W, H, R, mainG, context2d }));
  const { buildPost } = postArtwork;

  function setStage(si: number, anim: boolean) {
    stageSeed = stageVisits.enter(si);
    if (anim && environmentState.bg) {
      environmentState.prevBg = environmentState.bg;
      environmentState.stageFade = 1;
    }
    G.stage = si;
    buildLeaves();
    MIST = STAGES[si]!.fog;
    palette.clearFog();
    buildBG();
    buildMist();
    buildGrass();
    buildWeather();
    prepareScene();
  }
  /* ---------------- figures ---------------- */
  const { figureRenderer, drawFigure, drawSplit, drawPetAt, drawSword, drawGlint, tipOf, drawEnemy, drawBoss, playerFigures, drawEnso, drawGlyphs } = createFiguresHost(() => ({
    g,
    inkCharm,
    inkCompanion,
    inkEnemy,
    inkPlayer,
    inkSword,
    presentationState,
    G,
    W,
    H,
    cols,
    R,
    density,
    reducedMotion,
    reducedFlashes,
    robePal,
    accessible,
    EQ,
    SEAL,
    FONT,
    L,
    P,
    apparelMotion,
    playerRobePalette,
    isRobeSp,
    bladeStyle,
    CHARMCOL,
    petOf,
    SEALARC,
    pz,
    waveConfiguration,
    liveOrdered,
    WX,
  }));
  function petOf() {
    return visiblePet(EQ);
  }
  function drawFoxfire() { playerFigures.drawFoxfire(); }
  function foxSave(e: Enemy) {
    saveWithFoxfire(e, { killEnemy, pop, flash, sfx });
  }
  function reviveDaruma(ph = false, support = false) {
    deathPhase.reviveDaruma(ph, support);
  }
  function drawPet() { playerFigures.drawPet(); }
  /* ---------------- ensō glyph ---------------- */
  /* ---------------- audio ---------------- */
  const audio = createAudio(settings.muted);
  const audioInit = audio.init,
    tn = audio.tone,
    sfx = audio.cues;
  const guided = createGuidedLessons(
    $('app'),
    store.get('issen.guidedLessons', null),
    (value) => store.set('issen.guidedLessons', value),
    (frozen) => audio.setPaused(frozen || G.state === 'paused'),
  );
  const ICON_ON =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/></svg>';
  const ICON_OFF =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9l5 6M22 9l-5 6"/></svg>';
  function setMuteIcon() {
    $('mute').innerHTML = audio.muted ? ICON_OFF : ICON_ON;
    $('mute').setAttribute('aria-pressed', String(audio.muted));
  }
  lifecycle.listen($('mute'), 'pointerup', (e) => {
    e.stopPropagation();
    audioInit();
    settings.muted = !settings.muted;
    saveSettings();
  });
  lifecycle.listen($('mute'), 'pointerdown', (e) => e.stopPropagation());

  /* ---------------- game state ---------------- */
  const presentationState = createPresentationState();
  let hitStop = 0,
    timeScale = 1;
  const G = createRunState(store.get('issen.hints', {}));
  const P = createPlayerAnimation();
  const apparelMotion = createSecondaryMotion();

  const effectQuality = createEffectQuality();
  // Transitional adapters preserve closure ownership while consumers migrate to slices.
  const context: GameContext<PresentationContext> = {
    run: {
      state: G,
      get random() {
        return activity.runRandom;
      },
      set random(value) {
        activity.runRandom = value;
        activity.combatRandom = value.next;
      },
      get equipment() {
        return EQ;
      },
      set equipment(value) {
        EQ = value;
      },
      setup: SETUP,
      get trial() {
        return activity.activeTrial;
      },
      set trial(value) {
        activity.activeTrial = value;
      },
      get daily() {
        return activity.activeDaily;
      },
      set daily(value) {
        activity.activeDaily = value;
      },
    },
    services: { audio, storage: store, settings, notify: toast },
    presentation: {
      random: R,
      effects: () => effectSpawner(),
      layout: () => L,
      viewport: () => ({ width: W, height: H, dpr: DPR, scale: S }),
      environment: environmentState,
      state: presentationState,
      camera: presentationState,
    },
    events: createEventBus<GameEvents>(),
  };
  lifecycle.add(context.events.clear);
  const profileRules = createProfileRules(() => ({
    G,
    activeTrial: activity.activeTrial,
    activeDaily: activity.activeDaily,
    rewardLedger,
    AWAKENING,
    META,
    saveAwakening,
    ST,
    UNL,
    ITEMS,
    ITEM_BY,
    revoked,
    COLLECTION_PROGRESS,
    accessible,
    refreshArmoryNew,
    runItemReveals,
    store,
    itemPresentation,
    TYPE_WORD,
  }));
  const activeEquipment = createActiveEquipment(() => ({
    G,
    SETUP,
    META,
    EQ,
    UNL,
    ITEM_BY,
    activeTrial: activity.activeTrial,
    accessible,
    runTemplate,
  }));
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
  const pz = () => precisionZone(PZ, G.m?.pz ?? 0, G.m?.precision ?? 0);
  function pickLook(n: number) {
    return pickEnemyLook(n, R);
  }
  function waveConfiguration() {
    if (!G.cfg) throw new Error('Encounter requires a wave configuration');
    return G.cfg;
  }
  const waveCfg = (w: number) => waveConfig(w, G.mode, G.m);
  const bossParams = (n: number) => bossParameters(n, G.mode, G.m);
  const comboMult = () => comboMultiplier(G.combo, G.m);
  const gain = (p: number) => scoreGain(p, G);
  const modeKey = () => getModeKey(G);
  const combatScore = createCombatScore(() => ({
    G,
    events: context.events,
    activeTrial: activity.activeTrial,
    get trialFailure() {
      return activity.trialFailure;
    },
    set trialFailure(value) {
      activity.trialFailure = value;
    },
  }));
  function bumpCombo() {
    combatScore.bumpCombo();
  }

  const { hudView, screenAnimation, showScreen, renderLives, hud, setScore, banner, renderHp } =
    createRuntimeScreens($('app'), activeNow, () => ({
      G,
      activeDaily: !!activity.activeDaily,
      syncCollections,
    }));
  let artworkReady = false;
  let sceneLoading = false;
  let sceneReadyToPresent = false;
  let sceneRequest = 0;
  let requestedSceneKey = '';
  let requestedSceneIdentity = '';
  let sceneContinuation: (() => void) | undefined;
  const sceneFlow = createSceneFlow(() => ({
    stageSeed,
    W,
    H,
    DPR,
    presentationState,
    G,
    reducedMotion,
    reducedFlashes,
    density,
    activeTrial: activity.activeTrial,
    environmentState,
    compositionKey,
    cvs,
    screenAnimation,
    demonRealmRenderer,
    environmentRenderer,
    lifecycle,
    frameLoop,
    get requestedSceneKey() { return requestedSceneKey; }, set requestedSceneKey(value) { requestedSceneKey = value; },
    get sceneRequest() { return sceneRequest; }, set sceneRequest(value) { sceneRequest = value; },
    get requestedSceneIdentity() { return requestedSceneIdentity; }, set requestedSceneIdentity(value) { requestedSceneIdentity = value; },
    get sceneContinuation() { return sceneContinuation; }, set sceneContinuation(value) { sceneContinuation = value; },
    get sceneLoading() { return sceneLoading; }, set sceneLoading(value) { sceneLoading = value; },
    get sceneReadyToPresent() { return sceneReadyToPresent; }, set sceneReadyToPresent(value) { sceneReadyToPresent = value; },
  }));
  function prepareScene() { return sceneFlow.prepareScene(); }
  function deferUntilSceneReady(action: () => void) { return sceneFlow.deferUntilSceneReady(action); }
  const notifications = createNotifications($('hint'), $('toast'), () => sfx.unlock());
  const runResults = createRunResults($('over'), () => sfx.reveal(), reducedMotion);
  function hint(key: string, text: string, dur = 3500) {
    if (activity.activeTrial || activity.activeDaily) return;
    if (G.hints[key]) return;
    G.hints[key] = 1;
    store.set('issen.hints', G.hints);
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
  } = createFeedbackPresentation(() => ({
    g,
    fx: presentationState.fx,
    S,
    time: presentationState.time,
    FONT,
    SEAL,
    mistSprite: environmentState.mistSprite,
    R,
    density,
    sfx,
    W,
    H,
    portrait,
    state: presentationState,
    reducedFlashes,
    reducedMotion,
    weather: STAGES[G.stage]!.weather,
    newLeaf,
    leaves: environmentState.leaves,
    killEffect: () => (accessible(EQ.fx) ? EQ.fx : 'ink'),
    clink: () => sfx.clink(),
  }));
  const sessionBindings: ReturnType<typeof createSessionBindings<typeof PREST, ResultReveal>> = createSessionBindings<typeof PREST, ResultReveal>(() => ({
    get adoptPhase(): SessionBindingViews<typeof PREST, ResultReveal>['adoptPhase'] { return () => phaseRouter.adoptCheckpoint(); },
    get discardSceneContinuation(): SessionBindingViews<typeof PREST, ResultReveal>['discardSceneContinuation'] { return () => { sceneContinuation = undefined; }; },
    get $() { return $; },
    get AWAKENING() { return AWAKENING; },
    get COLLECTION_PROGRESS() { return COLLECTION_PROGRESS; },
    get G() { return G; },
    get META() { return META; },
    get SETUP() { return SETUP; },
    get UNL() { return UNL; },
    get WX() { return WX; },
    get DAILY_LOGIN() { return DAILY_LOGIN; },
    get ITEMS() { return ITEMS; },
    get accessibleUnlocks() { return accessibleUnlocks; },
    get applySeal() { return applySeal; },
    get bossPos() { return bossPos; },
    get computeMods() { return computeMods; },
    get enemyPos() { return enemyPos; },
    get hud() { return hud; },
    get playerEquipment() { return playerEquipment; },
    get playerStats() { return playerStats; },
    get premiumAccess() { return premiumAccess; },
    get renderHp() { return renderHp; },
    get renderLives() { return renderLives; },
    get saveAwakening() { return saveAwakening; },
    get saveMeta() { return saveMeta; },
    get saveStats() { return saveStats; },
    get saveCollections() { return saveCollections; },
    get setScore() { return setScore; },
    get setStage() { return setStage; },
    get syncCollections() { return syncCollections; },
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
    get activeTrial() {
        return activity.activeTrial;
      },
    get sceneLoading() {
        return sceneLoading;
      },
    get EQ() {
        return EQ;
      },
    set EQ(value) {
        EQ = value;
      },
    get ST() {
        return ST;
      },
    set ST(value) {
        ST = value;
      },
    get activeDaily() {
        return activity.activeDaily;
      },
    set activeDaily(value) {
        activity.activeDaily = value;
      },
    get rewardLedger() {
        return rewardLedger;
      },
    set rewardLedger(value) {
        rewardLedger = value;
      },
    get runBossMilestone() {
        return runBossMilestone;
      },
    set runBossMilestone(value) {
        runBossMilestone = value;
      },
    get runRandom() {
        return activity.runRandom;
      },
    set runRandom(value) {
        activity.runRandom = value;
      },
    get runTemplate() {
        return runTemplate;
      },
    set runTemplate(value) {
        runTemplate = value;
      },
    get combatRandom() {
        return activity.combatRandom;
      },
    set combatRandom(value) {
        activity.combatRandom = value;
      },
    get savedRun() {
        return savedRun;
      },
    set savedRun(value) {
        savedRun = value;
      },
    get shrineOfferIds() {
        return shrineOfferIds;
      },
    set shrineOfferIds(value) {
        shrineOfferIds = value;
      },
    get events(): SessionBindingViews<typeof PREST, ResultReveal>['events'] { return context.events; },
    get P() { return P; },
    get PREST() { return PREST; },
    get apparelMotion() { return apparelMotion; },
    get audio() { return audio; },
    get checkUnlocks() { return checkUnlocks; },
    get clearHints() { return clearHints; },
    get guided() { return guided; },
    get hint() { return hint; },
    get prepareScene() { return prepareScene; },
    get presentationState() { return presentationState; },
    get stageVisits() { return stageVisits; },
    get startTrialEncounter() { return startTrialEncounter; },
    get startWave() { return startWave; },
    get startBoss() { return startBoss; },
    get audioInit() { return audioInit; },
    get buildLeaves() { return buildLeaves; },
    get waveCfg() { return waveCfg; },
    get clearTrialResult(): SessionBindingViews<typeof PREST, ResultReveal>['clearTrialResult'] { return () => {
      activity.trialResult = null;
    }; },
    get clearCheckpoint(): SessionBindingViews<typeof PREST, ResultReveal>['clearCheckpoint'] { return clearRunCheckpoint; },
    get newRunSeed() { return newRunSeed; },
    get resetWeather(): SessionBindingViews<typeof PREST, ResultReveal>['resetWeather'] { return (random) => {
      Object.assign(WX, createWeatherState(random));
    }; },
    get clearEffects(): SessionBindingViews<typeof PREST, ResultReveal>['clearEffects'] { return () => {
      for (const [key, particles] of Object.entries(presentationState.fx))
        if (key !== 'scratches') particles.length = 0;
    }; },
    set activeTrial(value) {
      activity.activeTrial = value;
    },
    get runItemReveals() {
      return runItemReveals;
    },
    set runItemReveals(value) {
      runItemReveals = value;
    },
    get runTrialsWasUnlocked() {
      return activity.runTrialsWasUnlocked;
    },
    set runTrialsWasUnlocked(value) {
      activity.runTrialsWasUnlocked = value;
    },
    get stageSeed() {
      return stageSeed;
    },
    set stageSeed(value) {
      stageSeed = value;
    },
    get timeScale() {
      return timeScale;
    },
    set timeScale(value) {
      timeScale = value;
    },
    get hitStop() {
      return hitStop;
    },
    set hitStop(value) {
      hitStop = value;
    },
    get trialFailure() {
      return activity.trialFailure;
    },
    set trialFailure(value) {
      activity.trialFailure = value;
    },
    get TRIAL_PROGRESS() { return TRIAL_PROGRESS; },
    get R() { return R; },
    get deferUntilSceneReady() { return deferUntilSceneReady; },
    get banner() { return banner; },
    get setWaveLabel(): SessionBindingViews<typeof PREST, ResultReveal>['setWaveLabel'] { return (label) => {
      $('waveLbl').textContent = label;
    }; },
    get renderTrialObjective() { return renderTrialObjective; },
    get store() { return store; },
    get sfx() { return sfx; },
    get hideTrialObjective(): SessionBindingViews<typeof PREST, ResultReveal>['hideTrialObjective'] { return () => {
      $('trialObjective').hidden = true;
    }; },
    get toTitle() { return toTitle; },
    get openPanel() { return openPanel; },
    get focusTrialResult(): SessionBindingViews<typeof PREST, ResultReveal>['focusTrialResult'] { return () => {
      $('trials')
        .querySelector<HTMLButtonElement>('#trialResult button')
        ?.focus({ preventScroll: true });
    }; },
    get trialResult() {
      return activity.trialResult;
    },
    set trialResult(value) {
      activity.trialResult = value;
    },
    get sceneContinuation() { return sceneContinuation; },
    set sceneContinuation(value) { sceneContinuation = value; },
    get rewardFlowBusy() { return rewardFlowBusy; },
    set rewardFlowBusy(value) { rewardFlowBusy = value; },
    get rewardScreen() { return rewardScreen; },
    get supportPremium() { return supportPremium; },
    get testerPremium() { return testerPremium; },
    get lifecycle() { return lifecycle; },
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
      return !!nativeScene?.contextLost;
    }
  }));
  const { captureCheckpoint, restoreCheckpoint, continueSavedRun, abandonSavedRun } = sessionBindings.checkpoint();
  function addScore(pts: number, x: number, y: number, label?: string, size?: number) {
    return combatScore.addScore(pts, x, y, label, size);
  }
  /* ---------------- enemies ---------------- */
  function enemyPos(e: Enemy) {
    return enemyPosition(e, L, W, H);
  }
  function spawnEnemy(slot: number, attract = false) {
    if (activity.activeTrial && !attract && G.toSpawn <= 0) return;
    return createEnemy(G, slot, attract, enemyPos, attract ? R : activity.combatRandom);
  }
  function setupAttract() {
    if (deferUntilSceneReady(setupAttract)) return;
    G.enemies = [];
    G.cfg = null;
    G.boss = null;
    G.attacker = null;
    for (let i = 0; i < 5; i++) spawnEnemy(i, true);
  }
  function liveOrdered() {
    return orderedEnemies(G.enemies);
  }
  function pickAttacker() {
    return selectAttacker(G.enemies, waveConfiguration().ordered, activity.combatRandom);
  }
  function updateEnemies(dt: number, raw = dt) {
    simulateEnemies(G, dt, {
      rawDelta: raw,
      surge: WX.surge,
      time: presentationState.time,
      perfectZone: pz,
      sounds: sfx,
      pet: EQ.pet,
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
    const trial = activity.activeTrial;
    const visible = !!trial && ['playing', 'boss', 'between'].includes(G.state);
    $('trialObjective').hidden = !visible;
    if (!trial || !visible) return;
    $('trialObjective').textContent =
      trial.duelMaster && G.boss
        ? `Duel Master · ${20 - G.boss.hp}/20 exchanges · No mistakes`
        : trial.wave
          ? `${trial.name} · ${trial.waveCount ? `Wave ${G.wave}/${trial.waveCount} · ` : ''}${G.kills}/${trial.wave.total} cuts${trial.wave.perfects ? ` · ${G.perfects}/${trial.wave.perfects} perfect` : ''} · ${trial.mirrored ? 'Cut opposite' : 'No mistakes'}`
          : `${trial.name} · ${G.bossesSlain}/${trial.bosses!.length} duels · ${trial.cleanOpenings ? 'No hits or missed openings' : 'No hits'}`;
  }
    const { waveLifecycle, wavesPhase, bossPhase, standoffPhase, shrinePhase, deathPhase, betweenPhase } = createPhaseBindings(() => ({
    events: context.events,
    G,
    ST,
    W,
    H,
    S,
    combatRandom: activity.combatRandom,
    renderLives,
    pop,
    setStage,
    bst,
    challenge,
    saveStats,
    checkUnlocks,
    startStandoff,
    waveCfg,
    waveConfiguration,
    banner,
    setWaveLabel: (label) => {
      $('waveLbl').textContent = label;
    },
    sfx,
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
    activeTrial: activity.activeTrial,
    orderSucceeded: () => guided.orderSucceeded(),
    swingPlayer,
    playerDie,
    enemyPos,
    comboMult,
    sparks,
    buzz,
    hud,
    knifeTrail(pos) {
        presentationState.fx.knives.push({
          x0: L.player.x,
          y0: L.player.y - L.player.h * 0.55,
          x1: pos.x,
          y1: pos.y - pos.h * 0.55,
          t: 0,
          life: 0.18,
        });
      },
    bossPos,
    renderHp,
    activeDaily: activity.activeDaily,
    guided,
    flash,
    breakCombo,
    setScore,
    bossTipWorld,
    ring,
    get hitStop() {
        return hitStop;
      },
    set hitStop(value) {
        hitStop = value;
      },
    combatHaptics,
    letterbox,
    bumpCombo,
    notifications,
    hideHint,
    addSlash,
    killFx,
    scraps,
    stamp,
    punch,
    EQ,
    get runBossMilestone() {
        return runBossMilestone;
      },
    set runBossMilestone(value) {
        runBossMilestone = value;
      },
    inkBurst,
    shake: (amount) => {
        presentationState.shake = Math.max(presentationState.shake, amount);
      },
    setBossLabels: (wave, glyph, name) => {
        $('waveLbl').textContent = wave;
        $('bossK').textContent = glyph;
        $('bossN').textContent = name;
      },
    showBossBar: (shown) => {
        $('bossbar').classList.toggle('on', shown);
      },
    bossStain: (p) => {
        presentationState.fx.stains.push({
          x: p.x,
          y: p.y + p.h * 0.01,
          rx: p.h * 0.3,
          t: 0,
          life: BOSS_SHADOW_DURATION,
        });
      },
    L,
    pickLook,
    startWave,
    accessible,
    makeFigure: makeFig,
    guardPose: EPOSE.guard,
    clearLetterbox: () => {
        presentationState.lbT = 0;
      },
    toast,
    nextStep,
    showShrineOffers,
    premiumAccess,
    computeMods,
    showScreen,
    resetKnocks: () => {
      knocks = 0;
    },
    get shrineOfferIds() {
      return shrineOfferIds;
    },
    set shrineOfferIds(value) {
      shrineOfferIds = value;
    },
    get timeScale() {
      return timeScale;
    },
    set timeScale(value) {
      timeScale = value;
    },
    startBoss,
    get trialFailure() {
      return activity.trialFailure;
    },
    set trialFailure(value) {
      activity.trialFailure = value;
    },
    bossSwipe,
    clearHints,
    resetPlayer: () => {
      P.fall = 0;
      P.pose = { ...PREST };
    },
    inkPulse: (value) => {
      presentationState.inkPulse = value;
    },
    hideBossBar: () => {
      $('bossbar').classList.remove('on');
    },
    reasonMessage: (reason) => DEATH_REASONS[reason] || '',
    get rewardFlowBusy() {
      return rewardFlowBusy;
    },
    fallPlayer: (fall) => {
      P.fall = fall;
    },
    showOver,
    finishTrial,
    startTrialEncounter,
    openShrine
  }), context);
  function startWave(n: number, skipEvent = false) {
    waveLifecycle.startWave(n, skipEvent);
  }
  function updateWave(dt: number) {
    waveLifecycle.updateWave(dt);
  }
  const killAppearance = createKillAppearance(() => ({ R, bonk: !!G.m.bonk, fxId: EQ.fx, accessible, presentationState }));
  const readKillViews = () => ({
    events: context.events,
    G,
    pz,
    enemyPos,
    combatRandom: activity.combatRandom,
    waveConfiguration,
    ST,
    earn,
    sfx,
    addScore,
    comboMult,
    bst,
    challenge,
    bumpCombo,
    addSlash,
    killFx,
    scraps,
    ring,
    S,
    swingPlayer,
    combatHaptics,
    renderLives,
    pop,
    activeTrial: activity.activeTrial,
    hud,
    setScore,
    W,
    H,
    stamp,
    letterbox,
    punch,
    get hitStop() {
      return hitStop;
    },
    set hitStop(value) {
      hitStop = value;
    },
    flash,
    get trialFailure() {
      return activity.trialFailure;
    },
    set trialFailure(value) {
      activity.trialFailure = value;
    },
    gustLeaves,
    notifications,
    hideHint,
    liveOrdered,
    checkUnlocks,
    deathAppearance: killAppearance.deathAppearance,
    disarm: killAppearance.disarm,
    coin: killAppearance.coin,
    stain: killAppearance.stain,
    shake: killAppearance.shake,
  });
  const killRules = createEnemyKill(readKillViews);
  lifecycle.add(
    bindCombatProgression(context.events, () => ({ ST, bst, challenge, checkUnlocks })),
  );
  lifecycle.add(bindEncounterProgression(context.events, () => ({ ST, bst, challenge })));
  lifecycle.add(bindBossFeedback(context.events, () => ({
    W, H, S, addSlash, killFx, scraps, ring, flash, sfx, combatHaptics,
    stamp, letterbox, punch, inkBurst,
    shake: amount => { presentationState.shake = Math.max(presentationState.shake, amount); },
    showBossBar: shown => { $('bossbar').classList.toggle('on', shown); },
    bossStain: p => { presentationState.fx.stains.push({ x:p.x, y:p.y+p.h*0.01, rx:p.h*0.3, t:0, life:BOSS_SHADOW_DURATION }); },
  })));
  lifecycle.add(bindStandoffFeedback(context.events, () => ({ W, H, S, addSlash, killFx, scraps, ring, stamp, punch, flash, sfx, combatHaptics })));
  lifecycle.add(bindDuelFeedback(context.events, () => ({
    S, sparks, ring, flash, sfx, combatHaptics, letterbox, buzz,
    shake: amount => { presentationState.shake = Math.max(presentationState.shake, amount); },
  })));
  lifecycle.add(bindKillFeedback(context.events, readKillViews));
  lifecycle.add(bindCombatScoreFeedback(context.events, () => ({ setScore, pop, W, H })));
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
    if (EQ.blade === 'koken' && G.state !== 'title') sfx.hum();
    startSwing(P, dir);
    apparelMotion.kick(dir, reducedMotion(), perfect);
  }
  
  function onSwipe(dir: Direction) {
    if (sceneLoading) return;
    if (
      guided.swipe(
        dir,
        G.state === 'playing' && waveConfiguration().ordered
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
    return bossPosition(b, L);
  }
  function bossTipWorld(b: Boss): [number, number] {
    const tp = tipOf(b.pose, b.lean, b.def.spear ? 0.98 : 0.52);
    return [b.pos.x + tp[0] * b.pos.h, b.pos.y + tp[1] * b.pos.h];
  }
  function onTapDown() {
    if (sceneLoading) return false;
    // Finger-down begins a possible swipe. Consume taps on release during cut
    // practice so the pointer adapter can still recognize the teaching gesture.
    if (guided.phase === 'order-practice') return false;
    if (guided.tap()) return true;
    return phaseRouter.onTapDown();
  }
  function onTap() {
    if (sceneLoading) return;
    if (guided.tap()) return;
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
  let knocks = 0;
  lifecycle.listen($('shrineK'), 'click', () => {
    audioInit();
    sfx.knock();
    knocks++;
    if (recordSecretEvent(ST, { kind: 'shrineKnocks', count: knocks })) {
      saveStats();
      sfx.bell();
      checkUnlocks();
    }
  });
  function breakCombo() {
    combatScore.breakCombo();
  }
  
  function applyPick(id: string) {
    shrinePhase.applyPick(id);
  }
  lifecycle.listen($('oScore'), 'click', (e) => {
    e.stopPropagation();
    audioInit();
    G.claps = (G.claps || 0) + 1;
    tn({ f0: 700 + G.claps * 90, dur: 0.06, g: 0.05 });
    if (recordSecretEvent(ST, { kind: 'scoreClaps', count: G.claps })) {
      saveStats();
      sfx.popper();
      const previous = runItemReveals.length;
      checkUnlocks();
      const newReveals = runItemReveals.slice(previous);
      if (newReveals.length) {
        appendGameOverUnlocks($('over'), newReveals);
        G.overReady = false;
        $('bAgain').disabled = true;
        runResults.startUnlocks(newReveals, () => {
          G.overReady = true;
          $('bAgain').disabled = false;
        });
      }
    }
  });
  function openShrine() {
    shrinePhase.openShrine();
  }
  lifecycle.listen($('bRerollShrine'), 'click', () => shrinePhase.reroll());
  function showShrineOffers(opts: (typeof BLESS)[number][]) {
    ($('bRerollShrine') as HTMLButtonElement).hidden = G.shrineRerolls < 1 || !premiumAccess();
    renderShrine($('blessList'), opts, (bl) => {
      shrinePhase.pick(bl);
    });
    showScreen('shrine');
    sfx.drum();
  }

  /* ---------------- death & menus ---------------- */
  
  function playerDie(killer: Enemy | Boss | null, reason: string) {
    deathPhase.playerDie(killer, reason);
  }
  function finishDaily() { resultsSession.finishDaily(); }
  const rewardSupport = createRewardedSupport();
  const rewardScreen = createRewardScreen(document.getElementById('app')!);
  lifecycle.add(rewardScreen.dispose);
  let rewardFlowBusy = false;
  const resultsSession = sessionBindings.results();
  // Support benefits are independent of Web collection access.
  const supportPremium = () =>
    premium.state.owned || edition === 'premium' || testerPremiumActive(testerPremium);
  function showOver() { resultsSession.showOver(); }
  async function claimEmberBonus(pending: PendingSupportReward) { return resultsSession.claimEmberBonus(pending); }
  function recoverSupportReward() { resultsSession.recoverSupportReward(); }
  const { toTitle, pause, resume, endRun } = sessionBindings.runFlow();
    const { setBestLine, openPanel, closePanel, renderStats, setupScreen, renderSetup, tutorial, launchTutorial, showAdmin, scrollMenus, applySettings, saveSettings, lightingDebug, options, armoryWiring, cinematicWiring } = createMenuBindings(() => ({
    get $(): MenuBindingViews['$'] { return $; },
    get playerStats(): MenuBindingViews['playerStats'] { return playerStats; },
    get G(): MenuBindingViews['G'] { return G; },
    get hudView(): MenuBindingViews['hudView'] { return hudView; },
    get previewFrame(): MenuBindingViews['previewFrame'] { return previewFrame; },
    get testerPremium(): MenuBindingViews['testerPremium'] { return testerPremium; },
    get renderArmory(): MenuBindingViews['renderArmory'] { return renderArmory; },
    get META(): MenuBindingViews['META'] { return META; },
    get saveMeta(): MenuBindingViews['saveMeta'] { return saveMeta; },
    get premiumAccess(): MenuBindingViews['premiumAccess'] { return premiumAccess; },
    get TRIAL_PROGRESS(): MenuBindingViews['TRIAL_PROGRESS'] { return TRIAL_PROGRESS; },
    get trialResult(): MenuBindingViews['trialResult'] { return activity.trialResult; },
    get startTrial(): MenuBindingViews['startTrial'] { return startTrial; },
    get showScreen(): MenuBindingViews['showScreen'] { return showScreen; },
    get UNL(): MenuBindingViews['UNL'] { return UNL; },
    get ITEMS(): MenuBindingViews['ITEMS'] { return ITEMS; },
    get clearTrialResult(): MenuBindingViews['clearTrialResult'] { return () => {
      activity.trialResult = null;
    }; },
    get SETUP(): MenuBindingViews['SETUP'] { return SETUP; },
    get ITEM_BY(): MenuBindingViews['ITEM_BY'] { return ITEM_BY; },
    get sfx(): MenuBindingViews['sfx'] { return sfx; },
    get toTitle(): MenuBindingViews['toTitle'] { return toTitle; },
    get reducedMotion(): MenuBindingViews['reducedMotion'] { return reducedMotion; },
    get EQ() {
      return EQ;
    },
    get AWAKENING(): MenuBindingViews['AWAKENING'] { return AWAKENING; },
    get applySeal(): MenuBindingViews['applySeal'] { return applySeal; },
    get checkUnlocks(): MenuBindingViews['checkUnlocks'] { return checkUnlocks; },
    get computeMods(): MenuBindingViews['computeMods'] { return computeMods; },
    get hud(): MenuBindingViews['hud'] { return hud; },
    get playerEquipment(): MenuBindingViews['playerEquipment'] { return playerEquipment; },
    get refreshArmoryNew(): MenuBindingViews['refreshArmoryNew'] { return refreshArmoryNew; },
    get renderLives(): MenuBindingViews['renderLives'] { return renderLives; },
    get revoked(): MenuBindingViews['revoked'] { return revoked; },
    get saveAwakening(): MenuBindingViews['saveAwakening'] { return saveAwakening; },
    get testJump(): MenuBindingViews['testJump'] { return testJump; },
    get toast(): MenuBindingViews['toast'] { return toast; },
    get setTrialsWasUnlocked(): MenuBindingViews['setTrialsWasUnlocked'] { return (value) => {
      activity.runTrialsWasUnlocked = value;
    }; },
    get cvs(): MenuBindingViews['cvs'] { return cvs; },
    get screenAnimation(): MenuBindingViews['screenAnimation'] { return screenAnimation; },
    get lifecycle(): MenuBindingViews['lifecycle'] { return lifecycle; },
    get settings(): MenuBindingViews['settings'] { return settings; },
    get reducedFlashes(): MenuBindingViews['reducedFlashes'] { return reducedFlashes; },
    get prepareScene(): MenuBindingViews['prepareScene'] { return prepareScene; },
    get combatHaptics(): MenuBindingViews['combatHaptics'] { return combatHaptics; },
    get audio(): MenuBindingViews['audio'] { return audio; },
    get setMuteIcon(): MenuBindingViews['setMuteIcon'] { return setMuteIcon; },
    get presentationState(): MenuBindingViews['presentationState'] { return presentationState; },
    get environmentState(): MenuBindingViews['environmentState'] { return environmentState; },
    get ambient(): MenuBindingViews['ambient'] { return ambient; },
    get rebalanceWeather(): MenuBindingViews['rebalanceWeather'] { return rebalanceWeather; },
    get lightingRig(): MenuBindingViews['lightingRig'] { return lightingRig; },
    get audioInit(): MenuBindingViews['audioInit'] { return audioInit; },
    get systemMotion(): MenuBindingViews['systemMotion'] { return systemMotion; },
    get artworkReady() {
        return artworkReady;
      },
    get savedRun() {
        return savedRun;
      },
    get supportPreview() {
        return supportPreview;
      },
    get accessibleUnlocks(): MenuBindingViews['accessibleUnlocks'] { return accessibleUnlocks; },
    get accessible(): MenuBindingViews['accessible'] { return accessible; },
    get DAILY_LOGIN(): MenuBindingViews['DAILY_LOGIN'] { return DAILY_LOGIN; },
    get COLLECTION_PROGRESS(): MenuBindingViews['COLLECTION_PROGRESS'] { return COLLECTION_PROGRESS; },
    get ARMORY_SEEN(): MenuBindingViews['ARMORY_SEEN'] { return ARMORY_SEEN; },
    get SEALS(): MenuBindingViews['SEALS'] { return SEALS; },
    get CHARMCOL(): MenuBindingViews['CHARMCOL'] { return CHARMCOL; },
    get demoKill(): MenuBindingViews['demoKill'] { return demoKill; },
    get ST() {
      return ST;
    },
    get previewVisits(): MenuBindingViews['previewVisits'] { return previewVisits; },
    get buildLeaves(): MenuBindingViews['buildLeaves'] { return buildLeaves; },
    get palette(): MenuBindingViews['palette'] { return palette; },
    get buildBG(): MenuBindingViews['buildBG'] { return buildBG; },
    get buildMist(): MenuBindingViews['buildMist'] { return buildMist; },
    get buildGrass(): MenuBindingViews['buildGrass'] { return buildGrass; },
    get buildWeather(): MenuBindingViews['buildWeather'] { return buildWeather; },
    get setupAttract(): MenuBindingViews['setupAttract'] { return setupAttract; },
    get saveStats(): MenuBindingViews['saveStats'] { return saveStats; },
    get stageSeed() {
      return stageSeed;
    },
    set stageSeed(value) {
      stageSeed = value;
    },
    get MIST() {
      return MIST;
    },
    set MIST(value) {
      MIST = value;
    }
  }));
  
  function testJump(stage: number, wave: number, boss: boolean) {
    if (!isTestProfile()) return;
    SETUP.mode = 'waves';
    startRun();
    G.enemies = [];
    G.pendingSpawns = [];
    G.attacker = null;
    G.boss = null;
    G.so = null;
    G.toSpawn = 0;
    G.pausedFrom = null;
    const ordinal = Math.max(0, Math.min(STAGES.length - 1, Math.floor(stage)));
    G.bossCount = ordinal;
    if (boss) {
      G.wave = ordinal * 3 + 3;
      setStage(ordinal, true);
      G.cfg = waveCfg(G.wave);
      startBoss();
    } else startWave(ordinal * 3 + Math.max(1, Math.min(3, Math.floor(wave))), true);
    G.panel = null;
    showScreen(null);
  }
  
  
  
  const { PRESETS, presetScreen, armory, equipArmory, renderArmory } = armoryWiring;
  function refreshArmoryNew() {
    armoryWiring.refreshArmoryNew();
  }
  
  const { cinematic, sceneFilm, previewStage } = cinematicWiring;
  const { titleTap, konamiInput, bindTitleGestures } = createTitleSecrets(() => ({
    G,
    ST,
    UNL,
    audioInit,
    tn,
    sfx,
    flash,
    saveStats,
    checkUnlocks,
    toast,
  }));
  bindTitleGestures($('title'), lifecycle, () => cinematic.logoTap());
  const { flushProfile } = bindProfileWiring({
    $,
    lifecycle,
    playerStats,
    playerEquipment,
    saveMeta,
    saveAwakening,
    UNL,
  });
  const previewArtwork = { inkCharm, inkCompanion, inkEnemy, inkPlayer, inkSword };
  const preview = createArmoryPreview(
    $('prevC'),
    {
      random: R,
      now: activeNow,
      sounds: sfx,
    },
    previewArtwork,
    surfaces?.get('prevC'),
  );
  const supportPreview = createArmoryPreview(
    $('supportPreview'),
    {
      random: rng(4242),
      now: activeNow,
      sounds: sfx,
    },
    previewArtwork,
    surfaces?.get('supportPreview'),
  );
  lifecycle.add(preview.dispose);
  lifecycle.add(supportPreview.dispose);
  function demoKill() {
    preview.demo(armory.tab === 'fx' ? (armory.selected ?? EQ.fx) : EQ.fx, !!(G.m && G.m.bonk));
  }
  function drawPreview() {
    lightingDebug.refresh();
    preview.draw(
      previewFrame(
        EQ.film === PREMIUM_FILM && !premiumAccess() ? 'mono' : EQ.film,
        armory.tab === 'fx',
      ),
    );
  }
  function previewFrame(film: string, effectsVisible: boolean, target = $('prevC')): PreviewFrame { return equipmentPresentation.previewFrame(film, effectsVisible, target); }
  /* ---------------- input ---------------- */
  const { disposePointer, bindNavigation } = createInputWiring(cvs, {
    $,
    G,
    settings,
    cinematic,
    audioInit,
    onSwipe,
    onTapDown,
    onTap,
    lifecycle,
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
    get W() {
      return W;
    },
    get H() {
      return H;
    },
    get savedRun() {
      return savedRun;
    },
    get activeTrial() {
      return activity.activeTrial;
    },
  });
  bindPurchaseWiring({
    $,
    G,
    lifecycle,
    premiumAccess,
    savedEquipment,
    accessibleUnlocks,
    ITEMS,
    playerEquipment,
    savedFilm,
    META,
    SETUP,
    computeMods,
    renderArmory,
    saveMeta,
    openPanel,
    pause,
    audio,
    guided,
    edition,
    UNL,
    get EQ() {
      return EQ;
    },
    get initialPurchaseCheck() {
      return initialPurchaseCheck;
    },
    set initialPurchaseCheck(value) {
      initialPurchaseCheck = value;
    },
    get testerPremium() {
      return testerPremium;
    },
    set testerPremium(value) {
      testerPremium = value;
    },
    get runTemplate() {
      return runTemplate;
    },
    set runTemplate(value) {
      runTemplate = value;
    },
    get activeTrial() {
      return activity.activeTrial;
    },
    get trialFailure() {
      return activity.trialFailure;
    },
    set trialFailure(value) {
      activity.trialFailure = value;
    },
  });
  const disposeKeyboard = bindNavigation();
  function showPauseScreen() {
    combatHaptics.stop();
    audio.setPaused(true);
    renderPauseBlessings($('paused'), G.bless);
    $('pauseSeed').textContent = activity.activeDaily
      ? `Daily · ${activity.activeDaily.day}`
      : activity.activeTrial
        ? ''
        : `Seed ${G.seed}`;
    showScreen('paused');
    renderTrialObjective();
  }

  
  const phaseRouter = createPhaseRouter(
    context,
    {
      read: () => G.state,
      write: (state) => {
        G.state = state;
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
  const { frameLoop, update, render, drawScene, postPreparation, advancePost, preparePresentation } = createFrameBindings(() => ({
    G, P, WX, R, W, H, S, DPR, L, g, cvs, nativeScene,
    presentationState, environmentState, postArtwork, playerFigures,
    sceneLoading, activeTrial: activity.activeTrial, trialFailure: activity.trialFailure,
    activeDaily: activity.activeDaily, combatRandom: activity.combatRandom,
    finishTrial, updateAmbient, cinematic, reducedMotion, reducedFlashes, audio,
    apparelMotion, updateEnemies, waveConfiguration, liveOrdered, guided,
    bossPhase, phaseRouter, updateFx, renderTrialObjective, updateTransition,
    sceneFilm, pz, buzz, premiumAccess, lightingDebug, lightingRig,
    stageSeed, demonRealmRenderer, environmentRenderer, density,
    blades, drawStains, drawLeaves, drawEnemy, drawBoss, drawFx, drawFx2,
    drawGlyphs, drawSmoke, drawWeather, drawPops, drawStamps,
    screenAnimation, effectQuality, ambient, rebalanceWeather, armory,
    flash, sfx, gustLeaves, drawPreview, settlePresentedScene,
    get hitStop() { return hitStop; }, set hitStop(value) { hitStop = value; },
    get timeScale() { return timeScale; },
  }));
  // Scene readiness belongs to orchestration, never to a drawing call.
  function settlePresentedScene() { return sceneFlow.settlePresentedScene(); }
  function visitToday() {
    const next = recordDailyLogin(DAILY_LOGIN);
    if (!store.set('issen.dailyLogin', next)) return;
    Object.assign(DAILY_LOGIN, next);
    if (!next.earned) return;
    const newlyOwned = !UNL.has(SEVEN_DAWNS_CREST);
    UNL.add(SEVEN_DAWNS_CREST);
    store.set('issen.unlocks', [...UNL]);
    if (newlyOwned && !loginCrestRevealed) {
      loginCrestRevealed = true;
      toast({ k: '暁', msg: 'Unlocked: Seven Dawns crest' });
      refreshArmoryNew();
    }
  }
  bindGraphicsLifecycle(() => ({
    lifecycle, frameLoop, combatHaptics, audio, G, showPauseScreen, cvs,
    nativeScene, $, screenAnimation, visitToday,
    get artworkReady() { return artworkReady; },
  }));

  /* ---------------- boot ---------------- */
  const { resize } = createViewport(() => ({
    cvs, lifecycle, layout, buildBG, buildMist, buildGrass, buildLeaves,
    buildWeather, buildPost, screenAnimation, prepareScene, environmentState,
    get artworkReady() { return artworkReady; },
    get W() { return W; }, set W(value) { W = value; },
    get H() { return H; }, set H(value) { H = value; },
    get DPR() { return DPR; }, set DPR(value) { DPR = value; },
    reposition() {
    for (const e of G.enemies) {
      e.pos = enemyPos(e);
      if (e.state === 'dying') e.deathGround = { ...e.pos };
    }
    if (G.boss) {
      G.boss.pos = bossPos(G.boss);
      if (G.boss.state === 'dying') G.boss.deathGround = { ...G.boss.pos };
    }
    },
  }));
  startRuntime(() => ({
    lifecycle, frameLoop, G, cinematic, savedRun, setupScreen, tutorial, armory,
    notifications, guided, runResults, audio, driftRenderer,
    reducedMotion, reducedFlashes, density, computeMods, applySeal, resize,
    setupAttract, restoreCheckpoint, showPauseScreen, showOver, recoverSupportReward,
    setMuteIcon, refreshArmoryNew, setBestLine, updateSavedRunButtons,
    disposePointer, disposeKeyboard, inkCharm, inkCompanion, inkEnemy, inkPlayer,
    inkSword, environmentRenderer, stageSeed, W, H, DPR, presentationState,
    markArtworkReady() {
      artworkReady = true;
      if (pageActive()) frameLoop.start();
    },
  }));
  return lifecycle.dispose;
}
