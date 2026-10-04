import { setSealTextures } from './rendering/ui-art.ts';
import { createScrollMenus } from './ui/scroll-menus.ts';
import { dailyRun, dailyResult, type DailyRun } from './game/progression/daily.ts';
import { mountStartupLoading } from './ui/startup-loading.ts';
import { createStageVisitSeeds } from './rendering/environment/stage-variation.ts';
import { createInkCharmRenderer } from './rendering/figures/ink-charms.ts';
import { createInkCompanionRenderer } from './rendering/figures/ink-companions.ts';
import { createInkEnemyRenderer } from './rendering/figures/ink-enemy.ts';
import { createInkPlayerRenderer } from './rendering/figures/ink-player.ts';
import { createInkSwordRenderer } from './rendering/figures/ink-sword.ts';
import { premium, premiumEnabled, listenToPurchases } from './platform/purchases.ts';
import { SUPPORTER_FILM_ITEM } from './game/content/items.ts';
import {
  editionAccess,
  itemAccessible,
  trialAccessible,
  type GameEdition,
} from './platform/editions.ts';
import { swiftSlashPoints, precisionZone, duelMasterTimings } from './game/progression/mastery.ts';
import { PREMIUM_FILM } from './platform/premium.ts';
import { renderSupport } from './ui/screens/support.ts';
import type { Item, ItemCategory } from './game/content/items.ts';
import type { Enemy } from './game/combat/enemy.ts';
import type { Boss } from './game/encounters/boss.ts';
import type { Screen } from './game/run-state.ts';
import type { Direction } from './shared/directions.ts';
import type { Figure } from './rendering/figures/types.ts';
import type { GrassBlade, Leaf } from './rendering/scene/ambient.ts';
import type { WeatherParticle, Bamboo } from './rendering/scene/weather-state.ts';
import { createLifecycle } from './platform/lifecycle.ts';
import { createFrameLoop } from './platform/frame-loop.ts';
import { createHud } from './ui/hud.ts';
import { createRunState, resetRun } from './game/run-state.ts';
import type { PreviewFrame } from './rendering/armory-preview.ts';
import { createArmoryPreview } from './rendering/armory-preview.ts';
import { activeNow, pageActive, onActivityChange } from './platform/activity.ts';
import { createSecondaryMotion } from './rendering/figures/secondary-motion.ts';
import { createArmoryScreen } from './ui/screens/armory.ts';
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
import { createAmbient } from './rendering/scene/ambient.ts';
import { createWeatherRenderer } from './rendering/scene/weather-draw.ts';
import { createWeatherParticles } from './rendering/scene/weather-particles.ts';
import { createWeatherState } from './rendering/scene/weather-state.ts';
import { updateWeather as simulateWeather } from './rendering/scene/weather-update.ts';
import {
  REST_POSE as PREST,
  createPlayerAnimation,
  startSwing,
  updatePlayerAnimation,
} from './rendering/figures/player.ts';
import { comboMultiplier, scoreGain } from './game/progression/scoring.ts';
import { createEffectSpawner } from './rendering/effects/spawn.ts';
import { createEffectRenderer } from './rendering/effects/draw.ts';
import { createEffects } from './rendering/effects/state.ts';
import { createEffectQuality, scaledCount, preferredDensity } from './rendering/effects/quality.ts';
import {
  chooseDeathStyle,
  deathDuration,
  deathShadowOpacity,
  BOSS_SHADOW_DURATION,
  SHADOW_DURATION,
  applyDeathPose,
} from './rendering/figures/death.ts';
import { parseSettings, preferenceEnabled, sensitivityScale } from './platform/settings.ts';
import { createCinematic } from './ui/screens/cinematic.ts';
import { createOptions } from './ui/screens/options.ts';
import { updateEffects } from './rendering/effects/update.ts';
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
import { renderStatistics, bindProfileReset } from './ui/screens/stats.ts';
import { bindSaveTransfer } from './ui/screens/save-transfer.ts';
import { bindProfileManagement } from './ui/screens/profile-management.ts';
import { deleteCurrentProfile } from './platform/storage.ts';
import { createFigureRenderer } from './rendering/figures/figure.ts';
import { unlockEligibleItems } from './game/progression/unlocks.ts';
import { parseArmorySeen } from './game/progression/armory-seen.ts';
import { makeFig, EPOSE, mixPose, approachPose } from './rendering/figures/model.ts';
import { applyFilm } from './rendering/effects/film.ts';
import { createDemonRealmRenderer } from './rendering/environment/demon-realm.ts';
import { blob, createBackground } from './rendering/scene/background.ts';
import { createEnvironmentRenderer } from './rendering/environment/index.ts';
import { BASE, createPalette } from './rendering/palette.ts';
import { drawEnso as renderEnso, enemyGlyphCue } from './rendering/glyphs.ts';
import { waveConfig, bossParameters } from './game/encounters/configuration.ts';
import { bindPointer } from './input/pointer.ts';
import { bindKeyboard } from './input/keyboard.ts';
import { createSetupScreen } from './ui/screens/setup.ts';
import { renderTemplate } from './ui/screens/template.ts';
import { renderAdmin } from './ui/screens/admin.ts';
import { createTutorial } from './ui/screens/tutorial.ts';
import { createGuidedLessons } from './game/onboarding/guided-lessons.ts';
import {
  parseMeta,
  templateModifiers,
  templatePowers,
  EMPTY_UPGRADES,
  TEMPLATE_UPGRADES,
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
import { FORTUNES } from './game/content/fortunes.ts';
import { BLESS, TIER, TIERNAME, BLESS_BY } from './game/content/blessings.ts';
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
import { renderTrials } from './ui/screens/trials.ts';
import { renderPauseBlessings } from './ui/screens/pause.ts';
import { itemPresentation } from './ui/screens/item-presentation.ts';
import type { TrialResult } from './ui/screens/trials.ts';
import { DEATH_REASONS } from './ui/screens/game-over.ts';
import { deathsTotal } from './game/progression/statistics.ts';
import { createAudio } from './audio/audio.ts';
import { computeModifiers } from './game/equipment/modifiers.ts';
import {
  store,
  isTestProfile,
  switchTestProfile,
  clearTestProfile,
  clearActiveProfile,
} from './platform/storage.ts';
import { STAGES } from './game/content/stages.ts';
import { TAU, clamp, lerp, easeOut, easeInOut, angDiff } from './shared/math.ts';
import { rng, restorableRng, newRunSeed, shuffle } from './shared/random.ts';
import {
  readRunCheckpoint,
  writeRunCheckpoint,
  clearRunCheckpoint,
} from './platform/run-checkpoint.ts';
import type { RunCheckpoint } from './platform/run-checkpoint.ts';
import { DIRS, OPP, DANG, directionMatches } from './shared/directions.ts';
import { kanji, roman } from './shared/format.ts';
import { createHaptics, createCombatHaptics } from './platform/haptics.ts';
export function startGame(): () => void {
  const lifecycle = createLifecycle();
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
    mainG = context2d(cvs);
  const g = mainG;
  const environmentRenderer = createEnvironmentRenderer(cvs.ownerDocument);
  lifecycle.add(environmentRenderer.dispose);
  const demonRealmRenderer = createDemonRealmRenderer(cvs.ownerDocument);
  lifecycle.add(demonRealmRenderer.dispose);
  const inkCharm = createInkCharmRenderer(cvs.ownerDocument);
  const inkCompanion = createInkCompanionRenderer(cvs.ownerDocument);
  const inkEnemy = createInkEnemyRenderer(cvs.ownerDocument);
  const inkPlayer = createInkPlayerRenderer(cvs.ownerDocument);
  const inkSword = createInkSwordRenderer(cvs.ownerDocument);
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
  const premiumAccess = () => editionAccess(edition, premium.state.owned);
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
  const saveMeta = () => store.set('issen.meta', META);
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
  function captureCheckpoint(status: RunCheckpoint['status'] = 'active') {
    if (
      activeTrial ||
      !['playing', 'boss', 'standoff', 'between', 'shrine', 'dead'].includes(G.state)
    )
      return;
    const { bless, ...run } = G;
    const checkpoint: RunCheckpoint = {
      version: 1,
      status,
      seed: G.seed,
      randomState: runRandom.state(),
      run: { ...run, bless: [...bless], attacker: null, panel: null },
      stats: ST,
      awakening: AWAKENING,
      meta: META,
      unlocks: [...UNL],
      equipment: EQ,
      setup: activeDaily?.setup ?? SETUP,
      ledger: rewardLedger,
      weather: WX,
      bossMilestone: runBossMilestone,
      offers: shrineOfferIds,
      dailyDay: activeDaily?.day,
    };
    if (writeRunCheckpoint(checkpoint)) savedRun = readRunCheckpoint();
    else toast({ k: '!', msg: 'Run could not be saved on this device.' });
    updateSavedRunButtons();
  }
  function updateSavedRunButtons() {
    const available = savedRun?.status === 'active';
    $('bContinue').hidden = !available;
    $('bAbandon').hidden = !available;
    $('bPlay').textContent = available ? 'Start new run' : 'Draw your blade';
    for (const id of ['bArmory', 'bStats', 'bTemplate', 'bTutorial', 'bTrials'])
      ($(id) as HTMLButtonElement).disabled = available;
    $('tSeed').textContent = available
      ? savedRun!.dailyDay
        ? `Daily · ${savedRun!.dailyDay}`
        : `Saved run · seed ${savedRun!.seed}`
      : '';
  }
  function restoreCheckpoint(checkpoint: RunCheckpoint) {
    activeDaily = checkpoint.dailyDay ? dailyRun(checkpoint.dailyDay) : null;
    ST = activeDaily ? structuredClone(playerStats) : playerStats;
    EQ = activeDaily ? { ...activeDaily.equipment } : playerEquipment;
    Object.assign(ST, preserveSecretDiscoveries(parseStatistics(checkpoint.stats), ST));
    if (!activeDaily) {
      Object.assign(AWAKENING, parseAwakeningProgress(checkpoint.awakening));
      Object.assign(META, parseMeta(checkpoint.meta, ST, UNL));
      UNL.clear();
      for (const id of checkpoint.unlocks) if (id !== PREMIUM_FILM) UNL.add(id);
      reconcileCinematicCompanion(ST, UNL);
      if (premiumAccess()) UNL.add(PREMIUM_FILM);
      Object.assign(SETUP, checkpoint.setup);
      Object.assign(EQ, parseEquipment(checkpoint.equipment, accessibleUnlocks(), ITEMS));
    }
    Object.assign(G, checkpoint.run, { bless: new Set(checkpoint.run.bless) });
    if (G.so) G.so.e = G.enemies.find((e) => e.challenger) ?? G.so.e;
    G.attacker = null;
    G.panel = null;
    G.shrineRerolls = premiumAccess() ? G.shrineRerolls : 0;
    shrineOfferIds = checkpoint.offers;
    rewardLedger = checkpoint.ledger;
    runBossMilestone = checkpoint.bossMilestone;
    runTemplate = templateModifiers(META, activeDaily?.setup ?? SETUP, premiumAccess());
    runRandom = restorableRng(checkpoint.seed);
    combatRandom = runRandom.next;
    if (!activeDaily) {
      saveStats();
      saveAwakening();
      saveMeta();
      store.set('issen.unlocks', [...UNL]);
      store.set('issen.equip', playerEquipment);
    }
    setStage(G.stage, false);
    Object.assign(WX, checkpoint.weather);
    runRandom.restore(checkpoint.randomState);
    for (const enemy of G.enemies) enemy.pos = enemyPos(enemy);
    if (G.boss) G.boss.pos = bossPos(G.boss);
    computeMods();
    renderLives();
    setScore();
    applySeal();
    hud(true);
    $('waveLbl').textContent =
      G.state === 'boss' ? '決闘' : G.state === 'standoff' ? '挑' : `第${kanji(G.wave)}陣`;
    if (G.boss) {
      $('bossK').textContent = G.boss.def.k;
      $('bossN').textContent = G.boss.def.n;
      renderHp();
      $('bossbar').classList.toggle('on', G.state === 'boss');
    } else $('bossbar').classList.remove('on');
  }
  function continueSavedRun() {
    if (!savedRun || savedRun.status !== 'active') return;
    const checkpoint = savedRun;
    restoreCheckpoint(checkpoint);
    if (G.state === 'shrine' && shrineOfferIds)
      showShrineOffers(shrineOfferIds.map((id) => BLESS_BY[id]).filter((bl) => !!bl));
    else showScreen(null);
    frameLoop.resetClock();
  }
  function abandonSavedRun() {
    if (!savedRun || savedRun.status !== 'active') return;
    restoreCheckpoint(savedRun);
    G.reason = 'quit';
    captureCheckpoint('ended');
    showOver();
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
    if (!activeTrial && !activeDaily) store.set('issen.stats', ST);
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
  let bg: HTMLCanvasElement | null = null,
    prevBg: HTMLCanvasElement | null = null,
    stageFade = 0;
  function buildBG() {
    const result = createBackground(W, H, DPR, G.stage);
    bg = result.canvas;
    L.glows = result.glows;
  }

  /* ---------------- ambient ---------------- */
  let mistSprite: HTMLCanvasElement | null = null,
    vig: HTMLCanvasElement | null = null;
  let mists: { x: number; y: number; w: number; h: number; a: number; v: number }[] = [],
    fg: GrassBlade[] = [],
    mid: GrassBlade[] = [],
    leaves: Leaf[] = [],
    wx: WeatherParticle[] = [];
  const grainCanv: HTMLCanvasElement[] = [],
    grainPats: (CanvasPattern | null)[] = [];
  const WX = createWeatherState(() => 0.5);
  const cinematicWeather = createWeatherState(() => 0.5);
  function buildMist() {
    const st = STAGES[G.stage]!;
    mistSprite = document.createElement('canvas');
    mistSprite.width = mistSprite.height = 128;
    const m = context2d(mistSprite);
    const gr = m.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, `rgba(${st.mist},1)`);
    gr.addColorStop(0.5, `rgba(${st.mist},.45)`);
    gr.addColorStop(1, `rgba(${st.mist},0)`);
    m.fillStyle = gr;
    m.fillRect(0, 0, 128, 128);
    mists = [];
    for (let i = 0; i < 10; i++)
      mists.push({
        x: R() * W,
        y: L.horizonY + R() * (L.groundY - L.horizonY + H * 0.06),
        w: W * (0.45 + R() * 0.7),
        h: H * (0.05 + R() * 0.07),
        a: 0.08 + R() * 0.13,
        v: (5 + R() * 12) * S,
      });
  }
  function ambient() {
    return createAmbient({
      width: W,
      height: H,
      scale: S,
      layout: L,
      random: R,
      density: density(),
    });
  }
  function buildGrass() {
    const built = ambient().buildGrass(STAGES[G.stage]!.gl);
    fg = built.fg;
    mid = built.mid;
  }
  function newLeaf(anywhere: boolean) {
    return ambient().newLeaf(anywhere);
  }
  function buildLeaves() {
    leaves = ambient().buildLeaves();
  }
  function gustLeaves(n: number) {
    ambient().gustLeaves(leaves, n);
  }
  let bamboo: Bamboo[] = [],
    smokeSprite: HTMLCanvasElement | null = null,
    weatherDensity = 1;
  function buildWeather(resetSimulation = true) {
    const w = STAGES[G.stage]!.weather;
    weatherDensity = density();
    const built = createWeatherParticles(w, W, H, S, R, weatherDensity);
    wx = built.particles;
    bamboo = built.bamboo;
    if (w === 'smoke') {
      if (!smokeSprite) {
        smokeSprite = document.createElement('canvas');
        smokeSprite.width = smokeSprite.height = 128;
        const m = context2d(smokeSprite);
        const gr = m.createRadialGradient(64, 64, 0, 64, 64, 64);
        gr.addColorStop(0, 'rgba(14,12,11,1)');
        gr.addColorStop(0.55, 'rgba(14,12,11,.6)');
        gr.addColorStop(1, 'rgba(14,12,11,0)');
        m.fillStyle = gr;
        m.fillRect(0, 0, 128, 128);
      }
    }
    if (resetSimulation) Object.assign(WX, createWeatherState(combatRandom));
  }
  function rebalanceWeather() {
    const target = createWeatherParticles(STAGES[G.stage]!.weather, W, H, S, R, density());
    if (wx.length > target.particles.length) wx.length = target.particles.length;
    else if (wx.length < target.particles.length) wx.push(...target.particles.slice(wx.length));
    weatherDensity = density();
  }
  function buildPost() {
    if (!grainCanv.length) {
      for (let k = 0; k < 3; k++) {
        const c = document.createElement('canvas');
        c.width = c.height = 180;
        const x = context2d(c);
        const id = x.createImageData(180, 180);
        for (let i = 0; i < id.data.length; i += 4) {
          const v = R() < 0.5 ? 0 : 255;
          id.data[i] = id.data[i + 1] = id.data[i + 2] = v;
          id.data[i + 3] = R() * 36;
        }
        x.putImageData(id, 0, 0);
        grainCanv.push(c);
        grainPats.push(mainG.createPattern(c, 'repeat'));
      }
    }
    vig = document.createElement('canvas');
    vig.width = Math.max(1, Math.round(W));
    vig.height = Math.max(1, Math.round(H));
    const v = context2d(vig);
    const gr = v.createRadialGradient(
      W / 2,
      H * 0.46,
      Math.min(W, H) * 0.25,
      W / 2,
      H * 0.46,
      Math.max(W, H) * 0.78,
    );
    gr.addColorStop(0, 'rgba(0,0,0,0)');
    gr.addColorStop(0.55, 'rgba(0,0,0,.16)');
    gr.addColorStop(1, 'rgba(0,0,0,.72)');
    v.fillStyle = gr;
    v.fillRect(0, 0, W, H);
    inkEdge = document.createElement('canvas');
    inkEdge.width = vig.width;
    inkEdge.height = vig.height;
    const k = context2d(inkEdge),
      m = Math.min(W, H),
      r2 = rng(99);
    const fr = k.createRadialGradient(
      W / 2,
      H / 2,
      Math.min(W, H) * 0.32,
      W / 2,
      H / 2,
      Math.max(W, H) * 0.72,
    );
    fr.addColorStop(0, 'rgba(14,5,4,0)');
    fr.addColorStop(1, 'rgba(14,5,4,.85)');
    k.fillStyle = fr;
    k.fillRect(0, 0, W, H);
    for (let i = 0; i < 70; i++) {
      const sd = (r2() * 4) | 0,
        t = r2(),
        rad = m * (0.05 + r2() * 0.14);
      const x = sd === 0 ? t * W : sd === 1 ? W + rad * 0.3 : sd === 2 ? t * W : -rad * 0.3,
        y = sd === 0 ? -rad * 0.3 : sd === 1 ? t * H : sd === 2 ? H + rad * 0.3 : t * H;
      const rg = k.createRadialGradient(x, y, 0, x, y, rad);
      rg.addColorStop(0, 'rgba(12,4,3,.95)');
      rg.addColorStop(0.6, 'rgba(12,4,3,.6)');
      rg.addColorStop(1, 'rgba(12,4,3,0)');
      k.fillStyle = rg;
      k.beginPath();
      k.arc(x, y, rad, 0, TAU);
      k.fill();
    }
  }
  let inkEdge: HTMLCanvasElement | null = null,
    inkA = 0,
    inkPulse = 0,
    hbT = 0,
    hbP = 0;
  function setStage(si: number, anim: boolean) {
    stageSeed = stageVisits.enter(si);
    if (anim && bg) {
      prevBg = bg;
      stageFade = 1;
    }
    G.stage = si;
    MIST = STAGES[si]!.fog;
    palette.clearFog();
    buildBG();
    buildMist();
    buildGrass();
    buildWeather();
  }
  const snowGrass = new WeakMap<GrassBlade[], GrassBlade[]>();
  const demonGrass = new WeakMap<GrassBlade[], GrassBlade[]>();
  function blades(list: GrassBlade[], t: number, snowTips = false, demonic = false) {
    let visible = list;
    if (snowTips) {
      let cached = snowGrass.get(list);
      if (!cached) {
        cached = list
          .filter((_, index) => index % 9 === 0)
          .map((blade) => ({
            ...blade,
            h: blade.h * 0.17,
            w: blade.w * 0.6,
          }));
        snowGrass.set(list, cached);
      }
      visible = cached;
    }
    if (demonic) {
      let cached = demonGrass.get(list);
      if (!cached) {
        const foreground = list === fg;
        cached = list
          .filter((_, index) => !foreground || index % 2 === 0)
          .map((blade, index) => ({
            ...blade,
            h: blade.h * (foreground ? 0.28 : 0.65),
            w: blade.w * 0.7,
            col: index % 5 === 0 ? 'rgba(164,145,122,.65)' : 'rgba(86,71,64,.8)',
          }));
        demonGrass.set(list, cached);
      }
      visible = cached;
    }
    ambient().blades(
      g,
      visible,
      demonic && reducedMotion() ? 0 : t,
      demonic && reducedMotion() ? 1 : wind,
    );
  }
  function drawLeaves(front: boolean) {
    ambient().drawLeaves(g, leaves, front);
  }
  function weatherRenderer() {
    return createWeatherRenderer(g, {
      weather: STAGES[G.stage]!.weather,
      width: W,
      height: H,
      scale: S,
      time,
      wind,
      hazard: G.m.hazard,
      particles: wx,
      bamboo,
      state: cinematic.active ? cinematicWeather : WX,
      smokeSprite,
    });
  }
  function drawWeather() {
    weatherRenderer().drawWeather();
  }
  function drawSmoke() {
    weatherRenderer().drawSmoke();
  }
  /* ---------------- figures ---------------- */
  function figureRenderer() {
    {
      void inkCharm.prepare();
      void inkCompanion.prepare();
      void inkEnemy.prepare();
      void inkPlayer.prepare();
      void inkSword.prepare();
    }
    return createFigureRenderer(g, {
      inkCharm,
      inkCompanion,
      inkEnemy,
      inkPlayer,
      inkSword,
      time,
      wind,
      petActive: G.petT > 0,
      width: W,
      height: H,
      palette: cols,
      random: R,
      effectDensity: density(),
      reducedMotion: reducedMotion(),
      reducedFlashes: reducedFlashes(),
    });
  }
  function drawFigure(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawFigure']>) {
    return figureRenderer().drawFigure(...args);
  }
  function drawSplit(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawSplit']>) {
    return figureRenderer().drawSplit(...args);
  }
  function drawPetAt(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawPetAt']>) {
    return figureRenderer().drawPetAt(...args);
  }
  function drawSword(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawSword']>) {
    return figureRenderer().drawSword(...args);
  }
  function drawGlint(...args: Parameters<ReturnType<typeof createFigureRenderer>['drawGlint']>) {
    return figureRenderer().drawGlint(...args);
  }
  function tipOf(...args: Parameters<ReturnType<typeof createFigureRenderer>['tipOf']>) {
    return figureRenderer().tipOf(...args);
  }
  function petOf() {
    return EQ.pet === 'nopet' && EQ.robe === 'scarecrow' ? 'crow' : EQ.pet;
  }
  function drawFoxfire() {
    if (!G.m || !G.m.foxfire) return;
    const p = L.player,
      x = p.x + p.h * 0.34 + Math.cos(time * 1.4) * p.h * 0.05,
      y = p.y - p.h * 1.02 + Math.sin(time * 2.8) * p.h * 0.025,
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
    const tip = y - r * 1.6 - Math.sin(time * 9) * r * 0.3;
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
  function reviveDaruma(ph = false) {
    if (ph) G.phoenixUsed = true;
    else G.darumaUsed = true;
    timeScale = 1;
    lbT = 0;
    P.fall = 0;
    P.pose = { ...PREST };
    breakCombo();
    G.pStreak = 0;
    if (!G.zen && !G.hard) G.lives = ph ? G.maxLives : 1;
    renderLives();
    setScore();
    hud(true);
    inkPulse = 0;
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
    if (ph) banner('鳳凰', 'Rise from the ashes');
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
  function drawEnso(
    x: number,
    y: number,
    r: number,
    dir: Direction,
    o: Parameters<typeof renderEnso>[6],
  ) {
    renderEnso(
      g,
      { time, seal: SEAL, sealArc: SEALARC, font: FONT, perfectZone: pz(), noArc: !!G.m.noArc },
      x,
      y,
      r,
      dir,
      o,
    );
  }

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
  let time = 0,
    wind = 1,
    shake = 0,
    hitStop = 0,
    timeScale = 1,
    flashA = 0,
    flashCol = '255,255,255',
    frameN = 0,
    lb = 0,
    lbT = 0,
    zoom = 1,
    zoomX = 0,
    zoomY = 0;
  const G = createRunState(store.get('issen.hints', {}));
  const P = createPlayerAnimation();
  const apparelMotion = createSecondaryMotion();
  let fx = createEffects();
  const effectQuality = createEffectQuality();
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

  const hudView = createHud($('app'));
  const showScreen = hudView.showScreen;
  function renderLives() {
    hudView.renderLives(G);
  }
  function hud(on: boolean) {
    hudView.render(G, on, activeDaily ? 'Daily' : undefined);
  }
  function setScore() {
    hudView.renderScore(G);
  }
  const banner = hudView.showBanner;
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
      { access: META.upgrades.awakening, progress: AWAKENING },
    );
    if (UNL.size !== before) refreshArmoryNew();
  }
  function pop(x: number, y: number, text: string, size?: number) {
    const ax = portrait ? W * 0.25 : W * 0.18,
      ay = portrait ? H * 0.8 : H * 0.7,
      lh = Math.max(22, 26 * S);
    while (fx.pops.length >= 4) fx.pops.shift();
    const n = fx.pops.filter((q) => q.t < q.life * 0.7).length;
    fx.pops.push({
      x: ax,
      y: ay - n * lh,
      text,
      t: 0,
      life: 0.8,
      size: Math.min(size || Math.max(16, 19 * S), Math.max(18, 23 * S)),
    });
  }
  function addScore(pts: number, x: number, y: number, label?: string, size?: number) {
    pts = gain(pts);
    G.score += pts;
    setScore();
    if (G.zen) {
      if (label) pop(x, y, label, size);
    } else pop(x, y, (label ? label + ' ' : '') + '+' + pts, size);
    return pts;
  }
  function flash(a: number, col?: string) {
    flashA = Math.max(flashA, reducedFlashes() ? Math.min(a, 0.035) : a);
    flashCol = col || '255,255,255';
  }
  function stamp(text: string, x: number, y: number, size: number, seal: boolean, life?: number) {
    fx.stamps.push({
      text,
      x: portrait ? W * 0.27 : W * 0.18,
      y: portrait ? H * 0.62 : H * 0.36,
      size: size * 0.8,
      seal: !!seal,
      t: 0,
      life: (life || 1.1) * 0.75,
    });
  }
  function effectSpawner(state = fx, scale = S, preview = false) {
    return createEffectSpawner(state, {
      scale,
      random: R,
      density: density(),
      flash: preview ? () => {} : flash,
      sounds: sfx,
    });
  }
  function addSlash(...args: Parameters<ReturnType<typeof createEffectSpawner>['addSlash']>) {
    effectSpawner().addSlash(...args);
  }
  function inkBurst(...args: Parameters<ReturnType<typeof createEffectSpawner>['inkBurst']>) {
    effectSpawner().inkBurst(...args);
  }
  function scraps(...args: Parameters<ReturnType<typeof createEffectSpawner>['scraps']>) {
    effectSpawner().scraps(...args);
  }
  function ring(...args: Parameters<ReturnType<typeof createEffectSpawner>['ring']>) {
    effectSpawner().ring(...args);
  }
  function sparks(...args: Parameters<ReturnType<typeof createEffectSpawner>['sparks']>) {
    effectSpawner().sparks(...args);
  }
  function dust(...args: Parameters<ReturnType<typeof createEffectSpawner>['dust']>) {
    effectSpawner().dust(...args);
  }
  function letterbox(d: number) {
    lbT = Math.max(lbT, d);
  }
  function punch(z: number, x: number, y: number) {
    if (reducedMotion()) return;
    zoom = Math.max(zoom, z);
    zoomX = x;
    zoomY = y;
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
      time,
      perfectZone: pz,
      sounds: sfx,
      pet: EQ.pet,
      foxSave,
      playerDie,
      position: enemyPos,
    });
  }
  function startRun() {
    if (!activeTrial) {
      clearRunCheckpoint();
      savedRun = null;
      shrineOfferIds = null;
    }
    runTrialsWasUnlocked = trialsUnlocked(playerStats.roninWave);
    if (!activeTrial) Object.assign(SETUP, sanitizeSetup(SETUP, META));
    const setup = activeTrial
      ? {
          mode: 'waves' as const,
          diff: 'ronin' as const,
          arrows: activeTrial.arrows,
          lives: '0' as const,
          upgrades: false,
        }
      : (activeDaily?.setup ?? SETUP);
    runTemplate = templateModifiers(META, setup, premiumAccess());
    rewardLedger = createRunRewardLedger();
    runBossMilestone = 0;
    runItemReveals = [];
    guided.reset();
    audio.setPaused(false);
    if (!activeTrial) {
      G.seed = activeDaily?.seed ?? newRunSeed();
      runRandom = restorableRng(G.seed);
      combatRandom = runRandom.next;
    }
    resetRun(G, setup, EQ, combatRandom);
    stageSeed = stageVisits.enter(G.stage, true);
    Object.assign(G, templatePowers(META, setup, premiumAccess()));
    G.maxKnives = G.knives;
    computeMods();
    G.runWards = G.m.runWard;
    G.maxLives = normalLives(G.m.lives);
    if (!G.zen && !G.hard) G.lives = G.maxLives;
    G.freezeT = 0;
    G.wardUsed = false;
    P.fall = 0;
    P.swingT = 9;
    apparelMotion.reset();
    P.pose = { ...PREST };
    timeScale = 1;
    hitStop = 0;
    lbT = 0;
    for (const [key, particles] of Object.entries(fx))
      if (key !== 'scratches') particles.length = 0;
    ST.runs++;
    saveStats();
    clearHints();
    if (G.stage !== 0) setStage(0, true);
    else Object.assign(WX, createWeatherState(combatRandom));
    showScreen(null);
    hud(true);
    $('bossbar').classList.remove('on');
    G.pauseN = 0;
    if (activeTrial) {
      startTrialEncounter();
      setScore();
      return;
    }
    {
      const hr = new Date().getHours();
      if (recordSecretEvent(ST, { kind: 'midnight', hour: hr })) {
        saveStats();
        checkUnlocks();
      }
    }
    setScore();
    if (G.rush) {
      ST.rushRuns = (ST.rushRuns || 0) + 1;
      startRushDuel();
      hint(
        'rush',
        'Boss rush. Only duels, one after another, with a shrine after every victory.',
        5500,
      );
    } else startWave(1);
    if (G.fortune) toast({ k: G.fortune.k, msg: `Omikuji: ${G.fortune.n}. ${G.fortune.d}` });
    if (G.blade)
      hint(
        'blade',
        'No arrows. Raised high is up, held low is down, held out to a side is that side.',
        6500,
      );
    if (G.zen)
      hint(
        'zen',
        'Endless combo. You cannot die, but every mistake breaks your chain. End the run from pause.',
        6500,
      );
  }
  function startDaily() {
    activeDaily = dailyRun();
    ST = structuredClone(playerStats);
    EQ = { ...activeDaily.equipment };
    applySeal();
    G.panel = null;
    audioInit();
    startRun();
  }
  function startTrial(id: string) {
    const trial = TRIALS.find((entry) => entry.id === id);
    if (
      !trial ||
      !trialAccessible(id, premiumAccess()) ||
      activeTrial ||
      !trialsUnlocked(playerStats.roninWave) ||
      G.state !== 'title'
    )
      return;
    activeTrial = trial;
    trialFailure = '';
    trialResult = null;
    combatRandom = rng(trial.seed);
    // Legacy combat counters write into a disposable statistics object during trials.
    // Armoury and normal runs retain the original profile objects.
    ST = structuredClone(playerStats);
    EQ = {
      ...DEFAULT_EQUIPMENT,
      fx: playerEquipment.fx,
      film: playerEquipment.film,
      seal: playerEquipment.seal,
    };
    G.panel = null;
    audioInit();
    startRun();
  }
  function startTrialEncounter() {
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
  function nextStep() {
    if (G.rush) startRushDuel();
    else startWave(G.wave + 1);
  }
  function startRushDuel() {
    const n = G.bossCount + 1;
    G.wave = n;
    G.event = null;
    G.wardUsed = false;
    G.blessingTriggers.flourishWard = false;
    G.kikuUsed = 0;
    G.foxUsed = false;
    G.kagamiUsed = false;
    G.so = null;
    const si = (n - 1) % STAGES.length;
    G.lap = Math.floor((n - 1) / STAGES.length);
    if (si !== G.stage) setStage(si, true);
    G.cfg = waveCfg(Math.min(30, n * 3));
    G.enemies = G.enemies.filter((e) => e.state === 'dying');
    G.pendingSpawns = [];
    G.toSpawn = 0;
    G.attacker = null;
    startBoss();
    $('waveLbl').textContent = `決闘 ${kanji(n)}`;
  }
  function startWave(n: number, skipEvent = false) {
    G.wave = n;
    startBlessingWave(G);
    G.event = null;
    G.wardUsed = false;
    renderLives();
    G.kikuUsed = 0;
    G.foxUsed = false;
    G.kagamiUsed = false;
    G.so = null;
    if (
      G.m.regen &&
      n > 1 &&
      (n - 1) % G.m.regen === 0 &&
      !G.zen &&
      !G.hard &&
      G.lives < G.maxLives
    ) {
      G.lives++;
      renderLives();
      pop(W / 2, H * 0.5, '延命 +1 life', Math.max(20, 24 * S));
    }
    if (n >= 9 && !G.zen && !G.lostLife && !ST.flawless) ST.flawless = 1;
    const si = Math.floor((n - 1) / 3) % STAGES.length,
      lap = Math.floor((n - 1) / (3 * STAGES.length)),
      changed = si !== G.stage || lap !== G.lap;
    G.lap = lap;
    if (si !== G.stage) setStage(si, true);
    const st = STAGES[si]!;
    if (!G.zen) {
      if (G.blade) ST.bladeWave = Math.max(ST.bladeWave || 0, n);
      if (!G.lostLife) ST.flawlessWave = Math.max(ST.flawlessWave || 0, n);
      {
        const q = bst();
        if (q) {
          q.w = Math.max(q.w, n);
          if (G.mode === 'ronin') q.rw = Math.max(q.rw, n);
        }
        challenge('w', n);
        if (G.mode === 'ronin') challenge('rw', n);
      }
      ST.bestWave = Math.max(ST.bestWave, n);
      if (G.mode === 'ronin') ST.roninWave = Math.max(ST.roninWave, n);
      ST.furthestStage = Math.max(ST.furthestStage, Math.floor((n - 1) / 3));
    }
    saveStats();
    checkUnlocks();
    let ev: 'standoff' | 'blood' | 'fog' | null = null;
    if (
      !skipEvent &&
      n >= 4 &&
      n - G.lastEv >= 2 &&
      combatRandom() < 0.3 * (G.m.standoff > 1 ? 1.4 : 1)
    ) {
      const q = combatRandom();
      ev = q < (G.m.standoff > 1 ? 0.7 : 0.4) ? 'standoff' : q < 0.7 ? 'blood' : 'fog';
      G.lastEv = n;
    }
    if (ev === 'standoff') {
      if (st.hint) hint('stage' + si, st.hint, 5000);
      startStandoff(n, changed);
      return;
    }
    G.event = ev;
    G.cfg = waveCfg(n);
    if (ev === 'blood') waveConfiguration().atk *= 0.82;
    G.state = 'playing';
    G.enemies = G.enemies.filter((e) => e.state === 'dying');
    G.attacker = null;
    G.toSpawn = waveConfiguration().total;
    G.gapT = 1.2;
    G.pendingSpawns = [];
    G.pendingSpawns = initialSpawns(
      waveConfiguration().pack,
      !!((changed && n > 1) || ev),
      combatRandom,
    );
    if (changed && n > 1) {
      banner(st.k, `${st.n}${lap ? ' ' + roman(lap + 1) : ''}, wave ${n}`);
      G.gapT = 1.9;
    } else if (ev === 'blood') {
      banner('赤月', 'Blood moon. Faster blades, double score.');
      G.gapT = 1.9;
    } else if (ev === 'fog') {
      banner('霧', 'Fog. Only the attacker shows himself.');
      G.gapT = 1.9;
    } else banner(`第${kanji(n)}陣`, `Wave ${n}`);
    $('waveLbl').textContent = ev === 'blood' ? '赤月' : ev === 'fog' ? '霧' : `第${kanji(n)}陣`;
    sfx.drum();
    if (n === 1) hint('swipe', 'Swipe the way his blade points.', 7000);
    if (n === 2 || G.mode === 'ronin')
      hint(
        'perfect',
        'Wait until his ring reaches the red arc, then cut, for a perfect cut.',
        5000,
      );
    if (waveConfiguration().refill) hint('refill', 'The pack no longer thins. Keep cutting.', 4000);
    if (waveConfiguration().feint)
      hint('feint', 'A trembling seal may feint. Watch the blade turn.', 5000);
    if (st.hint) hint('stage' + si, st.hint, 5000);
    if (ev === 'blood')
      hint('blood', 'Blood moon. They strike faster, but every cut scores double.', 4500);
    if (ev === 'fog')
      hint('fog', 'Fog. The rest of the pack is hidden. Cut whoever steps out.', 4500);
    captureCheckpoint();
  }
  function updateWave(dt: number) {
    simulateWave(
      G,
      dt,
      {
        spawn: (slot) => spawnEnemy(slot),
        attack: (c) => {
          const blessing = nextBlessingAttacker(G);
          if (blessing === 'lightning') {
            const p = c.pos;
            effectSpawner().killFx('bolt', p.x, p.y - p.h * 0.55, -Math.PI / 2, p.h / 160);
            killEnemy(c, c.dir, true, true);
            pop(p.x, p.y - p.h, '雷', Math.max(20, 26 * S));
            return;
          }
          if (blessing === 'hesitate') {
            c.T += 0.75;
            pop(c.pos.x, c.pos.y - c.pos.h, '間', Math.max(18, 22 * S));
          }
          sfx.step();
          dust(c.pos.x, c.pos.y, c.pos.h * 0.4);
        },
        cleared: (bonus) => {
          earn('wave');
          if (recoverAfterWave(G)) {
            renderLives();
            pop(W / 2, H * 0.4, 'Recovery +1 life');
          }
          addScore(bonus, W / 2, H * 0.42, '陣破', Math.max(20, 26 * S));
        },
      },
      combatRandom,
    );
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
      fx.swords.push({
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
        fx.coins.push({ x0: e.pos.x, y0: e.pos.y - e.pos.h * 0.6, t: 0, life: 0.8 });
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
    fx.stains.push({
      x: P0.x + (R() - 0.5) * P0.h * 0.2,
      y: P0.y + P0.h * 0.01,
      rx: P0.h * (0.12 + R() * 0.1),
      t: 0,
      life: SHADOW_DURATION,
    });
    if (!automatic) swingPlayer(dir);
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
      shake = Math.max(shake, 10 * S);
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
      shake = Math.max(shake, 7 * S);
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
  function weatherBurst(cx: number, cy: number, sc: number) {
    const w = STAGES[G.stage]!.weather;
    if (w === 'rain' || w === 'storm') {
      for (let i = 0; i < scaledCount(16, density()); i++) {
        const a = R() * TAU,
          sp = (120 + R() * 260) * sc;
        fx.splash.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 80 * sc,
          t: 0,
          life: 0.4 + R() * 0.3,
          c: '215,220,225',
        });
      }
    } else if (w === 'snow') {
      for (let i = 0; i < scaledCount(22, density()); i++) {
        const a = R() * TAU,
          sp = (60 + R() * 200) * sc;
        fx.splash.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 60 * sc,
          t: 0,
          life: 0.8 + R() * 0.6,
          c: '246,244,238',
          drift: 1,
        });
      }
      dust(cx, cy + 30 * sc, 60 * sc);
    } else if (w === 'sakura') {
      for (let i = 0; i < scaledCount(14, density()); i++) {
        const a = R() * TAU,
          sp = (60 + R() * 240) * sc;
        fx.petals.push({
          x: cx,
          y: cy,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp - 100 * sc,
          rot: R() * TAU,
          vr: (R() - 0.5) * 10,
          s: (2 + R() * 2.5) * sc,
          t: 0,
          life: 1.4 + R() * 0.8,
        });
      }
    } else if (w === 'smoke') {
      for (let i = 0; i < scaledCount(14, density()); i++)
        fx.embers.push({
          x: cx + (R() - 0.5) * 30 * sc,
          y: cy,
          vx: (R() - 0.5) * 140 * sc,
          vy: -(80 + R() * 200) * sc,
          t: 0,
          life: 0.7 + R() * 0.8,
          ph: R() * TAU,
        });
    } else if (w !== 'night') {
      for (let i = 0; i < scaledCount(8, density()); i++) {
        const l = newLeaf(false);
        l.x = cx + (R() - 0.5) * 40 * sc;
        l.y = cy + (R() - 0.5) * 40 * sc;
        l.z = 1.3 + R() * 0.6;
        l.s = (3 + R() * 4) * l.z * S;
        l.gust = 1;
        l.col = 'rgba(24,23,21,.85)';
        leaves.push(l);
      }
    }
  }
  function killFx(cx: number, cy: number, ang: number, sc: number) {
    weatherBurst(cx, cy, sc);
    effectSpawner().killFx(accessible(EQ.fx) ? EQ.fx : 'ink', cx, cy, ang, sc);
  }
  function swingPlayer(dir: Direction | 'block') {
    if (EQ.blade === 'koken' && G.state !== 'title') sfx.hum();
    startSwing(P, dir);
    apparelMotion.kick(dir, reducedMotion());
  }
  function onSwipe(dir: Direction) {
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
    if (G.state === 'playing') {
      const outcome = targetSwipe(G.enemies, G.attacker, activeTrial?.mirrored ? OPP[dir] : dir, {
        ordered: waveConfiguration().ordered,
        centerX: W / 2,
        mirrorAvailable: !!(G.m.kagami && !G.kagamiUsed),
        axisOnly: !!G.m.axisCut,
      });
      if (outcome.kind === 'cut') {
        if (outcome.mirror) G.kagamiUsed = true;
        killEnemy(outcome.target, dir, outcome.mirror);
        if (waveConfiguration().ordered) guided.orderSucceeded();
        if (outcome.mirror) {
          pop(0, 0, '鏡');
          sfx.glint();
        }
      } else if (outcome.kind === 'miss') {
        swingPlayer(dir);
        sfx.whoosh();
        playerDie(outcome.killer, outcome.reason);
      }
    } else if (G.state === 'boss') bossSwipe(dir);
  }

  /* ---------------- boss ---------------- */
  function startBoss() {
    refillDuelKnives(G);
    G.blessingTriggers.flourishWard = false;
    renderLives();
    G.bossCount++;
    const b = createBoss(G.bossCount, G.mode, G.m, bossPos),
      { def, lap } = b;
    G.boss = b;
    G.state = 'boss';
    G.attacker = null;
    G.event = null;
    const nm = def.n + (lap ? ' ' + roman(lap + 1) : '');
    banner(def.k, nm);
    $('waveLbl').textContent = '決闘';
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
  function renderHp() {
    hudView.renderBossHealth(G.boss);
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
    shake = Math.max(shake, 11 * S);
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
    if (guided.tap()) return;
    if (G.state === 'playing') {
      const target = throwKnife(G, combatRandom);
      if (!target) return;
      const pos = enemyPos(target);
      const wasAttacker = G.attacker === target;
      target.pos = pos;
      target.state = 'dying';
      target.t = 0;
      target.shadowTime = 0;
      target.deathGround = { ...pos };
      target.k = 0;
      target.deathType = 'stagger';
      target.fallDir = 1;
      target.cutAng = -Math.PI / 4;
      if (wasAttacker) {
        G.attacker = null;
        G.gapT = waveConfiguration().gap;
      }
      G.kills++;
      ST.kills++;
      earn('kill');
      addScore(
        Math.round((wasAttacker ? 140 : 120) * comboMult() * G.m.normal),
        pos.x,
        pos.y - pos.h,
        'Knife',
      );
      fx.knives.push({
        x0: L.player.x,
        y0: L.player.y - L.player.h * 0.55,
        x1: pos.x,
        y1: pos.y - pos.h * 0.55,
        t: 0,
        life: 0.18,
      });
      sparks(pos.x, pos.y - pos.h * 0.55, 10);
      sfx.whoosh();
      buzz(8);
      hud(true);
      saveStats();
      return;
    }
    if (G.state === 'standoff') {
      const so = G.so;
      if (so && !so.done && !so.fired) {
        so.done = true;
        swingPlayer('block');
        playerDie(so.e, 'early');
      }
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
    shake = Math.max(shake, 7 * S);
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
      shake = Math.max(shake, 12 * S);
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
        fx.stains.push({
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
  function startStandoff(n: number, changed: boolean) {
    const st = STAGES[G.stage]!;
    G.state = 'standoff';
    G.cfg = waveCfg(n);
    G.enemies = G.enemies.filter((e) => e.state === 'dying');
    G.attacker = null;
    G.pendingSpawns = [];
    G.toSpawn = 0;
    const B = L.boss;
    const e: Enemy = {
      feintAt: 0,
      pos: { x: 0, y: 0, h: 0, fog: 0, alpha: 1 },
      slot: 2,
      fixed: { x: B.x, y: B.y, h: B.h * 0.82, fog: 0.05 },
      dir: DIRS[(combatRandom() * 4) | 0]!,
      fake: null,
      switched: false,
      order: 0,
      state: 'idle',
      t: 0,
      life: 0,
      p: 0,
      T: 1,
      k: 0,
      d: makeFig((combatRandom() * 1e9) | 0),
      pose: { ...EPOSE.guard },
      snap: 0,
      lean: 0,
      look: pickLook(9),
      glint: 0,
      challenger: true,
    };
    e.pos = enemyPos(e);
    G.enemies.push(e);
    G.so = createStandoff(e, n, G.mode, G.m.parry, G.m.soWin, combatRandom);
    banner(
      '挑',
      changed ? `A challenger in the ${st.n.toLowerCase()}` : 'A challenger blocks the road',
    );
    $('waveLbl').textContent = '挑';
    letterbox(99);
    sfx.drum();
    hint(
      'standoff',
      'A standoff. Stay still. The instant he draws, cut the way his blade points. Moving early is death.',
      6500,
    );
    captureCheckpoint();
  }
  function updateStandoff(dt: number) {
    simulateStandoff(
      G,
      dt,
      {
        nextWave: (n) => {
          lbT = 0;
          startWave(n, true);
        },
        step: () => sfx.step(),
        draw: () => {
          sfx.glint();
          flash(0.2);
        },
        late: (e) => playerDie(e, 'late'),
      },
      combatRandom,
    );
  }
  function standoffSwipe(dir: Direction) {
    const so = G.so,
      outcome = resolveStandoffSwipe(so, dir, !!G.m.axisCut);
    if (outcome === 'ignore' || !so) return;
    const e = so.e;
    if (outcome === 'cut') {
      const p = e.pos,
        cx = p.x,
        cy = p.y - p.h * 0.55,
        a = DANG[dir],
        v: [number, number] = [Math.cos(a), Math.sin(a)],
        M = Math.max(W, H) * 1.3,
        sc = p.h / 160;
      e.state = 'dying';
      e.t = 0;
      e.cutAng = a;
      e.shadowTime = 0;
      e.deathGround = { ...p };
      if (!G.m.bonk && accessible(EQ.fx) && EQ.fx === 'scattered-armour') e.deathType = 'scatter';
      else if (
        !G.m.bonk &&
        accessible(EQ.fx) &&
        ['falling-leaves', 'ember-ash', 'ink-wash'].includes(EQ.fx)
      )
        e.deathType = 'dissolve';
      e.k = 0;
      swingPlayer(dir);
      addSlash(cx - v[0] * M, cy - v[1] * M, cx + v[0] * M, cy + v[1] * M, Math.max(3, 3 * S), 0.6);
      killFx(cx, cy, a + Math.PI / 2, sc);
      scraps(cx, cy, 10, sc);
      ring(cx, cy, p.h * 0.1, p.h * 1.3, 0.5, Math.max(2, 3 * S));
      stamp('一閃', W / 2, H * 0.3, Math.max(56, 80 * S), true, 1.4);
      punch(1.08, cx, cy);
      hitStop = 0.22;
      flash(0.4);
      sfx.perfect();
      combatHaptics.play('slice');
      G.combo++;
      bumpCombo();
      G.kills++;
      ST.kills++;
      ST.standoffs++;
      challenge('k');
      earn('kill');
      addScore(
        Math.round(1000 * comboMult() * G.m.standoff),
        cx,
        p.y - p.h * 1.1,
        '挑',
        Math.max(22, 28 * S),
      );
      saveStats();
      checkUnlocks();
    } else {
      swingPlayer(dir);
      sfx.whoosh();
      playerDie(e, outcome);
    }
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
    shake = Math.max(shake, 12 * S);
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
      if (outcome.lifeLost) inkPulse = 1;
      struck(killer, outcome.keepCombo, outcome.label);
      return;
    }
    G.diedInBoss = !!(G.boss && G.boss.state !== 'dying');
    G.state = 'dead';
    G.deathT = 0;
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
    shake = Math.max(shake, 18 * S);
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
    lbT = 0;
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
  function showOver() {
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
    lbT = 0;
    clearHints();
    $('bossbar').classList.remove('on');
    const { record: rec, newBest: nb } = recordRun(ST, G);
    challenge('sc', G.score);
    if (!G.zen) store.set('issen.best', ST.bestScore);
    saveStats();
    unlockBossMilestone(META, runBossMilestone, SETUP);
    checkUnlocks();
    const reward = settleRunReward(META, rewardLedger);
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
    runResults.start(reward, [...modeReveals, ...runItemReveals], () => {
      G.overReady = true;
      $('bAgain').disabled = false;
    });
    setBestLine();
    clearRunCheckpoint();
    savedRun = null;
    updateSavedRunButtons();
  }
  function setBestLine() {
    $('bTrials').hidden = !trialsUnlocked(playerStats.roninWave);
    $('tBest').textContent =
      (ST.bestScore ? `Best ${ST.bestScore.toLocaleString()}` : '') +
      (ST.bestRonin ? `   Ronin best ${ST.bestRonin.toLocaleString()}` : '');
  }
  function toTitle() {
    activeDaily = null;
    ST = playerStats;
    EQ = playerEquipment;
    applySeal();
    G.panel = null;
    G.state = 'title';
    G.mode = 'normal';
    G.blade = false;
    G.zen = false;
    clearHints();
    refreshArmoryNew();
    showScreen('title');
    hud(false);
    $('bossbar').classList.remove('on');
    timeScale = 1;
    lbT = 0;
    if (G.stage !== 0) setStage(0, true);
    setupAttract();
    P.fall = 0;
    P.pose = { ...PREST };
    setBestLine();
  }
  function openPanel(id: Screen) {
    G.panelFrom = hudView.activeScreen || 'title';
    G.panel = id;
    if (id === 'support') {
      supportPreview.draw(previewFrame(PREMIUM_FILM, false));
      renderSupport($('support'), premium.state, premium.available);
      void premium.refresh();
    }
    if (id === 'armory') {
      renderArmory();
      void premium.refresh();
    }
    if (id === 'stats') renderStats();
    if (id === 'setup') renderSetup();
    if (id === 'template') renderTemplate($('templateContent'), META, saveMeta, premiumAccess());
    if (id === 'admin') showAdmin();
    if (id === 'trials')
      renderTrials(
        $('trials'),
        TRIAL_PROGRESS,
        playerStats.roninWave,
        trialResult,
        startTrial,
        () => {
          trialResult = null;
          G.panel = null;
          showScreen('title');
        },
        premiumAccess(),
      );
    showScreen(id);
  }
  const setupScreen = createSetupScreen(
    $('setup'),
    SETUP,
    (setup) => store.set('issen.setup', setup),
    {
      getMilestone: () => META.bossMilestone,
      hasVitality: () => META.upgrades.vitality >= 1,
      getReveals: () => pendingModeReveals(META),
      getLoadoutSummary: () => {
        const power = templatePowers(META, SETUP, premiumAccess());
        const summary: string[] = [];
        if (power.tanto > 0) summary.push(`${power.tanto} Tanto strikes`);
        if (power.knives > 0) summary.push(`${power.knives} knives`);
        if (power.composure > 0) summary.push(`${power.composure} combo protections`);
        if (EQ.charm === 'omikuji') summary.push('Fortune rolled at run start');
        return summary.join(' · ');
      },
      onRevealed: () => {
        markModeRevealsSeen(META);
        saveMeta();
      },
      onRevealSound: () => sfx.glint(),
    },
  );
  const renderSetup = () => {
    setupScreen.render();
    const daily = dailyRun();
    $('dailyDate').textContent = daily.day;
    $('dailyLoadout').textContent =
      `${ITEM_BY[daily.equipment.blade]?.n} · ${ITEM_BY[daily.equipment.robe]?.n} · ${ITEM_BY[daily.equipment.charm]?.n}`;
  };
  const tutorial = createTutorial(
    $('app'),
    (status) => {
      META.tutorial = status;
      saveMeta();
      toTitle();
    },
    reducedMotion,
  );
  function launchTutorial() {
    toTitle();
    tutorial.start();
  }
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
  function showAdmin() {
    renderAdmin(
      $('adminContent'),
      [
        ...ITEMS,
        ...Object.keys({ ...SPECIAL, ...ROBE_AWAKENINGS }).map((id) => ({
          id: id + '+',
          n: `${ITEM_BY[id]?.n ?? id} awakened`,
        })),
        { id: 'steel++', n: 'Tamahagane third awakening' },
      ],
      STAGES,
      {
        testing: isTestProfile(),
        modeMilestone: META.bossMilestone,
        trialsUnlocked: trialsUnlocked(playerStats.roninWave),
        upgradesEnabled: SETUP.upgrades !== false,
        tutorialStatus: META.tutorial,
        embers: META.embers,
        currentLives: G.lives,
        currentKnives: G.knives,
        currentStage: G.stage,
        currentWave: G.wave,
        clearProfile: () => clearTestProfile(),
        unlockAll: () => {
          if (!isTestProfile()) return;
          const ids = [
            ...ITEMS.map((item) => item.id),
            ...Object.keys({ ...SPECIAL, ...ROBE_AWAKENINGS }).map((id) => id + '+'),
            'steel++',
          ];
          for (const id of ids) {
            UNL.add(id);
            revoked.delete(id);
          }
          store.set('issen.revoked', [...revoked]);
          store.set('issen.unlocks', [...UNL]);
          // Endless and No lives share the first Vitality access gate.
          META.upgrades.vitality = Math.max(1, META.upgrades.vitality);
          saveMeta();
          refreshArmoryNew();
          showAdmin();
        },
        unlockRonin: () => {
          if (!isTestProfile() || META.bossMilestone >= 2) return;
          META.bossMilestone = 2;
          META.revealSeen = Math.max(META.revealSeen, 2);
          saveMeta();
        },
        setTrialsUnlocked: (enabled) => {
          if (!isTestProfile()) return;
          if (enabled && META.bossMilestone < 2) {
            META.bossMilestone = 2;
            META.revealSeen = Math.max(META.revealSeen, 2);
            saveMeta();
          }
          playerStats.roninWave = enabled ? Math.max(10, playerStats.roninWave) : 0;
          store.set('issen.stats', playerStats);
          runTrialsWasUnlocked = enabled;
          setBestLine();
        },
        switchProfile: (enabled) => {
          if (!switchTestProfile(enabled))
            toast({ k: '!', msg: 'Profile switching is unavailable in this browser session.' });
        },
        jump: testJump,
        restart: () => testJump(G.stage, ((Math.max(1, G.wave) - 1) % 3) + 1, !!G.boss),
        item: (id, action) => {
          if (!isTestProfile()) return;
          const awakened = id.endsWith('+');
          const third = id === 'steel++';
          const base = id.replace(/\++$/, '');
          const item = ITEM_BY[base];
          if (!item || (awakened && !SPECIAL[base] && !ROBE_AWAKENINGS[base])) return;
          if (action === 'remove') {
            if (!Object.values(DEFAULT_EQUIPMENT).includes(id)) revoked.add(id);
            if (!awakened) revoked.add(id + '+');
            if (base === 'steel' && !awakened) revoked.add('steel++');
            UNL.delete(id);
            if (!awakened) UNL.delete(id + '+');
            if (base === 'steel' && !awakened) UNL.delete('steel++');
            for (const value of Object.values(DEFAULT_EQUIPMENT))
              if (typeof value === 'string') UNL.add(value);
            Object.assign(EQ, parseEquipment(EQ, UNL, ITEMS));
            if (!UNL.has(EQ.blade + '+')) EQ.bladeSp = false;
            if (!UNL.has('steel++')) EQ.bladeThird = false;
            if (!UNL.has(EQ.robe + '+')) EQ.robeSp = false;
          } else {
            revoked.delete(base);
            revoked.delete(id);
            UNL.add(base);
            UNL.add(id);
            if (action === 'equip') {
              EQ[item.type] = base;
              if (item.type === 'blade') {
                EQ.bladeSp = awakened && !third;
                EQ.bladeThird = third;
              }
              if (item.type === 'robe') EQ.robeSp = awakened;
            }
          }
          store.set('issen.revoked', [...revoked]);
          store.set('issen.unlocks', [...UNL]);
          store.set('issen.equip', playerEquipment);
          computeMods();
          applySeal();
          G.runBlade = EQ.blade;
          G.runRobe = EQ.robe;
        },
        lives: (value) => {
          if (!Number.isFinite(value)) return;
          G.maxLives = Math.max(1, Math.min(99, Math.floor(value)));
          G.lives = Math.max(0, Math.min(99, Math.floor(value)));
          renderLives();
        },
        currency: (value) => {
          if (Number.isFinite(value)) {
            META.embers = Math.max(0, Math.min(1000000, Math.floor(value)));
            saveMeta();
          }
        },
        resetUpgrades: () => {
          META.upgrades = { ...EMPTY_UPGRADES };
          saveMeta();
        },
        upgrades: TEMPLATE_UPGRADES.map((upgrade) => ({
          ...upgrade,
          rank: META.upgrades[upgrade.id],
        })),
        setUpgrade: (id, rank) => {
          const definition = TEMPLATE_UPGRADES.find((u) => u.id === id);
          if (!definition || !Number.isFinite(rank)) return;
          META.upgrades[definition.id] = Math.max(
            0,
            Math.min(definition.maxRank, Math.floor(rank)),
          );
          saveMeta();
        },
        setKnives: (value) => {
          if (Number.isFinite(value)) {
            G.knives = Math.max(0, Math.min(3, Math.floor(value)));
            G.maxKnives = Math.max(G.maxKnives, G.knives);
            hud(true);
          }
        },
        setUpgradesEnabled: (enabled) => {
          SETUP.upgrades = enabled;
          store.set('issen.setup', SETUP);
        },
        completeChallenge: (id) => {
          const base = id.replace(/\++$/, '');
          const definition =
            id === 'steel++' ? STEEL_THIRD : (SPECIAL[base] ?? ROBE_AWAKENINGS[base]);
          if (!definition) return;
          const table = SPECIAL[base] ? AWAKENING.blades : AWAKENING.robes;
          const row = (table[base] ??= { k: 0, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 });
          row[definition.need[0]] = definition.need[1];
          saveAwakening();
          checkUnlocks();
        },
        milestone: (value) => {
          META.bossMilestone = Math.max(0, Math.min(3, value));
          META.revealSeen = META.bossMilestone;
          Object.assign(SETUP, sanitizeSetup(SETUP, META));
          saveMeta();
        },
        tutorial: (value) => {
          META.tutorial = value;
          saveMeta();
        },
        replayTutorial: launchTutorial,
        replayReveals: () => {
          META.revealSeen = 0;
          saveMeta();
          G.panelFrom = 'title';
          G.panel = 'setup';
          renderSetup();
          showScreen('setup');
        },
        inspect: () =>
          `Stage ${G.stage + 1}, wave ${G.wave}, lives ${G.lives}; knives ${G.knives}\n${META.embers} Embers; mode milestone ${META.bossMilestone}; Trials ${trialsUnlocked(playerStats.roninWave)}; awakening access ${META.upgrades.awakening > 0}; next run upgrades ${SETUP.upgrades !== false}\nRanks: ${JSON.stringify(META.upgrades)}\nModifiers: ${JSON.stringify(G.m)}`,
      },
    );
  }
  function closePanel() {
    G.panel = null;
    if (G.panelFrom === 'title') setBestLine();
    showScreen(G.panelFrom);
  }
  const scrollMenus = createScrollMenus($('app'));
  lifecycle.add(scrollMenus.dispose);
  function applySettings() {
    scrollMenus.update(settings.menuStyle, reducedMotion());
    if (!settings.vibration) combatHaptics.stop();
    audio.setMuted(settings.muted);
    audio.setVolumes(settings.effectsVolume, settings.ambienceVolume);
    setMuteIcon();
    $('app').classList.toggle('large-text', settings.textSize === 'large');
    $('app').classList.toggle('reduced-motion', reducedMotion());
    document.documentElement.dataset.motion = settings.reducedMotion;
    $('app').dataset.reducedFlashes = String(reducedFlashes());
    if (reducedMotion()) {
      shake = 0;
      zoom = 1;
    }
    if (reducedFlashes()) flashA = Math.min(flashA, 0.035);
    if (bg) {
      ambient().balanceLeaves(leaves);
      rebalanceWeather();
    }
  }
  function saveSettings() {
    store.set('issen.settings', settings);
    store.set('issen.muted', settings.muted);
    applySettings();
  }
  const options = createOptions(
    $('options'),
    settings,
    () => {
      audioInit();
      saveSettings();
    },
    closePanel,
  );
  lifecycle.add(options.dispose);
  lifecycle.listen(systemMotion, 'change', applySettings);
  applySettings();
  const armory = createArmoryScreen($('armory'), {
    items: ITEMS,
    equipment: EQ,
    unlocks: UNL,
    owns: (id) => accessible(id) && (id === PREMIUM_FILM ? premiumAccess() : UNL.has(id)),
    accessible,
    progress: (id) =>
      id === 'falling-leaves'
        ? `Kills: ${Math.min(ST.kills, 1000)} / 1,000`
        : id === 'ember-ash'
          ? `Duels: ${Math.min(ST.duels, 50)} / 50`
          : id === 'ink-wash'
            ? `Best run perfect cuts: ${Math.min(ST.bestRunPerfects, 100)} / 100`
            : id === 'pilgrims-bead'
              ? `Duels: ${Math.min(ST.duels, 10)} / 10`
              : '',
    statistics: ST,
    seen: ARMORY_SEEN,
    onViewed: () => {
      store.set('issen.armorySeen', [...ARMORY_SEEN]);
      refreshArmoryNew();
    },
    seals: SEALS,
    charms: CHARMCOL,
    awakeningAccess: (type) => META.upgrades.awakening >= (type === 'robe' ? 2 : 1),
    awakeningProgress: (id, type) =>
      type === 'blade' ? AWAKENING.blades[id] : AWAKENING.robes[id],
    powersEnabled: () => SETUP.upgrades !== false,
    events: {
      equipped: (equipment) => {
        store.set('issen.equip', equipment);
        computeMods();
        applySeal();
        G.runBlade = EQ.blade;
        G.runRobe = EQ.robe;
      },
      awaken: () => sfx.glint(),
      preview: demoKill,
    },
  });
  const renderArmory = armory.render;
  function refreshArmoryNew() {
    const unread = armory.hasNew();
    $('bArmory').classList.toggle('arm-unread', unread);
    if (unread) $('bArmory').setAttribute('aria-description', 'Unviewed equipment');
    else $('bArmory').removeAttribute('aria-description');
  }
  let previewDemon = false;
  let cinematicStage = 0;
  let cinematicStageSeed = stageSeed;
  let cinematicFilm = EQ.film;
  function previewStage(stage: number, newVisit = true) {
    if (newVisit) stageSeed = previewVisits.enter(stage, true);
    previewDemon = stage === STAGES.length;
    G.stage = previewDemon ? 0 : stage;
    if (newVisit) setupAttract();
    MIST = previewDemon ? [80, 66, 85] : STAGES[stage]!.fog;
    palette.clearFog();
    prevBg = null;
    stageFade = 0;
    buildBG();
    buildMist();
    buildGrass();
    buildWeather(false);
    Object.assign(
      cinematicWeather,
      createWeatherState(() => 0.5),
    );
  }
  const cinematic = createCinematic($('app'), {
    canOpen: () => G.state === 'title' && !G.panel,
    stage: () => G.stage,
    scenes: [...STAGES.map((stage) => stage.n), 'Demon'],
    bindings: () => settings.bindings,
    film: () => EQ.film,
    films: () =>
      ITEMS.filter((item) => item.type === 'film' && accessible(item.id) && UNL.has(item.id)),
    enter(stage) {
      if (recordSecretEvent(ST, { kind: 'cinematic' })) saveStats();
      if (reconcileCinematicCompanion(ST, UNL)) {
        store.set('issen.unlocks', [...UNL]);
        toast({ k: '石', msg: 'Unlocked: Mystic Rock companion' });
      }
      cinematicStage = G.stage;
      cinematicStageSeed = stageSeed;
      cinematicFilm = EQ.film;
      previewStage(stage);
    },
    scene: previewStage,
    leave: () => {
      stageSeed = cinematicStageSeed;
      previewStage(cinematicStage, false);
      setupAttract();
    },
    grade: (value) => {
      cinematicFilm = value;
    },
  });
  lifecycle.add(cinematic.dispose);
  const logo = document.querySelector<HTMLElement>('#title .t-k')!;
  lifecycle.listen(logo, 'keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      event.stopPropagation();
      cinematic.open();
    }
  });
  const sceneFilm = () => (cinematic.active ? cinematicFilm : EQ.film);
  const KONAMI = 'up,up,down,down,left,right,left,right';
  let kseq: Direction[] = [];
  let tapN = 0,
    tapLast = 0;
  function titleTap() {
    if (G.state !== 'title' || G.panel) return;
    const now = activeNow();
    tapN = now - tapLast < 1500 ? tapN + 1 : 1;
    tapLast = now;
    audioInit();
    if (tapN < 20) {
      if (tapN >= 5) tn({ f0: 520 + (tapN - 5) * 55, dur: 0.07, g: 0.05 });
      return;
    }
    const completedTaps = tapN;
    tapN = 0;
    sfx.caw();
    flash(0.3, '230,220,190');
    if (recordSecretEvent(ST, { kind: 'titleTaps', count: completedTaps })) {
      saveStats();
      checkUnlocks();
    }
    toast({
      k: '案山子',
      msg: UNL.has('scarecrow')
        ? 'The Scarecrow is already yours'
        : 'Secret found. End a run to claim Scarecrow.',
    });
  }
  function konamiInput(d: Direction) {
    tapN = 0;
    if (G.state !== 'title' || G.panel) return;
    kseq.push(d);
    if (kseq.length > 8) kseq.shift();
    {
      const K = KONAMI.split(',');
      let m = 0;
      for (let n = Math.min(kseq.length, 8); n > 0; n--) {
        if (kseq.slice(-n).join() === K.slice(0, n).join()) {
          m = n;
          break;
        }
      }
      if (m > 0 && m < 8) {
        audioInit();
        tn({ f0: 900 + m * 120, dur: 0.08, g: 0.05 });
      }
    }
    if (kseq.join() === KONAMI) {
      kseq = [];
      audioInit();
      sfx.perfect();
      flash(0.4, '150,200,255');
      if (recordSecretEvent(ST, { kind: 'konami' })) {
        saveStats();
        checkUnlocks();
      }
      toast({
        k: '光剣',
        msg: UNL.has('koken')
          ? 'Kōken is already yours'
          : 'Secret found. End a run to claim Kōken.',
      });
    }
  }
  (() => {
    let sx = 0,
      sy = 0,
      id: number | null = null,
      done = false,
      logoTarget = false;
    const el = $('title');
    lifecycle.listen(el, 'pointerdown', (e) => {
      if (e.target instanceof Element && e.target.closest('button, a')) return;
      if (id !== null) return;
      id = e.pointerId;
      logoTarget = e.target instanceof Element && !!e.target.closest('.t-k, .t-wrap');
      done = false;
      sx = e.clientX;
      sy = e.clientY;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        /* Synthetic events and unavailable capture retain in-element handling. */
      }
    });
    const fire = (e: PointerEvent) => {
      if (e.pointerId !== id || done) return;
      const dx = e.clientX - sx,
        dy = e.clientY - sy;
      if (dx * dx + dy * dy < 900) return;
      done = true;
      konamiInput(
        Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up',
      );
    };
    lifecycle.listen(el, 'pointermove', fire);
    lifecycle.listen(el, 'pointerup', (e) => {
      if (e.pointerId !== id) return;
      fire(e);
      if (e.pointerId === id && !done) {
        if (logoTarget) cinematic.logoTap();
        else titleTap();
      }
      id = null;
    });
    lifecycle.listen(el, 'pointercancel', (e) => {
      if (e.pointerId === id) id = null;
    });
    lifecycle.listen(el, 'lostpointercapture', (e) => {
      if (e.pointerId === id) id = null;
    });
  })();
  function renderStats() {
    renderStatistics($('statGrid'), ST, UNL.size, ITEMS.length, META.earned);
  }
  lifecycle.add(bindProfileReset($('options'), deleteCurrentProfile, isTestProfile()));
  function flushProfile() {
    store.set('issen.stats', playerStats);
    store.set('issen.equip', playerEquipment);
    saveMeta();
    saveAwakening();
    store.set('issen.unlocks', [...UNL]);
  }
  lifecycle.add(bindProfileManagement($('options'), flushProfile));
  lifecycle.add(
    bindSaveTransfer(
      $('options'),
      document.querySelector('.title-version')?.textContent || '',
      () => {
        store.set('issen.stats', playerStats);
        store.set('issen.equip', playerEquipment);
        saveMeta();
        saveAwakening();
        store.set('issen.unlocks', [...UNL]);
      },
    ),
  );
  const preview = createArmoryPreview($('prevC'), {
    random: R,
    now: activeNow,
    sounds: sfx,
  });
  const supportPreview = createArmoryPreview($('supportPreview'), {
    random: rng(4242),
    now: activeNow,
    sounds: sfx,
  });
  lifecycle.add(preview.dispose);
  lifecycle.add(supportPreview.dispose);
  function demoKill() {
    preview.demo(armory.tab === 'fx' ? (armory.selected ?? EQ.fx) : EQ.fx, !!(G.m && G.m.bonk));
  }
  function drawPreview() {
    preview.draw(
      previewFrame(
        EQ.film === PREMIUM_FILM && !premiumAccess() ? 'mono' : EQ.film,
        armory.tab === 'fx',
      ),
    );
  }
  function previewFrame(film: string, effectsVisible: boolean): PreviewFrame {
    const rb = ROBES[EQ.robe] || {};
    return {
      time,
      wind,
      effectDensity: density(),
      reducedMotion: reducedMotion(),
      reducedFlashes: reducedFlashes(),
      petActive: G.petT > 0,
      palette: cols,
      background: bg,
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
      mistSprite,
    };
  }

  /* ---------------- input ---------------- */
  const disposePointer = bindPointer(cvs, {
    active: pageActive,
    activate: audioInit,
    threshold: () => {
      const k = G.m ? G.m.swipe : 1;
      return Math.max(22 * k, Math.min(W, H) * 0.055 * k) * sensitivityScale(settings.sensitivity);
    },
    swipe: (direction) => (cinematic.active ? cinematic.swipe(direction) : onSwipe(direction)),
    tapDown: () => (cinematic.active ? false : onTapDown()),
    tap: () => {
      if (!cinematic.active) onTap();
    },
  });
  lifecycle.listen($('bPlay'), 'click', () => {
    audioInit();
    if (savedRun?.status === 'active') abandonSavedRun();
    openPanel('setup');
  });
  lifecycle.listen($('bContinue'), 'click', () => {
    audioInit();
    continueSavedRun();
  });
  lifecycle.listen($('bAbandon'), 'click', () => {
    audioInit();
    abandonSavedRun();
  });
  lifecycle.listen($('bDaily'), 'click', startDaily);
  lifecycle.listen($('bBegin'), 'click', () => {
    audioInit();
    G.panel = null;
    startRun();
  });
  $('bSupport').hidden = !premiumEnabled;
  $('support').hidden = !premiumEnabled;
  lifecycle.add(
    premium.subscribe((state) => {
      if (lifecycle.disposed) return;
      $('premiumBadge').hidden = !premiumAccess();
      $('premiumBadge').textContent = edition === 'web' ? 'Web' : 'Premium';
      if (premiumAccess()) {
        UNL.add(PREMIUM_FILM);
        if (initialPurchaseCheck) {
          const restored = parseEquipment(savedEquipment, accessibleUnlocks(), ITEMS);
          for (const category of ['charm', 'fx', 'film', 'seal'] as const)
            if (!itemAccessible(restored[category], false))
              playerEquipment[category] = restored[category];
        }
        if (initialPurchaseCheck && savedFilm === PREMIUM_FILM && playerEquipment.film === 'mono') {
          playerEquipment.film = PREMIUM_FILM;
        }
        initialPurchaseCheck = false;
      } else {
        UNL.delete(PREMIUM_FILM);
        if (playerEquipment.film === PREMIUM_FILM) playerEquipment.film = 'mono';
        if (EQ.film === PREMIUM_FILM) EQ.film = 'mono';
      }
      if (!premiumAccess()) {
        Object.assign(playerEquipment, parseEquipment(playerEquipment, accessibleUnlocks(), ITEMS));
        if (EQ !== playerEquipment)
          Object.assign(EQ, parseEquipment(EQ, accessibleUnlocks(), ITEMS));
        if (G.state !== 'title') {
          runTemplate = templateModifiers(META, SETUP, false);
          G.shrineRerolls = 0;
          computeMods();
        }
      }
      renderSupport($('support'), state, premium.available);
      if (G.panel === 'armory') renderArmory();
      if (G.panel === 'template')
        renderTemplate($('templateContent'), META, saveMeta, premiumAccess());
      if (activeTrial && !trialAccessible(activeTrial.id, premiumAccess()))
        trialFailure = 'Premium access is required for this Trial.';
    }),
  );
  lifecycle.add(listenToPurchases());
  void premium.refresh().finally(() => {
    initialPurchaseCheck = false;
  });
  lifecycle.listen(document, 'visibilitychange', () => {
    if (!document.hidden) void premium.refresh();
  });
  lifecycle.listen($('bSupport'), 'click', () => openPanel('support'));
  const purchaseAction = async (action: () => Promise<void>) => {
    pause();
    audio.setPaused(true);
    await action();
    if (!lifecycle.disposed) audio.setPaused(G.state === 'paused' || guided.frozen);
  };
  lifecycle.listen($('bPurchasePremium'), 'click', () => {
    void purchaseAction(premium.purchase);
  });
  lifecycle.listen($('bRestorePremium'), 'click', () => {
    void purchaseAction(premium.restore);
  });
  lifecycle.listen($('bRefreshPremium'), 'click', () => {
    void premium.refresh();
  });
  lifecycle.listen($('bEquipPremium'), 'click', () => {
    if (!premiumAccess()) return;
    playerEquipment.film = PREMIUM_FILM;
    store.set('issen.equip', playerEquipment);
    $('supportMessage').textContent = 'Supporter Print selected. Change films any time in Armory.';
  });
  lifecycle.listen($('bArmory'), 'click', () => openPanel('armory'));
  lifecycle.listen($('bStats'), 'click', () => openPanel('stats'));
  lifecycle.listen($('bTemplate'), 'click', () => openPanel('template'));
  lifecycle.listen($('bTutorial'), 'click', launchTutorial);
  lifecycle.listen($('bTrials'), 'click', () => openPanel('trials'));
  const openOptions = () => {
    if (G.panel === 'options') return;
    openPanel('options');
    options.open();
  };
  lifecycle.listen($('bOptions'), 'click', openOptions);
  lifecycle.listen($('bPauseOptions'), 'click', openOptions);
  $('testBadge').hidden = !isTestProfile();
  lifecycle.listen(window, 'keydown', (event) => {
    if (event.ctrlKey && event.shiftKey && event.code === 'KeyA') {
      event.preventDefault();
      if (activeTrial) return;
      if (G.panel === 'admin') {
        closePanel();
        return;
      }
      pause();
      openPanel('admin');
    }
  });
  lifecycle.listen($('bAgain'), 'click', () => {
    if (G.overReady) {
      audioInit();
      startRun();
    }
  });
  lifecycle.listen($('bResume'), 'click', resume);
  lifecycle.listen($('bEnd'), 'click', endRun);
  lifecycle.listen($('pauseBtn'), 'pointerup', (e) => {
    e.stopPropagation();
    pause();
  });
  lifecycle.listen($('pauseBtn'), 'pointerdown', (e) => e.stopPropagation());
  lifecycle.listen($('bMenu'), 'click', toTitle);
  document.querySelectorAll('[data-back]').forEach((b) => lifecycle.listen(b, 'click', closePanel));
  const disposeKeyboard = bindKeyboard({
    active: pageActive,
    bindings: () => settings.bindings,
    state: () => ({ phase: G.state, panelOpen: !!G.panel, overReady: G.overReady }),
    closePanel: () => (G.panel === 'options' ? options.back() : closePanel()),
    titleDirection: konamiInput,
    start: () => {
      audioInit();
      startRun();
    },
    resume,
    pause,
    swipe: onSwipe,
    tapDown: onTapDown,
    tap: onTap,
  });
  function pause() {
    if (['playing', 'boss', 'between', 'standoff'].includes(G.state)) {
      G.pauseN = (G.pauseN || 0) + 1;
      if (recordSecretEvent(ST, { kind: 'pauses', count: G.pauseN })) {
        saveStats();
        checkUnlocks();
      }
      G.pausedFrom = G.state;
      G.state = 'paused';
      showPauseScreen();
    }
  }
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
  function resume() {
    if (G.state !== 'paused' || !G.pausedFrom) return;
    G.state = G.pausedFrom;
    audio.setPaused(guided.frozen);
    if (G.state === 'shrine' && shrineOfferIds)
      showShrineOffers(shrineOfferIds.map((id) => BLESS_BY[id]).filter((bl) => !!bl));
    else showScreen(null);
    renderTrialObjective();
    frameLoop.resetClock();
  }
  function endRun() {
    if (G.state !== 'paused' || !G.pausedFrom) return;
    G.state = G.pausedFrom;
    G.reason = 'quit';
    captureCheckpoint('ended');
    showOver();
  }

  /* ---------------- update ---------------- */
  function updateFx(dt: number, raw: number) {
    updateEffects(fx, dt, raw, {
      scale: S,
      wind,
      time,
      random: R,
      onSwordStuck: () => sfx.clink(),
    });
  }
  function updatePlayer(dt: number) {
    updatePlayerAnimation(P, dt, G.state === 'dead' || G.state === 'over');
  }
  function updateWeather(dt: number) {
    simulateWeather(cinematic.active ? cinematicWeather : WX, wx, dt, {
      weather: STAGES[G.stage]!.weather,
      phase: G.state,
      width: W,
      height: H,
      scale: S,
      wind,
      time,
      hazard: G.m.hazard,
      layout: L,
      random: R,
      hazardRandom: cinematic.active ? R : combatRandom,
      flash,
      sounds: sfx,
      gustLeaves,
      onShake: (amount) => {
        shake = Math.max(shake, amount);
      },
    });
  }
  function update(dt: number, raw: number) {
    if (activeTrial && trialFailure) {
      finishTrial(trialFailure);
      return;
    }
    time += dt;
    wind =
      1 +
      0.55 * Math.sin(time * 0.31) +
      0.35 * Math.sin(time * 0.87 + 1) +
      0.2 * Math.sin(time * 2.3);
    if (['playing', 'boss', 'between', 'standoff', 'shrine'].includes(G.state)) G.runTime += raw;
    for (const m of mists) {
      m.x += m.v * (0.5 + wind * 0.5) * dt;
      if (m.x - m.w / 2 > W) m.x = -m.w / 2;
    }
    ambient().updateLeaves(leaves, dt, time, wind);
    // Cinematic mode advances cosmetic time only: no encounters, weather hazards or run RNG.
    if (cinematic.active) {
      updateWeather(reducedMotion() ? 0 : dt);
      audio.update(raw, STAGES[G.stage]!.weather, wind, 0);
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
    if (G.state === 'dead') {
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
    if (stageFade > 0) {
      stageFade = Math.max(0, stageFade - raw / 1.3);
      if (!stageFade) prevBg = null;
    }
    if (lbT > 0) {
      lbT -= raw;
      lb += (1 - lb) * (1 - Math.exp(-raw * 14));
    } else lb += (0 - lb) * (1 - Math.exp(-raw * 5));
    zoom += (1 - zoom) * (1 - Math.exp(-raw * 7));
    audio.update(raw, STAGES[G.stage]!.weather, wind, WX.wo);
  }

  /* ---------------- render ---------------- */
  function drawEnemy(e: Enemy) {
    const p = e.pos;
    const f: Figure = {
      x: p.x,
      y: p.y,
      h: p.h,
      fog: p.fog,
      alpha: p.alpha,
      d: e.d,
      pose: e.pose,
      lean: e.lean,
      variant: e.look,
      varied: true,
      waiting: e.state === 'idle',
      glint: e.glint,
    };
    if (e.state !== 'dying') {
      drawFigure(f);
      return;
    }
    const t = e.t,
      dtp = e.deathType ?? 'split';
    figureRenderer().drawGroundShadow(e.deathGround ?? p, deathShadowOpacity(e.shadowTime ?? t));
    f.noShadow = true;
    f.glint = 0;
    if (dtp === 'scatter' && !reducedMotion()) {
      figureRenderer().drawScattered(f, e.cutAng ?? 0, t);
      return;
    }
    if (dtp === 'split' && !reducedMotion()) {
      drawSplit(f, p, e.cutAng ?? 0, t, deathDuration(dtp));
      return;
    }
    applyDeathPose(f, dtp, t, e.fallDir ?? 1, reducedMotion());
    drawFigure(f);
  }
  function drawBoss() {
    const b = G.boss;
    if (!b) return;
    const p = b.pos;
    const f = {
      x: p.x,
      y: p.y,
      h: p.h,
      fog: p.fog,
      alpha: p.alpha,
      d: b.d,
      pose: b.pose,
      lean: b.lean,
      variant: b.def.v,
      glint: b.glint,
      pal: b.def.pal ? robePal(b.def.pal) : null,
      twin: b.def.twin,
      spear: b.def.spear,
    };
    if (b.state === 'dying') {
      figureRenderer().drawGroundShadow(
        b.deathGround ?? p,
        deathShadowOpacity(b.shadowTime ?? b.t, BOSS_SHADOW_DURATION),
      );
      if (!G.m.bonk && accessible(EQ.fx) && EQ.fx === 'scattered-armour' && !reducedMotion())
        figureRenderer().drawScattered({ ...f, noShadow: true }, b.cutAng, b.t * (1.1 / 1.6));
      else drawSplit({ ...f, noShadow: true }, p, b.cutAng, b.t, 1.6);
    } else drawFigure(f);
    if (G.m.ofuda && b.state === 'feint') {
      const w = Math.max(26, p.h * 0.12),
        hh = w * 2.2,
        tx = p.x + p.h * 0.42,
        ty = Math.max(hh / 2 + 64, p.y - p.h * 0.75);
      g.save();
      g.translate(tx, ty);
      g.rotate(Math.sin(time * 6) * 0.08);
      g.fillStyle = '#ece3cf';
      g.fillRect(-w / 2, -hh / 2, w, hh);
      g.strokeStyle = SEAL;
      g.lineWidth = 2;
      g.strokeRect(-w / 2 + 3, -hh / 2 + 3, w - 6, hh - 6);
      g.fillStyle = SEAL;
      g.font = `800 ${w * 0.75}px ${FONT}`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText('偽', 0, 0);
      g.restore();
    }
    if (b.state === 'flash') {
      const k = clamp(b.t / b.bp.flash);
      g.save();
      g.strokeStyle = `rgba(255,252,244,${0.9 * (1 - k * 0.4)})`;
      g.lineWidth = Math.max(2, p.h * 0.012);
      g.beginPath();
      g.arc(p.x, p.y - p.h * 0.62, lerp(p.h * 0.75, p.h * 0.2, k), 0, TAU);
      g.stroke();
      g.restore();
    }
  }
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
  function drawGlyphs() {
    if (G.state === 'title' || !G.cfg) return;
    const ordered = waveConfiguration().ordered,
      night = STAGES[G.stage]!.weather === 'night',
      veilK = 1 - WX.veil * 0.85 * G.m.hazard;
    if (G.state === 'playing' || G.state === 'dead') {
      const live = G.enemies.filter(
        (e) => e.state === 'idle' || e.state === 'attack' || (e.state === 'enter' && e.t > 0.3),
      );
      const rk = ordered ? liveOrdered() : null;
      for (const e of live) {
        const p = e.pos,
          isA = e === G.attacker,
          r = isA ? clamp(p.h * 0.18, 22, 32) : clamp(p.h * 0.13, 12, 20),
          y = Math.max(p.y - p.h * 1.18 - r, r + 62);
        const shown = e.fake && !e.switched && !G.bless.has('mercy') ? e.fake : e.dir,
          rank = ordered ? rk!.indexOf(e) + 1 : 0;
        const cue = enemyGlyphCue(isA, rank, e.state === 'enter' ? (e.t - 0.3) / 0.3 : 1);
        let alpha = cue.alpha;
        if (G.state === 'dead') alpha *= 0.4;
        alpha *= veilK;
        const seer = G.bless.has('foresight') && (ordered ? rank === 1 : isA);
        if (G.event === 'fog' && !isA && !seer) alpha = 0;
        let arrowA = null;
        if (night && !G.m.noFade) {
          arrowA = isA
            ? clamp(1 - (e.p - 0.22) / 0.15, 0.06, 1)
            : e.state === 'idle'
              ? clamp(1 - (e.t - 0.9) / 0.4, 0.06, 1)
              : 1;
        }
        if (G.blade) arrowA = 0;
        if (G.m.blind) arrowA = 0;
        else if (seer) arrowA = null;
        drawEnso(p.x, y, r, shown, {
          emphasis: cue.emphasis,
          prog: isA && !G.m.noRing ? clamp(e.p) : null,
          alpha,
          rank,
          quiver: !!(e.fake && !e.switched),
          arrowA,
          frozen: isA && G.freezeT > 0,
          ghost: (G.bless.has('fox') || G.m.foxsight) && e.fake && !e.switched ? e.dir : null,
        });
      }
    }
    const so = G.so;
    if (so && G.state === 'standoff' && so.fired && !so.done) {
      const p = so.e.pos,
        r = clamp(p.h * 0.13, 22, 36);
      drawEnso(p.x - p.h * 0.42, Math.max(p.y - p.h * 0.8, r + 64), r, so.e.dir, {
        prog: clamp((so.t - so.ft) / so.win),
        alpha: 1,
        arrowA: G.blade || G.m.blind ? 0 : null,
        noArc: 1,
      });
    }
    const b = G.boss;
    if (b && b.state === 'stagger' && G.state === 'boss') {
      const p = b.pos,
        r = clamp(p.h * 0.11, 22, 38),
        ex = p.x - p.h * 0.42,
        ey = Math.max(p.y - p.h * 0.78, r + 64);
      drawEnso(ex, ey, r, bossShownDirection(b), {
        prog: clamp(b.t / b.window),
        alpha: 1,
        arrowA: G.blade || G.m.blind || G.m.duelBlind ? 0 : null,
        noArc: 1,
      });
      if (b.chainLen > 1) {
        const n = b.chainLen,
          sz = Math.max(6, r * 0.2),
          gp = sz * 2.3;
        for (let i = 0; i < n; i++) {
          g.save();
          g.translate(ex + (i - (n - 1) / 2) * gp, ey + r * 1.55);
          g.rotate(Math.PI / 4);
          g.fillStyle = i < b.chainLeft ? '#efe9dd' : 'rgba(239,233,221,.22)';
          g.strokeStyle = 'rgba(10,10,9,.6)';
          g.lineWidth = 1.5;
          g.fillRect(-sz / 2, -sz / 2, sz, sz);
          g.strokeRect(-sz / 2, -sz / 2, sz, sz);
          g.restore();
        }
      }
    }
  }
  function effectRenderer(context = g, state = fx, scale = S) {
    return createEffectRenderer(context, state, {
      scale,
      time,
      font: FONT,
      seal: SEAL,
      mistSprite,
    });
  }
  function drawFx() {
    effectRenderer().drawFx();
  }
  function drawFx2() {
    effectRenderer().drawFx2();
  }
  function drawStains() {
    effectRenderer().drawStains();
  }
  function drawPops() {
    effectRenderer().drawPops();
  }
  function drawStamps() {
    effectRenderer().drawStamps();
  }
  function drawPost(raw: number) {
    if (G.event === 'blood' && (G.state === 'playing' || G.state === 'dead')) {
      g.fillStyle = 'rgba(120,18,12,0.16)';
      g.fillRect(0, 0, W, H);
    }
    applyFilm(
      g,
      W,
      H,
      cvs,
      sceneFilm() === PREMIUM_FILM && !premiumAccess() ? 'mono' : sceneFilm(),
      time,
      {
        reducedMotion: reducedMotion(),
        reducedFlashes: reducedFlashes(),
      },
    );
    frameN++;
    const pat = grainPats[frameN % 3];
    if (pat) {
      g.save();
      if (!reducedMotion() && !reducedFlashes())
        g.translate(-((R() * 180) | 0), -((R() * 180) | 0));
      g.fillStyle = pat;
      g.fillRect(0, 0, W + 180, H + 180);
      g.restore();
    }
    const nit = sceneFilm() === 'nitrate';
    if (nit && !reducedFlashes() && R() < 0.03) {
      g.fillStyle = 'rgba(8,6,4,.55)';
      g.beginPath();
      g.arc(R() * W, R() * H, 6 + R() * 30, 0, TAU);
      g.fill();
    }
    if (!reducedMotion() && !reducedFlashes() && R() < (nit ? 0.4 : 0.07))
      fx.scratches.push({
        x: R() * W,
        y0: R() < 0.5 ? 0 : R() * H * 0.5,
        y1: R() < 0.5 ? H : H * (0.5 + R() * 0.5),
        t: 0,
        life: 0.06 + R() * 0.3,
        a: 0.05 + R() * 0.12,
      });
    for (const s of fx.scratches) {
      s.t += raw;
      g.strokeStyle = `rgba(225,220,210,${s.a})`;
      g.lineWidth = 1;
      g.beginPath();
      g.moveTo(s.x, s.y0);
      g.lineTo(s.x + 1.5, s.y1);
      g.stroke();
    }
    fx.scratches = fx.scratches.filter((s) => s.t < s.life);
    for (let i = 0; i < (reducedMotion() || reducedFlashes() ? 0 : (R() * 3) | 0); i++) {
      g.fillStyle = R() < 0.5 ? 'rgba(10,10,9,.35)' : 'rgba(230,225,215,.3)';
      g.beginPath();
      g.arc(R() * W, R() * H, 0.6 + R() * 1.6, 0, TAU);
      g.fill();
    }
    if (vig) {
      g.drawImage(vig, 0, 0, W, H);
      if (G.attacker && G.state === 'playing' && G.attacker.p >= pz() && !G.m.noArc) {
        g.globalAlpha = reducedFlashes() ? 0.5 : 0.5 + 0.2 * Math.sin(time * 30);
        g.drawImage(vig, 0, 0, W, H);
        g.globalAlpha = 1;
      }
    }
    if (STAGES[G.stage]!.weather === 'night' && vig) {
      g.globalAlpha = 0.35;
      g.drawImage(vig, 0, 0, W, H);
      g.globalAlpha = 1;
    }
    {
      const act = ['playing', 'boss', 'standoff', 'between', 'shrine', 'dead'].includes(G.state),
        lm = !G.zen && !G.hard && G.maxLives > 1;
      const tgt = act && lm ? clamp((G.maxLives - G.lives) / (G.maxLives - 1)) : 0;
      inkA += (tgt - inkA) * (1 - Math.exp(-raw * 3));
      if (act && lm && G.lives === 1 && G.state !== 'dead') {
        hbT -= raw;
        if (hbT <= 0) {
          hbT =
            (G.attacker && G.attacker.p >= pz()) ||
            (G.boss && ['windup', 'flash'].includes(G.boss.state))
              ? 0.6
              : 0.9;
          hbP = 1;
          buzz(8);
        }
      }
      hbP = Math.max(0, hbP - raw * 3.5);
      inkPulse = Math.max(0, inkPulse - raw * 1.4);
      if (inkEdge && (inkA > 0.01 || inkPulse > 0.01)) {
        g.globalAlpha = clamp(inkA * 0.8 + hbP * 0.3 * inkA + inkPulse * 0.6);
        g.drawImage(inkEdge, 0, 0, W, H);
        g.globalAlpha = 1;
      }
    }
    if (lb > 0.005) {
      const bh = lb * H * 0.085;
      g.fillStyle = '#060605';
      g.fillRect(0, 0, W, bh);
      g.fillRect(0, H - bh, W, bh);
    }
    g.fillStyle = `rgba(0,0,0,${reducedFlashes() ? 0.02 : R() * (sceneFilm() === 'nitrate' ? 0.12 : 0.035)})`;
    g.fillRect(0, 0, W, H);
    if (flashA > 0) {
      g.fillStyle = `rgba(${flashCol},${reducedFlashes() ? Math.min(flashA, 0.035) : flashA})`;
      g.fillRect(0, 0, W, H);
      flashA = Math.max(0, flashA - raw * 2.4);
    }
  }
  function render(raw: number) {
    g.setTransform(DPR, 0, 0, DPR, 0, 0);
    const sx = reducedMotion() ? 0 : (R() - 0.5) * shake,
      sy = reducedMotion()
        ? 0
        : (R() - 0.5) * shake +
          (sceneFilm() === 'nitrate' ? Math.sin(time * 7) * 1.2 + (R() < 0.02 ? R() * 4 : 0) : 0);
    shake = Math.max(0, shake - raw * 45 * S);
    g.save();
    g.translate(sx, sy);
    if (zoom > 1.001 && !reducedMotion()) {
      g.translate(zoomX, zoomY);
      g.scale(zoom, zoom);
      g.translate(-zoomX, -zoomY);
    }
    const demonRealm = activeTrial?.realm === 'demon' || (cinematic.active && previewDemon);
    const inkEnvironment = demonRealm
      ? demonRealmRenderer.draw(
          g,
          W,
          H,
          time,
          reducedMotion(),
          activeTrial ? activeTrial.seed : stageSeed,
        )
      : environmentRenderer.draw(g, {
          stageSeed,
          width: W,
          height: H,
          dpr: DPR,
          time,
          stage: G.stage,
          reducedMotion: reducedMotion(),
          reducedFlashes: reducedFlashes(),
          lowQuality: density() <= 0.3,
        });
    cvs.dataset.renderer = 'ink';
    cvs.dataset.rendererBackend = demonRealm ? 'demon-realm' : environmentRenderer.backend;
    cvs.dataset.artwork = 'ink';
    if (mistSprite)
      for (const m of mists) {
        g.globalAlpha = m.a;
        g.drawImage(mistSprite, m.x - m.w / 2, m.y - m.h / 2, m.w, m.h);
      }
    g.globalAlpha = 1;
    blades(mid, time, !demonRealm && inkEnvironment && G.stage === 5, demonRealm);
    if (!cinematic.active) drawStains();
    if (!demonRealm) drawLeaves(false);
    const b = G.boss;
    if (b && ['windup', 'flash', 'feint'].includes(b.state)) {
      const k = b.state === 'flash' ? 1 : clamp(b.t / b.dur);
      g.fillStyle = `rgba(0,0,0,${0.2 * k})`;
      g.fillRect(-30, -30, W + 60, H + 60);
    }
    const back = G.enemies
      .filter((e) => e !== G.attacker && e.state !== 'strike')
      .sort((a, c) => a.pos.y - c.pos.y);
    for (const e of back) drawEnemy(e);
    if (G.event === 'fog' && (G.state === 'playing' || G.state === 'dead')) {
      const y0 = L.horizonY,
        y1 = L.groundY + L.eH * 0.25,
        mc = STAGES[G.stage]!.mist,
        fg2 = g.createLinearGradient(0, y0, 0, y1);
      fg2.addColorStop(0, `rgba(${mc},0)`);
      fg2.addColorStop(0.3, `rgba(${mc},.88)`);
      fg2.addColorStop(0.85, `rgba(${mc},.88)`);
      fg2.addColorStop(1, `rgba(${mc},0)`);
      g.fillStyle = fg2;
      g.fillRect(-30, y0, W + 60, y1 - y0);
    }
    if (b) drawBoss();
    for (const e of G.enemies) if (e === G.attacker || e.state === 'strike') drawEnemy(e);
    if (!cinematic.active) {
      drawPlayer();
      drawPet();
      drawFoxfire();
      drawFx();
      drawFx2();
    }
    if (inkEnvironment && !demonRealm)
      environmentRenderer.drawForeground(g, {
        width: W,
        height: H,
        dpr: DPR,
        time,
        stage: G.stage,
        reducedMotion: reducedMotion(),
        reducedFlashes: reducedFlashes(),
        lowQuality: density() <= 0.3,
      });
    blades(fg, time, !demonRealm && inkEnvironment && G.stage === 5, demonRealm);
    if (!cinematic.active) drawGlyphs();
    if (!demonRealm) {
      drawSmoke();
      drawLeaves(true);
      drawWeather();
    }
    if (!cinematic.active) drawPops();
    g.restore();
    if (!cinematic.active) drawStamps();
    drawPost(raw);
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
      maxFps: () => (G.panel || ['title', 'over', 'paused'].includes(G.state) ? 30 : 60),
      paused: () => G.state === 'paused' || guided.frozen,
      update,
      render,
      afterRender: () => {
        if (G.panel === 'armory') drawPreview();
      },
      sampleFrame: (interval, work) => {
        if (G.panel || ['title', 'over', 'paused'].includes(G.state) || document.hidden) return;
        if (!effectQuality.sample(interval, work)) return;
        ambient().balanceLeaves(leaves);
        if (Math.abs(weatherDensity - density()) >= 0.09) rebalanceWeather();
      },
    },
  );
  let artworkReady = false;
  const resumeFrames = frameLoop.start;
  lifecycle.add(
    onActivityChange((active) => {
      audio.setInactive(!active);
      if (!active) {
        combatHaptics.stop();
        frameLoop.stop();
      } else if (artworkReady) resumeFrames();
    }),
  );

  /* ---------------- boot ---------------- */
  let rt = 0;
  function resize() {
    const r = cvs.getBoundingClientRect();
    W = Math.max(1, r.width);
    H = Math.max(1, r.height);
    DPR = Math.min(2, window.devicePixelRatio || 1);
    cvs.width = Math.round(W * DPR);
    cvs.height = Math.round(H * DPR);
    layout();
    buildBG();
    buildMist();
    buildGrass();
    buildLeaves();
    buildWeather(false);
    buildPost();
    prevBg = null;
    stageFade = 0;
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
  } else setupAttract();
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
    environmentRenderer.prepare(G.stage),
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
    ].filter((name): name is string => !!name);
    if (failed.length) {
      artworkLoading.update({ loaded: 6 - failed.length, total: 6, pending: 0, failed });
      return;
    }
    artworkLoading.remove();
    artworkReady = true;
    if (pageActive()) frameLoop.start();
  });
  return lifecycle.dispose;
}
