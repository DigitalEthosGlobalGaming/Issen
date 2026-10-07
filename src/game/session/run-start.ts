import { resetRun, type RunState, type Screen } from '../run-state.ts';
import { normalLives } from '../equipment/lives.ts';
import { recordSecretEvent } from '../progression/secret-events.ts';
import { createRunRewardLedger, type RunRewardLedger } from '../progression/run-rewards.ts';
import {
  templateModifiers,
  templatePowers,
  sanitizeSetup,
  type MetaProgress,
} from '../progression/meta.ts';
import { trialsUnlocked } from '../progression/trials.ts';
import { collectionBlessings } from '../content/collections.ts';
import { dailyRun, type DailyRun } from '../progression/daily.ts';
import { TRIALS, type TrialDefinition } from '../content/trials.ts';
import { BLESS } from '../content/blessings.ts';
import { STAGES } from '../content/stages.ts';
import { trialAccessible } from '../../platform/editions.ts';
import { DEFAULT_EQUIPMENT, type Equipment, type Setup } from '../../platform/saves.ts';
import {
  rng,
  restorableRng,
  newRunSeed,
  type RestorableRandom,
  type Random,
} from '../../shared/random.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';
import type { Statistics } from '../progression/statistics.ts';
import type { ItemCategory } from '../content/items.ts';

export interface RunStartViews<Pose extends object, Reveal> {
  readonly $: (id: string) => HTMLElement;
  readonly G: RunState;
  readonly META: MetaProgress;
  readonly SETUP: Setup;
  readonly P: { fall: number; swingT: number; pose: Pose };
  readonly PREST: Pose;
  readonly presentationState: { lbT: number };
  readonly playerStats: Statistics;
  readonly playerEquipment: Equipment;
  readonly apparelMotion: { reset(): void };
  readonly audio: { setPaused(paused: boolean): void };
  readonly guided: { reset(): void };
  readonly stageVisits: { enter(stage: number, newVisit: boolean): number };
  EQ: Equipment;
  ST: Statistics;
  activeDaily: DailyRun | null;
  activeTrial: TrialDefinition | null;
  rewardLedger: RunRewardLedger;
  runBossMilestone: number;
  runItemReveals: Reveal[];
  runRandom: RestorableRandom;
  runTemplate: ReturnType<typeof templateModifiers>;
  combatRandom: Random;
  savedRun: RunCheckpoint | null;
  shrineOfferIds: string[] | null;
  runTrialsWasUnlocked: boolean;
  stageSeed: number;
  timeScale: number;
  hitStop: number;
  trialFailure: string;
  readonly newRunSeed: () => number;
  readonly clearTrialResult: () => void;
  readonly clearCheckpoint: () => void;
  readonly clearEffects: () => void;
  readonly resetWeather: (random: Random) => void;
  readonly checkUnlocks: () => void;
  readonly clearHints: () => void;
  readonly computeMods: () => void;
  readonly hint: (id: string, text: string, duration: number) => void;
  readonly hud: (on: boolean) => void;
  readonly premiumAccess: () => boolean;
  readonly prepareScene: () => void;
  readonly saveStats: () => void;
  readonly setScore: () => void;
  readonly setStage: (stage: number, animate: boolean) => void;
  readonly showScreen: (id: Screen | null) => void;
  readonly startTrialEncounter: () => void;
  readonly startWave: (wave: number, skipEvent?: boolean) => void;
  readonly startBoss: () => void;
  readonly toast: (item: { k: string; msg?: string; n?: string; type?: ItemCategory }) => void;
  readonly applySeal: () => void;
  readonly audioInit: () => void;
  readonly buildLeaves: () => void;
  readonly waveCfg: (wave: number) => NonNullable<RunState['cfg']>;
}

/** Owns seeded run/daily/trial/rush entry without importing presentation types. */
export function createRunStart<Pose extends object, Reveal>(views: RunStartViews<Pose, Reveal>) {
  const {
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
    clearTrialResult,
    clearCheckpoint,
    clearEffects,
    resetWeather,
  } = views;
  function startRun() {
    if (!views.activeTrial) {
      clearCheckpoint();
      views.savedRun = null;
      views.shrineOfferIds = null;
    }
    views.runTrialsWasUnlocked = trialsUnlocked(playerStats.roninWave);
    if (!views.activeTrial) Object.assign(SETUP, sanitizeSetup(SETUP, META));
    const setup = views.activeTrial
      ? {
          mode: 'waves' as const,
          diff: 'ronin' as const,
          arrows: views.activeTrial.arrows,
          lives: '0' as const,
          upgrades: false,
        }
      : (views.activeDaily?.setup ?? SETUP);
    views.runTemplate = templateModifiers(META, setup, premiumAccess());
    views.rewardLedger = createRunRewardLedger();
    views.runBossMilestone = 0;
    views.runItemReveals = [];
    guided.reset();
    audio.setPaused(false);
    if (!views.activeTrial) {
      G.seed = views.activeDaily?.seed ?? views.newRunSeed();
      views.runRandom = restorableRng(G.seed);
      views.combatRandom = views.runRandom.next;
    }
    resetRun(G, setup, views.EQ, views.combatRandom);
    G.availableBlessings =
      views.activeDaily || views.activeTrial
        ? undefined
        : collectionBlessings(
            META.upgrades,
            BLESS.map((b) => b.id),
          );
    views.stageSeed = stageVisits.enter(G.stage, true);
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
    views.timeScale = 1;
    views.hitStop = 0;
    presentationState.lbT = 0;
    clearEffects();
    views.ST.runs++;
    saveStats();
    clearHints();
    if (G.stage !== 0) setStage(0, true);
    else resetWeather(views.combatRandom);
    showScreen(null);
    hud(true);
    $('bossbar').classList.remove('on');
    G.pauseN = 0;
    G.state = 'playing';
    prepareScene();
    if (views.activeTrial) {
      startTrialEncounter();
      setScore();
      return;
    }
    {
      const hr = new Date().getHours();
      if (recordSecretEvent(views.ST, { kind: 'midnight', hour: hr })) {
        saveStats();
        checkUnlocks();
      }
    }
    setScore();
    if (G.rush) {
      views.ST.rushRuns = (views.ST.rushRuns || 0) + 1;
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
    views.activeDaily = dailyRun();
    views.ST = structuredClone(playerStats);
    views.EQ = { ...views.activeDaily.equipment };
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
      views.activeTrial ||
      !trialsUnlocked(playerStats.roninWave) ||
      G.state !== 'title'
    )
      return;
    views.activeTrial = trial;
    buildLeaves();
    views.trialFailure = '';
    clearTrialResult();
    views.combatRandom = rng(trial.seed);
    // Legacy combat counters write into a disposable statistics object during trials.
    // Armoury and normal runs retain the original profile objects.
    views.ST = structuredClone(playerStats);
    views.EQ = {
      ...DEFAULT_EQUIPMENT,
      fx: playerEquipment.fx,
      film: playerEquipment.film,
      seal: playerEquipment.seal,
    };
    G.panel = null;
    audioInit();
    startRun();
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
  }

  return { startRun, startDaily, startTrial, nextStep, startRushDuel };
}
