import { SPECIAL } from '../content/awakenings.ts';
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
): void {
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const [id, awakening] of Object.entries(SPECIAL)) {
    const progress = stats.bl[id];
    const item = byId.get(id);
    if (!item || unlocked.has(id + '+') || !progress) continue;
    if (progress[awakening.need[0]] < awakening.need[1]) continue;
    unlocked.add(id + '+');
    onUnlock(id + '+', { k: '真', n: item.n + ' awakened', type: 'blade' });
  }
  for (const item of items) {
    if (unlocked.has(item.id) || !item.ok(stats)) continue;
    unlocked.add(item.id);
    onUnlock(item.id, item);
  }
}
