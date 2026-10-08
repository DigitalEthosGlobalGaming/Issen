import type { RuleEvents } from '../events.ts';
import { initialSpawns } from '../encounters/waves.ts';
import { duelMasterTimings } from '../progression/mastery.ts';
import {
  trialPassed,
  completeTrial,
  grantTrialRewards,
  type TrialProgress,
} from '../progression/trials.ts';
import type { RunState } from '../run-state.ts';
import type { Boss } from '../encounters/boss.ts';
import type { TrialDefinition } from '../content/trials.ts';
import type { Statistics } from '../progression/statistics.ts';
import type { Equipment } from '../../platform/saves.ts';
import type { Random } from '../../shared/random.ts';

export interface TrialOutcome {
  id: string;
  passed: boolean;
  newlyCompleted: boolean;
  message: string;
}
export interface TrialSessionViews {
  readonly events: RuleEvents;
  readonly G: RunState;
  readonly TRIAL_PROGRESS: TrialProgress;
  readonly UNL: Set<string>;
  readonly R: Random;
  readonly playerStats: Statistics;
  readonly playerEquipment: Equipment;
  activeTrial: TrialDefinition | null;
  trialFailure: string;
  trialResult: TrialOutcome | null;
  ST: Statistics;
  EQ: Equipment;
  combatRandom: Random;
  hitStop: number;
  readonly deferUntilSceneReady: (action: () => void) => boolean;
  readonly waveCfg: (wave: number) => NonNullable<RunState['cfg']>;
  readonly startBoss: () => void;
  readonly renderHp: () => void;
  readonly banner: (glyph: string, text: string) => void;
  readonly setWaveLabel: (label: string) => void;
  readonly renderTrialObjective: () => void;
  readonly store: { set(key: string, value: unknown): boolean };
  readonly sfx: { unlock(): void };
  readonly buildLeaves: () => void;
  readonly guided: { reset(): void };
  readonly audio: { setPaused(paused: boolean): void };
  readonly hideTrialObjective: () => void;
  readonly toTitle: () => void;
  readonly computeMods: () => void;
  readonly openPanel: (panel: 'trials') => void;
  readonly focusTrialResult: () => void;
}

/** Disposable trial encounters and completion restore the persistent player profile. */
export function createTrialSession(readViews: () => TrialSessionViews) {
  function startTrialEncounter() {
    const views = readViews();
    const {
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
      setWaveLabel,
      renderTrialObjective,
      store,
      sfx,
      buildLeaves,
      guided,
      audio,
      hideTrialObjective,
      toTitle,
      computeMods,
      openPanel,
      focusTrialResult,
    } = views;
    if (deferUntilSceneReady(startTrialEncounter)) return;
    const trial = views.activeTrial;
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
      G.pendingSpawns = initialSpawns(pack, false, views.combatRandom);
      G.state = 'playing';
    } else {
      G.bossCount = trial.bosses![G.bossesSlain]! - 1;
      startBoss();
      const duelBoss = G.boss as Boss | null;
      if (trial.duelMaster && duelBoss) {
        duelBoss.hp = duelBoss.maxHp = 20;
        duelBoss.bp = duelMasterTimings(0);
        views.events.emit('bossHealth', { hp: duelBoss.hp, maximum: duelBoss.maxHp });
      }
    }
    views.events.emit('trialEncounter', { id: trial.id, wave: G.wave });
  }
  function finishTrial(message?: string) {
    const views = readViews();
    const {
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
      setWaveLabel,
      renderTrialObjective,
      store,
      sfx,
      buildLeaves,
      guided,
      audio,
      hideTrialObjective,
      toTitle,
      computeMods,
      openPanel,
      focusTrialResult,
    } = views;
    const trial = views.activeTrial;
    if (!trial) return;
    const passed = trialPassed(trial, { ...G, failed: !!message || !!views.trialFailure });
    const newlyCompleted = passed && !TRIAL_PROGRESS.completed.includes(trial.id);
    views.events.emit('trialSettlement', { id: trial.id, passed });
    views.trialResult = {
      id: trial.id,
      passed,
      newlyCompleted,
      message:
        message ||
        views.trialFailure ||
        (passed
          ? ''
          : `You landed ${G.perfects} perfect cuts; ${trial.wave?.perfects ?? 0} were required.`),
    };
    views.events.emit('runEnded', {
      seed: G.seed,
      score: G.score,
      reason: passed ? 'completed' : message || views.trialFailure || 'failed',
    });
    views.activeTrial = null;
    views.events.emit('trialLeavesReset', { id: trial.id });
    views.combatRandom = R;
    views.ST = playerStats;
    views.EQ = playerEquipment;
    guided.reset();
    views.events.emit('trialAudioReset', { id: trial.id });
    views.hitStop = 0;
    views.events.emit('trialObjectiveHidden', { id: trial.id });
    toTitle();
    computeMods();
    views.events.emit('trialMenuReady', { id: trial.id });
  }
  return { startTrialEncounter, finishTrial };
}
