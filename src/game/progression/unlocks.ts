import { SPECIAL, STEEL_THIRD } from '../content/awakenings.ts';
import { ROBE_AWAKENINGS } from '../content/robe-awakenings.ts';
import type { AwakeningProgress } from './awakening-progress.ts';
import type { Item, ItemCategory } from '../content/items.ts';
import type { Statistics } from './statistics.ts';

export interface UnlockNotice {
  k: string;
  n: string;
  type: ItemCategory;
}

/** Mutates the profile's set in catalog order, including dependent unlocks.
 * Presentation and persistence remain the caller's responsibility.
 */
export function unlockEligibleItems(
  stats: Statistics,
  unlocked: Set<string>,
  items: readonly Item[],
  onUnlock: (id: string, notice: UnlockNotice) => void,
  awakening?: {
    access: boolean | number;
    progress: AwakeningProgress;
    itemStats?(id: string): Statistics | null;
    paidAwakenings?: boolean;
  },
): void {
  const byId = new Map(items.map((item) => [item.id, item]));
  // A callback may remove a grant (for example, test-profile revocation).
  // Remember grants made in this call so that cannot cause a re-grant loop.
  const granted = new Set<string>();
  let changed: boolean;
  do {
    changed = false;
    for (const item of items) {
      const eligibleStats = awakening?.itemStats ? awakening.itemStats(item.id) : stats;
      if (
        granted.has(item.id) ||
        unlocked.has(item.id) ||
        !eligibleStats ||
        !item.ok(eligibleStats)
      )
        continue;
      unlocked.add(item.id);
      granted.add(item.id);
      changed = true;
      onUnlock(item.id, item);
    }
    for (const [id, definition] of Object.entries({ ...SPECIAL, ...ROBE_AWAKENINGS })) {
      if (awakening?.paidAwakenings) continue;
      const item = byId.get(id);
      if (item?.type === 'robe' && awakening?.access !== true && Number(awakening?.access ?? 0) < 2)
        continue;
      const progress =
        item?.type === 'robe' ? awakening?.progress.robes[id] : awakening?.progress.blades[id];
      const awakenedId = id + '+';
      if (
        !awakening?.access ||
        !item ||
        !unlocked.has(id) ||
        unlocked.has(awakenedId) ||
        granted.has(awakenedId) ||
        !progress ||
        progress[definition.need[0]] < definition.need[1]
      )
        continue;
      unlocked.add(awakenedId);
      granted.add(awakenedId);
      changed = true;
      onUnlock(awakenedId, { k: '真', n: item.n + ' awakened', type: item.type });
    }
    if (
      awakening?.access &&
      !awakening.paidAwakenings &&
      unlocked.has('steel+') &&
      !unlocked.has('steel++') &&
      (awakening.progress.blades.steel?.k ?? 0) >= STEEL_THIRD.need[1]
    ) {
      unlocked.add('steel++');
      granted.add('steel++');
      changed = true;
      onUnlock('steel++', { k: '極', n: 'Tamahagane third awakening', type: 'blade' });
    }
  } while (changed);
}
