import { supportsInkOutfit } from './outfit-kit.ts';
import { drawJinbaori } from './jinbaori.ts';
import { drawDemonMask } from './masks.ts';
import { TAU, clamp, easeOut } from '../../shared/math.ts';
import type { Palette } from '../palette.ts';
import type {
  Figure,
  FigureSeed,
  FigureEnvironment,
  Pose,
  Point,
  BladeStyle,
  Aura,
} from './types.ts';
export function createFigureRenderer(g: CanvasRenderingContext2D, env: FigureEnvironment) {
  const { time: clock, wind, petActive, width: W, height: H, palette: cols, random: R } = env;
  const time = env.reducedMotion ? 0 : clock;
  function drawThirdLightning(length: number) {
    const pulse = env.reducedFlashes ? 0 : Math.floor(time * 18);
    const arcs = (env.effectDensity ?? 1) < 0.55 ? 1 : 2;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    for (let arc = 0; arc < arcs; arc++) {
      g.beginPath();
      for (let i = 0; i <= 12; i++) {
        const x = 0.025 + (length - 0.045) * (i / 12);
        const jitter =
          i === 0 || i === 12 ? 0 : Math.sin(i * 23.7 + pulse * 7.13 + arc * 19) * 0.019;
        const y = -length * 0.038 * (x / length) + jitter + (arc ? 0.014 : -0.008);
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.strokeStyle = 'rgba(24,172,255,.48)';
      g.lineWidth = 0.042;
      g.stroke();
      g.strokeStyle = 'rgba(239,253,255,.96)';
      g.lineWidth = 0.008;
      g.stroke();
      const head = env.reducedFlashes ? 0.5 : (time * 1.1 + arc * 0.47) % 1;
      g.beginPath();
      for (let i = 0; i <= 4; i++) {
        const u = Math.max(0, head - 0.2 + (i / 4) * 0.2);
        const x = 0.025 + (length - 0.045) * u;
        const y =
          -length * 0.038 * (x / length) + Math.sin(u * 36 + pulse * 7.13 + arc * 19) * 0.014;
        if (i) g.lineTo(x, y);
        else g.moveTo(x, y);
      }
      g.strokeStyle = 'rgba(20,182,255,.72)';
      g.lineWidth = 0.055;
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.98)';
      g.lineWidth = 0.011;
      g.stroke();
    }
  }
  function drawSleeve(s: number, lx: number, C: Palette, d: FigureSeed, t: number, wv: number) {
    g.fillStyle = s < 0 ? C.robeD : C.robe;
    g.beginPath();
    g.moveTo(s * 0.13 + lx, -0.78);
    g.quadraticCurveTo(s * 0.27 + lx, -0.75, s * 0.26 + lx * 0.8, -0.64);
    const n = d.sl[s < 0 ? 0 : 1];
    for (let i = 0; i < 5; i++) {
      const k = i / 4;
      g.lineTo(
        s * (0.26 - 0.12 * k) + lx * 0.7 + (i % 2 ? s * 0.015 : 0),
        -0.56 + n[i]! * 0.05 + Math.sin(t * 6 + i + d.seed) * 0.005 * wv,
      );
    }
    g.lineTo(s * 0.12 + lx * 0.6, -0.6);
    g.closePath();
    g.fill();
  }
  function drawSword(
    gx: number,
    gy: number,
    ang: number,
    C: Palette,
    bs?: BladeStyle | null,
    ink = false,
  ) {
    const Lb = bs ? bs.len : 0.52;
    g.save();
    g.translate(gx, gy);
    g.rotate(ang);
    if (bs && bs.kind === 'beam') {
      const c = bs.c || '120,190,255';
      g.fillStyle = '#8f8d88';
      g.fillRect(-0.16, -0.014, 0.17, 0.028);
      g.fillStyle = '#2a2826';
      for (let i = 0; i < 4; i++) g.fillRect(-0.15 + i * 0.035, -0.015, 0.012, 0.03);
      g.fillStyle = '#d8d5ce';
      g.fillRect(-0.005, -0.017, 0.015, 0.034);
      g.save();
      g.globalCompositeOperation = 'lighter';
      g.lineCap = 'round';
      const fl = 0.85 + 0.15 * Math.sin(time * 50);
      g.strokeStyle = `rgba(${c},${0.22 * fl})`;
      g.lineWidth = 0.085;
      g.beginPath();
      g.moveTo(0.02, 0);
      g.lineTo(Lb, 0);
      g.stroke();
      g.strokeStyle = `rgba(${c},${0.6 * fl})`;
      g.lineWidth = 0.036;
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,.95)';
      g.lineWidth = 0.014;
      g.stroke();
      g.restore();
      g.restore();
      return;
    }
    if (bs && bs.kind === 'pan') {
      const gold = bs.gold;
      g.strokeStyle = '#3a2a1e';
      g.lineWidth = 0.03;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-0.14, 0);
      g.lineTo(0.2, 0);
      g.stroke();
      const gr = g.createRadialGradient(0.33, -0.02, 0.01, 0.33, 0, 0.15);
      gr.addColorStop(0, gold ? '#f0d48a' : '#4a4744');
      gr.addColorStop(1, gold ? '#8a6a20' : '#141312');
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(0.33, 0, 0.14, 0.12, 0, 0, TAU);
      g.fill();
      g.strokeStyle = gold ? '#fff1c0' : 'rgba(200,200,200,.6)';
      g.lineWidth = 0.008;
      g.beginPath();
      g.ellipse(0.33, 0, 0.14, 0.12, 0, -2.2, -0.6);
      g.stroke();
      if (bs.aura) drawAura(Lb, bs.aura);
      g.restore();
      return;
    }
    const inkBlade = ink && env.inkSword?.draw(g, 0, 0, 0, C, bs) === true;
    if (!inkBlade) {
      g.fillStyle = C.hilt;
      g.fillRect(-0.15, -0.012, 0.155, 0.024);
      g.fillStyle = C.robeL;
      for (let i = 0; i < 5; i++) g.fillRect(-0.14 + i * 0.028, -0.009, 0.008, 0.018);
      g.fillStyle = C.tsuba;
      g.beginPath();
      g.ellipse(0.008, 0, 0.009, 0.03, 0, 0, TAU);
      g.fill();
    }
    if (bs && bs.glow) {
      g.strokeStyle = bs.glow;
      g.lineWidth = 0.04;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(0.03, -0.003);
      g.quadraticCurveTo(Lb * 0.6, -0.006 - Lb * 0.045, Lb * 0.98, -Lb * 0.05);
      g.stroke();
    }
    if (bs && bs.aura && bs.aura.mode === 'after') {
      for (let i = 1; i <= 2; i++) {
        g.save();
        g.rotate(-i * 0.11 - Math.sin(time * 3) * 0.03);
        g.globalAlpha *= 0.3 / i;
        g.fillStyle = `rgb(${bs.aura.c})`;
        g.beginPath();
        g.moveTo(0.016, -0.009);
        g.quadraticCurveTo(Lb * 0.6, -0.012 - Lb * 0.05, Lb, -Lb * 0.05);
        g.quadraticCurveTo(Lb * 0.6, 0.006 - Lb * 0.035, 0.016, 0.008);
        g.closePath();
        g.fill();
        g.restore();
      }
    }
    if (!inkBlade) {
      if (bs && bs.alpha) g.globalAlpha *= bs.alpha;
      const gr = g.createLinearGradient(0, -0.012, 0, 0.01);
      gr.addColorStop(0, bs?.d ?? C.steelD);
      gr.addColorStop(0.45, bs?.l ?? C.steelL);
      gr.addColorStop(1, bs?.m ?? C.steel);
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(0.016, -0.009);
      g.quadraticCurveTo(Lb * 0.6, -0.012 - Lb * 0.05, Lb, -Lb * 0.05);
      g.quadraticCurveTo(Lb * 0.6, 0.006 - Lb * 0.035, 0.016, 0.008);
      g.closePath();
      g.fill();
      g.strokeStyle = bs?.edge ?? 'rgba(255,253,246,.85)';
      g.lineWidth = (bs && bs.edgeW) || 0.004;
      g.beginPath();
      g.moveTo(0.03, -0.002);
      g.quadraticCurveTo(Lb * 0.6, -0.004 - Lb * 0.043, Lb * 0.97, -Lb * 0.049);
      g.stroke();
    }
    if (bs && bs.aura) drawAura(Lb, bs.aura);
    g.restore();
  }
  function drawAura(Lb: number, a: Aura) {
    const t = time,
      c = a.c;
    g.save();
    g.globalAlpha = 1;
    if (a.mode === 'dark') {
      for (let i = 0; i < 7; i++) {
        const k = (t * 0.5 + i / 7) % 1,
          x = Lb * (0.1 + 0.85 * ((i * 0.41) % 1)),
          y = -0.02 - k * 0.1;
        g.fillStyle = `rgba(${c},${0.55 * (1 - k)})`;
        g.beginPath();
        g.ellipse(x, y, 0.035 * (0.6 + k), 0.02 * (0.6 + k), 0, 0, TAU);
        g.fill();
      }
      g.strokeStyle = `rgba(${c},.45)`;
      g.lineWidth = 0.05;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(0.03, -0.003);
      g.quadraticCurveTo(Lb * 0.6, -0.006 - Lb * 0.045, Lb * 0.98, -Lb * 0.05);
      g.stroke();
    } else {
      g.globalCompositeOperation = 'lighter';
      const pul = 0.55 + 0.25 * Math.sin(t * 6);
      g.lineCap = 'round';
      g.strokeStyle = `rgba(${c},${0.25 * pul})`;
      g.lineWidth = 0.065;
      g.beginPath();
      g.moveTo(0.03, -0.003);
      g.quadraticCurveTo(Lb * 0.6, -0.006 - Lb * 0.045, Lb * 0.98, -Lb * 0.05);
      g.stroke();
      g.lineWidth = 0.025;
      g.strokeStyle = `rgba(${c},${0.5 * pul})`;
      g.stroke();
      if (a.mode === 'bolt') {
        g.strokeStyle = `rgba(${c},.95)`;
        g.lineWidth = 0.006;
        g.beginPath();
        let x = 0.03;
        g.moveTo(x, 0);
        while (x < Lb) {
          x += 0.04;
          g.lineTo(x, -Lb * 0.05 * (x / Lb) + (R() - 0.5) * 0.06);
        }
        g.stroke();
      }
      if (a.mode === 'third') drawThirdLightning(Lb);
      if (a.mode === 'frost' || a.mode === 'glow' || a.mode === 'third') {
        const count = a.mode === 'third' ? Math.round(12 * (env.effectDensity ?? 1)) : 6;
        for (let i = 0; i < count; i++) {
          const k = (t * (a.mode === 'third' ? 0.85 : 0.6) + i / count) % 1,
            x = Lb * ((i * 0.37 + 0.1) % 1),
            y = -Lb * 0.05 * (x / Lb) - 0.015 - k * (a.mode === 'third' ? 0.13 : 0.07);
          g.fillStyle = `rgba(${c},${0.85 * (1 - k)})`;
          g.beginPath();
          g.arc(x, y, a.mode === 'frost' ? 0.007 : a.mode === 'third' ? 0.011 : 0.009, 0, TAU);
          g.fill();
        }
      }
      if (a.mode === 'petal') {
        for (let i = 0; i < 6; i++) {
          const k = (t * 0.4 + i / 6) % 1,
            x = Lb * (0.15 + 0.85 * ((i * 0.37) % 1)),
            y = -0.02 - k * 0.13;
          g.fillStyle = `rgba(${c},${0.9 * (1 - k)})`;
          g.save();
          g.translate(x, y);
          g.rotate(t * 3 + i);
          g.beginPath();
          g.ellipse(0, 0, 0.015, 0.008, 0, 0, TAU);
          g.fill();
          g.restore();
        }
      }
    }
    g.restore();
  }
  function tipOf(p: Pose, lx: number, Lb = 0.52): Point {
    Lb = Lb || 0.52;
    const ca = Math.cos(p.ang),
      sa = Math.sin(p.ang);
    return [p.gx + lx + ca * Lb + sa * Lb * 0.05, p.gy + sa * Lb - ca * Lb * 0.05];
  }
  function drawGlint(x: number, y: number, k: number) {
    g.save();
    g.globalCompositeOperation = 'lighter';
    const s = k * (0.2 + (env.reducedFlashes ? 0 : 0.035 * Math.sin(time * 45)));
    const rg = g.createRadialGradient(x, y, 0, x, y, s);
    rg.addColorStop(0, 'rgba(255,255,250,.95)');
    rg.addColorStop(0.25, 'rgba(255,250,235,.45)');
    rg.addColorStop(1, 'rgba(255,250,235,0)');
    g.fillStyle = rg;
    g.beginPath();
    g.arc(x, y, s, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255,255,252,.95)';
    for (const [a, len] of [
      [0.25, s * 2.6],
      [0.25 + Math.PI / 2, s * 1.7],
    ] as const) {
      const c = Math.cos(a),
        n = Math.sin(a),
        w = s * 0.07;
      g.beginPath();
      g.moveTo(x + c * len, y + n * len);
      g.lineTo(x - n * w, y + c * w);
      g.lineTo(x - c * len, y - n * len);
      g.lineTo(x + n * w, y - c * w);
      g.closePath();
      g.fill();
    }
    g.restore();
  }
  const NOKNOT: Record<string, number> = {
    kasa: 1,
    kabuto: 1,
    monk: 1,
    jingasa: 1,
    shinobi: 1,
    komuso: 1,
    mane: 1,
    tanuki: 1,
  };
  function drawSpear(gx: number, gy: number, ang: number, C: Palette) {
    g.save();
    g.translate(gx, gy);
    g.rotate(ang);
    g.strokeStyle = C.hilt;
    g.lineWidth = 0.016;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-0.38, 0);
    g.lineTo(0.8, 0);
    g.stroke();
    g.fillStyle = C.tsuba;
    g.fillRect(0.78, -0.012, 0.03, 0.024);
    const gr = g.createLinearGradient(0, -0.015, 0, 0.015);
    gr.addColorStop(0, C.steelD);
    gr.addColorStop(0.5, C.steelL);
    gr.addColorStop(1, C.steel);
    g.fillStyle = gr;
    g.beginPath();
    g.moveTo(0.81, -0.014);
    g.quadraticCurveTo(0.9, -0.016, 0.98, 0);
    g.quadraticCurveTo(0.9, 0.016, 0.81, 0.014);
    g.closePath();
    g.fill();
    g.restore();
  }
  function drawHead(f: Figure, C: Palette, d: FigureSeed, lx: number) {
    const hx = lx * 1.05,
      hy = -0.885,
      v = f.variant ?? '',
      t = time;
    if (v === 'monk' || v === 'shinobi') {
      g.fillStyle = v === 'monk' ? C.inner : C.robe;
      g.beginPath();
      g.ellipse(hx, hy - 0.004, 0.064, 0.074, 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.moveTo(hx - 0.06, hy + 0.02);
      g.lineTo(hx - 0.1, -0.78);
      g.lineTo(hx + 0.1, -0.78);
      g.lineTo(hx + 0.06, hy + 0.02);
      g.closePath();
      g.fill();
    }
    if (v === 'kabuto') {
      g.fillStyle = C.metal;
      g.beginPath();
      g.moveTo(hx - 0.07, hy - 0.02);
      g.lineTo(hx - 0.135, hy + 0.055);
      g.lineTo(hx - 0.05, hy + 0.04);
      g.lineTo(hx + 0.05, hy + 0.04);
      g.lineTo(hx + 0.135, hy + 0.055);
      g.lineTo(hx + 0.07, hy - 0.02);
      g.closePath();
      g.fill();
    }
    g.fillStyle = v === 'shinobi' ? C.robe : C.skinD;
    g.fillRect(hx - 0.022, -0.86, 0.044, 0.045);
    if (f.back) {
      if (v !== 'monk' && v !== 'shinobi') {
        g.beginPath();
        g.ellipse(hx, hy + 0.03, 0.032, 0.03, 0, 0, TAU);
        g.fill();
        g.fillStyle = C.hair;
        g.beginPath();
        g.ellipse(hx, hy - 0.006, 0.05, 0.055, 0, 0, TAU);
        g.fill();
      }
    } else {
      const gr = g.createLinearGradient(hx - 0.05, 0, hx + 0.05, 0);
      gr.addColorStop(0, C.skinD);
      gr.addColorStop(1, C.skin);
      g.fillStyle = gr;
      g.beginPath();
      g.ellipse(hx, hy + 0.004, 0.043, 0.056, 0, 0, TAU);
      g.fill();
      g.fillStyle = v === 'monk' ? C.inner : v === 'shinobi' ? C.robe : C.hair;
      g.beginPath();
      g.ellipse(hx, hy - 0.008, 0.049, 0.05, 0, Math.PI, TAU);
      g.lineTo(hx + 0.048, hy + 0.012);
      g.lineTo(hx + 0.036, hy - 0.006);
      g.quadraticCurveTo(hx, hy - 0.034, hx - 0.036, hy - 0.006);
      g.lineTo(hx - 0.048, hy + 0.012);
      g.closePath();
      g.fill();
      g.fillStyle = 'rgba(0,0,0,.33)';
      g.fillRect(hx - 0.038, hy - 0.011, 0.076, 0.017);
      g.strokeStyle = C.hair;
      g.lineWidth = 0.007;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(hx - 0.031, hy - 0.007);
      g.lineTo(hx - 0.01, hy - 0.001);
      g.moveTo(hx + 0.01, hy - 0.001);
      g.lineTo(hx + 0.031, hy - 0.007);
      g.stroke();
      g.fillStyle = 'rgba(0,0,0,.3)';
      g.beginPath();
      g.ellipse(hx, hy + 0.034, 0.035, 0.024, 0, 0, Math.PI);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,.5)';
      g.lineWidth = 0.004;
      g.beginPath();
      g.moveTo(hx - 0.011, hy + 0.031);
      g.lineTo(hx + 0.011, hy + 0.032);
      g.stroke();
    }
    if (!NOKNOT[v]) {
      g.fillStyle = C.hair;
      g.beginPath();
      g.ellipse(hx + 0.003, hy - 0.066, 0.02, 0.015, 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.ellipse(hx + (f.back ? 0 : 0.012), hy - 0.08, 0.008, 0.014, 0.4, 0, TAU);
      g.fill();
    }
    g.strokeStyle = C.hair;
    g.lineWidth = 0.004;
    if (!NOKNOT[v])
      for (const q of d.hair) {
        const sw = Math.sin(t * 5 + q[0] * 9) * 0.012;
        g.beginPath();
        g.moveTo(hx - 0.025 + q[0] * 0.05, hy - 0.04);
        g.quadraticCurveTo(
          hx + 0.03 + wind * 0.015,
          hy - 0.055 + q[1] * 0.03,
          hx + 0.06 + wind * 0.03 + sw,
          hy - 0.02 + q[1] * 0.06,
        );
        g.stroke();
      }
    if (v === 'hair') {
      g.lineWidth = 0.013;
      for (let i = 0; i < 8; i++) {
        const o = i / 7,
          sw = Math.sin(t * 3 + i) * 0.02;
        g.beginPath();
        g.moveTo(hx - 0.045 + o * 0.09, hy - 0.035);
        g.quadraticCurveTo(
          hx + 0.06 + o * 0.05 + wind * 0.03,
          hy + 0.05,
          hx + 0.1 + o * 0.09 + wind * 0.07 + sw,
          hy + 0.15 + o * 0.06,
        );
        g.stroke();
      }
    }
    if (v === 'kasa') {
      g.fillStyle = 'rgba(0,0,0,.5)';
      g.beginPath();
      g.ellipse(hx, hy - 0.005, 0.046, 0.042, 0, 0, TAU);
      g.fill();
      const gr2 = g.createLinearGradient(hx - 0.17, 0, hx + 0.17, 0);
      gr2.addColorStop(0, C.robe);
      gr2.addColorStop(1, C.straw);
      g.fillStyle = gr2;
      g.beginPath();
      g.moveTo(hx - 0.18, hy - 0.005);
      g.lineTo(hx, hy - 0.12);
      g.lineTo(hx + 0.18, hy - 0.005);
      g.quadraticCurveTo(hx, hy + 0.022, hx - 0.18, hy - 0.005);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,.35)';
      g.lineWidth = 0.004;
      for (let i = -4; i <= 4; i++) {
        g.beginPath();
        g.moveTo(hx, hy - 0.118);
        g.lineTo(hx + i * 0.041, hy + 0.002);
        g.stroke();
      }
    }
    if (v === 'kabuto') {
      const gr3 = g.createLinearGradient(hx - 0.065, 0, hx + 0.065, 0);
      gr3.addColorStop(0, C.shadow);
      gr3.addColorStop(1, C.robeL);
      g.fillStyle = gr3;
      g.beginPath();
      g.ellipse(hx, hy - 0.02, 0.064, 0.062, 0, Math.PI, TAU);
      g.closePath();
      g.fill();
      g.fillStyle = C.steel;
      g.fillRect(hx - 0.066, hy - 0.024, 0.132, 0.008);
      g.beginPath();
      g.moveTo(hx, hy - 0.05);
      g.quadraticCurveTo(hx - 0.1, hy - 0.08, hx - 0.15, hy - 0.2);
      g.quadraticCurveTo(hx - 0.08, hy - 0.1, hx, hy - 0.076);
      g.quadraticCurveTo(hx + 0.08, hy - 0.1, hx + 0.15, hy - 0.2);
      g.quadraticCurveTo(hx + 0.1, hy - 0.08, hx, hy - 0.05);
      g.fill();
      if (!f.back) {
        g.fillStyle = C.metal;
        g.beginPath();
        g.ellipse(hx, hy + 0.026, 0.042, 0.032, 0, 0, Math.PI);
        g.fill();
      }
    }
    if (v === 'komuso') {
      g.fillStyle = C.straw;
      g.beginPath();
      g.moveTo(hx - 0.07, hy - 0.1);
      g.lineTo(hx + 0.07, hy - 0.1);
      g.quadraticCurveTo(hx + 0.085, hy, hx + 0.07, hy + 0.075);
      g.lineTo(hx - 0.07, hy + 0.075);
      g.quadraticCurveTo(hx - 0.085, hy, hx - 0.07, hy - 0.1);
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,.3)';
      g.lineWidth = 0.004;
      for (let i = 0; i < 7; i++) {
        const y = hy - 0.09 + i * 0.025;
        g.beginPath();
        g.moveTo(hx - 0.075, y);
        g.lineTo(hx + 0.075, y);
        g.stroke();
      }
    }
    if (v === 'mane') {
      g.fillStyle = '#ece8df';
      g.beginPath();
      g.ellipse(hx, hy - 0.02, 0.075, 0.07, 0, 0, TAU);
      g.fill();
      g.strokeStyle = '#ece8df';
      g.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const o = i / 13 - 0.5;
        g.lineWidth = 0.018;
        g.beginPath();
        g.moveTo(hx + o * 0.12, hy - 0.02);
        g.quadraticCurveTo(
          hx + o * 0.2 + wind * 0.02,
          hy + 0.2,
          hx + o * 0.18 + wind * 0.05 + Math.sin(time * 2 + i) * 0.01,
          -0.48,
        );
        g.stroke();
      }
    }
    if (v === 'tanuki') {
      g.fillStyle = '#4a3420';
      for (const sd of [-1, 1]) {
        g.beginPath();
        g.arc(hx + sd * 0.04, hy - 0.055, 0.02, 0, TAU);
        g.fill();
      }
    }
    if (v === 'mask' && !f.back) {
      g.fillStyle = C.metal;
      g.beginPath();
      g.ellipse(hx, hy + 0.024, 0.044, 0.035, 0, 0, Math.PI);
      g.fill();
      g.strokeStyle = C.robeL;
      g.lineWidth = 0.004;
      g.beginPath();
      g.moveTo(hx - 0.02, hy + 0.032);
      g.lineTo(hx + 0.02, hy + 0.032);
      g.stroke();
    }
    if (v === 'jingasa') {
      g.fillStyle = C.metal;
      g.beginPath();
      g.moveTo(hx - 0.15, hy - 0.02);
      g.lineTo(hx, hy - 0.085);
      g.lineTo(hx + 0.15, hy - 0.02);
      g.quadraticCurveTo(hx, hy - 0.004, hx - 0.15, hy - 0.02);
      g.fill();
      g.strokeStyle = C.robeL;
      g.lineWidth = 0.005;
      g.beginPath();
      g.moveTo(hx - 0.15, hy - 0.02);
      g.quadraticCurveTo(hx, hy - 0.004, hx + 0.15, hy - 0.02);
      g.stroke();
    }
    if (v === 'oni' || v === 'tengu') drawDemonMask(g, v, hx, hy, !!f.back);
    if (['kitsune', 'noh'].includes(v)) {
      const mx = hx + (f.back ? 0.045 : 0),
        my = hy - 0.004,
        pale = v === 'kitsune' || v === 'noh';
      g.fillStyle = pale ? '#e8e1d3' : '#8c2a1f';
      g.beginPath();
      g.ellipse(mx, my, f.back ? 0.02 : 0.042, 0.05, 0, 0, TAU);
      g.fill();
      if (v === 'kitsune') {
        g.beginPath();
        g.moveTo(mx - 0.014, my - 0.035);
        g.lineTo(mx - 0.01, my - 0.07);
        g.lineTo(mx + 0.002, my - 0.04);
        g.fill();
        g.beginPath();
        g.moveTo(mx + 0.004, my - 0.04);
        g.lineTo(mx + 0.014, my - 0.068);
        g.lineTo(mx + 0.016, my - 0.03);
        g.fill();
        g.strokeStyle = '#a3271d';
        g.lineWidth = 0.004;
        g.beginPath();
        g.moveTo(mx - 0.006, my - 0.01);
        g.lineTo(mx + 0.012, my - 0.016);
        g.stroke();
      } else {
        g.strokeStyle = '#1a1917';
        g.lineWidth = 0.004;
        g.beginPath();
        g.moveTo(mx - 0.004, my - 0.012);
        g.lineTo(mx + 0.012, my - 0.012);
        g.stroke();
      }
    }
  }
  function drawCrest(id: string, x: number, y: number, r: number) {
    g.save();
    g.translate(x, y);
    const col = 'rgba(224,217,202,.88)';
    g.fillStyle = col;
    g.strokeStyle = col;
    g.lineWidth = r * 0.12;
    g.lineCap = 'round';
    const ring = () => {
      g.beginPath();
      g.arc(0, 0, r, 0, TAU);
      g.stroke();
    };
    if (id === 'tomoe') {
      ring();
      for (let i = 0; i < 3; i++) {
        g.save();
        g.rotate((i * TAU) / 3);
        g.beginPath();
        g.arc(0, -r * 0.5, r * 0.26, 0, TAU);
        g.fill();
        g.lineWidth = r * 0.16;
        g.beginPath();
        g.arc(0, 0, r * 0.5, -Math.PI / 2, Math.PI * 0.05);
        g.stroke();
        g.restore();
      }
    } else if (id === 'kikyo') {
      for (let i = 0; i < 5; i++) {
        g.save();
        g.rotate((i * TAU) / 5);
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(-r * 0.5, -r * 0.5, -r * 0.22, -r * 0.98);
        g.lineTo(0, -r * 0.8);
        g.lineTo(r * 0.22, -r * 0.98);
        g.quadraticCurveTo(r * 0.5, -r * 0.5, 0, 0);
        g.fill();
        g.restore();
      }
      g.fillStyle = 'rgba(20,19,17,.8)';
      g.beginPath();
      g.arc(0, 0, r * 0.14, 0, TAU);
      g.fill();
    } else if (id === 'juji') {
      ring();
      g.lineWidth = r * 0.2;
      g.lineCap = 'butt';
      g.beginPath();
      g.moveTo(-r * 0.72, 0);
      g.lineTo(r * 0.72, 0);
      g.moveTo(0, -r * 0.72);
      g.lineTo(0, r * 0.72);
      g.stroke();
    } else if (id === 'aoi') {
      ring();
      for (let i = 0; i < 3; i++) {
        g.save();
        g.rotate((i * TAU) / 3);
        g.beginPath();
        g.moveTo(0, -r * 0.08);
        g.quadraticCurveTo(-r * 0.5, -r * 0.3, -r * 0.3, -r * 0.66);
        g.quadraticCurveTo(-r * 0.15, -r * 0.86, 0, -r * 0.7);
        g.quadraticCurveTo(r * 0.15, -r * 0.86, r * 0.3, -r * 0.66);
        g.quadraticCurveTo(r * 0.5, -r * 0.3, 0, -r * 0.08);
        g.fill();
        g.restore();
      }
    } else if (id === 'fuji') {
      ring();
      for (const sd of [-1, 1])
        for (let k = 0; k < 6; k++) {
          const t = k / 5;
          g.beginPath();
          g.arc(
            sd * r * (0.12 + 0.42 * Math.sin(t * Math.PI * 0.9)),
            -r * 0.62 + t * r * 1.15,
            r * (0.17 - 0.018 * k),
            0,
            TAU,
          );
          g.fill();
        }
    } else if (id === 'tsuru') {
      ring();
      g.lineWidth = r * 0.2;
      g.beginPath();
      g.arc(0, r * 0.05, r * 0.62, Math.PI * 0.95, Math.PI * 2.05);
      g.stroke();
      g.beginPath();
      g.arc(0, -r * 0.5, r * 0.16, 0, TAU);
      g.fill();
      g.lineWidth = r * 0.08;
      g.beginPath();
      g.moveTo(r * 0.1, -r * 0.5);
      g.lineTo(r * 0.4, -r * 0.4);
      g.stroke();
      g.beginPath();
      g.moveTo(0, -r * 0.35);
      g.lineTo(0, r * 0.35);
      g.stroke();
    } else if (id === 'rokumon') {
      for (let row = 0; row < 2; row++)
        for (let c = 0; c < 3; c++) {
          const cx = (c - 1) * r * 0.64,
            cy = (row - 0.5) * r * 0.68;
          g.fillStyle = col;
          g.beginPath();
          g.arc(cx, cy, r * 0.29, 0, TAU);
          g.fill();
          g.fillStyle = 'rgba(20,19,17,.85)';
          g.fillRect(cx - r * 0.08, cy - r * 0.08, r * 0.16, r * 0.16);
        }
    }
    g.restore();
  }
  function drawCrow(x: number, y: number, s: number) {
    const fl = petActive ? Math.sin(time * 30) : 0,
      bob = Math.sin(time * 2.3) * s * 0.06;
    g.save();
    g.translate(x, y + bob);
    g.fillStyle = '#0b0b0a';
    g.beginPath();
    g.ellipse(0, -s * 0.35, s * 0.45, s * 0.28, -0.25, 0, TAU);
    g.fill();
    g.beginPath();
    g.moveTo(-s * 0.35, -s * 0.25);
    g.lineTo(-s * 0.85, -s * 0.05);
    g.lineTo(-s * 0.3, -s * 0.4);
    g.fill();
    g.beginPath();
    g.arc(s * 0.38, -s * 0.62, s * 0.18, 0, TAU);
    g.fill();
    g.beginPath();
    g.moveTo(s * 0.52, -s * 0.66);
    g.lineTo(s * 0.8, -s * 0.6);
    g.lineTo(s * 0.52, -s * 0.55);
    g.fill();
    g.beginPath();
    g.moveTo(-s * 0.1, -s * 0.45);
    g.quadraticCurveTo(-s * 0.3, -s * (0.55 + fl * 0.9), -s * 0.62, -s * (0.35 + fl * 0.85));
    g.lineTo(s * 0.2, -s * 0.35);
    g.fill();
    g.strokeStyle = 'rgba(160,165,175,.35)';
    g.lineWidth = s * 0.05;
    g.beginPath();
    g.arc(s * 0.02, -s * 0.4, s * 0.3, Math.PI * 1.1, Math.PI * 1.7);
    g.stroke();
    g.fillStyle = '#6f6656';
    g.fillRect(-s * 0.05, -s * 0.12, s * 0.04, s * 0.13);
    g.fillRect(s * 0.08, -s * 0.12, s * 0.04, s * 0.13);
    g.restore();
  }
  function drawPetAt(type: string, x: number, y: number, sz: number) {
    g.save();
    g.translate(x, y);
    g.scale(sz, sz);
    const react = petActive;
    if (type === 'shiba') {
      const c = '#9a8a74',
        l = '#d8cfbf',
        ear = react ? -0.08 : 0;
      g.fillStyle = c;
      g.beginPath();
      g.ellipse(-0.1, -0.35, 0.32, 0.35, 0.2, 0, TAU);
      g.fill();
      g.beginPath();
      g.ellipse(0.2, -0.18, 0.1, 0.18, 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.arc(0.2, -0.78 + ear, 0.22, 0, TAU);
      g.fill();
      g.beginPath();
      g.moveTo(0.06, -0.9 + ear);
      g.lineTo(0.09, -1.12 + ear);
      g.lineTo(0.2, -0.96 + ear);
      g.fill();
      g.beginPath();
      g.moveTo(0.24, -0.97 + ear);
      g.lineTo(0.33, -1.14 + ear);
      g.lineTo(0.37, -0.9 + ear);
      g.fill();
      g.fillStyle = l;
      g.beginPath();
      g.ellipse(0.36, -0.72 + ear, 0.12, 0.08, 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.ellipse(0.12, -0.45, 0.12, 0.2, 0.2, 0, TAU);
      g.fill();
      g.fillStyle = '#1a1917';
      g.beginPath();
      g.arc(0.47, -0.74 + ear, 0.03, 0, TAU);
      g.fill();
      g.beginPath();
      g.arc(0.28, -0.82 + ear, 0.022, 0, TAU);
      g.fill();
      g.strokeStyle = c;
      g.lineWidth = 0.12;
      g.lineCap = 'round';
      g.beginPath();
      g.arc(
        -0.38,
        -0.62 + Math.sin(time * (react ? 14 : 3)) * 0.05,
        0.14,
        Math.PI * 0.2,
        Math.PI * 1.7,
      );
      g.stroke();
      if (react) {
        g.strokeStyle = 'rgba(236,230,218,.85)';
        g.lineWidth = 0.035;
        for (let i = 0; i < 3; i++) {
          g.beginPath();
          g.moveTo(0.6, -0.78 - i * 0.1);
          g.lineTo(0.78, -0.84 - i * 0.16);
          g.stroke();
        }
      }
    } else if (type === 'cat') {
      const c = '#171615';
      g.fillStyle = c;
      g.beginPath();
      g.ellipse(0, -0.32, 0.26, 0.34, 0, 0, TAU);
      g.fill();
      g.beginPath();
      g.arc(0.02, -0.76, 0.19, 0, TAU);
      g.fill();
      const e = react ? -0.05 : 0;
      g.beginPath();
      g.moveTo(-0.15, -0.84);
      g.lineTo(-0.13, -1.08 + e);
      g.lineTo(-0.02, -0.92);
      g.fill();
      g.beginPath();
      g.moveTo(0.06, -0.93);
      g.lineTo(0.16, -1.08 + e);
      g.lineTo(0.2, -0.84);
      g.fill();
      g.strokeStyle = c;
      g.lineWidth = 0.08;
      g.lineCap = 'round';
      const sw = Math.sin(time * 1.6) * 0.25;
      g.beginPath();
      g.moveTo(0.18, -0.08);
      g.quadraticCurveTo(0.5, -0.05, 0.45 + sw * 0.3, -0.45);
      g.stroke();
    }
    g.restore();
  }
  function drawFigure(f: Figure) {
    const C = f.pal || cols(f.fog),
      d = f.d,
      lx = f.lean || 0,
      wv = wind,
      t = time;
    g.save();
    g.translate(f.x, f.y);
    if (f.rot) g.rotate(f.rot);
    g.scale(f.h, f.h * (f.sy || 1));
    if (f.alpha != null && f.alpha < 1) g.globalAlpha *= f.alpha;
    const A0 = g.globalAlpha;
    if (f.robeAura) {
      // Small, stateless fabric halo behind the body. It follows figure opacity
      // and never borrows sword aura state or either preview's effect particles.
      const aura = f.robeAura;
      g.save();
      const halo = g.createRadialGradient(lx * 0.35, -0.44, 0.13, lx * 0.35, -0.44, 0.53);
      halo.addColorStop(0, `rgba(${aura.c},0)`);
      halo.addColorStop(0.58, `rgba(${aura.c},.12)`);
      halo.addColorStop(1, `rgba(${aura.c},0)`);
      g.fillStyle = halo;
      g.fillRect(-0.6 + lx * 0.35, -1.02, 1.2, 1.18);
      g.strokeStyle = `rgba(${aura.c},.35)`;
      g.fillStyle = `rgba(${aura.c},.25)`;
      g.lineWidth = 0.007;
      if (aura.mode === 'after' || aura.mode === 'dark') {
        g.beginPath();
        g.ellipse(lx * 0.35, -0.45, 0.38, 0.45, -0.12, Math.PI * 0.68, Math.PI * 1.88);
        g.stroke();
      } else {
        for (let i = 0; i < 4; i++) {
          const x = (i % 2 ? 1 : -1) * (0.29 + Math.floor(i / 2) * 0.035);
          const y = -0.58 + Math.floor(i / 2) * 0.32;
          g.beginPath();
          if (aura.mode === 'bolt') {
            g.moveTo(x - 0.014, y - 0.025);
            g.lineTo(x + 0.01, y);
            g.lineTo(x - 0.008, y + 0.015);
            g.lineTo(x + 0.013, y + 0.036);
            g.stroke();
          } else if (aura.mode === 'petal') {
            g.ellipse(x, y, 0.018, 0.007, i * 0.8, 0, TAU);
            g.fill();
          } else {
            g.arc(x, y, aura.mode === 'frost' ? 0.01 : 0.015, 0, TAU);
            g.fill();
          }
        }
      }
      g.restore();
    }
    if (!f.noShadow) {
      g.fillStyle = 'rgba(0,0,0,.25)';
      g.beginPath();
      g.ellipse(0.05, 0.004, 0.36, 0.035, 0, 0, TAU);
      g.fill();
    }
    if (!f.back) {
      g.strokeStyle = C.hilt;
      g.lineWidth = 0.02;
      g.lineCap = 'round';
      g.beginPath();
      g.moveTo(-0.08 + lx * 0.5, -0.52);
      g.lineTo(-0.36, -0.43);
      g.stroke();
    }
    const p = f.pose,
      gx = p.gx + lx,
      gy = p.gy,
      ca = Math.cos(p.ang),
      sa = Math.sin(p.ang);
    let h2: Point = [gx - ca * 0.075, gy - sa * 0.075];
    function drawHeldWeapons() {
      if (f.spear && !f.noSword) {
        drawSpear(gx, gy, p.ang, C);
      } else if (!f.noSword) {
        drawSword(
          gx,
          gy,
          p.ang,
          C,
          f.blade,
          env.artwork === 'ink' && !!f.back && f.bladeId === 'steel',
        );
      }
      if (f.twin) {
        drawSword(-0.19 + lx, -0.5, Math.PI - p.ang, C, {
          len: 0.38,
          d: C.steelD,
          m: C.steel,
          l: C.steelL,
          edge: 'rgba(255,253,246,.85)',
        });
      }
    }
    if (f.spear && !f.noSword) h2 = [gx - ca * 0.2, gy - sa * 0.2];
    if (f.twin) h2 = [-0.19 + lx, -0.5];
    // The player is viewed from behind, so the weapon passes behind the robe.
    if (f.back) drawHeldWeapons();
    const playerArt =
      env.artwork === 'ink' && f.back && supportsInkOutfit(f.robeId) ? env.inkPlayer : undefined;
    // Rear-view hands reach around the body; the torso occludes crossing forearms.
    const enemyArt = env.artwork === 'ink' && !f.back ? env.inkEnemy : undefined;
    const inkArms = playerArt?.drawPart(g, 'arms', f, env) === true;
    const inkBody = (playerArt || enemyArt)?.drawPart(g, 'body', f, env) === true;
    if (!inkBody) {
      drawSleeve(-1, lx, C, d, t, wv);
      drawSleeve(1, lx, C, d, t, wv);
      let gr = g.createLinearGradient(-0.3, 0, 0.3, 0);
      gr.addColorStop(0, C.robeD);
      gr.addColorStop(0.62, C.robe);
      gr.addColorStop(1, C.robeL);
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(-0.115 + lx * 0.5, -0.5);
      g.quadraticCurveTo(-0.2, -0.26, -0.3, 0);
      for (let i = 0; i <= 12; i++)
        g.lineTo(
          -0.3 + (0.6 * i) / 12 + (i & 1 ? 0.012 * wv : 0),
          -d.hem[i]! * 0.045 + Math.sin(t * 7 + i * 1.3 + d.seed) * 0.006 * wv,
        );
      g.quadraticCurveTo(0.2, -0.26, 0.115 + lx * 0.5, -0.5);
      g.closePath();
      g.fill();
      g.globalAlpha = A0 * 0.75;
      g.fillStyle = C.shadow;
      g.beginPath();
      g.moveTo(-0.05, 0.004);
      g.lineTo(0.004, -0.21);
      g.lineTo(0.055, 0.004);
      g.closePath();
      g.fill();
      g.globalAlpha = A0 * 0.3;
      g.strokeStyle = C.robeL;
      g.lineWidth = 0.007;
      for (const px of [-0.17, -0.08, 0.09, 0.18]) {
        g.beginPath();
        g.moveTo(px * 0.4 + lx * 0.5, -0.49);
        g.quadraticCurveTo(px * 0.85, -0.24, px * 1.55, -0.02);
        g.stroke();
      }
      g.globalAlpha = A0;
      gr = g.createLinearGradient(-0.18, 0, 0.18, 0);
      gr.addColorStop(0, C.robeD);
      gr.addColorStop(0.55, C.robe);
      gr.addColorStop(1, C.robeL);
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(-0.115 + lx * 0.5, -0.49);
      g.lineTo(-0.165 + lx, -0.765);
      g.quadraticCurveTo(-0.13 + lx, -0.815, -0.045 + lx, -0.83);
      g.lineTo(0.045 + lx, -0.83);
      g.quadraticCurveTo(0.13 + lx, -0.815, 0.165 + lx, -0.765);
      g.lineTo(0.115 + lx * 0.5, -0.49);
      g.closePath();
      g.fill();
      for (const s of d.spots) {
        g.globalAlpha = A0 * (s[3] ? 0.13 : 0.22);
        g.fillStyle = s[3] ? C.robeL : C.shadow;
        g.beginPath();
        g.arc(s[0] + (s[1] < -0.5 ? lx * 0.7 : lx * 0.3), s[1], s[2], 0, TAU);
        g.fill();
      }
      g.globalAlpha = A0;
    }
    const rf = f.rf || {};
    if (rf.tail && !inkBody) {
      g.save();
      g.translate(0.13, -0.44);
      g.rotate(0.35 + Math.sin(time * 2) * 0.1);
      g.fillStyle = '#6a4a2c';
      g.beginPath();
      g.ellipse(0.1, 0, 0.14, 0.07, 0, 0, TAU);
      g.fill();
      g.fillStyle = '#2a1c12';
      for (const x of [0.04, 0.1, 0.16]) g.fillRect(x, -0.065, 0.022, 0.13);
      g.restore();
    }
    if (rf.armor && !inkBody) {
      for (let i = 0; i < 5; i++) {
        const y = -0.76 + i * 0.052,
          ox = lx * (0.9 - i * 0.08);
        g.fillStyle = i % 2 ? '#3a1612' : '#4d1e18';
        g.fillRect(-0.15 + ox, y, 0.3, 0.046);
        g.strokeStyle = 'rgba(220,200,160,.5)';
        g.lineWidth = 0.004;
        for (let k = -2; k <= 2; k++) {
          g.beginPath();
          g.moveTo(k * 0.06 + ox, y);
          g.lineTo(k * 0.06 + ox, y + 0.046);
          g.stroke();
        }
      }
      for (const sd of [-1, 1]) {
        g.save();
        g.translate(sd * 0.19 + lx, -0.74);
        g.rotate(sd * 0.25);
        g.fillStyle = '#3a1612';
        g.fillRect(-0.06, 0, 0.12, 0.16);
        g.strokeStyle = 'rgba(220,200,160,.45)';
        g.lineWidth = 0.004;
        for (let k = 1; k < 4; k++) {
          g.beginPath();
          g.moveTo(-0.06, k * 0.04);
          g.lineTo(0.06, k * 0.04);
          g.stroke();
        }
        g.restore();
      }
    }
    if (rf.patches && !inkBody) {
      for (const q of [
        [-0.08, -0.7, 0.06, 0.05],
        [0.06, -0.6, 0.05, 0.06],
        [-0.14, -0.25, 0.07, 0.06],
        [0.1, -0.15, 0.06, 0.07],
      ] as const) {
        g.fillStyle = 'rgba(60,54,46,.9)';
        g.fillRect(q[0] + lx * 0.6, q[1], q[2], q[3]);
        g.strokeStyle = 'rgba(200,190,170,.5)';
        g.lineWidth = 0.003;
        g.setLineDash([0.008, 0.006]);
        g.strokeRect(q[0] + lx * 0.6, q[1], q[2], q[3]);
        g.setLineDash([]);
      }
    }
    if (rf.strawy && !inkBody) {
      g.strokeStyle = C.straw;
      g.lineWidth = 0.006;
      g.lineCap = 'round';
      for (let i = 0; i < 14; i++) {
        const sd = i % 2 ? 1 : -1,
          x = sd * (0.22 + (i % 5) * 0.012) + lx * 0.7,
          y = -0.56 + (i % 3) * 0.01;
        g.beginPath();
        g.moveTo(x, y);
        g.lineTo(x + sd * 0.03, y + 0.04 + (i % 4) * 0.01);
        g.stroke();
      }
      for (let i = 0; i < 12; i++) {
        const x = -0.28 + i * 0.05;
        g.beginPath();
        g.moveTo(x, -0.01);
        g.lineTo(x + 0.01, 0.03);
        g.stroke();
      }
    }
    if (f.cape && !inkBody) {
      g.fillStyle = C.straw;
      g.beginPath();
      g.moveTo(-0.2 + lx, -0.79);
      g.quadraticCurveTo(lx, -0.84, 0.2 + lx, -0.79);
      for (let i = 0; i <= 10; i++) {
        const x = 0.25 - (0.5 * i) / 10;
        g.lineTo(x + lx * 0.8, -0.52 + (i % 2 ? 0.03 : 0) + Math.sin(time * 6 + i) * 0.006 * wind);
      }
      g.closePath();
      g.fill();
      g.strokeStyle = 'rgba(0,0,0,.28)';
      g.lineWidth = 0.005;
      for (let i = 0; i < 9; i++) {
        const x = -0.2 + i * 0.05;
        g.beginPath();
        g.moveTo(x + lx, -0.78);
        g.lineTo(x * 1.25 + lx * 0.8, -0.53);
        g.stroke();
      }
    }
    if (!f.back && !inkBody) {
      g.fillStyle = C.inner;
      g.beginPath();
      g.moveTo(-0.04 + lx, -0.828);
      g.lineTo(lx * 0.85, -0.66);
      g.lineTo(0.04 + lx, -0.828);
      g.closePath();
      g.fill();
      g.strokeStyle = C.robeL;
      g.lineWidth = 0.012;
      g.beginPath();
      g.moveTo(-0.05 + lx, -0.83);
      g.lineTo(-0.002 + lx * 0.85, -0.655);
      g.lineTo(0.05 + lx, -0.83);
      g.stroke();
    } else if (!inkBody) {
      g.strokeStyle = C.robeD;
      g.lineWidth = 0.008;
      g.beginPath();
      g.moveTo(lx, -0.82);
      g.lineTo(lx * 0.5, -0.52);
      g.stroke();
    }

    if (!inkBody) {
      g.fillStyle = C.obi;
      g.beginPath();
      g.moveTo(-0.118 + lx * 0.52, -0.545);
      g.lineTo(0.118 + lx * 0.52, -0.545);
      g.lineTo(0.116 + lx * 0.5, -0.495);
      g.lineTo(-0.116 + lx * 0.5, -0.495);
      g.closePath();
      g.fill();
    }
    if (f.coat && !inkBody) drawJinbaori(g, !!f.back, lx, time, wind);
    if (f.back && f.crest && !f.cape) drawCrest(f.crest, lx * 0.75, -0.67, 0.06);
    if (f.charm) {
      const cx = 0.1 + lx * 0.5,
        cy = -0.49;
      g.strokeStyle = '#d9d3c4';
      g.lineWidth = 0.004;
      g.beginPath();
      g.moveTo(cx, cy - 0.02);
      g.lineTo(cx, cy);
      g.stroke();
      g.fillStyle = f.charm;
      g.fillRect(cx - 0.015, cy, 0.03, 0.045);
      g.fillStyle = 'rgba(255,255,255,.4)';
      g.fillRect(cx - 0.009, cy + 0.012, 0.018, 0.004);
      g.fillRect(cx - 0.009, cy + 0.022, 0.018, 0.004);
    }
    if (!(inkBody && (playerArt || enemyArt)?.drawPart(g, 'head', f, env))) drawHead(f, C, d, lx);
    const inkFrontArms = inkBody && enemyArt?.drawPart(g, 'arms', f, env) === true;
    if (!inkArms && !inkFrontArms) {
      const h1: Point = [gx, gy],
        sh: Point[] = [
          [-0.15 + lx, -0.765],
          [0.15 + lx, -0.765],
        ],
        hands = h1[0] < h2[0] ? [h1, h2] : [h2, h1];
      g.lineCap = 'round';
      g.lineJoin = 'round';
      for (let i = 0; i < 2; i++) {
        const s = sh[i]!,
          hd = hands[i]!,
          side = i ? 1 : -1,
          ex = (s[0] + hd[0]) / 2 + side * 0.05,
          ey = (s[1] + hd[1]) / 2 + 0.05;
        g.strokeStyle = i ? C.robe : C.robeD;
        g.lineWidth = 0.075;
        g.beginPath();
        g.moveTo(s[0], s[1]);
        g.lineTo(ex, ey);
        g.stroke();
        g.lineWidth = 0.048;
        g.beginPath();
        g.moveTo(ex, ey);
        g.lineTo(hd[0], hd[1]);
        g.stroke();
      }
      // Front-facing attackers hold their weapons in front of their sleeves and arms.
      if (!f.back) drawHeldWeapons();
      g.fillStyle = C.skin;
      for (const hd of hands) {
        g.beginPath();
        g.arc(hd[0], hd[1], 0.022, 0, TAU);
        g.fill();
      }
    }
    if (inkFrontArms) {
      drawHeldWeapons();
      enemyArt?.drawPart(g, 'hands', f, env);
    }
    if (f.glint != null && f.glint > 0) {
      const tp = tipOf(p, lx, f.spear ? 0.98 : f.blade ? f.blade.len : 0.52);
      drawGlint(tp[0], tp[1], f.glint);
    }
    if (f.pet === 'crow') drawCrow(0.16 + lx, -0.785, 0.1);
    if (!f.noShadow) {
      g.fillStyle = C.grass;
      for (const b of d.grass) {
        const sw = (wind * 0.5 + Math.sin(t * 2.4 + b[2]) * 0.3) * b[1] * 0.5;
        g.beginPath();
        g.moveTo(b[0] - 0.008, 0.02 + b[3]);
        g.quadraticCurveTo(b[0], -b[1] * 0.5, b[0] + sw, -b[1] + 0.02);
        g.quadraticCurveTo(b[0] + 0.004, -b[1] * 0.5, b[0] + 0.008, 0.02 + b[3]);
        g.fill();
      }
    }
    g.restore();
  }
  function drawGroundShadow(f: Pick<Figure, 'x' | 'y' | 'h' | 'alpha'>, opacity = 1) {
    if (opacity <= 0) return;
    g.save();
    g.globalAlpha *= opacity * (f.alpha ?? 1);
    g.translate(f.x, f.y);
    g.scale(f.h, f.h);
    g.fillStyle = 'rgba(0,0,0,.25)';
    g.beginPath();
    g.ellipse(0.05, 0.004, 0.36, 0.035, 0, 0, TAU);
    g.fill();
    g.restore();
  }
  function drawSplit(
    f: Figure,
    p: { x: number; y: number; h: number },
    ang: number,
    t: number,
    dur: number,
  ) {
    const cx = p.x,
      cy = p.y - p.h * 0.55,
      dx = Math.cos(ang),
      dy = Math.sin(ang),
      nx = -dy,
      ny = dx,
      Lg = Math.max(W, H) * 2;
    const fade = 1 - clamp((t - dur * 0.4) / (dur * 0.6));
    if (fade <= 0) return;
    // Ground contact belongs to the whole figure, not either moving fragment.
    // Drawing it inside each clipped half made shadows drift with falling bodies.
    if (!f.noShadow) {
      drawGroundShadow({ ...p, alpha: f.alpha }, fade);
    }
    for (const side of [1, -1]) {
      g.save();
      g.globalAlpha *= fade;
      const sep = p.h * (0.012 + 0.1 * easeOut(clamp(t / (dur * 0.6))));
      const drop = (p.h * 0.5 * t * t * (side === 1 ? 1 : 0.45)) / (dur * dur);
      g.translate(nx * sep * side + dx * sep * 0.5 * side, ny * sep * side + drop);
      g.beginPath();
      g.moveTo(cx - dx * Lg, cy - dy * Lg);
      g.lineTo(cx + dx * Lg, cy + dy * Lg);
      g.lineTo(cx + dx * Lg + nx * Lg * side, cy + dy * Lg + ny * Lg * side);
      g.lineTo(cx - dx * Lg + nx * Lg * side, cy - dy * Lg + ny * Lg * side);
      g.closePath();
      g.clip();
      drawFigure({ ...f, noShadow: true });
      g.restore();
    }
  }

  return { drawFigure, drawSplit, drawGroundShadow, drawPetAt, drawSword, drawGlint, tipOf };
}
