import type { Random } from '../../shared/random.ts';
export interface WeatherParticle {
  x: number;
  y: number;
  z: number;
  l: number;
  ph: number;
  rot: number;
  vr: number;
  fl: number;
}
export interface Bamboo {
  x0: number;
  w: number;
  ph: number;
  amp: number;
  sp: number;
}
export interface SmokePuff {
  dx: number;
  dy: number;
  s: number;
  a: number;
}
export interface WeatherState {
  veil: number;
  veilT: number;
  veilTarget: number;
  wo: number;
  woT: number;
  woPhase: number;
  ltT: number;
  gustT: number;
  smokeT: number;
  surge: number;
  surgeT: number;
  banks: { x: number; y: number; v: number; puffs: SmokePuff[] }[];
}
export function createWeatherState(random: Random = Math.random): WeatherState {
  return {
    veil: 0,
    veilT: 2,
    veilTarget: 0,
    wo: 0,
    woT: 5 + random() * 3,
    woPhase: 0,
    ltT: 4 + random() * 3,
    gustT: 4 + random() * 3,
    smokeT: 3 + random() * 3,
    banks: [],
    surge: 0,
    surgeT: 4 + random() * 3,
  };
}
