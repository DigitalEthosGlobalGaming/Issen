import { resultDisplay } from './result-display.ts';
import type { RuleEvents } from '../events.ts';
import { STAGES } from '../content/stages.ts';
import { dailyResult, type DailyRun } from '../progression/daily.ts';
import { recordRun } from '../progression/run-records.ts';
import {
  settleRunReward,
  supportEmberBonusAmount,
  grantSupportEmberBonus,
  type RunRewardLedger,
  type RewardSettlement,
} from '../progression/run-rewards.ts';
import {
  markModeRevealsSeen,
  pendingModeReveals,
  unlockBossMilestone,
  type MetaProgress,
} from '../progression/meta.ts';
import { trialsUnlocked } from '../progression/trials.ts';
import { testerPremiumActive } from '../../platform/tester-premium.ts';
import { parsePendingSupport, type PendingSupportReward } from '../../platform/pending-support.ts';
import type { RunState } from '../run-state.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';
import type { Statistics, BladeStats } from '../progression/statistics.ts';
import type { TrialDefinition } from '../content/trials.ts';
import type { Setup } from '../../platform/saves.ts';
import type { SupportBenefit } from '../../platform/rewarded-support.ts';
import type { ResultReveal } from '../../ui/screens/run-results.ts';

export interface ResultsViews {
  readonly events: RuleEvents;
  readonly activeDaily: DailyRun | null;
  readonly G: RunState;
  readonly guided: { reset(): void };
  readonly audio: { setPaused(paused: boolean): void };
  timeScale: number;
  readonly META: MetaProgress;
  savedRun: RunCheckpoint | null;
  sceneContinuation: (() => void) | undefined;
  rewardFlowBusy: boolean;
  readonly activeTrial: TrialDefinition | null;
  readonly rewardScreen: {
    readonly open: boolean;
    offer(
      benefit: SupportBenefit,
      premium: boolean,
      tester: boolean,
      lives: number,
    ): Promise<boolean>;
    dispose(): void;
  };
  readonly supportPremium: () => boolean;
  readonly testerPremium: { campaign: number };
  readonly lifecycle: { readonly disposed: boolean };
  readonly rewardSupport: { claim(benefit: SupportBenefit, premium: boolean): Promise<boolean> };
  readonly captureCheckpoint: (status?: 'active' | 'ended' | 'lost') => void;
  readonly reviveDaruma: (ph?: boolean, support?: boolean) => void;
  readonly finishTrial: (message?: string | undefined) => void;
  readonly ST: Statistics;
  readonly challenge: (metric: keyof BladeStats, value?: number) => void;
  readonly saveStats: () => void;
  readonly runBossMilestone: number;
  readonly SETUP: Setup;
  readonly checkUnlocks: () => void;
  readonly rewardLedger: RunRewardLedger;
  readonly runTrialsWasUnlocked: boolean;
  readonly saveMeta: () => boolean;
  readonly runItemReveals: ResultReveal[];
  readonly modeKey: () => string;
  readonly store: {
    get(key: string, fallback: null): unknown;
    set(key: string, value: unknown): boolean;
    remove(key: string): void;
  };
  readonly clearRunCheckpoint: () => void;
}

