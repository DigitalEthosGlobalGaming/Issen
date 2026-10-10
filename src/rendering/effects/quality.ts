export function scaledCount(count: number, density = 1): number {
  return Math.max(1, Math.round(count * density));
}
/** Session lighting tools override a caller's quality choice without changing saved settings. */
export function preferredLightResolution(mode: unknown, authored: 1 | 0.5 = 1): 1 | 0.5 {
  return mode === 'half' ? 0.5 : mode === 'full' ? 1 : authored;
}
