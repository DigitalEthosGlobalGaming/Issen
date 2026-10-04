import { SPECIAL, STEEL_THIRD } from '../content/awakenings.ts';
import { ROBE_AWAKENINGS } from '../content/robe-awakenings.ts';
import type { Item } from '../content/items.ts';
import type { MetaProgress } from './meta.ts';
import type { AwakeningProgress } from './awakening-progress.ts';
export const awakeningCost = (id: string) => (id === 'steel++' ? 300 : 150);
export function awakeningPurchasable(
  meta: MetaProgress,
  unlocked: ReadonlySet<string>,
  items: readonly Item[],
  progress: AwakeningProgress,
  id: string,
): boolean {
  const base = id.replace(/\++$/, '');
  const item = items.find((it) => it.id === base);
  if (!item || !id.endsWith('+') || unlocked.has(id) || !unlocked.has(base)) return false;
  const blade = item.type === 'blade';
  if ((!blade && item.type !== 'robe') || meta.upgrades.awakening < (blade ? 1 : 2)) return false;
  const definition =
    id === 'steel++'
      ? STEEL_THIRD
      : id === base + '+'
        ? blade
          ? SPECIAL[base]
          : ROBE_AWAKENINGS[base]
        : undefined;
  if (!definition || (id === 'steel++' && !unlocked.has('steel+'))) return false;
  const row = blade ? progress.blades[base] : progress.robes[base];
  return !!row && row[definition.need[0]] >= definition.need[1];
}
export function purchaseAwakening(
  meta: MetaProgress,
  unlocked: Set<string>,
  items: readonly Item[],
  progress: AwakeningProgress,
  id: string,
): boolean {
  if (
    !awakeningPurchasable(meta, unlocked, items, progress, id) ||
    !Number.isSafeInteger(meta.embers) ||
    meta.embers < awakeningCost(id)
  )
    return false;
  meta.embers -= awakeningCost(id);
  unlocked.add(id);
  return true;
}
