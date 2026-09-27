import type { BladeStats } from './statistics.ts';

export interface AwakeningProgress {
  version: 1;
  blades: Record<string, BladeStats>;
  robes: Record<string, BladeStats>;
}
export const emptyChallenge = (): BladeStats => ({ k: 0, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 });
function records(value: unknown): Record<string, BladeStats> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const result: Record<string, BladeStats> = {};
  for (const [id, raw] of Object.entries(value)) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) continue;
    const record = emptyChallenge();
    for (const key of Object.keys(record) as (keyof BladeStats)[]) {
      const n = (raw as Record<string, unknown>)[key];
      if (typeof n === 'number' && Number.isSafeInteger(n) && n >= 0) record[key] = n;
    }
    Object.defineProperty(result, id, {
      value: record,
      enumerable: true,
      writable: true,
      configurable: true,
    });
  }
  return result;
}
/** Old blade progress is preserved once. New progress is independent of lifetime
 * statistics so buying access never retroactively counts pre-purchase play. */
export function parseAwakeningProgress(
  value: unknown,
  legacyBlades: unknown = {},
): AwakeningProgress {
  const saved = value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
  return {
    version: 1,
    blades: records(value == null ? legacyBlades : saved.blades),
    robes: records(saved.robes),
  };
}
export function recordChallenge(
  progress: AwakeningProgress,
  access: boolean | number,
  blade: string,
  robe: string,
  metric: keyof BladeStats,
  value = 1,
): void {
  if (!access || !Number.isSafeInteger(value) || value < 0) return;
  for (const [table, id] of [
    [progress.blades, blade],
    [progress.robes, robe],
  ] as const) {
    if (table === progress.robes && access !== true && Number(access) < 2) continue;
    if (!id) continue;
    if (!Object.hasOwn(table, id))
      Object.defineProperty(table, id, {
        value: emptyChallenge(),
        enumerable: true,
        writable: true,
        configurable: true,
      });
    const row = table[id]!;
    row[metric] = ['k', 'p', 'd'].includes(metric)
      ? Math.min(Number.MAX_SAFE_INTEGER, row[metric] + value)
      : Math.max(row[metric], value);
  }
}
