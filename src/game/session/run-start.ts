import type { RuleEvents } from '../events.ts';
import { resetRun, type RunState } from '../run-state.ts';
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

export interface RunStartViews<Pose extends object, Reveal> {
  readonly events: RuleEvents;
  readonly G: RunState;
  readonly META: MetaProgress;
  readonly SETUP: Setup;
  readonly P: { fall: number; swingT: number; pose: Pose };
  readonly PREST: Pose;
  readonly playerStats: Statistics;
  readonly playerEquipment: Equipment;
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
  readonly resetWeather: (random: Random) => void;
  readonly checkUnlocks: () => void;
  readonly computeMods: () => void;
  readonly premiumAccess: () => boolean;
  readonly prepareScene: () => void;
  readonly saveStats: () => void;
  readonly setStage: (stage: number, animate: boolean) => void;
  readonly startTrialEncounter: () => void;
  readonly startWave: (wave: number, skipEvent?: boolean) => void;
  readonly startBoss: () => void;
  readonly waveCfg: (wave: number) => NonNullable<RunState['cfg']>;
}

/** Owns seeded run/daily/trial/rush entry without importing presentation types. */
export function createRunStart<Pose extends object, Reveal>(views: RunStartViews<Pose, Reveal>) {
  const {
    G,
    META,
    P,
    PREST,
    SETUP,
    audio,
    checkUnlocks,
    computeMods,
    guided,
    playerStats,
    playerEquipment,
    premiumAccess,
    prepareScene,
    saveStats,
    setStage,
    stageVisits,
    startTrialEncounter,
    startWave,
    startBoss,
    waveCfg,
    clearTrialResult,
    clearCheckpoint,
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
    views.events.emit('runStartCue', { kind: 'motion' });
    P.pose = { ...PREST };
    views.timeScale = 1;
    views.hitStop = 0;
    views.events.emit('runStartCue', { kind: 'effects' });
    views.ST.runs++;
    saveStats();
    views.events.emit('runStartCue', { kind: 'clearHints' });
    if (G.stage !== 0) setStage(0, true);
    else resetWeather(views.combatRandom);
    views.events.emit('runStartCue', { kind: 'screen' });
    G.pauseN = 0;
    G.state = 'playing';
    prepareScene();
    views.events.emit('runStarted', {
      seed: G.seed,
      mode: views.activeTrial ? 'trial' : views.activeDaily ? 'daily' : G.rush ? 'rush' : G.mode,
    });
    if (views.activeTrial) {
      startTrialEncounter();
      views.events.emit('runStartCue', { kind: 'score' });
      return;
    }
    {
      const hr = new Date().getHours();
      if (recordSecretEvent(views.ST, { kind: 'midnight', hour: hr })) {
        saveStats();
        checkUnlocks();
      }
    }
    views.events.emit('runStartCue', { kind: 'score' });
    if (G.rush) {
      views.ST.rushRuns = (views.ST.rushRuns || 0) + 1;
      startRushDuel();
      views.events.emit('runModeHint', { mode: 'rush' });
    } else startWave(1);
    if (G.fortune)
      views.events.emit('runFortune', {
        glyph: G.fortune.k,
        name: G.fortune.n,
        description: G.fortune.d,
      });
    if (G.blade) views.events.emit('runModeHint', { mode: 'blade' });
    if (G.zen) views.events.emit('runModeHint', { mode: 'zen' });
  }
  function startDaily() {
    views.activeDaily = dailyRun();
    views.ST = structuredClone(playerStats);
    views.EQ = { ...views.activeDaily.equipment };
    views.events.emit('runStartCue', { kind: 'seal' });
    G.panel = null;
    views.events.emit('runStartCue', { kind: 'audio' });
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
    views.events.emit('runStartCue', { kind: 'leaves' });
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
    views.events.emit('runStartCue', { kind: 'audio' });
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
