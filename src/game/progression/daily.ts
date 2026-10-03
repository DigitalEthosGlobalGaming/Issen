import { DEFAULT_EQUIPMENT, type Equipment, type Setup } from '../../platform/saves.ts';
import { rng } from '../../shared/random.ts';

export interface DailyRun {
  day: string;
  seed: number;
  equipment: Equipment;
  setup: Setup;
}
export function dailyResult(
  saved: unknown,
  day: string,
  run: { score: number; maxCombo: number; wave: number },
) {
  const raw = saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {};
  const prior = raw[day] as { score?: number; combo?: number; wave?: number } | undefined;
  const count = (value: unknown) =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : 0;
  const record = {
    score: Math.max(count(prior?.score), run.score),
    combo: Math.max(count(prior?.combo), run.maxCombo),
    wave: Math.max(count(prior?.wave), run.wave),
  };
  const records: Record<string, typeof record> = { [day]: record };
  for (const key of Object.keys(raw)
    .filter((key) => /^\d{4}-\d{2}-\d{2}$/.test(key) && key !== day)
    .sort()
    .reverse()
    .slice(0, 31)) {
    const value = raw[key] as typeof record | null;
    records[key] = {
      score: count(value?.score),
      combo: count(value?.combo),
      wave: count(value?.wave),
    };
  }
  return { record, records, newBest: run.score > count(prior?.score) };
}
export function dailyRun(date: Date | string = new Date()): DailyRun {
  const day = typeof date === 'string' ? date : date.toISOString().slice(0, 10);
  const parsed = new Date(day);
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(day) ||
    !Number.isFinite(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== day
  )
    throw new Error('Invalid daily date');
  let seed = 2166136261;
  for (const char of `issen.daily.v1:${day}`)
    seed = Math.imul(seed ^ char.charCodeAt(0), 16777619) >>> 0;
  const random = rng(seed);
  const pick = (ids: string[]) => ids[Math.floor(random() * ids.length)]!;
  return {
    day,
    seed,
    setup: { mode: 'waves', diff: 'normal', arrows: true, lives: '3', upgrades: false },
    equipment: {
      ...DEFAULT_EQUIPMENT,
      blade: pick(['steel', 'kuro', 'beni', 'tsuki', 'oboro', 'bokken', 'kodachi']),
      robe: pick(['sumi', 'hai', 'aka', 'kasa', 'shiro', 'monk', 'mino']),
      charm: pick(['nocharm', 'omikuji']),
    },
  };
}
