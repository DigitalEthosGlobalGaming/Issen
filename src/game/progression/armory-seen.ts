import type { Item } from '../content/items.ts';

/** An absent save belongs to a pre-badge profile: its existing collection is
 * already familiar. An explicit empty array belongs to a new profile. */
export function parseArmorySeen(value: unknown, owned: ReadonlySet<string>): Set<string> {
  if (value == null) return new Set(owned);
  if (!Array.isArray(value)) return new Set();
  return new Set(value.filter((id): id is string => typeof id === 'string' && id.length < 80));
}

export function isNewArmoryItem(
  item: Item,
  owned: ReadonlySet<string>,
  seen: ReadonlySet<string>,
): boolean {
  return (
    (owned.has(item.id) && !seen.has(item.id)) ||
    (owned.has(item.id + '+') && !seen.has(item.id + '+'))
  );
}

/** A detail view acknowledges the base item and any owned awakened form. */
export function markArmoryItemViewed(
  id: string,
  owned: ReadonlySet<string>,
  seen: Set<string>,
): boolean {
  let changed = false;
  for (const key of [id, id + '+']) {
    if (owned.has(key) && !seen.has(key)) {
      seen.add(key);
      changed = true;
    }
  }
  return changed;
}
