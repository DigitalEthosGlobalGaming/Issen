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
import { createEnvironmentArtwork } from './presentation/environment-artwork.ts';
import { createEnvironmentState } from './presentation/environment-state.ts';
import { createCuePresentation } from './presentation/cues.ts';
import {
  createPresentationState,
  advancePresentationClock,
  advancePresentationCamera,
} from './presentation/state.ts';
import { createPostArtwork } from './presentation/post-artwork.ts';
import { createEnvironmentPresentation } from './presentation/environment.ts';
import { createFeedbackPresentation } from './presentation/feedback.ts';
import { createFiguresPresentation } from './presentation/figures.ts';
import { createRuntimeScene } from './presentation/scene.ts';
import { createEventBus, type GameEvents } from './game/events.ts';
import type { GameContext } from './game/session/context.ts';
import type { PresentationContext } from './presentation/context.ts';
import { reportGraphicsError, GRAPHICS_ERROR_EVENT } from './rendering/graphics-error.ts';
import { collectionBlessings } from './game/content/collections.ts';
import {
  parseDailyLogin,
  recordDailyLogin,
  SEVEN_DAWNS_CREST,
} from './game/progression/daily-login.ts';

import {
  parseCollectionProgress,
  initializeCollections,
  syncCollectionProgress,
  collectionItemStats,
} from './game/progression/collection-progress.ts';
import { parsePendingSupport, type PendingSupportReward } from './platform/pending-support.ts';
import { createRewardedSupport } from './platform/rewarded-support.ts';
import { createRewardScreen } from './ui/screens/rewarded-support.ts';
import { setSealTextures } from './rendering/ui-art.ts';

import { dailyRun, dailyResult, type DailyRun } from './game/progression/daily.ts';
import { mountStartupLoading } from './ui/startup-loading.ts';
import { createStageVisitSeeds } from './rendering/environment/stage-variation.ts';
import { compositionKey } from './rendering/environment/worker-types.ts';
import { createInkCharmRenderer } from './rendering/figures/ink-charms.ts';
import { createInkCompanionRenderer } from './rendering/figures/ink-companions.ts';
import { createInkEnemyRenderer } from './rendering/figures/ink-enemy.ts';
import { createInkPlayerRenderer } from './rendering/figures/ink-player.ts';
import { createInkSwordRenderer } from './rendering/figures/ink-sword.ts';
import { createLightingRig } from './rendering/lighting-rig.ts';
import { createUiMaterialLighting } from './ui/material-lighting.ts';
import { disposeUiArt } from './rendering/ui-art.ts';

import { premium } from './platform/purchases.ts';
import { SUPPORTER_FILM_ITEM } from './game/content/items.ts';
import {
  editionAccess,
  itemAccessible,
  trialAccessible,
  type GameEdition,
} from './platform/editions.ts';
import { swiftSlashPoints, precisionZone, duelMasterTimings } from './game/progression/mastery.ts';
import { PREMIUM_FILM } from './platform/premium.ts';
import { testerPremiumActive, parseTesterPremium } from './platform/tester-premium.ts';

import type { Item, ItemCategory } from './game/content/items.ts';
import type { Enemy } from './game/combat/enemy.ts';
import type { Boss } from './game/encounters/boss.ts';

import type { Direction } from './shared/directions.ts';

import { createLifecycle } from './platform/lifecycle.ts';
import { createFrameLoop } from './platform/frame-loop.ts';
import { createRuntimeScreens } from './ui/wiring/screens.ts';
import { createRunState, resetRun } from './game/run-state.ts';
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
import { recordRun } from './game/progression/run-records.ts';
import {
  recordSecretEvent,
  preserveSecretDiscoveries,
  reconcileCinematicCompanion,
} from './game/progression/secret-events.ts';
import {
  createRunRewardLedger,
  accrueRunReward,
  settleRunReward,
  grantSupportEmberBonus,
  supportEmberBonusAmount,
} from './game/progression/run-rewards.ts';
import { protectCombo, recoverAfterWave } from './game/progression/run-powers.ts';
import { resolveDamage } from './game/combat/damage.ts';
import {
  createStandoff,
  updateStandoff as simulateStandoff,
  resolveStandoffSwipe,
} from './game/encounters/standoff.ts';
import { targetSwipe } from './game/combat/targeting.ts';
import { bossShownDirection, parryOpening } from './game/encounters/boss-openings.ts';
import { createBoss } from './game/encounters/boss-create.ts';
import { bossPosition } from './rendering/figures/boss-position.ts';
import { initialSpawns, updateWave as simulateWave } from './game/encounters/waves.ts';
import { createGrunt as createEnemy } from './game/combat/grunt-spawn.ts';
import { pickEnemyLook, orderedEnemies, selectAttacker } from './game/combat/enemy-spawn.ts';
import { enemyPosition } from './rendering/figures/enemy-position.ts';
import { advanceGrunts as simulateEnemies } from './game/combat/grunt.ts';
import { createDriftRenderer } from './rendering/scene/drift-renderer.ts';
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

import { shrineOffers, applyBlessing, crossroadsCurse } from './game/shrine/blessings.ts';
import {
  startBlessingWave,
  recordBlessingCut,
  recordComboBreak,
  nextBlessingAttacker,
} from './game/shrine/triggered.ts';
import { renderShrine } from './ui/screens/shrine.ts';
import { createNotifications } from './ui/notifications.ts';
import { modeKey as getModeKey } from './game/progression/modes.ts';

import { unlockEligibleItems } from './game/progression/unlocks.ts';
import { parseArmorySeen } from './game/progression/armory-seen.ts';
import { makeFig, EPOSE } from './shared/figure-model.ts';
import { createPostPresentation } from './presentation/post.ts';
import { createPostPreparation } from './presentation/post-preparation.ts';

import { createDemonRealmRenderer } from './rendering/environment/demon-realm.ts';
import type { createBackground } from './rendering/scene/background.ts';
import { createEnvironmentRenderer } from './rendering/environment/index.ts';
import { createPalette } from './rendering/palette.ts';
import { waveConfig, bossParameters } from './game/encounters/configuration.ts';

import { createAdminWiring } from './ui/wiring/admin.ts';

import { createGuidedLessons } from './game/onboarding/guided-lessons.ts';
import {
  parseMeta,
  templateModifiers,
  templatePowers,
  unlockBossMilestone,
  pendingModeReveals,
  markModeRevealsSeen,
  sanitizeSetup,
} from './game/progression/meta.ts';
import { createLayout } from './rendering/layout.ts';
import { BLADES, ROBES } from './game/content/cosmetics.ts';
import { SPECIAL, STEEL_THIRD } from './game/content/awakenings.ts';
import { ROBE_AWAKENINGS } from './game/content/robe-awakenings.ts';
import { parseAwakeningProgress, recordChallenge } from './game/progression/awakening-progress.ts';
import type { BladeStats } from './game/progression/statistics.ts';
import { normalLives } from './game/equipment/lives.ts';
import { interceptWithTanto } from './game/combat/tanto.ts';
import { throwKnife, refillDuelKnives } from './game/combat/knife.ts';

