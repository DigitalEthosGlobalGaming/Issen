/** Normal life mode has a two-life baseline and a hard total cap of five. */
export function normalLives(bonus: number): number {
  return Math.max(1, Math.min(5, 2 + Math.trunc(Number.isFinite(bonus) ? bonus : 0)));
}
