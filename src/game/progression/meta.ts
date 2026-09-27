import type { Setup } from '../../platform/saves.ts';

export type UpgradeId =
  'vitality' | 'focus' | 'offerings' | 'awakening' | 'knife' | 'pouch' | 'composure' | 'recovery';
export const EMPTY_UPGRADES: Readonly<Record<UpgradeId, number>> = Object.freeze({
  vitality: 0,
  focus: 0,
  offerings: 0,
  awakening: 0,
  knife: 0,
  pouch: 0,
  composure: 0,
  recovery: 0,
});
export type TutorialStatus = 'new' | 'completed' | 'skipped';
/** Persistent account progression. Embers are awarded immediately for combat
 * events, so abandoned runs keep their earnings. Ranks apply to the next run.
 * bossMilestone records journey position, not repeated boss victories;
 * revealSeen independently records which menu introductions have played. */
export interface MetaProgress {
  schemaVersion: 3;
  embers: number;
  earned: number;
  upgrades: Record<UpgradeId, number>;
  bossMilestone: number;
  revealSeen: number;
  tutorial: TutorialStatus;
}
export interface TemplateUpgrade {
  id: UpgradeId;
  name: string;
  description: string;
  costs: readonly number[];
  maxRank: number;
  requires?: UpgradeId;
}
/** Cost index equals owned rank. Extend the parser and modifier composition
 * alongside this catalog when introducing a new permanent upgrade. */
export const TEMPLATE_UPGRADES: readonly TemplateUpgrade[] = [
  {
    id: 'vitality',
    name: 'Vitality',
    description: 'Raise Normal starting lives from two to five, one life per rank.',
    costs: [100, 200, 350],
    maxRank: 3,
  },
  {
    id: 'focus',
    name: 'Focus',
    description: '+5% parry window per rank',
    costs: [75, 150, 225],
    maxRank: 3,
  },
  {
    id: 'offerings',
    name: 'Offerings',
    description: '+1 Shrine blessing choice',
    costs: [150],
    maxRank: 1,
  },
  {
    id: 'awakening',
    name: 'Awakening Access',
    description:
      'Unlock weapon awakenings first, then outfit awakenings. Complete their challenges in the Armoury to awaken your equipment.',
    costs: [200, 300],
    maxRank: 2,
  },
  {
    id: 'knife',
    name: 'Throwing Knife',
    description:
      'Start with one throwing knife. Tap during a wave to defeat a random ordinary enemy. Never used on bosses or in standoffs.',
    costs: [125],
    maxRank: 1,
  },
  {
    id: 'pouch',
    name: 'Knife Pouch',
    description:
      'Carry one additional starting knife per rank, up to three total. Requires Throwing Knife.',
    costs: [150, 250],
    maxRank: 2,
    requires: 'knife',
  },
  {
    id: 'composure',
    name: 'Composure',
    description:
      'Preserve your combo through one otherwise unprotected combo break per rank each run. Equipment protection is used first.',
    costs: [175, 300],
    maxRank: 2,
  },
  {
    id: 'recovery',
    name: 'Recovery',
    description:
      'Restore one life after every six cleared waves, or every three at rank two. Never exceeds your life cap.',
    costs: [200, 350],
    maxRank: 2,
  },
];
export interface ModeUnlock {
  milestone: number;
  id: 'rush' | 'ronin' | 'blade';
  name: string;
  description: string;
}
export const MODE_UNLOCKS: readonly ModeUnlock[] = [
  {
    milestone: 1,
    id: 'rush',
    name: 'Boss Rush',
    description: 'Face an unbroken succession of bosses.',
  },
  {
    milestone: 2,
    id: 'ronin',
    name: 'Ronin',
    description: 'Challenge a faster, less forgiving journey.',
  },
  {
    milestone: 3,
    id: 'blade',
    name: 'Blade Only',
    description: 'Read your opponents without direction arrows.',
  },
];
const MAX_CURRENCY = 1_000_000_000;
function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function integer(value: unknown, cap: number): number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
    ? Math.min(value, cap)
    : 0;
}
/** Only absent metadata triggers migration. Established players keep every old
 * option because historical records cannot reliably prove boss positions. */
