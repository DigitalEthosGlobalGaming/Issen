export type GraphicsPreset = 'auto' | 'low' | 'balanced' | 'high' | 'custom';
export type DensityLevel = 'low' | 'medium' | 'high';
export interface GraphicsSettings {
  preset: GraphicsPreset;
  frameRate: 30 | 60 | 120;
  resolution: number;
  lighting: 'off' | 'half' | 'full';
  antialias: boolean;
  particles: 'off' | DensityLevel;
  grass: DensityLevel;
  weather: 'reduced' | 'full';
  scenery: 'low' | 'normal' | 'high';
  adaptive: boolean;
  preload: boolean;
  memory: 'low' | 'normal' | 'high';
  fpsCounter: boolean;
}
export interface GraphicsDevice {
  mobile: boolean;
  memory?: number;
}
export function graphicsDevice(win: Window): GraphicsDevice {
  return {
    mobile: win.navigator.maxTouchPoints > 0 && win.matchMedia('(pointer: coarse)').matches,
    memory: (win.navigator as Navigator & { deviceMemory?: number }).deviceMemory,
  };
}
export function graphicsParticleDensity(
  settings: GraphicsSettings,
  device: GraphicsDevice,
): number {
  return particleDensity(
    settings.preset === 'auto'
      ? recommendedGraphics(device) === 'high'
        ? 'high'
        : 'medium'
      : settings.particles,
  );
}
export function recommendedGraphics(device: GraphicsDevice): 'balanced' | 'high' {
  return device.mobile || (device.memory !== undefined && device.memory <= 4) ? 'balanced' : 'high';
}
/** Fresh records: adaptive/runtime changes must never mutate a preset or save. */
export function graphicsPreset(
  preset: Exclude<GraphicsPreset, 'custom'> = 'auto',
  device: GraphicsDevice = { mobile: true },
): GraphicsSettings {
  const choice = preset === 'auto' ? recommendedGraphics(device) : preset;
  const low = choice === 'low',
    high = choice === 'high';
  return {
    preset,
    frameRate: high ? 120 : 60,
    resolution: low ? 60 : high ? 100 : 75,
    lighting: high ? 'full' : 'half',
    antialias: high,
    particles: low ? 'low' : high ? 'high' : 'medium',
    grass: low ? 'low' : high ? 'high' : 'medium',
    weather: low ? 'reduced' : 'full',
    scenery: low ? 'low' : high ? 'high' : 'normal',
    adaptive: true,
    preload: !low,
    memory: low ? 'low' : high ? 'high' : 'normal',
    fpsCounter: false,
  };
}
export function resolveGraphics(
  settings: GraphicsSettings,
  device: GraphicsDevice,
): GraphicsSettings {
  return settings.preset === 'auto' ? graphicsPreset('auto', device) : { ...settings };
}
export function setGraphicsOption<K extends Exclude<keyof GraphicsSettings, 'preset'>>(
  settings: GraphicsSettings,
  key: K,
  value: GraphicsSettings[K],
) {
  settings[key] = value;
  settings.preset = 'custom';
}
export function particleDensity(level: GraphicsSettings['particles']): number {
  return level === 'off' ? 0 : level === 'low' ? 0.3 : level === 'medium' ? 0.6 : 1;
}
/** Validate persisted values independently; never pass malformed limits to renderers. */
export function parseGraphics(raw: unknown): GraphicsSettings {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return graphicsPreset();
  const value = raw as Record<string, unknown>;
  const choice = <T extends string | number>(key: string, values: readonly T[], fallback: T): T =>
    values.includes(value[key] as T) ? (value[key] as T) : fallback;
  const preset = choice('preset', ['auto', 'low', 'balanced', 'high', 'custom'] as const, 'auto');
  const defaults = graphicsPreset(preset === 'custom' ? 'balanced' : preset);
  if (preset !== 'custom') return defaults;
  const boolean = (key: keyof GraphicsSettings) =>
    typeof value[key] === 'boolean' ? (value[key] as boolean) : (defaults[key] as boolean);
  return {
    preset,
    frameRate: choice('frameRate', [30, 60, 120] as const, defaults.frameRate),
    resolution:
      typeof value.resolution === 'number' && Number.isFinite(value.resolution)
        ? Math.max(50, Math.min(100, value.resolution))
        : defaults.resolution,
    lighting: choice('lighting', ['off', 'half', 'full'] as const, defaults.lighting),
    antialias: boolean('antialias'),
    particles: choice('particles', ['off', 'low', 'medium', 'high'] as const, defaults.particles),
    grass: choice('grass', ['low', 'medium', 'high'] as const, defaults.grass),
    weather: choice('weather', ['reduced', 'full'] as const, defaults.weather),
    scenery: choice('scenery', ['low', 'normal', 'high'] as const, defaults.scenery),
    adaptive: boolean('adaptive'),
    preload: boolean('preload'),
    memory: choice('memory', ['low', 'normal', 'high'] as const, defaults.memory),
    fpsCounter: boolean('fpsCounter'),
  };
}
export function migrateGraphics(quality: unknown, debrisStyle: unknown): GraphicsSettings {
  const preset = quality === 'low' || quality === 'high' ? quality : 'auto';
  const graphics = graphicsPreset(preset);
  // Former sprite/art styles share one renderer. Explicit density choices survive.
  if (['off', 'low', 'medium', 'high'].includes(String(debrisStyle)))
    setGraphicsOption(graphics, 'particles', debrisStyle as GraphicsSettings['particles']);
  return graphics;
}