/** Owns terminal settlement/recovery; display and persistent capabilities are ports. */
export function createResultsSession(readViews: () => ResultsViews) {
  let nextSequence = 0;
  const sequences = new Map<
    number,
    { pending: PendingSupportReward | null; complete: () => void }
  >();
  function startSequence(
    reward: RewardSettlement,
    reveals: readonly ResultReveal[],
    pending: PendingSupportReward | null,
  ) {
    const { G, META, store } = readViews();
    const id = ++nextSequence;
    // The UI has one result sequence; discard actions from a replaced sequence.
    sequences.clear();
    sequences.set(id, {
      pending,
      complete: () => {
        store.remove('issen.supportReward');
        G.overReady = true;
        readViews().events.emit('resultReady', { ready: true });
      },
    });
    readViews().events.emit('resultSequence', {
      id,
      reward: Object.freeze({ ...reward }),
      reveals: Object.freeze(reveals.map((x) => Object.freeze({ ...x }))),
      bonus: !!pending,
      extraEmbers: pending ? supportEmberBonusAmount(META, pending.hundredths) : 0,
    });
  }
  function completeResultSequence(id: number) {
    sequences.get(id)?.complete();
  }
  function claimResultSequenceBonus(id: number) {
    const pending = sequences.get(id)?.pending;
    return pending ? claimEmberBonus(pending) : Promise.resolve(null);
  }

  function finishDaily() {
    const views = readViews();
    const { activeDaily, G, guided, audio, META, store, clearRunCheckpoint } = views;
    if (!activeDaily || G.state === 'over') return;
    G.state = 'over';
    const result = dailyResult(store.get('issen.daily', null), activeDaily.day, G);
    store.set('issen.daily', result.records);
    views.events.emit('runEnded', { seed: G.seed, score: G.score, reason: G.reason });
    guided.reset();
    audio.setPaused(false);
    views.timeScale = 1;
    views.events.emit('resultCue', { kind: 'reset' });
    const reward = { before: META.embers, after: META.embers, gained: 0 };
    views.events.emit(
      'resultRendered',
      resultDisplay(G, result.record, result.newBest, STAGES[G.stage]!.n, reward, true),
    );
    views.events.emit('resultCue', { kind: 'daily', day: activeDaily.day });
    views.events.emit('resultCue', { kind: 'screen' });
    G.overReady = true;
    views.events.emit('resultReady', { ready: true });
    clearRunCheckpoint();
    views.savedRun = null;
    views.events.emit('checkpointChanged', { saved: !!views.savedRun });
  }
  function showOver() {
    const views = readViews();
    const {
      activeDaily,
      G,
      guided,
      audio,
      META,
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
      runItemReveals,
      store,
      clearRunCheckpoint,
    } = views;
    views.sceneContinuation = undefined;
    if (views.rewardFlowBusy) return;
    const eligible = !activeDaily && !activeTrial && !G.zen;
    const revive =
      eligible && !G.hard && G.state === 'dead' && !G.reviveOfferResolved && !G.secondWindUsed;
    if (revive) {
      views.rewardFlowBusy = true;
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
            views.rewardFlowBusy = false;
            reviveDaruma(false, true);
            return;
          }
        }
        views.rewardFlowBusy = false;
        showOver();
      })();
      return;
    }
    if (activeDaily) {
      finishDaily();
      return;
    }
    views.events.emit('resultCue', { kind: 'normal' });
    if (activeTrial) {
      finishTrial(G.reason === 'quit' ? 'You ended the attempt.' : 'A mistake ended the trial.');
      return;
    }
    if (G.state === 'over') return;
    if (G.state !== 'dead') captureCheckpoint('ended');
    G.state = 'over';
    guided.reset();
    audio.setPaused(false);
    views.timeScale = 1;
    views.events.emit('resultCue', { kind: 'reset' });
    const { record: rec, newBest: nb } = recordRun(ST, G);
    challenge('sc', G.score);
    if (!G.zen) store.set('issen.best', ST.bestScore);
    saveStats();
    unlockBossMilestone(META, runBossMilestone, SETUP);
    checkUnlocks();
    if (eligible && supportPremium()) rewardLedger.supportMultiplier = 2;
    const reward = settleRunReward(META, rewardLedger);
    views.events.emit('runEnded', { seed: G.seed, score: G.score, reason: G.reason });
    const pending: PendingSupportReward | null =
      eligible &&
      !supportPremium() &&
      supportEmberBonusAmount(META, rewardLedger.pending) > 0 &&
      views.savedRun
        ? {
            id: crypto.randomUUID(),
            hundredths: rewardLedger.pending,
            reward,
            checkpoint: structuredClone(views.savedRun),
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
    views.events.emit(
      'resultRendered',
      resultDisplay(G, rec, nb, STAGES[G.stage]!.n, reward, G.upgradesEnabled),
    );
    views.events.emit('resultCue', { kind: 'seed', seed: G.seed });
    views.events.emit('resultCue', { kind: 'screen' });
    G.overReady = false;
    views.events.emit('resultReady', { ready: false });
    startSequence(reward, [...modeReveals, ...runItemReveals], pending);
    views.events.emit('resultCue', { kind: 'best' });
    clearRunCheckpoint();
    views.savedRun = null;
    views.events.emit('checkpointChanged', { saved: !!views.savedRun });
  }
  async function claimEmberBonus(pending: PendingSupportReward) {
    const views = readViews();
    const { G, META, rewardScreen, lifecycle, rewardSupport, ST, saveMeta, modeKey, store } = views;
    const completed = await rewardScreen.offer('embers', false, false, 0);
    if (lifecycle.disposed || !completed || !(await rewardSupport.claim('embers', false)))
      return null;
    if (lifecycle.disposed) return null;
    const before = { ...META };
    const bonus = grantSupportEmberBonus(META, pending.id, pending.hundredths);
    if (!bonus) return null;
    if (!saveMeta()) {
      Object.assign(META, before);
      if (!Object.hasOwn(before, 'supportRewardClaim')) delete META.supportRewardClaim;
      views.events.emit('resultCue', { kind: 'saveFailed' });
      return null;
    }
    store.remove('issen.supportReward');
    const total = {
      before: pending.reward.before,
      gained: pending.reward.gained + bonus.gained,
      after: bonus.after,
    };
    views.events.emit(
      'resultRendered',
      resultDisplay(
        G,
        ST.rec[modeKey()] ?? { score: G.score, combo: G.maxCombo, wave: G.wave },
        false,
        STAGES[G.stage]!.n,
        total,
        G.upgradesEnabled,
      ),
    );
    return total;
  }
  function recoverSupportReward() {
    const views = readViews();
    const { G, META, ST, modeKey, store } = views;
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
    views.events.emit(
      'resultRendered',
      resultDisplay(
        G,
        ST.rec[modeKey()] ?? { score: G.score, combo: G.maxCombo, wave: G.wave },
        false,
        STAGES[G.stage]!.n,
        pending.reward,
        G.upgradesEnabled,
      ),
    );
    views.events.emit('resultCue', { kind: 'screen' });
    G.overReady = false;
    views.events.emit('resultReady', { ready: false });
    startSequence(pending.reward, [], pending);
  }
  return {
    finishDaily,
    showOver,
    claimEmberBonus,
    recoverSupportReward,
    completeResultSequence,
    claimResultSequenceBonus,
  };
}