export function parseMeta(
  value: unknown,
  legacyStats: unknown = {},
  unlocks: ReadonlySet<string> = new Set(),
): MetaProgress {
  const saved = object(value);
  const ranks = object(saved.upgrades);
  const legacy = object(legacyStats);
  const established =
    value == null &&
    ['runs', 'duels', 'bestWave'].some((key) => integer(legacy[key], MAX_CURRENCY) > 0);
  const bossMilestone = established ? 3 : integer(saved.bossMilestone, 3);
  const embers = integer(saved.embers, MAX_CURRENCY);
  return {
    schemaVersion: 3,
    embers,
    earned: Math.max(embers, integer(saved.earned, MAX_CURRENCY)),
    upgrades: {
      vitality:
        saved.schemaVersion === 2 || saved.schemaVersion === 3
          ? integer(ranks.vitality, 3)
          : integer(ranks.vitality, 1) * 2,
      focus: integer(ranks.focus, 3),
      offerings: integer(ranks.offerings, 1),
      awakening: Math.max(
        saved.schemaVersion === 3 ? integer(ranks.awakening, 2) : integer(ranks.awakening, 1) * 2,
        saved.schemaVersion !== 2 &&
          saved.schemaVersion !== 3 &&
          [...unlocks].some((id) => id.endsWith('+'))
          ? 2
          : 0,
      ),
      knife: integer(ranks.knife, 1),
      pouch: integer(ranks.pouch, 2),
      composure: integer(ranks.composure, 2),
      recovery: integer(ranks.recovery, 2),
    },
    bossMilestone,
    revealSeen: established ? 3 : integer(saved.revealSeen, bossMilestone),
    tutorial: established
      ? 'skipped'
      : saved.tutorial === 'completed' || saved.tutorial === 'skipped'
        ? saved.tutorial
        : 'new',
  };
}
/** Validated synchronous purchase; unaffordable or maximum-rank clicks do nothing. */
export function purchaseUpgrade(meta: MetaProgress, id: string): boolean {
  const upgrade = TEMPLATE_UPGRADES.find((entry) => entry.id === id);
  if (!upgrade) return false;
  if (upgrade.requires && meta.upgrades[upgrade.requires] < 1) return false;
  const rank = meta.upgrades[upgrade.id];
  if (!Number.isInteger(rank) || rank < 0 || rank >= upgrade.maxRank) return false;
  const cost = upgrade.costs[rank];
  if (cost === undefined || !Number.isSafeInteger(meta.embers) || meta.embers < cost) return false;
  meta.embers -= cost;
  meta.upgrades[upgrade.id] = rank + 1;
  return true;
}
/** Permanent power is limited to opted-in Normal-life, guided wave runs. */
export function templateEligible(setup: Setup): boolean {
  return (
    setup.upgrades !== false &&
    setup.mode === 'waves' &&
    setup.diff === 'normal' &&
    setup.arrows &&
    setup.lives === '3'
  );
}
/** Snapshot these consumable powers at run start; purchases never refill a run. */
export function templatePowers(
  meta: MetaProgress,
  setup: Setup,
): { knives: number; composure: number; recoveryEvery: number } {
  const ranks = templateEligible(setup) ? parseMeta(meta).upgrades : EMPTY_UPGRADES;
  return {
    knives: ranks.knife ? 1 + ranks.pouch : 0,
    composure: ranks.composure,
    recoveryEvery: ranks.recovery === 2 ? 3 : ranks.recovery === 1 ? 6 : 0,
  };
}
export function templateModifiers(
  meta: MetaProgress,
  setup: Setup,
): { lives: number; parry: number; shrineN: number } {
  const ranks = templateEligible(setup)
    ? parseMeta(meta).upgrades
    : { vitality: 0, focus: 0, offerings: 0 };
  return {
    lives: ranks.vitality,
    parry: 1 + ranks.focus * 0.05,
    shrineN: ranks.offerings ? 3 + ranks.offerings : 0,
  };
}
export type RewardEvent = 'kill' | 'wave' | 'boss';
export interface RewardContext {
  zen?: boolean;
  tutorial?: boolean;
  testing?: boolean;
}
/** Runtime calls exactly once per authoritative event, never from rendering.
 * Testing is excluded unless the caller deliberately uses an isolated profile. */
export function rewardCurrency(
  meta: MetaProgress,
  event: RewardEvent,
  context: RewardContext = {},
): number {
  if (context.zen || context.tutorial || context.testing) return 0;
  const amount = { kill: 1, wave: 5, boss: 25 }[event];
  const before = integer(meta.embers, MAX_CURRENCY);
  meta.embers = Math.min(MAX_CURRENCY, before + amount);
  meta.earned = Math.min(MAX_CURRENCY, integer(meta.earned, MAX_CURRENCY) + amount);
  return meta.embers - before;
}
/** One-based boss position in a qualifying journey; earlier repeat victories
 * cannot advance the milestone. Tutorial outcomes must not call this function. */
export function unlockBossMilestone(meta: MetaProgress, ordinal: number, setup: Setup): boolean {
  if (
    setup.mode !== 'waves' ||
    setup.lives === 'zen' ||
    !Number.isSafeInteger(ordinal) ||
    ordinal < 1
  )
    return false;
  const milestone = Math.min(ordinal, 3);
  if (milestone <= meta.bossMilestone) return false;
  meta.bossMilestone = milestone;
  return true;
}
export function pendingModeReveals(meta: MetaProgress): ModeUnlock[] {
  return MODE_UNLOCKS.filter(
    (mode) => mode.milestone > meta.revealSeen && mode.milestone <= meta.bossMilestone,
  );
}
export function markModeRevealsSeen(meta: MetaProgress): void {
  meta.revealSeen = meta.bossMilestone;
}
/** Enforce access at run start as well as hiding locked setup controls. */
export function sanitizeSetup(setup: Setup, meta: MetaProgress): Setup {
  return {
    ...setup,
    mode: meta.bossMilestone >= 1 ? setup.mode : 'waves',
    diff: meta.bossMilestone >= 2 ? setup.diff : 'normal',
    arrows: meta.bossMilestone >= 3 ? setup.arrows : true,
  };
}
