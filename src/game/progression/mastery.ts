import { clamp } from '../../shared/math.ts';
/** Replaces slash timing points; perfect classification is independent. */
export function swiftSlashPoints(elapsed: number, window: number): number {
  return Math.round(120 + 780 * (1 - clamp(elapsed / Math.max(0.01, window))));
}
export function precisionZone(base: number, offset: number, bonus: number): number {
  const zone = clamp(base + offset, 0.55, 0.92);
  return clamp(1 - (1 - zone) * (1 + bonus), 0.5, 0.92);
}
/** Each exchange tightens all duel timings, bounded for readable final rounds. */
export function duelMasterTimings(completed: number) {
  const speed = Math.max(0.5, 1 - Math.max(0, completed) * 0.027);
  return {
    wind: 0.9 * speed,
    flash: 0.46 * speed,
    stag: 1.3 * speed,
    idleMin: 0.7 * speed,
    idleMax: 0.95 * speed,
    feint: 0,
  };
}
