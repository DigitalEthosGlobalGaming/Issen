import { STAT0 } from '../game/progression/statistics.ts';
import type { Statistics, BladeStats, ModeRecord } from '../game/progression/statistics.ts';
import type { Item, ItemCategory } from '../game/content/items.ts';
import { store } from './storage.ts';

export interface Setup {
  mode: 'waves' | 'rush';
  diff: 'normal' | 'ronin';
  arrows: boolean;
  lives: '3' | '0' | 'zen';
}
export type Equipment = Record<ItemCategory, string> & { bladeSp: boolean };
export const DEFAULT_EQUIPMENT: Equipment = {
  bladeSp: false,
  crest: 'nocrest',
  pet: 'nopet',
  charm: 'nocharm',
  blade: 'steel',
  robe: 'sumi',
  fx: 'ink',
  film: 'mono',
  seal: 'verm',
};
const BLADE_STATS: BladeStats = { k: 0, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 };
const MODE_RECORD: ModeRecord = { score: 0, combo: 0, wave: 0 };

function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}
function counter(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}
function counters<T extends object>(value: unknown, defaults: T): T {
  const result = { ...defaults };
  for (const [key, entry] of Object.entries(object(value))) {
    if (Object.hasOwn(defaults, key) && counter(entry)) {
      Object.assign(result, { [key]: entry });
    }
  }
  return result;
}

export function parseStatistics(value: unknown, legacyBest: unknown = 0): Statistics {
  const saved = object(value);
  const { bl: _bl, rec: _rec, deaths: _deaths, ...numericDefaults } = STAT0;
  const stats: Statistics = {
    ...counters(saved, numericDefaults),
    bl: Object.fromEntries(
      Object.entries(object(saved.bl)).map(([id, record]) => [id, counters(record, BLADE_STATS)]),
    ),
    rec: Object.fromEntries(
      Object.entries(object(saved.rec)).map(([id, record]) => [id, counters(record, MODE_RECORD)]),
    ),
    deaths: Object.fromEntries(
      Object.entries(object(saved.deaths)).filter((entry): entry is [string, number] =>
        counter(entry[1]),
      ),
    ),
  };
  if (counter(legacyBest)) stats.bestScore = Math.max(stats.bestScore, legacyBest);
  return stats;
}

export function parseSetup(value: unknown): Setup {
  const saved = object(value);
  return {
    mode: saved.mode === 'rush' ? 'rush' : 'waves',
    diff: saved.diff === 'ronin' ? 'ronin' : 'normal',
    arrows: typeof saved.arrows === 'boolean' ? saved.arrows : true,
    lives: saved.lives === '0' || saved.lives === 'zen' ? saved.lives : '3',
  };
}

export function loadUnlocks(): Set<string> {
  const saved = store.get('issen.unlocks', []);
  const unlocks = new Set(
    Array.isArray(saved) ? saved.filter((id): id is string => typeof id === 'string') : [],
  );
  for (const id of Object.values(DEFAULT_EQUIPMENT)) {
    if (typeof id === 'string') unlocks.add(id);
  }
  return unlocks;
}

export function parseEquipment(
  value: unknown,
  unlocks: ReadonlySet<string>,
  items: readonly Item[],
): Equipment {
  const saved = object(value);
  const equipment = { ...DEFAULT_EQUIPMENT };
  for (const item of items) {
    if (saved[item.type] === item.id && unlocks.has(item.id)) equipment[item.type] = item.id;
  }
  equipment.bladeSp = saved.bladeSp === true;
  return equipment;
}

export const loadStatistics = (): Statistics =>
  parseStatistics(store.get('issen.stats', {}), store.get('issen.best', 0));
export const loadSetup = (): Setup => parseSetup(store.get('issen.setup', {}));
export const loadEquipment = (unlocks: ReadonlySet<string>, items: readonly Item[]): Equipment =>
  parseEquipment(store.get('issen.equip', {}), unlocks, items);
