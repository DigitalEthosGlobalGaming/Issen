/** Normal life mode has a two-life baseline; gear and blessings have no total cap. */
export function normalLives(bonus: number): number {
  return Math.max(1, 2 + Math.trunc(Number.isFinite(bonus) ? bonus : 0));
}
