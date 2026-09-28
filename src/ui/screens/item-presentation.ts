import type { Item } from '../../game/content/items.ts';

/** Shared Armoury and end-of-run copy from the owning item catalog. */
export function itemPresentation(item: Item) {
  return {
    flavor: item.f,
    benefit: item.pk,
    tradeoff: item.tr,
    unlockCondition: item.d || item.hint,
  };
}
