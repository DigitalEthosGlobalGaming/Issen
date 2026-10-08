import type { RuleEvents } from '../events.ts';
import { dailyRun, type DailyRun } from '../progression/daily.ts';
import {
  preserveSecretDiscoveries,
  reconcileCinematicCompanion,
} from '../progression/secret-events.ts';
import {
  parseAwakeningProgress,
  type AwakeningProgress,
} from '../progression/awakening-progress.ts';
import { parseMeta, templateModifiers, type MetaProgress } from '../progression/meta.ts';
import {
  parseCollectionProgress,
  type CollectionProgress,
} from '../progression/collection-progress.ts';
import { SEVEN_DAWNS_CREST, type DailyLoginProgress } from '../progression/daily-login.ts';
import {
  parseStatistics,
  parseEquipment,
  type Equipment,
  type Setup,
} from '../../platform/saves.ts';
import { PREMIUM_FILM } from '../../platform/premium.ts';
import { BLESS_BY } from '../content/blessings.ts';
import { restorableRng, type RestorableRandom, type Random } from '../../shared/random.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';
import type { RunState } from '../run-state.ts';
import type { Statistics } from '../progression/statistics.ts';
import type { Item } from '../content/items.ts';
import type { Enemy } from '../combat/enemy.ts';
import type { Boss } from '../encounters/boss.ts';
import type { TrialDefinition } from '../content/trials.ts';
import type { RunRewardLedger } from '../progression/run-rewards.ts';

export interface CheckpointFlowViews {
  readonly events: RuleEvents;
  readonly G: RunState;
  readonly AWAKENING: AwakeningProgress;
  readonly COLLECTION_PROGRESS: CollectionProgress;
  readonly DAILY_LOGIN: DailyLoginProgress;
  readonly META: MetaProgress;
  readonly SETUP: Setup;
  readonly UNL: Set<string>;
  readonly WX: RunCheckpoint['weather'];
  readonly ITEMS: Item[];
  readonly playerEquipment: Equipment;
  readonly playerStats: Statistics;
  readonly activeTrial: TrialDefinition | null;
  readonly sceneLoading: boolean;
  EQ: Equipment;
  ST: Statistics;
  activeDaily: DailyRun | null;
  rewardLedger: RunRewardLedger;
  runBossMilestone: number;
  runRandom: RestorableRandom;
  runTemplate: ReturnType<typeof templateModifiers>;
  combatRandom: Random;
  savedRun: RunCheckpoint | null;
  shrineOfferIds: string[] | null;
  readonly persistence: {
    read(): RunCheckpoint | null;
    write(checkpoint: RunCheckpoint): boolean;
    clear(): void;
  };
  readonly storage: { set(key: string, value: unknown): unknown };
  readonly accessibleUnlocks: () => Set<string>;
  readonly bossPos: (boss: Boss) => Boss['pos'];
  readonly computeMods: () => void;
  readonly enemyPos: (enemy: Enemy) => Enemy['pos'];
  readonly premiumAccess: () => boolean;
  readonly saveAwakening: () => void;
  readonly saveMeta: () => void;
  readonly saveStats: () => void;
  readonly saveCollections: () => void;
  readonly setStage: (stage: number, animate: boolean) => void;
  readonly syncCollections: () => void;
  readonly showOver: () => void;
  readonly resetClock: () => void;
  readonly adoptPhase: () => void;
  readonly discardSceneContinuation: () => void;
}

