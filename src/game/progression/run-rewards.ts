import type { MetaProgress } from './meta.ts';

export type RewardEvent = 'kill' | 'wave' | 'boss';
export interface RewardContext {
  zen?: boolean;
  tutorial?: boolean;
  testing?: boolean;
  emberBonus?: number;
  pilgrim?: boolean;
}

const MAX_CURRENCY = 1_000_000_000;
const BASE_REWARD: Record<RewardEvent, number> = { kill: 1, wave: 5, boss: 25 };

export interface RunRewardLedger {
  /** Persisted choice before settlement; absent means no support choice yet. */
  supportMultiplier?: 1 | 2;
  /** Hundredths of Embers; never stored in the account until settlement. */
  pending: number;
  settled: RewardSettlement | null;
}

export interface RewardSettlement {
  before: number;
  gained: number;
  after: number;
}

export function createRunRewardLedger(): RunRewardLedger {
  return { pending: 0, settled: null };
}

/** Count combat rewards without touching persistent progression. The half-rate
 * applies before rounding so one-Ember kills still contribute to the total. */
export function accrueRunReward(
  ledger: RunRewardLedger,
  event: RewardEvent,
  context: RewardContext = {},
): void {
  if (ledger.settled || context.zen || context.tutorial || context.testing) return;
  const bonus = Number.isFinite(context.emberBonus) ? Math.max(0, context.emberBonus!) : 0;
  const factor = context.pilgrim ? (event === 'boss' ? 1.5 : event === 'kill' ? 0.75 : 1) : 1;
  ledger.pending += Math.round(BASE_REWARD[event] * (1 + bonus) * factor * 50);
}

/** The sole account write for a finished run. Re-entry returns the same result
 * without a second credit. Existing fractional bonus currency carries over. */
export function settleRunReward(meta: MetaProgress, ledger: RunRewardLedger): RewardSettlement {
  if (ledger.settled) return ledger.settled;
  const before = meta.embers;
  const hundredths =
    Math.max(0, Math.min(99, meta.emberRemainder)) +
    ledger.pending * (ledger.supportMultiplier === 2 ? 2 : 1);
  const available = Math.floor(hundredths / 100);
  meta.emberRemainder = hundredths % 100;
  meta.embers = Math.min(MAX_CURRENCY, before + available);
  const gained = meta.embers - before;
  meta.earned = Math.min(MAX_CURRENCY, meta.earned + gained);
  ledger.settled = Object.freeze({ before, gained, after: meta.embers });
  return ledger.settled;
}

/** Credit the extra copy of a settled run once; marker and balance share one save. */
export function grantSupportEmberBonus(
  meta: MetaProgress,
  id: string,
  hundredths: number,
): RewardSettlement | null {
  if (!id || meta.supportRewardClaim === id || !Number.isSafeInteger(hundredths) || hundredths <= 0)
    return null;
  const before = meta.embers;
  const total = meta.emberRemainder + hundredths;
  meta.embers = Math.min(MAX_CURRENCY, before + Math.floor(total / 100));
  meta.emberRemainder = total % 100;
  meta.earned = Math.min(MAX_CURRENCY, meta.earned + meta.embers - before);
  meta.supportRewardClaim = id;
  return { before, gained: meta.embers - before, after: meta.embers };
}
