import { createLeafMotion } from '../rendering/scene/leaf-motion.ts';
import { createWeatherState } from '../rendering/scene/weather-state.ts';
import type { GrassBlade, Leaf } from '../rendering/scene/ambient.ts';
import type { WeatherParticle, Bamboo } from '../rendering/scene/weather-state.ts';

export interface Mist {
  x: number;
  y: number;
  w: number;
  h: number;
  a: number;
  v: number;
}

/** Cached scenery and cosmetic particles; live weather hazard timers stay gameplay-owned. */
export function createEnvironmentState() {
  return {
    bg: null as HTMLCanvasElement | null,
    prevBg: null as HTMLCanvasElement | null,
    stageFade: 0,
    mistSprite: null as HTMLCanvasElement | null,
    mists: [] as Mist[],
    fg: [] as GrassBlade[],
    mid: [] as GrassBlade[],
    leaves: [] as Leaf[],
    leafMotion: createLeafMotion(),
    wx: [] as WeatherParticle[],
    cinematicWeather: createWeatherState(() => 0.5),
    previewDemon: false,
    bamboo: [] as Bamboo[],
    smokeSprite: null as HTMLCanvasElement | null,
    weatherDensity: 1,
  };
}
export type EnvironmentState = ReturnType<typeof createEnvironmentState>;