import { BLESS, BLESS_BY } from './game/content/blessings.ts';
import {
  loadStatistics,
  parseStatistics,
  loadSetup,
  loadUnlocks,
  loadEquipment,
  parseEquipment,
  DEFAULT_EQUIPMENT,
} from './platform/saves.ts';
import { createItems } from './game/content/items.ts';
import { TRIALS } from './game/content/trials.ts';
import type { TrialDefinition } from './game/content/trials.ts';
import {
  parseTrialProgress,
  trialsUnlocked,
  trialPassed,
  trialFailureAfterCut,
  completeTrial,
  grantTrialRewards,
} from './game/progression/trials.ts';

import { renderPauseBlessings } from './ui/screens/pause.ts';
import { itemPresentation } from './ui/screens/item-presentation.ts';
import type { TrialResult } from './ui/screens/trials.ts';
import { DEATH_REASONS } from './ui/screens/game-over.ts';

import { createAudio } from './audio/audio.ts';
import { computeModifiers } from './game/equipment/modifiers.ts';
import { store, isTestProfile } from './platform/storage.ts';
import { STAGES } from './game/content/stages.ts';
import { TAU, clamp, lerp } from './shared/math.ts';
import { rng, restorableRng, newRunSeed } from './shared/random.ts';
import {
  readRunCheckpoint,
  writeRunCheckpoint,
  clearRunCheckpoint,
} from './platform/run-checkpoint.ts';
import type { RunCheckpoint } from './platform/run-checkpoint.ts';
import { DIRS, OPP, DANG, directionMatches } from './shared/directions.ts';
import { kanji, roman } from './shared/format.ts';
import { createHaptics, createCombatHaptics } from './platform/haptics.ts';
export function startGame(
  surfaces: ReadonlyMap<string, import('./rendering/scene-surface.ts').SceneSurface>,
  lighting?: {
    rig: ReturnType<typeof createLightingRig>;
    ui: ReturnType<typeof createUiMaterialLighting>;
  },
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
  const environmentRenderer = createEnvironmentRenderer(cvs.ownerDocument);
  lifecycle.add(environmentRenderer.dispose);
  const demonRealmRenderer = createDemonRealmRenderer(cvs.ownerDocument);
  lifecycle.add(demonRealmRenderer.dispose);
  const inkCharm = createInkCharmRenderer(cvs.ownerDocument);
  const inkCompanion = createInkCompanionRenderer(cvs.ownerDocument);
  const inkEnemy = createInkEnemyRenderer(cvs.ownerDocument);
  const inkPlayer = createInkPlayerRenderer(cvs.ownerDocument);
  const inkSword = createInkSwordRenderer(cvs.ownerDocument);
  const lightingRig = lighting?.rig ?? createLightingRig();
  const uiMaterialLighting =
    lighting?.ui ?? createUiMaterialLighting(cvs.ownerDocument, lightingRig);
  if (!lighting) lifecycle.add(uiMaterialLighting.dispose);
  lifecycle.add(() => disposeUiArt(cvs.ownerDocument));
  lifecycle.add(inkCharm.dispose);
  lifecycle.add(inkCompanion.dispose);
  lifecycle.add(inkEnemy.dispose);
  lifecycle.add(inkPlayer.dispose);
  lifecycle.add(inkSword.dispose);
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
  const BASEBLADE = {
    len: 0.52,
    d: '#5c5a56',
    m: '#a8a59f',
    l: '#f6f3ec',
    edge: 'rgba(255,253,246,.9)',
  };
  const CHARMCOL: Record<string, string> = {
    'pilgrims-bead': '#7e654c',
    'first-strike': '#b8322a',
    suzu: '#b8923a',
    maneki: '#b0322a',
    daruma: '#8c1f14',
    kitsunebi: '#2f5c8a',
    furin: '#3f7a8c',
    ofuda: '#7a6a4a',
    kinun: '#a67c22',
    kachi: '#1f4a2a',
    shingan: '#5a2a6a',
    ryoen: '#a8456a',
    kagami: '#5f6b75',
    omikuji: '#6b5a3a',
    hisshou: '#a3271d',
    kaiun: '#b8923a',
    yakuyoke: '#2d3e72',
    enmei: '#2f6f55',
    shobai: '#9c7a1f',
    kotsu: '#7a7466',
    gakugyo: '#6b3f7a',
  };
  const ITEM_BY: Record<string, Item> = {};
  for (const it of ITEMS) ITEM_BY[it.id] = it;
  const robePal = palette.robe;

  /* ---------------- persistent stats & unlocks ---------------- */

  let ST = loadStatistics();
  const SETUP = loadSetup();
  const UNL = loadUnlocks();
  const DAILY_LOGIN = parseDailyLogin(store.get('issen.dailyLogin', null));
  if (UNL.has(SEVEN_DAWNS_CREST)) DAILY_LOGIN.earned = true;
  let loginCrestRevealed = false;
  if (reconcileCinematicCompanion(ST, UNL)) store.set('issen.unlocks', [...UNL]);
  UNL.delete(PREMIUM_FILM);
  if (premiumAccess()) UNL.add(PREMIUM_FILM);
  const TRIAL_PROGRESS = parseTrialProgress(store.get('issen.trials', null));
  grantTrialRewards(TRIAL_PROGRESS, UNL);
  const playerStats = ST;
  let activeTrial: TrialDefinition | null = null;
  let activeDaily: DailyRun | null = null;
  let trialFailure = '';
  let trialResult: TrialResult | null = null;
  let combatRandom = R;
  let runRandom = restorableRng(0);
  let runTrialsWasUnlocked = trialsUnlocked(playerStats.roninWave);
  const META = parseMeta(store.get('issen.meta', null), ST, UNL);
  const AWAKENING = parseAwakeningProgress(store.get('issen.awakening', null), ST.bl);
  const saveAwakening = () => store.set('issen.awakening', AWAKENING);
  saveAwakening();
  const COLLECTION_PROGRESS = parseCollectionProgress(store.get('issen.collections', null), ST);
  initializeCollections(COLLECTION_PROGRESS, META, ST);
  const saveCollections = () => store.set('issen.collections', COLLECTION_PROGRESS);
  const syncCollections = () => {
    if (!activeTrial && !activeDaily && !['title'].includes(G.state))
      syncCollectionProgress(COLLECTION_PROGRESS, META, ST, G);
  };
  const saveMeta = () => {
    initializeCollections(COLLECTION_PROGRESS, META, ST);
    saveCollections();
    return store.set('issen.meta', META);
  };
  saveMeta();
  const ARMORY_SEEN = parseArmorySeen(store.get('issen.armorySeen', null), UNL);
  store.set('issen.armorySeen', [...ARMORY_SEEN]);
  Object.assign(SETUP, sanitizeSetup(SETUP, META));
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
    if (!activeTrial && !activeDaily) {
      syncCollections();
      saveCollections();
      store.set('issen.stats', ST);
    }
  };
  const revokedSave = store.get('issen.revoked', []);
  const revoked = new Set<string>(
    isTestProfile() && Array.isArray(revokedSave)
      ? revokedSave.filter((id): id is string => typeof id === 'string')
      : [],
  );
  const accessibleUnlocks = () => new Set([...UNL].filter(accessible));
  let EQ = loadEquipment(accessibleUnlocks(), ITEMS);
  const playerEquipment = EQ;
  const savedFilm = (store.get('issen.equip', {}) as { film?: unknown } | null)?.film;
  const savedEquipment = store.get('issen.equip', {});
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
  const environmentState = createEnvironmentState();
  const {
    buildBG,
    buildMist,
    buildGrass,
    newLeaf,
    buildLeaves,
    gustLeaves,
    buildWeatherArtwork,
    rebalanceWeather,
  } = createEnvironmentArtwork(cvs.ownerDocument, () => ({
    W,
    H,
    DPR,
    S,
    stage: G.stage,
    environmentState,
    L,
    R,
    density,
    context2d,
    ambient,
  }));

  /* ---------------- ambient ---------------- */

  const WX = createWeatherState(() => 0.5);

  const driftRenderer = createDriftRenderer();

  lifecycle.add(driftRenderer.dispose);
  const {
    ambient,
    blades,
    drawLeaves,
    weatherRenderer,
    drawWeather,
    drawSmoke,
    updateAmbient,
    updateTransition,
  } = createEnvironmentPresentation(() => ({
    environmentState,
    activeTrial,
    previewDemon: environmentState.previewDemon,
    G,
    W,
    H,
    S,
    L,
    R,
    density,
    driftRenderer,
    reducedMotion,
    g,
    fg: environmentState.fg,
    time: presentationState.time,
    wind: presentationState.wind,
    leaves: environmentState.leaves,
    wx: environmentState.wx,
    bamboo: environmentState.bamboo,
    cinematic,
    cinematicWeather: environmentState.cinematicWeather,
    WX,
    smokeSprite: environmentState.smokeSprite,
  }));
  function buildWeather(resetSimulation = true) {
    buildWeatherArtwork();
    if (resetSimulation) Object.assign(WX, createWeatherState(combatRandom));
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
  const {
    figureRenderer,
    drawFigure,
    drawSplit,
    drawPetAt,
    drawSword,
    drawGlint,
    tipOf,
    drawEnemy,
    drawBoss,
  } = createFiguresPresentation(() => ({
    g,
    inkCharm,
    inkCompanion,
    inkEnemy,
    inkPlayer,
    inkSword,
    time: presentationState.time,
    wind: presentationState.wind,
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
  const playerFigures = createPlayerFigures(() => ({
    G,
    L,
    g,
    presentationState,
    EQ,
    H,
    W,
    drawPetAt,
    P,
    drawFigure,
    apparelMotion,
    playerRobePalette,
    isRobeSp,
    bladeStyle,
    CHARMCOL,
    petOf,
  }));
  /* ---------------- ensō glyph ---------------- */
  const { drawEnso, drawGlyphs } = createCuePresentation(() => ({
    g,
    time: presentationState.time,
    SEAL,
    SEALARC,
    FONT,
    pz,
    G,
    ordered: () => waveConfiguration().ordered,
    liveOrdered,
    veil: WX.veil,
  }));
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
        return runRandom;
      },
      set random(value) {
        runRandom = value;
        combatRandom = value.next;
      },
      get equipment() {
        return EQ;
      },
      set equipment(value) {
        EQ = value;
      },
      setup: SETUP,
      get trial() {
        return activeTrial;
      },
      set trial(value) {
        activeTrial = value;
      },
      get daily() {
        return activeDaily;
      },
      set daily(value) {
        activeDaily = value;
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
    activeTrial,
    activeDaily,
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
    activeTrial,
    accessible,
    runTemplate,
  }));
  function powersEnabled() { return activeEquipment.powersEnabled(); }
  function isSp() { return activeEquipment.isSp(); }
  function isSteelThird() { return activeEquipment.isSteelThird(); }
  function isRobeSp() { return activeEquipment.isRobeSp(); }
  function playerRobePalette() {
    const base = robePal(EQ.robe);
    const accent = isRobeSp() ? ROBE_AWAKENINGS[EQ.robe]?.st?.c : null;
    return accent
      ? { ...base, robeL: `rgb(${accent})`, inner: `rgb(${accent})`, obi: `rgb(${accent})` }
      : base;
  }
  function challenge(metric: keyof BladeStats, value = 1) { return profileRules.challenge(metric, value); }
  function bladeMods() { return activeEquipment.bladeMods(); }
  function bladeStyle() {
    const b = BLADES[EQ.blade];
    if (isSteelThird())
      return {
        ...(b || BASEBLADE),
        aura: STEEL_THIRD.aura,
        glow: 'rgba(170,225,255,.62)',
        edge: 'rgba(225,248,255,.98)',
        edgeW: 0.008,
      };
    return isSp()
      ? Object.assign(
          {},
          b || BASEBLADE,
          { aura: SPECIAL[EQ.blade]!.aura },
          SPECIAL[EQ.blade]!.st || {},
        )
      : b;
  }
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
    activeTrial,
    get trialFailure() {
      return trialFailure;
    },
    set trialFailure(value) {
      trialFailure = value;
    },
  }));
  function bumpCombo() {
    combatScore.bumpCombo();
  }

  const { hudView, screenAnimation, showScreen, renderLives, hud, setScore, banner, renderHp } =
    createRuntimeScreens($('app'), activeNow, () => ({
      G,
      activeDaily: !!activeDaily,
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
    activeTrial,
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
    if (activeTrial || activeDaily) return;
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
  const { captureCheckpoint, restoreCheckpoint, continueSavedRun, abandonSavedRun } =
    createCheckpointFlow({
      adoptPhase: () => phaseRouter.adoptCheckpoint(),
      $,
      AWAKENING,
      COLLECTION_PROGRESS,
      G,
      META,
      SETUP,
      UNL,
      WX,
      DAILY_LOGIN,
      ITEMS,
      accessibleUnlocks,
      applySeal,
      bossPos,
      computeMods,
      enemyPos,
      hud,
      playerEquipment,
      playerStats,
      premiumAccess,
      renderHp,
      renderLives,
      saveAwakening,
      saveMeta,
      saveStats,
      saveCollections,
      setScore,
      setStage,
      syncCollections,
      toast,
      updateSavedRunButtons,
      showScreen,
      showShrineOffers,
      showOver,
      persistence: {
        read: readRunCheckpoint,
        write: writeRunCheckpoint,
        clear: clearRunCheckpoint,
      },
      storage: store,
      resetClock: () => frameLoop.resetClock(),
      get activeTrial() {
        return activeTrial;
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
        return activeDaily;
      },
      set activeDaily(value) {
        activeDaily = value;
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
        return runRandom;
      },
      set runRandom(value) {
        runRandom = value;
      },
      get runTemplate() {
        return runTemplate;
      },
      set runTemplate(value) {
        runTemplate = value;
      },
      get combatRandom() {
        return combatRandom;
      },
      set combatRandom(value) {
        combatRandom = value;
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
    });
  function addScore(pts: number, x: number, y: number, label?: string, size?: number) {
    return combatScore.addScore(pts, x, y, label, size);
  }
  /* ---------------- enemies ---------------- */
  function enemyPos(e: Enemy) {
    return enemyPosition(e, L, W, H);
  }
  function spawnEnemy(slot: number, attract = false) {
    if (activeTrial && !attract && G.toSpawn <= 0) return;
    return createEnemy(G, slot, attract, enemyPos, attract ? R : combatRandom);
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
    return selectAttacker(G.enemies, waveConfiguration().ordered, combatRandom);
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
  const { startRun, startDaily, startTrial, nextStep, startRushDuel } = createRunStart({
    events: context.events,
    $,
    G,
    META,
    P,
    PREST,
    SETUP,
    apparelMotion,
    audio,
    checkUnlocks,
    clearHints,
    computeMods,
    guided,
    hint,
    hud,
    playerStats,
    playerEquipment,
    premiumAccess,
    prepareScene,
    presentationState,
    saveStats,
    setScore,
    setStage,
    showScreen,
    stageVisits,
    startTrialEncounter,
    startWave,
    startBoss,
    toast,
    applySeal,
    audioInit,
    buildLeaves,
    waveCfg,
    clearTrialResult() {
      trialResult = null;
    },
    clearCheckpoint: clearRunCheckpoint,
    newRunSeed,
    resetWeather(random) {
      Object.assign(WX, createWeatherState(random));
    },
    clearEffects() {
      for (const [key, particles] of Object.entries(presentationState.fx))
        if (key !== 'scratches') particles.length = 0;
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
      return activeDaily;
    },
    set activeDaily(value) {
      activeDaily = value;
    },
    get activeTrial() {
      return activeTrial;
    },
    set activeTrial(value) {
      activeTrial = value;
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
    get runItemReveals() {
      return runItemReveals;
    },
    set runItemReveals(value) {
      runItemReveals = value;
    },
    get runRandom() {
      return runRandom;
    },
    set runRandom(value) {
      runRandom = value;
    },
    get runTemplate() {
      return runTemplate;
    },
    set runTemplate(value) {
      runTemplate = value;
    },
    get combatRandom() {
      return combatRandom;
    },
    set combatRandom(value) {
      combatRandom = value;
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
    get runTrialsWasUnlocked() {
      return runTrialsWasUnlocked;
    },
    set runTrialsWasUnlocked(value) {
      runTrialsWasUnlocked = value;
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
      return trialFailure;
    },
    set trialFailure(value) {
      trialFailure = value;
    },
  });
  const trialSession = createTrialSession(() => ({
    events: context.events,
    G,
    TRIAL_PROGRESS,
    UNL,
    R,
    playerStats,
    playerEquipment,
    deferUntilSceneReady,
    waveCfg,
    startBoss,
    renderHp,
    banner,
    setWaveLabel: (label) => {
      $('waveLbl').textContent = label;
    },
    renderTrialObjective,
    store,
    sfx,
    buildLeaves,
    guided,
    audio,
    hideTrialObjective: () => {
      $('trialObjective').hidden = true;
    },
    toTitle,
    computeMods,
    openPanel,
    focusTrialResult: () => {
      $('trials')
        .querySelector<HTMLButtonElement>('#trialResult button')
        ?.focus({ preventScroll: true });
    },
    get activeTrial() {
      return activeTrial;
    },
    set activeTrial(value) {
      activeTrial = value;
    },
    get trialFailure() {
      return trialFailure;
    },
    set trialFailure(value) {
      trialFailure = value;
    },
    get trialResult() {
      return trialResult;
    },
    set trialResult(value) {
      trialResult = value;
    },
    get ST() {
      return ST;
    },
    set ST(value) {
      ST = value;
    },
    get EQ() {
      return EQ;
    },
    set EQ(value) {
      EQ = value;
    },
    get combatRandom() {
      return combatRandom;
    },
    set combatRandom(value) {
      combatRandom = value;
    },
    get hitStop() {
      return hitStop;
    },
    set hitStop(value) {
      hitStop = value;
    },
  }));
  function startTrialEncounter() {
    trialSession.startTrialEncounter();
  }
  function finishTrial(message?: string) {
    trialSession.finishTrial(message);
  }
  function renderTrialObjective() {
    const trial = activeTrial;
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
  const waveLifecycle = createWaveLifecycle(() => ({
    events: context.events,
    G,
    ST,
    W,
    H,
    S,
    combatRandom,
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
  }));
  function startWave(n: number, skipEvent = false) {
    waveLifecycle.startWave(n, skipEvent);
  }
  function updateWave(dt: number) {
    waveLifecycle.updateWave(dt);
  }
  const readKillViews = () => ({
    events: context.events,
    G,
    pz,
    enemyPos,
    combatRandom,
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
    activeTrial,
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
      return trialFailure;
    },
    set trialFailure(value) {
      trialFailure = value;
    },
    gustLeaves,
    notifications,
    hideHint,
    liveOrdered,
    checkUnlocks,
    deathAppearance(perfect: boolean, bonk: boolean, dir: Direction) {
      const deathType =
        !G.m.bonk && accessible(EQ.fx) && EQ.fx === 'scattered-armour'
          ? 'scatter'
          : !G.m.bonk &&
              accessible(EQ.fx) &&
              ['falling-leaves', 'ember-ash', 'ink-wash'].includes(EQ.fx)
            ? 'dissolve'
            : chooseDeathStyle(perfect, !!G.m.bonk, R);
      const fallDir = dir === 'left' ? -1 : dir === 'right' ? 1 : R() < 0.5 ? -1 : 1;
      return { deathType, fallDir };
    },
    disarm(pos: Enemy['pos']) {
      const q = pos,
        s2 = q.h / 160;
      presentationState.fx.swords.push({
        x: q.x + q.h * 0.1,
        y: q.y - q.h * 0.6,
        vx: (R() - 0.5) * 260 * s2,
        vy: -(380 + R() * 200) * s2,
        ang: R() * TAU,
        vr: (R() < 0.5 ? -1 : 1) * (10 + R() * 6),
        len: q.h * 0.5,
        ground: q.y + q.h * 0.01,
        t: 0,
        stuck: false,
        life: 2.4,
      });
    },
    coin(pos: Enemy['pos']) {
      presentationState.fx.coins.push({
        x0: pos.x,
        y0: pos.y - pos.h * 0.6,
        t: 0,
        life: 0.8,
      });
    },
    stain(P0: Enemy['pos']) {
      presentationState.fx.stains.push({
        x: P0.x + (R() - 0.5) * P0.h * 0.2,
        y: P0.y + P0.h * 0.01,
        rx: P0.h * (0.12 + R() * 0.1),
        t: 0,
        life: SHADOW_DURATION,
      });
    },
    shake: (amount: number) => {
      presentationState.shake = Math.max(presentationState.shake, amount);
    },
  });
  const killRules = createEnemyKill(readKillViews);
  lifecycle.add(
    bindCombatProgression(context.events, () => ({ ST, bst, challenge, checkUnlocks })),
  );
  lifecycle.add(bindEncounterProgression(context.events, () => ({ ST, bst, challenge })));
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
  const wavesPhase = createWavesPhase<GameContext<PresentationContext>>(
    () => ({
      events: context.events,
      G,
      W,
      ST,
      activeTrial,
      combatRandom,
      waveConfiguration,
      killEnemy,
      orderSucceeded: () => guided.orderSucceeded(),
      pop,
      sfx,
      swingPlayer,
      playerDie,
      enemyPos,
      earn,
      addScore,
      comboMult,
      sparks,
      buzz,
      hud,
      saveStats,
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
    }),
    waveLifecycle,
  );
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
  const bossPhase = createBossPhase<GameContext<PresentationContext>>(
    () => ({
      events: context.events,
      deferUntilSceneReady,
      G,
      renderLives,
      bossPos,
      banner,
      renderHp,
      sfx,
      activeTrial,
      activeDaily,
      guided,
      hint,
      captureCheckpoint,
      combatRandom,
      flash,
      playerDie,
      breakCombo,
      setScore,
      pop,
      bossTipWorld,
      S,
      swingPlayer,
      sparks,
      ring,
      get hitStop() {
        return hitStop;
      },
      set hitStop(value) {
        hitStop = value;
      },
      combatHaptics,
      letterbox,
      ST,
      bumpCombo,
      addScore,
      comboMult,
      buzz,
      notifications,
      hideHint,
      addSlash,
      killFx,
      scraps,
      stamp,
      W,
      H,
      punch,
      EQ,
      earn,
      get runBossMilestone() {
        return runBossMilestone;
      },
      set runBossMilestone(value) {
        runBossMilestone = value;
      },
      bst,
      challenge,
      inkBurst,
      saveStats,
      checkUnlocks,
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
    }),
    context,
  );
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
  const standoffPhase = createStandoffPhase<GameContext<PresentationContext>>(
    () => ({
      events: context.events,
      deferUntilSceneReady,
      G,
      waveCfg,
      L,
      combatRandom,
      pickLook,
      enemyPos,
      banner,
      letterbox,
      sfx,
      hint,
      captureCheckpoint,
      startWave,
      flash,
      playerDie,
      W,
      H,
      accessible,
      EQ,
      swingPlayer,
      addSlash,
      S,
      killFx,
      scraps,
      ring,
      stamp,
      punch,
      get hitStop() {
        return hitStop;
      },
      set hitStop(value) {
        hitStop = value;
      },
      combatHaptics,
      bumpCombo,
      ST,
      challenge,
      earn,
      addScore,
      comboMult,
      saveStats,
      checkUnlocks,
      makeFigure: makeFig,
      guardPose: EPOSE.guard,
      setWaveLabel: (label) => {
        $('waveLbl').textContent = label;
      },
      clearLetterbox: () => {
        presentationState.lbT = 0;
      },
    }),
    context,
  );
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
  const shrinePhase = createShrinePhase<GameContext<PresentationContext>>(() => ({
    G,
    ST,
    combatRandom,
    renderLives,
    toast,
    nextStep,
    captureCheckpoint,
    showShrineOffers,
    premiumAccess,
    saveStats,
    computeMods,
    checkUnlocks,
    hud,
    showScreen,
    sfx,
    resetKnocks: () => {
      knocks = 0;
    },
    get shrineOfferIds() {
      return shrineOfferIds;
    },
    set shrineOfferIds(value) {
      shrineOfferIds = value;
    },
  }));
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
  const deathPhase = createDeathPhase<GameContext<PresentationContext>>(() => ({
    events: context.events,
    G,
    get timeScale() {
      return timeScale;
    },
    set timeScale(value) {
      timeScale = value;
    },
    breakCombo,
    renderLives,
    setScore,
    hud,
    startBoss,
    startWave,
    captureCheckpoint,
    banner,
    stamp,
    S,
    flash,
    L,
    addSlash,
    inkBurst,
    get hitStop() {
      return hitStop;
    },
    set hitStop(value) {
      hitStop = value;
    },
    sfx,
    combatHaptics,
    pop,
    W,
    H,
    waveConfiguration,
    activeTrial,
    get trialFailure() {
      return trialFailure;
    },
    set trialFailure(value) {
      trialFailure = value;
    },
    bossSwipe,
    killEnemy,
    ST,
    saveStats,
    checkUnlocks,
    scraps,
    letterbox,
    clearHints,
    clearLetterbox: () => {
      presentationState.lbT = 0;
    },
    resetPlayer: () => {
      P.fall = 0;
      P.pose = { ...PREST };
    },
    inkPulse: (value) => {
      presentationState.inkPulse = value;
    },
    shake: (amount) => {
      presentationState.shake = Math.max(presentationState.shake, amount);
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
  }));
  function playerDie(killer: Enemy | Boss | null, reason: string) {
    deathPhase.playerDie(killer, reason);
  }
  function finishDaily() { resultsSession.finishDaily(); }
  const rewardSupport = createRewardedSupport();
  const rewardScreen = createRewardScreen(document.getElementById('app')!);
  lifecycle.add(rewardScreen.dispose);
  let rewardFlowBusy = false;
  const resultsSession = createResultsSession(() => ({
    events: context.events,
    activeDaily,
    G,
    guided,
    audio,
    get timeScale() { return timeScale; }, set timeScale(value) { timeScale = value; },
    presentationState,
    clearHints,
    $,
    META,
    showScreen,
    hud,
    get savedRun() { return savedRun; }, set savedRun(value) { savedRun = value; },
    updateSavedRunButtons,
    get sceneContinuation() { return sceneContinuation; }, set sceneContinuation(value) { sceneContinuation = value; },
    get rewardFlowBusy() { return rewardFlowBusy; }, set rewardFlowBusy(value) { rewardFlowBusy = value; },
    activeTrial,
    rewardScreen,
    supportPremium,
    testerPremium,
    lifecycle,
    rewardSupport,
    captureCheckpoint,
    reviveDaruma,
    finishTrial,
    ST,
    challenge,
    saveStats,
    runBossMilestone,
    SETUP,
    checkUnlocks,
    rewardLedger,
    runTrialsWasUnlocked,
    saveMeta,
    runResults,
    runItemReveals,
    setBestLine,
    toast,
    modeKey,
    store,
    clearRunCheckpoint,
    renderGameOver,
  }));
  // Support benefits are independent of Web collection access.
  const supportPremium = () =>
    premium.state.owned || edition === 'premium' || testerPremiumActive(testerPremium);
  function showOver() { resultsSession.showOver(); }
  async function claimEmberBonus(pending: PendingSupportReward) { return resultsSession.claimEmberBonus(pending); }
  function recoverSupportReward() { resultsSession.recoverSupportReward(); }
  const { toTitle, pause, resume, endRun } = createRunFlow({
    $,
    G,
    playerStats,
    playerEquipment,
    applySeal,
    clearHints,
    refreshArmoryNew,
    showScreen,
    hud,
    presentationState,
    setStage,
    setupAttract,
    P,
    PREST,
    saveStats,
    checkUnlocks,
    showPauseScreen,
    audio,
    guided,
    showShrineOffers,
    renderTrialObjective,
    captureCheckpoint,
    showOver,
    setBestLine: () => setBestLine(),
    resetClock: () => frameLoop.resetClock(),
    get ST() {
      return ST;
    },
    set ST(value) {
      ST = value;
    },
    get EQ() {
      return EQ;
    },
    set EQ(value) {
      EQ = value;
    },
    get activeDaily() {
      return activeDaily;
    },
    set activeDaily(value) {
      activeDaily = value;
    },
    get timeScale() {
      return timeScale;
    },
    set timeScale(value) {
      timeScale = value;
    },
    get shrineOfferIds() {
      return shrineOfferIds;
    },
    get contextLost() {
      return !!nativeScene?.contextLost;
    },
  });
  const { setBestLine, openPanel, closePanel, renderStats } = createPanelWiring(() => ({
    $,
    playerStats,
    ST,
    G,
    hudView,
    supportPreview,
    previewFrame,
    testerPremium,
    renderArmory,
    renderSetup,
    META,
    saveMeta,
    premiumAccess,
    showAdmin,
    TRIAL_PROGRESS,
    trialResult,
    startTrial,
    showScreen,
    UNL,
    ITEMS,
    setBestLine,
    renderStats,
    clearTrialResult() {
      trialResult = null;
    },
  }));
  const { setupScreen, renderSetup, tutorial, launchTutorial } = createSetupWiring({
    $,
    SETUP,
    META,
    ITEM_BY,
    saveMeta,
    premiumAccess,
    sfx,
    toTitle,
    reducedMotion,
    get EQ() {
      return EQ;
    },
  });
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
  const { showAdmin } = createAdminWiring($('adminContent'), {
    AWAKENING,
    G,
    ITEMS,
    ITEM_BY,
    META,
    SETUP,
    UNL,
    applySeal,
    checkUnlocks,
    computeMods,
    hud,
    launchTutorial,
    playerEquipment,
    playerStats,
    refreshArmoryNew,
    renderLives,
    renderSetup,
    revoked,
    saveAwakening,
    saveMeta,
    setBestLine,
    showScreen,
    testJump,
    toast,
    get EQ() {
      return EQ;
    },
    setTrialsWasUnlocked(value) {
      runTrialsWasUnlocked = value;
    },
  });
  const { scrollMenus, applySettings, saveSettings, lightingDebug, options } = createSettingsWiring(
    {
      $,
      G,
      cvs,
      screenAnimation,
      lifecycle,
      settings,
      reducedMotion,
      reducedFlashes,
      prepareScene,
      combatHaptics,
      audio,
      setMuteIcon,
      presentationState,
      environmentState,
      ambient,
      rebalanceWeather,
      lightingRig,
      previewFrame,
      audioInit,
      closePanel,
      launchTutorial,
      systemMotion,
      get artworkReady() {
        return artworkReady;
      },
      get savedRun() {
        return savedRun;
      },
      get supportPreview() {
        return supportPreview;
      },
    },
  );
  const armoryWiring = createArmoryWiring({
    $,
    META,
    ITEMS,
    accessibleUnlocks,
    accessible,
    computeMods,
    applySeal,
    G,
    UNL,
    premiumAccess,
    DAILY_LOGIN,
    COLLECTION_PROGRESS,
    ARMORY_SEEN,
    SEALS,
    CHARMCOL,
    AWAKENING,
    SETUP,
    saveMeta,
    toast,
    sfx,
    demoKill,
    openPanel,
    lifecycle,
    get EQ() {
      return EQ;
    },
    get ST() {
      return ST;
    },
  });
  const { PRESETS, presetScreen, armory, equipArmory, renderArmory } = armoryWiring;
  function refreshArmoryNew() {
    armoryWiring.refreshArmoryNew();
  }
  const cinematicWiring = createCinematicWiring({
    $,
    G,
    previewVisits,
    environmentState,
    buildLeaves,
    palette,
    buildBG,
    buildMist,
    buildGrass,
    buildWeather,
    prepareScene,
    setupAttract,
    settings,
    ITEMS,
    accessible,
    UNL,
    saveStats,
    toast,
    cvs,
    lifecycle,
    get EQ() {
      return EQ;
    },
    get ST() {
      return ST;
    },
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
    },
  });
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
  function previewFrame(film: string, effectsVisible: boolean, target = $('prevC')): PreviewFrame {
    const rb = ROBES[EQ.robe] || {};
    return {
      lighting: lightingRig.lighting(target.width, target.height),
      time: presentationState.time,
      wind: presentationState.wind,
      effectDensity: density(),
      reducedMotion: reducedMotion(),
      reducedFlashes: reducedFlashes(),
      petActive: G.petT > 0,
      palette: cols,
      background: environmentState.bg,
      appearance: {
        d: P.d,
        pal: playerRobePalette(),
        robeAura: isRobeSp() ? ROBE_AWAKENINGS[EQ.robe]?.aura : null,
        blade: bladeStyle(),
        bladeId: EQ.blade,
        robeId: EQ.robe,
        variant: rb.variant,
        cape: rb.cape,
        coat: rb.coat,
        rf: rb,
        charm: CHARMCOL[EQ.charm],
        charmId: EQ.charm,
        crest: EQ.crest === 'nocrest' ? null : EQ.crest,
        pet: petOf(),
      },
      pet: EQ.pet,
      film,
      effectsVisible,
      font: FONT,
      seal: SEAL,
      mistSprite: environmentState.mistSprite,
    };
  }

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
      return activeTrial;
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
      return activeTrial;
    },
    get trialFailure() {
      return trialFailure;
    },
    set trialFailure(value) {
      trialFailure = value;
    },
  });
  const disposeKeyboard = bindNavigation();
  function showPauseScreen() {
    combatHaptics.stop();
    audio.setPaused(true);
    renderPauseBlessings($('paused'), G.bless);
    $('pauseSeed').textContent = activeDaily
      ? `Daily · ${activeDaily.day}`
      : activeTrial
        ? ''
        : `Seed ${G.seed}`;
    showScreen('paused');
    renderTrialObjective();
  }

  const betweenPhase = createBetweenPhase<GameContext<PresentationContext>>(() => ({
    G,
    activeTrial,
    trialFailure,
    finishTrial,
    startTrialEncounter,
    startBoss,
    openShrine,
    nextStep,
  }));
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
  /* ---------------- update ---------------- */
  function updatePlayer(dt: number) {
    updatePlayerAnimation(P, dt, G.state === 'dead' || G.state === 'over');
  }
  function updateWeather(dt: number) {
    simulateWeather(
      cinematic.active ? environmentState.cinematicWeather : WX,
      environmentState.wx,
      dt,
      {
        weather: STAGES[G.stage]!.weather,
        phase: G.state,
        width: W,
        height: H,
        scale: S,
        wind: presentationState.wind,
        time: presentationState.time,
        hazard: G.m.hazard,
        layout: L,
        random: R,
        hazardRandom: cinematic.active ? R : combatRandom,
        flash,
        sounds: sfx,
        gustLeaves,
        onShake: (amount) => {
          presentationState.shake = Math.max(presentationState.shake, amount);
        },
      },
    );
  }
  function update(dt: number, raw: number) {
    if (sceneLoading) return;
    if (activeTrial && trialFailure) {
      finishTrial(trialFailure);
      return;
    }
    advancePresentationClock(presentationState, dt);
    if (['playing', 'boss', 'between', 'standoff', 'shrine'].includes(G.state)) G.runTime += raw;
    updateAmbient(dt);
    // Cinematic mode advances cosmetic time only: no encounters, weather hazards or run RNG.
    if (cinematic.active) {
      updateWeather(reducedMotion() ? 0 : dt);
      audio.update(raw, STAGES[G.stage]!.weather, presentationState.wind, 0);
      return;
    }
    if (G.freezeT > 0) G.freezeT -= dt;
    if (G.petT > 0) G.petT -= dt;
    updateWeather(dt);
    updatePlayer(dt);
    apparelMotion.update(raw, reducedMotion());
    updateEnemies(dt, raw);
    if (
      !activeTrial &&
      !activeDaily &&
      G.state === 'playing' &&
      waveConfiguration().ordered &&
      liveOrdered()[0]?.state === 'idle'
    )
      guided.startOrder();
    bossPhase.updateBackground(dt, raw);
    phaseRouter.updateFrame(dt, raw);
    updateFx(dt, raw);
    renderTrialObjective();
    updateTransition(raw);
    advancePresentationCamera(presentationState, raw);
    audio.update(raw, STAGES[G.stage]!.weather, presentationState.wind, WX.wo);
  }

  /* ---------------- render ---------------- */
  function drawPlayer() { playerFigures.drawPlayer(); }
  const postPreparation = createPostPreparation(() => ({
    W,
    H,
    G,
    R,
    reducedMotion,
    reducedFlashes,
    sceneFilm,
    pz,
    fx: presentationState.fx,
    buzz,
    S,
    time: presentationState.time,
    signals: postSignals,
  }));
  const { advancePost, preparePresentation } = postPreparation;
  const postSignals = presentationState;
  const drawPost = createPostPresentation(() => ({
    G,
    g,
    W,
    H,
    cvs,
    sceneFilm,
    premiumAccess,
    time: presentationState.time,
    reducedMotion,
    reducedFlashes,
    grainPats: postArtwork.grainPats,
    vig: postArtwork.vig,
    pz,
    inkEdge: postArtwork.inkEdge,
    lb: presentationState.lb,
    flashCol: presentationState.flashCol,
  }));
  function render(raw: number) {
    // Scroll menus reveal the scene at their edges. Only the opaque, full-viewport
    // inspection dialog covers it completely; its independent preview still draws.
    if (G.panel === 'armory' && armory.inspectionExpanded) return;
    drawScene(preparePresentation(raw));
    settlePresentedScene();
  }
  const drawScene = createRuntimeScene(() => ({
    nativeScene,
    lightingDebug,
    g,
    lightingRig,
    W,
    H,
    DPR,
    zoom: presentationState.zoom,
    zoomX: presentationState.zoomX,
    zoomY: presentationState.zoomY,
    reducedMotion,
    activeTrial,
    cinematic,
    previewDemon: environmentState.previewDemon,
    demonRealmRenderer,
    time: presentationState.time,
    stageSeed,
    environmentRenderer,
    G,
    reducedFlashes,
    density,
    cvs,
    mistSprite: environmentState.mistSprite,
    mists: environmentState.mists,
    blades,
    mid: environmentState.mid,
    drawStains,
    drawLeaves,
    sceneLoading,
    drawEnemy,
    L,
    drawBoss,
    drawPlayer,
    drawPet,
    drawFoxfire,
    drawFx,
    drawFx2,
    fg: environmentState.fg,
    drawGlyphs,
    drawSmoke,
    drawWeather,
    drawPops,
    drawStamps,
    drawPost,
  }));
  // Scene-ready continuation belongs to orchestration, never to a drawing call.
  function settlePresentedScene() { return sceneFlow.settlePresentedScene(); }
  const frameLoop = createFrameLoop(
    {
      get hitStop() {
        return hitStop;
      },
      set hitStop(value) {
        hitStop = value;
      },
      get slowT() {
        return G.slowT;
      },
      set slowT(value) {
        G.slowT = value;
      },
      get timeScale() {
        return timeScale;
      },
    },
    {
      maxFps: () => 60,
      demand: () =>
        cinematic.active
          ? { update: true, render: true, afterRender: false }
          : screenAnimation.demand(G.panel === 'armory' && armory.inspectionExpanded),
      paused: () => G.state === 'paused' || guided.frozen,
      update,
      render,
      afterRender: () => {
        if (G.panel === 'armory') drawPreview();
      },
      sampleFrame: (interval, work) => {
        if (sceneLoading) return;
        if (G.panel || ['title', 'over', 'paused'].includes(G.state) || document.hidden) return;
        if (!effectQuality.sample(interval, work)) return;
        ambient().balanceLeaves(environmentState.leaves);
        if (Math.abs(environmentState.weatherDensity - density()) >= 0.09) rebalanceWeather();
      },
    },
  );
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
  let graphicsFailed = false;
  lifecycle.listen(document, GRAPHICS_ERROR_EVENT, () => {
    graphicsFailed = true;
    frameLoop.stop();
    combatHaptics.stop();
    audio.setInactive(true);
    if (['playing', 'boss', 'between', 'standoff', 'shrine'].includes(G.state)) {
      G.pausedFrom = G.state;
      G.state = 'paused';
      showPauseScreen();
    }
  });
  const resumeFrames = () => {
    if (!graphicsFailed) frameLoop.start();
  };
  if (nativeScene) {
    let recoveryTimer: ReturnType<typeof setTimeout> | undefined;
    lifecycle.listen(cvs, 'webglcontextlost', () => {
      frameLoop.stop();
      combatHaptics.stop();
      audio.setInactive(true);
      if (['playing', 'boss', 'between', 'standoff', 'shrine'].includes(G.state)) {
        G.pausedFrom = G.state;
        G.state = 'paused';
        showPauseScreen();
      }
      ($('bResume') as HTMLButtonElement).disabled = true;
      recoveryTimer = lifecycle.timeout(() => {
        if (!nativeScene?.contextLost) return;
        reportGraphicsError(cvs);
      }, 8000);
    });
    lifecycle.listen(cvs, 'webglcontextrestored', () => {
      if (!nativeScene) return;
      if (recoveryTimer !== undefined) lifecycle.clearTimeout(recoveryTimer);
      ($('bResume') as HTMLButtonElement).disabled = false;
      screenAnimation.invalidate();
      audio.setInactive(!pageActive());
      if (pageActive()) resumeFrames();
    });
  }
  lifecycle.add(
    onActivityChange((active) => {
      if (active) visitToday();
      audio.setInactive(!active);
      if (!active) {
        combatHaptics.stop();
        frameLoop.stop();
      } else if (artworkReady && !nativeScene?.contextLost) resumeFrames();
    }),
  );

  /* ---------------- boot ---------------- */
  let rt = 0;
  let viewportPrepared = false;
  function resize() {
    const r = cvs.getBoundingClientRect();
    const width = Math.max(1, r.width);
    const height = Math.max(1, r.height);
    const ratio = Math.min(2, window.devicePixelRatio || 1);
    if (
      viewportPrepared &&
      W === width &&
      H === height &&
      DPR === ratio &&
      cvs.width === Math.round(width * ratio) &&
      cvs.height === Math.round(height * ratio)
    )
      return;
    W = width;
    H = height;
    DPR = ratio;
    cvs.width = Math.round(W * DPR);
    cvs.height = Math.round(H * DPR);
    layout();
    buildBG();
    buildMist();
    buildGrass();
    buildLeaves();
    buildWeather(false);
    buildPost();
    viewportPrepared = true;
    screenAnimation.invalidate();
    if (artworkReady) prepareScene();
    environmentState.prevBg = null;
    environmentState.stageFade = 0;
    for (const e of G.enemies) {
      e.pos = enemyPos(e);
      if (e.state === 'dying') e.deathGround = { ...e.pos };
    }
    if (G.boss) {
      G.boss.pos = bossPos(G.boss);
      if (G.boss.state === 'dying') G.boss.deathGround = { ...G.boss.pos };
    }
  }
  lifecycle.listen(window, 'resize', () => {
    lifecycle.clearTimeout(rt);
    rt = lifecycle.timeout(resize, 80);
  });
  computeMods();
  applySeal();
  resize();
  if (cinematic.restores) {
    G.state = 'title';
    setupAttract();
    cinematic.restore();
  } else if (savedRun?.status === 'active') {
    const active = savedRun;
    restoreCheckpoint(active);
    G.pausedFrom = G.state;
    G.state = 'paused';
    showPauseScreen();
  } else if (savedRun) {
    const terminal = savedRun;
    restoreCheckpoint(terminal);
    showOver();
  } else {
    setupAttract();
    recoverSupportReward();
  }
  setMuteIcon();
  refreshArmoryNew();
  setBestLine();
  updateSavedRunButtons();
  if (document.fonts && document.fonts.load)
    document.fonts.load(`800 20px "Shippori Mincho B1"`, '一二三四五閃').catch(() => {});
  lifecycle.add(() => {
    frameLoop.stop();
    disposePointer();
    disposeKeyboard();
    setupScreen.dispose();
    tutorial.dispose();
    armory.dispose();
    notifications.dispose();
    guided.dispose();
    runResults.dispose();
    void audio.dispose()?.catch(() => {});
  });
  let artworkDisposed = false;
  const artworkLoading = mountStartupLoading(() => location.reload());
  lifecycle.add(() => {
    artworkDisposed = true;
    artworkLoading.remove();
  });
  void Promise.all([
    inkCharm.prepare(),
    inkCompanion.prepare(),
    inkEnemy.prepare(),
    inkPlayer.prepare(),
    inkSword.prepare(),
    environmentRenderer.compose({
      stageSeed,
      width: W,
      height: H,
      dpr: DPR,
      time: presentationState.time,
      stage: G.stage,
      reducedMotion: reducedMotion(),
      reducedFlashes: reducedFlashes(),
      lowQuality: density() <= 0.3,
    }),
    driftRenderer.prepare(),
  ]).then(() => {
    if (artworkDisposed) return;
    const failed = [
      inkCharm.snapshot().state !== 'ready' ? 'charms' : null,
      !inkCompanion.ready ? 'companions' : null,
      !inkEnemy.snapshot().ready || inkEnemy.snapshot().loaded.length < 4 ? 'enemies' : null,
      !inkPlayer.snapshot().ready || inkPlayer.snapshot().outfits.outfits.length < 20
        ? 'outfits'
        : null,
      !inkSword.ready ? 'weapons' : null,
      environmentRenderer.backend !== 'layered' ? 'scene' : null,
      !driftRenderer.ready ? 'drifting debris' : null,
    ].filter((name): name is string => !!name);
    if (failed.length) {
      artworkLoading.update({ loaded: 7 - failed.length, total: 7, pending: 0, failed });
      return;
    }
    artworkLoading.remove();
    artworkReady = true;
    if (pageActive()) frameLoop.start();
  });
  return lifecycle.dispose;
}
