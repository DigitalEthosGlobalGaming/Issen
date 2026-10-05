import type { SceneDrawing } from '../scene-drawing.ts';
import { TAU, clamp, lerp } from '../../shared/math.ts';
import type { Weather } from '../../game/content/stages.ts';
import type { WeatherState, WeatherParticle, Bamboo } from './weather-state.ts';
export interface WeatherDrawing {
  weather: Weather;
  width: number;
  height: number;
  scale: number;
  time: number;
  wind: number;
  hazard: number;
  particles: readonly WeatherParticle[];
  bamboo: readonly Bamboo[];
  state: WeatherState;
  smokeSprite: CanvasImageSource | null;
  drawEmber?: (g: SceneDrawing, p: WeatherParticle, index: number, scale: number) => void;
}
export function createWeatherRenderer(g: SceneDrawing, env: WeatherDrawing) {
  const {
    weather,
    width: W,
    height: H,
    scale: S,
    time,
    wind,
    hazard,
    particles: wx,
    state: WX,
    smokeSprite,
  } = env;
  function drawWeather() {
    const w = weather,
      hz = hazard;
    if (w === 'rain' || w === 'storm') {
      const sl = w === 'storm' ? 2.4 : 1;
      g.strokeStyle = `rgba(214,212,205,${0.2 + WX.veil * 0.25})`;
      g.lineWidth = Math.max(1, S);
      g.beginPath();
      for (const p of wx) {
        g.moveTo(p.x, p.y);
        g.lineTo(p.x - p.l * 0.22 * sl, p.y - p.l * p.z);
      }
      g.stroke();
      if (WX.veil > 0.01) {
        g.fillStyle = `rgba(168,166,160,${WX.veil * 0.22 * hz})`;
        g.fillRect(-30, -30, W + 60, H + 60);
      }
      if (WX.surge > 0) {
        g.fillStyle = `rgba(0,0,0,${0.16 * clamp(WX.surge) * hz})`;
        g.fillRect(-30, -30, W + 60, H + 60);
      }
    }
    if (w === 'snow') {
      g.fillStyle = 'rgba(244,242,236,.85)';
      g.beginPath();
      for (const p of wx) {
        g.moveTo(p.x + p.z * 1.5 * S, p.y);
        g.arc(p.x, p.y, p.z * 1.5 * S, 0, TAU);
      }
      g.fill();
      if (WX.wo > 0.01) {
        g.fillStyle = `rgba(238,236,230,${WX.wo * hz})`;
        g.fillRect(-30, -30, W + 60, H + 60);
      }
    }
    if (w === 'sakura') {
      g.fillStyle = 'rgba(238,222,224,.88)';
      for (const p of wx) {
        g.save();
        g.translate(p.x, p.y);
        g.rotate(p.rot);
        g.scale(1, Math.cos(p.fl));
        g.beginPath();
        g.ellipse(0, 0, p.z * 3 * S, p.z * 1.8 * S, 0, 0, TAU);
        g.fill();
        g.restore();
      }
    }
    if (w === 'smoke') {
      g.save();
      g.globalCompositeOperation = 'lighter';
      for (let index = 0; index < wx.length; index++) {
        const p = wx[index]!;
        if (env.drawEmber) env.drawEmber(g, p, index, S);
        else {
          g.fillStyle = `rgba(255,226,196,${0.35 + 0.35 * Math.sin(time * 6 + p.ph)})`;
          g.fillRect(p.x, p.y, p.z * 2 * S, p.z * 2 * S);
        }
      }
      g.restore();
    }
  }
  function drawSmoke() {
    if (!WX.banks || !WX.banks.length || !smokeSprite) return;
    const a = 0.85 * hazard;
    for (const bk of WX.banks)
      for (const p of bk.puffs) {
        g.globalAlpha = a * p.a;
        g.drawImage(smokeSprite, bk.x + p.dx - p.s, bk.y + p.dy - p.s * 0.6, p.s * 2, p.s * 1.2);
      }
    g.globalAlpha = 1;
  }
  return { drawWeather, drawSmoke };
}
