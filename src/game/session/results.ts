import type { RuleEvents } from '../events.ts';
import { STAGES } from '../content/stages.ts';
import { dailyResult, type DailyRun } from '../progression/daily.ts';
import { recordRun } from '../progression/run-records.ts';
import {
  settleRunReward,
  supportEmberBonusAmount,
  grantSupportEmberBonus,
  type RunRewardLedger,
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
import type { RunState, Screen } from '../run-state.ts';
import type { RunCheckpoint } from '../../platform/run-checkpoint.ts';
import type { Statistics, BladeStats } from '../progression/statistics.ts';
import type { TrialDefinition } from '../content/trials.ts';
import type { ItemCategory } from '../content/items.ts';
import type { Setup } from '../../platform/saves.ts';
import type { SupportBenefit } from '../../platform/rewarded-support.ts';
import type { ResultReveal, RunResults } from '../../ui/screens/run-results.ts';
import type { renderGameOver } from '../../ui/screens/game-over.ts';

export interface ResultsViews {
  readonly events: RuleEvents;
  readonly activeDaily: DailyRun | null;
  readonly G: RunState;
  readonly guided: { reset(): void };
  readonly audio: { setPaused(paused: boolean): void };
  timeScale: number;
  readonly presentationState: { lbT: number };
  readonly clearHints: () => void;
  readonly $: {
    (id: 'c' | 'prevC' | 'supportPreview'): HTMLCanvasElement;
    (id: 'bAgain'): HTMLButtonElement;
    (id: string): HTMLElement;
  };
  readonly META: MetaProgress;
  readonly showScreen: (id: Screen | null) => void;
  readonly hud: (on: boolean) => void;
  savedRun: RunCheckpoint | null;
  readonly updateSavedRunButtons: () => void;
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
  readonly runResults: RunResults;
  readonly runItemReveals: ResultReveal[];
  readonly setBestLine: () => void;
  readonly toast: (it: {
    k: string;
    msg?: string | undefined;
    n?: string | undefined;
    type?: ItemCategory | undefined;
  }) => void;
  readonly modeKey: () => string;
  readonly store: {
    get(key: string, fallback: null): unknown;
    set(key: string, value: unknown): boolean;
    remove(key: string): void;
  };
  readonly clearRunCheckpoint: () => void;
  readonly renderGameOver: typeof renderGameOver;
}

/** Owns terminal settlement/recovery; display and persistent capabilities are ports. */
export function createResultsSession(readViews: () => ResultsViews) {
  function finishDaily() {
    const views = readViews();
    const {
      $,
      activeDaily,
      G,
      guided,
      audio,
      presentationState,
      clearHints,
      META,
      showScreen,
      hud,
      updateSavedRunButtons,
      store,
      clearRunCheckpoint,
      renderGameOver,
    } = views;
    if (!activeDaily || G.state === 'over') return;
    G.state = 'over';
    const result = dailyResult(store.get('issen.daily', null), activeDaily.day, G);
    store.set('issen.daily', result.records);
    views.events.emit('runEnded', { seed: G.seed, score: G.score, reason: G.reason });
    guided.reset();
    audio.setPaused(false);
    views.timeScale = 1;
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
    views.savedRun = null;
    updateSavedRunButtons();
  }
  function showOver() {
    const views = readViews();
    const {
      $,
      activeDaily,
      G,
      guided,
      audio,
      presentationState,
      clearHints,
      META,
      showScreen,
      hud,
      updateSavedRunButtons,
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
      store,
      clearRunCheckpoint,
      renderGameOver,
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
    views.timeScale = 1;
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
    views.savedRun = null;
    updateSavedRunButtons();
  }
  async function claimEmberBonus(pending: PendingSupportReward) {
    const views = readViews();
    const {
      $,
      G,
      META,
      rewardScreen,
      lifecycle,
      rewardSupport,
      ST,
      saveMeta,
      toast,
      modeKey,
      store,
      renderGameOver,
    } = views;
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
    const views = readViews();
    const { $, G, META, showScreen, hud, ST, runResults, modeKey, store, renderGameOver } = views;
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
  return { finishDaily, showOver, claimEmberBonus, recoverSupportReward };
}
