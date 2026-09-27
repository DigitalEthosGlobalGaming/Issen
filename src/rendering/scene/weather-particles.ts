import { TAU } from '../../shared/math.ts';
import type { Random } from '../../shared/random.ts';
import type { Weather } from '../../game/content/stages.ts';
import type { WeatherParticle, Bamboo } from './weather-state.ts';
function particle(
  values: Pick<WeatherParticle, 'x' | 'y' | 'z'> & Partial<WeatherParticle>,
): WeatherParticle {
  return { l: 0, ph: 0, rot: 0, vr: 0, fl: 0, ...values };
}
export function createWeatherParticles(
  w: Weather,
  W: number,
  H: number,
  S: number,
  R: Random = Math.random,
) {
  const wx: WeatherParticle[] = [],
    bamboo: Bamboo[] = [];
  if (w === 'rain' || w === 'storm') {
    const n = Math.round((W * H) / (w === 'storm' ? 1600 : 2000));
    for (let i = 0; i < n; i++)
      wx.push(particle({ x: R() * W, y: R() * H, z: 0.5 + R(), l: (10 + R() * 18) * S }));
  }
  if (w === 'snow') {
    const n = Math.round((W * H) / 4500);
    for (let i = 0; i < n; i++)
      wx.push(particle({ x: R() * W, y: R() * H, z: 0.4 + R() * 1.4, ph: R() * TAU }));
  }
  if (w === 'sakura') {
    const n = Math.round((W * H) / 9000);
    for (let i = 0; i < n; i++)
      wx.push(
        particle({
          x: R() * W,
          y: R() * H,
          z: 0.5 + R() * 1.2,
          rot: R() * TAU,
          vr: (R() - 0.5) * 4,
          fl: R() * TAU,
          ph: R() * TAU,
        }),
      );
  }
  if (w === 'smoke') {
    const n = Math.round((W * H) / 7000);
    for (let i = 0; i < n; i++)
      wx.push(particle({ x: R() * W, y: R() * H, z: 0.4 + R(), ph: R() * TAU }));
  }
  if (w === 'bamboo')
    for (let i = 0; i < 3; i++)
      bamboo.push({
        x0: W * (0.24 + i * 0.28 + R() * 0.08),
        w: (9 + R() * 8) * S,
        ph: R() * TAU,
        amp: W * (0.05 + R() * 0.04),
        sp: 0.45 + R() * 0.4,
      });
  return { particles: wx, bamboo };
}
