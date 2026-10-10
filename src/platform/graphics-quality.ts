import {
  graphicsFrameRate,
  resolveGraphics,
  type GraphicsDevice,
  type GraphicsSettings,
} from './graphics-settings.ts';

export type GraphicsReduction =
  | { key: 'frameRate'; previous: 120 }
  | { key: 'lighting'; previous: 'full' }
  | { key: 'resolution'; previous: number }
  | { key: 'particles'; previous: 'high' | 'medium' }
  | { key: 'grass'; previous: 'high' | 'medium' };

/** Owned runtime choices. Samples never modify the saved record. */
export function createGraphicsQuality(
  readChoices: () => GraphicsSettings,
  device: GraphicsDevice,
  supports120: () => boolean,
) {
  let saved: GraphicsSettings | undefined;
  let supported = false;
  let effective = resolveGraphics(readChoices(), device);
  const reductions: GraphicsReduction[] = [];
  const listeners = new Set<() => void>();
  let elapsed = 0,
    frames = 0,
    slowWindows = 0,
    fastWindows = 0,
    sinceChange = 0;
  function suspend() {
    elapsed = frames = slowWindows = fastWindows = 0;
  }
  function sync() {
    const choices = readChoices(),
      highRefresh = supports120();
    let changed = !saved || supported !== highRefresh;
    if (!changed)
      for (const key in choices)
        if (choices[key as keyof GraphicsSettings] !== saved![key as keyof GraphicsSettings]) {
          changed = true;
          break;
        }
    if (!changed) return;
    saved = { ...choices };
    supported = highRefresh;
    effective = resolveGraphics(choices, device);
    effective.frameRate = graphicsFrameRate(choices, device, highRefresh);
    reductions.length = 0;
    sinceChange = 0;
    suspend();
  }
  function reduce(): boolean {
    if (effective.frameRate === 120) {
      reductions.push({ key: 'frameRate', previous: 120 });
      effective.frameRate = 60;
    } else if (effective.lighting === 'full') {
      reductions.push({ key: 'lighting', previous: 'full' });
      effective.lighting = 'half';
    } else if (effective.resolution > 50) {
      reductions.push({ key: 'resolution', previous: effective.resolution });
      effective.resolution = Math.max(50, effective.resolution - 10);
    } else if (effective.particles === 'high' || effective.particles === 'medium') {
      reductions.push({ key: 'particles', previous: effective.particles });
      effective.particles = effective.particles === 'high' ? 'medium' : 'low';
    } else if (effective.grass === 'high' || effective.grass === 'medium') {
      reductions.push({ key: 'grass', previous: effective.grass });
      effective.grass = effective.grass === 'high' ? 'medium' : 'low';
    } else return false;
    return true;
  }
  function restore(): boolean {
    const reduction = reductions.pop();
    if (!reduction) return false;
    switch (reduction.key) {
      case 'frameRate':
        effective.frameRate = reduction.previous;
        break;
      case 'lighting':
        effective.lighting = reduction.previous;
        break;
      case 'resolution':
        effective.resolution = reduction.previous;
        break;
      case 'particles':
        effective.particles = reduction.previous;
        break;
      case 'grass':
        effective.grass = reduction.previous;
        break;
    }
    return true;
  }
  return {
    get effective(): Readonly<GraphicsSettings> {
      sync();
      return effective;
    },
    get reductions(): readonly GraphicsReduction[] {
      sync();
      return reductions;
    },
    suspend,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    sample(intervalMs: number): boolean {
      sync();
      if (
        !effective.adaptive ||
        !Number.isFinite(intervalMs) ||
        intervalMs <= 0 ||
        intervalMs > 1000
      ) {
        suspend();
        return false;
      }
      elapsed += intervalMs;
      sinceChange += intervalMs;
      frames++;
      if (elapsed < 1000 || frames < 12) return false;
      const mean = elapsed / frames,
        budget = 1000 / effective.frameRate;
      elapsed = frames = 0;
      if (mean > budget * 1.18) {
        slowWindows++;
        fastWindows = 0;
      } else if (mean <= budget * 1.06) {
        fastWindows++;
        slowWindows = 0;
      } else slowWindows = fastWindows = 0;
      // Two slow one-second windows to reduce; ten seconds of stable cadence
      // between recovery probes. A failed probe cannot immediately oscillate up.
      const changed =
        slowWindows >= 2 ? reduce() : fastWindows >= 8 && sinceChange >= 10_000 ? restore() : false;
      if (changed) {
        sinceChange = 0;
        suspend();
        for (const listener of listeners) listener();
      }
      return changed;
    },
  };
}
