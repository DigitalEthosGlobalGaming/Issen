import { DEFAULT_EQUIPMENT, parseEquipment, type Equipment } from '../../platform/saves.ts';
import type { Item } from '../content/items.ts';
export const MAX_PRESETS = 5;
export interface LoadoutPreset {
  id: string;
  name: string;
  equipment: Equipment;
}
export function parsePresets(value: unknown): LoadoutPreset[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const presets: LoadoutPreset[] = [];
  for (const raw of value) {
    if (
      !raw ||
      typeof raw !== 'object' ||
      typeof raw.id !== 'string' ||
      !raw.id ||
      raw.id.length > 80 ||
      seen.has(raw.id) ||
      !raw.equipment ||
      typeof raw.equipment !== 'object'
    )
      continue;
    const equipment = { ...DEFAULT_EQUIPMENT };
    for (const key of Object.keys(DEFAULT_EQUIPMENT) as (keyof Equipment)[]) {
      if (typeof DEFAULT_EQUIPMENT[key] === 'string') {
        const id = raw.equipment[key];
        if (typeof id === 'string' && id.length <= 160 && id)
          (equipment as Record<string, unknown>)[key] = id;
      } else (equipment as Record<string, unknown>)[key] = raw.equipment[key] === true;
    }
    seen.add(raw.id);
    presets.push({
      id: raw.id,
      name:
        typeof raw.name === 'string' && raw.name.trim()
          ? raw.name.trim().slice(0, 32)
          : `Loadout ${presets.length + 1}`,
      equipment,
    });
    if (presets.length === MAX_PRESETS) break;
  }
  return presets;
}
export function mergePresets(local: unknown, incoming: unknown): LoadoutPreset[] {
  return parsePresets([...parsePresets(local), ...parsePresets(incoming)]);
}
export function addPreset(
  presets: LoadoutPreset[],
  capacity: number,
  equipment: Equipment,
  id = crypto.randomUUID(),
): boolean {
  if (presets.length >= Math.min(MAX_PRESETS, capacity) || presets.some((p) => p.id === id))
    return false;
  presets.push({ id, name: `Loadout ${presets.length + 1}`, equipment: { ...equipment } });
  return true;
}
/** Saved selections remain intact; unavailable equipment falls back only when equipping. */
export function presetEquipment(
  preset: LoadoutPreset,
  owned: ReadonlySet<string>,
  items: readonly Item[],
  awakeningRank: number,
): Equipment {
  const equipment = parseEquipment(preset.equipment, owned, items);
  equipment.bladeSp =
    awakeningRank >= 1 &&
    equipment.blade === preset.equipment.blade &&
    owned.has(equipment.blade + '+') &&
    preset.equipment.bladeSp;
  equipment.bladeThird =
    awakeningRank >= 1 && equipment.blade === preset.equipment.blade && !!equipment.bladeThird;
  equipment.robeSp =
    awakeningRank >= 2 && equipment.robe === preset.equipment.robe && !!equipment.robeSp;
  return equipment;
}
