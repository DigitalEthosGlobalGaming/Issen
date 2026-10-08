/** Adjust cosmetic density from sustained frame cost, with headroom for a 60 Hz display. */
export function createEffectQuality() {
  let density = 1;
  let frames = 0;
  let intervalTotal = 0;
  let workTotal = 0;

  return {
    get density() {
      return density;
    },
    sample(intervalMs: number, workMs: number): boolean {
      if (!Number.isFinite(intervalMs) || !Number.isFinite(workMs)) return false;
      intervalTotal += intervalMs;
      workTotal += workMs;
      if (++frames < 30) return false;
      const interval = intervalTotal / frames;
      const work = workTotal / frames;
      frames = 0;
      intervalTotal = 0;
      workTotal = 0;
      const previous = density;
      if (work > 14 || (interval > 19 && work > 8)) density = Math.max(0.3, density - 0.1);
      else if (interval < 17.5 && work < 11) density = Math.min(1, density + 0.05);
      return density !== previous;
    },
  };
}

export function scaledCount(count: number, density = 1): number {
  return Math.max(1, Math.round(count * density));
}
export function preferredDensity(
  quality: 'auto' | 'low' | 'high',
  adaptive: number,
  reducedMotion = false,
): number {
  const density = quality === 'low' ? 0.3 : quality === 'high' ? 1 : adaptive;
  return reducedMotion ? Math.min(0.3, density) : density;
}

/** Session lighting tools override a caller's quality choice without changing saved settings. */
export function preferredLightResolution(mode: unknown, authored: 1 | 0.5 = 1): 1 | 0.5 {
  return mode === 'half' ? 0.5 : mode === 'full' ? 1 : authored;
}
