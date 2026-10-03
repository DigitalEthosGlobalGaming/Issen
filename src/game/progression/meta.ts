import type { Setup } from '../../platform/saves.ts';

export type UpgradeId =
  | 'vitality'
  | 'focus'
  | 'offerings'
  | 'awakening'
  | 'tanto'
  | 'knife'
  | 'composure'
  | 'recovery'
  | 'precision'
  | 'discernment';
export const EMPTY_UPGRADES: Readonly<Record<UpgradeId, number>> = Object.freeze({
  vitality: 0,
  focus: 0,
  offerings: 0,
  awakening: 0,
  tanto: 0,
  knife: 0,
  composure: 0,
  recovery: 0,
  precision: 0,
  discernment: 0,
});
export type TutorialStatus = 'new' | 'completed' | 'skipped';
/** Persistent account progression. Pending combat rewards are settled only
 * when a run ends. Ranks apply to the next run.
 * bossMilestone records journey position, not repeated boss victories;
 * revealSeen independently records which menu introductions have played. */
export interface MetaProgress {
  schemaVersion: 4;
  embers: number;
  earned: number;
  /** Hundredths of an Ember, carried between completed runs and reloads. */
  emberRemainder: number;
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
  premium?: boolean;
}
/** Cost index equals owned rank. Extend the parser and modifier composition
 * alongside this catalog when introducing a new permanent upgrade. */
export const TEMPLATE_UPGRADES: readonly TemplateUpgrade[] = [
  {
    id: 'precision',
    name: 'Precision',
    description:
      'Widen perfect-cut and duel parry windows by 5%, 10%, then 15%. Stacks with equipment.',
    costs: [150, 250, 400],
    maxRank: 3,
    premium: true,
  },
  {
    id: 'discernment',
    name: 'Discernment',
    description: 'Reroll one Shrine offer per run. The same rarity and eligibility rules apply.',
    costs: [250],
    maxRank: 1,
    premium: true,
  },
  {
    id: 'vitality',
    name: 'Vitality',
    description: '+1 starting life per rank.',
    costs: [100, 200, 350],
    maxRank: 3,
  },
  {
    id: 'focus',
    name: 'Focus',
    description: 'Lengthen the duel parry window by 5% per rank.',
    costs: [75, 150, 225],
    maxRank: 3,
  },
  {
    id: 'offerings',
    name: 'Offerings',
    description:
      'Gain +1 Shrine choice, then a 20 percentage point rare chance bonus, then 1 guaranteed rare blessing when available. Ranks stack.',
    costs: [150, 250, 400],
    maxRank: 3,
  },
  {
    id: 'awakening',
    name: 'Awakening Access',
    description:
      'Unlock Blade Awakening challenges, then Outfit Awakening challenges in the Armoury.',
    costs: [200, 300],
    maxRank: 2,
  },
  {
    id: 'knife',
    name: 'Throwing Knife',
    description:
      'Carry 1 throwing knife per rank; refill at the start of every duel. Tap during a wave to defeat an ordinary enemy; knives cannot target bosses or standoffs.',
    costs: [125, 150, 250],
    maxRank: 3,
  },
  {
    id: 'tanto',
    name: 'Tanto',
    description: '+1 automatic defensive strike per rank, per run.',
    costs: [175, 300, 450],
    maxRank: 3,
  },
  {
    id: 'composure',
    name: 'Composure',
    description:
      'Forgive 1 otherwise unprotected combo break per rank each run. Equipment protection is used first.',
    costs: [175, 300],
    maxRank: 2,
  },
  {
    id: 'recovery',
    name: 'Recovery',
    description:
      'Restore 1 life after every 6 cleared waves, or every 3 at rank 2, up to your current life maximum.',
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
    schemaVersion: 4,
    embers,
    earned: Math.max(embers, integer(saved.earned, MAX_CURRENCY)),
    emberRemainder: integer(saved.emberRemainder, 99),
    upgrades: {
      vitality:
        saved.schemaVersion === 2 || saved.schemaVersion === 3 || saved.schemaVersion === 4
          ? integer(ranks.vitality, 3)
          : integer(ranks.vitality, 1) * 2,
      focus: integer(ranks.focus, 3),
      offerings: integer(ranks.offerings, 3),
      awakening: Math.max(
        saved.schemaVersion === 3 || saved.schemaVersion === 4
          ? integer(ranks.awakening, 2)
          : integer(ranks.awakening, 1) * 2,
        saved.schemaVersion !== 2 &&
          saved.schemaVersion !== 3 &&
          saved.schemaVersion !== 4 &&
          [...unlocks].some((id) => id.endsWith('+'))
          ? 2
          : 0,
      ),
      knife:
        saved.schemaVersion === 4
          ? integer(ranks.knife, 3)
          : integer(ranks.knife, 1)
            ? 1 + integer(ranks.pouch, 2)
            : 0,
      tanto: integer(ranks.tanto, 3),
      composure: integer(ranks.composure, 2),
      recovery: integer(ranks.recovery, 2),
      precision: integer(ranks.precision, 3),
      discernment: integer(ranks.discernment, 1),
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
export function purchaseUpgrade(meta: MetaProgress, id: string, premiumAccess = false): boolean {
  const upgrade = TEMPLATE_UPGRADES.find((entry) => entry.id === id);
  if (!upgrade || (upgrade.premium && !premiumAccess)) return false;
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
  premiumAccess = false,
): {
  tanto: number;
  knives: number;
  composure: number;
  recoveryEvery: number;
  shrineRerolls: number;
} {
  const ranks = templateEligible(setup) ? parseMeta(meta).upgrades : EMPTY_UPGRADES;
  return {
    shrineRerolls: premiumAccess ? ranks.discernment : 0,
    tanto: ranks.tanto,
    knives: ranks.knife,
    composure: ranks.composure,
    recoveryEvery: ranks.recovery === 2 ? 3 : ranks.recovery === 1 ? 6 : 0,
  };
}
export function templateModifiers(
  meta: MetaProgress,
  setup: Setup,
  premiumAccess = false,
): {
  lives: number;
  parry: number;
  shrineN: number;
  precision?: number;
  rare?: number;
  rareShrine?: number;
} {
  const ranks = templateEligible(setup) ? parseMeta(meta).upgrades : EMPTY_UPGRADES;
  return {
    lives: ranks.vitality,
    parry: (1 + ranks.focus * 0.05) * (1 + (premiumAccess ? ranks.precision * 0.05 : 0)),
    ...(premiumAccess && ranks.precision ? { precision: ranks.precision * 0.05 } : {}),
    shrineN: ranks.offerings ? 4 : 0,
    ...(ranks.offerings >= 2 ? { rare: 0.2 } : {}),
    ...(ranks.offerings >= 3 ? { rareShrine: 1 } : {}),
  };
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
    lives: meta.upgrades.vitality >= 1 ? setup.lives : '3',
  };
}
