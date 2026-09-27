export interface BladeStats {
  k: number;
  p: number;
  d: number;
  w: number;
  rw: number;
  c: number;
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
export type Statistics = typeof STAT0;
export const deathsTotal = (stats: Pick<Statistics, 'deaths'>): number =>
  Object.values(stats.deaths).reduce((sum, value) => sum + value, 0);
