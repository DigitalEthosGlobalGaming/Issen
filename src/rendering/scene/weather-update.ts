import { easeOut } from '../../shared/math.ts';
import type { Random } from '../../shared/random.ts';
import type { Weather } from '../../game/content/stages.ts';
import type { WeatherState, WeatherParticle } from './weather-state.ts';
export interface WeatherEnvironment {
  weather: Weather;
  phase: string;
  width: number;
  height: number;
  scale: number;
  wind: number;
  time: number;
  hazard: number;
  layout: { eH: number; groundY: number };
  random: Random;
  flash: (amount: number, color: string) => void;
  sounds: { thunder: () => void; gust: () => void };
  gustLeaves: (count: number) => void;
  onShake: (amount: number) => void;
}
export function updateWeather(
  WX: WeatherState,
  wx: WeatherParticle[],
  dt: number,
  env: WeatherEnvironment,
) {
  const {
    weather: w,
    phase,
    width: W,
    height: H,
    scale: S,
    wind,
    time,
    hazard,
    layout: L,
    random: R,
    flash,
    sounds: sfx,
    gustLeaves,
    onShake,
  } = env;
  const active = phase === 'playing';
  if (w === 'rain' || w === 'storm') {
    const sl = w === 'storm' ? 2.4 : 1;
    for (const p of wx) {
      p.y += 900 * p.z * S * dt;
      p.x += (60 + wind * 70) * p.z * S * dt * sl;
      if (p.y > H + 20) {
        p.y = -20 - R() * 40;
        p.x = R() * W * 1.3 - W * 0.3;
      }
      if (p.x > W + 20) p.x -= W + 40;
    }
    if (w === 'rain') {
      WX.veilT -= dt;
      if (WX.veilT <= 0) {
        WX.veilT = 1.2 + R() * 2.2;
        WX.veilTarget = active && R() < 0.55 ? 0.8 : 0;
      }
    }
    if (active) {
      WX.ltT -= dt;
      if (WX.ltT <= 0) {
        WX.ltT = 5 + R() * 7;
        flash(0.55, '232,232,238');
        sfx.thunder();
      }
    }
    if (w === 'storm') {
      if (active) {
        WX.surgeT -= dt;
        if (WX.surgeT <= 0) {
          WX.surgeT = 6 + R() * 4;
          WX.surge = 2.2;
          sfx.gust();
        }
      }
      WX.surge = Math.max(0, WX.surge - dt);
      if (WX.surge > 0) onShake(2.5 * S * hazard);
    }
  }
  if (w === 'snow') {
    for (const p of wx) {
      p.y += (28 + p.z * 36) * S * dt;
      p.x += (Math.sin(time * 0.8 + p.ph) * 14 + wind * 26 * p.z) * S * dt;
      if (p.y > H + 10) {
        p.y = -10;
        p.x = R() * W;
      }
      if (p.x > W + 10) p.x = -10;
    }
    if (active) {
      WX.woT -= dt;
      if (WX.woT <= 0 && WX.woPhase === 0) {
        WX.woT = 7 + R() * 5;
        WX.woPhase = 0.001;
        sfx.gust();
      }
    }
    if (WX.woPhase > 0) {
      WX.woPhase += dt;
      const t = WX.woPhase;
      WX.wo =
        t < 0.8
          ? 0.72 * easeOut(t / 0.8)
          : t < 1.5
            ? 0.72
            : t < 2.4
              ? 0.72 * (1 - (t - 1.5) / 0.9)
              : 0;
      if (t >= 2.4) WX.woPhase = 0;
    }
  }
  if (w === 'sakura') {
    for (const p of wx) {
      p.y += (22 + p.z * 26) * S * dt;
      p.x += (Math.sin(time * 0.9 + p.ph) * 18 + wind * 34 * p.z) * S * dt;
      p.rot += p.vr * dt;
      p.fl += dt * 3;
      if (p.y > H + 10) {
        p.y = -10;
        p.x = R() * W;
      }
      if (p.x > W + 10) p.x = -10;
    }
  }
  if (w === 'smoke') {
    for (const p of wx) {
      p.y -= (26 + p.z * 50) * S * dt;
      p.x += (Math.sin(time * 1.3 + p.ph) * 20 + wind * 18) * S * dt;
      if (p.y < -10) {
        p.y = H + 10;
        p.x = R() * W;
      }
      if (p.x > W + 10) p.x = -10;
    }
    if (active) {
      WX.smokeT -= dt;
      if (WX.smokeT <= 0) {
        WX.smokeT = 5 + R() * 3;
        const h = L.eH * 1.5,
          puffs = [];
        for (let i = 0; i < 9; i++)
          puffs.push({
            dx: R() * W * 0.9,
            dy: (R() - 0.5) * h * 0.5,
            s: h * (0.55 + R() * 0.35),
            a: 0.6 + R() * 0.4,
          });
        WX.banks.push({
          x: -W * 1.0,
          y: L.groundY - L.eH * 0.55,
          v: W * (0.32 + R() * 0.1),
          puffs,
        });
      }
    }
    for (const bk of WX.banks) bk.x += bk.v * dt;
    WX.banks = WX.banks.filter((bk) => bk.x < W * 1.1);
  }
  if (w === 'gust' && active) {
    WX.gustT -= dt;
    if (WX.gustT <= 0) {
      WX.gustT = 6 + R() * 4;
      gustLeaves(Math.round(70 * hazard));
      sfx.gust();
    }
  }
  if (!active) {
    WX.veilTarget = 0;
    if (WX.woPhase > 0 && phase !== 'between') {
      WX.woPhase = 0;
    }
    if (WX.woPhase === 0) WX.wo = Math.max(0, WX.wo - dt * 1.5);
  }
  WX.veil += (WX.veilTarget - WX.veil) * (1 - Math.exp(-dt * 5));
}
