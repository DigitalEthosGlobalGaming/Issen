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
import { bossToIdle, updateBoss as simulateBoss } from './game/encounters/boss-update.ts';
import { initialSpawns, updateWave as simulateWave } from './game/encounters/waves.ts';
import {
  pickEnemyLook,
  spawnEnemy as createEnemy,
  orderedEnemies,
  selectAttacker,
} from './game/combat/enemy-spawn.ts';
import { enemyPosition } from './rendering/figures/enemy-position.ts';
import { updateEnemies as simulateEnemies } from './game/combat/enemy-update.ts';
import { createDriftRenderer } from './rendering/scene/drift-renderer.ts';
import { createWeatherState } from './rendering/scene/weather-state.ts';
import { updateWeather as simulateWeather } from './rendering/scene/weather-update.ts';
import {
  REST_POSE as PREST,
  createPlayerAnimation,
  startSwing,
  updatePlayerAnimation,
} from './rendering/figures/player.ts';
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
import { makeFig, EPOSE } from './rendering/figures/model.ts';
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
  function earn(event: 'kill' | 'wave' | 'boss') {
    if (activeTrial || activeDaily) return;
    accrueRunReward(rewardLedger, event, {
      zen: G.zen,
      emberBonus: G.m.emberBonus,
      pilgrim: !!G.m.pilgrim,
    });
  }
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
    return EQ.pet === 'nopet' && EQ.robe === 'scarecrow' ? 'crow' : EQ.pet;
  }
  function drawFoxfire() {
    if (!G.m || !G.m.foxfire) return;
    const p = L.player,
      x = p.x + p.h * 0.34 + Math.cos(presentationState.time * 1.4) * p.h * 0.05,
      y = p.y - p.h * 1.02 + Math.sin(presentationState.time * 2.8) * p.h * 0.025,
      r = Math.max(6, p.h * 0.035),
      a = G.foxUsed && G.state !== 'title' ? 0.22 : 0.9;
    g.save();
    g.globalCompositeOperation = 'lighter';
    const rg = g.createRadialGradient(x, y, 0, x, y, r * 2.4);
    rg.addColorStop(0, `rgba(170,215,255,${a})`);
    rg.addColorStop(0.4, `rgba(90,150,255,${a * 0.5})`);
    rg.addColorStop(1, 'rgba(90,150,255,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, r * 2.4, 0, TAU);
    g.fill();
    const tip = y - r * 1.6 - Math.sin(presentationState.time * 9) * r * 0.3;
    g.fillStyle = `rgba(230,245,255,${a})`;
    g.beginPath();
    g.moveTo(x, tip);
    g.quadraticCurveTo(x + r, y, x, y + r * 0.7);
    g.quadraticCurveTo(x - r, y, x, tip);
    g.fill();
    g.restore();
  }
  function foxSave(e: Enemy) {
    e.p = 0.5;
    killEnemy(e, e.dir, true);
    pop(0, 0, '狐火');
    flash(0.25, '150,200,255');
    sfx.glint();
  }
  function reviveDaruma(ph = false, support = false) {
    if (!support) {
      if (ph) G.phoenixUsed = true;
      else G.darumaUsed = true;
    }
    timeScale = 1;
    presentationState.lbT = 0;
    P.fall = 0;
    P.pose = { ...PREST };
    breakCombo();
    G.pStreak = 0;
    if (!G.zen && !G.hard)
      G.lives = support ? Math.max(1, Math.ceil(G.maxLives / 2)) : ph ? G.maxLives : 1;
    renderLives();
    setScore();
    hud(true);
    presentationState.inkPulse = 0;
    const inBoss = G.diedInBoss;
    G.enemies = [];
    G.attacker = null;
    G.pendingSpawns = [];
    G.so = null;
    if (inBoss) {
      G.boss = null;
      G.bossCount--;
      startBoss();
    } else startWave(G.wave, true);
    if (support) {
      G.lives = Math.max(1, Math.ceil(G.maxLives / 2));
      renderLives();
      captureCheckpoint();
      banner('起', 'Second Wind');
    } else if (ph) banner('鳳凰', 'Rise from the ashes');
    else banner('達磨', 'Seven times down, eight times up');
    stamp(ph ? '鳳' : '起', 0, 0, Math.max(60, 86 * S), true, 1.6);
    flash(0.5, '255,240,220');
  }
  function drawPet() {
    const pt = EQ.pet,
      p = L.player;
    if (pt === 'shiba') drawPetAt('shiba', p.x + p.h * 0.47, H - 2, p.h * 0.14);
    else if (pt === 'mystic-rock')
      drawPetAt(pt, p.x + p.h * 0.46, H - 2 - p.h * 0.12, Math.min(120, p.h * 0.23));
    else if (pt === 'cat') drawPetAt('cat', W * 0.85, H * 0.93 - W * 0.045, Math.max(W, H) * 0.045);
  }
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
  function powersEnabled() {
    return G.state === 'title' || G.state === 'over' ? SETUP.upgrades !== false : G.upgradesEnabled;
  }
  function isSp() {
    return !!(
      META.upgrades.awakening &&
      powersEnabled() &&
      EQ.bladeSp &&
      SPECIAL[EQ.blade] &&
      UNL.has(EQ.blade + '+')
    );
  }
  function isSteelThird() {
    return !!(
      META.upgrades.awakening &&
      powersEnabled() &&
      EQ.blade === 'steel' &&
      EQ.bladeThird &&
      UNL.has('steel++')
    );
  }
  function isRobeSp() {
    return !!(
      META.upgrades.awakening >= 2 &&
      powersEnabled() &&
      EQ.robeSp &&
      ROBE_AWAKENINGS[EQ.robe] &&
      UNL.has(EQ.robe + '+')
    );
  }
  function playerRobePalette() {
    const base = robePal(EQ.robe);
    const accent = isRobeSp() ? ROBE_AWAKENINGS[EQ.robe]?.st?.c : null;
    return accent
      ? { ...base, robeL: `rgb(${accent})`, inner: `rgb(${accent})`, obi: `rgb(${accent})` }
      : base;
  }
  function challenge(metric: keyof BladeStats, value = 1) {
    if (G.zen || activeTrial || activeDaily) return;
    recordChallenge(AWAKENING, META.upgrades.awakening, G.runBlade, G.runRobe, metric, value);
    saveAwakening();
  }
  function bladeMods() {
    return isSteelThird()
      ? STEEL_THIRD.m
      : isSp()
        ? SPECIAL[EQ.blade]!.m
        : (ITEM_BY[EQ.blade] || {}).m;
  }
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
  function bst() {
    const id = G.runBlade;
    if (!id) return null;
    return ST.bl[id] || (ST.bl[id] = { k: 0, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 });
  }
  function computeMods() {
    if (activeTrial) {
      G.m = computeModifiers([], new Set());
      G.m.hazard = 0;
      return;
    }
    G.m = computeModifiers(
      [
        bladeMods(),
        isRobeSp() ? ROBE_AWAKENINGS[EQ.robe]!.m : (ITEM_BY[EQ.robe] || {}).m,
        accessible(EQ.charm) ? (ITEM_BY[EQ.charm] || {}).m : undefined,
        G.fortune?.m,
        runTemplate,
      ],
      G.bless,
    );
  }
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
  function bumpCombo() {
    G.maxCombo = Math.max(G.maxCombo, G.combo);
    if (G.zen) ST.bestZen = Math.max(ST.bestZen, G.combo);
    else {
      ST.bestCombo = Math.max(ST.bestCombo, G.combo);
      const q = bst();
      if (q) q.c = Math.max(q.c, G.combo);
      challenge('c', G.combo);
    }
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
  function prepareScene() {
    const frame = {
      stageSeed,
      width: W,
      height: H,
      dpr: DPR,
      time: presentationState.time,
      stage: G.stage,
      reducedMotion: reducedMotion(),
      reducedFlashes: reducedFlashes(),
      lowQuality: density() <= 0.3,
    };
    const demon = activeTrial?.realm === 'demon' || environmentState.previewDemon;
    const key = `${demon}:${compositionKey(frame)}`;
    if (key === requestedSceneKey) return;
    requestedSceneKey = key;
    const request = ++sceneRequest;
    const identity = `${demon}:${G.stage}:${stageSeed}`;
    if (identity !== requestedSceneIdentity) sceneContinuation = undefined;
    requestedSceneIdentity = identity;
    sceneLoading = true;
    sceneReadyToPresent = false;
    cvs.dataset.sceneState = 'loading';
    screenAnimation.invalidate();
    const pending = demon ? demonRealmRenderer.prepare() : environmentRenderer.compose(frame);
    void pending
      .then((ready) => {
        if (lifecycle.disposed || request !== sceneRequest) return;
        if (!ready) {
          cvs.dataset.sceneState = 'unavailable';
          return;
        }
        sceneReadyToPresent = true;
        screenAnimation.invalidate();
      })
      .catch(() => {
        if (!lifecycle.disposed && request === sceneRequest) cvs.dataset.sceneState = 'unavailable';
      });
  }
  function deferUntilSceneReady(action: () => void) {
    if (!sceneLoading) return false;
    sceneContinuation = action;
    return true;
  }
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
  function checkUnlocks() {
    if (activeTrial || activeDaily) return;
    if (G.state !== 'over') return;
    const before = UNL.size;
    unlockEligibleItems(
      ST,
      UNL,
      ITEMS,
      (id, it) => {
        if (revoked.has(id)) {
          UNL.delete(id);
          return;
        }
        store.set('issen.unlocks', [...UNL]);
        G.newUnlocks.push(it);
        const base = id.replace(/\++$/, '');
        const source = ITEM_BY[base];
        const display = source ? itemPresentation(source) : null;
        const awakened =
          id === 'steel++'
            ? STEEL_THIRD
            : id.endsWith('+')
              ? (SPECIAL[base] ?? ROBE_AWAKENINGS[base])
              : null;
        const perk = awakened?.pk ?? display?.benefit;
        const tradeoff = awakened?.tr ?? display?.tradeoff;
        runItemReveals.push({
          key: it.k,
          name: it.n,
          kind: TYPE_WORD[it.type],
          description:
            (!accessible(id) ? 'Requires Premium. Challenge earned. ' : '') +
            (display?.flavor || 'View it in the Armoury.'),
          benefit: perk,
          tradeoff,
          item: true,
        });
      },
      {
        access: META.upgrades.awakening,
        progress: AWAKENING,
        itemStats: (id) => collectionItemStats(COLLECTION_PROGRESS, META, ST, id),
        paidAwakenings: true,
      },
    );
    if (UNL.size !== before) refreshArmoryNew();
  }
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
    pts = gain(pts);
    G.score += pts;
    setScore();
    if (G.zen) {
      if (label) pop(x, y, label, size);
    } else pop(x, y, (label ? label + ' ' : '') + '+' + pts, size);
    return pts;
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
  function startTrialEncounter() {
    if (deferUntilSceneReady(startTrialEncounter)) return;
    const trial = activeTrial;
    if (!trial) return;
    G.afterBoss = false;
    G.enemies = [];
    G.pendingSpawns = [];
    G.attacker = null;
    G.boss = null;
    G.event = null;
    G.toSpawn = 0;
    G.wave = trial.enemiesPerWave ? Math.floor(G.kills / trial.enemiesPerWave) + 1 : 1;
    G.cfg = waveCfg(1);
    if (trial.wave) {
      const pack = trial.enemiesPerWave ?? 5;
      const total = trial.enemiesPerWave ?? trial.wave.total;
      Object.assign(G.cfg, {
        pack,
        refill: !trial.enemiesPerWave,
        ordered: true,
        total,
        atk: trial.wave.attack,
        gap: 0.25,
        feint: trial.wave.feint,
      });
      G.toSpawn = total;
      G.nextOrder = 1;
      G.gapT = 1.5;
      G.pendingSpawns = initialSpawns(pack, false, combatRandom);
      G.state = 'playing';
    } else {
      G.bossCount = trial.bosses![G.bossesSlain]! - 1;
      startBoss();
      const duelBoss = G.boss as Boss | null;
      if (trial.duelMaster && duelBoss) {
        duelBoss.hp = duelBoss.maxHp = 20;
        duelBoss.bp = duelMasterTimings(0);
        renderHp();
      }
    }
    banner(
      '試練',
      trial.waveCount ? `${trial.name} · Wave ${G.wave}/${trial.waveCount}` : trial.name,
    );
    $('waveLbl').textContent = trial.waveCount ? `Wave ${G.wave}/${trial.waveCount}` : 'Trials';
    renderTrialObjective();
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
  function finishTrial(message?: string) {
    const trial = activeTrial;
    if (!trial) return;
    const passed = trialPassed(trial, { ...G, failed: !!message || !!trialFailure });
    const newlyCompleted = passed && completeTrial(TRIAL_PROGRESS, trial.id);
    if (passed) {
      store.set('issen.trials', TRIAL_PROGRESS);
      grantTrialRewards(TRIAL_PROGRESS, UNL);
      store.set('issen.unlocks', [...UNL]);
      sfx.unlock();
    }
    trialResult = {
      id: trial.id,
      passed,
      newlyCompleted,
      message:
        message ||
        trialFailure ||
        (passed
          ? ''
          : `You landed ${G.perfects} perfect cuts; ${trial.wave?.perfects ?? 0} were required.`),
    };
    activeTrial = null;
    buildLeaves();
    combatRandom = R;
    ST = playerStats;
    EQ = playerEquipment;
    guided.reset();
    audio.setPaused(false);
    hitStop = 0;
    $('trialObjective').hidden = true;
    toTitle();
    computeMods();
    openPanel('trials');
    $('trials')
      .querySelector<HTMLButtonElement>('#trialResult button')
      ?.focus({ preventScroll: true });
  }
  const waveLifecycle = createWaveLifecycle(() => ({
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
  function killEnemy(
    e: Enemy,
    dir: Direction,
    chained = false,
    preserveStreak = false,
    automatic = false,
  ) {
    const wasAtk = e === G.attacker,
      p = e.state === 'attack' ? clamp(e.p) : 0,
      swiftPoints = G.m.swift && !chained ? swiftSlashPoints(Math.max(0, e.life - 0.9), e.T) : null,
      perfect =
        !automatic &&
        !G.m.noPerfect &&
        ((wasAtk && p >= pz()) || (!chained && G.bless.has('flurry') && (G.combo + 1) % 10 === 0));
    e.k = e.state === 'attack' ? Math.pow(p, 1.6) : 0;
    e.state = 'dying';
    e.t = 0;
    e.cutAng = DANG[dir];
    e.pos = enemyPos(e);
    e.shadowTime = 0;
    e.deathGround = { ...e.pos };
    e.deathType =
      !G.m.bonk && accessible(EQ.fx) && EQ.fx === 'scattered-armour'
        ? 'scatter'
        : !G.m.bonk &&
            accessible(EQ.fx) &&
            ['falling-leaves', 'ember-ash', 'ink-wash'].includes(EQ.fx)
          ? 'dissolve'
          : chooseDeathStyle(perfect, !!G.m.bonk, R);
    e.fallDir = dir === 'left' ? -1 : dir === 'right' ? 1 : R() < 0.5 ? -1 : 1;
    if (e.deathType === 'disarm') {
      const q = e.pos,
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
    }
    for (const o of G.enemies)
      if (o !== e && (o.state === 'idle' || o.state === 'attack'))
        o.flinch = 0.6 + 0.4 * combatRandom();
    if (wasAtk) {
      G.attacker = null;
      G.gapT = waveConfiguration().gap;
    }
    const comboGrew = perfect || !G.bless.has('oath');
    if (comboGrew) G.combo++;
    G.kills++;
    ST.kills++;
    earn('kill');
    if (e.fake) ST.feintKills = (ST.feintKills || 0) + 1;
    if (G.m.maneki) {
      G.manekiN = (G.manekiN || 0) + 1;
      if (G.manekiN % 7 === 0) {
        presentationState.fx.coins.push({
          x0: e.pos.x,
          y0: e.pos.y - e.pos.h * 0.6,
          t: 0,
          life: 0.8,
        });
        sfx.coin();
        addScore(Math.round(500 * comboMult()), 0, 0, '招き猫');
      }
    }
    {
      const q = bst();
      if (q) q.k++;
      challenge('k');
    }
    bumpCombo();
    const P0 = e.pos,
      cx = P0.x,
      cy = P0.y - P0.h * 0.55,
      v: [number, number] = [Math.cos(e.cutAng), Math.sin(e.cutAng)],
      len = P0.h * (automatic ? 0.55 : 0.95),
      sc = P0.h / 160;
    addSlash(
      cx - (v[0] * len) / 2,
      cy - (v[1] * len) / 2,
      cx + (v[0] * len) / 2,
      cy + (v[1] * len) / 2,
      Math.max(3, P0.h * 0.03),
      0.3,
    );
    killFx(cx, cy, e.cutAng + Math.PI / 2, sc);
    scraps(cx, cy, 6, sc);
    ring(cx, cy, P0.h * 0.08, P0.h * 0.55, 0.32, Math.max(1.5, 2 * S));
    presentationState.fx.stains.push({
      x: P0.x + (R() - 0.5) * P0.h * 0.2,
      y: P0.y + P0.h * 0.01,
      rx: P0.h * (0.12 + R() * 0.1),
      t: 0,
      life: SHADOW_DURATION,
    });
    if (!automatic) swingPlayer(dir, perfect);
    if (G.m.bonk) sfx.bonk();
    else sfx.slice();
    combatHaptics.play('slice');
    if (G.m.restore && !G.zen && !G.hard) {
      G.clean = (G.clean || 0) + 1;
      if (G.clean >= G.m.restore) {
        G.clean = 0;
        if (G.lives < G.maxLives) {
          G.lives++;
          renderLives();
          pop(0, 0, '正宗 +1 life');
        }
      }
    }
    if (perfect) {
      G.perfects++;
      ST.perfects++;
      if (!activeTrial) ST.bestRunPerfects = Math.max(ST.bestRunPerfects, G.perfects);
      if (G.bless.has('echo')) {
        G.combo += 2;
        bumpCombo();
      }
      {
        const q = bst();
        if (q) q.p++;
        challenge('p');
      }
      G.pStreak++;
      if (!chained) {
        const reward = recordBlessingCut(G, true);
        if (reward.knife) {
          G.knives++;
          hud(true);
          pop(P0.x, P0.y - P0.h * 1.4, 'Knife +1');
        }
        if (reward.precisionWard) {
          renderLives();
          pop(P0.x, P0.y - P0.h * 1.4, 'Ward ready');
        }
        if (reward.stormCharged) pop(P0.x, P0.y - P0.h * 1.5, 'Lightning charged');
        if (reward.rekindled) {
          bumpCombo();
          setScore();
          pop(P0.x, P0.y - P0.h * 1.5, `Rekindle +${reward.rekindled}`);
        }
      }
      ST.bestPStreak = Math.max(ST.bestPStreak, G.pStreak);
      G.petT = 0.7;
      if (G.m.freeze) {
        G.freezeT = 0.8 * G.m.freeze;
        pop(W / 2, H * 0.4, '凍', Math.max(22, 28 * S));
      }
      const pts = addScore(
        Math.round(
          (swiftPoints ?? 400 + Math.min(500, (G.pStreak - 1) * 100)) *
            comboMult() *
            (swiftPoints === null ? G.m.perfect : 1),
        ),
        P0.x,
        P0.y - P0.h * 1.05,
      );
      stamp('一閃', W / 2, H * 0.3, Math.max(52, 74 * S), true, 1.1);
      addSlash(
        cx - v[0] * Math.max(W, H) * 1.3,
        cy - v[1] * Math.max(W, H) * 1.3,
        cx + v[0] * Math.max(W, H) * 1.3,
        cy + v[1] * Math.max(W, H) * 1.3,
        Math.max(2, 2.5 * S),
        0.5,
      );
      ring(cx, cy, P0.h * 0.1, P0.h * 1.3, 0.5, Math.max(2, 3 * S));
      letterbox(0.5);
      punch(1.07, cx, cy);
      presentationState.shake = Math.max(presentationState.shake, 10 * S);
      hitStop = 0.15;
      flash(0.32);
      sfx.perfect();

      if (pts) void 0;
    } else {
      if (!preserveStreak) {
        if (wasAtk) G.pStreak = 0;
        if (!chained) recordBlessingCut(G, false);
      }
      addScore(
        Math.round(
          (swiftPoints ?? 100 + (wasAtk ? 40 : 20)) *
            comboMult() *
            (swiftPoints === null ? G.m.normal : 1),
        ),
        P0.x,
        P0.y - P0.h * 1.05,
      );
      presentationState.shake = Math.max(presentationState.shake, 7 * S);
      hitStop = 0.055;
      flash(0.08);
    }
    if (
      !chained &&
      perfect &&
      G.bless.has('finalflourish') &&
      G.toSpawn <= 0 &&
      !G.pendingSpawns.length &&
      !G.enemies.some(
        (other) => other.state === 'idle' || other.state === 'attack' || other.state === 'enter',
      )
    )
      G.blessingTriggers.flourishPending = true;
    if (activeTrial) trialFailure ||= trialFailureAfterCut(activeTrial, G) || '';
    if (comboGrew && G.combo > 0 && G.combo % 10 === 0 && G.m.comboBonus)
      addScore((G.m.comboBonus * G.combo) / 10, 0, 0, '歌舞伎');
    if (comboGrew && G.combo > 0 && G.combo % 10 === 0 && G.m.furin) {
      G.slowT = Math.max(G.slowT, 2);
      pop(0, 0, '風鈴');
      sfx.chime();
    }
    if (comboGrew && G.combo > 0 && G.combo % 10 === 0) {
      stamp(kanji(G.combo) + '連', W / 2, H * 0.2, Math.max(40, 54 * S), false, 1.2);
      gustLeaves(26);
      sfx.drum();
    }
    if (notifications.activeHint === 'swipe') hideHint();
    if (waveConfiguration().refill && G.toSpawn > 0)
      G.pendingSpawns.push({ slot: e.slot, t: 0.45 });
    if (!chained && G.m.serpent && combatRandom() < G.m.serpent) {
      const nx = waveConfiguration().ordered
        ? liveOrdered()[0]
        : G.enemies.find((q) => (q.state === 'idle' || q.state === 'attack') && q.dir === dir);
      if (nx && (nx.state === 'idle' || nx.state === 'attack') && nx.dir === dir) {
        killEnemy(nx, dir, true);
        pop(0, 0, '大蛇', Math.max(20, 26 * S));
        return;
      }
    }
    if (!chained && G.bless.has('tempest')) {
      G.tempN = (G.tempN || 0) + 1;
      if (G.tempN % 5 === 0) {
        const c = G.enemies.filter((q) => q.state === 'idle' || q.state === 'attack');
        const nx = waveConfiguration().ordered
          ? liveOrdered()[0]
          : c[(combatRandom() * c.length) | 0];
        if (nx && (nx.state === 'idle' || nx.state === 'attack')) {
          killEnemy(nx, nx.dir, true);
          pop(0, 0, '颯');
        }
      }
    }
    if (perfect && !chained && G.bless.has('swallow')) {
      const nx = waveConfiguration().ordered
        ? liveOrdered()[0]
        : G.enemies.find((q) => (q.state === 'idle' || q.state === 'attack') && q.dir === dir);
      if (nx && (nx.state === 'idle' || nx.state === 'attack') && nx.dir === dir) {
        killEnemy(nx, dir, true);
        pop(nx.pos.x, nx.pos.y - nx.pos.h * 1.3, '燕', Math.max(20, 26 * S));
      }
    }
    checkUnlocks();
  }
  function swingPlayer(dir: Direction | 'block', perfect = false) {
    if (EQ.blade === 'koken' && G.state !== 'title') sfx.hum();
    startSwing(P, dir);
    apparelMotion.kick(dir, reducedMotion(), perfect);
  }
  const wavesPhase = createWavesPhase<GameContext<PresentationContext>>(() => ({
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
  }));
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
    if (G.state === 'standoff') {
      standoffSwipe(dir);
      return;
    }
    if (G.state === 'playing') wavesPhase.onSwipe(context, dir);
    else if (G.state === 'boss') bossSwipe(dir);
  }

  /* ---------------- boss ---------------- */
  function startBoss() {
    if (deferUntilSceneReady(startBoss)) return;
    refillDuelKnives(G);
    G.blessingTriggers.flourishWard = false;
    renderLives();
    G.bossCount++;
    const b = createBoss(
        G.bossCount,
        G.mode,
        G.m,
        bossPos,
        restorableRng((G.seed ^ Math.imul(G.bossCount, 0x9e3779b9)) >>> 0).next,
      ),
      { def, lap } = b;
    G.boss = b;
    G.state = 'boss';
    G.attacker = null;
    G.event = null;
    const nm = def.n + (lap ? ' ' + roman(lap + 1) : '');
    banner(def.k, nm);
    $('waveLbl').textContent = G.rush ? `決闘 ${kanji(G.wave)}` : '決闘';
    $('bossK').textContent = def.k;
    $('bossN').textContent = nm;
    renderHp();
    $('bossbar').classList.add('on');
    sfx.drum();
    if (!activeTrial && !activeDaily) guided.startBoss();
    if (def.twin) hint('twin', 'The Twin Fang strikes twice. Parry both glints.', 4500);
    if (def.spear) hint('spear', 'The spear gives less warning. Watch the tip.', 4500);
    if (def.mirror)
      hint('mirror', 'The Mirror never feints. Cut opposite to his arrow and blade.', 5000);
    captureCheckpoint();
  }
  function bossPos(b: Boss) {
    return bossPosition(b, L);
  }
  function toIdle(b: Boss, base: number) {
    bossToIdle(b, base, combatRandom);
  }
  function updateBoss(dt: number, raw = dt) {
    simulateBoss(G, dt, {
      rawDelta: raw,
      random: combatRandom,
      sounds: sfx,
      flash,
      playerDie,
      position: bossPos,
      recovered: (b) => {
        breakCombo();
        setScore();
        pop(b.pos.x, b.pos.y - b.pos.h * 1.05, 'Recovered');
      },
    });
    if (G.boss?.state === 'flash') guided.bossFlash();
  }
  function bossTipWorld(b: Boss): [number, number] {
    const tp = tipOf(b.pose, b.lean, b.def.spear ? 0.98 : 0.52);
    return [b.pos.x + tp[0] * b.pos.h, b.pos.y + tp[1] * b.pos.h];
  }
  function parry() {
    const b = G.boss;
    if (!b) return;
    const tw = bossTipWorld(b);
    const { second, counterDamage } = parryOpening(
      b,
      {
        count: G.bossCount,
        mode: G.mode,
        chainModifier: G.m.chain,
        counter: G.bless.has('counter'),
      },
      combatRandom,
    );
    if (activeTrial?.duelMaster) b.chainLeft = b.chainLen = 1;
    if (!second && G.bless.has('timestop')) G.slowT = Math.max(G.slowT, 1.4);
    if (counterDamage) {
      renderHp();
      pop(b.pos.x, b.pos.y - b.pos.h * 1.25, '返し', Math.max(20, 26 * S));
    }
    swingPlayer('block');
    sparks(tw[0], tw[1], 24);
    ring(tw[0], tw[1], 4 * S, 90 * S, 0.35, Math.max(2, 2.5 * S));
    presentationState.shake = Math.max(presentationState.shake, 11 * S);
    hitStop = 0.09;
    flash(0.3);
    sfx.clang();
    combatHaptics.play('parry');
    letterbox(0.3);
    G.combo++;
    G.parries++;
    ST.parries++;
    guided.bossParried();
    bumpCombo();
    addScore(Math.round(60 * comboMult()), b.pos.x, b.pos.y - b.pos.h * 1.05);
    if (!second)
      hint(
        'parry',
        b.def.mirror
          ? 'An opening. Swipe opposite to his arrow and blade.'
          : 'An opening. Swipe the way his blade points.',
        3000,
      );
  }
  function onTapDown() {
    if (sceneLoading) return false;
    // Finger-down begins a possible swipe. Consume taps on release during cut
    // practice so the pointer adapter can still recognize the teaching gesture.
    if (guided.phase === 'order-practice') return false;
    if (guided.tap()) return true;
    if (G.state === 'boss' && G.boss && G.boss.state === 'flash') {
      parry();
      return true;
    }
    return false;
  }
  function onTap() {
    if (sceneLoading) return;
    if (guided.tap()) return;
    if (G.state === 'playing') {
      wavesPhase.onTap(context);
      return;
    }
    if (G.state === 'standoff') {
      standoffPhase.onTap(context);
      return;
    }
    if (G.state !== 'boss' || !G.boss) return;
    const s = G.boss.state;
    if (s === 'flash') {
      parry();
      return;
    }
    if (s === 'idle' || s === 'windup' || s === 'feint') {
      swingPlayer('block');
      playerDie(G.boss, 'early');
    }
  }
  function blockHit(dir: Direction) {
    const b = G.boss;
    if (!b) return;
    const tw = bossTipWorld(b);
    b.chainLeft--;
    let nd;
    do {
      nd = DIRS[(combatRandom() * 4) | 0]!;
    } while (nd === b.sdir);
    b.sdir = nd;
    b.t = 0;
    b.window = Math.max(0.5, b.bp.stag * 0.72);
    b.blockT = 0.12;
    swingPlayer(dir);
    sparks(tw[0], tw[1], 16);
    ring(tw[0], tw[1], 3 * S, 70 * S, 0.28, Math.max(1.5, 2 * S));
    presentationState.shake = Math.max(presentationState.shake, 7 * S);
    hitStop = 0.05;
    flash(0.12);
    sfx.block();
    buzz(12);
    G.combo++;
    bumpCombo();
    addScore(Math.round(40 * comboMult()), b.pos.x, b.pos.y - b.pos.h * 1.05, 'Blocked');
    if (notifications.activeHint === 'parry') hideHint();
    hint(
      'chain',
      b.def.mirror
        ? 'He blocked. Keep swiping opposite to his arrow and blade.'
        : 'He blocked. Keep swiping the way his blade points.',
      3500,
    );
  }
  function bossSwipe(dir: Direction, automatic = false) {
    const b = G.boss;
    if (!b) return;
    if (b.state !== 'stagger') {
      if (activeTrial?.duelMaster && b.state !== 'enter' && b.state !== 'dying')
        playerDie(b, 'early');
      return;
    }
    const p = b.pos,
      cx = p.x,
      cy = p.y - p.h * 0.55;
    if (directionMatches(dir, b.sdir, !!G.m.axisCut) && b.chainLeft > 1) {
      blockHit(dir);
      return;
    }
    if (directionMatches(dir, b.sdir, !!G.m.axisCut)) {
      const swiftPoints = !automatic && G.m.swift ? swiftSlashPoints(b.t, b.window) : null;
      b.hp = Math.max(0, b.hp - (automatic ? 1 : G.m.bossDmg));
      if (activeTrial?.duelMaster) b.bp = duelMasterTimings(20 - b.hp);
      renderHp();
      if (!automatic) swingPlayer(dir);
      const a = DANG[dir],
        v: [number, number] = [Math.cos(a), Math.sin(a)],
        len = p.h * (automatic ? 0.55 : 0.9),
        sc = p.h / 170;
      addSlash(
        cx - (v[0] * len) / 2,
        cy - (v[1] * len) / 2,
        cx + (v[0] * len) / 2,
        cy + (v[1] * len) / 2,
        Math.max(4, p.h * 0.03),
        0.35,
      );
      killFx(cx, cy, a + Math.PI / 2, sc);
      scraps(cx, cy, 8, sc);
      ring(cx, cy, p.h * 0.1, p.h * 0.7, 0.35, Math.max(2, 2.5 * S));
      presentationState.shake = Math.max(presentationState.shake, 12 * S);
      hitStop = 0.08;
      flash(0.15);
      sfx.slice();
      combatHaptics.play('slice');
      G.combo++;
      bumpCombo();
      if (notifications.activeHint === 'parry') hideHint();
      if (b.hp <= 0) {
        b.state = 'dying';
        b.t = 0;
        b.cutAng = a;
        b.shadowTime = 0;
        b.deathGround = { ...b.pos };
        addScore(
          Math.round((swiftPoints ?? 1500 * G.bossCount) * G.m.bossScore),
          cx,
          p.y - p.h * 1.1,
          '討取',
          Math.max(22, 28 * S),
        );
        stamp('討取', W / 2, H * 0.3, Math.max(56, 80 * S), true, 1.6);
        letterbox(1.3);
        punch(1.08, cx, cy);
        hitStop = 0.25;
        flash(0.45);
        addSlash(
          cx - v[0] * Math.max(W, H) * 1.3,
          cy - v[1] * Math.max(W, H) * 1.3,
          cx + v[0] * Math.max(W, H) * 1.3,
          cy + v[1] * Math.max(W, H) * 1.3,
          Math.max(3, 3 * S),
          0.7,
        );
        sfx.bossDie();
        G.petT = 1;
        if (EQ.pet === 'crow') sfx.caw();
        G.bossesSlain++;
        earn('boss');
        runBossMilestone = Math.max(runBossMilestone, G.bossCount);
        ST.duels++;
        if (G.rush) {
          ST.rushBest = Math.max(ST.rushBest || 0, G.bossesSlain);
          if (G.blade) ST.rushBlade = (ST.rushBlade || 0) + 1;
        }
        {
          const q = bst();
          if (q) q.d++;
          challenge('d');
        }
        if (G.mode === 'ronin') ST.roninDuels++;
        if (b.def.mirror) recordSecretEvent(ST, { kind: 'mirrorVictory', clean: !b.failed });
        if (G.bless.has('breath') && !G.zen && !G.hard && G.lives < G.maxLives) {
          G.lives++;
          renderLives();
          pop(W / 2, H * 0.5, '息 +1 life', Math.max(20, 24 * S));
        }
        if (!b.failed) ST.cleanDuels++;
        if (G.blade) ST.bladeDuels++;
        G.state = 'between';
        G.afterBoss = true;
        G.nextT = 2.2;
        $('bossbar').classList.remove('on');
        inkBurst(cx, cy, a + Math.PI / 2, 30, p.h / 150);
        presentationState.fx.stains.push({
          x: p.x,
          y: p.y + p.h * 0.01,
          rx: p.h * 0.3,
          t: 0,
          life: BOSS_SHADOW_DURATION,
        });
        saveStats();
        checkUnlocks();
      } else {
        b.state = 'hurt';
        b.t = 0;
        addScore(
          Math.round((swiftPoints ?? 300) * comboMult() * G.m.bossScore),
          cx,
          p.y - p.h * 1.05,
        );
      }
    } else {
      if (G.m.kage && (b.kageUsed || 0) < G.m.kage) {
        b.kageUsed = (b.kageUsed || 0) + 1;
        swingPlayer(dir);
        sfx.deflect();
        pop(cx, p.y - p.h * 1.05, 'Afterimage');
        return;
      }
      swingPlayer(dir);
      b.state = 'recover';
      b.t = 0;
      b.failed = true;
      breakCombo();
      setScore();
      sfx.deflect();
      pop(cx, p.y - p.h * 1.05, 'Deflected');
    }
  }

  /* ---------------- standoff & shrine ---------------- */
  const standoffPhase = createStandoffPhase<GameContext<PresentationContext>>(
    () => ({
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
    if (activeTrial?.cleanOpenings)
      trialFailure = 'An opening was missed or a counter went the wrong way.';
    if (protectCombo(G)) {
      pop(W / 2, H * 0.4, 'Composure · combo kept');
      return;
    }
    const previous = G.combo;
    G.combo = G.bless && G.bless.has('banner') && G.combo >= 10 ? 10 : 0;
    if (G.combo < previous) recordComboBreak(G, previous);
  }
  function applyPick(id: string) {
    const extras = applyBlessing(G, id, combatRandom);
    if (id === 'crossroads') {
      const curse = crossroadsCurse(G, combatRandom);
      if (curse) {
        ST.curses++;
        toast({ k: curse.k, msg: `Crossroads curse: ${curse.n}` });
      }
    }
    renderLives();
    if (extras.length)
      toast({ k: '双', msg: 'Twin blessing: ' + extras.map((b) => b.n).join(' and ') });
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
    knocks = 0;
    if (G.m.noShrine) {
      nextStep();
      return;
    }
    const opts = shrineOffers(G, combatRandom);
    if (!opts.length) {
      nextStep();
      return;
    }
    G.state = 'shrine';
    shrineOfferIds = opts.map((bl) => bl.id);
    captureCheckpoint();
    showShrineOffers(opts);
  }
  lifecycle.listen($('bRerollShrine'), 'click', () => {
    if (G.state !== 'shrine' || G.shrineRerolls < 1 || !premiumAccess()) return;
    const opts = shrineOffers(G, combatRandom);
    if (!opts.length) return;
    G.shrineRerolls--;
    shrineOfferIds = opts.map((bl) => bl.id);
    captureCheckpoint();
    showShrineOffers(opts);
  });
  function showShrineOffers(opts: (typeof BLESS)[number][]) {
    ($('bRerollShrine') as HTMLButtonElement).hidden = G.shrineRerolls < 1 || !premiumAccess();
    renderShrine($('blessList'), opts, (bl) => {
      if (G.state !== 'shrine') return;
      G.bless.add(bl.id);
      applyPick(bl.id);
      if (bl.t === 1) ST.rares++;
      if (bl.t === 2) ST.curses++;
      ST.shrines++;
      saveStats();
      computeMods();
      checkUnlocks();
      hud(true);
      showScreen(null);
      sfx.unlock();
      shrineOfferIds = null;
      nextStep();
    });
    showScreen('shrine');
    sfx.drum();
  }

  /* ---------------- death & menus ---------------- */
  function struck(killer: Enemy | Boss | null, keep: boolean, label?: string | null) {
    G.clean = 0;
    if (!keep && G.bless.has('zanshin')) {
      const sk = Math.floor((G.wave - 1) / 3);
      if (G.zanKey !== sk) {
        G.zanKey = sk;
        keep = true;
        label = label || '残心';
      }
    }
    if (!keep && G.m.kiku && (G.kikuUsed || 0) < G.m.kiku) {
      G.kikuUsed = (G.kikuUsed || 0) + 1;
      keep = true;
      label = label || '菊';
    }
    const lost = G.combo;
    recordBlessingCut(G, false);
    if (!keep) {
      breakCombo();
      G.pStreak = 0;
    }
    G.hits++;
    setScore();
    const p = L.player;
    addSlash(
      p.x + p.h * 0.4,
      p.y - p.h * 0.98,
      p.x - p.h * 0.28,
      p.y - p.h * 0.35,
      Math.max(4, p.h * 0.018),
      0.45,
    );
    inkBurst(p.x + p.h * 0.05, p.y - p.h * 0.7, -2.2, 16, p.h / 420);
    flash(0.35, '150,22,16');
    presentationState.shake = Math.max(presentationState.shake, 12 * S);
    hitStop = 0.08;
    sfx.hurt();
    combatHaptics.play('damage');
    pop(
      W / 2,
      H * 0.45,
      label || (lost >= 3 && G.combo < lost ? `${lost} 連 broken` : 'Struck'),
      Math.max(20, 24 * S),
    );
    if (killer && 'def' in killer) {
      killer.state = 'strike';
      killer.t = 0;
      killer.zenBack = true;
    } else if (killer) {
      killer.k = killer.state === 'attack' ? Math.pow(clamp(killer.p), 1.6) : killer.k || 0;
      killer.state = 'strike';
      killer.t = 0;
      killer.zen = true;
      if (G.attacker === killer) {
        G.attacker = null;
        G.gapT = waveConfiguration().gap + 0.5;
      }
      if (waveConfiguration().refill && G.toSpawn > 0)
        G.pendingSpawns.push({ slot: killer.slot, t: 1.0 });
    }
  }
  function playerDie(killer: Enemy | Boss | null, reason: string) {
    if (activeTrial) {
      trialFailure = DEATH_REASONS[reason] || 'A mistake ended the trial.';
      return;
    }
    if (G.state === 'dead' || G.state === 'over') return;
    if (interceptWithTanto(G, killer) && killer) {
      if ('def' in killer) {
        killer.failed = true;
        killer.state = 'stagger';
        killer.chainLeft = 1;
        bossSwipe(killer.sdir, true);
      } else {
        if (G.so?.e === killer) {
          G.so.done = true;
          G.so.doneT = 0;
          killer.glint = 0;
        }
        killEnemy(killer, killer.dir, true, false, true);
      }
      pop(killer.pos.x, killer.pos.y - killer.pos.h * 1.15, 'Tanto');
      hud(true);
      captureCheckpoint();
      return;
    }
    if (reason === 'feint') {
      recordSecretEvent(ST, { kind: 'feintMistake' });
      saveStats();
      checkUnlocks();
    }
    const outcome = resolveDamage(G, reason);
    renderLives();
    if (outcome.kind === 'hurt') {
      if (outcome.lifeLost) presentationState.inkPulse = 1;
      struck(killer, outcome.keepCombo, outcome.label);
      return;
    }
    G.diedInBoss = !!(G.boss && G.boss.state !== 'dying');
    G.state = 'dead';
    G.deathT = 0;
    G.reviveOfferResolved = false;
    G.reason = reason;
    captureCheckpoint('lost');
    timeScale = 0.3;
    if (killer && !('def' in killer)) {
      killer.k = killer.state === 'attack' ? Math.pow(clamp(killer.p), 1.6) : killer.k || 0;
      killer.state = 'strike';
      killer.t = 0;
    } else if (killer) {
      killer.state = 'strike';
      killer.t = 0;
    }
    const p = L.player;
    addSlash(
      p.x + p.h * 0.4,
      p.y - p.h * 0.98,
      p.x - p.h * 0.28,
      p.y - p.h * 0.35,
      Math.max(5, p.h * 0.022),
      0.7,
    );
    inkBurst(p.x + p.h * 0.05, p.y - p.h * 0.7, -2.2, 40, p.h / 420);
    scraps(p.x + p.h * 0.05, p.y - p.h * 0.7, 10, p.h / 300);
    flash(0.45, '150,22,16');
    presentationState.shake = Math.max(presentationState.shake, 18 * S);
    letterbox(2.5);
    sfx.death();
    combatHaptics.play('damage');
    clearHints();
    $('bossbar').classList.remove('on');
  }
  function finishDaily() {
    if (!activeDaily || G.state === 'over') return;
    G.state = 'over';
    const result = dailyResult(store.get('issen.daily', null), activeDaily.day, G);
    store.set('issen.daily', result.records);
    guided.reset();
    audio.setPaused(false);
    timeScale = 1;
    presentationState.lbT = 0;
    clearHints();
    $('bossbar').classList.remove('on');
    const reward = { before: META.embers, after: META.embers, gained: 0 };
    renderGameOver($('over'), G, result.record, result.newBest, STAGES[G.stage]!.n, reward, true);
    $('overSeed').textContent = `Daily · ${activeDaily.day}`;
    $('oModifier').hidden = true;
    $('runResultSequence').hidden = true;
    $('overSummary').hidden = false;
    $('over').dataset.daily = 'true';
    showScreen('over');
    hud(false);
    G.overReady = true;
    $('bAgain').disabled = false;
    clearRunCheckpoint();
    savedRun = null;
    updateSavedRunButtons();
  }
  const rewardSupport = createRewardedSupport();
  const rewardScreen = createRewardScreen(document.getElementById('app')!);
  lifecycle.add(rewardScreen.dispose);
  let rewardFlowBusy = false;
  // Support benefits are independent of Web collection access.
  const supportPremium = () =>
    premium.state.owned || edition === 'premium' || testerPremiumActive(testerPremium);
  function showOver() {
    sceneContinuation = undefined;
    if (rewardFlowBusy) return;
    const eligible = !activeDaily && !activeTrial && !G.zen;
    const revive =
      eligible && !G.hard && G.state === 'dead' && !G.reviveOfferResolved && !G.secondWindUsed;
    if (revive) {
      rewardFlowBusy = true;
      void (async () => {
        if (revive) {
          const completed = await rewardScreen.offer(
            'revive',
            supportPremium(),
            testerPremiumActive(testerPremium),
            Math.max(1, Math.ceil(G.maxLives / 2)),
          );
          if (lifecycle.disposed) return;
          const granted = completed && (await rewardSupport.claim('revive', supportPremium()));
          if (lifecycle.disposed) return;
          G.reviveOfferResolved = true;
          captureCheckpoint('lost');
          if (granted) {
            G.secondWindUsed = true;
            rewardFlowBusy = false;
            reviveDaruma(false, true);
            return;
          }
        }
        rewardFlowBusy = false;
        showOver();
      })();
      return;
    }
    if (activeDaily) {
      finishDaily();
      return;
    }
    delete $('over').dataset.daily;
    if (activeTrial) {
      finishTrial(G.reason === 'quit' ? 'You ended the attempt.' : 'A mistake ended the trial.');
      return;
    }
    if (G.state === 'over') return;
    if (G.state !== 'dead') captureCheckpoint('ended');
    G.state = 'over';
    guided.reset();
    audio.setPaused(false);
    timeScale = 1;
    presentationState.lbT = 0;
    clearHints();
    $('bossbar').classList.remove('on');
    const { record: rec, newBest: nb } = recordRun(ST, G);
    challenge('sc', G.score);
    if (!G.zen) store.set('issen.best', ST.bestScore);
    saveStats();
    unlockBossMilestone(META, runBossMilestone, SETUP);
    checkUnlocks();
    if (eligible && supportPremium()) rewardLedger.supportMultiplier = 2;
    const reward = settleRunReward(META, rewardLedger);
    const pending: PendingSupportReward | null =
      eligible &&
      !supportPremium() &&
      supportEmberBonusAmount(META, rewardLedger.pending) > 0 &&
      savedRun
        ? {
            id: crypto.randomUUID(),
            hundredths: rewardLedger.pending,
            reward,
            checkpoint: structuredClone(savedRun),
          }
        : null;
    if (pending) store.set('issen.supportReward', pending);
    const modeReveals: ResultReveal[] = pendingModeReveals(META).map((mode) => ({
      key: '開',
      name: mode.name,
      kind: 'mode',
      description: mode.description,
    }));
    if (!runTrialsWasUnlocked && trialsUnlocked(ST.roninWave))
      modeReveals.push({
        key: '試',
        name: 'Trials',
        kind: 'mode',
        description: 'Preset challenges are now on the title screen.',
      });
    markModeRevealsSeen(META);
    saveMeta();
    G.claps = 0;
    renderGameOver($('over'), G, rec, nb, STAGES[G.stage]!.n, reward, G.upgradesEnabled);
    $('overSeed').textContent = `Seed ${G.seed}`;
    showScreen('over');
    hud(false);
    G.overReady = false;
    $('bAgain').disabled = true;
    runResults.start(
      reward,
      [...modeReveals, ...runItemReveals],
      () => {
        store.remove('issen.supportReward');
        G.overReady = true;
        $('bAgain').disabled = false;
      },
      pending ? () => claimEmberBonus(pending) : undefined,
      pending ? supportEmberBonusAmount(META, pending.hundredths) : 0,
    );
    setBestLine();
    clearRunCheckpoint();
    savedRun = null;
    updateSavedRunButtons();
  }
  async function claimEmberBonus(pending: PendingSupportReward) {
    const completed = await rewardScreen.offer('embers', false, false, 0);
    if (lifecycle.disposed || !completed || !(await rewardSupport.claim('embers', false)))
      return null;
    if (lifecycle.disposed) return null;
    const before = { ...META };
    const bonus = grantSupportEmberBonus(META, pending.id, pending.hundredths);
    if (!bonus) return null;
    if (!saveMeta()) {
      Object.assign(META, before);
      toast({ k: '!', msg: 'Reward could not be saved. Please try again.' });
      return null;
    }
    store.remove('issen.supportReward');
    const total = {
      before: pending.reward.before,
      gained: pending.reward.gained + bonus.gained,
      after: bonus.after,
    };
    renderGameOver(
      $('over'),
      G,
      ST.rec[modeKey()] ?? { score: G.score, combo: G.maxCombo, wave: G.wave },
      false,
      STAGES[G.stage]!.n,
      total,
      G.upgradesEnabled,
    );
    return total;
  }
  function recoverSupportReward() {
    const pending = parsePendingSupport(store.get('issen.supportReward', null));
    if (!pending || pending.id === META.supportRewardClaim) {
      store.remove('issen.supportReward');
      return;
    }
    Object.assign(G, pending.checkpoint.run, {
      bless: new Set(pending.checkpoint.run.bless),
      state: 'over',
      panel: null,
    });
    renderGameOver(
      $('over'),
      G,
      ST.rec[modeKey()] ?? { score: G.score, combo: G.maxCombo, wave: G.wave },
      false,
      STAGES[G.stage]!.n,
      pending.reward,
      G.upgradesEnabled,
    );
    showScreen('over');
    hud(false);
    G.overReady = false;
    $('bAgain').disabled = true;
    runResults.start(
      pending.reward,
      [],
      () => {
        store.remove('issen.supportReward');
        G.overReady = true;
        $('bAgain').disabled = false;
      },
      () => claimEmberBonus(pending),
      supportEmberBonusAmount(META, pending.hundredths),
    );
  }
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
  const { cinematic, sceneFilm, previewStage } = createCinematicWiring({
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
    if (G.boss) updateBoss(dt, raw);
    updateWave(dt);
    if (G.state === 'standoff') updateStandoff(dt);
    if (G.state === 'between') {
      G.nextT -= dt;
      if (G.nextT <= 0) {
        if (activeTrial) {
          if (trialFailure) finishTrial(trialFailure);
          else if (activeTrial.waveCount && G.wave < activeTrial.waveCount) startTrialEncounter();
          else if (activeTrial.bosses && G.bossesSlain < activeTrial.bosses.length)
            startTrialEncounter();
          else finishTrial();
        } else if (!G.afterBoss && G.wave % 3 === 0) startBoss();
        else if (G.afterBoss) {
          G.afterBoss = false;
          openShrine();
        } else nextStep();
      }
    }
    if (G.state === 'dead' && !rewardFlowBusy) {
      G.deathT += raw;
      P.fall = clamp((G.deathT - 0.3) / 0.9);
      timeScale = lerp(0.3, 0.6, clamp(G.deathT / 1.5));
      if (G.deathT > 1.8) {
        if (G.bless.has('phoenix') && !G.phoenixUsed) reviveDaruma(true);
        else if (G.m.daruma && !G.darumaUsed) reviveDaruma();
        else showOver();
      }
    }
    updateFx(dt, raw);
    renderTrialObjective();
    updateTransition(raw);
    advancePresentationCamera(presentationState, raw);
    audio.update(raw, STAGES[G.stage]!.weather, presentationState.wind, WX.wo);
  }

  /* ---------------- render ---------------- */
  function drawPlayer() {
    const p = L.player;
    drawFigure({
      x: p.x + P.lean * p.h,
      y: p.y + P.fall * p.h * 0.22,
      h: p.h,
      back: true,
      fog: 0,
      d: P.d,
      pose: P.pose,
      secondary: apparelMotion.sample(),
      waiting: P.swingT > 0.6 && !P.fall,
      lean: 0,
      rot: -P.fall * 0.28,
      noShadow: true,
      pal: playerRobePalette(),
      robeAura: isRobeSp() ? ROBE_AWAKENINGS[EQ.robe]?.aura : null,
      blade: bladeStyle(),
      bladeId: EQ.blade,
      robeId: EQ.robe,
      variant: (ROBES[EQ.robe] || {}).variant,
      cape: (ROBES[EQ.robe] || {}).cape,
      coat: (ROBES[EQ.robe] || {}).coat,
      rf: ROBES[EQ.robe],
      charm: CHARMCOL[EQ.charm],
      charmId: EQ.charm,
      crest: EQ.crest === 'nocrest' ? null : EQ.crest,
      pet: petOf(),
    });
  }
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
  function settlePresentedScene() {
    if (sceneLoading && sceneReadyToPresent) {
      sceneLoading = false;
      sceneReadyToPresent = false;
      cvs.dataset.sceneState = 'ready';
      const continuation = sceneContinuation;
      sceneContinuation = undefined;
      const paused = G.state === 'paused';
      continuation?.();
      if (paused && G.state !== 'paused') {
        G.pausedFrom = G.state;
        G.state = 'paused';
      }
      frameLoop.resetClock();
    }
  }
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
