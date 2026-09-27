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
}
export function createWeatherRenderer(g: CanvasRenderingContext2D, env: WeatherDrawing) {
  const {
    weather,
    width: W,
    height: H,
    scale: S,
    time,
    wind,
    hazard,
    particles: wx,
    bamboo,
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
      for (const p of wx) {
        g.fillStyle = `rgba(255,226,196,${0.35 + 0.35 * Math.sin(time * 6 + p.ph)})`;
        g.fillRect(p.x, p.y, p.z * 2 * S, p.z * 2 * S);
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
  function drawBamboo() {
    if (!bamboo.length) return;
    g.save();
    g.globalAlpha = Math.min(1, 0.95 * hazard + 0.05);
    for (const t of bamboo) {
      const off = Math.sin(time * t.sp + t.ph) * t.amp * (0.6 + wind * 0.3),
        xb = t.x0 + off * 0.3,
        xt = t.x0 + off;
      const gr = g.createLinearGradient(xb - t.w, 0, xb + t.w, 0);
      gr.addColorStop(0, '#0f100e');
      gr.addColorStop(0.6, '#262922');
      gr.addColorStop(1, '#3a3e36');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(xb - t.w / 2, H + 10);
      g.lineTo(xt - t.w / 2, -10);
      g.lineTo(xt + t.w / 2, -10);
      g.lineTo(xb + t.w / 2, H + 10);
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(120,126,112,.5)';
      g.lineWidth = Math.max(1.5, t.w * 0.18);
      for (let y = H * 0.1; y < H; y += H * 0.16) {
        const x = lerp(xb, xt, 1 - y / H);
        g.beginPath();
        g.moveTo(x - t.w / 2, y);
        g.lineTo(x + t.w / 2, y);
        g.stroke();
      }
    }
    g.restore();
  }

  return { drawWeather, drawSmoke, drawBamboo };
}
