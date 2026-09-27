/**
 * Counter shape for legacy per-blade lifetime statistics and independent blade/
 * robe AwakeningProgress records. Only the latter determine current awakening
 * eligibility; their event recording is gated by purchased access. Normal and
 * awakened forms share each item's challenge record. Lifetime Statistics.bl
 * remains for compatibility and one-time challenge migration.
 * Keep these abbreviated saved keys stable; new metrics require initialization
 * and validation in platform/saves.ts and progression/awakening-progress.ts, plus
 * a gameplay event that earns them.
 */
export interface BladeStats {
  /** Cumulative eligible foes killed while using the equipment. */
  k: number;
  /** Cumulative perfect cuts. */
  p: number;
  /** Cumulative duel victories. */
  d: number;
  /** Highest wave reached, not number of waves cleared. */
  w: number;
  /** Highest wave reached in Ronin mode. */
  rw: number;
  /** Largest combo reached in one run. */
  c: number;
  /** Highest score recorded for a non-Zen run. */
  sc: number;
}
export interface ModeRecord {
  score: number;
  combo: number;
  wave: number;
}
export const STAT0 = {
  midnight: 0,
  applause: 0,
  fidget: 0,
  rushBest: 0,
  rushRuns: 0,
  rushBlade: 0,
  feintKills: 0,
  mirrorClean: 0,
  omikuji: 0,
  bladeWave: 0,
  feinted: 0,
  scarecrow: 0,
  flawlessWave: 0,
  konami: 0,
  bl: {} as Record<string, BladeStats>,
  roninDuels: 0,
  curses: 0,
  flawless: 0,
  rares: 0,
  mirrorWins: 0,
  rec: {} as Record<string, ModeRecord>,
  bestZen: 0,
  w1deaths: 0,
  standoffs: 0,
  shrines: 0,
  cleanDuels: 0,
  bestPStreak: 0,
  bladeDuels: 0,
  runs: 0,
  kills: 0,
  perfects: 0,
  parries: 0,
  duels: 0,
  bestScore: 0,
  bestRonin: 0,
  bestWave: 0,
  roninWave: 0,
  bestCombo: 0,
  time: 0,
  furthestStage: 0,
  deaths: {} as Record<string, number>,
};
/**
 * Persistent profile achievements and records, distinct from live RunState.
 * `bl` tracks progress per base blade; `rec` holds records by modes.ts modeKey;
 * `deaths` counts run-ending reasons. Base-item predicates consume this state;
 * awakening eligibility uses the separate AwakeningProgress record. STAT0
 * supplies defaults; platform/saves.ts validates saved
 * data, so new fields must be supported there rather than only added to the type.
 */
export type Statistics = typeof STAT0;
export const deathsTotal = (stats: Pick<Statistics, 'deaths'>): number =>
  Object.values(stats.deaths).reduce((sum, value) => sum + value, 0);
