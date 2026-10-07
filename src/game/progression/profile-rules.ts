import { accrueRunReward, type RunRewardLedger } from './run-rewards.ts';
import { recordChallenge, type AwakeningProgress } from './awakening-progress.ts';
import { unlockEligibleItems } from './unlocks.ts';
import { collectionItemStats, type CollectionProgress } from './collection-progress.ts';
import { STEEL_THIRD, SPECIAL } from '../content/awakenings.ts';
import { ROBE_AWAKENINGS } from '../content/robe-awakenings.ts';
import type { RunState } from '../run-state.ts';
import type { MetaProgress } from './meta.ts';
import type { Statistics, BladeStats } from './statistics.ts';
import type { TrialDefinition } from '../content/trials.ts';
import type { DailyRun } from './daily.ts';
import type { Item, ItemCategory } from '../content/items.ts';
import type { ResultReveal } from '../../ui/screens/run-results.ts';

export interface ProfileRuleViews {
  readonly G: RunState;
  readonly activeTrial: TrialDefinition | null;
  readonly activeDaily: DailyRun | null;
  readonly rewardLedger: RunRewardLedger;
  readonly AWAKENING: AwakeningProgress;
  readonly META: MetaProgress;
  readonly saveAwakening: () => boolean;
  readonly ST: Statistics;
  readonly UNL: Set<string>;
  readonly ITEMS: readonly Item[];
  readonly ITEM_BY: Readonly<Record<string, Item>>;
  readonly revoked: ReadonlySet<string>;
  readonly COLLECTION_PROGRESS: CollectionProgress;
  readonly accessible: (id: string) => boolean;
  readonly refreshArmoryNew: () => void;
  readonly runItemReveals: ResultReveal[];
  readonly store: { set(key: string, value: unknown): boolean };
  readonly itemPresentation: (item: Item) => {
    flavor: string;
    benefit?: string;
    tradeoff?: string;
  };
  readonly TYPE_WORD: Readonly<Record<ItemCategory, string>>;
}
/** Persistent progression rules own rewards, challenge counters and terminal unlocks. */
export function createProfileRules(readViews: () => ProfileRuleViews) {
  function earn(event: 'kill' | 'wave' | 'boss') {
    const { G, activeTrial, activeDaily, rewardLedger } = readViews();
    if (activeTrial || activeDaily) return;
    accrueRunReward(rewardLedger, event, {
      zen: G.zen,
      emberBonus: G.m.emberBonus,
      pilgrim: !!G.m.pilgrim,
    });
  }
  function challenge(metric: keyof BladeStats, value = 1) {
    const { G, activeTrial, activeDaily, AWAKENING, META, saveAwakening } = readViews();
    if (G.zen || activeTrial || activeDaily) return;
    recordChallenge(AWAKENING, META.upgrades.awakening, G.runBlade, G.runRobe, metric, value);
    saveAwakening();
  }
  function bst() {
    const { G, ST } = readViews();
    const id = G.runBlade;
    if (!id) return null;
    return ST.bl[id] || (ST.bl[id] = { k: 0, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 });
  }
  function checkUnlocks() {
    const {
      G,
      activeTrial,
      activeDaily,
      UNL,
      ST,
      ITEMS,
      ITEM_BY,
      revoked,
      META,
      AWAKENING,
      COLLECTION_PROGRESS,
      accessible,
      refreshArmoryNew,
      runItemReveals,
      store,
      itemPresentation,
      TYPE_WORD,
    } = readViews();
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
  return { earn, challenge, bst, checkUnlocks };
}