/** Version-one records and rule RNG restore through explicit persistence/scene ports. */
export function createCheckpointFlow(views: CheckpointFlowViews) {
  const {
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
    bossPos,
    computeMods,
    enemyPos,
    playerEquipment,
    playerStats,
    premiumAccess,
    saveAwakening,
    saveMeta,
    saveStats,
    saveCollections,
    setStage,
    syncCollections,
    showOver,
    resetClock,
  } = views;
  function captureCheckpoint(status: RunCheckpoint['status'] = 'active') {
    if (views.sceneLoading) {
      if (status === 'ended') {
        views.persistence.clear();
        views.savedRun = null;
      }
      return;
    }
    if (
      views.activeTrial ||
      !['playing', 'boss', 'standoff', 'between', 'shrine', 'dead'].includes(G.state)
    )
      return;
    syncCollections();
    saveCollections();
    const { bless, ...run } = G;
    const checkpoint: RunCheckpoint = {
      version: 1,
      status,
      seed: G.seed,
      randomState: views.runRandom.state(),
      run: { ...run, bless: [...bless], attacker: null, panel: null },
      stats: views.ST,
      awakening: AWAKENING,
      collections: COLLECTION_PROGRESS,
      meta: META,
      unlocks: [...UNL],
      equipment: views.EQ,
      setup: views.activeDaily?.setup ?? SETUP,
      ledger: views.rewardLedger,
      weather: WX,
      bossMilestone: views.runBossMilestone,
      offers: views.shrineOfferIds,
      dailyDay: views.activeDaily?.day,
    };
    if (views.persistence.write(checkpoint)) views.savedRun = views.persistence.read();
    else views.events.emit('checkpointSaveFailed', { seed: G.seed });
    views.events.emit('checkpointChanged', { saved: !!views.savedRun });
  }
  function restoreCheckpoint(checkpoint: RunCheckpoint) {
    // A restored encounter supersedes pending title/cinematic scene work, even
    // when it adopts the same scene key and needs no new composition request.
    views.discardSceneContinuation();
    views.activeDaily = checkpoint.dailyDay ? dailyRun(checkpoint.dailyDay) : null;
    views.ST = views.activeDaily ? structuredClone(playerStats) : playerStats;
    views.EQ = views.activeDaily ? { ...views.activeDaily.equipment } : playerEquipment;
    Object.assign(views.ST, preserveSecretDiscoveries(parseStatistics(checkpoint.stats), views.ST));
    if (!views.activeDaily) {
      Object.assign(AWAKENING, parseAwakeningProgress(checkpoint.awakening));
      Object.assign(META, parseMeta(checkpoint.meta, views.ST, UNL));
      Object.assign(
        COLLECTION_PROGRESS,
        parseCollectionProgress(checkpoint.collections ?? COLLECTION_PROGRESS, views.ST),
      );
      COLLECTION_PROGRESS.lastStats = structuredClone(views.ST);
      UNL.clear();
      for (const id of checkpoint.unlocks) if (id !== PREMIUM_FILM) UNL.add(id);
      if (DAILY_LOGIN.earned) UNL.add(SEVEN_DAWNS_CREST);
      reconcileCinematicCompanion(views.ST, UNL);
      if (premiumAccess()) UNL.add(PREMIUM_FILM);
      Object.assign(SETUP, checkpoint.setup);
      Object.assign(views.EQ, parseEquipment(checkpoint.equipment, accessibleUnlocks(), ITEMS));
    }
    Object.assign(G, checkpoint.run, { bless: new Set(checkpoint.run.bless) });
    if (G.so) G.so.e = G.enemies.find((e) => e.challenger) ?? G.so.e;
    G.attacker = null;
    G.panel = null;
    G.shrineRerolls = premiumAccess() ? G.shrineRerolls : 0;
    views.shrineOfferIds = checkpoint.offers;
    views.rewardLedger = checkpoint.ledger;
    views.runBossMilestone = checkpoint.bossMilestone;
    views.runTemplate = templateModifiers(META, views.activeDaily?.setup ?? SETUP, premiumAccess());
    views.runRandom = restorableRng(checkpoint.seed);
    views.combatRandom = views.runRandom.next;
    if (!views.activeDaily) {
      saveStats();
      saveAwakening();
      saveMeta();
      views.storage.set('issen.unlocks', [...UNL]);
      views.storage.set('issen.equip', playerEquipment);
    }
    setStage(G.stage, false);
    Object.assign(WX, checkpoint.weather);
    views.runRandom.restore(checkpoint.randomState);
    for (const enemy of G.enemies) enemy.pos = enemyPos(enemy);
    if (G.boss) G.boss.pos = bossPos(G.boss);
    computeMods();
    views.events.emit('checkpointRestored', {
      state: G.state,
      wave: G.wave,
      bossGlyph: G.boss?.def.k ?? null,
      bossName: G.boss?.def.n ?? null,
      bossShown: !!G.boss && G.state === 'boss',
    });
    views.adoptPhase();
  }
  function continueSavedRun() {
    if (!views.savedRun || views.savedRun.status !== 'active') return;
    const checkpoint = views.savedRun;
    restoreCheckpoint(checkpoint);
    if (G.state === 'shrine' && views.shrineOfferIds)
      views.events.emit('shrineOffers', {
        ids: Object.freeze(views.shrineOfferIds.filter((id) => !!BLESS_BY[id])),
      });
    else views.events.emit('sessionScreen', { screen: null });
    resetClock();
  }
  function abandonSavedRun() {
    if (!views.savedRun || views.savedRun.status !== 'active') return;
    restoreCheckpoint(views.savedRun);
    G.reason = 'quit';
    captureCheckpoint('ended');
    showOver();
  }

  return { captureCheckpoint, restoreCheckpoint, continueSavedRun, abandonSavedRun };
}
