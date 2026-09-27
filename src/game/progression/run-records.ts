import type { Statistics } from './statistics.ts';
import { modeKey } from './modes.ts';
import type { RunMode } from './modes.ts';
export interface FinishedRun extends RunMode {
  score: number;
  maxCombo: number;
  wave: number;
  runTime: number;
  reason: string;
  runBlade?: string;
}
/** Call once when the run ends; persistence and unlock notifications are caller-owned. */
export function recordRun(stats: Statistics, run: FinishedRun) {
  const key = modeKey(run),
    record = { score: 0, combo: 0, wave: 0, ...stats.rec[key] };
  const newBest = run.zen
    ? run.maxCombo > record.combo && run.maxCombo > 0
    : run.score > record.score && run.score > 0;
  record.score = Math.max(record.score, run.score);
  record.combo = Math.max(record.combo, run.maxCombo);
  record.wave = Math.max(record.wave, run.wave);
  stats.rec[key] = record;
  if (!run.zen) {
    if (run.runBlade) {
      const blade = (stats.bl[run.runBlade] ??= { k: 0, p: 0, d: 0, w: 0, rw: 0, c: 0, sc: 0 });
      blade.sc = Math.max(blade.sc, run.score);
    }
    if (run.mode === 'ronin') stats.bestRonin = Math.max(stats.bestRonin, run.score);
    stats.bestScore = Math.max(stats.bestScore, run.score);
  }
  stats.time += run.runTime;
  if (run.reason !== 'quit') {
    stats.deaths[run.reason] = (stats.deaths[run.reason] || 0) + 1;
    if (!run.zen && run.wave === 1) stats.w1deaths++;
  }
  return { record, newBest };
}
