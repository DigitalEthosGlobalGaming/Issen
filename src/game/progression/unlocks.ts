import { SPECIAL } from '../content/awakenings.ts';
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
  awakening?: { access: boolean | number; progress: AwakeningProgress },
): void {
  const byId = new Map(items.map((item) => [item.id, item]));
  for (const [id, definition] of Object.entries({ ...SPECIAL, ...ROBE_AWAKENINGS })) {
    const item = byId.get(id);
    if (item?.type === 'robe' && awakening?.access !== true && Number(awakening?.access ?? 0) < 2)
      continue;
    const progress =
      item?.type === 'robe' ? awakening?.progress.robes[id] : awakening?.progress.blades[id];
    if (!awakening?.access || !item || !unlocked.has(id) || unlocked.has(id + '+') || !progress)
      continue;
    if (progress[definition.need[0]] < definition.need[1]) continue;
    unlocked.add(id + '+');
    onUnlock(id + '+', { k: '真', n: item.n + ' awakened', type: item.type });
  }
  for (const item of items) {
    if (unlocked.has(item.id) || !item.ok(stats)) continue;
    unlocked.add(item.id);
    onUnlock(item.id, item);
  }
}
